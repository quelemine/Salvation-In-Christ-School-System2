<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Receipt;
use Illuminate\Http\Request;

class ReceiptController extends Controller
{
    public function index(Request $request)
    {
        $query = Receipt::with(['payment', 'student', 'generatedBy']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('receipt_number', 'like', "%{$search}%");
        }

        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->has('from_date')) {
            $query->where('receipt_date', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->where('receipt_date', '<=', $request->to_date);
        }

        $receipts = $query->orderBy('receipt_date', 'desc')->paginate($request->per_page ?? 15);
        return response()->json($receipts);
    }

    public function store(Request $request)
    {
        $request->validate([
            'payment_id' => 'required|exists:payments,id',
            'student_id' => 'required|exists:students,id',
            'total_amount' => 'required|numeric|min:0',
            'currency' => 'sometimes|in:USD,LRD',
            'receipt_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $payment = Payment::find($request->payment_id);

        $receipt = Receipt::create([
            'payment_id' => $request->payment_id,
            'student_id' => $request->student_id,
            'total_amount' => $request->total_amount,
            'currency' => $request->currency ?? 'LRD',
            'receipt_date' => $request->receipt_date,
            'generated_by' => $request->user()->id,
            'notes' => $request->notes,
        ]);

        $receipt->load(['payment', 'student', 'generatedBy']);
        return response()->json($receipt, 201);
    }

    public function show(Receipt $receipt)
    {
        $receipt->load(['payment', 'student', 'generatedBy']);
        return response()->json($receipt);
    }

    public function destroy(Receipt $receipt)
    {
        $receipt->delete();
        return response()->json(['message' => 'Receipt deleted successfully']);
    }
}
