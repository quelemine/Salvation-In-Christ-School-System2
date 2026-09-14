<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Student;
use Illuminate\Http\Request;

class CertificateController extends Controller
{
    public function generateCompletionCertificate(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'academic_year' => 'required|string',
        ]);

        $student = Student::with(['class'])->findOrFail($request->student_id);

        $html = $this->generateCompletionCertificateHtml($student, $request->academic_year);

        $filename = "completion_certificate_{$student->student_id}.pdf";
        
        return response($html)
            ->header('Content-Type', 'text/html')
            ->header('Content-Disposition', "inline; filename={$filename}");
    }

    public function generateAchievementCertificate(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'achievement_type' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date' => 'required|date',
        ]);

        $student = Student::with(['class'])->findOrFail($request->student_id);

        $html = $this->generateAchievementCertificateHtml(
            $student, 
            $request->achievement_type,
            $request->description,
            $request->date
        );

        $filename = "achievement_certificate_{$student->student_id}.pdf";
        
        return response($html)
            ->header('Content-Type', 'text/html')
            ->header('Content-Disposition', "inline; filename={$filename}");
    }

    private function generateCompletionCertificateHtml($student, $academicYear)
    {
        $schoolName = 'Salvation In Christ School System';
        $schoolAddress = 'Monrovia, Liberia';
        $date = date('F j, Y');
        
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <title>Completion Certificate - {$student->student_id}</title>
            <style>
                body { font-family: 'Times New Roman', serif; margin: 0; padding: 40px; background: #f5f5f5; }
                .certificate { 
                    max-width: 800px; 
                    margin: 0 auto; 
                    border: 10px solid #8B4513; 
                    padding: 40px; 
                    text-align: center;
                    background: white;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                .school-name { font-size: 32px; font-weight: bold; color: #8B4513; margin-bottom: 10px; }
                .school-address { font-size: 14px; color: #666; margin-bottom: 30px; }
                .certificate-title { 
                    font-size: 48px; 
                    font-weight: bold; 
                    color: #1a1a1a; 
                    margin: 30px 0; 
                    text-transform: uppercase;
                    letter-spacing: 2px;
                }
                .presented-to { font-size: 18px; color: #666; margin: 20px 0; }
                .student-name { 
                    font-size: 36px; 
                    font-weight: bold; 
                    color: #8B4513; 
                    margin: 20px 0; 
                    font-family: 'Georgia', serif;
                }
                .description { font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0; max-width: 600px; margin-left: auto; margin-right: auto; }
                .details { font-size: 16px; color: #333; margin: 20px 0; }
                .signature-section { 
                    display: flex; 
                    justify-content: space-between; 
                    margin-top: 60px; 
                    padding: 0 50px;
                }
                .signature-box { text-align: center; }
                .signature-line { 
                    border-top: 2px solid #333; 
                    width: 200px; 
                    margin: 0 auto 10px;
                }
                .signature-label { font-size: 14px; color: #666; }
                .seal { 
                    width: 100px; 
                    height: 100px; 
                    border: 3px solid #8B4513; 
                    border-radius: 50%; 
                    margin: 20px auto;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    color: #8B4513;
                }
            </style>
        </head>
        <body>
            <div class='certificate'>
                <div class='school-name'>{$schoolName}</div>
                <div class='school-address'>{$schoolAddress}</div>
                
                <div class='certificate-title'>Certificate of Completion</div>
                
                <div class='presented-to'>This is to certify that</div>
                <div class='student-name'>{$student->first_name} {$student->last_name}</div>
                
                <div class='description'>
                    has successfully completed the academic requirements for the 
                    <strong>" . ($student->class ? $student->class->name : 'General Studies') . "</strong> 
                    program during the academic year <strong>{$academicYear}</strong>.
                </div>
                
                <div class='details'>
                    Student ID: {$student->student_id}<br>
                    Date of Issue: {$date}
                </div>
                
                <div class='seal'>OFFICIAL SEAL</div>
                
                <div class='signature-section'>
                    <div class='signature-box'>
                        <div class='signature-line'></div>
                        <div class='signature-label'>Principal</div>
                    </div>
                    <div class='signature-box'>
                        <div class='signature-line'></div>
                        <div class='signature-label'>Director</div>
                    </div>
                </div>
            </div>
        </body>
        </html>
        ";
    }

    private function generateAchievementCertificateHtml($student, $achievementType, $description, $date)
    {
        $schoolName = 'Salvation In Christ School System';
        $schoolAddress = 'Monrovia, Liberia';
        $formattedDate = date('F j, Y', strtotime($date));
        
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <title>Achievement Certificate - {$student->student_id}</title>
            <style>
                body { font-family: 'Times New Roman', serif; margin: 0; padding: 40px; background: #f5f5f5; }
                .certificate { 
                    max-width: 800px; 
                    margin: 0 auto; 
                    border: 10px solid #FFD700; 
                    padding: 40px; 
                    text-align: center;
                    background: linear-gradient(to bottom, #fff9e6, white);
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                .school-name { font-size: 32px; font-weight: bold; color: #8B4513; margin-bottom: 10px; }
                .school-address { font-size: 14px; color: #666; margin-bottom: 30px; }
                .certificate-title { 
                    font-size: 42px; 
                    font-weight: bold; 
                    color: #FFD700; 
                    margin: 30px 0; 
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
                }
                .presented-to { font-size: 18px; color: #666; margin: 20px 0; }
                .student-name { 
                    font-size: 36px; 
                    font-weight: bold; 
                    color: #8B4513; 
                    margin: 20px 0; 
                    font-family: 'Georgia', serif;
                }
                .achievement { 
                    font-size: 28px; 
                    font-weight: bold; 
                    color: #FF6B35; 
                    margin: 20px 0; 
                }
                .description { font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0; max-width: 600px; margin-left: auto; margin-right: auto; }
                .details { font-size: 16px; color: #333; margin: 20px 0; }
                .signature-section { 
                    display: flex; 
                    justify-content: space-between; 
                    margin-top: 60px; 
                    padding: 0 50px;
                }
                .signature-box { text-align: center; }
                .signature-line { 
                    border-top: 2px solid #333; 
                    width: 200px; 
                    margin: 0 auto 10px;
                }
                .signature-label { font-size: 14px; color: #666; }
                .ribbon { 
                    font-size: 48px; 
                    margin: 20px 0; 
                }
            </style>
        </head>
        <body>
            <div class='certificate'>
                <div class='ribbon'>🏆</div>
                <div class='school-name'>{$schoolName}</div>
                <div class='school-address'>{$schoolAddress}</div>
                
                <div class='certificate-title'>Certificate of Achievement</div>
                
                <div class='presented-to'>This is to certify that</div>
                <div class='student-name'>{$student->first_name} {$student->last_name}</div>
                
                <div class='achievement'>{$achievementType}</div>
                
                <div class='details'>
                    Student ID: {$student->student_id}<br>
                    Date: {$formattedDate}
                </div>
                
                <div class='signature-section'>
                    <div class='signature-box'>
                        <div class='signature-line'></div>
                        <div class='signature-label'>Principal</div>
                    </div>
                    <div class='signature-box'>
                        <div class='signature-line'></div>
                        <div class='signature-label'>Date</div>
                    </div>
                </div>
            </div>
        </body>
        </html>
        ";
    }
}
