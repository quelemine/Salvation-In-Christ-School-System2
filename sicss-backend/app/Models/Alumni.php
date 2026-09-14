<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class Alumni extends Model
{
    protected $table = 'alumni';

    protected $fillable = [
        'student_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'graduation_year',
        'current_occupation',
        'current_employer',
        'address',
        'bio',
        'is_active',
        'wants_newsletter',
        'added_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'wants_newsletter' => 'boolean',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id', 'student_id');
    }

    public function addedBy()
    {
        return $this->belongsTo(User::class, 'added_by', 'id');
    }

    public function scopeByGraduationYear($query, $year)
    {
        return $query->where('graduation_year', $year);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeWantsNewsletter($query)
    {
        return $query->where('wants_newsletter', true);
    }

    public function getFullNameAttribute()
    {
        return "{$this->first_name} {$this->last_name}";
    }
}
