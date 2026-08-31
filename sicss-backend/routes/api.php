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

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/settings', [SystemSettingsController::class, 'show']);
        // Upload endpoints (admin only)
        // Academic reference data required when teachers enter grades.
        Route::get('/divisions', [DivisionController::class, 'index'])->middleware('role:admin|teacher|class-sponsor|subject-teacher|vice-principal-instruction');
        Route::get('/classes', [ClassController::class, 'index'])->middleware('role:admin|teacher|class-sponsor|subject-teacher|vice-principal-instruction');
        Route::get('/subjects', [SubjectController::class, 'index'])->middleware('role:admin|teacher|class-sponsor|subject-teacher|vice-principal-instruction');
        Route::get('/grades', [GradeController::class, 'index'])->middleware('role:admin|teacher|class-sponsor|subject-teacher|vice-principal-instruction');

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
        Route::put('/profile', [UserController::class, 'updateSelf'])->middleware('role:admin|teacher|class-sponsor|subject-teacher|student|finance|finance-staff');

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
                'student_id' => "STU-{$year}-" . str_pad($next, 3, '0', STR_PAD_LEFT),
                'registration_number' => "REG-{$year}-" . str_pad($nextRegistration, 3, '0', STR_PAD_LEFT),
            ]);
        });

        // Student application — all authenticated users can submit
        Route::post('/students', [StudentController::class, 'store'])->middleware('role:admin');
        Route::get('/students/me', [StudentController::class, 'me'])->middleware('role:student');

        // Fee structures & student clearance
        Route::get('/fee-structures', [FeeStructureController::class, 'index']);
        Route::get('/fee-structures/{feeStructure}', [FeeStructureController::class, 'show']);
        Route::get('/students/{student}/clearance', [FeeStructureController::class, 'checkClearance']);

        Route::middleware('role:admin')->group(function () {
            Route::get('/salary-structures', [TeacherPayrollController::class, 'structures']);
            Route::post('/salary-structures', [TeacherPayrollController::class, 'storeStructure']);
            Route::put('/salary-structures/{salaryStructure}', [TeacherPayrollController::class, 'updateStructure']);
            Route::get('/teacher-payrolls', [TeacherPayrollController::class, 'payrolls']);
            Route::post('/teacher-payrolls', [TeacherPayrollController::class, 'createPayroll']);
            Route::post('/teacher-payrolls/{payroll}/mark-paid', [TeacherPayrollController::class, 'markPaid']);
            Route::post('/teacher-attendance/bulk', [TeacherAttendanceController::class, 'bulk']);
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
        Route::get('/teacher-attendance', [TeacherAttendanceController::class, 'index'])->middleware('role:admin|finance|finance-staff|principal|vice-principal-instruction|head-of-school');
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

        // Announcements — admin management
        Route::middleware('role:admin')->group(function () {
            Route::get('/announcements', [AnnouncementController::class, 'index']);
            Route::post('/announcements', [AnnouncementController::class, 'store']);
            Route::put('/announcements/{announcement}', [AnnouncementController::class, 'update']);
            Route::delete('/announcements/{announcement}', [AnnouncementController::class, 'destroy']);
        });
        Route::get('/test/admin', [TestController::class, 'adminOnly'])->middleware('role:admin');
        Route::get('/test/teacher', [TestController::class, 'teacherOnly'])->middleware('role:teacher');
        Route::get('/test/student', [TestController::class, 'studentOnly'])->middleware('role:student');

        Route::middleware('role:admin')->group(function () {
            Route::get('/search', GlobalSearchController::class);
            Route::get('/users', [UserController::class, 'index']);
            Route::get('/roles', [UserController::class, 'roles']);
            Route::post('/users', [UserController::class, 'store']);
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
                    'username'              => 'nullable|string',
                    'password'              => 'nullable|string|min:8',
                ]);

                // If approving and student doesn't have a user account, create one
                if ($data['application_status'] === 'approved' && !$student->user_id) {
                    $role = \App\Models\Role::where('slug', 'student')->first();
                    if (!$role) {
                        return response()->json(['message' => 'Student role not found'], 500);
                    }

                    // Generate username if not provided
                    $username = $data['username'] ?? strtolower($student->first_name . '.' . $student->last_name);
                    
                    // Generate password if not provided
                    $password = $data['password'] ?? \Illuminate\Support\Str::random(10);

                    // Create user account
                    $user = \App\Models\User::create([
                        'first_name' => $student->first_name,
                        'last_name' => $student->last_name,
                        'email' => $student->parent_guardian_email ?? $student->email ?? $username . '@sicss.local',
                        'password' => \Illuminate\Support\Facades\Hash::make($password),
                        'role_id' => $role->id,
                        'phone' => $student->phone,
                        'address' => $student->address,
                        'is_active' => true,
                    ]);

                    // Link user to student
                    $data['user_id'] = $user->id;
                }

                $student->update($data);
                
                $response = $student->fresh(['class', 'user']);
                
                // Include credentials if a new user was created
                if (isset($data['user_id']) && $student->user) {
                    $response->credentials = [
                        'username' => $student->user->user_code,
                        'password' => $password ?? null,
                        'email' => $student->user->email,
                    ];
                }
                
                return response()->json($response);
            });
            Route::apiResource('report-cards', ReportCardController::class)->only(['index', 'store']);
            Route::post('/report-cards/{id}/submit', [ReportCardController::class, 'submitForApproval']);
            Route::post('/report-cards/{id}/sponsor-approve', [ReportCardController::class, 'sponsorApprove'])->middleware('role:class-sponsor|admin');
            Route::post('/report-cards/{id}/vpi-approve', [ReportCardController::class, 'vpiApprove'])->middleware('role:vice-principal-instruction|admin');
            Route::apiResource('divisions', DivisionController::class)->except(['index']);
            Route::apiResource('classes', ClassController::class)->except(['index']);
            Route::apiResource('teachers', TeacherController::class);
            Route::apiResource('subjects', SubjectController::class)->except(['index']);
            // Admin can manage students (update, delete, index by default)
            Route::apiResource('students', StudentController::class)->except(['store']);
        });


        Route::get('/my-grade-sheet', [GradeController::class, 'myGradeSheet'])->middleware('role:student');
        Route::get('/report-cards/me', [ReportCardController::class, 'mine'])->middleware('role:student');
        Route::prefix('student-portal')->middleware('role:student|parent')->group(function () {
            Route::get('/profile', [StudentPortalController::class, 'profile']);
            Route::get('/attendance', [StudentPortalController::class, 'attendance']);
            Route::get('/assignments', [StudentPortalController::class, 'assignments']);
            Route::get('/financial-records', [StudentPortalController::class, 'financialRecords']);
            Route::get('/report-card', [StudentPortalController::class, 'reportCard']);
        });

        Route::middleware('role:admin|class-sponsor')->group(function () {
            Route::prefix('attendance')->group(function () {
                Route::get('/', [AttendanceController::class, 'index']);
                Route::post('/', [AttendanceController::class, 'store']);
                Route::post('/bulk', [AttendanceController::class, 'storeBulk']);
                Route::get('/{attendance}', [AttendanceController::class, 'show']);
                Route::put('/{attendance}', [AttendanceController::class, 'update']);
                Route::delete('/{attendance}', [AttendanceController::class, 'destroy']);
                Route::get('/student/{studentId}/history', [AttendanceController::class, 'studentHistory']);
                Route::get('/class/{classId}/report', [AttendanceController::class, 'classReport']);
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

        Route::middleware('role:admin|teacher|class-sponsor|subject-teacher')->group(function () {
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

            Route::prefix('financial-reports')->group(function () {
                Route::post('/management-report', [FinancialReportController::class, 'sendManagementReport']);
                Route::get('/daily', [FinancialReportController::class, 'dailyPayments']);
                Route::get('/monthly', [FinancialReportController::class, 'monthlyPayments']);
                Route::get('/class', [FinancialReportController::class, 'classReport']);
                Route::get('/outstanding', [FinancialReportController::class, 'outstandingBalances']);
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
