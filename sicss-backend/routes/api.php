<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ForgotPasswordController;
use App\Http\Controllers\Api\V1\ChangePasswordController;
use App\Http\Controllers\Api\V1\TwoFAController;
use App\Http\Controllers\Api\V1\TestController;
use App\Http\Controllers\Api\V1\DivisionController;
use App\Http\Controllers\Api\V1\ClassController;
use App\Http\Controllers\Api\V1\StudentController;
use App\Http\Controllers\Api\V1\TeacherController;
use App\Http\Controllers\Api\V1\SubjectController;
use App\Http\Controllers\Api\V1\AttendanceController;
use App\Http\Controllers\Api\V1\GradeController;
use App\Http\Controllers\Api\V1\AssignmentController;
use App\Http\Controllers\Api\V1\StudentCommentController;
use App\Http\Controllers\Api\V1\FeeController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\ReceiptController;
use App\Http\Controllers\Api\V1\FinancialReportController;
use App\Http\Controllers\Api\V1\SyncController;
use App\Http\Controllers\Api\V1\ActivityLogController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\ReportCardController;
use App\Http\Controllers\Api\V1\UploadController;
use App\Http\Controllers\Api\V1\AnnouncementController;
use App\Http\Controllers\Api\V1\HelpdeskController;
use App\Http\Controllers\Api\V1\SubjectMarkController;
use App\Http\Controllers\Api\V1\FeeStructureController;
use App\Http\Controllers\Api\V1\StudentPortalController;
use App\Http\Controllers\Api\V1\TeacherPayrollController;
use App\Http\Controllers\Api\V1\TeacherAttendanceController;
use App\Http\Controllers\Api\V1\GlobalSearchController;
use App\Http\Controllers\Api\V1\SystemSettingsController;

