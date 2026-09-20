<?php

namespace App\Services;

use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;

class IdGeneratorService
{
    /**
     * Generate a unique student ID with format STU-YYYY-NNNN
     * Ensures no conflicts with existing student_ids or user_codes
     */
    public static function generateStudentId(): string
    {
        $year = date('Y');
        $last = Student::where('student_id', 'like', "STU-{$year}-%")
            ->where('student_id', 'not like', "%-%-%")
            ->orderByRaw("CAST(SPLIT_PART(student_id, '-', 3) AS INTEGER) DESC")
            ->first();
        
        $next = 1;
        if ($last) {
            $parts = explode('-', $last->student_id);
            $next = (int) ($parts[2] ?? 0) + 1;
        }
        
        $studentId = "STU-{$year}-" . str_pad($next, 4, '0', STR_PAD_LEFT);
        
        // Ensure unique student_id
        while (Student::where('student_id', $studentId)->exists()) {
            $next++;
            $studentId = "STU-{$year}-" . str_pad($next, 4, '0', STR_PAD_LEFT);
        }
        
        // Ensure student_id doesn't conflict with user_codes
        while (User::where('user_code', $studentId)->exists()) {
            $next++;
            $studentId = "STU-{$year}-" . str_pad($next, 4, '0', STR_PAD_LEFT);
        }
        
        return $studentId;
    }
    
    /**
     * Generate a unique teacher/staff ID with format PREFIX-YYYY-NNNN
     * Ensures no conflicts with existing employee_ids or user_codes
     */
    public static function generateEmployeeId(string $role = 'TEACHER'): string
    {
        $prefix = $role === 'STAFF' ? 'STF' : 'TCH';
        $year = date('Y');
        
        $last = Teacher::where('employee_id', 'like', "{$prefix}-{$year}-%")
            ->orderByRaw("CAST(SPLIT_PART(employee_id, '-', 3) AS INTEGER) DESC")
            ->first();
        
        $lastNumber = 0;
        if ($last && preg_match("/^{$prefix}-{$year}-(\d{4})$/", $last->employee_id, $matches)) {
            $lastNumber = (int) $matches[1];
        }
        
        do {
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
            $employeeId = "{$prefix}-{$year}-{$newNumber}";
            $lastNumber++;
        } while (Teacher::where('employee_id', $employeeId)->exists());
        
        // Ensure employee_id doesn't conflict with user_codes
        while (User::where('user_code', $employeeId)->exists()) {
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
            $employeeId = "{$prefix}-{$year}-{$newNumber}";
            $lastNumber++;
        }
        
        return $employeeId;
    }
    
    /**
     * Generate a unique user code with format PREFIX-YYYY-NNNN
     * Ensures no conflicts with existing user_codes, student_ids, or employee_ids
     */
    public static function generateUserCode(string $role = 'USER'): string
    {
        $prefix = match($role) {
            'student' => 'STU',
            'teacher' => 'TCH',
            'staff' => 'STF',
            'admin' => 'ADM',
            default => 'USR',
        };
        
        $year = date('Y');
        
        $last = User::where('user_code', 'like', "{$prefix}-{$year}-%")
            ->orderByRaw("CAST(SPLIT_PART(user_code, '-', 3) AS INTEGER) DESC")
            ->first();
        
        $lastNumber = 0;
        if ($last && preg_match("/^{$prefix}-{$year}-(\d{4})$/", $last->user_code, $matches)) {
            $lastNumber = (int) $matches[1];
        }
        
        do {
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
            $userCode = "{$prefix}-{$year}-{$newNumber}";
            $lastNumber++;
        } while (User::where('user_code', $userCode)->exists());
        
        // Ensure user_code doesn't conflict with student_ids
        while (Student::where('student_id', $userCode)->exists()) {
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
            $userCode = "{$prefix}-{$year}-{$newNumber}";
            $lastNumber++;
        }
        
        // Ensure user_code doesn't conflict with employee_ids
        while (Teacher::where('employee_id', $userCode)->exists()) {
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
            $userCode = "{$prefix}-{$year}-{$newNumber}";
            $lastNumber++;
        }
        
        return $userCode;
    }
}
