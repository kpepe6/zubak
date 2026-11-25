<?php
declare(strict_types=1);

/**
 * Zubák – spoločná tabuľka minihier.
 *
 * Čistá logika bez HTTP: validácia, zámok, atomický zápis a poradie.
 * Voliteľne sa dá adresár s dátami prepísať premennou prostredia ZUBAK_DATA_DIR
 * (používajú to testy, na hostingu netreba nič nastavovať).
 */

const ZUBAK_STORE_VERSION = 1;
const ZUBAK_MAX_STORED = 100;   // koľko záznamov sa drží na jednu hru
const ZUBAK_RATE_LIMIT = 30;    // max. odoslaní na IP za okno
const ZUBAK_RATE_WINDOW = 3600; // okno v sekundách

function zubak_games(): array
{
    return array('bike' => true, 'goulash' => true);
}

function zubak_is_game(string $game): bool
{
    return isset(zubak_games()[$game]);
}

function zubak_data_dir(): string
{
    $custom = getenv('ZUBAK_DATA_DIR');
    if ($custom !== false && $custom !== '') {
        return rtrim($custom, '/\\');
    }
    return __DIR__ . '/data';
}

function zubak_store_file(): string
{
    return zubak_data_dir() . '/scores.json';
}

function zubak_lock_file(): string
{
    return zubak_data_dir() . '/scores.lock';
}

function zubak_limits_file(): string
{
    return zubak_data_dir() . '/limits.json';
}

function zubak_empty_store(): array
{
    return array('v' => ZUBAK_STORE_VERSION, 'updated' => null, 'bike' => array(), 'goulash' => array());
}

function zubak_ensure_data_dir(): bool
{
    $dir = zubak_data_dir();
    if (is_dir($dir)) {
        return true;
    }
    return @mkdir($dir, 0775, true) || is_dir($dir);
}

function zubak_utf8_length(string $value): int
{
    $count = preg_match_all('/./us', $value, $matches);
    return $count === false ? strlen($value) : $count;
}

function zubak_normalize_date($value): ?string
{
    if (!is_string($value) || trim($value) === '') {
        return null;
    }
    try {
        $date = new DateTimeImmutable($value);
    } catch (Exception $error) {
        return null;
    }
    return $date->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d\TH:i:s.v\Z');
}

function zubak_validate_record(string $game, $value): ?array
{
    if (!zubak_is_game($game) || !is_array($value)) {
        return null;
    }
    $name = isset($value['name']) && is_string($value['name']) ? trim($value['name']) : '';
    if ($name === '' || zubak_utf8_length($name) > 20) {
        return null;
    }
    if (preg_match('/[\x00-\x1F\x7F]/u', $name)) {
        return null;
    }
    $date = zubak_normalize_date(isset($value['date']) ? $value['date'] : null);
    if ($date === null) {
        return null;
    }
    if ($game === 'bike') {
        $time = isset($value['time']) && is_numeric($value['time']) ? (float) $value['time'] : null;
        $falls = isset($value['falls']) && is_numeric($value['falls']) ? (float) $value['falls'] : null;
        if ($time === null || $time < 20 || $time > 86400) {
            return null;
        }
        if ($falls === null || $falls < 0 || $falls > 100000 || $falls != floor($falls)) {
            return null;
        }
        return array('name' => $name, 'time' => $time, 'falls' => (int) $falls, 'date' => $date);
    }
    $score = isset($value['score']) && is_numeric($value['score']) ? (float) $value['score'] : null;
    $time = isset($value['time']) && is_numeric($value['time']) ? (float) $value['time'] : null;
    if ($score === null || $score < 0 || $score > 1000 || $score != floor($score)) {
        return null;
    }
    if ($time === null || $time <= 0 || $time > 120) {
        return null;
    }
    return array('name' => $name, 'score' => (int) $score, 'time' => $time, 'date' => $date);
}

function zubak_sort_records(string $game, array $records): array
{
    usort($records, function (array $first, array $second) use ($game) {
        if ($game === 'goulash') {
            if ($first['score'] !== $second['score']) {
                return $second['score'] <=> $first['score'];
            }
        } elseif ($first['time'] !== $second['time']) {
            return $first['time'] <=> $second['time'];
        }
        return strcmp($first['date'], $second['date']);
    });
    return $records;
}

function zubak_limit_records(string $game, array $records, int $limit): array
{
    return array_slice(zubak_sort_records($game, $records), 0, max(1, $limit));
}

function zubak_merge_record(string $game, array $records, array $record, int $limit): array
{
    $key = $record['name'] . "\0" . $record['date'];
    $merged = array();
    foreach ($records as $existing) {
        if ($existing['name'] . "\0" . $existing['date'] === $key) {
            continue;
        }
        $merged[] = $existing;
    }
    $merged[] = $record;
    return zubak_limit_records($game, $merged, $limit);
}

