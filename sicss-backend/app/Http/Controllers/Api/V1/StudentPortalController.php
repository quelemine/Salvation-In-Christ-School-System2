<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\Attendance;
use App\Models\Fee;
use App\Models\Payment;
use App\Models\Student;
use Illuminate\Http\Request;

class StudentPortalController extends Controller
{
    private function student(Request $request): Student
    {
        abort_unless($student = Student::with('class')->where('user_id', $request->user()->id)->first(), 404, 'No student profile is linked to this account.');
        return $student;
    }

    public function profile(Request $request)
    {
        $student = $this->student($request);
        // This endpoint is scoped to the authenticated student's own record.
        // It provides the complete registration/application information for the
        // read-only profile screen.
        return response()->json($student);
    }

    public function attendance(Request $request)
    {
        return response()->json(Attendance::where('student_id', $this->student($request)->id)->orderByDesc('date')->get(['id', 'date', 'status', 'remarks']));
    }

    public function assignments(Request $request)
    {
        $student = $this->student($request);
        return response()->json(Assignment::with('subject:id,code,name', 'teacher:id,first_name,last_name')->where('class_id', $student->class_id)->where('status', 'published')->orderBy('due_date')->get());
    }

    public function financialRecords(Request $request)
    {
        $student = $this->student($request);
        $fees = Fee::where('class_id', $student->class_id)->where('status', 'active')->orderBy('due_date')->get();
        $payments = Payment::with('fee:id,name,amount,currency')->where('student_id', $student->id)->where('status', 'completed')->orderByDesc('payment_date')->get();
        return response()->json(['fees' => $fees, 'payments' => $payments, 'total_due' => (float) $fees->sum('amount'), 'total_paid' => (float) $payments->sum('amount'), 'balance' => (float) $fees->sum('amount') - (float) $payments->sum('amount')]);
    }
}
