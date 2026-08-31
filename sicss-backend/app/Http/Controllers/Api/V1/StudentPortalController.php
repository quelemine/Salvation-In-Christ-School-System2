<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\Attendance;
use App\Models\Fee;
use App\Models\Payment;
use App\Models\Student;
use App\Models\ReportCard;
use Illuminate\Http\Request;

class StudentPortalController extends Controller
{
    private function student(Request $request): Student
    {
        // Check if user is a student
        $student = Student::with('class')->where('user_id', $request->user()->id)->first();
        
        // If not a student, check if user is a parent/guardian
        if (!$student && $request->user()->role?->slug === 'parent') {
            // Find student(s) linked to this parent via parent_guardian_email
            $student = Student::with('class')
                ->where('parent_guardian_email', $request->user()->email)
                ->first();
            
            abort_unless($student, 404, 'No student profile is linked to this parent account.');
        } else {
            abort_unless($student, 404, 'No student profile is linked to this account.');
        }
        
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

    public function reportCard(Request $request)
    {
        $student = $this->student($request);
        $academicYear = $request->input('academic_year', date('Y'));
        
        $reportCard = ReportCard::with(['student.class', 'class', 'teacher'])
            ->where('student_id', $student->id)
            ->where('academic_year', $academicYear)
            ->first();
        
        if (!$reportCard) {
            return response()->json(['message' => 'No report card found for the specified academic year'], 404);
        }
        
        return response()->json($reportCard);
    }
}
