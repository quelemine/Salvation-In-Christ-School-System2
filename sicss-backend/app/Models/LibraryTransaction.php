<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LibraryTransaction extends Model
{
    protected $fillable = [
        'book_id',
        'student_id',
        'teacher_id',
        'issued_by',
        'returned_by',
        'issue_date',
        'due_date',
        'return_date',
        'status',
        'notes',
        'fine_amount',
        'fine_paid',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'due_date' => 'date',
        'return_date' => 'date',
        'fine_amount' => 'decimal:2',
        'fine_paid' => 'boolean',
    ];

    public function book()
    {
        return $this->belongsTo(LibraryBook::class, 'book_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }

    public function issuedBy()
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    public function returnedBy()
    {
        return $this->belongsTo(User::class, 'returned_by');
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeOverdue($query)
    {
        return $query->where('due_date', '<', now())->where('status', '!=', 'returned');
    }

    public function scopeByBook($query, $bookId)
    {
        return $query->where('book_id', $bookId);
    }

    public function scopeByStudent($query, $studentId)
    {
        return $query->where('student_id', $studentId);
    }
}
