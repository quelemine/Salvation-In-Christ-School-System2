<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransportationAssignment extends Model
{
    protected $fillable = [
        'vehicle_id',
        'student_id',
        'teacher_id',
        'pickup_location',
        'dropoff_location',
        'pickup_time',
        'dropoff_time',
        'assigned_by',
        'is_active',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'pickup_time' => 'datetime',
        'dropoff_time' => 'datetime',
        'start_date' => 'date',
        'end_date' => 'date',
        'is_active' => 'boolean',
    ];

    public function vehicle()
    {
        return $this->belongsTo(TransportationVehicle::class, 'vehicle_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }

    public function assignedBy()
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByVehicle($query, $vehicleId)
    {
        return $query->where('vehicle_id', $vehicleId);
    }

    public function scopeByStudent($query, $studentId)
    {
        return $query->where('student_id', $studentId);
    }
}
