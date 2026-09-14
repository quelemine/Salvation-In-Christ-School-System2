<?php

namespace App\Console\Commands;

use App\Models\Teacher;
use Illuminate\Console\Command;

class CheckDuplicateTeacherIds extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:check-duplicate-teacher-ids';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check and fix duplicate teacher IDs in the database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for duplicate teacher IDs...');
        
        // Get all teachers grouped by employee_id
        $teachers = Teacher::all();
        $duplicates = [];
        
        foreach ($teachers as $teacher) {
            $employeeId = $teacher->employee_id;
            if (!$employeeId) continue;
            
            if (!isset($duplicates[$employeeId])) {
                $duplicates[$employeeId] = [];
            }
            $duplicates[$employeeId][] = $teacher;
        }
        
        // Find duplicates (more than 1 teacher with same employee_id)
        $duplicateCount = 0;
        foreach ($duplicates as $employeeId => $teacherList) {
            if (count($teacherList) > 1) {
                $duplicateCount++;
                $this->warn("Found duplicate teacher ID: {$employeeId}");
                $this->info("  Teacher IDs: " . implode(', ', array_map(fn($t) => $t->id, $teacherList)));
                $this->info("  Names: " . implode(', ', array_map(fn($t) => $t->first_name . ' ' . $t->last_name, $teacherList)));
                
                // Keep the first one, delete the rest
                $toKeep = array_shift($teacherList);
                foreach ($teacherList as $toDelete) {
                    $this->info("  Deleting teacher record ID: {$toDelete->id} ({$toDelete->first_name} {$toDelete->last_name})");
                    $toDelete->delete();
                }
            }
        }
        
        if ($duplicateCount === 0) {
            $this->info('No duplicate teacher IDs found.');
        } else {
            $this->info("Fixed duplicates for {$duplicateCount} teacher ID(s).");
        }
        
        return Command::SUCCESS;
    }
}
