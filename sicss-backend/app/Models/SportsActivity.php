<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SportsActivity extends Model
{
    protected $fillable = [
        'name',
        'description',
        'category',
        'coach_id',
        'venue',
        'schedule',
        'start_date',
        'end_date',
        'capacity',
        'added_by',
        'is_active',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'capacity' => 'integer',
        'is_active' => 'boolean',
    ];

    public function coach()
    {
        return $this->belongsTo(Teacher::class, 'coach_id');
    }

    public function addedBy()
    {
        return $this->belongsTo(User::class, 'added_by');
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
