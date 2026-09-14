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
        Schema::table('users', function (Blueprint $table) {
            $table->string('country_code', 10)->nullable()->after('phone');
            $table->enum('otp_delivery_method', ['email', 'sms', 'whatsapp'])->default('email')->after('country_code');
            $table->index('otp_delivery_method');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['otp_delivery_method']);
            $table->dropColumn(['country_code', 'otp_delivery_method']);
        });
    }
};
