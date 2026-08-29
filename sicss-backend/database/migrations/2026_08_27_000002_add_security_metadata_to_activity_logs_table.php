<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->string('user_email')->nullable()->after('user_id');
            $table->string('device_type')->nullable()->after('ip_address');
            $table->string('browser')->nullable()->after('device_type');
            $table->string('platform')->nullable()->after('browser');
            $table->text('user_agent')->nullable()->after('platform');
        });
    }

    public function down(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropColumn(['user_email', 'device_type', 'browser', 'platform', 'user_agent']);
        });
    }
};
