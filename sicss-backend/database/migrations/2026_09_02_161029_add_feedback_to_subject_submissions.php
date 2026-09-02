<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('report_card_subject_submissions', function (Blueprint $table) {
            // Status tracks the submission lifecycle
            // submitted       = teacher submitted marks, awaiting sponsor review
            // revision_requested = sponsor has flagged this subject and asked teacher to revise
            // accepted        = sponsor has accepted the marks (used when compiling)
            $table->string('submission_status')->default('submitted')->after('submitted_at');

            // Sponsor's comment/feedback to the subject teacher
            $table->text('sponsor_feedback')->nullable()->after('submission_status');

            // When the feedback was sent
            $table->timestamp('feedback_sent_at')->nullable()->after('sponsor_feedback');
        });
    }

    public function down(): void
    {
        Schema::table('report_card_subject_submissions', function (Blueprint $table) {
            $table->dropColumn(['submission_status', 'sponsor_feedback', 'feedback_sent_at']);
        });
    }
};
