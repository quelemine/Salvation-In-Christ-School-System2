<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FeeStructure extends Model
{
    protected $fillable = [
        'name', 'academic_year', 'class_id', 'applies_to', 'description', 'is_active',
    ];

    protected $casts = ['is_active' => 'boolean'];

    public function class(): BelongsTo
    {
        return $this->belongsTo(ClassModel::class, 'class_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(FeeStructureItem::class);
    }

    public function totalAmount(): float
    {
        return (float) $this->items->sum('amount');
    }
}
