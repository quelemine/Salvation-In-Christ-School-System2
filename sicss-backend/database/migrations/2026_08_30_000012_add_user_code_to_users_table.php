<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('user_code')->nullable()->unique();
        });

        $year = now()->format('Y');
        DB::table('users')->whereNull('user_code')->orderBy('id')->eachById(function (object $user) use ($year) {
            DB::table('users')->where('id', $user->id)->update([
                'user_code' => "USR-{$year}-".str_pad((string) $user->id, 4, '0', STR_PAD_LEFT),
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['user_code']);
            $table->dropColumn('user_code');
        });
    }
};
