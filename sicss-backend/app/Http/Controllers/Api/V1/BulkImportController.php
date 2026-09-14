<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Class as ClassModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BulkImportController extends Controller
{
    public function importStudents(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt',
        ]);

        $file = $request->file('file');
        $path = $file->getRealPath();
        $data = array_map('str_getcsv', file($path));
        $headers = array_shift($data);

        $imported = 0;
        $failed = 0;
        $errors = [];

        foreach ($data as $row) {
            $studentData = array_combine($headers, $row);
            
            $validator = Validator::make($studentData, [
                'student_id' => 'required|string|unique:students,student_id',
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'nullable|email|unique:students,email',
                'date_of_birth' => 'nullable|date',
                'gender' => 'nullable|in:male,female',
                'address' => 'nullable|string',
                'parent_guardian_name' => 'nullable|string|max:255',
                'parent_guardian_phone' => 'nullable|string|max:20',
                'parent_guardian_email' => 'nullable|email',
            ]);

            if ($validator->fails()) {
                $failed++;
                $errors[] = [
                    'row' => $studentData,
                    'errors' => $validator->errors()->all(),
                ];
                continue;
            }

            try {
                Student::create([
                    'student_id' => $studentData['student_id'],
                    'first_name' => $studentData['first_name'],
                    'last_name' => $studentData['last_name'],
                    'email' => $studentData['email'] ?? null,
                    'date_of_birth' => $studentData['date_of_birth'] ?? null,
                    'gender' => $studentData['gender'] ?? null,
                    'address' => $studentData['address'] ?? null,
                    'parent_guardian_name' => $studentData['parent_guardian_name'] ?? null,
                    'parent_guardian_phone' => $studentData['parent_guardian_phone'] ?? null,
                    'parent_guardian_email' => $studentData['parent_guardian_email'] ?? null,
                    'status' => 'active',
                ]);
                $imported++;
            } catch (\Exception $e) {
                $failed++;
                $errors[] = [
                    'row' => $studentData,
                    'errors' => [$e->getMessage()],
                ];
            }
        }

        return response()->json([
            'message' => 'Import completed',
            'imported' => $imported,
            'failed' => $failed,
            'errors' => $errors,
        ]);
    }

    public function importTeachers(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt',
        ]);

        $file = $request->file('file');
        $path = $file->getRealPath();
        $data = array_map('str_getcsv', file($path));
        $headers = array_shift($data);

        $imported = 0;
        $failed = 0;
        $errors = [];

        foreach ($data as $row) {
            $teacherData = array_combine($headers, $row);
            
            $validator = Validator::make($teacherData, [
                'employee_id' => 'required|string|unique:teachers,employee_id',
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'nullable|email|unique:teachers,email',
                'phone' => 'nullable|string|max:20',
                'date_of_birth' => 'nullable|date',
                'gender' => 'nullable|in:male,female',
                'address' => 'nullable|string',
                'qualification' => 'nullable|string',
                'subject_specialization' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                $failed++;
                $errors[] = [
                    'row' => $teacherData,
                    'errors' => $validator->errors()->all(),
                ];
                continue;
            }

            try {
                Teacher::create([
                    'employee_id' => $teacherData['employee_id'],
                    'first_name' => $teacherData['first_name'],
                    'last_name' => $teacherData['last_name'],
                    'email' => $teacherData['email'] ?? null,
                    'phone' => $teacherData['phone'] ?? null,
                    'date_of_birth' => $teacherData['date_of_birth'] ?? null,
                    'gender' => $teacherData['gender'] ?? null,
                    'address' => $teacherData['address'] ?? null,
                    'qualification' => $teacherData['qualification'] ?? null,
                    'subject_specialization' => $teacherData['subject_specialization'] ?? null,
                    'status' => 'active',
                ]);
                $imported++;
            } catch (\Exception $e) {
                $failed++;
                $errors[] = [
                    'row' => $teacherData,
                    'errors' => [$e->getMessage()],
                ];
            }
        }

        return response()->json([
            'message' => 'Import completed',
            'imported' => $imported,
            'failed' => $failed,
            'errors' => $errors,
        ]);
    }

    public function exportStudents()
    {
        $students = Student::all();
        $headers = ['student_id', 'first_name', 'last_name', 'email', 'date_of_birth', 'gender', 'address', 'parent_guardian_name', 'parent_guardian_phone', 'parent_guardian_email', 'status'];
        
        $csv = fopen('php://temp', 'r+');
        fputcsv($csv, $headers);
        
        foreach ($students as $student) {
            fputcsv($csv, [
                $student->student_id,
                $student->first_name,
                $student->last_name,
                $student->email,
                $student->date_of_birth,
                $student->gender,
                $student->address,
                $student->parent_guardian_name,
                $student->parent_guardian_phone,
                $student->parent_guardian_email,
                $student->status,
            ]);
        }
        
        rewind($csv);
        $csvContent = stream_get_contents($csv);
        fclose($csv);

        return response($csvContent)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="students_export.csv"');
    }

    public function exportTeachers()
    {
        $teachers = Teacher::all();
        $headers = ['employee_id', 'first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender', 'address', 'qualification', 'subject_specialization', 'status'];
        
        $csv = fopen('php://temp', 'r+');
        fputcsv($csv, $headers);
        
        foreach ($teachers as $teacher) {
            fputcsv($csv, [
                $teacher->employee_id,
                $teacher->first_name,
                $teacher->last_name,
                $teacher->email,
                $teacher->phone,
                $teacher->date_of_birth,
                $teacher->gender,
                $teacher->address,
                $teacher->qualification,
                $teacher->subject_specialization,
                $teacher->status,
            ]);
        }
        
        rewind($csv);
        $csvContent = stream_get_contents($csv);
        fclose($csv);

        return response($csvContent)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="teachers_export.csv"');
    }

    public function exportClasses()
    {
        $classes = ClassModel::all();
        $headers = ['name', 'section', 'academic_year', 'capacity', 'status'];
        
        $csv = fopen('php://temp', 'r+');
        fputcsv($csv, $headers);
        
        foreach ($classes as $class) {
            fputcsv($csv, [
                $class->name,
                $class->section,
                $class->academic_year,
                $class->capacity,
                $class->status,
            ]);
        }
        
        rewind($csv);
        $csvContent = stream_get_contents($csv);
        fclose($csv);

        return response($csvContent)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="classes_export.csv"');
    }
}
