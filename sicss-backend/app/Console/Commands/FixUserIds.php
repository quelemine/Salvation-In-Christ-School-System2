<?php

namespace App\Console\Commands;

use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Console\Command;

class FixUserIds extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:fix-user-ids';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix user IDs to match format PREFIX-YYYY-NNNN';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Renumbering Teacher IDs to start from 0001...');
        
        // Renumber Teacher IDs
        $teachers = Teacher::all();
        $year = date('Y');
        
        // Separate teachers by role
        $tchTeachers = [];
        $stfTeachers = [];
        
        foreach ($teachers as $teacher) {
            $role = $teacher->user?->role?->slug ?? 'teacher';
            if ($role === 'staff') {
                $stfTeachers[] = $teacher;
            } else {
                $tchTeachers[] = $teacher;
            }
        }
        
        // Renumber TCH teachers starting from 0001
        $counter = 1;
        foreach ($tchTeachers as $teacher) {
            $newId = "TCH-{$year}-" . str_pad($counter, 4, '0', STR_PAD_LEFT);
            $currentId = $teacher->employee_id;
            $teacher->employee_id = $newId;
            $teacher->save();
            $this->info("Updated teacher ID: {$currentId} -> {$newId}");
            $counter++;
        }
        
        // Renumber STF teachers starting from 0001
        $counter = 1;
        foreach ($stfTeachers as $teacher) {
            $newId = "STF-{$year}-" . str_pad($counter, 4, '0', STR_PAD_LEFT);
            $currentId = $teacher->employee_id;
            $teacher->employee_id = $newId;
            $teacher->save();
            $this->info("Updated staff ID: {$currentId} -> {$newId}");
            $counter++;
        }
        
        $this->info('Renumbering Student IDs to start from 0001...');
        
        // Renumber Student IDs starting from 0001
        $students = Student::all();
        $counter = 1;
        
        foreach ($students as $student) {
            $newId = "STU-{$year}-" . str_pad($counter, 4, '0', STR_PAD_LEFT);
            $currentId = $student->student_id;
            $student->student_id = $newId;
            $student->save();
            $this->info("Updated student ID: {$currentId} -> {$newId}");
            $counter++;
        }
        
        $this->info('All user IDs have been renumbered to start from 0001');
        
        return Command::SUCCESS;
    }
}
