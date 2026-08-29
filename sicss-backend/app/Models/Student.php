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
        'gender', 'previous_school', 'grade_applying_for',
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

    public function class(): BelongsTo
    {
        return $this->belongsTo(ClassModel::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
