<?php
declare(strict_types=1);

/**
 * Zubák – HTTP endpoint pre spoločnú tabuľku minihier.
 *
 * GET  scores.php?game=bike&limit=10   → top výsledky
 * POST scores.php  {game, name, time, falls|score, date} → pridá výsledok
 * GET  scores.php?health=1             → kontrola hostingu (zápis do data/)
 */

require __DIR__ . '/scores-lib.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Max-Age: 86400');

function zubak_respond($payload, int $status = 200, array $extra = array()): void
{
    http_response_code($status);
    foreach ($extra as $header) {
        header($header);
    }
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    echo $json === false ? '{"ok":false,"error":"encode"}' : $json;
    exit;
}

$method = isset($_SERVER['REQUEST_METHOD']) ? strtoupper((string) $_SERVER['REQUEST_METHOD']) : 'GET';

if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    if (isset($_GET['health'])) {
        $health = zubak_health();
        zubak_respond($health, $health['ok'] ? 200 : 503);
    }

    if ($method === 'GET') {
        $game = isset($_GET['game']) ? (string) $_GET['game'] : '';
        if (!zubak_is_game($game)) {
            zubak_respond(array('ok' => false, 'error' => 'unknown-game'), 400);
        }
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 10;
        zubak_respond(array(
            'ok' => true,
            'v' => ZUBAK_STORE_VERSION,
            'game' => $game,
            'records' => zubak_top($game, $limit),
        ));
    }

    if ($method === 'POST') {
        $raw = @file_get_contents('php://input', false, null, 0, 4097);
        if ($raw === false || trim($raw) === '') {
            zubak_respond(array('ok' => false, 'error' => 'empty'), 400);
        }
        if (strlen($raw) > 4096) {
            zubak_respond(array('ok' => false, 'error' => 'too-large'), 413);
        }
        $payload = json_decode($raw, true);
        if (!is_array($payload)) {
            zubak_respond(array('ok' => false, 'error' => 'bad-json'), 400);
        }
        $game = isset($payload['game']) ? (string) $payload['game'] : '';
        if (!zubak_is_game($game)) {
            zubak_respond(array('ok' => false, 'error' => 'unknown-game'), 400);
        }
        $record = zubak_validate_record($game, $payload);
        if ($record === null) {
            zubak_respond(array('ok' => false, 'error' => 'invalid-record'), 400);
        }
        $ip = isset($_SERVER['REMOTE_ADDR']) ? (string) $_SERVER['REMOTE_ADDR'] : '';
        $result = zubak_add($game, $record, $ip);
        if (!empty($result['rate'])) {
            zubak_respond(array('ok' => false, 'error' => 'rate-limit'), 429, array('Retry-After: 600'));
        }
        if (empty($result['ok'])) {
            zubak_respond(array('ok' => false, 'error' => 'storage'), 500);
        }
        zubak_respond(array(
            'ok' => true,
            'v' => ZUBAK_STORE_VERSION,
            'game' => $game,
            'stored' => $result['stored'],
            'records' => $result['records'],
        ));
    }

    zubak_respond(array('ok' => false, 'error' => 'method'), 405, array('Allow: GET, POST, OPTIONS'));
} catch (Throwable $error) {
    error_log('zubak scores: ' . $error->getMessage());
    zubak_respond(array('ok' => false, 'error' => 'server'), 500);
}
