<?php

namespace App\Console\Commands;

use App\Models\Student;
use Illuminate\Console\Command;

class CheckDuplicateStudentIds extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:check-duplicate-student-ids';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check and fix duplicate student IDs in the database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for duplicate student IDs...');
        
        // Get all students grouped by student_id
        $students = Student::all();
        $duplicates = [];
        
        foreach ($students as $student) {
            $studentId = $student->student_id;
            if (!isset($duplicates[$studentId])) {
                $duplicates[$studentId] = [];
            }
            $duplicates[$studentId][] = $student;
        }
        
        // Find duplicates (more than 1 student with same student_id)
        $duplicateCount = 0;
        foreach ($duplicates as $studentId => $studentList) {
            if (count($studentList) > 1) {
                $duplicateCount++;
                $this->warn("Found duplicate student ID: {$studentId}");
                $this->info("  Student IDs: " . implode(', ', array_map(fn($s) => $s->id, $studentList)));
                $this->info("  Names: " . implode(', ', array_map(fn($s) => $s->first_name . ' ' . $s->last_name, $studentList)));
                
                // Keep the first one, delete the rest
                $toKeep = array_shift($studentList);
                foreach ($studentList as $toDelete) {
                    $this->info("  Deleting student record ID: {$toDelete->id} ({$toDelete->first_name} {$toDelete->last_name})");
                    $toDelete->delete();
                }
            }
        }
        
        if ($duplicateCount === 0) {
            $this->info('No duplicate student IDs found.');
        } else {
            $this->info("Fixed duplicates for {$duplicateCount} student ID(s).");
        }
        
        return Command::SUCCESS;
    }
}
