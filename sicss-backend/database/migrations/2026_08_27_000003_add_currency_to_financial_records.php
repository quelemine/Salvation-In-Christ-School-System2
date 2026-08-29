<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['fees', 'payments'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->string('currency', 3)->default('LRD')->after('amount');
            });
        }
        Schema::table('receipts', function (Blueprint $table) {
            $table->string('currency', 3)->default('LRD')->after('total_amount');
        });
    }

    public function down(): void
    {
        foreach (['fees', 'payments'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->dropColumn('currency');
            });
        }
        Schema::table('receipts', function (Blueprint $table) {
            $table->dropColumn('currency');
        });
    }
};
