<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\LibraryBook;
use Illuminate\Http\Request;

class LibraryBookController extends Controller
{
    public function index(Request $request)
    {
        $query = LibraryBook::with(['addedBy']);

        if ($request->has('search')) {
            $query->search($request->search);
        }

        if ($request->has('category')) {
            $query->byCategory($request->category);
        }

        if ($request->has('available')) {
            $query->available();
        }

        $books = $query->orderBy('title')->get();
        return response()->json($books);
    }

    public function store(Request $request)
    {
        $request->validate([
            'isbn' => 'required|string|unique:library_books,isbn',
            'title' => 'required|string|max:255',
            'author' => 'required|string|max:255',
            'publisher' => 'nullable|string|max:255',
            'publication_year' => 'nullable|date',
            'category' => 'nullable|string|max:100',
            'total_copies' => 'required|integer|min:1',
            'location' => 'nullable|string|max:100',
            'description' => 'nullable|string',
        ]);

        $book = LibraryBook::create([
            'isbn' => $request->isbn,
            'title' => $request->title,
            'author' => $request->author,
            'publisher' => $request->publisher,
            'publication_year' => $request->publication_year,
            'category' => $request->category,
            'total_copies' => $request->total_copies,
            'available_copies' => $request->total_copies,
            'location' => $request->location,
            'description' => $request->description,
            'added_by' => auth()->id(),
            'is_available' => true,
        ]);

        return response()->json($book, 201);
    }

    public function show($id)
    {
        $book = LibraryBook::with(['addedBy', 'transactions'])->findOrFail($id);
        return response()->json($book);
    }

    public function update(Request $request, $id)
    {
        $book = LibraryBook::findOrFail($id);

        $request->validate([
            'isbn' => 'required|string|unique:library_books,isbn,' . $id,
            'title' => 'required|string|max:255',
            'author' => 'required|string|max:255',
            'publisher' => 'nullable|string|max:255',
            'publication_year' => 'nullable|date',
            'category' => 'nullable|string|max:100',
            'total_copies' => 'required|integer|min:1',
            'location' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'is_available' => 'boolean',
        ]);

        $book->update([
            'isbn' => $request->isbn,
            'title' => $request->title,
            'author' => $request->author,
            'publisher' => $request->publisher,
            'publication_year' => $request->publication_year,
            'category' => $request->category,
            'total_copies' => $request->total_copies,
            'location' => $request->location,
            'description' => $request->description,
            'is_available' => $request->is_available ?? true,
        ]);

        return response()->json($book);
    }

    public function destroy($id)
    {
        $book = LibraryBook::findOrFail($id);
        $book->delete();
        return response()->json(['message' => 'Book deleted successfully']);
    }
}
