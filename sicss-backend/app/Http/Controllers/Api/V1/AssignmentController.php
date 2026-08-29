<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\Teacher;
use App\Models\TeacherSubjectClass;
use Illuminate\Http\Request;

class AssignmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Assignment::with('subject', 'class', 'teacher');

        if ($request->user()->hasRole('subject-teacher')) {
            $teacher = $this->teacherFor($request);
            $pairs = $teacher ? TeacherSubjectClass::where('teacher_id', $teacher->id)->get() : collect();
            if ($pairs->isEmpty()) return response()->json(['data' => [], 'total' => 0]);
            $query->where(function ($scope) use ($pairs) {
                foreach ($pairs as $pair) $scope->orWhere(fn ($q) => $q->where('class_id', $pair->class_id)->where('subject_id', $pair->subject_id));
            });
        }

        if ($request->has('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        if ($request->has('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }

        if ($request->has('teacher_id')) {
            $query->where('teacher_id', $request->teacher_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $assignments = $query->orderBy('due_date', 'asc')->paginate($request->per_page ?? 15);
        return response()->json($assignments);
    }

    public function store(Request $request)
    {
        $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'class_id' => 'required|exists:classes,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'required|date',
            'status' => 'in:draft,published,closed',
        ]);

        if ($request->user()->hasRole('subject-teacher') && !$this->canTeach($request, $request->class_id, $request->subject_id)) {
            return response()->json(['message' => 'Unauthorized - subject is not assigned to this class'], 403);
        }
        $data = $request->all();
        if ($request->user()->hasRole('subject-teacher')) $data['teacher_id'] = $this->teacherFor($request)->id;
        $assignment = Assignment::create($data);
        $assignment->load('subject', 'class', 'teacher');
        return response()->json($assignment, 201);
    }

    public function show(Request $request, Assignment $assignment)
    {
        if ($request->user()->hasRole('subject-teacher') && !$this->canTeach($request, $assignment->class_id, $assignment->subject_id)) return response()->json(['message' => 'Unauthorized'], 403);
        $assignment->load('subject', 'class', 'teacher');
        return response()->json($assignment);
    }

    public function update(Request $request, Assignment $assignment)
    {
        $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'class_id' => 'required|exists:classes,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'required|date',
            'status' => 'in:draft,published,closed',
        ]);

        if ($request->user()->hasRole('subject-teacher') && !$this->canTeach($request, $request->class_id, $request->subject_id)) return response()->json(['message' => 'Unauthorized'], 403);
        $data = $request->all();
        if ($request->user()->hasRole('subject-teacher')) $data['teacher_id'] = $this->teacherFor($request)->id;
        $assignment->update($data);
        $assignment->load('subject', 'class', 'teacher');
        return response()->json($assignment);
    }

    public function destroy(Request $request, Assignment $assignment)
    {
        if ($request->user()->hasRole('subject-teacher') && !$this->canTeach($request, $assignment->class_id, $assignment->subject_id)) return response()->json(['message' => 'Unauthorized'], 403);
        $assignment->delete();
        return response()->json(['message' => 'Assignment deleted successfully']);
    }

    public function classAssignments(Request $request, $classId)
    {
        $query = Assignment::with('subject', 'teacher')
            ->where('class_id', $classId);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $assignments = $query->orderBy('due_date', 'asc')->paginate($request->per_page ?? 15);
        return response()->json($assignments);
    }

    private function teacherFor(Request $request): ?Teacher { return Teacher::where('user_id', $request->user()->id)->first(); }

    private function canTeach(Request $request, int $classId, int $subjectId): bool
    {
        $teacher = $this->teacherFor($request);
        return $teacher && TeacherSubjectClass::where(['teacher_id' => $teacher->id, 'class_id' => $classId, 'subject_id' => $subjectId])->exists();
    }
}
