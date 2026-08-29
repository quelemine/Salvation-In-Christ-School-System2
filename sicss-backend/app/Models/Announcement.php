<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Announcement extends Model
{
    protected $fillable = [
        'created_by', 'title', 'body', 'priority', 'category',
        'audience', 'is_active', 'publish_at', 'expires_at',
    ];

    protected $casts = [
        'is_active'  => 'boolean',
        'publish_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope: active, published, not expired, visible to a specific user.
     */
    public function scopeVisibleTo($query, int $userId): void
    {
        $query->where('is_active', true)
              ->where(function ($q) {
                  $q->whereNull('publish_at')->orWhere('publish_at', '<=', now());
              })
              ->where(function ($q) {
                  $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
              })
              ->where(function ($q) use ($userId) {
                  $q->where('audience', 'all')
                    ->orWhereRaw("CONCAT(',', audience, ',') LIKE ?", ["%,{$userId},%"]);
              });
    }
}
