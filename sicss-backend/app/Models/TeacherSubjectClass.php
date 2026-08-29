<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeacherSubjectClass extends Model
{
    protected $table = 'teacher_subject_class';

    protected $fillable = ['teacher_id', 'subject_id', 'class_id'];

    public function teacher(): BelongsTo { return $this->belongsTo(Teacher::class); }
    public function subject(): BelongsTo { return $this->belongsTo(Subject::class); }
    public function class(): BelongsTo { return $this->belongsTo(ClassModel::class, 'class_id'); }
}
