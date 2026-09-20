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
                'name' => 'Kindergarten Division',
                'slug' => 'kindergarten',
                'description' => 'ABC, K1, K2, Nursery 1, Nursery 2',
                'order' => 1,
                'is_active' => true,
            ],
            [
                'name' => 'Elementary Division',
                'slug' => 'elementary',
                'description' => 'Grade 1, Grade 2, Grade 3, Grade 4, Grade 5, Grade 6',
                'order' => 2,
                'is_active' => true,
            ],
            [
                'name' => 'Junior High School',
                'slug' => 'junior-high',
                'description' => 'Grade 7, Grade 8, Grade 9',
                'order' => 3,
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
