<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\DisciplineRecord;
use Illuminate\Http\Request;

class DisciplineRecordController extends Controller
{
    public function index(Request $request)
    {
        $query = DisciplineRecord::with(['student', 'reporter', 'teacher', 'resolver']);

        if ($request->has('student_id')) {
            $query->byStudent($request->student_id);
        }

        if ($request->has('type')) {
            $query->byType($request->type);
        }

        if ($request->has('severity')) {
            $query->bySeverity($request->severity);
        }

        if ($request->has('status')) {
            $query->byStatus($request->status);
        }

        if ($request->has('resolved')) {
            $query->resolved();
        }

        if ($request->has('unresolved')) {
            $query->unresolved();
        }

        if ($request->has('positive')) {
            $query->positive();
        }

        if ($request->has('negative')) {
            $query->negative();
        }

        $records = $query->orderBy('incident_date', 'desc')->get();
        return response()->json($records);
    }

    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'type' => 'required|in:warning,suspension,expulsion,merit,commendation',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'incident_date' => 'required|date',
            'teacher_id' => 'nullable|exists:teachers,id',
            'severity' => 'required|in:low,medium,high,critical',
            'action_taken' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $record = DisciplineRecord::create([
            'student_id' => $request->student_id,
            'type' => $request->type,
            'title' => $request->title,
            'description' => $request->description,
            'incident_date' => $request->incident_date,
            'teacher_id' => $request->teacher_id,
            'severity' => $request->severity,
            'status' => 'pending',
            'action_taken' => $request->action_taken,
            'notes' => $request->notes,
            'reported_by' => auth()->id(),
        ]);

        return response()->json($record, 201);
    }

    public function show($id)
    {
        $record = DisciplineRecord::with(['student', 'reporter', 'teacher', 'resolver'])->findOrFail($id);
        return response()->json($record);
    }

    public function update(Request $request, $id)
    {
        $record = DisciplineRecord::findOrFail($id);

        $request->validate([
            'type' => 'required|in:warning,suspension,expulsion,merit,commendation',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'incident_date' => 'required|date',
            'teacher_id' => 'nullable|exists:teachers,id',
            'severity' => 'required|in:low,medium,high,critical',
            'status' => 'required|in:pending,investigating,resolved,dismissed',
            'action_taken' => 'nullable|string',
            'notes' => 'nullable|string',
            'is_resolved' => 'boolean',
            'resolved_date' => 'nullable|date',
        ]);

        $record->update([
            'type' => $request->type,
            'title' => $request->title,
            'description' => $request->description,
            'incident_date' => $request->incident_date,
            'teacher_id' => $request->teacher_id,
            'severity' => $request->severity,
            'status' => $request->status,
            'action_taken' => $request->action_taken,
            'notes' => $request->notes,
            'is_resolved' => $request->is_resolved ?? false,
            'resolved_date' => $request->resolved_date,
            'resolved_by' => $request->is_resolved ? auth()->id() : null,
        ]);

        return response()->json($record);
    }

    public function destroy($id)
    {
        $record = DisciplineRecord::findOrFail($id);
        $record->delete();
        return response()->json(['message' => 'Discipline record deleted successfully']);
    }

    public function resolve($id)
    {
        $record = DisciplineRecord::findOrFail($id);
        $record->update([
            'is_resolved' => true,
            'status' => 'resolved',
            'resolved_date' => now(),
            'resolved_by' => auth()->id(),
        ]);
        return response()->json($record);
    }
}
