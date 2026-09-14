<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HostelAssignment extends Model
{
    protected $fillable = [
        'hostel_id',
        'student_id',
        'teacher_id',
        'room_number',
        'bed_number',
        'assignment_date',
        'checkout_date',
        'assigned_by',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'assignment_date' => 'date',
        'checkout_date' => 'date',
        'is_active' => 'boolean',
    ];

    public function hostel()
    {
        return $this->belongsTo(Hostel::class, 'hostel_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }

    public function assignedBy()
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByHostel($query, $hostelId)
    {
        return $query->where('hostel_id', $hostelId);
    }

    public function scopeByStudent($query, $studentId)
    {
        return $query->where('student_id', $studentId);
    }
}
