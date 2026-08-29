<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SyncLog extends Model
{
    protected $fillable = [
        'user_id',
        'device_uuid',
        'entity_type',
        'entity_uuid',
        'action',
        'status',
        'error_message',
        'data',
    ];

    protected $casts = [
        'data' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function device()
    {
        return $this->belongsTo(Device::class, 'device_uuid', 'device_uuid');
    }
}
