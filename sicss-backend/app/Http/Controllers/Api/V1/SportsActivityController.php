<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SportsActivity;
use Illuminate\Http\Request;

class SportsActivityController extends Controller
{
    public function index(Request $request)
    {
        $query = SportsActivity::with(['coach', 'addedBy']);

        if ($request->has('category')) {
            $query->byCategory($request->category);
        }

        if ($request->has('active')) {
            $query->active();
        }

        $activities = $query->orderBy('name')->get();
        return response()->json($activities);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|string|max:100',
            'coach_id' => 'nullable|exists:teachers,id',
            'venue' => 'nullable|string|max:255',
            'schedule' => 'nullable|string|max:255',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after:start_date',
            'capacity' => 'nullable|integer|min:0',
        ]);

        $activity = SportsActivity::create([
            'name' => $request->name,
            'description' => $request->description,
            'category' => $request->category,
            'coach_id' => $request->coach_id,
            'venue' => $request->venue,
            'schedule' => $request->schedule,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'capacity' => $request->capacity,
            'added_by' => auth()->id(),
            'is_active' => true,
        ]);

        return response()->json($activity, 201);
    }

    public function show($id)
    {
        $activity = SportsActivity::with(['coach', 'addedBy'])->findOrFail($id);
        return response()->json($activity);
    }

    public function update(Request $request, $id)
    {
        $activity = SportsActivity::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|string|max:100',
            'coach_id' => 'nullable|exists:teachers,id',
            'venue' => 'nullable|string|max:255',
            'schedule' => 'nullable|string|max:255',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after:start_date',
            'capacity' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $activity->update([
            'name' => $request->name,
            'description' => $request->description,
            'category' => $request->category,
            'coach_id' => $request->coach_id,
            'venue' => $request->venue,
            'schedule' => $request->schedule,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'capacity' => $request->capacity,
            'is_active' => $request->is_active ?? true,
        ]);

        return response()->json($activity);
    }

    public function destroy($id)
    {
        $activity = SportsActivity::findOrFail($id);
        $activity->delete();
        return response()->json(['message' => 'Sports activity deleted successfully']);
    }
}
