<?php
define('LARAVEL_START', microtime(true));
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;

// Fix the two stale classes that had wrong sections from old divisions
// Grade 4 Blue → fix section to null (no section), move to primary
// Grade 7 Green → move to Junior Secondary with no section (already covered by Grade 7 A/B)
// But first check if they have any students/teacher refs
$staleIds = [1, 2]; // old class IDs

foreach ($staleIds as $id) {
    $studentCount = DB::table('students')->where('class_id', $id)->count();
    $teacherCount = DB::table('class_teacher')->where('class_id', $id)->count();
    $cls = DB::table('classes')->where('id', $id)->first();
    echo "Class id={$id}: {$cls->name} sec={$cls->section} | students={$studentCount} teachers={$teacherCount}" . PHP_EOL;
}

// If they have no students/teachers, delete them; otherwise just fix their sections
foreach ($staleIds as $id) {
    $studentCount = DB::table('students')->where('class_id', $id)->count();
    $cls = DB::table('classes')->where('id', $id)->first();
    if ($studentCount === 0) {
        // Move Grade 7 to junior secondary division
        if ($cls->name === 'Grade 7') {
            $juniorDiv = DB::table('divisions')->where('slug', 'junior-secondary')->value('id');
            DB::table('classes')->where('id', $id)->update([
                'division_id' => $juniorDiv,
                'section'     => null,
                'slug'        => 'grade-7-legacy',
                'is_active'   => false,  // hide it — proper Grade 7 A/B exist
            ]);
            echo "Grade 7 (id={$id}) moved to junior-secondary and deactivated" . PHP_EOL;
        }
        if ($cls->name === 'Grade 4') {
            DB::table('classes')->where('id', $id)->update([
                'section'  => null,
                'slug'     => 'grade-4-legacy',
                'is_active' => false,
            ]);
            echo "Grade 4 (id={$id}) deactivated" . PHP_EOL;
        }
    }
}
echo "Done." . PHP_EOL;
