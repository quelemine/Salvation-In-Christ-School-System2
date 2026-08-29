<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class TeacherAttendance extends Model {
    protected $fillable = ['teacher_id', 'user_id', 'attendance_date', 'attendance_type', 'status', 'check_in_time', 'remarks', 'recorded_by'];
    protected $casts = ['attendance_date' => 'date'];
    public function teacher() { return $this->belongsTo(Teacher::class); }
    public function user() { return $this->belongsTo(User::class); }
}
