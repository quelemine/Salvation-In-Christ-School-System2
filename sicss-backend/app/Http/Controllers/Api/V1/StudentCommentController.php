<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\StudentComment;
use Illuminate\Http\Request;

class StudentCommentController extends Controller
{
    public function index(Request $request)
    {
        $query = StudentComment::with('student', 'teacher');

        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->has('teacher_id')) {
            $query->where('teacher_id', $request->teacher_id);
        }

        if ($request->has('academic_year')) {
            $query->where('academic_year', $request->academic_year);
        }

        if ($request->has('term')) {
            $query->where('term', $request->term);
        }

        if ($request->has('comment_type')) {
            $query->where('comment_type', $request->comment_type);
        }

        $comments = $query->orderBy('created_at', 'desc')->paginate($request->per_page ?? 15);
        return response()->json($comments);
    }

    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'academic_year' => 'required|string',
            'term' => 'required|string',
            'comment_type' => 'in:academic,behavior,general',
            'comment' => 'required|string',
        ]);

        $comment = StudentComment::create($request->all());
        $comment->load('student', 'teacher');
        return response()->json($comment, 201);
    }

    public function show(StudentComment $studentComment)
    {
        $studentComment->load('student', 'teacher');
        return response()->json($studentComment);
    }

    public function update(Request $request, StudentComment $studentComment)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'academic_year' => 'required|string',
            'term' => 'required|string',
            'comment_type' => 'in:academic,behavior,general',
            'comment' => 'required|string',
        ]);

        $studentComment->update($request->all());
        $studentComment->load('student', 'teacher');
        return response()->json($studentComment);
    }

    public function destroy(StudentComment $studentComment)
    {
        $studentComment->delete();
        return response()->json(['message' => 'Student comment deleted successfully']);
    }

    public function studentComments(Request $request, $studentId)
    {
        $query = StudentComment::with('teacher')
            ->where('student_id', $studentId);

        if ($request->has('academic_year')) {
            $query->where('academic_year', $request->academic_year);
        }

        if ($request->has('term')) {
            $query->where('term', $request->term);
        }

        if ($request->has('comment_type')) {
            $query->where('comment_type', $request->comment_type);
        }

        $comments = $query->orderBy('created_at', 'desc')->paginate($request->per_page ?? 15);
        return response()->json($comments);
    }
}
