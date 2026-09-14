<?php

namespace App\Models;

use App\Traits\Syncable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use SoftDeletes, Syncable;

    protected $fillable = [
        'user_id', 'student_id', 'class_id', 'first_name', 'last_name',
        'date_of_birth', 'place_of_birth', 'nationality', 'county',
        'gender', 'previous_school',
        'parent_guardian_name', 'parent_guardian_phone', 'parent_guardian_email',
        'father_name', 'mother_name', 'father_occupation', 'mother_occupation',
        'father_contact', 'mother_contact', 'parent_address',
        'phone', 'address', 'photo', 'photo_url', 'admission_date', 'status',
        'has_illness', 'illness_details', 'emergency_contact_name', 'emergency_contact_phone',
        'sports_interest', 'additional_notes',
        'registration_number', 'class_assigned',
        'approved_by_registrar', 'approved_by_principal', 'approval_date', 'application_status',
        'fees_cleared', 'clearance_academic_year', 'cleared_at', 'cleared_by',
    ];

    protected $casts = [
        'date_of_birth'  => 'date',
        'admission_date' => 'date',
        'approval_date'  => 'date',
        'fees_cleared'   => 'boolean',
        'cleared_at'     => 'datetime',
        'has_illness'    => 'boolean',
    ];

    public static function boot()
    {
        parent::boot();
        
        static::creating(function ($student) {
            if ($student->student_id) {
                if (static::where('student_id', $student->student_id)->exists()) {
                    throw new \Illuminate\Database\QueryException("Duplicate student_id: {$student->student_id}");
                }
                if (\App\Models\User::where('user_code', $student->student_id)->exists()) {
                    throw new \Illuminate\Database\QueryException("student_id conflicts with existing user_code: {$student->student_id}");
                }
            }
        });
        
        static::updating(function ($student) {
            if ($student->isDirty('student_id') && $student->student_id) {
                if (static::where('student_id', $student->student_id)->where('id', '!=', $student->id)->exists()) {
                    throw new \Illuminate\Database\QueryException("Duplicate student_id: {$student->student_id}");
                }
                if (\App\Models\User::where('user_code', $student->student_id)->exists()) {
                    throw new \Illuminate\Database\QueryException("student_id conflicts with existing user_code: {$student->student_id}");
                }
            }
        });
    }

    public function class(): BelongsTo
    {
        return $this->belongsTo(ClassModel::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getUserCodeAttribute(): string
    {
        return $this->user?->user_code ?? $this->student_id;
    }
}
