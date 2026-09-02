<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const PREFIXES = [
        'admin'                      => 'ADM',
        'teacher'                    => 'TCH',
        'subject-teacher'            => 'TCH',
        'class-sponsor'              => 'TCH',
        'finance-staff'              => 'FIN',
        'finance'                    => 'FIN',
        'student'                    => 'STU',
        'parent'                     => 'PAR',
        'principal'                  => 'PRI',
        'vice-principal-instruction' => 'VPI',
        'proprietor'                 => 'PRO',
        'proprietress'               => 'PRO',
    ];

    public function up(): void
    {
        $year = (int) now()->format('Y');

        // Drop the old STU-format check constraint (PostgreSQL only)
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_code_format_check');
        }

        // Recreate user_id_sequences as a (year, prefix) keyed table.
        // Drop the existing single-column-PK table and replace it.
        Schema::dropIfExists('user_id_sequences');
        Schema::create('user_id_sequences', function (Blueprint $table) {
            $table->unsignedSmallInteger('year');
            $table->string('prefix', 10)->default('USR');
            $table->unsignedBigInteger('last_sequence')->default(0);
            $table->timestamps();
            $table->primary(['year', 'prefix']);
        });

        // Backfill existing users with correct role-based prefixes
        $counterByPrefix = [];

        $users = DB::table('users')
            ->join('roles', 'users.role_id', '=', 'roles.id')
            ->orderBy('users.id')
            ->get(['users.id', 'users.user_code', 'roles.slug as role_slug']);

        foreach ($users as $user) {
            $prefix      = self::PREFIXES[strtolower($user->role_slug ?? '')] ?? 'USR';
            $currentCode = $user->user_code ?? '';

            // Already correct prefix — just track counter
            if (str_starts_with($currentCode, $prefix . '-')) {
                $parts = explode('-', $currentCode);
                if (count($parts) === 3) {
                    $seq = (int) $parts[2];
                    $counterByPrefix[$prefix] = max($counterByPrefix[$prefix] ?? 0, $seq);
                }
                continue;
            }

            // Assign new code with the right prefix
            $next    = ($counterByPrefix[$prefix] ?? 0) + 1;
            $newCode = sprintf('%s-%d-%04d', $prefix, $year, $next);
            $counterByPrefix[$prefix] = $next;

            // Bypass model events to avoid LogicException
            DB::table('users')->where('id', $user->id)->update(['user_code' => $newCode]);

            // Keep reservation table consistent
            if (!empty($currentCode)) {
                DB::table('user_id_reservations')
                    ->where('user_code', $currentCode)
                    ->update(['user_code' => $newCode]);
            }
        }

        // Write the per-prefix sequence counters
        foreach ($counterByPrefix as $prefix => $lastSeq) {
            DB::table('user_id_sequences')->insert([
                'year'          => $year,
                'prefix'        => $prefix,
                'last_sequence' => $lastSeq,
                'created_at'    => now(),
                'updated_at'    => now(),
            ]);
        }
    }

    public function down(): void
    {
        // Intentional no-op — IDs are permanent identifiers.
    }
};
