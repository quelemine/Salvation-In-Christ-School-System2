<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckDuplicateIdsScheduled extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:check-duplicate-ids-scheduled';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Scheduled task to check for duplicate IDs and log any issues';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Running scheduled duplicate ID check...');
        
        $issues = [];
        
        // Check student_ids
        $students = \App\Models\Student::all();
        $studentDuplicates = [];
        foreach ($students as $student) {
            if (!$student->student_id) continue;
            if (!isset($studentDuplicates[$student->student_id])) {
                $studentDuplicates[$student->student_id] = [];
            }
            $studentDuplicates[$student->student_id][] = $student->id;
        }
        
        foreach ($studentDuplicates as $studentId => $ids) {
            if (count($ids) > 1) {
                $issues[] = "Duplicate student_id: {$studentId} (records: " . implode(', ', $ids) . ")";
            }
        }
        
        // Check employee_ids
        $teachers = \App\Models\Teacher::all();
        $teacherDuplicates = [];
        foreach ($teachers as $teacher) {
            if (!$teacher->employee_id) continue;
            if (!isset($teacherDuplicates[$teacher->employee_id])) {
                $teacherDuplicates[$teacher->employee_id] = [];
            }
            $teacherDuplicates[$teacher->employee_id][] = $teacher->id;
        }
        
        foreach ($teacherDuplicates as $employeeId => $ids) {
            if (count($ids) > 1) {
                $issues[] = "Duplicate employee_id: {$employeeId} (records: " . implode(', ', $ids) . ")";
            }
        }
        
        // Check user_codes
        $users = \App\Models\User::all();
        $userDuplicates = [];
        foreach ($users as $user) {
            if (!$user->user_code) continue;
            if (!isset($userDuplicates[$user->user_code])) {
                $userDuplicates[$user->user_code] = [];
            }
            $userDuplicates[$user->user_code][] = $user->id;
        }
        
        foreach ($userDuplicates as $userCode => $ids) {
            if (count($ids) > 1) {
                $issues[] = "Duplicate user_code: {$userCode} (records: " . implode(', ', $ids) . ")";
            }
        }
        
        // Check cross-table duplicates
        $studentIds = \App\Models\Student::pluck('student_id')->toArray();
        $userCodes = \App\Models\User::pluck('user_code')->toArray();
        $employeeIds = \App\Models\Teacher::pluck('employee_id')->toArray();
        
        $studentUserDups = array_intersect($studentIds, $userCodes);
        foreach ($studentUserDups as $dup) {
            $issues[] = "Cross-table duplicate (student-user): {$dup}";
        }
        
        $teacherUserDups = array_intersect($employeeIds, $userCodes);
        foreach ($teacherUserDups as $dup) {
            $issues[] = "Cross-table duplicate (teacher-user): {$dup}";
        }
        
        if (empty($issues)) {
            $this->info('No duplicate ID issues found.');
            Log::info('Scheduled duplicate ID check: No issues found');
        } else {
            $this->error('Found duplicate ID issues:');
            foreach ($issues as $issue) {
                $this->error("  - {$issue}");
            }
            Log::warning('Scheduled duplicate ID check found issues', ['issues' => $issues]);
        }
        
        return empty($issues) ? Command::SUCCESS : Command::FAILURE;
    }
}
