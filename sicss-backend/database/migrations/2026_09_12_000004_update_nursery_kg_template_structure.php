<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Update the Nursery/KG template to use the new semester-separated structure
        DB::table('report_card_templates')
            ->where('slug', 'nursery-kg')
            ->update([
                'assessment_periods' => json_encode([
                    'sem1' => ['1st pd', '2nd pd', '3rd pd', 'Exam'],
                    'sem2' => ['4th pd', '5th pd', '6th pd', 'Exam']
                ]),
                'grading_scale' => json_encode([
                    'A' => 'Excellent',
                    'B' => 'Good',
                    'C' => 'Fair',
                    'D' => 'Needs Improvement',
                    'E' => 'Poor',
                ]),
            ]);
    }

    public function down(): void
    {
        // Revert to the old structure
        DB::table('report_card_templates')
            ->where('slug', 'nursery-kg')
            ->update([
                'assessment_periods' => json_encode(['1st Assessment', '2nd Assessment', '3rd Assessment', 'Exam']),
                'grading_scale' => json_encode([
                    'A' => 'Excellent',
                    'B' => 'Very Good',
                    'C' => 'Good',
                    'D' => 'Fair',
                    'E' => 'Needs Improvement',
                ]),
            ]);
    }
};
