<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class IdCardController extends Controller
{
    public function generateStudentIdCard(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,student_id',
        ]);

        $student = Student::with(['class'])->where('student_id', $request->student_id)->firstOrFail();

        $html = $this->generateStudentIdCardHtml($student);

        $filename = "id_card_{$student->student_id}.pdf";
        
        return response($html)
            ->header('Content-Type', 'text/html')
            ->header('Content-Disposition', "inline; filename={$filename}");
    }

    public function generateTeacherIdCard(Request $request)
    {
        $request->validate([
            'teacher_id' => 'required|exists:teachers,employee_id',
        ]);

        $teacher = Teacher::where('employee_id', $request->teacher_id)->firstOrFail();

        $html = $this->generateTeacherIdCardHtml($teacher);

        $filename = "id_card_{$teacher->employee_id}.pdf";
        
        return response($html)
            ->header('Content-Type', 'text/html')
            ->header('Content-Disposition', "inline; filename={$filename}");
    }

    private function generateStudentIdCardHtml($student)
    {
        $schoolName = 'Salvation In Christ School System';
        $schoolAddress = 'Monrovia, Liberia';
        
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <title>ID Card - {$student->student_id}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                .id-card { 
                    width: 300px; 
                    height: 480px; 
                    border: 2px solid #333; 
                    border-radius: 10px; 
                    padding: 20px; 
                    text-align: center;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                .school-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
                .school-address { font-size: 12px; margin-bottom: 20px; }
                .photo-placeholder { 
                    width: 120px; 
                    height: 120px; 
                    background: white; 
                    border-radius: 50%; 
                    margin: 0 auto 15px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #333;
                    font-size: 40px;
                }
                .student-name { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
                .student-id { font-size: 14px; margin-bottom: 15px; }
                .info-row { font-size: 12px; margin: 5px 0; }
                .label { font-weight: bold; }
                .barcode { 
                    margin-top: 20px; 
                    font-family: monospace; 
                    font-size: 10px; 
                    letter-spacing: 2px;
                }
            </style>
        </head>
        <body>
            <div class='id-card'>
                <div class='school-name'>{$schoolName}</div>
                <div class='school-address'>{$schoolAddress}</div>
                <div class='photo-placeholder'>👤</div>
                <div class='student-name'>{$student->first_name} {$student->last_name}</div>
                <div class='student-id'>ID: {$student->student_id}</div>
                <div class='info-row'><span class='label'>Class:</span> " . ($student->class ? $student->class->name : 'N/A') . "</div>
                <div class='info-row'><span class='label'>Gender:</span> " . ($student->gender ?: 'N/A') . "</div>
                <div class='info-row'><span class='label'>Status:</span> {$student->status}</div>
                <div class='barcode'>{$student->student_id}</div>
            </div>
        </body>
        </html>
        ";
    }

    private function generateTeacherIdCardHtml($teacher)
    {
        $schoolName = 'Salvation In Christ School System';
        $schoolAddress = 'Monrovia, Liberia';
        
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <title>ID Card - {$teacher->employee_id}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                .id-card { 
                    width: 300px; 
                    height: 480px; 
                    border: 2px solid #333; 
                    border-radius: 10px; 
                    padding: 20px; 
                    text-align: center;
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    color: white;
                }
                .school-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
                .school-address { font-size: 12px; margin-bottom: 20px; }
                .photo-placeholder { 
                    width: 120px; 
                    height: 120px; 
                    background: white; 
                    border-radius: 50%; 
                    margin: 0 auto 15px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #333;
                    font-size: 40px;
                }
                .teacher-name { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
                .employee-id { font-size: 14px; margin-bottom: 15px; }
                .info-row { font-size: 12px; margin: 5px 0; }
                .label { font-weight: bold; }
                .barcode { 
                    margin-top: 20px; 
                    font-family: monospace; 
                    font-size: 10px; 
                    letter-spacing: 2px;
                }
            </style>
        </head>
        <body>
            <div class='id-card'>
                <div class='school-name'>{$schoolName}</div>
                <div class='school-address'>{$schoolAddress}</div>
                <div class='photo-placeholder'>👨‍🏫</div>
                <div class='teacher-name'>{$teacher->first_name} {$teacher->last_name}</div>
                <div class='employee-id'>ID: {$teacher->employee_id}</div>
                <div class='info-row'><span class='label'>Role:</span> Teacher</div>
                <div class='info-row'><span class='label'>Subject:</span> " . ($teacher->subject_specialization ?: 'N/A') . "</div>
                <div class='info-row'><span class='label'>Status:</span> {$teacher->status}</div>
                <div class='barcode'>{$teacher->employee_id}</div>
            </div>
        </body>
        </html>
        ";
    }
}
