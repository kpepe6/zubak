<?php
declare(strict_types=1);

/**
 * CLI testy pre scores-lib.php:  php tests/scores.test.php
 */

require __DIR__ . '/../scores-lib.php';

$passed = 0;
$failures = 0;

function check($value, string $message): void
{
    global $passed, $failures;
    if ($value) {
        $passed++;
        return;
    }
    $failures++;
    fwrite(STDERR, "FAIL: " . $message . "\n");
}

$dir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'zubak-scores-test-' . getmypid();
putenv('ZUBAK_DATA_DIR=' . $dir);
@mkdir($dir, 0777, true);
foreach (glob($dir . '/*') ?: array() as $file) {
    @unlink($file);
}

$bikeRecord = zubak_validate_record('bike', array('name' => 'NG', 'time' => 90.5, 'falls' => 1, 'date' => '2026-05-01T10:00:00Z'));
check($bikeRecord !== null && $bikeRecord['falls'] === 1, 'platný záznam bicykla');
check(zubak_validate_record('bike', array('name' => '   ', 'time' => 90, 'falls' => 0, 'date' => '2026-05-01')) === null, 'prázdne meno');
check(zubak_validate_record('bike', array('name' => str_repeat('a', 21), 'time' => 90, 'falls' => 0, 'date' => '2026-05-01')) === null, 'dlhé meno');
check(zubak_validate_record('bike', array('name' => 'NG', 'time' => 5, 'falls' => 0, 'date' => '2026-05-01')) === null, 'nepravdepodobný čas');
check(zubak_validate_record('bike', array('name' => 'NG', 'time' => 90, 'falls' => 1.5, 'date' => '2026-05-01')) === null, 'necelé pády');
check(zubak_validate_record('goulash', array('name' => 'NG', 'score' => 1001, 'time' => 60, 'date' => '2026-05-01')) === null, 'veľa bodov');
check(zubak_validate_record('goulash', array('name' => 'NG', 'score' => 500, 'time' => 60, 'date' => '2026-05-01'))['score'] === 500, 'platný guláš');
check(zubak_validate_record('neznamy', array('name' => 'NG')) === null, 'neznáma hra');
check(zubak_normalize_date('2026-05-01T10:00:00+02:00') === '2026-05-01T08:00:00.000Z', 'normalizácia dátumu');
check(zubak_normalize_date('nezmysel') === null, 'neplatný dátum');

$bike = array(
    array('name' => 'B', 'time' => 95, 'falls' => 0, 'date' => '2026-05-01T10:00:00.000Z'),
    array('name' => 'A', 'time' => 90, 'falls' => 0, 'date' => '2026-05-02T10:00:00.000Z'),
    array('name' => 'C', 'time' => 90, 'falls' => 0, 'date' => '2026-05-01T10:00:00.000Z'),
);
check(array_column(zubak_sort_records('bike', $bike), 'name') === array('C', 'A', 'B'), 'poradie bicykla');
check(count(zubak_limit_records('bike', $bike, 2)) === 2, 'limit záznamov');

$cooking = array(
    array('name' => 'X', 'score' => 500, 'time' => 50, 'date' => '2026-05-02T10:00:00.000Z'),
    array('name' => 'Y', 'score' => 500, 'time' => 50, 'date' => '2026-05-01T10:00:00.000Z'),
    array('name' => 'Z', 'score' => 900, 'time' => 50, 'date' => '2026-05-03T10:00:00.000Z'),
);
check(array_column(zubak_sort_records('goulash', $cooking), 'name') === array('Z', 'Y', 'X'), 'poradie guláša');

$first = zubak_validate_record('bike', array('name' => 'NG', 'time' => 90, 'falls' => 1, 'date' => '2026-05-01T10:00:00Z'));
$result = zubak_add('bike', $first, '');
check($result['ok'] === true && $result['stored'] === 1, 'prvý zápis');
$again = zubak_add('bike', $first, '');
check($again['ok'] === true && $again['stored'] === 1, 'idempotencia rovnakého záznamu');
$second = zubak_validate_record('bike', array('name' => 'Fifko', 'time' => 80, 'falls' => 0, 'date' => '2026-05-02T10:00:00Z'));
zubak_add('bike', $second, '');
$top = zubak_top('bike', 10);
check(count($top) === 2, 'dva záznamy v tabuľke');
check($top[0]['name'] === 'Fifko' && $top[1]['name'] === 'NG', 'poradie v tabuľke');
check(is_file(zubak_store_file()), 'dátový súbor vznikol');
$stored = json_decode((string) file_get_contents(zubak_store_file()), true);
check(is_array($stored) && isset($stored['bike']) && count($stored['bike']) === 2, 'formát súboru');

file_put_contents(zubak_store_file(), '{ to nie je json');
check(zubak_top('bike', 10) === array(), 'poškodený súbor sa ignoruje');
check(count(glob(zubak_data_dir() . '/scores.json.corrupt-*') ?: array()) === 1, 'poškodený súbor sa zálohuje');

for ($index = 0; $index < ZUBAK_RATE_LIMIT; $index++) {
    check(zubak_rate_limit_hit('1.2.3.4'), 'rate limit hit ' . $index);
}
check(!zubak_rate_limit_hit('1.2.3.4'), 'rate limit po prekročení');
check(zubak_rate_limit_hit('5.6.7.8'), 'iná IP prejde');

$health = zubak_health();
check($health['ok'] === true && $health['data'] === 'writable', 'health hlási zapisovateľný adresár');

foreach (glob($dir . '/*') ?: array() as $file) {
    @unlink($file);
}
@rmdir($dir);

echo 'PHP testy: ' . $passed . ' OK, ' . $failures . ' chýb' . PHP_EOL;
exit($failures === 0 ? 0 : 1);
