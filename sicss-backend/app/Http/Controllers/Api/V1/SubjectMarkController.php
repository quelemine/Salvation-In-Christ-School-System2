<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\ClassModel;
use App\Models\ReportCard;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SubjectMarkController extends Controller
{
    /**
     * Subject teacher submits (or resubmits) marks for their subject on a report card.
     * Creates or updates a row in report_card_subject_submissions.
     * On resubmit: clears any pending revision request so the sponsor sees the fresh marks.
     */
    public function submit(Request $request, $reportCardId)
    {
        $data = $request->validate([
            'subject'       => 'required|string|max:255',
            'subject_marks' => 'required|array',
        ]);

        $reportCard = ReportCard::findOrFail($reportCardId);

        if (!in_array($reportCard->approval_status, ['draft', 'pending_sponsor'])) {
            return response()->json([
                'message' => 'Marks can only be submitted while the report card is in draft or pending sponsor review.',
            ], 422);
        }

        $teacher = Teacher::where('user_id', $request->user()->id)->first();
        if (!$teacher) {
            return response()->json(['message' => 'No teacher profile linked to your account.'], 403);
        }

        DB::transaction(function () use ($data, $reportCard, $teacher) {
            // Upsert — on resubmit reset the revision request and clear old feedback
            DB::table('report_card_subject_submissions')->upsert(
                [[
                    'report_card_id'    => $reportCard->id,
                    'teacher_id'        => $teacher->id,
                    'subject'           => $data['subject'],
                    'subject_marks'     => json_encode($data['subject_marks']),
                    'submitted_at'      => now(),
                    'submission_status' => 'submitted',   // reset any revision_requested
                    'sponsor_feedback'  => null,          // clear old feedback
                    'feedback_sent_at'  => null,
                    'created_at'        => now(),
                    'updated_at'        => now(),
                ]],
                ['report_card_id', 'subject'],
                [
                    'teacher_id', 'subject_marks', 'submitted_at',
                    'submission_status', 'sponsor_feedback', 'feedback_sent_at',
                    'updated_at',
                ]
            );

            // Merge into the parent report card's subject_marks
            $current = $reportCard->subject_marks ?? [];
            $current[$data['subject']] = array_merge(
                $current[$data['subject']] ?? [],
                $data['subject_marks']
            );
            $reportCard->update(['subject_marks' => $current]);
        });

        // Notify the class sponsor that marks have been submitted / resubmitted
        // Fresh-load student for the notification body
        $reportCard->loadMissing('student');
        $this->notifySponsorMarksSubmitted($reportCard, $teacher, $data['subject']);

        return response()->json([
            'message'     => "Marks for {$data['subject']} submitted successfully.",
            'report_card' => $reportCard->fresh(['student.class', 'class', 'teacher']),
        ], 201);
    }

    /**
     * List all subject submissions for a report card.
     * Used by class sponsor and subject teacher to see submission status and feedback.
     */
    public function index($reportCardId)
    {
        $reportCard = ReportCard::findOrFail($reportCardId);

        $submissions = DB::table('report_card_subject_submissions')
            ->join('teachers', 'teachers.id', '=', 'report_card_subject_submissions.teacher_id')
            ->leftJoin('users', 'users.id', '=', 'teachers.user_id')
            ->where('report_card_id', $reportCardId)
            ->orderBy('report_card_subject_submissions.subject')
            ->get([
                'report_card_subject_submissions.id',
                'report_card_subject_submissions.subject',
                'report_card_subject_submissions.subject_marks',
                'report_card_subject_submissions.submitted_at',
                'report_card_subject_submissions.submission_status',
                'report_card_subject_submissions.sponsor_feedback',
                'report_card_subject_submissions.feedback_sent_at',
                'teachers.first_name',
                'teachers.last_name',
                'teachers.employee_id',
                'users.email as teacher_email',
            ]);

        return response()->json([
            'report_card_id'  => $reportCardId,
            'approval_status' => $reportCard->approval_status,
            'submissions'     => $submissions->map(function ($s) {
                return [
                    'id'                => $s->id,
                    'subject'           => $s->subject,
                    'subject_marks'     => json_decode($s->subject_marks, true),
                    'submitted_at'      => $s->submitted_at,
                    'submission_status' => $s->submission_status ?? 'submitted',
                    'sponsor_feedback'  => $s->sponsor_feedback,
                    'feedback_sent_at'  => $s->feedback_sent_at,
                    'teacher_name'      => "{$s->first_name} {$s->last_name}",
                    'employee_id'       => $s->employee_id,
                    'teacher_email'     => $s->teacher_email,
                ];
            }),
        ]);
    }

    /**
     * Class sponsor requests a revision on a specific subject submission.
     * Sets submission_status = 'revision_requested' and stores the feedback comment.
     * The subject teacher will see this feedback when they next open that subject.
     */
    public function requestRevision(Request $request, $reportCardId, $submissionId)
    {
        $data = $request->validate([
            'feedback' => 'required|string|max:2000',
        ]);

        $reportCard = ReportCard::findOrFail($reportCardId);

        $submission = DB::table('report_card_subject_submissions')
            ->where('id', $submissionId)
            ->where('report_card_id', $reportCardId)
            ->first();

        if (!$submission) {
            return response()->json(['message' => 'Submission not found.'], 404);
        }

        if (!in_array($reportCard->approval_status, ['draft', 'pending_sponsor'])) {
            return response()->json([
                'message' => 'Revision can only be requested while the report card is in draft or pending sponsor review.',
            ], 422);
        }

        DB::table('report_card_subject_submissions')
            ->where('id', $submissionId)
            ->update([
                'submission_status' => 'revision_requested',
                'sponsor_feedback'  => $data['feedback'],
                'feedback_sent_at'  => now(),
                'updated_at'        => now(),
            ]);

        // Notify the subject teacher that the sponsor wants a revision
        $reportCard->loadMissing('student');
        $this->notifyTeacherRevisionRequested($reportCard, $submission, $data['feedback'], $request->user());

        return response()->json([
            'message'           => "Revision requested for {$submission->subject}.",
            'submission_id'     => $submissionId,
            'subject'           => $submission->subject,
            'submission_status' => 'revision_requested',
            'sponsor_feedback'  => $data['feedback'],
            'feedback_sent_at'  => now()->toDateTimeString(),
        ]);
    }

    /**
     * Class sponsor accepts a subject submission (marks OK).
     */
    public function acceptSubmission(Request $request, $reportCardId, $submissionId)
    {
        $reportCard = ReportCard::findOrFail($reportCardId);

        $submission = DB::table('report_card_subject_submissions')
            ->where('id', $submissionId)
            ->where('report_card_id', $reportCardId)
            ->first();

        if (!$submission) {
            return response()->json(['message' => 'Submission not found.'], 404);
        }

        DB::table('report_card_subject_submissions')
            ->where('id', $submissionId)
            ->update([
                'submission_status' => 'accepted',
                'sponsor_feedback'  => null,
                'feedback_sent_at'  => null,
                'updated_at'        => now(),
            ]);

        return response()->json([
            'message'           => "Marks for {$submission->subject} accepted.",
            'submission_id'     => $submissionId,
            'submission_status' => 'accepted',
        ]);
    }

    /**
     * Class sponsor pulls all submitted marks into the report card,
     * recalculates aggregate/average, then submits to VPI.
     */
    public function compile(Request $request, $reportCardId)
    {
        $data = $request->validate([
            'aggregate'           => 'nullable|numeric',
            'average'             => 'nullable|numeric',
            'rank'                => 'nullable|integer|min:1',
            'total_in_class'      => 'nullable|integer|min:1',
            'conduct'             => 'nullable|string|max:255',
            'class_sponsor'       => 'nullable|string|max:255',
            'promoted_to'         => 'nullable|string|max:100',
            'conditional_subjects'=> 'nullable|string',
            'closing_date'        => 'nullable|string',
        ]);

        $reportCard = ReportCard::findOrFail($reportCardId);

        if (!in_array($reportCard->approval_status, ['draft', 'rejected'])) {
            return response()->json([
                'message' => 'Only draft or rejected report cards can be compiled and submitted.',
            ], 422);
        }

        // Merge all subject submissions into report card subject_marks
        $submissions = DB::table('report_card_subject_submissions')
            ->where('report_card_id', $reportCardId)
            ->get(['subject', 'subject_marks']);

        $mergedMarks = $reportCard->subject_marks ?? [];
        foreach ($submissions as $sub) {
            $subjectMarks = json_decode($sub->subject_marks, true) ?? [];
            $mergedMarks[$sub->subject] = array_merge(
                $mergedMarks[$sub->subject] ?? [],
                $subjectMarks
            );
        }

        // Mark all submissions as accepted
        DB::table('report_card_subject_submissions')
            ->where('report_card_id', $reportCardId)
            ->update(['submission_status' => 'accepted', 'updated_at' => now()]);

        $reportCard->update(array_merge(
            ['subject_marks' => $mergedMarks, 'approval_status' => 'pending_vpi'],
            array_filter($data, fn($v) => $v !== null)
        ));

        return response()->json([
            'message'     => 'Report card compiled and submitted to VPI for review.',
            'report_card' => $reportCard->fresh(['student.class', 'class', 'teacher']),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Teacher: all their own submissions (especially revision_requested)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns all submissions belonging to the authenticated teacher,
     * joined with report card + student info so the teacher can see
     * every pending revision without needing to select a specific card first.
     */
    public function mySubmissions(Request $request)
    {
        $teacher = Teacher::where('user_id', $request->user()->id)->first();
        if (!$teacher) {
            return response()->json(['submissions' => []]);
        }

        $rows = DB::table('report_card_subject_submissions as rss')
            ->join('report_cards as rc', 'rc.id', '=', 'rss.report_card_id')
            ->leftJoin('students as st', 'st.id', '=', 'rc.student_id')
            ->leftJoin('classes as cl', 'cl.id', '=', 'rc.class_id')
            ->where('rss.teacher_id', $teacher->id)
            ->whereIn('rc.approval_status', ['draft', 'pending_sponsor'])
            ->orderByRaw("CASE WHEN rss.submission_status = 'revision_requested' THEN 0 ELSE 1 END")
            ->orderBy('rss.feedback_sent_at', 'desc')
            ->get([
                'rss.id',
                'rss.report_card_id',
                'rss.subject',
                'rss.submission_status',
                'rss.sponsor_feedback',
                'rss.feedback_sent_at',
                'rss.submitted_at',
                'rc.academic_year',
                'rc.approval_status',
                'st.first_name as student_first',
                'st.last_name  as student_last',
                'st.student_id as student_code',
                'cl.name       as class_name',
                'cl.section    as class_section',
            ]);

        return response()->json([
            'submissions' => $rows->map(fn($r) => [
                'id'                => $r->id,
                'report_card_id'    => $r->report_card_id,
                'subject'           => $r->subject,
                'submission_status' => $r->submission_status ?? 'submitted',
                'sponsor_feedback'  => $r->sponsor_feedback,
                'feedback_sent_at'  => $r->feedback_sent_at,
                'submitted_at'      => $r->submitted_at,
                'academic_year'     => $r->academic_year,
                'approval_status'   => $r->approval_status,
                'student_name'      => trim("{$r->student_first} {$r->student_last}"),
                'student_code'      => $r->student_code,
                'class_name'        => trim("{$r->class_name}" . ($r->class_section ? " {$r->class_section}" : '')),
            ]),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers — in-app notifications via the Announcements mechanism
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Notify the class sponsor of their class when a subject teacher submits marks.
     * Uses a targeted Announcement (audience = sponsor's user_id) so the bell
     * updates within the next poll cycle (≤ 20 s) without any extra infrastructure.
     */
    private function notifySponsorMarksSubmitted(ReportCard $reportCard, Teacher $teacher, string $subject): void
    {
        try {
            $class = ClassModel::with('sponsor.user')->find($reportCard->class_id);
            if (!$class || !$class->sponsor || !$class->sponsor->user_id) {
                return; // No class sponsor linked — nothing to notify
            }

            $sponsorUserId   = $class->sponsor->user_id;
            $teacherFullName = "{$teacher->first_name} {$teacher->last_name}";
            $studentName     = $reportCard->student
                ? $reportCard->student->first_name . ' ' . $reportCard->student->last_name
                : "Report Card #{$reportCard->id}";

            Announcement::create([
                'created_by' => $teacher->user_id,
                'title'      => "📝 Marks submitted — {$subject}",
                'body'       => "{$teacherFullName} has submitted {$subject} marks for {$studentName} ({$reportCard->academic_year}). Please review them in the Mark Sheet Compilation page.",
                'priority'   => 'normal',
                'category'   => 'academic',
                'audience'   => (string) $sponsorUserId,
                'is_active'  => true,
                'publish_at' => null,
                'expires_at' => now()->addDays(14),
            ]);
        } catch (\Throwable $e) {
            // Notification failure must never break the marks submission itself
            \Log::warning('Failed to create mark-submission notification: ' . $e->getMessage());
        }
    }

    /**
     * Notify the subject teacher that the class sponsor wants them to revise their marks.
     */
    private function notifyTeacherRevisionRequested(ReportCard $reportCard, object $submission, string $feedback, $sponsorUser): void
    {
        try {
            // Resolve the teacher's user_id from the submission
            $teacher = DB::table('teachers')
                ->where('id', $submission->teacher_id)
                ->first(['user_id', 'first_name', 'last_name']);

            if (!$teacher || !$teacher->user_id) {
                return;
            }

            $sponsorName = $sponsorUser->first_name . ' ' . $sponsorUser->last_name;
            $studentName = $reportCard->student
                ? $reportCard->student->first_name . ' ' . $reportCard->student->last_name
                : "Report Card #{$reportCard->id}";

            Announcement::create([
                'created_by' => $sponsorUser->id,
                'title'      => "↩ Revision needed — {$submission->subject}",
                'body'       => "{$sponsorName} (class sponsor) has requested a revision for your {$submission->subject} marks for {$studentName} ({$reportCard->academic_year}). Feedback: {$feedback}",
                'priority'   => 'important',
                'category'   => 'academic',
                'audience'   => (string) $teacher->user_id,
                'is_active'  => true,
                'publish_at' => null,
                'expires_at' => now()->addDays(14),
            ]);
        } catch (\Throwable $e) {
            \Log::warning('Failed to create revision-request notification: ' . $e->getMessage());
        }
    }
}
