<?php

namespace Database\Seeders;

use App\Models\ReportCardTemplate;
use App\Models\LearningArea;
use Illuminate\Database\Seeder;

class ReportCardTemplateSeeder extends Seeder
{
    public function run(): void
    {
        // Create Nursery/KG template
        $nurseryKgTemplate = ReportCardTemplate::create([
            'name' => 'Nursery/Kindergarten',
            'slug' => 'nursery-kg',
            'grade_level_type' => 'nursery_kg',
            'assessment_periods' => [
                'sem1' => ['1st pd', '2nd pd', '3rd pd', 'Exam'],
                'sem2' => ['4th pd', '5th pd', '6th pd', 'Exam']
            ],
            'grading_method' => 'letter',
            'grading_scale' => [
                'A' => 'Excellent',
                'B' => 'Good',
                'C' => 'Fair',
                'D' => 'Needs Improvement',
                'E' => 'Poor',
            ],
            'is_active' => true,
        ]);

        // Create Nursery/KG learning areas
        $nurseryKgLearningAreas = [
            ['name' => 'Bible / Religious Education', 'code' => 'BIBLE', 'order' => 1],
            ['name' => 'English', 'code' => 'ENG', 'order' => 2],
            ['name' => 'Phonics', 'code' => 'PHON', 'order' => 3],
            ['name' => 'Reading Readiness', 'code' => 'READ', 'order' => 4],
            ['name' => 'Writing / Pre-Writing', 'code' => 'WRIT', 'order' => 5],
            ['name' => 'Mathematics / Number Recognition', 'code' => 'MATH', 'order' => 6],
            ['name' => 'Science / Environmental Awareness', 'code' => 'SCI', 'order' => 7],
            ['name' => 'Social Studies / Social Development', 'code' => 'SOC', 'order' => 8],
            ['name' => 'Health & Hygiene', 'code' => 'HLTH', 'order' => 9],
            ['name' => 'Physical Education', 'code' => 'PE', 'order' => 10],
            ['name' => 'Art & Drawing', 'code' => 'ART', 'order' => 11],
            ['name' => 'Identifying Colors', 'code' => 'COLR', 'order' => 12],
            ['name' => 'Identifying Objects', 'code' => 'OBJ', 'order' => 13],
            ['name' => 'Recitation', 'code' => 'REC', 'order' => 14],
            ['name' => 'Music', 'code' => 'MUS', 'order' => 15],
            ['name' => 'Handwriting', 'code' => 'HAND', 'order' => 16],
            ['name' => 'Fine Motor Skills', 'code' => 'FINE', 'order' => 17],
            ['name' => 'Gross Motor Skills', 'code' => 'GROSS', 'order' => 18],
            ['name' => 'Communication Skills', 'code' => 'COMM', 'order' => 19],
            ['name' => 'Personal & Social Development', 'code' => 'PSD', 'order' => 20],
        ];

        foreach ($nurseryKgLearningAreas as $area) {
            LearningArea::create([
                'name' => $area['name'],
                'code' => $area['code'],
                'grade_level_type' => 'nursery_kg',
                'order' => $area['order'],
                'is_active' => true,
            ]);
        }

        // Create Primary template (Grades 1-6)
        ReportCardTemplate::create([
            'name' => 'Primary (Grades 1-6)',
            'slug' => 'primary',
            'grade_level_type' => 'primary',
            'assessment_periods' => ['1st pd', '2nd pd', '3rd pd', 'Exam 1', '4th pd', '5th pd', '6th pd', 'Exam 2'],
            'grading_method' => 'numeric',
            'grading_scale' => [
                '90-100' => 'A',
                '80-89' => 'B',
                '70-79' => 'C',
                '60-69' => 'D',
                '0-59' => 'F',
            ],
            'is_active' => true,
        ]);

        // Create Junior High template (Grades 7-9)
        ReportCardTemplate::create([
            'name' => 'Junior High (Grades 7-9)',
            'slug' => 'junior-high',
            'grade_level_type' => 'junior_high',
            'assessment_periods' => ['1st pd', '2nd pd', '3rd pd', 'Exam 1', '4th pd', '5th pd', '6th pd', 'Exam 2'],
            'grading_method' => 'numeric',
            'grading_scale' => [
                '90-100' => 'A',
                '80-89' => 'B',
                '70-79' => 'C',
                '60-69' => 'D',
                '0-59' => 'F',
            ],
            'is_active' => true,
        ]);

        // Create Senior High template (Grades 10-12)
        ReportCardTemplate::create([
            'name' => 'Senior High (Grades 10-12)',
            'slug' => 'senior-high',
            'grade_level_type' => 'senior_high',
            'assessment_periods' => ['1st pd', '2nd pd', '3rd pd', 'Exam 1', '4th pd', '5th pd', '6th pd', 'Exam 2'],
            'grading_method' => 'numeric',
            'grading_scale' => [
                '90-100' => 'A',
                '80-89' => 'B',
                '70-79' => 'C',
                '60-69' => 'D',
                '0-59' => 'F',
            ],
            'is_active' => true,
        ]);
    }
}
