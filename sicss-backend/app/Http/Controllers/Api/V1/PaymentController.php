<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = Payment::with(['student', 'fee', 'recordedBy']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference_number', 'like', "%{$search}%")
                    ->orWhereHas('student', function ($sq) use ($search) {
                        $sq->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('student_id', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->has('fee_id')) {
            $query->where('fee_id', $request->fee_id);
        }

        if ($request->has('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }

        if ($request->has('from_date')) {
            $query->where('payment_date', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->where('payment_date', '<=', $request->to_date);
        }

        $payments = $query->orderBy('payment_date', 'desc')->paginate($request->per_page ?? 15);
        return response()->json($payments);
    }

    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'fee_id' => 'required|exists:fees,id',
            'amount' => 'required|numeric|min:0',
            'currency' => 'sometimes|in:USD,LRD',
            'payment_date' => 'required|date',
            'payment_method' => 'in:cash,bank_transfer,mobile_money,flutterwave,other',
            'reference_number' => 'nullable|string|max:255',
            'mobile_number' => 'nullable|string|max:30',
            'transaction_id' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'status' => 'in:pending,completed,cancelled,refunded',
            'proof' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        $proofPath = null;
        $proofUrl  = null;

        if ($request->hasFile('proof')) {
            $proofPath = $request->file('proof')->store('payment_proofs', 'public');
            $proofUrl  = url(\Illuminate\Support\Facades\Storage::url($proofPath));
        }

        $payment = Payment::create([
            'student_id'         => $request->student_id,
            'fee_id'             => $request->fee_id,
            'amount'             => $request->amount,
            'currency'           => $request->currency ?? 'LRD',
            'payment_date'       => $request->payment_date,
            'payment_method'     => $request->payment_method ?? 'cash',
            'reference_number'   => $request->reference_number,
            'mobile_number'      => $request->mobile_number,
            'transaction_id'     => $request->transaction_id,
            'notes'              => $request->notes,
            'status'             => $request->status ?? 'completed',
            'recorded_by'        => $request->user()->id,
            'payment_proof_path' => $proofPath,
            'payment_proof_url'  => $proofUrl,
        ]);

        $payment->load(['student', 'fee', 'recordedBy']);
        return response()->json($payment, 201);
    }

    public function show(Payment $payment)
    {
        $payment->load(['student', 'fee', 'recordedBy', 'receipts']);
        return response()->json($payment);
    }

    public function update(Request $request, Payment $payment)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0',
            'currency' => 'sometimes|in:USD,LRD',
            'payment_date' => 'required|date',
            'payment_method' => 'in:cash,bank_transfer,mobile_money,other',
            'reference_number' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'status' => 'in:pending,completed,cancelled,refunded',
        ]);

        $payment->update([
            'amount' => $request->amount,
            'currency' => $request->currency ?? 'LRD',
            'payment_date' => $request->payment_date,
            'payment_method' => $request->payment_method ?? 'cash',
            'reference_number' => $request->reference_number,
            'notes' => $request->notes,
            'status' => $request->status,
        ]);

        $payment->load(['student', 'fee', 'recordedBy']);
        return response()->json($payment);
    }

    public function destroy(Payment $payment)
    {
        $payment->delete();
        return response()->json(['message' => 'Payment deleted successfully']);
    }

    public function studentPayments(Request $request, $studentId)
    {
        $query = Payment::with(['fee', 'recordedBy'])
            ->where('student_id', $studentId);

        if ($request->has('academic_year')) {
            $query->whereHas('fee', function ($q) use ($request) {
                $q->where('academic_year', $request->academic_year);
            });
        }

        $payments = $query->orderBy('payment_date', 'desc')->get();
        return response()->json($payments);
    }
}
