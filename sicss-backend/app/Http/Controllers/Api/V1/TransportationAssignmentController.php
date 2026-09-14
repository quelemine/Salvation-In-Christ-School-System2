<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\TransportationAssignment;
use App\Models\TransportationVehicle;
use Illuminate\Http\Request;

class TransportationAssignmentController extends Controller
{
    public function index(Request $request)
    {
        $query = TransportationAssignment::with(['vehicle', 'student', 'teacher', 'assignedBy']);

        if ($request->has('vehicle_id')) {
            $query->byVehicle($request->vehicle_id);
        }

        if ($request->has('student_id')) {
            $query->byStudent($request->student_id);
        }

        if ($request->has('active')) {
            $query->active();
        }

        $assignments = $query->orderBy('created_at', 'desc')->get();
        return response()->json($assignments);
    }

    public function store(Request $request)
    {
        $request->validate([
            'vehicle_id' => 'required|exists:transportation_vehicles,id',
            'student_id' => 'nullable|exists:students,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'pickup_location' => 'nullable|string',
            'dropoff_location' => 'nullable|string',
            'pickup_time' => 'nullable',
            'dropoff_time' => 'nullable',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after:start_date',
        ]);

        $assignment = TransportationAssignment::create([
            'vehicle_id' => $request->vehicle_id,
            'student_id' => $request->student_id,
            'teacher_id' => $request->teacher_id,
            'pickup_location' => $request->pickup_location,
            'dropoff_location' => $request->dropoff_location,
            'pickup_time' => $request->pickup_time,
            'dropoff_time' => $request->dropoff_time,
            'assigned_by' => auth()->id(),
            'is_active' => true,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
        ]);

        return response()->json($assignment, 201);
    }

    public function show($id)
    {
        $assignment = TransportationAssignment::with(['vehicle', 'student', 'teacher', 'assignedBy'])->findOrFail($id);
        return response()->json($assignment);
    }

    public function update(Request $request, $id)
    {
        $assignment = TransportationAssignment::findOrFail($id);

        $request->validate([
            'vehicle_id' => 'required|exists:transportation_vehicles,id',
            'student_id' => 'nullable|exists:students,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'pickup_location' => 'nullable|string',
            'dropoff_location' => 'nullable|string',
            'pickup_time' => 'nullable',
            'dropoff_time' => 'nullable',
            'is_active' => 'boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after:start_date',
        ]);

        $assignment->update([
            'vehicle_id' => $request->vehicle_id,
            'student_id' => $request->student_id,
            'teacher_id' => $request->teacher_id,
            'pickup_location' => $request->pickup_location,
            'dropoff_location' => $request->dropoff_location,
            'pickup_time' => $request->pickup_time,
            'dropoff_time' => $request->dropoff_time,
            'is_active' => $request->is_active ?? true,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
        ]);

        return response()->json($assignment);
    }

    public function destroy($id)
    {
        $assignment = TransportationAssignment::findOrFail($id);
        $assignment->delete();
        return response()->json(['message' => 'Assignment deleted successfully']);
    }
}
