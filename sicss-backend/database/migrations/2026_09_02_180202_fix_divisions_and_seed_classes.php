<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Replace any stale divisions with the correct three-division structure and
 * seed all classes under each division. Idempotent — safe to run multiple times.
 *
 * Structure:
 *   Kindergarten Division → ABC, K1, K2
 *   Elementary Division   → Grade 1 – Grade 6  (sections A & B)
 *   Junior High School     → Grade 7 – Grade 9  (sections A & B)
 */
return new class extends Migration
{
    // The three authoritative divisions
    private array $divisions = [
        ['slug' => 'kindergarten', 'name' => 'Kindergarten Division', 'description' => 'ABC, K1, K2',                                           'order' => 1],
        ['slug' => 'elementary',   'name' => 'Elementary Division',   'description' => 'Grade 1, Grade 2, Grade 3, Grade 4, Grade 5, Grade 6','order' => 2],
        ['slug' => 'junior-high',  'name' => 'Junior High School',    'description' => 'Grade 7, Grade 8, Grade 9',                          'order' => 3],
    ];

    // Classes per division slug → [name, section|null, order]
    private array $classes = [
        'kindergarten' => [
            ['ABC', null, 1],
            ['K1',  null, 2],
            ['K2',  null, 3],
        ],
        'elementary' => [
            ['Grade 1', 'A', 1], ['Grade 1', 'B', 2],
            ['Grade 2', 'A', 3], ['Grade 2', 'B', 4],
            ['Grade 3', 'A', 5], ['Grade 3', 'B', 6],
            ['Grade 4', 'A', 7], ['Grade 4', 'B', 8],
            ['Grade 5', 'A', 9], ['Grade 5', 'B', 10],
            ['Grade 6', 'A', 11], ['Grade 6', 'B', 12],
        ],
        'junior-high' => [
            ['Grade 7', 'A', 1], ['Grade 7', 'B', 2],
            ['Grade 8', 'A', 3], ['Grade 8', 'B', 4],
            ['Grade 9', 'A', 5], ['Grade 9', 'B', 6],
        ],
    ];

    public function up(): void
    {
        // ── 1. Upsert the three correct divisions ──────────────────────────
        $divisionIds = [];
        foreach ($this->divisions as $div) {
            $existing = DB::table('divisions')->where('slug', $div['slug'])->first();
            if ($existing) {
                DB::table('divisions')->where('slug', $div['slug'])->update([
                    'name'        => $div['name'],
                    'description' => $div['description'],
                    'order'       => $div['order'],
                    'is_active'   => true,
                    'updated_at'  => now(),
                ]);
                $divisionIds[$div['slug']] = $existing->id;
            } else {
                $id = DB::table('divisions')->insertGetId([
                    'name'        => $div['name'],
                    'slug'        => $div['slug'],
                    'description' => $div['description'],
                    'order'       => $div['order'],
                    'is_active'   => true,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);
                $divisionIds[$div['slug']] = $id;
            }
        }

        // ── 2. Remove stale divisions (any not in our slug list) ──────────
        $validSlugs = array_column($this->divisions, 'slug');
        // Reassign classes that belong to stale divisions to the closest match
        $stale = DB::table('divisions')->whereNotIn('slug', $validSlugs)->get();
        foreach ($stale as $staleDivision) {
            // Move its classes to elementary division as fallback
            DB::table('classes')
                ->where('division_id', $staleDivision->id)
                ->update(['division_id' => $divisionIds['elementary']]);
            DB::table('divisions')->where('id', $staleDivision->id)->delete();
        }

        // ── 3. Upsert all classes ─────────────────────────────────────────
        foreach ($this->classes as $divSlug => $classList) {
            $divId = $divisionIds[$divSlug];
            foreach ($classList as [$name, $section, $order]) {
                $slug = strtolower(str_replace(' ', '-', $name))
                      . ($section ? '-' . strtolower($section) : '');

                $exists = DB::table('classes')
                    ->where('division_id', $divId)
                    ->where('name', $name)
                    ->where('section', $section)
                    ->first();

                if ($exists) {
                    DB::table('classes')->where('id', $exists->id)->update([
                        'division_id' => $divId,
                        'order'       => $order,
                        'is_active'   => true,
                        'updated_at'  => now(),
                    ]);
                } else {
                    // Make slug unique
                    $baseSlug = $slug;
                    $i = 1;
                    while (DB::table('classes')->where('slug', $slug)->exists()) {
                        $slug = $baseSlug . '-' . $i++;
                    }
                    DB::table('classes')->insert([
                        'uuid'        => \Illuminate\Support\Str::uuid()->toString(),
                        'division_id' => $divId,
                        'name'        => $name,
                        'slug'        => $slug,
                        'section'     => $section,
                        'capacity'    => 30,
                        'order'       => $order,
                        'is_active'   => true,
                        'created_at'  => now(),
                        'updated_at'  => now(),
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        // Nothing destructive on rollback — leave data as-is
    }
};
