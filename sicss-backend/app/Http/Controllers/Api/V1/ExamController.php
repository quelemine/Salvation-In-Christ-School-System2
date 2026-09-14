<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use Illuminate\Http\Request;

class ExamController extends Controller
{
    public function index(Request $request)
    {
        $query = Exam::with(['subject', 'class', 'division', 'creator']);

        if ($request->has('type')) {
            $query->byType($request->type);
        }

        if ($request->has('academic_year')) {
            $query->byAcademicYear($request->academic_year);
        }

        if ($request->has('published')) {
            $query->published();
        }

        if ($request->has('upcoming')) {
            $query->upcoming();
        }

        if ($request->has('past')) {
            $query->past();
        }

        if ($request->has('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }

        if ($request->has('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        $exams = $query->orderBy('exam_date')->get();
        return response()->json($exams);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:midterm,final,quiz,assignment,practical',
            'exam_date' => 'required|date',
            'start_time' => 'required',
            'end_time' => 'required|after:start_time',
            'duration_minutes' => 'required|integer|min:1',
            'total_marks' => 'required|integer|min:1',
            'passing_marks' => 'required|integer|min:0|max:total_marks',
            'subject_id' => 'nullable|exists:subjects,id',
            'class_id' => 'nullable|exists:classes,id',
            'division_id' => 'nullable|exists:divisions,id',
            'is_published' => 'boolean',
            'academic_year' => 'required|string',
        ]);

        $exam = Exam::create([
            'name' => $request->name,
            'description' => $request->description,
            'type' => $request->type,
            'exam_date' => $request->exam_date,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'duration_minutes' => $request->duration_minutes,
            'total_marks' => $request->total_marks,
            'passing_marks' => $request->passing_marks,
            'subject_id' => $request->subject_id,
            'class_id' => $request->class_id,
            'division_id' => $request->division_id,
            'is_published' => $request->is_published ?? false,
            'academic_year' => $request->academic_year,
            'created_by' => auth()->id(),
        ]);

        return response()->json($exam, 201);
    }

    public function show($id)
    {
        $exam = Exam::with(['subject', 'class', 'division', 'creator'])->findOrFail($id);
        return response()->json($exam);
    }

    public function update(Request $request, $id)
    {
        $exam = Exam::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:midterm,final,quiz,assignment,practical',
            'exam_date' => 'required|date',
            'start_time' => 'required',
            'end_time' => 'required|after:start_time',
            'duration_minutes' => 'required|integer|min:1',
            'total_marks' => 'required|integer|min:1',
            'passing_marks' => 'required|integer|min:0|max:total_marks',
            'subject_id' => 'nullable|exists:subjects,id',
            'class_id' => 'nullable|exists:classes,id',
            'division_id' => 'nullable|exists:divisions,id',
            'is_published' => 'boolean',
            'academic_year' => 'required|string',
        ]);

        $exam->update([
            'name' => $request->name,
            'description' => $request->description,
            'type' => $request->type,
            'exam_date' => $request->exam_date,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'duration_minutes' => $request->duration_minutes,
            'total_marks' => $request->total_marks,
            'passing_marks' => $request->passing_marks,
            'subject_id' => $request->subject_id,
            'class_id' => $request->class_id,
            'division_id' => $request->division_id,
            'is_published' => $request->is_published ?? false,
            'academic_year' => $request->academic_year,
        ]);

        return response()->json($exam);
    }

    public function destroy($id)
    {
        $exam = Exam::findOrFail($id);
        $exam->delete();
        return response()->json(['message' => 'Exam deleted successfully']);
    }

    public function publish($id)
    {
        $exam = Exam::findOrFail($id);
        $exam->update(['is_published' => true]);
        return response()->json($exam);
    }

    public function unpublish($id)
    {
        $exam = Exam::findOrFail($id);
        $exam->update(['is_published' => false]);
        return response()->json($exam);
    }
}
