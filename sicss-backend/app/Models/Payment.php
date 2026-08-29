<?php

namespace App\Models;

use App\Traits\Syncable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payment extends Model
{
    use SoftDeletes, Syncable;

    protected $fillable = [
        'student_id',
        'fee_id',
        'amount',
        'currency',
        'payment_date',
        'payment_method',
        'reference_number',
        'mobile_number',
        'transaction_id',
        'notes',
        'status',
        'recorded_by',
        'payment_proof_path',
        'payment_proof_url',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'currency' => 'string',
        'payment_date' => 'date',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function fee()
    {
        return $this->belongsTo(Fee::class);
    }

    public function recordedBy()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function receipts()
    {
        return $this->hasMany(Receipt::class);
    }

    public function getBalanceAttribute()
    {
        return $this->fee->amount - $this->amount;
    }

    public function getPaymentStatusAttribute()
    {
        $balance = $this->balance;
        if ($balance <= 0) {
            return 'paid';
        } elseif ($balance > 0 && $balance < $this->fee->amount) {
            return 'partial';
        } else {
            return 'pending';
        }
    }
}
