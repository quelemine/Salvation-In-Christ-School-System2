<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Hostel extends Model
{
    protected $fillable = [
        'name',
        'description',
        'location',
        'total_rooms',
        'capacity',
        'warden_name',
        'warden_phone',
        'added_by',
        'is_active',
    ];

    protected $casts = [
        'total_rooms' => 'integer',
        'capacity' => 'integer',
        'is_active' => 'boolean',
    ];

    public function addedBy()
    {
        return $this->belongsTo(User::class, 'added_by');
    }

    public function assignments()
    {
        return $this->hasMany(HostelAssignment::class, 'hostel_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByLocation($query, $location)
    {
        return $query->where('location', 'like', "%{$location}%");
    }
}
