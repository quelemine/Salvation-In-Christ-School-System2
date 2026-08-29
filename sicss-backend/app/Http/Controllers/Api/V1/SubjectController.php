<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    public function index()
    {
        $subjects = Subject::orderBy('order')->get();
        return response()->json($subjects);
    }

    public function store(Request $request)
    {
        $request->validate([
            'code' => 'required|string|unique:subjects',
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:subjects',
            'description' => 'nullable|string',
            'credits' => 'integer|min:1',
            'order' => 'integer',
            'is_active' => 'boolean',
        ]);

        $subject = Subject::create($request->all());
        return response()->json($subject, 201);
    }

    public function show(Subject $subject)
    {
        return response()->json($subject);
    }

    public function update(Request $request, Subject $subject)
    {
        $request->validate([
            'code' => 'required|string|unique:subjects,code,' . $subject->id,
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:subjects,slug,' . $subject->id,
            'description' => 'nullable|string',
            'credits' => 'integer|min:1',
            'order' => 'integer',
            'is_active' => 'boolean',
        ]);

        $subject->update($request->all());
        return response()->json($subject);
    }

    public function destroy(Subject $subject)
    {
        $subject->delete();
        return response()->json(['message' => 'Subject deleted successfully']);
    }
}
