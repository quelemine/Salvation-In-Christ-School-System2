<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HelpdeskReply extends Model
{
    protected $table = 'helpdesk_replies';

    protected $fillable = ['ticket_id', 'user_id', 'message', 'is_staff_reply'];

    protected $casts = ['is_staff_reply' => 'boolean'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(HelpdeskTicket::class, 'ticket_id');
    }
}
