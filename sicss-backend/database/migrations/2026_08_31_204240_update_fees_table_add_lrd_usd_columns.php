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
        Schema::table('fees', function (Blueprint $table) {
            $table->decimal('amount_lrd', 10, 2)->nullable()->after('description');
            $table->decimal('amount_usd', 10, 2)->nullable()->after('amount_lrd');
        });

        // Migrate existing data
        \DB::statement('UPDATE fees SET amount_lrd = amount, amount_usd = amount / 200 WHERE amount_lrd IS NULL');

        // Drop old columns
        Schema::table('fees', function (Blueprint $table) {
            $table->dropColumn(['amount', 'currency']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fees', function (Blueprint $table) {
            $table->decimal('amount', 10, 2)->nullable()->after('description');
            $table->string('currency', 3)->default('LRD')->after('amount');
        });

        // Restore data from LRD
        \DB::statement('UPDATE fees SET amount = amount_lrd WHERE amount IS NULL');

        Schema::table('fees', function (Blueprint $table) {
            $table->dropColumn(['amount_lrd', 'amount_usd']);
        });
    }
};
