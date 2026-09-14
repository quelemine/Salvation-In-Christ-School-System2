<?php
define('LARAVEL_START', microtime(true));
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;

$divs = DB::select('SELECT id, name, "order" FROM divisions ORDER BY "order" ASC');
foreach ($divs as $d) {
    echo PHP_EOL . "[{$d->order}] {$d->name} (id={$d->id})" . PHP_EOL;
    $cls = DB::select('SELECT id, name, section, "order" FROM classes WHERE division_id=? ORDER BY "order", name', [$d->id]);
    foreach ($cls as $c) {
        $sec = $c->section ? " — {$c->section}" : '';
        echo "    {$c->name}{$sec}  (id={$c->id})" . PHP_EOL;
    }
}
echo PHP_EOL . "Total classes: " . DB::table('classes')->count() . PHP_EOL;
