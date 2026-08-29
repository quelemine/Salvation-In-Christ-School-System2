<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $syncableTables = [
            'users',
            'students',
            'teachers',
            'classes',
            'subjects',
            'attendances',
            'grades',
            'assignments',
            'student_comments',
            'fees',
            'payments',
            'receipts',
        ];

        foreach ($syncableTables as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->uuid('uuid')->nullable()->after('id');
                $table->enum('sync_status', ['pending', 'synced', 'conflict'])->default('synced')->after('uuid');
                $table->timestamp('last_synced_at')->nullable()->after('sync_status');
                $table->integer('version')->default(1)->after('last_synced_at');
                $table->index('uuid');
                $table->index('sync_status');
                $table->index('last_synced_at');
            });

            // Generate UUIDs for existing records
            DB::statement("UPDATE {$table} SET uuid = gen_random_uuid() WHERE uuid IS NULL");
            
            // Make uuid NOT NULL and UNIQUE after filling existing records
            Schema::table($table, function (Blueprint $table) {
                $table->uuid('uuid')->nullable(false)->change();
                $table->unique('uuid');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $syncableTables = [
            'users',
            'students',
            'teachers',
            'classes',
            'subjects',
            'attendances',
            'grades',
            'assignments',
            'student_comments',
            'fees',
            'payments',
            'receipts',
        ];

        foreach ($syncableTables as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->dropColumn(['uuid', 'sync_status', 'last_synced_at', 'version']);
                $table->dropIndex(['uuid', 'sync_status', 'last_synced_at']);
            });
        }
    }
};
