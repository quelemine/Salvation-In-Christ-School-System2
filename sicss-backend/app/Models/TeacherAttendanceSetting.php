<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class TeacherAttendanceSetting extends Model {
    protected $fillable = ['user_id', 'late_deduction_percent', 'absent_deduction_percent', 'updated_by'];
    protected $casts = ['late_deduction_percent' => 'decimal:2', 'absent_deduction_percent' => 'decimal:2'];
}
