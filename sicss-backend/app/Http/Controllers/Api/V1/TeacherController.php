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
                $q->where('first_name', 'like', "{$search}%")
                    ->orWhere('last_name', 'like', "{$search}%")
                    ->orWhereHas('user', fn ($q) => $q->where('user_code', 'like', "{$search}%"))
                    ->orWhere('employee_id', 'like', "{$search}%")
                    ->orWhere('email', 'like', "{$search}%");
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
            'gender' => 'nullable|string',
            'date_of_birth' => 'nullable|date',
            'hire_date' => 'required|date',
            'qualifications' => 'nullable|string',
            'specialization' => 'nullable|string',
            'status' => 'in:active,inactive,on_leave',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'next_of_kin_name' => 'nullable|string|max:255',
            'next_of_kin_phone' => 'nullable|string|max:20',
            'next_of_kin_relationship' => 'nullable|string|max:100',
            'role' => 'nullable|in:TEACHER,STAFF',
            'username' => 'nullable|string|min:3|max:50|unique:users,username',
            'password' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        // Auto-generate employee ID if not provided
        $data = $request->except(['sponsor_class_id', 'subject_assignments', 'class_ids', 'role', 'username', 'password', 'is_active']);
        
        // Normalise gender to lowercase
        if (!empty($data['gender'])) {
            $data['gender'] = strtolower($data['gender']);
            if (!in_array($data['gender'], ['male', 'female', 'other'])) {
                $data['gender'] = 'other';
            }
        }
        
        if (empty($data['employee_id'])) {
            $role = $request->input('role', 'TEACHER');
            $data['employee_id'] = $this->generateEmployeeId($role);
        }

        // Create user account if username and password are provided
        if ($request->has('username') && $request->has('password')) {
            $role = $request->input('role', 'TEACHER');
            // Map role to correct slug
            $roleSlug = match($role) {
                'TEACHER' => 'teacher',
                'STAFF' => 'finance-staff',
                default => strtolower(str_replace('_', '-', $role)),
            };
            
            // Ensure email is unique in users table
            $userEmail = $data['email'] ?? null;
            if ($userEmail && \App\Models\User::where('email', $userEmail)->exists()) {
                // If email already exists in users table, use username-based email or null
                $userEmail = null;
            }
            
            $user = User::create([
                'username' => $request->username,
                'password' => bcrypt($request->password),
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => $userEmail,
                'role_id' => \App\Models\Role::where('slug', $roleSlug)->first()?->id,
                'is_active' => $request->is_active ?? true,
                'two_fa_enabled' => false,
            ]);
            $data['user_id'] = $user->id;
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
            'gender' => 'nullable|string',
            'date_of_birth' => 'nullable|date',
            'hire_date' => 'required|date',
            'qualifications' => 'nullable|string',
            'specialization' => 'nullable|string',
            'status' => 'in:active,inactive,on_leave',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'next_of_kin_name' => 'nullable|string|max:255',
            'next_of_kin_phone' => 'nullable|string|max:20',
            'next_of_kin_relationship' => 'nullable|string|max:100',
        ]);

        $data = $request->except(['sponsor_class_id', 'subject_assignments', 'class_ids']);
        
        // Normalise gender to lowercase
        if (!empty($data['gender'])) {
            $data['gender'] = strtolower($data['gender']);
            if (!in_array($data['gender'], ['male', 'female', 'other'])) {
                $data['gender'] = 'other';
            }
        }
        
        $teacher->update($data);
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

        // Note: Subject teacher assignments and class sponsor assignments
        // are now managed separately via TeacherAssignmentController
        // This method only handles the basic class_teacher pivot relationship
    }

    private function loadScope(Teacher $teacher): Teacher
    {
        return $teacher->fresh(['user.role', 'salaryStructure', 'sponsoredClass', 'classes', 'subjectClassAssignments.subject', 'subjectClassAssignments.class']);
    }

    private function generateEmployeeId(string $role = 'TEACHER'): string
    {
        return \App\Services\IdGeneratorService::generateEmployeeId($role);
    }
}
