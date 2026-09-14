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
        $roles = Role::whereIn('slug', [
            'admin',
            'class-sponsor',
            'subject-teacher',
            'student',
            'vice-principal-instruction',
            'principal',
            'proprietor',
            'proprietress',
            'parent',
        ])->pluck('id', 'slug');
        $testPassword = env('SICSS_TEST_SEED_PASSWORD');
        if (! is_string($testPassword) || $testPassword === '') {
            throw new \RuntimeException('SICSS_TEST_SEED_PASSWORD must be set before running the demo data seeder.');
        }
        $password = Hash::make($testPassword);

        $accounts = [
            ['email' => 'class.sponsor.test@sicss.com',   'first_name' => 'Maria',   'last_name' => 'Class Sponsor',      'role' => 'class-sponsor'],
            ['email' => 'subject.teacher.test@sicss.com', 'first_name' => 'Samuel',  'last_name' => 'Subject Teacher',    'role' => 'subject-teacher'],
            // Additional subject teachers — one per subject group
            ['email' => 'teacher.english@sicss.com',      'first_name' => 'Grace',   'last_name' => 'Dahn',               'role' => 'subject-teacher'],
            ['email' => 'teacher.science@sicss.com',      'first_name' => 'James',   'last_name' => 'Kollie',             'role' => 'subject-teacher'],
            ['email' => 'teacher.bible@sicss.com',        'first_name' => 'Ruth',    'last_name' => 'Sumo',               'role' => 'subject-teacher'],
            ['email' => 'teacher.reading@sicss.com',      'first_name' => 'Moses',   'last_name' => 'Tarr',               'role' => 'subject-teacher'],
            ['email' => 'teacher.social@sicss.com',       'first_name' => 'Esther',  'last_name' => 'Jallah',             'role' => 'subject-teacher'],
            ['email' => 'teacher.pe@sicss.com',           'first_name' => 'David',   'last_name' => 'Nimely',             'role' => 'subject-teacher'],
            ['email' => 'teacher.arts@sicss.com',         'first_name' => 'Abigail', 'last_name' => 'Mulbah',             'role' => 'subject-teacher'],
            // Other accounts
            ['email' => 'student.test@sicss.com',         'first_name' => 'Daniel',  'last_name' => 'Student',            'role' => 'student'],
            ['email' => 'vpi.test@sicss.com',             'first_name' => 'Victoria','last_name' => 'VPI',                'role' => 'vice-principal-instruction'],
            ['email' => 'principal.test@sicss.com',       'first_name' => 'Patricia','last_name' => 'Principal',          'role' => 'principal'],
            ['email' => 'proprietor.test@sicss.com',      'first_name' => 'John',    'last_name' => 'Proprietor',         'role' => 'proprietor'],
            ['email' => 'proprietress.test@sicss.com',    'first_name' => 'Helen',   'last_name' => 'Proprietress',       'role' => 'proprietress'],
            ['email' => 'parent.test@sicss.com',          'first_name' => 'Sarah',   'last_name' => 'Parent',             'role' => 'parent'],
        ];

        $users = [];
        foreach ($accounts as $account) {
            $user = User::updateOrCreate(
                ['email' => $account['email']],
                [
                    'first_name' => $account['first_name'],
                    'last_name' => $account['last_name'],
                    'password' => $password,
                    'role_id' => $roles[$account['role']] ?? null,
                    'is_active' => true,
                ]
            );
            // Index by role slug for the main accounts and also by email for subject teachers
            $users[$account['role']] = $user;
            $users[$account['email']] = $user;
        }

        $teacherUser = $users['class-sponsor'];
        $studentUser = $users['student'];

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

        // ── Teachers ─────────────────────────────────────────────────────────────
        // Class sponsor — linked to Grade 4 Blue
        $teacher = Teacher::updateOrCreate(['employee_id' => 'TCH-0001'], [
            'user_id' => $teacherUser->id, 'first_name' => 'Maria', 'last_name' => 'Class Sponsor',
            'email' => 'class.sponsor.test@sicss.com', 'gender' => 'female',
            'hire_date' => now()->subYears(2)->toDateString(),
            'specialization' => 'Class sponsor — Grade 4 Blue', 'status' => 'active',
        ]);
        // Link class sponsor to Grade 4 class so they can compile marks
        $teacher->classes()->syncWithoutDetaching([$gradeFour->id]);

        // Helper to get subject by code
        $getSubject = fn(string $code) => Subject::where('code', $code)->first();

        // Mathematics teacher (Samuel — existing)
        $tMath = Teacher::updateOrCreate(['employee_id' => 'TCH-0002'], [
            'user_id' => $users['subject-teacher']->id, 'first_name' => 'Samuel', 'last_name' => 'Subject Teacher',
            'email' => 'subject.teacher.test@sicss.com', 'gender' => 'male',
            'hire_date' => now()->subYears(1)->toDateString(), 'specialization' => 'Mathematics', 'status' => 'active',
        ]);
        // Link to Mathematics subject (KDG-07) and to Grade 4 class
        if ($s = $getSubject('KDG-07')) $tMath->subjects()->syncWithoutDetaching([$s->id]);
        if ($mathSubj = $getSubject('MATH-04')) $tMath->subjects()->syncWithoutDetaching([$mathSubj->id]);
        $tMath->classes()->syncWithoutDetaching([$gradeFour->id, $gradeSeven->id]);

        // English / Reading / Spelling / Phonics teacher (Grace Dahn)
        $tEnglish = Teacher::updateOrCreate(['employee_id' => 'TCH-0003'], [
            'user_id' => ($users['teacher.english@sicss.com'] ?? null)?->id,
            'first_name' => 'Grace', 'last_name' => 'Dahn',
            'email' => 'teacher.english@sicss.com', 'gender' => 'female',
            'hire_date' => now()->subYear()->toDateString(),
            'specialization' => 'English Language, Reading, Spelling, Phonics', 'status' => 'active',
        ]);
        // Find user account for this teacher
        $engUser = $users['teacher.english@sicss.com'] ?? User::where('email', 'teacher.english@sicss.com')->first();
        if ($engUser) $tEnglish->update(['user_id' => $engUser->id]);
        foreach (['KDG-02', 'KDG-03', 'KDG-04', 'KDG-05'] as $code) {
            if ($s = $getSubject($code)) $tEnglish->subjects()->syncWithoutDetaching([$s->id]);
        }
        if ($engSubj = $getSubject('ENG-04')) $tEnglish->subjects()->syncWithoutDetaching([$engSubj->id]);
        $tEnglish->classes()->syncWithoutDetaching([$gradeFour->id]);

        // Science / Health Science teacher (James Kollie)
        $tScience = Teacher::updateOrCreate(['employee_id' => 'TCH-0004'], [
            'first_name' => 'James', 'last_name' => 'Kollie',
            'email' => 'teacher.science@sicss.com', 'gender' => 'male',
            'hire_date' => now()->subYear()->toDateString(),
            'specialization' => 'Science, Health Science', 'status' => 'active',
        ]);
        $sciUser = User::where('email', 'teacher.science@sicss.com')->first();
        if ($sciUser) $tScience->update(['user_id' => $sciUser->id]);
        foreach (['KDG-06', 'KDG-11'] as $code) {
            if ($s = $getSubject($code)) $tScience->subjects()->syncWithoutDetaching([$s->id]);
        }
        $tScience->classes()->syncWithoutDetaching([$gradeFour->id]);

        // Bible / Reciting teacher (Ruth Sumo)
        $tBible = Teacher::updateOrCreate(['employee_id' => 'TCH-0005'], [
            'first_name' => 'Ruth', 'last_name' => 'Sumo',
            'email' => 'teacher.bible@sicss.com', 'gender' => 'female',
            'hire_date' => now()->subYear()->toDateString(),
            'specialization' => 'Bible, Reciting', 'status' => 'active',
        ]);
        $bibleUser = User::where('email', 'teacher.bible@sicss.com')->first();
        if ($bibleUser) $tBible->update(['user_id' => $bibleUser->id]);
        // Reciting is KDG-07 but that's Math — let's find Reciting by name
        $reciting = Subject::where('name', 'Reciting')->first();
        if ($reciting) $tBible->subjects()->syncWithoutDetaching([$reciting->id]);
        $bible = Subject::where('name', 'Bible')->first();
        if ($bible) $tBible->subjects()->syncWithoutDetaching([$bible->id]);
        $tBible->classes()->syncWithoutDetaching([$gradeFour->id]);

        // Writing / Identifying Object / Identifying Color teacher (Moses Tarr)
        $tWriting = Teacher::updateOrCreate(['employee_id' => 'TCH-0006'], [
            'first_name' => 'Moses', 'last_name' => 'Tarr',
            'email' => 'teacher.reading@sicss.com', 'gender' => 'male',
            'hire_date' => now()->subYear()->toDateString(),
            'specialization' => 'Writing, Identifying Colors & Objects', 'status' => 'active',
        ]);
        $writingUser = $users['teacher.reading@sicss.com'] ?? null;
        if ($writingUser) $tWriting->update(['user_id' => $writingUser->id]);
        foreach (['Writing', 'Identifying Color', 'Identifying Object'] as $name) {
            $s = Subject::where('name', $name)->first();
            if ($s) $tWriting->subjects()->syncWithoutDetaching([$s->id]);
        }
        $tWriting->classes()->syncWithoutDetaching([$gradeFour->id]);

        // Social Studies teacher (Esther Jallah)
        $tSocial = Teacher::updateOrCreate(['employee_id' => 'TCH-0007'], [
            'first_name' => 'Esther', 'last_name' => 'Jallah',
            'email' => 'teacher.social@sicss.com', 'gender' => 'female',
            'hire_date' => now()->subYear()->toDateString(),
            'specialization' => 'Social Studies', 'status' => 'active',
        ]);
        $socialUser = $users['teacher.social@sicss.com'] ?? null;
        if ($socialUser) $tSocial->update(['user_id' => $socialUser->id]);
        $socialStudies = Subject::where('name', 'Social Studies')->first();
        if ($socialStudies) $tSocial->subjects()->syncWithoutDetaching([$socialStudies->id]);
        $tSocial->classes()->syncWithoutDetaching([$gradeFour->id]);

        // Physical Education teacher (David Nimely)
        $tPE = Teacher::updateOrCreate(['employee_id' => 'TCH-0008'], [
            'first_name' => 'David', 'last_name' => 'Nimely',
            'email' => 'teacher.pe@sicss.com', 'gender' => 'male',
            'hire_date' => now()->subYear()->toDateString(),
            'specialization' => 'Physical Education', 'status' => 'active',
        ]);
        $peUser = $users['teacher.pe@sicss.com'] ?? null;
        if ($peUser) $tPE->update(['user_id' => $peUser->id]);
        $pe = Subject::where('name', 'Physical Education')->first();
        if ($pe) $tPE->subjects()->syncWithoutDetaching([$pe->id]);
        $tPE->classes()->syncWithoutDetaching([$gradeFour->id]);

        // Drawing teacher (Abigail Mulbah)
        $tArts = Teacher::updateOrCreate(['employee_id' => 'TCH-0009'], [
            'first_name' => 'Abigail', 'last_name' => 'Mulbah',
            'email' => 'teacher.arts@sicss.com', 'gender' => 'female',
            'hire_date' => now()->subYear()->toDateString(),
            'specialization' => 'Drawing', 'status' => 'active',
        ]);
        $artsUser = $users['teacher.arts@sicss.com'] ?? null;
        if ($artsUser) $tArts->update(['user_id' => $artsUser->id]);
        $drawing = Subject::where('name', 'Drawing')->first();
        if ($drawing) $tArts->subjects()->syncWithoutDetaching([$drawing->id]);
        $tArts->classes()->syncWithoutDetaching([$gradeFour->id]);

        $daniel = Student::updateOrCreate(['student_id' => 'STU-0001'], ['user_id' => $studentUser->id, 'class_id' => $gradeFour->id, 'first_name' => 'Daniel', 'last_name' => 'Student', 'date_of_birth' => '2016-04-12', 'gender' => 'male', 'parent_guardian_name' => 'Sarah Student', 'parent_guardian_email' => 'student.test@sicss.com', 'admission_date' => now()->subMonths(8)->toDateString(), 'status' => 'active']);
        $grace = Student::updateOrCreate(['student_id' => 'STU-0002'], ['class_id' => $gradeFour->id, 'first_name' => 'Grace', 'last_name' => 'Doe', 'date_of_birth' => '2016-09-21', 'gender' => 'female', 'parent_guardian_name' => 'David Doe', 'admission_date' => now()->subMonths(7)->toDateString(), 'status' => 'active']);
        $samuel = Student::updateOrCreate(['student_id' => 'STU-0003'], ['class_id' => $gradeSeven->id, 'first_name' => 'Samuel', 'last_name' => 'Kollie', 'date_of_birth' => '2013-02-18', 'gender' => 'male', 'parent_guardian_name' => 'Mary Kollie', 'admission_date' => now()->subMonths(6)->toDateString(), 'status' => 'active']);

        Grade::updateOrCreate(['student_id' => $daniel->id, 'subject_id' => $math->id, 'term' => 'Term 1', 'academic_year' => '2026'], ['teacher_id' => $tMath->id, 'score' => 86, 'grade' => 'B', 'remarks' => 'Good progress']);
        Grade::updateOrCreate(['student_id' => $daniel->id, 'subject_id' => $english->id, 'term' => 'Term 1', 'academic_year' => '2026'], ['teacher_id' => $tEnglish->id, 'score' => 91, 'grade' => 'A', 'remarks' => 'Excellent work']);

        Attendance::updateOrCreate(['student_id' => $daniel->id, 'date' => now()->toDateString()], ['class_id' => $gradeFour->id, 'teacher_id' => $teacher->id, 'status' => 'present', 'remarks' => 'Present']);
        Attendance::updateOrCreate(['student_id' => $grace->id, 'date' => now()->toDateString()], ['class_id' => $gradeFour->id, 'teacher_id' => $teacher->id, 'status' => 'late', 'remarks' => 'Arrived late']);
        Attendance::updateOrCreate(['student_id' => $samuel->id, 'date' => now()->toDateString()], ['class_id' => $gradeSeven->id, 'teacher_id' => $teacher->id, 'status' => 'absent', 'remarks' => 'Absent']);

        $tuition = Fee::updateOrCreate(['slug' => 'tuition-2026-demo'], ['name' => 'Annual Tuition', 'description' => 'Annual tuition fee', 'amount' => 450, 'currency' => 'LRD', 'class_id' => $gradeFour->id, 'academic_year' => '2026', 'status' => 'active', 'is_mandatory' => true]);
        $registration = Fee::updateOrCreate(['slug' => 'registration-2026-demo'], ['name' => 'Registration Fee', 'description' => 'Registration fee', 'amount' => 75, 'currency' => 'USD', 'class_id' => null, 'academic_year' => '2026', 'status' => 'active', 'is_mandatory' => true]);

        $paymentLrd = Payment::updateOrCreate(['reference_number' => 'DEMO-LRD-0001'], ['student_id' => $daniel->id, 'fee_id' => $tuition->id, 'amount' => 150, 'currency' => 'LRD', 'payment_date' => now()->toDateString(), 'payment_method' => 'cash', 'status' => 'completed', 'recorded_by' => $teacherUser->id]);
        $paymentUsd = Payment::updateOrCreate(['reference_number' => 'DEMO-USD-0001'], ['student_id' => $grace->id, 'fee_id' => $registration->id, 'amount' => 50, 'currency' => 'USD', 'payment_date' => now()->toDateString(), 'payment_method' => 'bank_transfer', 'status' => 'completed', 'recorded_by' => $teacherUser->id]);
        Receipt::updateOrCreate(['receipt_number' => 'DEMO-REC-0001'], ['payment_id' => $paymentLrd->id, 'student_id' => $daniel->id, 'total_amount' => 150, 'currency' => 'LRD', 'receipt_date' => now()->toDateString(), 'generated_by' => $teacherUser->id]);
        Receipt::updateOrCreate(['receipt_number' => 'DEMO-REC-0002'], ['payment_id' => $paymentUsd->id, 'student_id' => $grace->id, 'total_amount' => 50, 'currency' => 'USD', 'receipt_date' => now()->toDateString(), 'generated_by' => $teacherUser->id]);

        $this->command?->info('Demo data ready. Test password loaded from SICSS_TEST_SEED_PASSWORD.');
        $this->command?->info('class.sponsor.test@sicss.com, subject.teacher.test@sicss.com, student.test@sicss.com, vpi.test@sicss.com, principal.test@sicss.com, proprietor.test@sicss.com, proprietress.test@sicss.com, parent.test@sicss.com');
        $this->command?->info('Other accounts: student.test, vpi.test, principal.test, proprietor.test, proprietress.test, parent.test @sicss.com');
    }
}
