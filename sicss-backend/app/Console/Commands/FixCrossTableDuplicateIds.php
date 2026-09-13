<?php

namespace App\Console\Commands;

use App\Models\Student;
use App\Models\User;
use Illuminate\Console\Command;

class FixCrossTableDuplicateIds extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:fix-cross-table-duplicate-ids';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix duplicate IDs across users (user_code) and students (student_id)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Fixing duplicate IDs across users and students...');
        
        // Get all user_codes and student_ids
        $userCodes = User::whereNotNull('user_code')->pluck('user_code')->toArray();
        $studentIds = Student::pluck('student_id')->toArray();
        
        // Find duplicates across tables
        $duplicates = array_intersect($userCodes, $studentIds);
        
        if (empty($duplicates)) {
            $this->info('No cross-table duplicate IDs found.');
            return Command::SUCCESS;
        }
        
        $fixedCount = 0;
        
        foreach ($duplicates as $duplicateId) {
            $this->warn("\nProcessing duplicate ID: {$duplicateId}");
            
            // Find users with this code
            $users = User::where('user_code', $duplicateId)->get();
            
            // Find students with this ID
            $students = Student::where('student_id', $duplicateId)->get();
            
            if ($users->count() > 0 && $students->count() > 0) {
                // Check if the user and student are the same person (by name)
                $student = $students->first();
                $matchingUser = $users->first(function($user) use ($student) {
                    return $user->first_name === $student->first_name && $user->last_name === $student->last_name;
                });
                
                if ($matchingUser) {
                    // This is the correct match - keep it, regenerate student_id for other students
                    $this->info("  Found matching user for student {$student->first_name} {$student->last_name}");
                    
                    foreach ($students as $s) {
                        if ($s->id !== $student->id) {
                            // Generate new student_id
                            $year = date('Y');
                            $lastStudent = Student::where('student_id', 'like', "STU-{$year}-%")
                                ->orderBy('id', 'desc')
                                ->first();
                            
                            $lastNumber = 0;
                            if ($lastStudent && preg_match("/^STU-{$year}-(\d{4})$/", $lastStudent->student_id, $matches)) {
                                $lastNumber = (int) $matches[1];
                            }
                            
                            do {
                                $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
                                $newId = "STU-{$year}-{$newNumber}";
                                $lastNumber++;
                            } while (Student::where('student_id', $newId)->exists());
                            
                            $this->info("  Updating student_id for student ID: {$s->id} ({$s->first_name} {$s->last_name}) from {$s->student_id} to {$newId}");
                            $s->student_id = $newId;
                            $s->save();
                            $fixedCount++;
                        }
                    }
                } else {
                    // No matching user found - regenerate student_id for all students with this ID
                    $this->info("  No matching user found for student {$student->first_name} {$student->last_name}");
                    $this->info("  Regenerating student_id for all students with this ID");
                    
                    foreach ($students as $s) {
                        // Generate new student_id
                        $year = date('Y');
                        $lastStudent = Student::where('student_id', 'like', "STU-{$year}-%")
                            ->orderBy('id', 'desc')
                            ->first();
                        
                        $lastNumber = 0;
                        if ($lastStudent && preg_match("/^STU-{$year}-(\d{4})$/", $lastStudent->student_id, $matches)) {
                            $lastNumber = (int) $matches[1];
                        }
                        
                        do {
                            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
                            $newId = "STU-{$year}-{$newNumber}";
                            $lastNumber++;
                        } while (Student::where('student_id', $newId)->exists());
                        
                        $this->info("  Updating student_id for student ID: {$s->id} ({$s->first_name} {$s->last_name}) from {$s->student_id} to {$newId}");
                        $s->student_id = $newId;
                        $s->save();
                        $fixedCount++;
                    }
                }
            }
        }
        
        $this->info("\nFixed {$fixedCount} cross-table duplicate ID(s).");
        $this->info("Student IDs have been regenerated to avoid conflicts with user_codes.");
        
        return Command::SUCCESS;
    }
}
