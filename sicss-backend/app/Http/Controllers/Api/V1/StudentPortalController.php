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
    /**
     * Resolve the student record for the authenticated user.
     * - Student: matched by user_id
     * - Parent:  matched by parent_guardian_email OR a specific student_id query param
     *            (so parents with multiple children can switch between them)
     */
    private function student(Request $request): Student
    {
        $student = Student::with('class')->where('user_id', $request->user()->id)->first();

        if (!$student && $request->user()->role?->slug === 'parent') {
            $query = Student::with('class')
                ->where('parent_guardian_email', $request->user()->email);

            // Allow parent to request a specific child's data
            if ($request->filled('student_id')) {
                $query->where('id', $request->integer('student_id'));
            }

            $student = $query->first();
            abort_unless($student, 404, 'No student profile is linked to this parent account.');
        } else {
            abort_unless($student, 404, 'No student profile is linked to this account.');
        }

        return $student;
    }

    /**
     * List all children linked to the authenticated parent account.
     * Returns an empty array for non-parent users (students call /profile instead).
     */
    public function children(Request $request)
    {
        if ($request->user()->role?->slug !== 'parent') {
            return response()->json([]);
        }

        $children = Student::with('class:id,name,section')
            ->where('parent_guardian_email', $request->user()->email)
            ->get(['id', 'student_id', 'first_name', 'last_name', 'class_id',
                   'photo_url', 'status', 'application_status', 'admission_date']);

        return response()->json($children);
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
