<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ClassModel;
use Illuminate\Http\Request;

class ClassController extends Controller
{
    public function index()
    {
        $classes = ClassModel::with('division')->orderBy('order')->get();
        return response()->json($classes);
    }

    public function store(Request $request)
    {
        $request->validate([
            'division_id' => 'required|exists:divisions,id',
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:classes',
            'section' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'capacity' => 'integer|min:1',
            'order' => 'integer',
            'is_active' => 'boolean',
        ]);

        $class = ClassModel::create($request->all());
        $class->load('division');
        return response()->json($class, 201);
    }

    public function show(ClassModel $class)
    {
        $class->load('division');
        return response()->json($class);
    }

    public function update(Request $request, ClassModel $class)
    {
        $request->validate([
            'division_id' => 'required|exists:divisions,id',
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:classes,slug,' . $class->id,
            'section' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'capacity' => 'integer|min:1',
            'order' => 'integer',
            'is_active' => 'boolean',
        ]);

        $class->update($request->all());
        $class->load('division');
        return response()->json($class);
    }

    public function destroy(ClassModel $class)
    {
        $class->delete();
        return response()->json(['message' => 'Class deleted successfully']);
    }
}
