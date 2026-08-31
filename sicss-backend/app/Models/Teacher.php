<?php

namespace App\Models;

use App\Traits\Syncable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Teacher extends Model
{
    use SoftDeletes, Syncable;

    protected $fillable = [
        'user_id',
        'salary_structure_id',
        'employee_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'address',
        'photo',
        'credential_image_path',
        'gender',
        'date_of_birth',
        'hire_date',
        'qualifications',
        'specialization',
        'status',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'hire_date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function salaryStructure(): BelongsTo
    {
        return $this->belongsTo(SalaryStructure::class);
    }

    public function classes(): BelongsToMany
    {
        return $this->belongsToMany(ClassModel::class, 'class_teacher', 'teacher_id', 'class_id');
    }

    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'subject_teacher');
    }

    public function sponsoredClass(): HasOne
    {
        return $this->hasOne(ClassModel::class, 'sponsor_teacher_id');
    }

    public function subjectClassAssignments(): HasMany
    {
        return $this->hasMany(TeacherSubjectClass::class, 'teacher_id');
    }
    
    public function loadRelations()
    {
        return $this->load('user');
    }

    public function getAssignedClassIds()
    {
        return $this->classes()->pluck('id')->toArray();
    }

    public function getSubjectClassIds(): array
    {
        return $this->subjectClassAssignments()->pluck('class_id')->unique()->values()->all();
    }

    public function getUserCodeAttribute(): string
    {
        return $this->user?->user_code ?? $this->employee_id;
    }
}
