<?php

namespace App\Traits;

use Illuminate\Support\Str;

trait Syncable
{
    /**
     * Boot the syncable trait
     */
    protected static function bootSyncable()
    {
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = Str::uuid();
            }
            if (empty($model->sync_status)) {
                $model->sync_status = 'synced';
            }
            if (empty($model->version)) {
                $model->version = 1;
            }
        });

        static::updating(function ($model) {
            $model->version = ($model->version ?? 0) + 1;
            $model->sync_status = 'synced';
            $model->last_synced_at = now();
        });
    }

    /**
     * Mark record as pending sync
     */
    public function markAsPendingSync(): void
    {
        $this->sync_status = 'pending';
        $this->save();
    }

    /**
     * Mark record as synced
     */
    public function markAsSynced(): void
    {
        $this->sync_status = 'synced';
        $this->last_synced_at = now();
        $this->save();
    }

    /**
     * Mark record as conflict
     */
    public function markAsConflict(): void
    {
        $this->sync_status = 'conflict';
        $this->save();
    }

    /**
     * Check if record needs sync
     */
    public function needsSync(): bool
    {
        return $this->sync_status === 'pending';
    }

    /**
     * Check if record has conflict
     */
    public function hasConflict(): bool
    {
        return $this->sync_status === 'conflict';
    }

    /**
     * Get sync status
     */
    public function getSyncStatus(): string
    {
        return $this->sync_status ?? 'synced';
    }

    /**
     * Increment version
     */
    public function incrementVersion(): void
    {
        $this->version = ($this->version ?? 0) + 1;
        $this->save();
    }
}
