<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportCard extends Model
{
    protected $fillable = [
        'student_id', 'class_id', 'teacher_id', 'academic_year', 'grade_level', 'subject_marks',
        'aggregate', 'average', 'rank', 'total_in_class', 'conduct', 'promotion_status',
        'conditional_subjects', 'promoted_to', 'class_sponsor', 'principal', 'closing_date',
        'approval_status', 'sponsor_approved_by', 'sponsor_approved_at', 'vpi_approved_by', 'vpi_approved_at', 'rejection_reason',
        'comments',
    ];

    protected $casts = [
        'subject_marks' => 'array',
        'aggregate'     => 'decimal:2',
        'average'       => 'decimal:2',
        'comments'      => 'array',
    ];

    public function student(): BelongsTo { return $this->belongsTo(Student::class); }
    public function class(): BelongsTo { return $this->belongsTo(ClassModel::class); }
    public function teacher(): BelongsTo { return $this->belongsTo(Teacher::class); }
}
