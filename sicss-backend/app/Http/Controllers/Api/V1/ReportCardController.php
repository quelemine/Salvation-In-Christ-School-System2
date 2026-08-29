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
        if ($request->filled('student_id')) $query->where('student_id', $request->student_id);
        if ($request->filled('academic_year')) $query->where('academic_year', $request->academic_year);
        return response()->json($query->latest()->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'student_id' => 'required|exists:students,id', 'class_id' => 'required|exists:classes,id',
            'teacher_id' => 'nullable|exists:teachers,id', 'academic_year' => 'required|string|max:20',
            'grade_level' => 'required|string|max:100', 'subject_marks' => 'required|array',
            'aggregate' => 'nullable|numeric', 'average' => 'nullable|numeric', 'rank' => 'nullable|integer|min:1',
            'total_in_class' => 'nullable|integer|min:1', 'conduct' => 'nullable|string',
            'promotion_status' => 'nullable|in:promoted,conditional,repeat,not_enrolled',
            'conditional_subjects' => 'nullable|string', 'promoted_to' => 'nullable|string',
            'class_sponsor' => 'nullable|string', 'principal' => 'nullable|string', 'closing_date' => 'nullable|string',
        ]);
        return response()->json(ReportCard::updateOrCreate(
            ['student_id' => $data['student_id'], 'academic_year' => $data['academic_year']], $data
        )->load(['student.class', 'class', 'teacher']), 201);
    }
}
