<?php

namespace App\Console\Commands;

use App\Models\Teacher;
use App\Models\User;
use Illuminate\Console\Command;

class FixTeacherUserDuplicateIds extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:fix-teacher-user-duplicate-ids';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix duplicate IDs across teachers (employee_id) and users (user_code)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Fixing duplicate IDs across teachers and users...');
        
        // Get all employee_ids and user_codes
        $employeeIds = Teacher::whereNotNull('employee_id')->pluck('employee_id')->toArray();
        $userCodes = User::whereNotNull('user_code')->pluck('user_code')->toArray();
        
        // Find duplicates across tables
        $duplicates = array_intersect($employeeIds, $userCodes);
        
        if (empty($duplicates)) {
            $this->info('No cross-table duplicate IDs found.');
            return Command::SUCCESS;
        }
        
        $fixedCount = 0;
        
        foreach ($duplicates as $duplicateId) {
            $this->warn("\nProcessing duplicate ID: {$duplicateId}");
            
            // Find users with this code
            $users = User::where('user_code', $duplicateId)->get();
            
            // Find teachers with this ID
            $teachers = Teacher::where('employee_id', $duplicateId)->get();
            
            if ($users->count() > 0 && $teachers->count() > 0) {
                // Check if the user and teacher are the same person (by name)
                $teacher = $teachers->first();
                $matchingUser = $users->first(function($user) use ($teacher) {
                    return $user->first_name === $teacher->first_name && $user->last_name === $teacher->last_name;
                });
                
                if ($matchingUser) {
                    // This is the correct match - keep it, regenerate employee_id for other teachers
                    $this->info("  Found matching user for teacher {$teacher->first_name} {$teacher->last_name}");
                    
                    foreach ($teachers as $t) {
                        if ($t->id !== $teacher->id) {
                            // Generate new employee_id
                            $year = date('Y');
                            $prefix = 'TCH';
                            $lastTeacher = Teacher::where('employee_id', 'like', "{$prefix}-{$year}-%")
                                ->orderBy('id', 'desc')
                                ->first();
                            
                            $lastNumber = 0;
                            if ($lastTeacher && preg_match("/^{$prefix}-{$year}-(\d{4})$/", $lastTeacher->employee_id, $matches)) {
                                $lastNumber = (int) $matches[1];
                            }
                            
                            do {
                                $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
                                $newId = "{$prefix}-{$year}-{$newNumber}";
                                $lastNumber++;
                            } while (Teacher::where('employee_id', $newId)->exists() || User::where('user_code', $newId)->exists());
                            
                            $this->info("  Updating employee_id for teacher ID: {$t->id} ({$t->first_name} {$t->last_name}) from {$t->employee_id} to {$newId}");
                            $t->employee_id = $newId;
                            $t->save();
                            $fixedCount++;
                        }
                    }
                } else {
                    // No matching user found - regenerate employee_id for all teachers with this ID
                    $this->info("  No matching user found for teacher {$teacher->first_name} {$teacher->last_name}");
                    $this->info("  Regenerating employee_id for all teachers with this ID");
                    
                    foreach ($teachers as $t) {
                        // Generate new employee_id
                        $year = date('Y');
                        $prefix = 'TCH';
                        $lastTeacher = Teacher::where('employee_id', 'like', "{$prefix}-{$year}-%")
                            ->orderBy('id', 'desc')
                            ->first();
                        
                        $lastNumber = 0;
                        if ($lastTeacher && preg_match("/^{$prefix}-{$year}-(\d{4})$/", $lastTeacher->employee_id, $matches)) {
                            $lastNumber = (int) $matches[1];
                        }
                        
                        do {
                            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
                            $newId = "{$prefix}-{$year}-{$newNumber}";
                            $lastNumber++;
                        } while (Teacher::where('employee_id', $newId)->exists() || User::where('user_code', $newId)->exists());
                        
                        $this->info("  Updating employee_id for teacher ID: {$t->id} ({$t->first_name} {$t->last_name}) from {$t->employee_id} to {$newId}");
                        $t->employee_id = $newId;
                        $t->save();
                        $fixedCount++;
                    }
                }
            }
        }
        
        $this->info("\nFixed {$fixedCount} cross-table duplicate ID(s).");
        $this->info("Teacher employee IDs have been regenerated to avoid conflicts with user_codes.");
        
        return Command::SUCCESS;
    }
}
