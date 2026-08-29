<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('payment_proof_path')->nullable()->after('notes');
            $table->string('payment_proof_url')->nullable()->after('payment_proof_path');
            $table->string('mobile_number')->nullable()->after('payment_proof_url');
            $table->string('transaction_id')->nullable()->after('mobile_number');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['payment_proof_path', 'payment_proof_url', 'mobile_number', 'transaction_id']);
        });
    }
};
