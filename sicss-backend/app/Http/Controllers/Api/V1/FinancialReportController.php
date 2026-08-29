<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Fee;
use App\Models\Payment;
use App\Models\Receipt;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class FinancialReportController extends Controller
{
    public function sendManagementReport(Request $request)
    {
        $data = $request->validate([
            'month' => ['required', 'date_format:Y-m'],
        ]);

        $payments = Payment::where('payment_date', 'like', "{$data['month']}%");
        $completed = (clone $payments)->where('status', 'completed');
        $currencyTotals = [
            'LRD' => (float) (clone $completed)->where('currency', 'LRD')->sum('amount'),
            'USD' => (float) (clone $completed)->where('currency', 'USD')->sum('amount'),
        ];
        $methodTotals = (clone $completed)->selectRaw('payment_method, currency, SUM(amount) as total, COUNT(*) as payment_count')
            ->groupBy('payment_method', 'currency')->orderBy('payment_method')->get();
        $summary = [
            'month' => $data['month'],
            'income' => $currencyTotals,
            'completed_payments' => (clone $completed)->count(),
            'pending_payments' => (clone $payments)->where('status', 'pending')->count(),
            'refunded_payments' => (clone $payments)->where('status', 'refunded')->count(),
            'cancelled_payments' => (clone $payments)->where('status', 'cancelled')->count(),
            'payment_methods' => $methodTotals,
        ];

        $recipients = User::query()->with('role')
            ->where('is_active', true)
            ->whereHas('role', fn ($query) => $query->whereIn('slug', ['admin', 'head-of-school']))
            ->pluck('email')->filter()->unique()->values();

        if ($recipients->isEmpty()) {
            return response()->json(['message' => 'No active Admin or Head of School recipient is configured.'], 422);
        }

        $lines = [
            "Financial management report: {$summary['month']}",
            "Completed income — LRD: " . number_format($summary['income']['LRD'], 2),
            "Completed income — USD: " . number_format($summary['income']['USD'], 2),
            "Completed payments: {$summary['completed_payments']}",
            "Pending payments: {$summary['pending_payments']}",
            "Refunded payments: {$summary['refunded_payments']}",
            "Cancelled payments: {$summary['cancelled_payments']}",
            '', 'Income by payment method:',
        ];
        foreach ($methodTotals as $item) {
            $lines[] = ucfirst(str_replace('_', ' ', $item->payment_method)) . " ({$item->currency}): " . number_format((float) $item->total, 2) . " across {$item->payment_count} payment(s)";
        }

        Mail::raw(implode(PHP_EOL, $lines), function ($message) use ($recipients, $data) {
            $message->to($recipients->all())->subject("Financial management report — {$data['month']}");
        });

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'user_email' => $request->user()->email,
            'event' => 'financial_report_sent',
            'description' => "Sent financial management report for {$data['month']} to " . $recipients->implode(', '),
            'ip_address' => $request->ip(),
            'device_type' => 'Desktop',
            'browser' => 'Other',
            'platform' => 'Other',
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json(['message' => 'Financial management report sent.', 'summary' => $summary, 'recipients' => $recipients]);
    }

    public function dailyPayments(Request $request)
    {
        $date = $request->date ?? now()->toDateString();

        $payments = Payment::with(['student', 'fee'])
            ->where('payment_date', $date)
            ->where('status', 'completed')
            ->get();

        $total = $payments->sum('amount');

        return response()->json([
            'date' => $date,
            'total_amount' => $total,
            'payment_count' => $payments->count(),
            'payments' => $payments,
        ]);
    }

    public function monthlyPayments(Request $request)
    {
        $month = $request->month ?? now()->format('Y-m');

        $payments = Payment::with(['student', 'fee'])
            ->where('payment_date', 'like', "{$month}%")
            ->where('status', 'completed')
            ->get();

        $total = $payments->sum('amount');

        return response()->json([
            'month' => $month,
            'total_amount' => $total,
            'payment_count' => $payments->count(),
            'payments' => $payments,
        ]);
    }

    public function classReport(Request $request)
    {
        $request->validate([
            'class_id' => 'required|exists:classes,id',
            'academic_year' => 'required|string',
        ]);

        $fees = Fee::where('class_id', $request->class_id)
            ->where('academic_year', $request->academic_year)
            ->with('payments.student')
            ->get();

        $totalFees = $fees->sum('amount');
        $totalCollected = $fees->sum(function ($fee) {
            return $fee->payments->where('status', 'completed')->sum('amount');
        });
        $totalOutstanding = $totalFees - $totalCollected;

        return response()->json([
            'class_id' => $request->class_id,
            'academic_year' => $request->academic_year,
            'total_fees' => $totalFees,
            'total_collected' => $totalCollected,
            'total_outstanding' => $totalOutstanding,
            'fees' => $fees,
        ]);
    }

    public function outstandingBalances(Request $request)
    {
        $academicYear = $request->academic_year ?? '2024-2025';

        $fees = Fee::where('academic_year', $academicYear)
            ->where('status', 'active')
            ->with('class')
            ->get();

        $outstanding = [];

        foreach ($fees as $fee) {
            $totalCollected = $fee->payments->where('status', 'completed')->sum('amount');
            $balance = $fee->amount - $totalCollected;

            if ($balance > 0) {
                $outstanding[] = [
                    'fee' => $fee,
                    'total_amount' => $fee->amount,
                    'collected' => $totalCollected,
                    'balance' => $balance,
                ];
            }
        }

        $totalOutstanding = collect($outstanding)->sum('balance');

        return response()->json([
            'academic_year' => $academicYear,
            'total_outstanding' => $totalOutstanding,
            'outstanding_fees' => $outstanding,
        ]);
    }

    public function studentFinancialHistory(Request $request, $studentId)
    {
        $payments = Payment::with(['fee', 'recordedBy'])
            ->where('student_id', $studentId)
            ->orderBy('payment_date', 'desc')
            ->get();

        $totalPaid = $payments->where('status', 'completed')->sum('amount');
        $totalFees = Fee::whereIn('id', $payments->pluck('fee_id'))->sum('amount');
        $balance = $totalFees - $totalPaid;

        return response()->json([
            'student_id' => $studentId,
            'total_fees' => $totalFees,
            'total_paid' => $totalPaid,
            'balance' => $balance,
            'payments' => $payments,
        ]);
    }
}
