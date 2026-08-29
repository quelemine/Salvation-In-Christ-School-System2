<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = 'admin@sicss.com';
        $password = env('SICSS_ADMIN_SEED_PASSWORD');
        if (! is_string($password) || $password === '') {
            throw new \RuntimeException('SICSS_ADMIN_SEED_PASSWORD must be set in .env before running the admin seeder.');
        }

        // Check if user exists
        $user = User::where('email', $email)->first();

        if ($user) {
            // Reset password
            $user->password = bcrypt($password);
            $user->is_active = true;
            $user->save();
            $this->command->info('Admin user password reset successfully.');
        } else {
            // Create new user
            $user = User::create([
                'first_name' => 'SICSS',
                'last_name' => 'Administrator',
                'email' => $email,
                'password' => bcrypt($password),
                'is_active' => true,
            ]);
            $this->command->info('Admin user created successfully.');
        }

        // Assign ADMIN role
        $adminRole = Role::where('name', 'ADMIN')->first();
        if ($adminRole) {
            if ($user->role_id !== $adminRole->id) {
                $user->role_id = $adminRole->id;
                $user->save();
                $this->command->info('ADMIN role assigned to user.');
            } else {
                $this->command->info('User already has ADMIN role.');
            }
        } else {
            $this->command->error('ADMIN role not found. Please run roles seeder first.');
        }

        $this->command->info("Email: {$email}");
        $this->command->info('Password loaded from SICSS_ADMIN_SEED_PASSWORD.');
    }
}
