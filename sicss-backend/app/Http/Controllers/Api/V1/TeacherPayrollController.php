<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SalaryStructure;
use App\Models\Teacher;
use App\Models\TeacherPayroll;
use App\Models\TeacherAttendance;
use App\Models\TeacherAttendanceSetting;
use Illuminate\Http\Request;

class TeacherPayrollController extends Controller
{
    public function structures()
    {
        return response()->json(SalaryStructure::orderBy('role_title')->get());
    }

    public function storeStructure(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255', 'employment_type' => 'required|in:self_contained,part_time',
            'role_title' => 'required|string|max:255', 'monthly_salary' => 'required|numeric|min:0',
            'currency' => 'required|in:LRD,USD', 'is_active' => 'boolean', 'notes' => 'nullable|string',
        ]);
        return response()->json(SalaryStructure::create($data), 201);
    }

    public function updateStructure(Request $request, SalaryStructure $salaryStructure)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255', 'employment_type' => 'required|in:self_contained,part_time',
            'role_title' => 'required|string|max:255', 'monthly_salary' => 'required|numeric|min:0',
            'currency' => 'required|in:LRD,USD', 'is_active' => 'boolean', 'notes' => 'nullable|string',
        ]);
        $salaryStructure->update($data);
        return response()->json($salaryStructure->fresh());
    }

    public function payrolls(Request $request)
    {
        return response()->json(TeacherPayroll::with(['teacher:id,employee_id,first_name,last_name', 'salaryStructure'])
            ->when($request->month, fn ($q, $month) => $q->where('payroll_month', $month))
            ->orderByDesc('payroll_month')->orderBy('teacher_id')->get());
    }

    public function createPayroll(Request $request)
    {
        $data = $request->validate([
            'teacher_id' => 'required|exists:teachers,id', 'payroll_month' => 'required|date_format:Y-m',
            'salary_structure_id' => 'nullable|exists:salary_structures,id', 'amount' => 'nullable|numeric|min:0',
            'currency' => 'nullable|in:LRD,USD', 'role_title' => 'nullable|string|max:255',
            'employment_type' => 'nullable|in:self_contained,part_time', 'notes' => 'nullable|string',
        ]);
        $teacher = Teacher::with('salaryStructure')->findOrFail($data['teacher_id']);
        $structure = isset($data['salary_structure_id']) ? SalaryStructure::find($data['salary_structure_id']) : $teacher->salaryStructure;
        abort_unless($structure || (isset($data['amount'], $data['currency'], $data['role_title'], $data['employment_type'])), 422, 'Assign a salary structure or provide complete salary details.');

        $baseAmount = (float) ($data['amount'] ?? $structure?->monthly_salary);
        $attendance = TeacherAttendance::where('teacher_id', $teacher->id)->where('attendance_date', 'like', "{$data['payroll_month']}%");
        $lateCount = (clone $attendance)->where('status', 'late')->count();
        $absentCount = (clone $attendance)->where('status', 'absent')->count();
        $penalties = TeacherAttendanceSetting::where('user_id', $teacher->user_id)->first() ?? TeacherAttendanceSetting::whereNull('user_id')->first();
        $deduction = min($baseAmount, ($baseAmount * $lateCount * (float) ($penalties?->late_deduction_percent ?? 0) / 100) + ($baseAmount * $absentCount * (float) ($penalties?->absent_deduction_percent ?? 0) / 100));
        $payroll = TeacherPayroll::updateOrCreate(
            ['teacher_id' => $teacher->id, 'payroll_month' => $data['payroll_month']],
            [
                'salary_structure_id' => $structure?->id,
                'role_title' => $data['role_title'] ?? $structure?->role_title,
                'employment_type' => $data['employment_type'] ?? $structure?->employment_type,
                'amount' => $baseAmount - $deduction,
                'base_amount' => $baseAmount,
                'deduction_amount' => $deduction,
                'late_count' => $lateCount,
                'absent_count' => $absentCount,
                'currency' => $data['currency'] ?? $structure?->currency,
                'notes' => $data['notes'] ?? null,
                'created_by' => $request->user()->id,
            ]
        );
        return response()->json($payroll->load(['teacher', 'salaryStructure']));
    }

    public function markPaid(TeacherPayroll $payroll)
    {
        $payroll->update(['status' => 'paid', 'paid_at' => now()->toDateString()]);
        return response()->json($payroll->fresh(['teacher', 'salaryStructure']));
    }

    public function mySalary(Request $request)
    {
        $teacher = Teacher::where('user_id', $request->user()->id)->first();
        if (!$teacher) return response()->json(['monthly_salary' => null, 'annual_salary' => 0, 'annual_salary_estimate' => null, 'currency' => 'LRD', 'status' => 'pending', 'role_title' => null]);
        $month = now()->format('Y-m'); $year = now()->year;
        $current = TeacherPayroll::where('teacher_id', $teacher->id)->where('payroll_month', $month)->first();
        $annual = TeacherPayroll::where('teacher_id', $teacher->id)->where('payroll_month', 'like', "{$year}-%")->sum('amount');
        $monthlySalary = $current?->amount ?? $teacher->salaryStructure?->monthly_salary;
        return response()->json([
            'monthly_salary' => $monthlySalary,
            'currency' => $current?->currency ?? $teacher->salaryStructure?->currency ?? 'LRD',
            'status' => $current?->status ?? 'pending',
            'annual_salary' => (float) $annual,
            'annual_salary_estimate' => $monthlySalary !== null ? (float) $monthlySalary * 12 : null,
            'role_title' => $current?->role_title ?? $teacher->salaryStructure?->role_title,
        ]);
    }
}
