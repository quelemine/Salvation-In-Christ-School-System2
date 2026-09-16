<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ClassModel;
use App\Models\Role;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\TeacherSubjectClass;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TeacherAssignmentController extends Controller
{
    /**
     * Get all teaching assignments for a teacher
     */
    public function index(Request $request, $teacherId)
    {
        $teacher = Teacher::with(['user', 'subjectClassAssignments.subject', 'subjectClassAssignments.class', 'sponsoredClass'])->findOrFail($teacherId);

        $subjectAssignments = $teacher->subjectClassAssignments->map(function ($assignment) {
            return [
                'id' => $assignment->id,
                'subject_id' => $assignment->subject_id,
                'subject_name' => $assignment->subject->name ?? null,
                'class_id' => $assignment->class_id,
                'class_name' => $assignment->class->name ?? null,
            ];
        });

        $classSponsorship = $teacher->sponsoredClass ? [
            'class_id' => $teacher->sponsoredClass->id,
            'class_name' => $teacher->sponsoredClass->name,
        ] : null;

        return response()->json([
            'teacher' => [
                'id' => $teacher->id,
                'name' => $teacher->first_name . ' ' . $teacher->last_name,
                'employee_id' => $teacher->employee_id,
                'system_role' => $teacher->user->role->name ?? null,
                'system_role_slug' => $teacher->user->role->slug ?? null,
            ],
            'subject_assignments' => $subjectAssignments,
            'class_sponsorship' => $classSponsorship,
        ]);
    }

    /**
     * Assign a teacher to teach a subject for a specific class
     */
    public function assignSubject(Request $request, $teacherId)
    {
        $data = $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'class_id' => 'required|exists:classes,id',
        ]);

        $teacher = Teacher::findOrFail($teacherId);

        // Check if assignment already exists
        $existing = TeacherSubjectClass::where('teacher_id', $teacher->id)
            ->where('subject_id', $data['subject_id'])
            ->where('class_id', $data['class_id'])
            ->first();

        if ($existing) {
            return response()->json(['message' => 'This assignment already exists'], 422);
        }

        // Create the assignment
        TeacherSubjectClass::create([
            'teacher_id' => $teacher->id,
            'subject_id' => $data['subject_id'],
            'class_id' => $data['class_id'],
        ]);

        return response()->json(['message' => 'Subject assignment created successfully'], 201);
    }

    /**
     * Remove a subject assignment from a teacher
     */
    public function removeSubjectAssignment(Request $request, $teacherId, $assignmentId)
    {
        $assignment = TeacherSubjectClass::where('id', $assignmentId)
            ->where('teacher_id', $teacherId)
            ->firstOrFail();

        $assignment->delete();

        return response()->json(['message' => 'Subject assignment removed successfully']);
    }

    /**
     * Assign a teacher as class sponsor
     */
    public function assignClassSponsor(Request $request, $teacherId)
    {
        $data = $request->validate([
            'class_id' => 'required|exists:classes,id',
        ]);

        $teacher = Teacher::findOrFail($teacherId);

        // Check if class already has a sponsor
        $existingSponsor = ClassModel::where('id', $data['class_id'])
            ->whereNotNull('sponsor_teacher_id')
            ->first();

        if ($existingSponsor && $existingSponsor->sponsor_teacher_id !== $teacher->id) {
            return response()->json(['message' => 'This class already has a sponsor. Remove the current sponsor first.'], 422);
        }

        // Assign as sponsor
        ClassModel::where('id', $data['class_id'])
            ->update(['sponsor_teacher_id' => $teacher->id]);

        return response()->json(['message' => 'Class sponsorship assigned successfully']);
    }

    /**
     * Remove class sponsorship from a teacher
     */
    public function removeClassSponsorship(Request $request, $teacherId, $classId)
    {
        $class = ClassModel::where('id', $classId)
            ->where('sponsor_teacher_id', $teacherId)
            ->firstOrFail();

        $class->update(['sponsor_teacher_id' => null]);

        return response()->json(['message' => 'Class sponsorship removed successfully']);
    }

    /**
     * Change a teacher's system role
     */
    public function changeSystemRole(Request $request, $teacherId)
    {
        $data = $request->validate([
            'role_id' => 'required|exists:roles,id',
        ]);

        $teacher = Teacher::with('user')->findOrFail($teacherId);

        $role = Role::findOrFail($data['role_id']);

        // Update the user's role
        $teacher->user->update(['role_id' => $data['role_id']]);

        return response()->json([
            'message' => 'System role updated successfully',
            'new_role' => $role->name,
        ]);
    }

    /**
     * Get all teachers with their assignments (for Admin view)
     */
    public function allTeachers(Request $request)
    {
        $teachers = Teacher::with(['user.role', 'subjectClassAssignments.subject', 'subjectClassAssignments.class', 'sponsoredClass'])
            ->get()
            ->map(function ($teacher) {
                return [
                    'id' => $teacher->id,
                    'name' => $teacher->first_name . ' ' . $teacher->last_name,
                    'employee_id' => $teacher->employee_id,
                    'email' => $teacher->email,
                    'system_role' => $teacher->user->role->name ?? null,
                    'system_role_slug' => $teacher->user->role->slug ?? null,
                    'is_subject_teacher' => $teacher->isSubjectTeacher(),
                    'is_class_sponsor' => $teacher->isClassSponsor(),
                    'subject_count' => $teacher->subjectClassAssignments->count(),
                    'sponsored_class' => $teacher->sponsoredClass ? $teacher->sponsoredClass->name : null,
                ];
            });

        return response()->json($teachers);
    }
}
