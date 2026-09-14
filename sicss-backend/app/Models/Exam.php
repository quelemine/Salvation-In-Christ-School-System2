<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Exam extends Model
{
    protected $fillable = [
        'name',
        'description',
        'type',
        'exam_date',
        'start_time',
        'end_time',
        'duration_minutes',
        'total_marks',
        'passing_marks',
        'subject_id',
        'class_id',
        'division_id',
        'created_by',
        'is_published',
        'academic_year',
    ];

    protected $casts = [
        'exam_date' => 'date',
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'is_published' => 'boolean',
        'total_marks' => 'integer',
        'passing_marks' => 'integer',
        'duration_minutes' => 'integer',
    ];

    public function subject()
    {
        return $this->belongsTo(\App\Models\Subject::class);
    }

    public function class()
    {
        return $this->belongsTo(\App\Models\ClassModel::class, 'class_id');
    }

    public function division()
    {
        return $this->belongsTo(\App\Models\Division::class);
    }

    public function creator()
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }

    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeByAcademicYear($query, $year)
    {
        return $query->where('academic_year', $year);
    }

    public function scopeUpcoming($query)
    {
        return $query->where('exam_date', '>=', now());
    }

    public function scopePast($query)
    {
        return $query->where('exam_date', '<', now());
    }
}
