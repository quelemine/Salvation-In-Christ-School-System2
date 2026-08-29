<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TeacherPayroll extends Model
{
    protected $fillable = ['teacher_id', 'salary_structure_id', 'payroll_month', 'role_title', 'employment_type', 'amount', 'base_amount', 'deduction_amount', 'late_count', 'absent_count', 'currency', 'status', 'paid_at', 'notes', 'created_by'];
    protected $casts = ['amount' => 'decimal:2', 'base_amount' => 'decimal:2', 'deduction_amount' => 'decimal:2', 'paid_at' => 'date'];
    public function teacher() { return $this->belongsTo(Teacher::class); }
    public function salaryStructure() { return $this->belongsTo(SalaryStructure::class); }
}
