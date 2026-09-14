<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\HostelAssignment;
use App\Models\Hostel;
use Illuminate\Http\Request;

class HostelAssignmentController extends Controller
{
    public function index(Request $request)
    {
        $query = HostelAssignment::with(['hostel', 'student', 'teacher', 'assignedBy']);

        if ($request->has('hostel_id')) {
            $query->byHostel($request->hostel_id);
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
            'hostel_id' => 'required|exists:hostels,id',
            'student_id' => 'nullable|exists:students,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'room_number' => 'nullable|string',
            'bed_number' => 'nullable|string',
            'assignment_date' => 'nullable|date',
            'checkout_date' => 'nullable|date|after:assignment_date',
            'notes' => 'nullable|string',
        ]);

        $assignment = HostelAssignment::create([
            'hostel_id' => $request->hostel_id,
            'student_id' => $request->student_id,
            'teacher_id' => $request->teacher_id,
            'room_number' => $request->room_number,
            'bed_number' => $request->bed_number,
            'assignment_date' => $request->assignment_date,
            'checkout_date' => $request->checkout_date,
            'assigned_by' => auth()->id(),
            'is_active' => true,
            'notes' => $request->notes,
        ]);

        return response()->json($assignment, 201);
    }

    public function show($id)
    {
        $assignment = HostelAssignment::with(['hostel', 'student', 'teacher', 'assignedBy'])->findOrFail($id);
        return response()->json($assignment);
    }

    public function update(Request $request, $id)
    {
        $assignment = HostelAssignment::findOrFail($id);

        $request->validate([
            'hostel_id' => 'required|exists:hostels,id',
            'student_id' => 'nullable|exists:students,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'room_number' => 'nullable|string',
            'bed_number' => 'nullable|string',
            'assignment_date' => 'nullable|date',
            'checkout_date' => 'nullable|date|after:assignment_date',
            'is_active' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        $assignment->update([
            'hostel_id' => $request->hostel_id,
            'student_id' => $request->student_id,
            'teacher_id' => $request->teacher_id,
            'room_number' => $request->room_number,
            'bed_number' => $request->bed_number,
            'assignment_date' => $request->assignment_date,
            'checkout_date' => $request->checkout_date,
            'is_active' => $request->is_active ?? true,
            'notes' => $request->notes,
        ]);

        return response()->json($assignment);
    }

    public function destroy($id)
    {
        $assignment = HostelAssignment::findOrFail($id);
        $assignment->delete();
        return response()->json(['message' => 'Assignment deleted successfully']);
    }
}
