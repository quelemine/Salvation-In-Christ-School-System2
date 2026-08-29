<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FeeStructureItem extends Model
{
    protected $fillable = [
        'fee_structure_id', 'label', 'amount', 'currency', 'category', 'is_mandatory', 'due_date',
    ];

    protected $casts = [
        'amount'       => 'decimal:2',
        'is_mandatory' => 'boolean',
        'due_date'     => 'date',
    ];

    public function structure(): BelongsTo
    {
        return $this->belongsTo(FeeStructure::class, 'fee_structure_id');
    }
}
