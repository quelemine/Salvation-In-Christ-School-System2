<?php

namespace App\Console\Commands;

use App\Models\Teacher;
use App\Models\User;
use Illuminate\Console\Command;

class CheckTeacherUserDuplicateIds extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:check-teacher-user-duplicate-ids';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for duplicate IDs across teachers (employee_id) and users (user_code)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for duplicate IDs across teachers and users...');
        
        // Get all employee_ids and user_codes
        $employeeIds = Teacher::whereNotNull('employee_id')->pluck('employee_id')->toArray();
        $userCodes = User::whereNotNull('user_code')->pluck('user_code')->toArray();
        
        // Find duplicates across tables
        $duplicates = array_intersect($employeeIds, $userCodes);
        
        if (empty($duplicates)) {
            $this->info('No cross-table duplicate IDs found.');
            return Command::SUCCESS;
        }
        
        $this->warn("Found " . count($duplicates) . " duplicate ID(s) across tables:");
        
        foreach ($duplicates as $duplicateId) {
            $this->warn("\nDuplicate ID: {$duplicateId}");
            
            // Find users with this code
            $users = User::where('user_code', $duplicateId)->get();
            if ($users->count() > 0) {
                $this->info("  Users with this code:");
                foreach ($users as $user) {
                    $role = $user->role ? $user->role->slug : 'none';
                    $this->info("    - User ID: {$user->id}, Name: {$user->first_name} {$user->last_name}, Role: {$role}");
                }
            }
            
            // Find teachers with this ID
            $teachers = Teacher::where('employee_id', $duplicateId)->get();
            if ($teachers->count() > 0) {
                $this->info("  Teachers with this ID:");
                foreach ($teachers as $teacher) {
                    $this->info("    - Teacher ID: {$teacher->id}, Name: {$teacher->first_name} {$teacher->last_name}");
                }
            }
        }
        
        $this->warn("\nThese IDs appear in both the users table (user_code) and teachers table (employee_id).");
        $this->info("This causes the duplicate display in the teachers page.");
        
        return Command::SUCCESS;
    }
}
