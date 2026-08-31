<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $year = now()->format('Y');
        $nextByPrefix = [];

        DB::table('users')
            ->leftJoin('roles', 'roles.id', '=', 'users.role_id')
            ->orderBy('users.id')
            ->select(['users.id', 'roles.slug'])
            ->eachById(function (object $user) use (&$nextByPrefix, $year) {
                $prefix = match ($user->slug) {
                    'student' => 'STU',
                    'teacher' => 'TCH',
                    'class-teacher' => 'CTH',
                    'subject-teacher' => 'STH',
                    'parent' => 'PAR',
                    'finance', 'finance-staff' => 'FIN',
                    'vice-principal-instruction' => 'VPI',
                    'principal' => 'PRI',
                    'head-of-school' => 'HOS',
                    'admin' => 'ADM',
                    default => 'USR',
                };

                $next = ($nextByPrefix[$prefix] ?? 0) + 1;
                $nextByPrefix[$prefix] = $next;
                DB::table('users')->where('id', $user->id)->update([
                    'user_code' => "{$prefix}-{$year}-".str_pad((string) $next, 4, '0', STR_PAD_LEFT),
                ]);
            }, 1000, 'users.id', 'id');
    }

    public function down(): void
    {
        // User IDs are permanent identifiers and should not be reverted.
    }
};
