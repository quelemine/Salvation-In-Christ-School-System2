<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\LibraryTransaction;
use App\Models\LibraryBook;
use Illuminate\Http\Request;

class LibraryTransactionController extends Controller
{
    public function index(Request $request)
    {
        $query = LibraryTransaction::with(['book', 'student', 'teacher', 'issuedBy', 'returnedBy']);

        if ($request->has('status')) {
            $query->byStatus($request->status);
        }

        if ($request->has('book_id')) {
            $query->byBook($request->book_id);
        }

        if ($request->has('student_id')) {
            $query->byStudent($request->student_id);
        }

        if ($request->has('overdue')) {
            $query->overdue();
        }

        $transactions = $query->orderBy('issue_date', 'desc')->get();
        return response()->json($transactions);
    }

    public function store(Request $request)
    {
        $request->validate([
            'book_id' => 'required|exists:library_books,id',
            'student_id' => 'nullable|exists:students,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'issue_date' => 'required|date',
            'due_date' => 'required|date|after:issue_date',
            'notes' => 'nullable|string',
        ]);

        $book = LibraryBook::findOrFail($request->book_id);
        
        if ($book->available_copies <= 0) {
            return response()->json(['message' => 'No copies available'], 400);
        }

        $transaction = LibraryTransaction::create([
            'book_id' => $request->book_id,
            'student_id' => $request->student_id,
            'teacher_id' => $request->teacher_id,
            'issued_by' => auth()->id(),
            'issue_date' => $request->issue_date,
            'due_date' => $request->due_date,
            'status' => 'issued',
            'notes' => $request->notes,
        ]);

        $book->decrement('available_copies');
        if ($book->available_copies === 0) {
            $book->update(['is_available' => false]);
        }

        return response()->json($transaction, 201);
    }

    public function show($id)
    {
        $transaction = LibraryTransaction::with(['book', 'student', 'teacher', 'issuedBy', 'returnedBy'])->findOrFail($id);
        return response()->json($transaction);
    }

    public function returnBook(Request $request, $id)
    {
        $transaction = LibraryTransaction::findOrFail($id);
        
        if ($transaction->status === 'returned') {
            return response()->json(['message' => 'Book already returned'], 400);
        }

        $request->validate([
            'return_date' => 'required|date',
            'fine_amount' => 'nullable|numeric|min:0',
        ]);

        $transaction->update([
            'return_date' => $request->return_date,
            'returned_by' => auth()->id(),
            'status' => 'returned',
            'fine_amount' => $request->fine_amount ?? 0,
        ]);

        $book = LibraryBook::findOrFail($transaction->book_id);
        $book->increment('available_copies');
        $book->update(['is_available' => true]);

        return response()->json($transaction);
    }

    public function update(Request $request, $id)
    {
        $transaction = LibraryTransaction::findOrFail($id);

        $request->validate([
            'status' => 'required|in:issued,returned,overdue,lost',
            'fine_amount' => 'nullable|numeric|min:0',
            'fine_paid' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        $transaction->update([
            'status' => $request->status,
            'fine_amount' => $request->fine_amount ?? $transaction->fine_amount,
            'fine_paid' => $request->fine_paid ?? $transaction->fine_paid,
            'notes' => $request->notes,
        ]);

        return response()->json($transaction);
    }

    public function destroy($id)
    {
        $transaction = LibraryTransaction::findOrFail($id);
        $transaction->delete();
        return response()->json(['message' => 'Transaction deleted successfully']);
    }
}
