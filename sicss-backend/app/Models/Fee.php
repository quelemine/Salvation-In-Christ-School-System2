<?php

namespace App\Models;

use App\Traits\Syncable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Fee extends Model
{
    use SoftDeletes, Syncable;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'amount_lrd',
        'amount_usd',
        'class_id',
        'academic_year',
        'status',
        'is_mandatory',
        'due_date',
    ];

    protected $casts = [
        'amount_lrd' => 'decimal:2',
        'amount_usd' => 'decimal:2',
        'is_mandatory' => 'boolean',
        'due_date' => 'date',
    ];

    public function class()
    {
        return $this->belongsTo(ClassModel::class, 'class_id');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}
