<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ClassModel;
use Illuminate\Http\Request;

class ClassController extends Controller
{
    public function index()
    {
        $classes = ClassModel::with(['division', 'sponsor', 'subjects'])->orderBy('order')->get();
        return response()->json($classes);
    }

    public function store(Request $request)
    {
        $request->validate([
            'division_id'       => 'required|exists:divisions,id',
            'name'              => 'required|string|max:255',
            'slug'              => 'required|string|max:255|unique:classes',
            'section'           => 'nullable|string|max:50',
            'description'       => 'nullable|string',
            'capacity'          => 'integer|min:1',
            'order'             => 'integer',
            'is_active'         => 'boolean',
            'sponsor_teacher_id'=> 'nullable|exists:teachers,id',
            'subject_ids'       => 'nullable|array',
            'subject_ids.*'     => 'exists:subjects,id',
        ]);

        $class = ClassModel::create($request->except(['subject_ids']));

        if ($request->filled('sponsor_teacher_id')) {
            $class->sponsor_teacher_id = $request->sponsor_teacher_id;
            $class->save();
        }

        if ($request->has('subject_ids')) {
            $class->subjects()->sync($request->input('subject_ids', []));
        }

        $class->load(['division', 'sponsor', 'subjects']);
        return response()->json($class, 201);
    }

    public function show(ClassModel $class)
    {
        $class->load(['division', 'sponsor', 'subjects']);
        return response()->json($class);
    }

    public function update(Request $request, ClassModel $class)
    {
        $request->validate([
            'division_id'       => 'required|exists:divisions,id',
            'name'              => 'required|string|max:255',
            'slug'              => 'required|string|max:255|unique:classes,slug,' . $class->id,
            'section'           => 'nullable|string|max:50',
            'description'       => 'nullable|string',
            'capacity'          => 'integer|min:1',
            'order'             => 'integer',
            'is_active'         => 'boolean',
            'sponsor_teacher_id'=> 'nullable|exists:teachers,id',
            'subject_ids'       => 'nullable|array',
            'subject_ids.*'     => 'exists:subjects,id',
        ]);

        $class->update($request->except(['subject_ids']));

        if ($request->has('subject_ids')) {
            $class->subjects()->sync($request->input('subject_ids', []));
        }

        $class->load(['division', 'sponsor', 'subjects']);
        return response()->json($class);
    }

    public function destroy(ClassModel $class)
    {
        $class->subjects()->detach();
        $class->delete();
        return response()->json(['message' => 'Class deleted successfully']);
    }
}
