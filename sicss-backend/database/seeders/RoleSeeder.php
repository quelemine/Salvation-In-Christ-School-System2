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
                'name' => 'CLASS TEACHER',
                'slug' => 'class-teacher',
                'description' => 'Class sponsor with access to all students in their sponsored class',
                'is_active' => true,
            ],
            [
                'name' => 'SUBJECT TEACHER',
                'slug' => 'subject-teacher',
                'description' => 'Teacher with access only to assigned subjects and class students',
                'is_active' => true,
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
                'name' => 'HEAD OF SCHOOL',
                'slug' => 'head-of-school',
                'description' => 'Receives school management reports',
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
        Role::where('slug', 'teacher')->update(['is_active' => false]);
    }
}
