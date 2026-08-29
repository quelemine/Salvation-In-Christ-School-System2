<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Division;
use Illuminate\Http\Request;

class DivisionController extends Controller
{
    public function index()
    {
        $divisions = Division::with('classes')->orderBy('order')->get();
        return response()->json($divisions);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:divisions',
            'description' => 'nullable|string',
            'order' => 'integer',
            'is_active' => 'boolean',
        ]);

        $division = Division::create($request->all());
        return response()->json($division, 201);
    }

    public function show(Division $division)
    {
        $division->load('classes');
        return response()->json($division);
    }

    public function update(Request $request, Division $division)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:divisions,slug,' . $division->id,
            'description' => 'nullable|string',
            'order' => 'integer',
            'is_active' => 'boolean',
        ]);

        $division->update($request->all());
        return response()->json($division);
    }

    public function destroy(Division $division)
    {
        $division->delete();
        return response()->json(['message' => 'Division deleted successfully']);
    }
}
