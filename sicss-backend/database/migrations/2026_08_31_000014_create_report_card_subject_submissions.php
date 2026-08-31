<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_card_subject_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_card_id')->constrained('report_cards')->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained('teachers')->cascadeOnDelete();
            $table->string('subject');
            $table->json('subject_marks');
            $table->timestamp('submitted_at')->useCurrent();
            $table->timestamps();
            
            $table->unique(['report_card_id', 'subject']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_card_subject_submissions');
    }
};
