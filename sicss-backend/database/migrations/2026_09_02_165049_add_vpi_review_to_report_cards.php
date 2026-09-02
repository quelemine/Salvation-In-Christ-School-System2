<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('report_cards', function (Blueprint $table) {
            // VPI can request a review/edit from the class sponsor before approving
            // Status: null = not requested, 'pending_sponsor_reply' = waiting, 'sponsor_replied' = replied
            $table->string('vpi_review_status')->nullable()->after('rejection_reason');
            $table->text('vpi_feedback')->nullable()->after('vpi_review_status');
            $table->timestamp('vpi_feedback_sent_at')->nullable()->after('vpi_feedback');
        });
    }

    public function down(): void
    {
        Schema::table('report_cards', function (Blueprint $table) {
            $table->dropColumn(['vpi_review_status', 'vpi_feedback', 'vpi_feedback_sent_at']);
        });
    }
};
