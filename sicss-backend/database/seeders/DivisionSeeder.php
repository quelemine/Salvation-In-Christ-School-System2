<?php

namespace Database\Seeders;

use App\Models\Division;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DivisionSeeder extends Seeder
{
    public function run(): void
    {
        $divisions = [
            [
                'name' => 'Early Childhood Division',
                'slug' => 'early-childhood',
                'description' => 'ABC, Nursery 1, Nursery 2',
                'order' => 1,
                'is_active' => true,
            ],
            [
                'name' => 'Kindergarten Division',
                'slug' => 'kindergarten',
                'description' => 'K-1, K-2',
                'order' => 2,
                'is_active' => true,
            ],
            [
                'name' => 'Primary Division',
                'slug' => 'primary',
                'description' => 'Grade 1, Grade 2, Grade 3, Grade 4, Grade 5, Grade 6',
                'order' => 3,
                'is_active' => true,
            ],
            [
                'name' => 'Junior Secondary Division',
                'slug' => 'junior-secondary',
                'description' => 'Grade 7, Grade 8, Grade 9',
                'order' => 4,
                'is_active' => true,
            ],
        ];

        foreach ($divisions as $division) {
            Division::updateOrCreate(
                ['slug' => $division['slug']],
                $division
            );
        }
    }
}
