<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Device extends Model
{
    protected $fillable = [
        'device_uuid',
        'user_id',
        'device_name',
        'platform',
        'platform_version',
        'app_version',
        'last_sync_at',
        'is_active',
    ];

    protected $casts = [
        'last_sync_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function syncLogs()
    {
        return $this->hasMany(SyncLog::class, 'device_uuid', 'device_uuid');
    }
}
