<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('cascade');
            $table->foreignId('teacher_id')->nullable()->constrained('teachers')->onDelete('set null');
            $table->string('term');
            $table->string('academic_year');
            $table->decimal('score', 5, 2);
            $table->string('grade');
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['student_id', 'subject_id', 'term', 'academic_year']);
            $table->index(['student_id', 'academic_year']);
            $table->index(['subject_id', 'academic_year']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grades');
    }
};