Route::prefix('v1')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
        
        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/me', [AuthController::class, 'me']);
            Route::post('/change-password', ChangePasswordController::class);
            // 2FA for admin password changes
            Route::post('/2fa/generate', [TwoFAController::class, 'generate']);
            Route::post('/2fa/verify',   [TwoFAController::class, 'verify']);
        });
        
        Route::post('/forgot-password', [ForgotPasswordController::class, 'forgotPassword']);
        Route::post('/reset-password', [ForgotPasswordController::class, 'resetPassword']);
    });

    Route::get('/settings', [SystemSettingsController::class, 'show']);
    Route::get('/classes', [ClassController::class, 'index']);    // public — needed for unauthenticated dropdowns
    Route::get('/teachers', [TeacherController::class, 'index']); // accessible to all authenticated users for dropdowns
    // NOTE: /classes is kept public (no auth) so dropdowns work on unauthenticated pages (e.g. application form)

    Route::middleware('auth:sanctum')->group(function () {
        // Upload endpoints (admin only)
        // Academic reference data (divisions, grades) — open to all authenticated users for dropdowns
        Route::get('/grades', [GradeController::class, 'index'])->middleware('role:admin|teacher|class-sponsor|subject-teacher|vice-principal-instruction|principal|proprietor|proprietress');

        Route::middleware('role:admin')->group(function () {
            Route::put('/settings', [SystemSettingsController::class, 'update']);
            Route::post('/upload/logo', [UploadController::class, 'logo']);
            Route::delete('/upload/logo', [UploadController::class, 'deleteLogo']);
            Route::post('/upload/teacher-image', [UploadController::class, 'teacherImage']);
            Route::post('/upload/user-image', [UploadController::class, 'userImage']);
        });

        Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
        Route::get('/my-salary', [TeacherPayrollController::class, 'mySalary'])->middleware('role:teacher|class-sponsor|subject-teacher');
        Route::get('/my-teacher-attendance', [TeacherAttendanceController::class, 'mine'])->middleware('role:teacher|class-sponsor|subject-teacher');
        Route::get('/activity-logs', [ActivityLogController::class, 'index'])->middleware('role:admin');
        Route::put('/profile', [UserController::class, 'updateSelf'])->middleware('role:admin|teacher|class-sponsor|subject-teacher|student|finance|finance-staff|principal|vice-principal-instruction|proprietor|proprietress');

        // Next sequential student ID — must be before apiResource to avoid {student} capture
        Route::get('/students/next-id', function() {
            $year = date('Y');
            // PostgreSQL-compatible: extract trailing number after last dash
            $lastStudent = \App\Models\Student::where('student_id', 'like', "STU-{$year}-%")
                ->orderByRaw("CAST(SPLIT_PART(student_id, '-', 3) AS INTEGER) DESC")
                ->first();
            $next = 1;
            if ($lastStudent) {
                $parts = explode('-', $lastStudent->student_id);
                $next  = (int) ($parts[2] ?? 0) + 1;
            }

            $lastRegistration = \App\Models\Student::where('registration_number', 'like', "REG-{$year}-%")
                ->orderByRaw("CAST(SPLIT_PART(registration_number, '-', 3) AS INTEGER) DESC")
                ->first();
            $nextRegistration = $lastRegistration
                ? (int) (explode('-', $lastRegistration->registration_number)[2] ?? 0) + 1
                : 1;

            return response()->json([
                'student_id' => "STU-{$year}-" . str_pad($next, 4, '0', STR_PAD_LEFT),
                'registration_number' => "REG-{$year}-" . str_pad($nextRegistration, 4, '0', STR_PAD_LEFT),
            ]);
        });

        // Student application — all authenticated users can submit
        Route::post('/students', [StudentController::class, 'store'])->middleware('role:admin');
        Route::get('/students/me', [StudentController::class, 'me'])->middleware('role:student');

        // Fee structures & student clearance
        Route::get('/fee-structures', [FeeStructureController::class, 'index']);
        Route::get('/fee-structures/{feeStructure}', [FeeStructureController::class, 'show']);
        Route::get('/students/{student}/clearance', [FeeStructureController::class, 'checkClearance']);

        // Salary structures - viewable by admin, principal, proprietor, and proprietress
        Route::get('/salary-structures', [TeacherPayrollController::class, 'structures'])->middleware('role:admin|principal|proprietor|proprietress');

        Route::middleware('role:admin')->group(function () {
            Route::post('/salary-structures', [TeacherPayrollController::class, 'storeStructure']);
            Route::put('/salary-structures/{salaryStructure}', [TeacherPayrollController::class, 'updateStructure']);
            Route::get('/teacher-payrolls', [TeacherPayrollController::class, 'payrolls']);
            Route::post('/teacher-payrolls', [TeacherPayrollController::class, 'createPayroll']);
            Route::post('/teacher-payrolls/{payroll}/mark-paid', [TeacherPayrollController::class, 'markPaid']);
            Route::post('/teacher-attendance/bulk', [TeacherAttendanceController::class, 'bulk'])->middleware('role:admin|principal|vice-principal-instruction|proprietor|proprietress');
            Route::get('/staff-attendance-members', [TeacherAttendanceController::class, 'staff']);
            Route::get('/teacher-attendance-settings', [TeacherAttendanceController::class, 'settings']);
            Route::put('/teacher-attendance-settings', [TeacherAttendanceController::class, 'updateSettings']);
            Route::put('/teacher-attendance-settings/{user}', [TeacherAttendanceController::class, 'individualSettings']);
            Route::post('/fee-structures', [FeeStructureController::class, 'store']);
            Route::put('/fee-structures/{feeStructure}', [FeeStructureController::class, 'update']);
            Route::delete('/fee-structures/{feeStructure}', [FeeStructureController::class, 'destroy']);
            Route::post('/students/{student}/clearance', [FeeStructureController::class, 'clearStudent']);
            Route::get('/student-clearances', [FeeStructureController::class, 'studentClearances']);
        });
        Route::get('/teacher-attendance', [TeacherAttendanceController::class, 'index'])->middleware('role:admin|finance|finance-staff|principal|vice-principal-instruction|proprietor|proprietress');
        Route::get('/helpdesk/my-tickets', [HelpdeskController::class, 'myTickets']);
        Route::post('/helpdesk/tickets', [HelpdeskController::class, 'store']);
        Route::get('/helpdesk/tickets/{ticket}', [HelpdeskController::class, 'show']);
        Route::post('/helpdesk/tickets/{ticket}/reply', [HelpdeskController::class, 'reply']);

        // Helpdesk — admin only
        Route::middleware('role:admin')->group(function () {
            Route::get('/helpdesk/stats', [HelpdeskController::class, 'stats']);
            Route::get('/helpdesk/unread', [HelpdeskController::class, 'adminUnread']);
            Route::get('/helpdesk/tickets', [HelpdeskController::class, 'index']);
            Route::put('/helpdesk/tickets/{ticket}', [HelpdeskController::class, 'update']);
            Route::delete('/helpdesk/tickets/{ticket}', [HelpdeskController::class, 'destroy']);
        });
        Route::get('/announcements/feed', [AnnouncementController::class, 'feed']);
        Route::post('/announcements/{announcement}/read', [AnnouncementController::class, 'markRead']);
        Route::post('/announcements/read-all', [AnnouncementController::class, 'markAllRead']);

        // Announcements — admin, VPI, proprietor, and proprietress management
        Route::middleware('role:admin|vice-principal-instruction|proprietor|proprietress')->group(function () {
            Route::get('/announcements', [AnnouncementController::class, 'index']);
            Route::post('/announcements', [AnnouncementController::class, 'store']);
            Route::put('/announcements/{announcement}', [AnnouncementController::class, 'update']);
            Route::delete('/announcements/{announcement}', [AnnouncementController::class, 'destroy']);
        });
        Route::get('/test/admin', [TestController::class, 'adminOnly'])->middleware('role:admin');
        Route::get('/test/teacher', [TestController::class, 'teacherOnly'])->middleware('role:teacher');
        Route::get('/test/student', [TestController::class, 'studentOnly'])->middleware('role:student');

        // Users - viewable by admin, VPI, proprietor, and proprietress
        Route::get('/users', [UserController::class, 'index'])->middleware('role:admin|vice-principal-instruction|proprietor|proprietress');
        Route::get('/roles', [UserController::class, 'roles'])->middleware('role:admin|vice-principal-instruction|proprietor|proprietress');

        Route::middleware('role:admin')->group(function () {
            Route::get('/search', GlobalSearchController::class);
            Route::post('/users', [UserController::class, 'store']);
            Route::get('/users/{user}', [UserController::class, 'show']);
            Route::put('/users/{user}', [UserController::class, 'update']);
            Route::post('/users/{user}/reset-password', [UserController::class, 'resetPassword']);
            // Student application approval (admin only)
            Route::post('/students/{student}/approve', function(\Illuminate\Http\Request $req, \App\Models\Student $student) {
                $data = $req->validate([
                    'application_status'    => 'required|in:approved,rejected',
                    'registration_number'   => 'nullable|string',
                    'class_assigned'        => 'nullable|string',
                    'approved_by_registrar' => 'nullable|string',
                    'approved_by_principal' => 'nullable|string',
                    'approval_date'         => 'nullable|date',
                    'admission_date'        => 'nullable|date',
                    'class_id'              => 'nullable|exists:classes,id',
                ]);

                $student->update($data);

                return response()->json($student->fresh(['class', 'user']));
            });
            Route::apiResource('divisions', DivisionController::class)->except(['index']);
            Route::apiResource('classes', ClassController::class)->except(['index']);
            Route::apiResource('subjects', SubjectController::class)->except(['index']);
            // Admin can manage students (update, delete, index by default)
            Route::apiResource('students', StudentController::class)->only(['update', 'destroy']);
        });

        // Divisions - index registered here for all authenticated users; CRUD admin-only above
        Route::get('/divisions', [DivisionController::class, 'index']);
        // /classes and /subjects are registered publicly above
        // /teachers index is registered publicly above

        // Teachers - index registered publicly above; CRUD admin-only
        Route::middleware('role:admin')->group(function () {
            Route::apiResource('teachers', TeacherController::class)->except(['index']);
        });

        // Report cards - accessible by admin, VPI, class-sponsor, principal, proprietor, and proprietress
        Route::get('/report-cards', [ReportCardController::class, 'index'])->middleware('role:admin|vice-principal-instruction|class-sponsor|subject-teacher|principal|proprietor|proprietress');
        // Create and delete report cards — admin only
        Route::post('/report-cards', [ReportCardController::class, 'store'])->middleware('role:admin|class-sponsor');
        Route::delete('/report-cards/{id}', [ReportCardController::class, 'destroy'])->middleware('role:admin');
        Route::put('/report-cards/{id}', [ReportCardController::class, 'update'])->middleware('role:admin|class-sponsor');
        // Submit for approval — class-sponsor and teacher roles only
        Route::post('/report-cards/{id}/submit', [ReportCardController::class, 'submitForApproval'])->middleware('role:class-sponsor|admin');
        Route::post('/report-cards/{id}/sponsor-approve', [ReportCardController::class, 'sponsorApprove'])->middleware('role:class-sponsor|admin');
        Route::post('/report-cards/{id}/vpi-approve', [ReportCardController::class, 'vpiApprove'])->middleware('role:vice-principal-instruction|admin');
        // Comments on report cards — principal, VPI, proprietor, proprietress can add
        Route::post('/report-cards/{id}/comment', [ReportCardController::class, 'addComment'])->middleware('role:admin|principal|vice-principal-instruction|proprietor|proprietress');
        Route::get('/report-cards/{id}/comments', [ReportCardController::class, 'getComments'])->middleware('role:admin|principal|vice-principal-instruction|proprietor|proprietress|class-sponsor');

        // Subject marks workflow:
        //   Subject teachers submit marks per subject
        //   Class sponsor views all submissions, compiles, and sends to VPI
        Route::get('/report-cards/{id}/subject-submissions',   [SubjectMarkController::class, 'index'])->middleware('role:admin|class-sponsor|subject-teacher');
        Route::post('/report-cards/{id}/subject-marks',        [SubjectMarkController::class, 'submit'])->middleware('role:subject-teacher|class-sponsor|admin');
        Route::post('/report-cards/{id}/compile-and-submit',   [SubjectMarkController::class, 'compile'])->middleware('role:class-sponsor|admin');

        // VPI: approve/reject compiled report card
        Route::post('/report-cards/{id}/vpi-review', [ReportCardController::class, 'vpiApprove'])->middleware('role:vice-principal-instruction|admin');

        // Teachers, admins, VPI, principal, proprietor, and proprietress can view students
        Route::middleware('role:admin|teacher|class-sponsor|subject-teacher|vice-principal-instruction|principal|proprietor|proprietress')->group(function () {
            Route::get('/students', [StudentController::class, 'index']);
            Route::get('/students/{student}', [StudentController::class, 'show']);
        });


        Route::get('/my-grade-sheet', [GradeController::class, 'myGradeSheet'])->middleware('role:student');
        Route::get('/report-cards/me', [ReportCardController::class, 'mine'])->middleware('role:student');
        Route::prefix('student-portal')->middleware('role:student|parent')->group(function () {
            Route::get('/profile', [StudentPortalController::class, 'profile']);
            Route::get('/children', [StudentPortalController::class, 'children']); // parent: list all linked children
            Route::get('/attendance', [StudentPortalController::class, 'attendance']);
            Route::get('/assignments', [StudentPortalController::class, 'assignments']);
            Route::get('/financial-records', [StudentPortalController::class, 'financialRecords']);
            Route::get('/report-card', [StudentPortalController::class, 'reportCard']);
        });

        // Student attendance - viewable by admin, class-sponsor, VPI, principal, proprietor|proprietress
        // Addable by admin, class-sponsor, principal
        Route::get('/attendance', [AttendanceController::class, 'index'])->middleware('role:admin|class-sponsor|vice-principal-instruction|principal|proprietor|proprietress');
        Route::get('/attendance/{attendance}', [AttendanceController::class, 'show'])->middleware('role:admin|class-sponsor|vice-principal-instruction|principal|proprietor|proprietress');
        Route::get('/attendance/student/{studentId}/history', [AttendanceController::class, 'studentHistory'])->middleware('role:admin|class-sponsor|vice-principal-instruction|principal|proprietor|proprietress');
        Route::get('/attendance/class/{classId}/report', [AttendanceController::class, 'classReport'])->middleware('role:admin|class-sponsor|vice-principal-instruction|principal|proprietor|proprietress');

        Route::middleware('role:admin|class-sponsor|principal')->group(function () {
            Route::prefix('attendance')->group(function () {
                Route::post('/', [AttendanceController::class, 'store']);
                Route::post('/bulk', [AttendanceController::class, 'storeBulk']);
                Route::put('/{attendance}', [AttendanceController::class, 'update']);
                Route::delete('/{attendance}', [AttendanceController::class, 'destroy']);
            });

            Route::prefix('student-comments')->group(function () {
                Route::get('/', [StudentCommentController::class, 'index']);
                Route::post('/', [StudentCommentController::class, 'store']);
                Route::get('/{studentComment}', [StudentCommentController::class, 'show']);
                Route::put('/{studentComment}', [StudentCommentController::class, 'update']);
                Route::delete('/{studentComment}', [StudentCommentController::class, 'destroy']);
                Route::get('/student/{studentId}', [StudentCommentController::class, 'studentComments']);
            });
        });

        Route::middleware('role:admin|teacher|class-sponsor|subject-teacher|vice-principal-instruction')->group(function () {
            Route::prefix('grades')->group(function () {
                Route::post('/', [GradeController::class, 'store']);
                Route::post('/{grade}/submit', [GradeController::class, 'submit'])->middleware('role:teacher|class-sponsor|subject-teacher');
                Route::get('/{grade}', [GradeController::class, 'show']);
                Route::put('/{grade}', [GradeController::class, 'update']);
                Route::delete('/{grade}', [GradeController::class, 'destroy']);
                Route::get('/student/{studentId}/report', [GradeController::class, 'studentReport']);
                Route::get('/class/report', [GradeController::class, 'classReport']);
            });

            Route::prefix('assignments')->group(function () {
                Route::get('/', [AssignmentController::class, 'index']);
                Route::post('/', [AssignmentController::class, 'store']);
                Route::get('/{assignment}', [AssignmentController::class, 'show']);
                Route::put('/{assignment}', [AssignmentController::class, 'update']);
                Route::delete('/{assignment}', [AssignmentController::class, 'destroy']);
                Route::get('/class/{classId}', [AssignmentController::class, 'classAssignments']);
            });

        });

        Route::put('/grades/{grade}/review', [GradeController::class, 'review'])
            ->middleware('role:admin|vice-principal-instruction');

        // Finance Module Routes
        Route::middleware('role:admin|finance|finance-staff')->group(function () {
            Route::apiResource('fees', FeeController::class);
            Route::apiResource('payments', PaymentController::class);
            Route::apiResource('receipts', ReceiptController::class)->except(['update']);
            Route::get('payments/student/{studentId}', [PaymentController::class, 'studentPayments']);
        });

        // Financial reports — finance/admin can send reports; principal/proprietor/proprietress can VIEW only
        // Send (POST) — finance, admin only
        Route::prefix('financial-reports')->group(function () {
            Route::post('/management-report', [FinancialReportController::class, 'sendManagementReport'])
                ->middleware('role:admin|finance|finance-staff');

            // View (GET) — finance, admin, principal, proprietor, proprietress (read-only, no edit/delete)
            Route::middleware('role:admin|finance|finance-staff|principal|proprietor|proprietress')->group(function () {
                Route::get('/daily',             [FinancialReportController::class, 'dailyPayments']);
                Route::get('/monthly',           [FinancialReportController::class, 'monthlyPayments']);
                Route::get('/class',             [FinancialReportController::class, 'classReport']);
                Route::get('/outstanding',       [FinancialReportController::class, 'outstandingBalances']);
                Route::get('/student/{studentId}', [FinancialReportController::class, 'studentFinancialHistory']);
            });
        });

        // Sync Module Routes (Available to all authenticated users)
        Route::prefix('sync')->group(function () {
            Route::post('/push', [SyncController::class, 'push']);
            Route::post('/pull', [SyncController::class, 'pull']);
            Route::get('/status', [SyncController::class, 'status']);
        });
    });
});
