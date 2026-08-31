<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\ClassModel;
use App\Models\Fee;
use App\Models\Payment;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\TeacherSubjectClass;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function summary(Request $request)
    {
        $role = $request->user()->role?->slug;

        if (in_array($role, ['finance', 'finance-staff'], true)) {
            $month = now()->format('Y-m');
            $year = now()->year;
            $totals = static function ($query): array {
                return [
                    'LRD' => (float) (clone $query)->where('currency', 'LRD')->sum('amount'),
                    'USD' => (float) (clone $query)->where('currency', 'USD')->sum('amount'),
                ];
            };
            $completed = Payment::where('status', 'completed');

            return response()->json([
                'monthly_income' => $totals((clone $completed)->where('payment_date', 'like', "{$month}%")),
                'annual_income' => $totals((clone $completed)->whereYear('payment_date', $year)),
                'monthly_payment_count' => (clone $completed)->where('payment_date', 'like', "{$month}%")->count(),
                'pending_payments' => Payment::where('status', 'pending')->count(),
                'refunded_payments' => Payment::where('status', 'refunded')->count(),
                'academic_year' => (string) $year,
            ]);
        }

        // Students must never receive school-wide dashboard data.
        if ($role === 'student') {
            $student = Student::where('user_id', $request->user()->id)->first();

            // A student account may be created before its school record is linked.
            // Keep the dashboard available while exposing no other students' data.
            if (!$student) {
                return response()->json([
                    'students' => 0,
                    'attendance_rate' => 0,
                ]);
            }

            $attendance = Attendance::where('student_id', $student->id);
            $totalAttendance = (clone $attendance)->count();
            $present = (clone $attendance)->whereIn('status', ['present', 'late'])->count();

            return response()->json([
                'students' => $student->class_id
                    ? Student::where('class_id', $student->class_id)->where('status', 'active')->count()
                    : 0,
                'attendance_rate' => $totalAttendance ? round(($present / $totalAttendance) * 100) : 0,
            ]);
        }

        // Teachers only receive aggregates for classes assigned to them.
        if (in_array($role, ['teacher', 'class-sponsor', 'subject-teacher'], true)) {
            $teacher = Teacher::where('user_id', $request->user()->id)->first();
            $classIds = collect();
            if ($teacher) {
                $classIds = $teacher->classes()->pluck('classes.id')
                    ->merge(TeacherSubjectClass::where('teacher_id', $teacher->id)->pluck('class_id'));
                if ($teacher->sponsoredClass) $classIds->push($teacher->sponsoredClass->id);
                $classIds = $classIds->unique()->values();
            }

            $attendance = Attendance::whereIn('class_id', $classIds)->whereDate('date', now()->toDateString());
            $totalAttendance = (clone $attendance)->count();
            $present = (clone $attendance)->whereIn('status', ['present', 'late'])->count();
            $currentPayroll = $teacher ? \App\Models\TeacherPayroll::where('teacher_id', $teacher->id)->where('payroll_month', now()->format('Y-m'))->first() : null;
            $salaryStructure = $teacher?->salaryStructure;

            return response()->json([
                'students' => Student::whereIn('class_id', $classIds)->where('status', 'active')->count(),
                'classes' => $classIds->count(),
                'attendance_present' => $present,
                'attendance_absent' => max(0, $totalAttendance - $present),
                'attendance_rate' => $totalAttendance ? round(($present / $totalAttendance) * 100) : 0,
                'monthly_salary' => $currentPayroll?->amount ?? $salaryStructure?->monthly_salary,
                'salary_currency' => $currentPayroll?->currency ?? $salaryStructure?->currency,
                'salary_status' => $currentPayroll?->status ?? 'pending',
                'academic_year' => (string) now()->year,
            ]);
        }

        $today = now()->toDateString();
        $year = now()->year;
        $attendance = Attendance::whereDate('date', $today);
        $present = (clone $attendance)->whereIn('status', ['present', 'late'])->count();
        $totalAttendance = (clone $attendance)->count();

        return response()->json([
            'students' => Student::where('status', 'active')->count(),
            'teachers' => Teacher::where('status', 'active')->count(),
            'classes' => ClassModel::where('is_active', true)->count(),
            'fees_collected' => [
                'LRD' => (float) Payment::where('status', 'completed')->where('currency', 'LRD')->whereYear('payment_date', $year)->sum('amount'),
                'USD' => (float) Payment::where('status', 'completed')->where('currency', 'USD')->whereYear('payment_date', $year)->sum('amount'),
            ],
            'attendance_present' => $present,
            'attendance_absent' => max(0, $totalAttendance - $present),
            'attendance_rate' => $totalAttendance ? round(($present / $totalAttendance) * 100) : 0,
            'academic_year' => (string) $year,
        ]);
    }
}
