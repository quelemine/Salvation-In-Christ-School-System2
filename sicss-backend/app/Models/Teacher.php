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
        'emergency_contact_name',
        'emergency_contact_phone',
        'next_of_kin_name',
        'next_of_kin_phone',
        'next_of_kin_relationship',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'hire_date' => 'date',
    ];

    public static function boot()
    {
        parent::boot();
        
        static::creating(function ($teacher) {
            if ($teacher->employee_id) {
                if (static::where('employee_id', $teacher->employee_id)->exists()) {
                    throw new \Illuminate\Database\QueryException("Duplicate employee_id: {$teacher->employee_id}");
                }
                if (\App\Models\User::where('user_code', $teacher->employee_id)->exists()) {
                    throw new \Illuminate\Database\QueryException("employee_id conflicts with existing user_code: {$teacher->employee_id}");
                }
            }
        });
        
        static::updating(function ($teacher) {
            if ($teacher->isDirty('employee_id') && $teacher->employee_id) {
                if (static::where('employee_id', $teacher->employee_id)->where('id', '!=', $teacher->id)->exists()) {
                    throw new \Illuminate\Database\QueryException("Duplicate employee_id: {$teacher->employee_id}");
                }
                if (\App\Models\User::where('user_code', $teacher->employee_id)->exists()) {
                    throw new \Illuminate\Database\QueryException("employee_id conflicts with existing user_code: {$teacher->employee_id}");
                }
            }
        });
    }

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

    // Teaching responsibility checks
    public function isSubjectTeacher(): bool
    {
        return $this->subjectClassAssignments()->exists();
    }

    public function isClassSponsor(): bool
    {
        return $this->sponsoredClass()->exists();
    }

    public function hasSubjectAssignment(int $subjectId, int $classId): bool
    {
        return $this->subjectClassAssignments()
            ->where('subject_id', $subjectId)
            ->where('class_id', $classId)
            ->exists();
    }

    public function isSponsorOfClass(int $classId): bool
    {
        return $this->sponsoredClass()->where('id', $classId)->exists();
    }
}
