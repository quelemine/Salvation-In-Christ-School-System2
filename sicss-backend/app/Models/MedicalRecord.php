<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MedicalRecord extends Model
{
    protected $fillable = [
        'student_id',
        'teacher_id',
        'record_date',
        'condition',
        'symptoms',
        'diagnosis',
        'treatment',
        'medication',
        'dosage',
        'prescription_date',
        'recorded_by',
        'is_confidential',
        'notes',
    ];

    protected $casts = [
        'record_date' => 'date',
        'prescription_date' => 'date',
        'is_confidential' => 'boolean',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }

    public function recordedBy()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function scopeByStudent($query, $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    public function scopeByTeacher($query, $teacherId)
    {
        return $query->where('teacher_id', $teacherId);
    }

    public function scopeByDate($query, $date)
    {
        return $query->where('record_date', $date);
    }

    public function scopeConfidential($query)
    {
        return $query->where('is_confidential', true);
    }
}
