<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'name' => 'ADMIN',
                'slug' => 'admin',
                'description' => 'System administrator with full access',
                'is_active' => true,
            ],
            [
                'name' => 'TEACHER',
                'slug' => 'teacher',
                'description' => 'Base role for all teaching staff. Specific responsibilities (Subject Teacher, Class Sponsor) are managed via assignment tables.',
                'is_active' => true,
            ],
            [
                'name' => 'CLASS SPONSOR',
                'slug' => 'class-sponsor',
                'description' => 'Legacy role - Class sponsor responsibilities are now managed via classes.sponsor_teacher_id. Kept for backward compatibility.',
                'is_active' => false,
            ],
            [
                'name' => 'SUBJECT TEACHER',
                'slug' => 'subject-teacher',
                'description' => 'Legacy role - Subject teacher responsibilities are now managed via teacher_subject_class table. Kept for backward compatibility.',
                'is_active' => false,
            ],
            [
                'name' => 'STUDENT',
                'slug' => 'student',
                'description' => 'Student with access to personal information',
                'is_active' => true,
            ],
            [
                'name' => 'VICE PRINCIPAL FOR INSTRUCTION',
                'slug' => 'vice-principal-instruction',
                'description' => 'Reviews and approves submitted grades',
                'is_active' => true,
            ],
            [
                'name' => 'PRINCIPAL',
                'slug' => 'principal',
                'description' => 'School principal with staff oversight access',
                'is_active' => true,
            ],
            [
                'name' => 'PROPRIETOR',
                'slug' => 'proprietor',
                'description' => 'School proprietor with management oversight',
                'is_active' => true,
            ],
            [
                'name' => 'PROPRIETRESS',
                'slug' => 'proprietress',
                'description' => 'School proprietress with management oversight',
                'is_active' => true,
            ],
            [
                'name' => 'PARENT',
                'slug' => 'parent',
                'description' => 'Parent with access to children information',
                'is_active' => true,
            ],
            [
                'name' => 'FINANCE STAFF',
                'slug' => 'finance-staff',
                'description' => 'Finance staff with access to financial records',
                'is_active' => true,
            ],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(
                ['slug' => $role['slug']],
                $role
            );
        }

        // The original broad Teacher role is retained for existing records only.
        // Administrators must reassign those accounts to one of the scoped roles.
        Role::where('slug', 'teacher')->where('name', 'TEACHER')->update(['is_active' => true]);
    }
}
