<?php

namespace App\Console\Commands;

use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Console\Command;

class CheckAllDuplicateIds extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:check-all-duplicate-ids';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Comprehensive check for duplicate IDs across all tables in the system';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('=== COMPREHENSIVE DUPLICATE ID CHECK ===');
        $this->newLine();
        
        $totalIssues = 0;
        
        // 1. Check duplicate student_ids within students table
        $this->info('1. Checking duplicate student_ids within students table...');
        $students = Student::all();
        $studentDuplicates = [];
        foreach ($students as $student) {
            $studentId = $student->student_id;
            if (!$studentId) continue;
            if (!isset($studentDuplicates[$studentId])) {
                $studentDuplicates[$studentId] = [];
            }
            $studentDuplicates[$studentId][] = $student;
        }
        
        $studentDupCount = 0;
        foreach ($studentDuplicates as $studentId => $list) {
            if (count($list) > 1) {
                $studentDupCount++;
                $totalIssues++;
                $this->warn("  Duplicate student_id: {$studentId}");
                $this->info("    Records: " . implode(', ', array_map(fn($s) => $s->id, $list)));
            }
        }
        if ($studentDupCount === 0) {
            $this->info('  ✓ No duplicate student_ids found');
        } else {
            $this->error("  ✗ Found {$studentDupCount} duplicate student_id(s)");
        }
        $this->newLine();
        
        // 2. Check duplicate employee_ids within teachers table
        $this->info('2. Checking duplicate employee_ids within teachers table...');
        $teachers = Teacher::all();
        $teacherDuplicates = [];
        foreach ($teachers as $teacher) {
            $employeeId = $teacher->employee_id;
            if (!$employeeId) continue;
            if (!isset($teacherDuplicates[$employeeId])) {
                $teacherDuplicates[$employeeId] = [];
            }
            $teacherDuplicates[$employeeId][] = $teacher;
        }
        
        $teacherDupCount = 0;
        foreach ($teacherDuplicates as $employeeId => $list) {
            if (count($list) > 1) {
                $teacherDupCount++;
                $totalIssues++;
                $this->warn("  Duplicate employee_id: {$employeeId}");
                $this->info("    Records: " . implode(', ', array_map(fn($t) => $t->id, $list)));
            }
        }
        if ($teacherDupCount === 0) {
            $this->info('  ✓ No duplicate employee_ids found');
        } else {
            $this->error("  ✗ Found {$teacherDupCount} duplicate employee_id(s)");
        }
        $this->newLine();
        
        // 3. Check duplicate user_codes within users table
        $this->info('3. Checking duplicate user_codes within users table...');
        $users = User::all();
        $userDuplicates = [];
        foreach ($users as $user) {
            $userCode = $user->user_code;
            if (!$userCode) continue;
            if (!isset($userDuplicates[$userCode])) {
                $userDuplicates[$userCode] = [];
            }
            $userDuplicates[$userCode][] = $user;
        }
        
        $userDupCount = 0;
        foreach ($userDuplicates as $userCode => $list) {
            if (count($list) > 1) {
                $userDupCount++;
                $totalIssues++;
                $this->warn("  Duplicate user_code: {$userCode}");
                $this->info("    Records: " . implode(', ', array_map(fn($u) => $u->id, $list)));
            }
        }
        if ($userDupCount === 0) {
            $this->info('  ✓ No duplicate user_codes found');
        } else {
            $this->error("  ✗ Found {$userDupCount} duplicate user_code(s)");
        }
        $this->newLine();
        
        // 4. Check cross-table duplicates (students vs users)
        $this->info('4. Checking cross-table duplicates (students vs users)...');
        $studentIds = Student::pluck('student_id')->toArray();
        $userCodes = User::pluck('user_code')->toArray();
        $studentUserDuplicates = array_intersect($studentIds, $userCodes);
        
        if (empty($studentUserDuplicates)) {
            $this->info('  ✓ No cross-table duplicates found between students and users');
        } else {
            $totalIssues += count($studentUserDuplicates);
            $this->warn("  Found " . count($studentUserDuplicates) . " cross-table duplicate ID(s) between students and users:");
            foreach ($studentUserDuplicates as $dupId) {
                $this->warn("    - {$dupId}");
            }
        }
        $this->newLine();
        
        // 5. Check cross-table duplicates (teachers vs users)
        $this->info('5. Checking cross-table duplicates (teachers vs users)...');
        $employeeIds = Teacher::pluck('employee_id')->toArray();
        $teacherUserDuplicates = array_intersect($employeeIds, $userCodes);
        
        if (empty($teacherUserDuplicates)) {
            $this->info('  ✓ No cross-table duplicates found between teachers and users');
        } else {
            $this->warn("  Found " . count($teacherUserDuplicates) . " cross-table duplicate ID(s) between teachers and users:");
            foreach ($teacherUserDuplicates as $dupId) {
                $this->warn("    - {$dupId}");
            }
            $this->info('  Note: These may be legitimate matches where user and teacher represent the same person');
        }
        $this->newLine();
        
        // Summary
        $this->info('=== SUMMARY ===');
        if ($totalIssues === 0) {
            $this->info('✓ No duplicate ID issues found in the system.');
        } else {
            $this->error("✗ Found {$totalIssues} duplicate ID issue(s) in the system.");
            $this->info('Run the appropriate fix commands to resolve:');
            $this->info('  - php artisan app:fix-cross-table-duplicate-ids (for student-user duplicates)');
            $this->info('  - php artisan app:fix-teacher-user-duplicate-ids (for teacher-user duplicates)');
        }
        
        return $totalIssues === 0 ? Command::SUCCESS : Command::FAILURE;
    }
}
