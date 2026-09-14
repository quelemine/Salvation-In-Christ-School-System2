<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AcademicCalendar;
use Illuminate\Http\Request;

class AcademicCalendarController extends Controller
{
    public function index(Request $request)
    {
        $query = AcademicCalendar::query();

        if ($request->has('type')) {
            $query->byType($request->type);
        }

        if ($request->has('academic_year')) {
            $query->byAcademicYear($request->academic_year);
        }

        if ($request->has('active')) {
            $query->active();
        }

        $calendar = $query->orderBy('start_date')->get();
        return response()->json($calendar);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:term,holiday,event,exam,break',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'is_active' => 'boolean',
            'academic_year' => 'required|string',
        ]);

        $calendar = AcademicCalendar::create([
            'title' => $request->title,
            'description' => $request->description,
            'type' => $request->type,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'is_active' => $request->is_active ?? true,
            'academic_year' => $request->academic_year,
            'created_by' => auth()->id(),
        ]);

        return response()->json($calendar, 201);
    }

    public function show($id)
    {
        $calendar = AcademicCalendar::findOrFail($id);
        return response()->json($calendar);
    }

    public function update(Request $request, $id)
    {
        $calendar = AcademicCalendar::findOrFail($id);

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:term,holiday,event,exam,break',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'is_active' => 'boolean',
            'academic_year' => 'required|string',
        ]);

        $calendar->update([
            'title' => $request->title,
            'description' => $request->description,
            'type' => $request->type,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'is_active' => $request->is_active ?? true,
            'academic_year' => $request->academic_year,
        ]);

        return response()->json($calendar);
    }

    public function destroy($id)
    {
        $calendar = AcademicCalendar::findOrFail($id);
        $calendar->delete();
        return response()->json(['message' => 'Calendar event deleted successfully']);
    }
}
