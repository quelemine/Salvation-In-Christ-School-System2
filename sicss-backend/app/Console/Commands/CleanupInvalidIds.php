<?php

namespace App\Console\Commands;

use App\Models\Student;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CleanupInvalidIds extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cleanup:invalid-ids';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Find and delete students/users with invalid ID formats';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting cleanup of invalid ID formats...');
        $this->newLine();

        // Students with invalid student_id format
        $this->info('Checking students with invalid student_id format...');
        $invalidStudents = Student::where('student_id', 'not like', 'STU-%-%')
            ->orWhere(function ($query) {
                $query->where('student_id', 'like', 'STU-%-%')
                    ->whereRaw("LENGTH(student_id) != 12");
            })
            ->get();

        if ($invalidStudents->isEmpty()) {
            $this->info('✓ No students with invalid student_id format found.');
        } else {
            $this->warn("Found {$invalidStudents->count()} students with invalid student_id format:");
            foreach ($invalidStudents as $student) {
                $this->line("  - ID: {$student->id}, student_id: {$student->student_id}, Name: {$student->first_name} {$student->last_name}");
            }

            if ($this->confirm('Do you want to delete these students?')) {
                DB::beginTransaction();
                try {
                    foreach ($invalidStudents as $student) {
                        $student->delete();
                    }
                    DB::commit();
                    $this->info("✓ Deleted {$invalidStudents->count()} students with invalid IDs.");
                } catch (\Exception $e) {
                    DB::rollBack();
                    $this->error("✗ Failed to delete students: {$e->getMessage()}");
                    return 1;
                }
            } else {
                $this->info('Skipped student deletion.');
            }
        }
        $this->newLine();

        // Users with invalid user_code format
        $this->info('Checking users with invalid user_code format...');
        $validPrefixes = ['STU', 'TCH', 'CTH', 'STH', 'PAR', 'FIN', 'VPI', 'PRI', 'HOS', 'ADM', 'USR'];
        $currentYear = now()->format('Y');
        
        $invalidUsers = User::whereNull('user_code')
            ->orWhere(function ($query) use ($validPrefixes) {
                $query->where('user_code', 'not like', '%-%-%')
                    ->orWhere(function ($q) use ($validPrefixes) {
                        foreach ($validPrefixes as $prefix) {
                            $q->where('user_code', 'not like', "{$prefix}-%");
                        }
                    });
            })
            ->get();

        if ($invalidUsers->isEmpty()) {
            $this->info('✓ No users with invalid user_code format found.');
        } else {
            $this->warn("Found {$invalidUsers->count()} users with invalid user_code format:");
            foreach ($invalidUsers as $user) {
                $this->line("  - ID: {$user->id}, user_code: " . ($user->user_code ?? 'NULL') . ", Email: {$user->email}, Role: " . ($user->role?->slug ?? 'N/A'));
            }

            if ($this->confirm('Do you want to delete these users?')) {
                DB::beginTransaction();
                try {
                    foreach ($invalidUsers as $user) {
                        // Delete related records first
                        $user->tokens()->delete();
                        $user->delete();
                    }
                    DB::commit();
                    $this->info("✓ Deleted {$invalidUsers->count()} users with invalid IDs.");
                } catch (\Exception $e) {
                    DB::rollBack();
                    $this->error("✗ Failed to delete users: {$e->getMessage()}");
                    return 1;
                }
            } else {
                $this->info('Skipped user deletion.');
            }
        }
        $this->newLine();

        // Check for orphaned records (students without users, users without students where applicable)
        $this->info('Checking for orphaned records...');
        
        // Students with user_id pointing to non-existent users
        $orphanedStudents = Student::whereNotNull('user_id')
            ->whereNotIn('user_id', function ($query) {
                $query->select('id')->from('users');
            })
            ->get();

        if ($orphanedStudents->isEmpty()) {
            $this->info('✓ No orphaned students found.');
        } else {
            $this->warn("Found {$orphanedStudents->count()} students with non-existent user_id:");
            foreach ($orphanedStudents as $student) {
                $this->line("  - Student ID: {$student->student_id}, user_id: {$student->user_id}");
            }

            if ($this->confirm('Do you want to clear user_id for these students?')) {
                foreach ($orphanedStudents as $student) {
                    $student->update(['user_id' => null]);
                }
                $this->info("✓ Cleared user_id for {$orphanedStudents->count()} students.");
            } else {
                $this->info('Skipped clearing orphaned student user_ids.');
            }
        }
        $this->newLine();

        $this->info('Cleanup completed successfully!');
        return 0;
    }
}
