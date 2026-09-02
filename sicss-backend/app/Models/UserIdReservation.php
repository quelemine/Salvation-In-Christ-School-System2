<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserIdReservation extends Model
{
    protected $fillable = [
        'user_code',
        'user_id',
        'year',
        'sequence',
        'prefix',
    ];
}
