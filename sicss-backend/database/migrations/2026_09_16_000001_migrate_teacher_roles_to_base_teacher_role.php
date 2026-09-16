<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Get the role IDs
        $teacherRoleId = DB::table('roles')->where('slug', 'teacher')->value('id');
        $subjectTeacherRoleId = DB::table('roles')->where('slug', 'subject-teacher')->value('id');
        $classSponsorRoleId = DB::table('roles')->where('slug', 'class-sponsor')->value('id');

        if (!$teacherRoleId) {
            // Teacher role doesn't exist yet, run the seeder first
            return;
        }

        // Migrate users with subject-teacher or class-sponsor roles to the teacher base role
        // This allows them to have both responsibilities based on their assignments
        DB::table('users')
            ->whereIn('role_id', [$subjectTeacherRoleId, $classSponsorRoleId])
            ->update(['role_id' => $teacherRoleId]);
    }

    public function down(): void
    {
        // This migration is not easily reversible because we can't determine
        // which users should revert to subject-teacher vs class-sponsor
        // In production, you would need to track the original role assignments
    }
};
