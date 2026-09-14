<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LibraryBook extends Model
{
    protected $fillable = [
        'isbn',
        'title',
        'author',
        'publisher',
        'publication_year',
        'category',
        'total_copies',
        'available_copies',
        'location',
        'description',
        'added_by',
        'is_available',
    ];

    protected $casts = [
        'publication_year' => 'date',
        'total_copies' => 'integer',
        'available_copies' => 'integer',
        'is_available' => 'boolean',
    ];

    public function addedBy()
    {
        return $this->belongsTo(User::class, 'added_by');
    }

    public function transactions()
    {
        return $this->hasMany(LibraryTransaction::class, 'book_id');
    }

    public function scopeAvailable($query)
    {
        return $query->where('is_available', true)->where('available_copies', '>', 0);
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    public function scopeByAuthor($query, $author)
    {
        return $query->where('author', 'like', "%{$author}%");
    }

    public function scopeSearch($query, $search)
    {
        return $query->where('title', 'like', "%{$search}%")
                    ->orWhere('author', 'like', "%{$search}%")
                    ->orWhere('isbn', 'like', "%{$search}%");
    }
}
