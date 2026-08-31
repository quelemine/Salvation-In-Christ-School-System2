<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('report_cards', function (Blueprint $table) {
            $table->enum('approval_status', ['draft', 'pending_sponsor', 'pending_vpi', 'approved', 'rejected'])->default('draft')->after('closing_date');
            $table->foreignId('sponsor_approved_by')->nullable()->constrained('users')->nullOnDelete()->after('approval_status');
            $table->timestamp('sponsor_approved_at')->nullable()->after('sponsor_approved_by');
            $table->foreignId('vpi_approved_by')->nullable()->constrained('users')->nullOnDelete()->after('sponsor_approved_at');
            $table->timestamp('vpi_approved_at')->nullable()->after('vpi_approved_by');
            $table->text('rejection_reason')->nullable()->after('vpi_approved_at');
        });
    }

    public function down(): void
    {
        Schema::table('report_cards', function (Blueprint $table) {
            $table->dropColumn([
                'approval_status',
                'sponsor_approved_by',
                'sponsor_approved_at',
                'vpi_approved_by',
                'vpi_approved_at',
                'rejection_reason'
            ]);
        });
    }
};
