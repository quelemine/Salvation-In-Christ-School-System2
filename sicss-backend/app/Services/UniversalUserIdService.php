<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserIdReservation;
use Illuminate\Support\Facades\DB;

class UniversalUserIdService
{
    /**
     * Role slug → ID prefix mapping.
     * Every role gets a distinct, meaningful prefix.
     */
    private const ROLE_PREFIXES = [
        'admin'                       => 'ADM',
        'teacher'                     => 'TCH',
        'subject-teacher'             => 'TCH',
        'class-sponsor'               => 'TCH',
        'finance-staff'               => 'FIN',
        'finance'                     => 'FIN',
        'student'                     => 'STU',
        'parent'                      => 'PAR',
        'principal'                   => 'PRI',
        'vice-principal-instruction'  => 'VPI',
        'proprietor'                  => 'PRO',
        'proprietress'                => 'PRO',
    ];

    /** Fallback prefix for any role not listed above */
    private const DEFAULT_PREFIX = 'USR';

    /**
     * Derive the ID prefix for a given role slug.
     */
    public function prefixForRole(?string $roleSlug): string
    {
        if ($roleSlug === null) {
            return self::DEFAULT_PREFIX;
        }
        return self::ROLE_PREFIXES[strtolower($roleSlug)] ?? self::DEFAULT_PREFIX;
    }

    /**
     * Reserves the next global user ID for the given role.
     * The prefix is derived from the role slug so that every role
     * gets an appropriate identifier format:
     *
     *   ADM-2026-0001  ← admin
     *   TCH-2026-0001  ← teacher / subject-teacher / class-sponsor
     *   STU-2026-0001  ← student
     *   FIN-2026-0001  ← finance staff
     *   PAR-2026-0001  ← parent
     *   PRI-2026-0001  ← principal
     *   VPI-2026-0001  ← vice principal for instruction
     *   PRO-2026-0001  ← proprietor / proprietress
     *   USR-2026-0001  ← any other role
     *
     * Reservations are never removed, so IDs cannot be reused after a
     * user is deleted or archived.
     */
    public function reserve(string $prefix = self::DEFAULT_PREFIX): string
    {
        return DB::transaction(function () use ($prefix): string {
            $year      = (int) now()->format('Y');
            $timestamp = now();
            $key       = "{$prefix}-{$year}";   // sequence key per prefix+year

            DB::table('user_id_sequences')->upsert(
                [[
                    'year'          => $year,
                    'last_sequence' => 0,
                    'prefix'        => $prefix,
                    'created_at'    => $timestamp,
                    'updated_at'    => $timestamp,
                ]],
                ['year', 'prefix'],          // unique on (year, prefix) if column exists
                ['updated_at']
            );

            // Prefer a (year, prefix) sequence row; fall back to year-only
            $sequence = DB::table('user_id_sequences')
                ->where('year', $year)
                ->where('prefix', $prefix)
                ->lockForUpdate()
                ->first();

            if (!$sequence) {
                // Legacy table without prefix column — fall back to global year sequence
                $sequence = DB::table('user_id_sequences')
                    ->where('year', $year)
                    ->lockForUpdate()
                    ->firstOrFail();
            }

            do {
                $next     = ((int) $sequence->last_sequence) + 1;
                $userCode = sprintf('%s-%d-%04d', $prefix, $year, $next);

                DB::table('user_id_sequences')
                    ->where('year', $year)
                    ->when(
                        DB::getSchemaBuilder()->hasColumn('user_id_sequences', 'prefix'),
                        fn ($q) => $q->where('prefix', $prefix)
                    )
                    ->update(['last_sequence' => $next, 'updated_at' => $timestamp]);

                $sequence->last_sequence = $next;
            } while (
                UserIdReservation::where('user_code', $userCode)->exists()
                || User::where('user_code', $userCode)->exists()
            );

            UserIdReservation::create([
                'user_code' => $userCode,
                'prefix'    => $prefix,
                'year'      => $year,
                'sequence'  => $next,
            ]);

            return $userCode;
        }, 5);
    }

    public function assign(User $user): void
    {
        UserIdReservation::where('user_code', $user->user_code)
            ->whereNull('user_id')
            ->update(['user_id' => $user->id, 'updated_at' => now()]);
    }
}
