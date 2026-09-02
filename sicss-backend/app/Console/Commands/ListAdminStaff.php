<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class ListAdminStaff extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:list-admin-staff';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'List all admin and staff users in the system';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Admin and Staff Users');
        $this->info(str_repeat('=', 80));
        $this->newLine();

        $adminRoles = ['admin', 'finance', 'finance-staff', 'vice-principal-instruction', 'principal', 'proprietor', 'proprietress'];

        $users = User::with('role')
            ->whereHas('role', function($query) use ($adminRoles) {
                $query->whereIn('slug', $adminRoles);
            })
            ->orderBy('role_id')
            ->orderBy('first_name')
            ->get();

        if ($users->isEmpty()) {
            $this->warn('No admin or staff users found.');
            return 0;
        }

        $this->table(
            ['ID', 'User Code', 'Name', 'Email', 'Role', 'Phone', 'Active'],
            $users->map(function($user) {
                return [
                    $user->id,
                    $user->user_code ?? 'N/A',
                    "{$user->first_name} {$user->last_name}",
                    $user->email,
                    $user->role?->name ?? 'N/A',
                    $user->phone ?? 'N/A',
                    $user->is_active ? 'Yes' : 'No',
                ];
            })->toArray()
        );

        $this->newLine();
        $this->info("Total: {$users->count()} admin/staff users");
        $this->newLine();

        // Group by role
        $grouped = $users->groupBy('role.slug');
        foreach ($grouped as $roleSlug => $roleUsers) {
            $roleName = $roleUsers->first()->role?->name ?? $roleSlug;
            $this->info("  {$roleName}: {$roleUsers->count()}");
        }

        return 0;
    }
}
