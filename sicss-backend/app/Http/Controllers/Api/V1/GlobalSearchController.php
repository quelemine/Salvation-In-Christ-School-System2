<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\Request;

class GlobalSearchController extends Controller
{
    public function __invoke(Request $request)
    {
        $data = $request->validate([
            'q' => ['required', 'string', 'min:2', 'max:100'],
        ]);

        $query = trim($data['q']);
        $like = "%{$query}%";

        $students = Student::query()
            ->with('class:id,name,section')
            ->with('user:id,user_code')
            ->where(function ($builder) use ($like) {
                $builder->where('first_name', 'ilike', $like)
                    ->orWhere('last_name', 'ilike', $like)
                    ->orWhereHas('user', fn ($q) => $q->where('user_code', 'ilike', $like))
                    ->orWhere('student_id', 'ilike', $like)
                    ->orWhere('parent_guardian_email', 'ilike', $like)
                    ->orWhere('parent_guardian_phone', 'ilike', $like)
                    ->orWhere('phone', 'ilike', $like);
            })
            ->orderBy('first_name')
            ->limit(5)
            ->get()
            ->map(fn (Student $student) => [
                'type' => 'Student',
                'title' => trim("{$student->first_name} {$student->last_name}"),
                'subtitle' => collect([$student->user?->user_code, $student->class?->name, $student->class?->section])->filter()->implode(' · '),
                'path' => "/student-application?id={$student->id}",
            ]);

        $teachers = Teacher::query()
            ->with('user:id,user_code')
            ->where(function ($builder) use ($like) {
                $builder->where('first_name', 'ilike', $like)
                    ->orWhere('last_name', 'ilike', $like)
                    ->orWhereHas('user', fn ($q) => $q->where('user_code', 'ilike', $like))
                    ->orWhere('employee_id', 'ilike', $like)
                    ->orWhere('email', 'ilike', $like)
                    ->orWhere('phone', 'ilike', $like);
            })
            ->orderBy('first_name')
            ->limit(5)
            ->get()
            ->map(fn (Teacher $teacher) => [
                'type' => 'Teacher',
                'title' => trim("{$teacher->first_name} {$teacher->last_name}"),
                'subtitle' => collect([$teacher->user?->user_code, $teacher->email, $teacher->phone])->filter()->implode(' · '),
                'path' => '/teachers',
            ]);

        $staff = User::query()
            ->with('role:id,name')
            ->whereHas('role', fn ($roleQuery) => $roleQuery->where('slug', '!=', 'student'))
            ->where(function ($builder) use ($like) {
                $builder->where('first_name', 'ilike', $like)
                    ->orWhere('last_name', 'ilike', $like)
                    ->orWhere('user_code', 'ilike', $like)
                    ->orWhere('email', 'ilike', $like)
                    ->orWhere('phone', 'ilike', $like);
            })
            ->orderBy('first_name')
            ->limit(5)
            ->get()
            ->map(fn (User $user) => [
                'type' => 'Staff account',
                'title' => trim("{$user->first_name} {$user->last_name}"),
                'subtitle' => collect([$user->user_code, $user->role?->name, $user->email, $user->phone])->filter()->implode(' · '),
                'path' => '/users',
            ]);

        return response()->json([
            'data' => $students->concat($teachers)->concat($staff)->values(),
        ]);
    }
}
