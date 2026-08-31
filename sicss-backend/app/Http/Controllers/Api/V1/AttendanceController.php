<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $query = Attendance::with('student.user:id,user_code', 'class', 'teacher');

        if ($request->has('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->has('date_from')) {
            $query->where('date', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->where('date', '<=', $request->date_to);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $attendances = $query->orderBy('date', 'desc')->paginate($request->per_page ?? 15);
        return response()->json($attendances);
    }

    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'class_id' => 'required|exists:classes,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'date' => 'required|date',
            'status' => 'required|in:present,absent,late,excused',
            'remarks' => 'nullable|string',
        ]);

        $attendance = Attendance::create($request->all());
        $attendance->load('student.user:id,user_code', 'class', 'teacher');
        return response()->json($attendance, 201);
    }

    public function storeBulk(Request $request)
    {
        $request->validate([
            'attendances' => 'required|array',
            'attendances.*.student_id' => 'required|exists:students,id',
            'attendances.*.class_id' => 'required|exists:classes,id',
            'attendances.*.teacher_id' => 'nullable|exists:teachers,id',
            'attendances.*.date' => 'required|date',
            'attendances.*.status' => 'required|in:present,absent,late,excused',
            'attendances.*.remarks' => 'nullable|string',
        ]);

        $attendances = [];
        foreach ($request->attendances as $attendanceData) {
            $attendance = Attendance::updateOrCreate(
                [
                    'student_id' => $attendanceData['student_id'],
                    'date' => $attendanceData['date'],
                ],
                $attendanceData
            );
            $attendance->load('student.user:id,user_code', 'class', 'teacher');
            $attendances[] = $attendance;
        }

        return response()->json($attendances, 201);
    }

    public function show(Attendance $attendance)
    {
        $attendance->load('student.user:id,user_code', 'class', 'teacher');
        return response()->json($attendance);
    }

    public function update(Request $request, Attendance $attendance)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'class_id' => 'required|exists:classes,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'date' => 'required|date',
            'status' => 'required|in:present,absent,late,excused',
            'remarks' => 'nullable|string',
        ]);

        $attendance->update($request->all());
        $attendance->load('student.user:id,user_code', 'class', 'teacher');
        return response()->json($attendance);
    }

    public function destroy(Attendance $attendance)
    {
        $attendance->delete();
        return response()->json(['message' => 'Attendance deleted successfully']);
    }

    public function studentHistory(Request $request, $studentId)
    {
        $query = Attendance::with('student.user:id,user_code', 'class', 'teacher')
            ->where('student_id', $studentId);

        if ($request->has('date_from')) {
            $query->where('date', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->where('date', '<=', $request->date_to);
        }

        $attendances = $query->orderBy('date', 'desc')->paginate($request->per_page ?? 15);
        return response()->json($attendances);
    }

    public function classReport(Request $request, $classId)
    {
        $request->validate([
            'date' => 'required|date',
        ]);

        $attendances = Attendance::with('student.user:id,user_code')
            ->where('class_id', $classId)
            ->where('date', $request->date)
            ->get();

        $summary = [
            'total' => $attendances->count(),
            'present' => $attendances->where('status', 'present')->count(),
            'absent' => $attendances->where('status', 'absent')->count(),
            'late' => $attendances->where('status', 'late')->count(),
            'excused' => $attendances->where('status', 'excused')->count(),
        ];

        return response()->json([
            'date' => $request->date,
            'class_id' => $classId,
            'summary' => $summary,
            'attendances' => $attendances,
        ]);
    }
}
