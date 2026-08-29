<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\ClassModel;
use App\Models\Division;
use App\Models\Fee;
use App\Models\Grade;
use App\Models\Payment;
use App\Models\Receipt;
use App\Models\Role;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $roles = Role::whereIn('slug', ['admin', 'teacher', 'student', 'finance-staff'])->pluck('id', 'slug');
        $password = Hash::make('1234');

        $teacherUser = User::updateOrCreate(
            ['email' => 'teacher.test@sicss.com'],
            ['first_name' => 'Maria', 'last_name' => 'Teacher', 'password' => $password, 'role_id' => $roles['teacher'] ?? null, 'is_active' => true]
        );
        $studentUser = User::updateOrCreate(
            ['email' => 'student.test@sicss.com'],
            ['first_name' => 'Daniel', 'last_name' => 'Student', 'password' => $password, 'role_id' => $roles['student'] ?? null, 'is_active' => true]
        );
        User::updateOrCreate(
            ['email' => 'finance.test@sicss.com'],
            ['first_name' => 'James', 'last_name' => 'Finance', 'password' => $password, 'role_id' => $roles['finance-staff'] ?? null, 'is_active' => true]
        );

        $primary = Division::updateOrCreate(['slug' => 'primary-school'], ['name' => 'Primary School', 'description' => 'Primary school division', 'order' => 1, 'is_active' => true]);
        $secondary = Division::updateOrCreate(['slug' => 'secondary-school'], ['name' => 'Secondary School', 'description' => 'Secondary school division', 'order' => 2, 'is_active' => true]);

        $gradeFour = ClassModel::updateOrCreate(['slug' => 'grade-4-blue'], ['division_id' => $primary->id, 'name' => 'Grade 4', 'section' => 'Blue', 'capacity' => 30, 'order' => 1, 'is_active' => true]);
        $gradeSeven = ClassModel::updateOrCreate(['slug' => 'grade-7-green'], ['division_id' => $secondary->id, 'name' => 'Grade 7', 'section' => 'Green', 'capacity' => 35, 'order' => 1, 'is_active' => true]);

        $math = Subject::updateOrCreate(['code' => 'MATH-04'], ['name' => 'Mathematics', 'slug' => 'mathematics-grade-4', 'description' => 'Mathematics', 'credits' => '4', 'order' => 1, 'is_active' => true]);
        $english = Subject::updateOrCreate(['code' => 'ENG-04'], ['name' => 'English Language', 'slug' => 'english-language-grade-4', 'description' => 'English language', 'credits' => '3', 'order' => 2, 'is_active' => true]);
        $reportSubjects = ['Bible', 'English', 'Reading', 'Spelling', 'Phonics', 'Science', 'Mathematics', 'Identifying Color', 'Writing', 'Reciting', 'Health Science', 'Identifying Object', 'Social Studies', 'Drawing', 'Physical Education'];
        foreach ($reportSubjects as $index => $name) {
            $code = 'KDG-'.str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT);
            $subject = Subject::updateOrCreate(['code' => $code], ['name' => $name, 'slug' => str($name)->slug().'-kindergarten', 'description' => 'Report card subject', 'credits' => '1', 'order' => $index + 1, 'is_active' => true]);
            $gradeFour->subjects()->syncWithoutDetaching([$subject->id]);
        }
        $gradeFour->subjects()->syncWithoutDetaching([$math->id, $english->id]);
        $gradeSeven->subjects()->syncWithoutDetaching([$math->id]);

        $teacher = Teacher::updateOrCreate(['employee_id' => 'TCH-0001'], ['user_id' => $teacherUser->id, 'first_name' => 'Maria', 'last_name' => 'Teacher', 'email' => 'teacher.test@sicss.com', 'gender' => 'female', 'hire_date' => now()->subYears(2)->toDateString(), 'specialization' => 'Primary education', 'status' => 'active']);

        $daniel = Student::updateOrCreate(['student_id' => 'STU-0001'], ['class_id' => $gradeFour->id, 'first_name' => 'Daniel', 'last_name' => 'Student', 'date_of_birth' => '2016-04-12', 'gender' => 'male', 'parent_guardian_name' => 'Sarah Student', 'parent_guardian_email' => 'student.test@sicss.com', 'admission_date' => now()->subMonths(8)->toDateString(), 'status' => 'active']);
        $grace = Student::updateOrCreate(['student_id' => 'STU-0002'], ['class_id' => $gradeFour->id, 'first_name' => 'Grace', 'last_name' => 'Doe', 'date_of_birth' => '2016-09-21', 'gender' => 'female', 'parent_guardian_name' => 'David Doe', 'admission_date' => now()->subMonths(7)->toDateString(), 'status' => 'active']);
        $samuel = Student::updateOrCreate(['student_id' => 'STU-0003'], ['class_id' => $gradeSeven->id, 'first_name' => 'Samuel', 'last_name' => 'Kollie', 'date_of_birth' => '2013-02-18', 'gender' => 'male', 'parent_guardian_name' => 'Mary Kollie', 'admission_date' => now()->subMonths(6)->toDateString(), 'status' => 'active']);

        Grade::updateOrCreate(['student_id' => $daniel->id, 'subject_id' => $math->id, 'term' => 'Term 1', 'academic_year' => '2026'], ['teacher_id' => $teacher->id, 'score' => 86, 'grade' => 'B', 'remarks' => 'Good progress']);
        Grade::updateOrCreate(['student_id' => $daniel->id, 'subject_id' => $english->id, 'term' => 'Term 1', 'academic_year' => '2026'], ['teacher_id' => $teacher->id, 'score' => 91, 'grade' => 'A', 'remarks' => 'Excellent work']);

        Attendance::updateOrCreate(['student_id' => $daniel->id, 'date' => now()->toDateString()], ['class_id' => $gradeFour->id, 'teacher_id' => $teacher->id, 'status' => 'present', 'remarks' => 'Present']);
        Attendance::updateOrCreate(['student_id' => $grace->id, 'date' => now()->toDateString()], ['class_id' => $gradeFour->id, 'teacher_id' => $teacher->id, 'status' => 'late', 'remarks' => 'Arrived late']);
        Attendance::updateOrCreate(['student_id' => $samuel->id, 'date' => now()->toDateString()], ['class_id' => $gradeSeven->id, 'teacher_id' => $teacher->id, 'status' => 'absent', 'remarks' => 'Absent']);

        $tuition = Fee::updateOrCreate(['slug' => 'tuition-2026-demo'], ['name' => 'Annual Tuition', 'description' => 'Annual tuition fee', 'amount' => 450, 'currency' => 'LRD', 'class_id' => $gradeFour->id, 'academic_year' => '2026', 'status' => 'active', 'is_mandatory' => true]);
        $registration = Fee::updateOrCreate(['slug' => 'registration-2026-demo'], ['name' => 'Registration Fee', 'description' => 'Registration fee', 'amount' => 75, 'currency' => 'USD', 'class_id' => null, 'academic_year' => '2026', 'status' => 'active', 'is_mandatory' => true]);

        $paymentLrd = Payment::updateOrCreate(['reference_number' => 'DEMO-LRD-0001'], ['student_id' => $daniel->id, 'fee_id' => $tuition->id, 'amount' => 150, 'currency' => 'LRD', 'payment_date' => now()->toDateString(), 'payment_method' => 'cash', 'status' => 'completed', 'recorded_by' => $teacherUser->id]);
        $paymentUsd = Payment::updateOrCreate(['reference_number' => 'DEMO-USD-0001'], ['student_id' => $grace->id, 'fee_id' => $registration->id, 'amount' => 50, 'currency' => 'USD', 'payment_date' => now()->toDateString(), 'payment_method' => 'bank_transfer', 'status' => 'completed', 'recorded_by' => $teacherUser->id]);
        Receipt::updateOrCreate(['receipt_number' => 'DEMO-REC-0001'], ['payment_id' => $paymentLrd->id, 'student_id' => $daniel->id, 'total_amount' => 150, 'currency' => 'LRD', 'receipt_date' => now()->toDateString(), 'generated_by' => $teacherUser->id]);
        Receipt::updateOrCreate(['receipt_number' => 'DEMO-REC-0002'], ['payment_id' => $paymentUsd->id, 'student_id' => $grace->id, 'total_amount' => 50, 'currency' => 'USD', 'receipt_date' => now()->toDateString(), 'generated_by' => $teacherUser->id]);

        $this->command?->info('Demo data ready. Test password for seeded users: 1234');
        $this->command?->info('teacher.test@sicss.com, student.test@sicss.com, finance.test@sicss.com');
    }
}
