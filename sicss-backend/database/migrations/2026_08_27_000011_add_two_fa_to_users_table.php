<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('two_fa_code')->nullable()->after('password');
            $table->timestamp('two_fa_expires_at')->nullable()->after('two_fa_code');
            $table->boolean('two_fa_enabled')->default(true)->after('two_fa_expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['two_fa_code', 'two_fa_expires_at', 'two_fa_enabled']);
        });
    }
};
