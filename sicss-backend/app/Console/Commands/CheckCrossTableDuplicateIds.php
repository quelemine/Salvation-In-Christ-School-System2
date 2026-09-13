<?php

namespace App\Console\Commands;

use App\Models\Student;
use App\Models\User;
use Illuminate\Console\Command;

class CheckCrossTableDuplicateIds extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:check-cross-table-duplicate-ids';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for duplicate IDs across users (user_code) and students (student_id)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for duplicate IDs across users and students...');
        
        // Get all user_codes and student_ids
        $userCodes = User::whereNotNull('user_code')->pluck('user_code')->toArray();
        $studentIds = Student::pluck('student_id')->toArray();
        
        // Find duplicates across tables
        $duplicates = array_intersect($userCodes, $studentIds);
        
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
            
            // Find students with this ID
            $students = Student::where('student_id', $duplicateId)->get();
            if ($students->count() > 0) {
                $this->info("  Students with this ID:");
                foreach ($students as $student) {
                    $this->info("    - Student ID: {$student->id}, Name: {$student->first_name} {$student->last_name}");
                }
            }
        }
        
        $this->warn("\nThese IDs appear in both the users table (user_code) and students table (student_id).");
        $this->info("This causes the duplicate display in the students page.");
        
        return Command::SUCCESS;
    }
}
