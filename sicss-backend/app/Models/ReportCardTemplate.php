<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReportCardTemplate extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'grade_level_type',
        'assessment_periods',
        'grading_method',
        'grading_scale',
        'is_active',
    ];

    protected $casts = [
        'assessment_periods' => 'array',
        'grading_scale' => 'array',
        'is_active' => 'boolean',
    ];

    public function reportCards()
    {
        return $this->hasMany(ReportCard::class);
    }
}
