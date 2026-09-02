<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Definitive migration:
 *   1. Insert proprietor and proprietress roles (idempotent).
 *   2. Re-assign any users currently on head-of-school → proprietor.
 *   3. Re-code their user_code from HOS- prefix → PRO- prefix.
 *   4. Deactivate (do not hard-delete) the head-of-school role so
 *      any foreign-key constraints are not violated.
 */
return new class extends Migration
{
    public function up(): void
    {
        $now  = now();
        $year = (int) $now->format('Y');

        // ── 1. Ensure proprietor role exists ─────────────────────────────────
        $proprietorId = DB::table('roles')
            ->where('slug', 'proprietor')
            ->value('id');

        if (!$proprietorId) {
            $proprietorId = DB::table('roles')->insertGetId([
                'name'       => 'PROPRIETOR',
                'slug'       => 'proprietor',
                'is_active'  => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        } else {
            DB::table('roles')->where('id', $proprietorId)->update([
                'name'      => 'PROPRIETOR',
                'is_active' => true,
                'updated_at' => $now,
            ]);
        }

        // ── 2. Ensure proprietress role exists ───────────────────────────────
        $proprietressId = DB::table('roles')
            ->where('slug', 'proprietress')
            ->value('id');

        if (!$proprietressId) {
            $proprietressId = DB::table('roles')->insertGetId([
                'name'       => 'PROPRIETRESS',
                'slug'       => 'proprietress',
                'is_active'  => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        } else {
            DB::table('roles')->where('id', $proprietressId)->update([
                'name'      => 'PROPRIETRESS',
                'is_active' => true,
                'updated_at' => $now,
            ]);
        }

        // ── 3. Re-assign head-of-school users → proprietor ───────────────────
        $hosRole = DB::table('roles')->where('slug', 'head-of-school')->first();

        if ($hosRole) {
            $hosUsers = DB::table('users')
                ->where('role_id', $hosRole->id)
                ->get(['id', 'user_code']);

            // Track next PRO sequence
            $lastPro = DB::table('users')
                ->where('user_code', 'like', "PRO-{$year}-%")
                ->orderByRaw("CAST(SPLIT_PART(user_code, '-', 3) AS INTEGER) DESC")
                ->value('user_code');

            $proSeq = $lastPro
                ? (int) explode('-', $lastPro)[2]
                : 0;

            foreach ($hosUsers as $u) {
                $proSeq++;
                $newCode = sprintf('PRO-%d-%04d', $year, $proSeq);

                DB::table('users')->where('id', $u->id)->update([
                    'role_id'    => $proprietorId,
                    'user_code'  => $newCode,
                    'updated_at' => $now,
                ]);

                // Update reservations table if it exists
                if (DB::getSchemaBuilder()->hasTable('user_id_reservations')) {
                    DB::table('user_id_reservations')
                        ->where('user_code', $u->user_code)
                        ->update(['user_code' => $newCode, 'updated_at' => $now]);
                }
            }

            // ── 4. Deactivate head-of-school (safe — keeps FK integrity) ─────
            DB::table('roles')
                ->where('slug', 'head-of-school')
                ->update(['is_active' => false, 'updated_at' => $now]);
        }

        // ── 5. Update user_id_sequences if table exists ───────────────────────
        if (DB::getSchemaBuilder()->hasTable('user_id_sequences')) {
            // Ensure PRO sequence row exists
            $hasPrefix = DB::getSchemaBuilder()->hasColumn('user_id_sequences', 'prefix');
            if ($hasPrefix) {
                $exists = DB::table('user_id_sequences')
                    ->where('year', $year)->where('prefix', 'PRO')->exists();
                if (!$exists) {
                    DB::table('user_id_sequences')->insert([
                        'year'          => $year,
                        'prefix'        => 'PRO',
                        'last_sequence' => 0,
                        'created_at'    => $now,
                        'updated_at'    => $now,
                    ]);
                }
                // Remove stale HOS row
                DB::table('user_id_sequences')
                    ->where('year', $year)->where('prefix', 'HOS')->delete();
            }
        }
    }

    public function down(): void
    {
        // Intentional no-op — role migrations are not reversible.
    }
};
