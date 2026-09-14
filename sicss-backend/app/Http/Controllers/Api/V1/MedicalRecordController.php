<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\MedicalRecord;
use Illuminate\Http\Request;

class MedicalRecordController extends Controller
{
    public function index(Request $request)
    {
        $query = MedicalRecord::with(['student', 'teacher', 'recordedBy']);

        if ($request->has('student_id')) {
            $query->byStudent($request->student_id);
        }

        if ($request->has('teacher_id')) {
            $query->byTeacher($request->teacher_id);
        }

        if ($request->has('date')) {
            $query->byDate($request->date);
        }

        if ($request->has('confidential')) {
            $query->confidential();
        }

        $records = $query->orderBy('record_date', 'desc')->get();
        return response()->json($records);
    }

    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'nullable|exists:students,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'record_date' => 'nullable|date',
            'condition' => 'nullable|string|max:255',
            'symptoms' => 'nullable|string',
            'diagnosis' => 'nullable|string',
            'treatment' => 'nullable|string',
            'medication' => 'nullable|string|max:255',
            'dosage' => 'nullable|string|max:100',
            'prescription_date' => 'nullable|date',
            'is_confidential' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        $record = MedicalRecord::create([
            'student_id' => $request->student_id,
            'teacher_id' => $request->teacher_id,
            'record_date' => $request->record_date,
            'condition' => $request->condition,
            'symptoms' => $request->symptoms,
            'diagnosis' => $request->diagnosis,
            'treatment' => $request->treatment,
            'medication' => $request->medication,
            'dosage' => $request->dosage,
            'prescription_date' => $request->prescription_date,
            'recorded_by' => auth()->id(),
            'is_confidential' => $request->is_confidential ?? false,
            'notes' => $request->notes,
        ]);

        return response()->json($record, 201);
    }

    public function show($id)
    {
        $record = MedicalRecord::with(['student', 'teacher', 'recordedBy'])->findOrFail($id);
        return response()->json($record);
    }

    public function update(Request $request, $id)
    {
        $record = MedicalRecord::findOrFail($id);

        $request->validate([
            'student_id' => 'nullable|exists:students,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'record_date' => 'nullable|date',
            'condition' => 'nullable|string|max:255',
            'symptoms' => 'nullable|string',
            'diagnosis' => 'nullable|string',
            'treatment' => 'nullable|string',
            'medication' => 'nullable|string|max:255',
            'dosage' => 'nullable|string|max:100',
            'prescription_date' => 'nullable|date',
            'is_confidential' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        $record->update([
            'student_id' => $request->student_id,
            'teacher_id' => $request->teacher_id,
            'record_date' => $request->record_date,
            'condition' => $request->condition,
            'symptoms' => $request->symptoms,
            'diagnosis' => $request->diagnosis,
            'treatment' => $request->treatment,
            'medication' => $request->medication,
            'dosage' => $request->dosage,
            'prescription_date' => $request->prescription_date,
            'is_confidential' => $request->is_confidential ?? false,
            'notes' => $request->notes,
        ]);

        return response()->json($record);
    }

    public function destroy($id)
    {
        $record = MedicalRecord::findOrFail($id);
        $record->delete();
        return response()->json(['message' => 'Medical record deleted successfully']);
    }
}
