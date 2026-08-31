<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function index(Request $request)
    {
        $query = Student::with('class')->with('user:id,user_code');

        if ($this->isScopedTeacher($request)) {
            $classIds = $this->permittedClassIds($request);
            if (empty($classIds)) return response()->json(['data' => [], 'total' => 0]);
            $query->whereIn('class_id', $classIds);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($q) => $q->where('user_code', 'like', "%{$search}%"))
                    ->orWhere('student_id', 'like', "%{$search}%");
            });
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        $students = $query->orderBy('created_at', 'desc')->paginate($request->per_page ?? 15);
        return response()->json($students);
    }

    public function store(Request $request)
    {
        $request->validate([
            'user_id'               => 'nullable|exists:users,id',
            'student_id'            => 'nullable|string',
            'class_id'              => 'nullable|exists:classes,id',
            'first_name'            => 'required|string|max:255',
            'last_name'             => 'required|string|max:255',
            'date_of_birth'         => 'required|date',
            'gender'                => 'required|string',
            'parent_guardian_name'  => 'nullable|string|max:255',
            'parent_guardian_phone' => 'nullable|string|max:30',
            'parent_guardian_email' => 'nullable|email|max:255',
            'phone'                 => 'nullable|string|max:30',
            'address'               => 'nullable|string',
            'photo'                 => 'nullable|string',
            'photo_url'             => 'nullable|string',
            'admission_date'        => 'nullable|date',
            'status'                => 'nullable|in:active,inactive,graduated,transferred',
            // Extended application fields
            'place_of_birth'         => 'nullable|string|max:255',
            'nationality'            => 'nullable|string|max:255',
            'county'                 => 'nullable|string|max:255',
            'previous_school'        => 'nullable|string|max:255',
            'grade_applying_for'     => 'nullable|string|max:100',
            'father_name'            => 'nullable|string|max:255',
            'mother_name'            => 'nullable|string|max:255',
            'father_occupation'      => 'nullable|string|max:255',
            'mother_occupation'      => 'nullable|string|max:255',
            'father_contact'         => 'nullable|string|max:30',
            'mother_contact'         => 'nullable|string|max:30',
            'parent_address'         => 'nullable|string',
            'has_illness'            => 'nullable|boolean',
            'illness_details'        => 'nullable|string',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone'=> 'nullable|string|max:30',
            'sports_interest'        => 'nullable|string',
            'additional_notes'       => 'nullable|string',
            'registration_number'    => 'nullable|string|max:100',
            'class_assigned'         => 'nullable|string|max:100',
            'approved_by_registrar'  => 'nullable|string|max:255',
            'approved_by_principal'  => 'nullable|string|max:255',
            'approval_date'          => 'nullable|date',
            'application_status'     => 'nullable|in:pending,approved,rejected',
        ]);

        // Normalise gender to lowercase
        // Registration numbers are issued by the system and cannot be supplied
        // or changed by clients.
        $data = $request->except('registration_number');
        if ($request->user()?->hasRole('student')) $data['user_id'] = $request->user()->id;
        $data['gender'] = strtolower($data['gender'] ?? 'other');
        if (!in_array($data['gender'], ['male', 'female', 'other'])) {
            $data['gender'] = 'other';
        }

        // Ensure student_id is unique with proper sequential format
        if (empty($data['student_id'])) {
            $year = date('Y');
            $last = \App\Models\Student::where('student_id', 'like', "STU-{$year}-%")
                ->where('student_id', 'not like', "%-%-%")  // Exclude timestamped IDs
                ->orderByRaw("CAST(SPLIT_PART(student_id, '-', 3) AS INTEGER) DESC")
                ->first();
            $next = 1;
            if ($last) {
                $parts = explode('-', $last->student_id);
                $next  = (int) ($parts[2] ?? 0) + 1;
            }
            $data['student_id'] = "STU-{$year}-" . str_pad($next, 3, '0', STR_PAD_LEFT);

            // Ensure unique student_id (avoid collision by incrementing)
            while (\App\Models\Student::where('student_id', $data['student_id'])->exists()) {
                $next++;
                $data['student_id'] = "STU-{$year}-" . str_pad($next, 3, '0', STR_PAD_LEFT);
            }
        }

        $data['registration_number'] = $this->nextRegistrationNumber();

        // Default admission_date to today
        if (empty($data['admission_date'])) {
            $data['admission_date'] = now()->toDateString();
        }

        // Default status
        if (empty($data['status'])) {
            $data['status'] = 'active';
        }

        $student = \App\Models\Student::create($data);
        $student->load('class');
        return response()->json($student, 201);
    }

    public function show(Request $request, Student $student)
    {
        if ($this->isScopedTeacher($request) && !in_array($student->class_id, $this->permittedClassIds($request))) {
            return response()->json(['message' => 'Unauthorized - student is not in your assigned class'], 403);
        }
        $student->load('class')->load('user:id,user_code');
        return response()->json($student);
    }

    public function update(Request $request, Student $student)
    {
        $request->validate([
            'user_id'               => 'nullable|exists:users,id',
            'student_id'            => 'nullable|string|unique:students,student_id,' . $student->id,
            'class_id'              => 'nullable|exists:classes,id',
            'first_name'            => 'required|string|max:255',
            'last_name'             => 'required|string|max:255',
            'date_of_birth'         => 'required|date',
            'gender'                => 'required|string',
            'parent_guardian_name'  => 'nullable|string|max:255',
            'parent_guardian_phone' => 'nullable|string|max:30',
            'parent_guardian_email' => 'nullable|email|max:255',
            'phone'                 => 'nullable|string|max:30',
            'address'               => 'nullable|string',
            'photo'                 => 'nullable|string',
            'photo_url'             => 'nullable|string',
            'admission_date'        => 'nullable|date',
            'status'                => 'nullable|in:active,inactive,graduated,transferred',
            'place_of_birth'         => 'nullable|string|max:255',
            'nationality'            => 'nullable|string|max:255',
            'county'                 => 'nullable|string|max:255',
            'previous_school'        => 'nullable|string|max:255',
            'grade_applying_for'     => 'nullable|string|max:100',
            'father_name'            => 'nullable|string|max:255',
            'mother_name'            => 'nullable|string|max:255',
            'father_occupation'      => 'nullable|string|max:255',
            'mother_occupation'      => 'nullable|string|max:255',
            'father_contact'         => 'nullable|string|max:30',
            'mother_contact'         => 'nullable|string|max:30',
            'parent_address'         => 'nullable|string',
            'has_illness'            => 'nullable|boolean',
            'illness_details'        => 'nullable|string',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone'=> 'nullable|string|max:30',
            'sports_interest'        => 'nullable|string',
            'additional_notes'       => 'nullable|string',
            'registration_number'    => 'nullable|string|max:100',
            'class_assigned'         => 'nullable|string|max:100',
            'approved_by_registrar'  => 'nullable|string|max:255',
            'approved_by_principal'  => 'nullable|string|max:255',
            'approval_date'          => 'nullable|date',
            'application_status'     => 'nullable|in:pending,approved,rejected',
        ]);

        // Preserve the registration number already issued for this student.
        $data = $request->except('registration_number');
        // Normalise gender
        if (!empty($data['gender'])) {
            $data['gender'] = strtolower($data['gender']);
            if (!in_array($data['gender'], ['male', 'female', 'other'])) {
                $data['gender'] = 'other';
            }
        }
        if (empty($data['admission_date'])) {
            $data['admission_date'] = $student->admission_date ?? now()->toDateString();
        }
        if (empty($data['student_id'])) {
            $data['student_id'] = $student->student_id;
        }
        $data['registration_number'] = $student->registration_number ?: $this->nextRegistrationNumber();

        $student->update($data);
        $student->load('class');
        return response()->json($student);
    }

    public function me(Request $request)
    {
        $student = Student::where('user_id', $request->user()->id)
            ->with('class')
            ->with('user:id,user_code,email')
            ->first();
        
        if (!$student) {
            return response()->json(['message' => 'Student profile not found'], 404);
        }
        
        return response()->json($student);
    }

    public function destroy(Student $student)
    {
        $student->delete();
        return response()->json(['message' => 'Student deleted successfully']);
    }

    private function isScopedTeacher(Request $request): bool
    {
        return $request->user()->hasAnyRole(['teacher', 'class-sponsor', 'subject-teacher']);
    }

    private function permittedClassIds(Request $request): array
    {
        $teacher = Teacher::where('user_id', $request->user()->id)->first();
        if (!$teacher) return [];

        if ($request->user()->hasRole('subject-teacher')) {
            return $teacher->getSubjectClassIds();
        }

        $classIds = $teacher->classes()->pluck('classes.id')
            ->merge(\App\Models\ClassModel::where('sponsor_teacher_id', $teacher->id)->pluck('id'));

        return $classIds->unique()->values()->all();
    }

    private function nextRegistrationNumber(): string
    {
        $year = date('Y');
        $last = Student::where('registration_number', 'like', "REG-{$year}-%")
            ->orderByRaw("CAST(SPLIT_PART(registration_number, '-', 3) AS INTEGER) DESC")
            ->first();

        $next = 1;
        if ($last) {
            $parts = explode('-', $last->registration_number);
            $next = (int) ($parts[2] ?? 0) + 1;
        }

        return "REG-{$year}-" . str_pad($next, 3, '0', STR_PAD_LEFT);
    }
}
