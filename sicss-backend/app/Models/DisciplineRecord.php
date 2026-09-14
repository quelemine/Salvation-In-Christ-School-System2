<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DisciplineRecord extends Model
{
    protected $fillable = [
        'student_id',
        'type',
        'title',
        'description',
        'incident_date',
        'report_date',
        'reported_by',
        'teacher_id',
        'severity',
        'status',
        'action_taken',
        'notes',
        'is_resolved',
        'resolved_date',
        'resolved_by',
    ];

    protected $casts = [
        'incident_date' => 'date',
        'report_date' => 'date',
        'resolved_date' => 'date',
        'is_resolved' => 'boolean',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }

    public function resolver()
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    public function scopeByStudent($query, $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeBySeverity($query, $severity)
    {
        return $query->where('severity', $severity);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeResolved($query)
    {
        return $query->where('is_resolved', true);
    }

    public function scopeUnresolved($query)
    {
        return $query->where('is_resolved', false);
    }

    public function scopePositive($query)
    {
        return $query->whereIn('type', ['merit', 'commendation']);
    }

    public function scopeNegative($query)
    {
        return $query->whereIn('type', ['warning', 'suspension', 'expulsion']);
    }
}
