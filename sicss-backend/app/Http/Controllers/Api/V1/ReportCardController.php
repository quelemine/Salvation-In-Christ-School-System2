<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ReportCard;
use Illuminate\Http\Request;

class ReportCardController extends Controller
{
    public function index(Request $request)
    {
        $query = ReportCard::with(['student.class', 'class', 'teacher']);

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }
        if ($request->filled('class_id')) {
            $query->where('class_id', $request->class_id);
        }
        if ($request->filled('academic_year')) {
            $query->where('academic_year', $request->academic_year);
        }
        if ($request->filled('approval_status')) {
            $query->where('approval_status', $request->approval_status);
        }

        return response()->json($query->latest()->get());
    }

    public function show($id)
    {
        $reportCard = ReportCard::with(['student.class', 'class', 'teacher'])->find($id);
        
        if (!$reportCard) {
            return response()->json(['message' => 'Report card not found'], 404);
        }
        
        return response()->json($reportCard);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'student_id' => 'required|exists:students,id',
            'class_id' => 'required|exists:classes,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'academic_year' => 'required|string|max:20',
            'grade_level' => 'required|string|max:100',
            'subject_marks' => 'required|array',
            'aggregate' => 'nullable|numeric',
            'average' => 'nullable|numeric',
            'rank' => 'nullable|integer|min:1',
            'total_in_class' => 'nullable|integer|min:1',
            'conduct' => 'nullable|string',
            'promotion_status' => 'nullable|in:promoted,conditional,repeat,not_enrolled',
            'conditional_subjects' => 'nullable|string',
            'promoted_to' => 'nullable|string',
            'class_sponsor' => 'nullable|string',
            'principal' => 'nullable|string',
            'closing_date' => 'nullable|string',
        ]);

        $reportCard = ReportCard::updateOrCreate(
            ['student_id' => $data['student_id'], 'academic_year' => $data['academic_year']],
            $data
        );

        return response()->json($reportCard->load(['student.class', 'class', 'teacher']), 201);
    }

    public function update(Request $request, $id)
    {
        $reportCard = ReportCard::find($id);
        
        if (!$reportCard) {
            return response()->json(['message' => 'Report card not found'], 404);
        }

        $data = $request->validate([
            'class_id' => 'sometimes|required|exists:classes,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'grade_level' => 'sometimes|required|string|max:100',
            'subject_marks' => 'sometimes|required|array',
            'aggregate' => 'nullable|numeric',
            'average' => 'nullable|numeric',
            'rank' => 'nullable|integer|min:1',
            'total_in_class' => 'nullable|integer|min:1',
            'conduct' => 'nullable|string',
            'promotion_status' => 'nullable|in:promoted,conditional,repeat,not_enrolled',
            'conditional_subjects' => 'nullable|string',
            'promoted_to' => 'nullable|string',
            'class_sponsor' => 'nullable|string',
            'principal' => 'nullable|string',
            'closing_date' => 'nullable|string',
        ]);

        $reportCard->update($data);

        return response()->json($reportCard->load(['student.class', 'class', 'teacher']));
    }

    public function destroy($id)
    {
        $reportCard = ReportCard::find($id);
        
        if (!$reportCard) {
            return response()->json(['message' => 'Report card not found'], 404);
        }

        $reportCard->delete();

        return response()->json(['message' => 'Report card deleted successfully']);
    }

    public function mine(Request $request)
    {
        $student = \App\Models\Student::where('user_id', $request->user()->id)->first();
        
        if (!$student) {
            return response()->json(['message' => 'Student not found'], 404);
        }

        $reportCards = ReportCard::where('student_id', $student->id)
            ->where('approval_status', 'approved')
            ->with(['student.class', 'class', 'teacher'])
            ->latest()
            ->get();

        return response()->json($reportCards);
    }

    public function submitForApproval(Request $request, $id)
    {
        $reportCard = ReportCard::find($id);
        
        if (!$reportCard) {
            return response()->json(['message' => 'Report card not found'], 404);
        }

        if ($reportCard->approval_status !== 'draft') {
            return response()->json(['message' => 'Report card can only be submitted from draft status'], 400);
        }

        $reportCard->update([
            'approval_status' => 'pending_sponsor',
        ]);

        return response()->json($reportCard->load(['student.class', 'class', 'teacher']));
    }

    public function sponsorApprove(Request $request, $id)
    {
        $reportCard = ReportCard::find($id);
        
        if (!$reportCard) {
            return response()->json(['message' => 'Report card not found'], 404);
        }

        if ($reportCard->approval_status !== 'pending_sponsor') {
            return response()->json(['message' => 'Report card is not pending sponsor approval'], 400);
        }

        $data = $request->validate([
            'action' => 'required|in:approve,reject',
            'rejection_reason' => 'required_if:action,reject|nullable|string',
        ]);

        if ($data['action'] === 'reject') {
            $reportCard->update([
                'approval_status' => 'rejected',
                'rejection_reason' => $data['rejection_reason'],
            ]);
        } else {
            $reportCard->update([
                'approval_status' => 'pending_vpi',
                'sponsor_approved_by' => $request->user()->id,
                'sponsor_approved_at' => now(),
            ]);
        }

        return response()->json($reportCard->load(['student.class', 'class', 'teacher']));
    }

    public function vpiApprove(Request $request, $id)
    {
        $reportCard = ReportCard::find($id);

        if (!$reportCard) {
            return response()->json(['message' => 'Report card not found'], 404);
        }

        if ($reportCard->approval_status !== 'pending_vpi') {
            return response()->json(['message' => 'Report card is not pending VPI approval. Current status: ' . $reportCard->approval_status], 400);
        }

        $data = $request->validate([
            'action' => 'required|in:approve,reject',
            'rejection_reason' => 'required_if:action,reject|nullable|string',
        ]);

        if ($data['action'] === 'reject') {
            $reportCard->update([
                'approval_status' => 'rejected',
                'rejection_reason' => $data['rejection_reason'],
            ]);
        } else {
            $reportCard->update([
                'approval_status' => 'approved',
                'vpi_approved_by' => $request->user()->id,
                'vpi_approved_at' => now(),
            ]);
        }

        return response()->json($reportCard->load(['student.class', 'class', 'teacher']));
    }
}
