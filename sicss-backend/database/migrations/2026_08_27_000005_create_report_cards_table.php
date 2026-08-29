<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('teacher_id')->nullable()->constrained('teachers')->nullOnDelete();
            $table->string('academic_year');
            $table->string('grade_level');
            $table->json('subject_marks')->nullable();
            $table->decimal('aggregate', 8, 2)->nullable();
            $table->decimal('average', 5, 2)->nullable();
            $table->unsignedInteger('rank')->nullable();
            $table->unsignedInteger('total_in_class')->nullable();
            $table->string('conduct')->nullable();
            $table->enum('promotion_status', ['promoted', 'conditional', 'repeat', 'not_enrolled'])->nullable();
            $table->text('conditional_subjects')->nullable();
            $table->string('promoted_to')->nullable();
            $table->string('class_sponsor')->nullable();
            $table->string('principal')->nullable();
            $table->string('closing_date')->nullable();
            $table->timestamps();
            $table->unique(['student_id', 'academic_year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_cards');
    }
};
