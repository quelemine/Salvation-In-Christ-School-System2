<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LearningArea extends Model
{
    protected $fillable = [
        'name',
        'code',
        'grade_level_type',
        'order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
