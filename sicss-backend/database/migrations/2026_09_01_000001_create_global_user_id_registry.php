<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_id_sequences', function (Blueprint $table) {
            $table->unsignedSmallInteger('year')->primary();
            $table->unsignedInteger('last_sequence')->default(0);
            $table->timestamps();
        });

        Schema::create('user_id_reservations', function (Blueprint $table) {
            $table->id();
            $table->string('user_code')->unique();
            $table->unsignedBigInteger('user_id')->nullable()->unique();
            $table->unsignedSmallInteger('year');
            $table->unsignedInteger('sequence');
            $table->timestamps();
            $table->unique(['year', 'sequence']);
        });

        $year = (int) now()->format('Y');
        $usedSequences = [];
        $users = DB::table('users')->orderBy('id')->get(['id', 'user_code']);

        foreach ($users as $user) {
            if (is_string($user->user_code) && preg_match('/^STU-(\d{4})-(\d{4})$/', $user->user_code, $matches)) {
                $codeYear = (int) $matches[1];
                $sequence = (int) $matches[2];
                $usedSequences[$codeYear][$sequence] = true;
                DB::table('user_id_reservations')->insert([
                    'user_code' => $user->user_code,
                    'user_id' => $user->id,
                    'year' => $codeYear,
                    'sequence' => $sequence,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                // Move legacy values out of the unique index before assigning
                // their permanent universal IDs below.
                DB::table('users')->where('id', $user->id)->update([
                    'user_code' => "MIGRATING-{$user->id}",
                ]);
            }
        }

        foreach ($users as $user) {
            if (is_string($user->user_code) && preg_match('/^STU-\d{4}-\d{4}$/', $user->user_code)) {
                continue;
            }

            $next = max(array_keys($usedSequences[$year] ?? [0])) + 1;
            while (isset($usedSequences[$year][$next])) {
                $next++;
            }

            $userCode = sprintf('STU-%d-%04d', $year, $next);
            $usedSequences[$year][$next] = true;

            DB::table('users')->where('id', $user->id)->update(['user_code' => $userCode]);
            DB::table('user_id_reservations')->insert([
                'user_code' => $userCode,
                'user_id' => $user->id,
                'year' => $year,
                'sequence' => $next,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        foreach ($usedSequences as $sequenceYear => $sequences) {
            DB::table('user_id_sequences')->insert([
                'year' => $sequenceYear,
                'last_sequence' => max(array_keys($sequences)),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_user_code_format_check CHECK (user_code ~ '^STU-[0-9]{4}-[0-9]{4}$')");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_code_format_check');
        }

        Schema::dropIfExists('user_id_reservations');
        Schema::dropIfExists('user_id_sequences');
    }
};
