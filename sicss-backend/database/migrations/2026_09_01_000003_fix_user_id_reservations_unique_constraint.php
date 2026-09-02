<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop the incorrect unique constraint on (year, sequence)
        // The unique constraint should be on user_code only (which already exists)
        // or on (year, prefix, sequence) if needed
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE user_id_reservations DROP CONSTRAINT IF EXISTS user_id_reservations_year_sequence_unique');
        } else {
            Schema::table('user_id_reservations', function (Blueprint $table) {
                $table->dropUnique(['year', 'sequence']);
            });
        }

        // Add prefix column if it doesn't exist
        if (!Schema::hasColumn('user_id_reservations', 'prefix')) {
            Schema::table('user_id_reservations', function (Blueprint $table) {
                $table->string('prefix')->after('user_code')->nullable();
            });

            // Backfill prefix from existing user_code values
            DB::statement("
                UPDATE user_id_reservations 
                SET prefix = SUBSTRING(user_code, 1, 3)
                WHERE prefix IS NULL
            ");

            // Make prefix NOT NULL after backfill
            Schema::table('user_id_reservations', function (Blueprint $table) {
                $table->string('prefix')->nullable(false)->change();
            });
        }

        // Add correct unique constraint on (year, prefix, sequence)
        Schema::table('user_id_reservations', function (Blueprint $table) {
            $table->unique(['year', 'prefix', 'sequence'], 'user_id_reservations_year_prefix_sequence_unique');
        });
    }

    public function down(): void
    {
        // Remove the correct constraint
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE user_id_reservations DROP CONSTRAINT IF EXISTS user_id_reservations_year_prefix_sequence_unique');
        } else {
            Schema::table('user_id_reservations', function (Blueprint $table) {
                $table->dropUnique(['year', 'prefix', 'sequence']);
            });
        }

        // Restore the incorrect constraint (for rollback)
        Schema::table('user_id_reservations', function (Blueprint $table) {
            $table->unique(['year', 'sequence'], 'user_id_reservations_year_sequence_unique');
        });

        // Optionally remove prefix column
        // Schema::table('user_id_reservations', function (Blueprint $table) {
        //     $table->dropColumn('prefix');
        // });
    }
};
