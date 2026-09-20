<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('report_cards', function (Blueprint $table) {
            // Add principal approval fields
            $table->foreignId('principal_approved_by')->nullable()->constrained('users')->nullOnDelete()->after('vpi_approved_at');
            $table->timestamp('principal_approved_at')->nullable()->after('principal_approved_by');
        });

        // Update approval_status enum using raw SQL for PostgreSQL
        DB::statement("ALTER TABLE report_cards ALTER COLUMN approval_status TYPE VARCHAR(255)");
        DB::statement("ALTER TABLE report_cards ADD CONSTRAINT check_approval_status CHECK (approval_status IN ('draft', 'pending_sponsor', 'pending_vpi', 'pending_principal', 'approved', 'rejected'))");
        DB::statement("ALTER TABLE report_cards ALTER COLUMN approval_status SET DEFAULT 'draft'");
        DB::statement("ALTER TABLE report_cards ALTER COLUMN approval_status SET NOT NULL");
    }

    public function down(): void
    {
        // Drop principal approval fields
        Schema::table('report_cards', function (Blueprint $table) {
            $table->dropColumn(['principal_approved_by', 'principal_approved_at']);
        });

        // Revert approval_status enum using raw SQL for PostgreSQL
        DB::statement("ALTER TABLE report_cards DROP CONSTRAINT IF EXISTS check_approval_status");
        DB::statement("ALTER TABLE report_cards ADD CONSTRAINT check_approval_status CHECK (approval_status IN ('draft', 'pending_sponsor', 'pending_vpi', 'approved', 'rejected'))");
    }
};
