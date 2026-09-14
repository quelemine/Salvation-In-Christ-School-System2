<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Timetable;
use Illuminate\Http\Request;

class TimetableController extends Controller
{
    public function index(Request $request)
    {
        $query = Timetable::with(['subject', 'teacher', 'class', 'division']);

        if ($request->has('day_of_week')) {
            $query->byDay($request->day_of_week);
        }

        if ($request->has('academic_year')) {
            $query->byAcademicYear($request->academic_year);
        }

        if ($request->has('class_id')) {
            $query->byClass($request->class_id);
        }

        if ($request->has('teacher_id')) {
            $query->byTeacher($request->teacher_id);
        }

        if ($request->has('active')) {
            $query->active();
        }

        $timetables = $query->orderBy('day_of_week')->orderBy('start_time')->get();
        return response()->json($timetables);
    }

    public function store(Request $request)
    {
        $request->validate([
            'day_of_week' => 'required|in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
            'start_time' => 'required',
            'end_time' => 'required|after:start_time',
            'subject_id' => 'nullable|exists:subjects,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'class_id' => 'nullable|exists:classes,id',
            'division_id' => 'nullable|exists:divisions,id',
            'room_name' => 'nullable|string',
            'is_active' => 'boolean',
            'academic_year' => 'required|string',
        ]);

        $timetable = Timetable::create([
            'day_of_week' => $request->day_of_week,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'subject_id' => $request->subject_id,
            'teacher_id' => $request->teacher_id,
            'class_id' => $request->class_id,
            'division_id' => $request->division_id,
            'room_name' => $request->room_name,
            'is_active' => $request->is_active ?? true,
            'academic_year' => $request->academic_year,
            'created_by' => auth()->id(),
        ]);

        return response()->json($timetable, 201);
    }

    public function show($id)
    {
        $timetable = Timetable::with(['subject', 'teacher', 'class', 'division'])->findOrFail($id);
        return response()->json($timetable);
    }

    public function update(Request $request, $id)
    {
        $timetable = Timetable::findOrFail($id);

        $request->validate([
            'day_of_week' => 'required|in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
            'start_time' => 'required',
            'end_time' => 'required|after:start_time',
            'subject_id' => 'nullable|exists:subjects,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'class_id' => 'nullable|exists:classes,id',
            'division_id' => 'nullable|exists:divisions,id',
            'room_name' => 'nullable|string',
            'is_active' => 'boolean',
            'academic_year' => 'required|string',
        ]);

        $timetable->update([
            'day_of_week' => $request->day_of_week,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'subject_id' => $request->subject_id,
            'teacher_id' => $request->teacher_id,
            'class_id' => $request->class_id,
            'division_id' => $request->division_id,
            'room_name' => $request->room_name,
            'is_active' => $request->is_active ?? true,
            'academic_year' => $request->academic_year,
        ]);

        return response()->json($timetable);
    }

    public function destroy($id)
    {
        $timetable = Timetable::findOrFail($id);
        $timetable->delete();
        return response()->json(['message' => 'Timetable entry deleted successfully']);
    }
}
