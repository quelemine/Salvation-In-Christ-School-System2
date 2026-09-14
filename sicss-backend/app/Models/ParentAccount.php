<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ParentAccount extends Model
{
    protected $fillable = [
        'user_id',
        'relationship',
        'phone',
        'address',
        'emergency_contact',
        'receive_notifications',
        'receive_sms',
        'receive_email',
    ];

    protected $casts = [
        'receive_notifications' => 'boolean',
        'receive_sms' => 'boolean',
        'receive_email' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scopeByRelationship($query, $relationship)
    {
        return $query->where('relationship', $relationship);
    }

    public function scopeReceiveNotifications($query)
    {
        return $query->where('receive_notifications', true);
    }
}