function zubak_read_store(): array
{
    $store = zubak_empty_store();
    $file = zubak_store_file();
    if (!is_file($file)) {
        return $store;
    }
    $raw = @file_get_contents($file);
    if ($raw === false || trim($raw) === '') {
        return $store;
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        @rename($file, $file . '.corrupt-' . gmdate('Ymd-His'));
        return $store;
    }
    if (isset($decoded['updated']) && is_string($decoded['updated'])) {
        $store['updated'] = $decoded['updated'];
    }
    foreach (array_keys(zubak_games()) as $game) {
        $store[$game] = array();
        if (!isset($decoded[$game]) || !is_array($decoded[$game])) {
            continue;
        }
        foreach ($decoded[$game] as $value) {
            $record = zubak_validate_record($game, $value);
            if ($record !== null) {
                $store[$game][] = $record;
            }
        }
        $store[$game] = zubak_limit_records($game, $store[$game], ZUBAK_MAX_STORED);
    }
    return $store;
}

function zubak_write_store(array $store): bool
{
    if (!zubak_ensure_data_dir()) {
        return false;
    }
    $store['v'] = ZUBAK_STORE_VERSION;
    $store['updated'] = gmdate('Y-m-d\TH:i:s\Z');
    foreach (array_keys(zubak_games()) as $game) {
        if (!isset($store[$game]) || !is_array($store[$game])) {
            $store[$game] = array();
        }
    }
    $json = json_encode($store, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if ($json === false) {
        return false;
    }
    $target = zubak_store_file();
    $temporary = $target . '.tmp';
    if (@file_put_contents($temporary, $json, LOCK_EX) === false) {
        return false;
    }
    if (!@rename($temporary, $target)) {
        @unlink($temporary);
        return false;
    }
    return true;
}

/**
 * Spustí callback pod exkluzívnym zámkom. Keď sa zámok nedá otvoriť,
 * callback zbehne aj tak – radšej zápis bez zámku než žiadny.
 */
function zubak_with_lock(callable $callback)
{
    zubak_ensure_data_dir();
    $handle = @fopen(zubak_lock_file(), 'c');
    if ($handle === false) {
        return $callback();
    }
    $locked = @flock($handle, LOCK_EX);
    try {
        return $callback();
    } finally {
        if ($locked) {
            @flock($handle, LOCK_UN);
        }
        @fclose($handle);
    }
}

function zubak_rate_limit_hit(string $ip): bool
{
    $now = time();
    $key = substr(sha1($ip . '|zubak-scores'), 0, 16);
    $file = zubak_limits_file();
    $data = array();
    if (is_file($file)) {
        $raw = @file_get_contents($file);
        $decoded = $raw === false ? null : json_decode($raw, true);
        if (is_array($decoded)) {
            $data = $decoded;
        }
    }
    $fresh = array();
    foreach ($data as $storedKey => $hits) {
        if (!is_array($hits)) {
            continue;
        }
        $kept = array();
        foreach ($hits as $stamp) {
            if (is_int($stamp) && $stamp > $now - ZUBAK_RATE_WINDOW) {
                $kept[] = $stamp;
            }
        }
        if ($kept) {
            $fresh[$storedKey] = $kept;
        }
    }
    $mine = isset($fresh[$key]) ? $fresh[$key] : array();
    if (count($mine) >= ZUBAK_RATE_LIMIT) {
        $fresh[$key] = $mine;
        @file_put_contents($file, json_encode($fresh), LOCK_EX);
        return false;
    }
    $mine[] = $now;
    $fresh[$key] = $mine;
    @file_put_contents($file, json_encode($fresh), LOCK_EX);
    return true;
}

/**
 * Pridá záznam pod zámkom. Vracia ok, počet uložených a top 10 pre odpoveď.
 */
function zubak_add(string $game, array $record, string $ip = ''): array
{
    return zubak_with_lock(function () use ($game, $record, $ip) {
        if ($ip !== '' && !zubak_rate_limit_hit($ip)) {
            return array('ok' => false, 'rate' => true, 'stored' => 0, 'records' => array());
        }
        $store = zubak_read_store();
        $store[$game] = zubak_merge_record($game, $store[$game], $record, ZUBAK_MAX_STORED);
        $ok = zubak_write_store($store);
        return array(
            'ok' => $ok,
            'rate' => false,
            'stored' => count($store[$game]),
            'records' => array_slice($store[$game], 0, 10),
        );
    });
}

function zubak_top(string $game, int $limit): array
{
    $store = zubak_read_store();
    $records = isset($store[$game]) && is_array($store[$game]) ? $store[$game] : array();
    return array_slice(zubak_sort_records($game, $records), 0, max(1, min(50, $limit)));
}

function zubak_health(): array
{
    $dir = zubak_data_dir();
    zubak_ensure_data_dir();
    $probe = $dir . '/.write-test';
    $writable = @file_put_contents($probe, 'ok') !== false;
    if ($writable) {
        @unlink($probe);
    }
    $store = zubak_read_store();
    return array(
        'ok' => $writable,
        'php' => PHP_VERSION,
        'data' => $writable ? 'writable' : 'not-writable',
        'file' => is_file(zubak_store_file()) ? 'present' : 'missing',
        'records' => array(
            'bike' => count($store['bike']),
            'goulash' => count($store['goulash']),
        ),
        'limits' => array(
            'stored' => ZUBAK_MAX_STORED,
            'rate' => ZUBAK_RATE_LIMIT,
            'window' => ZUBAK_RATE_WINDOW,
        ),
    );
}
