<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransportationVehicle extends Model
{
    protected $fillable = [
        'vehicle_number',
        'vehicle_type',
        'capacity',
        'driver_name',
        'driver_phone',
        'route',
        'description',
        'added_by',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function addedBy()
    {
        return $this->belongsTo(User::class, 'added_by');
    }

    public function assignments()
    {
        return $this->hasMany(TransportationAssignment::class, 'vehicle_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('vehicle_type', $type);
    }

    public function scopeByRoute($query, $route)
    {
        return $query->where('route', 'like', "%{$route}%");
    }
}
