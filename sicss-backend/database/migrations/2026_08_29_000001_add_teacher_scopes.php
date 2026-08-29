<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->foreignId('sponsor_teacher_id')->nullable()->unique()->after('division_id')
                ->constrained('teachers')->nullOnDelete();
        });

        Schema::create('teacher_subject_class', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('teachers')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['teacher_id', 'subject_id', 'class_id'], 'teacher_subject_class_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_subject_class');
        Schema::table('classes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('sponsor_teacher_id');
        });
    }
};
