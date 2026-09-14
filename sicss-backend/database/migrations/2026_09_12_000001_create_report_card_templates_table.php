<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_card_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->enum('grade_level_type', ['nursery_kg', 'primary', 'junior_high', 'senior_high']);
            $table->json('assessment_periods')->nullable(); // e.g., ['1st Assessment', '2nd Assessment', 'Exam']
            $table->string('grading_method')->default('numeric'); // 'numeric' or 'letter'
            $table->json('grading_scale')->nullable(); // e.g., {'A': 'Excellent', 'B': 'Good', ...}
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_card_templates');
    }
};
