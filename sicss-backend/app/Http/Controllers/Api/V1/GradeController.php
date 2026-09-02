<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Grade;
use App\Models\Teacher;
use App\Models\TeacherSubjectClass;
use Illuminate\Http\Request;

class GradeController extends Controller
{
    public function index(Request $request)
    {
        $query = Grade::with('student.class', 'student.user:id,user_code', 'subject', 'teacher');

        // VPI and Admin see all grades without filtering
        if ($request->user()->hasRole('admin') || $request->user()->hasRole('vice-principal-instruction')) {
            // No filtering - show all grades
        } elseif ($this->isTeacher($request)) {
            $teacher = $this->teacherFor($request);
            if (!$teacher) return response()->json(['data' => [], 'total' => 0]);
            if ($request->user()->hasRole('subject-teacher')) {
                $assignments = $this->assignmentsFor($request);
                if ($assignments->isEmpty()) return response()->json(['data' => [], 'total' => 0]);
                $query->where(function ($scope) use ($assignments) {
                    foreach ($assignments as $assignment) {
                        $scope->orWhere(function ($pair) use ($assignment) {
                            $pair->where('subject_id', $assignment->subject_id)
                                ->whereHas('student', fn ($student) => $student->where('class_id', $assignment->class_id));
                        });
                    }
                });
            } else {
                $query->whereHas('student', fn ($student) => $student->whereIn('class_id', $this->classIdsFor($teacher)));
            }
        }

        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->has('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }

        if ($request->has('class_id')) {
            $query->whereHas('student', fn ($studentQuery) => $studentQuery->where('class_id', $request->class_id));
        }

        if ($request->has('term')) {
            $query->where('term', $request->term);
        }

        if ($request->has('academic_year')) {
            $query->where('academic_year', $request->academic_year);
        }

        $grades = $query->orderBy('created_at', 'desc')->paginate($request->per_page ?? 15);
        return response()->json($grades);
    }

    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'subject_id' => 'required|exists:subjects,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'term' => 'required|string',
            'academic_year' => 'required|string',
            'score' => 'required|numeric|min:0|max:100',
            'remarks' => 'nullable|string',
        ]);

        if ($this->isTeacher($request) && !$this->canTeach($request, $request->student_id, $request->subject_id)) {
            return response()->json(['message' => 'Unauthorized - subject or student is not assigned to you'], 403);
        }
        $data = $request->all();
        if ($this->isTeacher($request)) {
            $teacher = $this->teacherFor($request);
            if (!$teacher) return response()->json(['message' => 'No teacher profile is linked to this account.'], 403);
            $data['teacher_id'] = $teacher->id;
        }
        $grade = new Grade($data);
        $grade->grade = $grade->calculateGradeLetter($request->score);
        $grade->save();
        $grade->load('student.user:id,user_code', 'subject', 'teacher');
        return response()->json($grade, 201);
    }

    public function show(Request $request, Grade $grade)
    {
        if ($this->isTeacher($request) && !$this->canTeach($request, $grade->student_id, $grade->subject_id)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $grade->load('student.user:id,user_code', 'subject', 'teacher');
        return response()->json($grade);
    }

    public function update(Request $request, Grade $grade)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'subject_id' => 'required|exists:subjects,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'term' => 'required|string',
            'academic_year' => 'required|string',
            'score' => 'required|numeric|min:0|max:100',
            'remarks' => 'nullable|string',
        ]);

        if ($this->isTeacher($request) && !$this->canTeach($request, $request->student_id, $request->subject_id)) {
            return response()->json(['message' => 'Unauthorized - subject or student is not assigned to you'], 403);
        }
        if ($this->isTeacher($request) && $grade->approval_status !== 'draft') {
            return response()->json(['message' => 'Submitted grades cannot be changed until returned for revision.'], 422);
        }
        $data = $request->all();
        if ($this->isTeacher($request)) $data['teacher_id'] = $this->teacherFor($request)->id;
        $grade->update($data);
        $grade->grade = $grade->calculateGradeLetter($request->score);
        $grade->save();
        $grade->load('student.user:id,user_code', 'subject', 'teacher');
        return response()->json($grade);
    }

    public function destroy(Request $request, Grade $grade)
    {
        if ($this->isTeacher($request) && !$this->canTeach($request, $grade->student_id, $grade->subject_id)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        if ($this->isTeacher($request) && $grade->approval_status !== 'draft') {
            return response()->json(['message' => 'Submitted grades cannot be deleted.'], 422);
        }
        $grade->delete();
        return response()->json(['message' => 'Grade deleted successfully']);
    }

    public function studentReport(Request $request, $studentId)
    {
        $request->validate([
            'academic_year' => 'required|string',
            'term' => 'nullable|string',
        ]);

        $query = Grade::with('subject', 'teacher')
            ->where('student_id', $studentId)
            ->where('academic_year', $request->academic_year);

        if ($request->has('term')) {
            $query->where('term', $request->term);
        }

        $grades = $query->get();

        $average = $grades->avg('score');
        $totalSubjects = $grades->count();
        $gradeDistribution = [
            'A' => $grades->where('grade', 'A')->count(),
            'B' => $grades->where('grade', 'B')->count(),
            'C' => $grades->where('grade', 'C')->count(),
            'D' => $grades->where('grade', 'D')->count(),
            'E' => $grades->where('grade', 'E')->count(),
            'F' => $grades->where('grade', 'F')->count(),
        ];

        return response()->json([
            'student_id' => $studentId,
            'academic_year' => $request->academic_year,
            'term' => $request->term ?? 'all',
            'average_score' => round($average, 2),
            'total_subjects' => $totalSubjects,
            'grade_distribution' => $gradeDistribution,
            'grades' => $grades,
        ]);
    }

    public function classReport(Request $request)
    {
        $request->validate([
            'academic_year' => 'required|string',
            'term' => 'required|string',
            'subject_id' => 'nullable|exists:subjects,id',
        ]);

        $query = Grade::with('student', 'subject', 'teacher')
            ->where('academic_year', $request->academic_year)
            ->where('term', $request->term);

        if ($request->has('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }

        $grades = $query->get();

        $average = $grades->avg('score');
        $highest = $grades->max('score');
        $lowest = $grades->min('score');
        $totalStudents = $grades->pluck('student_id')->unique()->count();

        return response()->json([
            'academic_year' => $request->academic_year,
            'term' => $request->term,
            'subject_id' => $request->subject_id ?? 'all',
            'average_score' => round($average, 2),
            'highest_score' => $highest,
            'lowest_score' => $lowest,
            'total_students' => $totalStudents,
            'grades' => $grades,
        ]);
    }

    /** A student may only retrieve grades linked to their own signed-in account. */
    public function myGradeSheet(Request $request)
    {
        $student = \App\Models\Student::with('class')->where('user_id', $request->user()->id)->first();
        if (!$student) return response()->json(['message' => 'No student profile is linked to this account.'], 404);

        $grades = Grade::with('subject:id,code,name', 'teacher:id,first_name,last_name')
            ->where('student_id', $student->id)
            ->when($request->term, fn ($query, $term) => $query->where('term', $term))
            ->when($request->academic_year, fn ($query, $year) => $query->where('academic_year', $year))
            ->orderByDesc('academic_year')->orderBy('term')->get();

        return response()->json([
            'student' => $student,
            'grades' => $grades,
            'average_score' => round((float) $grades->avg('score'), 2),
        ]);
    }

    public function submit(Request $request, Grade $grade)
    {
        abort_unless($this->isTeacher($request) && $this->canTeach($request, $grade->student_id, $grade->subject_id), 403, 'You can only submit grades for your assigned students and subjects.');
        abort_if($grade->approval_status !== 'draft', 422, 'Only draft grades can be submitted.');

        $grade->update([
            'approval_status' => 'submitted',
            'submitted_at' => now(),
            'submitted_by' => $request->user()->id,
            'reviewed_at' => null,
            'reviewed_by' => null,
            'review_note' => null,
        ]);

        return response()->json($grade->fresh(['student.class', 'student.user:id,user_code', 'subject', 'teacher']));
    }

    public function review(Request $request, Grade $grade)
    {
        $data = $request->validate([
            'approval_status' => 'required|in:approved,rejected',
            'review_note' => 'nullable|string|max:2000',
        ]);
        abort_if($grade->approval_status !== 'submitted', 422, 'Only submitted grades can be reviewed.');

        $grade->update([
            ...$data,
            'reviewed_at' => now(),
            'reviewed_by' => $request->user()->id,
        ]);

        return response()->json($grade->fresh(['student.class', 'student.user:id,user_code', 'subject', 'teacher']));
    }

    private function isTeacher(Request $request): bool
    {
        return $request->user()->hasAnyRole(['teacher', 'class-sponsor', 'subject-teacher']);
    }

    private function teacherFor(Request $request): ?Teacher
    {
        return Teacher::where('user_id', $request->user()->id)->first();
    }

    private function assignmentsFor(Request $request)
    {
        $teacher = $this->teacherFor($request);
        return $teacher ? TeacherSubjectClass::where('teacher_id', $teacher->id)->get() : collect();
    }

    private function canTeach(Request $request, int $studentId, int $subjectId): bool
    {
        $teacher = $this->teacherFor($request);
        if (!$teacher) return false;
        if (!$request->user()->hasRole('subject-teacher')) {
            return \App\Models\Student::whereKey($studentId)->whereIn('class_id', $this->classIdsFor($teacher))->exists();
        }
        return TeacherSubjectClass::where('teacher_id', $teacher->id)->where('subject_id', $subjectId)
            ->whereHas('class.students', fn ($students) => $students->whereKey($studentId))->exists();
    }

    private function classIdsFor(Teacher $teacher): array
    {
        $classIds = $teacher->classes()->pluck('classes.id')
            ->merge(TeacherSubjectClass::where('teacher_id', $teacher->id)->pluck('class_id'));
        if ($teacher->sponsoredClass) $classIds->push($teacher->sponsoredClass->id);
        return $classIds->unique()->values()->all();
    }
}
