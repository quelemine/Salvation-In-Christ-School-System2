<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    public function index()
    {
        $subjects = Subject::with(['teachers', 'classes'])->orderBy('order')->get();
        return response()->json($subjects);
    }

    public function store(Request $request)
    {
        $request->validate([
            'code'        => 'required|string|unique:subjects',
            'name'        => 'required|string|max:255',
            'slug'        => 'required|string|max:255|unique:subjects',
            'description' => 'nullable|string',
            'credits'     => 'integer|min:1',
            'order'       => 'integer',
            'is_active'   => 'boolean',
            'teacher_id'  => 'nullable|exists:teachers,id',
            'class_ids'   => 'nullable|array',
            'class_ids.*' => 'exists:classes,id',
        ]);

        $subject = Subject::create($request->except(['teacher_id', 'class_ids']));

        if ($request->filled('teacher_id')) {
            $subject->teachers()->sync([$request->teacher_id]);
        }

        if ($request->has('class_ids')) {
            $subject->classes()->sync($request->input('class_ids', []));
        }

        $subject->load(['teachers', 'classes']);
        return response()->json($subject, 201);
    }

    public function show(Subject $subject)
    {
        $subject->load(['teachers', 'classes']);
        return response()->json($subject);
    }

    public function update(Request $request, Subject $subject)
    {
        $request->validate([
            'code'        => 'required|string|unique:subjects,code,' . $subject->id,
            'name'        => 'required|string|max:255',
            'slug'        => 'required|string|max:255|unique:subjects,slug,' . $subject->id,
            'description' => 'nullable|string',
            'credits'     => 'integer|min:1',
            'order'       => 'integer',
            'is_active'   => 'boolean',
            'teacher_id'  => 'nullable|exists:teachers,id',
            'class_ids'   => 'nullable|array',
            'class_ids.*' => 'exists:classes,id',
        ]);

        $subject->update($request->except(['teacher_id', 'class_ids']));

        if ($request->has('teacher_id')) {
            $subject->teachers()->sync(
                $request->filled('teacher_id') ? [$request->teacher_id] : []
            );
        }

        if ($request->has('class_ids')) {
            $subject->classes()->sync($request->input('class_ids', []));
        }

        $subject->load(['teachers', 'classes']);
        return response()->json($subject);
    }

    public function destroy(Subject $subject)
    {
        $subject->teachers()->detach();
        $subject->classes()->detach();
        $subject->delete();
        return response()->json(['message' => 'Subject deleted successfully']);
    }
}
