<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use App\Models\TeacherSubjectClass;
use App\Models\User;
use Illuminate\Http\Request;

class TeacherController extends Controller
{
    public function index(Request $request)
    {
        $query = Teacher::with(['user.role', 'salaryStructure', 'sponsoredClass', 'classes', 'subjectClassAssignments.subject', 'subjectClassAssignments.class']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($q) => $q->where('user_code', 'like', "%{$search}%"))
                    ->orWhere('employee_id', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $teachers = $query->orderBy('created_at', 'desc')->paginate($request->per_page ?? 15);
        return response()->json($teachers);
    }

    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'salary_structure_id' => 'nullable|exists:salary_structures,id',
            'employee_id' => 'nullable|string|unique:teachers',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:teachers',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'photo' => 'nullable|string',
            'credential_image_path' => 'nullable|string|max:2048',
            'gender' => 'nullable|in:male,female,other',
            'date_of_birth' => 'nullable|date',
            'hire_date' => 'required|date',
            'qualifications' => 'nullable|string',
            'specialization' => 'nullable|string',
            'status' => 'in:active,inactive,on_leave',
        ]);

        // Auto-generate employee ID if not provided
        $data = $request->except(['sponsor_class_id', 'subject_assignments', 'class_ids']);
        if (empty($data['employee_id'])) {
            $data['employee_id'] = $this->generateEmployeeId();
        }

        $teacher = Teacher::create($data);
        $this->syncTeachingScope($request, $teacher);
        return response()->json($this->loadScope($teacher), 201);
    }

    public function show(Teacher $teacher)
    {
        return response()->json($this->loadScope($teacher));
    }

    public function update(Request $request, Teacher $teacher)
    {
        $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'salary_structure_id' => 'nullable|exists:salary_structures,id',
            'employee_id' => 'required|string|unique:teachers,employee_id,' . $teacher->id,
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:teachers,email,' . $teacher->id,
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'photo' => 'nullable|string',
            'credential_image_path' => 'nullable|string|max:2048',
            'gender' => 'nullable|in:male,female,other',
            'date_of_birth' => 'nullable|date',
            'hire_date' => 'required|date',
            'qualifications' => 'nullable|string',
            'specialization' => 'nullable|string',
            'status' => 'in:active,inactive,on_leave',
        ]);

        $teacher->update($request->except(['sponsor_class_id', 'subject_assignments', 'class_ids']));
        $this->syncTeachingScope($request, $teacher);
        return response()->json($this->loadScope($teacher));
    }

    public function destroy(Teacher $teacher)
    {
        $teacher->delete();
        return response()->json(['message' => 'Teacher deleted successfully']);
    }

    private function syncTeachingScope(Request $request, Teacher $teacher): void
    {
        $request->validate([
            'sponsor_class_id' => 'nullable|integer|exists:classes,id',
            'class_ids'        => 'nullable|array',
            'class_ids.*'      => 'integer|exists:classes,id',
            'subject_assignments' => 'nullable|array',
            'subject_assignments.*.subject_id' => 'required_with:subject_assignments|integer|exists:subjects,id',
            'subject_assignments.*.class_id'   => 'required_with:subject_assignments|integer|exists:classes,id',
        ]);

        $role = $teacher->user?->role?->slug;

        // Always sync class_ids to the class_teacher pivot (works for all roles)
        if ($request->has('class_ids')) {
            $teacher->classes()->sync($request->input('class_ids', []));
        }

        // Class-sponsor / class-teacher: also handle the sponsored class FK
        if ($role === 'class-sponsor' || $role === 'class-teacher') {
            TeacherSubjectClass::where('teacher_id', $teacher->id)->delete();
            if ($request->has('sponsor_class_id')) {
                \App\Models\ClassModel::where('sponsor_teacher_id', $teacher->id)->update(['sponsor_teacher_id' => null]);
                if ($request->sponsor_class_id) {
                    \App\Models\ClassModel::whereKey($request->sponsor_class_id)->update(['sponsor_teacher_id' => $teacher->id]);
                }
            }
            return;
        }

        // Subject-teacher: sync subject+class assignments
        if ($role === 'subject-teacher') {
            \App\Models\ClassModel::where('sponsor_teacher_id', $teacher->id)->update(['sponsor_teacher_id' => null]);
            if ($request->has('subject_assignments')) {
                TeacherSubjectClass::where('teacher_id', $teacher->id)->delete();
                foreach ($request->input('subject_assignments', []) as $assignment) {
                    TeacherSubjectClass::create([
                        'teacher_id' => $teacher->id,
                        'subject_id' => $assignment['subject_id'],
                        'class_id'   => $assignment['class_id'],
                    ]);
                }
            }
        }
    }

    private function loadScope(Teacher $teacher): Teacher
    {
        return $teacher->fresh(['user.role', 'salaryStructure', 'sponsoredClass', 'classes', 'subjectClassAssignments.subject', 'subjectClassAssignments.class']);
    }

    private function generateEmployeeId(): string
    {
        $prefix = 'EMP';
        $year = date('Y');
        
        // Get the last teacher with an auto-generated employee ID for this year
        $lastTeacher = Teacher::where('employee_id', 'like', "{$prefix}-{$year}-%")
            ->orderBy('id', 'desc')
            ->first();
        
        $lastNumber = 0;
        if ($lastTeacher && preg_match("/^{$prefix}-{$year}-(\d{4})$/", $lastTeacher->employee_id, $matches)) {
            $lastNumber = (int) $matches[1];
        }
        
        // Generate a unique ID
        do {
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
            $employeeId = "{$prefix}-{$year}-{$newNumber}";
            $lastNumber++;
        } while (Teacher::where('employee_id', $employeeId)->exists());
        
        return $employeeId;
    }
}
