<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\ClassModel;
use App\Models\ReportCard;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ReportCardController extends Controller
{
    public function index(Request $request)
    {
        $query = ReportCard::with(['student.class', 'class', 'teacher']);

        if ($request->filled('student_id'))    { $query->where('student_id', $request->student_id); }
        if ($request->filled('class_id'))      { $query->where('class_id', $request->class_id); }
        if ($request->filled('academic_year')) { $query->where('academic_year', $request->academic_year); }
        if ($request->filled('approval_status')) { $query->where('approval_status', $request->approval_status); }

        return response()->json($query->latest()->get());
    }

    public function show($id)
    {
        $reportCard = ReportCard::with(['student.class', 'class', 'teacher'])->find($id);
        if (!$reportCard) {
            return response()->json(['message' => 'Report card not found'], 404);
        }
        return response()->json($reportCard);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'student_id'           => 'required|exists:students,id',
            'class_id'             => 'required|exists:classes,id',
            'teacher_id'           => 'nullable|exists:teachers,id',
            'academic_year'        => 'required|string|max:20',
            'grade_level'          => 'required|string|max:100',
            'subject_marks'        => 'required|array',
            'aggregate'            => 'nullable|numeric',
            'average'              => 'nullable|numeric',
            'rank'                 => 'nullable|integer|min:1',
            'total_in_class'       => 'nullable|integer|min:1',
            'conduct'              => 'nullable|string',
            'promotion_status'     => 'nullable|in:promoted,conditional,repeat,not_enrolled',
            'conditional_subjects' => 'nullable|string',
            'promoted_to'          => 'nullable|string',
            'class_sponsor'        => 'nullable|string',
            'principal'            => 'nullable|string',
            'closing_date'         => 'nullable|string',
        ]);

        $reportCard = ReportCard::updateOrCreate(
            ['student_id' => $data['student_id'], 'academic_year' => $data['academic_year']],
            $data
        );

        return response()->json($reportCard->load(['student.class', 'class', 'teacher']), 201);
    }

    public function update(Request $request, $id)
    {
        $reportCard = ReportCard::find($id);
        if (!$reportCard) {
            return response()->json(['message' => 'Report card not found'], 404);
        }

        $data = $request->validate([
            'class_id'             => 'sometimes|required|exists:classes,id',
            'teacher_id'           => 'nullable|exists:teachers,id',
            'grade_level'          => 'sometimes|required|string|max:100',
            'subject_marks'        => 'sometimes|required|array',
            'aggregate'            => 'nullable|numeric',
            'average'              => 'nullable|numeric',
            'rank'                 => 'nullable|integer|min:1',
            'total_in_class'       => 'nullable|integer|min:1',
            'conduct'              => 'nullable|string',
            'promotion_status'     => 'nullable|in:promoted,conditional,repeat,not_enrolled',
            'conditional_subjects' => 'nullable|string',
            'promoted_to'          => 'nullable|string',
            'class_sponsor'        => 'nullable|string',
            'principal'            => 'nullable|string',
            'closing_date'         => 'nullable|string',
        ]);

        $reportCard->update($data);
        return response()->json($reportCard->load(['student.class', 'class', 'teacher']));
    }

    public function destroy($id)
    {
        $reportCard = ReportCard::find($id);
        if (!$reportCard) {
            return response()->json(['message' => 'Report card not found'], 404);
        }
        $reportCard->delete();
        return response()->json(['message' => 'Report card deleted successfully']);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Comments / threaded review messages
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Add a comment or reply. Supports threaded replies via parent_id.
     * VPI sends a 'review_request' type; class sponsor sends a 'sponsor_reply' type.
     * Both receive targeted Announcement notifications.
     */
    public function addComment(Request $request, $id)
    {
        $reportCard = ReportCard::with('student')->find($id);
        if (!$reportCard) {
            return response()->json(['message' => 'Report card not found'], 404);
        }

        $data = $request->validate([
            'comment'   => 'required|string|max:2000',
            'type'      => 'nullable|in:general,review_request,sponsor_reply',
            'parent_id' => 'nullable|string',   // UUID of the comment being replied to
        ]);

        $type     = $data['type'] ?? 'general';
        $parentId = $data['parent_id'] ?? null;

        $comments = $reportCard->comments ?? [];
        $newComment = [
            'id'         => (string) Str::uuid(),
            'parent_id'  => $parentId,
            'type'       => $type,
            'user_id'    => $request->user()->id,
            'user_name'  => $request->user()->first_name . ' ' . $request->user()->last_name,
            'role'       => $request->user()->role->name ?? '',
            'role_slug'  => $request->user()->role->slug ?? '',
            'comment'    => $data['comment'],
            'created_at' => now()->toDateTimeString(),
        ];
        $comments[] = $newComment;
        $reportCard->update(['comments' => $comments]);

        // Send targeted notifications based on type
        $studentName = $reportCard->student
            ? $reportCard->student->first_name . ' ' . $reportCard->student->last_name
            : "Report Card #{$reportCard->id}";

        if ($type === 'review_request') {
            // VPI is requesting a review — notify the class sponsor
            $this->notifySponsorVPIFeedback($reportCard, $request->user(), $data['comment'], $studentName);
            // Update vpi_review_status
            $reportCard->update([
                'vpi_review_status'   => 'pending_sponsor_reply',
                'vpi_feedback'        => $data['comment'],
                'vpi_feedback_sent_at'=> now(),
            ]);
        } elseif ($type === 'sponsor_reply') {
            // Sponsor replied — notify the VPI
            $this->notifyVPISponsorReplied($reportCard, $request->user(), $data['comment'], $studentName);
            // Update status so VPI knows a reply is waiting
            $reportCard->update(['vpi_review_status' => 'sponsor_replied']);
        }

        return response()->json(['message' => 'Comment added.', 'comments' => $reportCard->fresh()->comments ?? []], 201);
    }

    /**
     * Get all comments for a report card.
     */
    public function getComments(Request $request, $id)
    {
        $reportCard = ReportCard::find($id);
        if (!$reportCard) {
            return response()->json(['message' => 'Report card not found'], 404);
        }
        return response()->json([
            'comments'          => $reportCard->comments ?? [],
            'vpi_review_status' => $reportCard->vpi_review_status,
            'vpi_feedback'      => $reportCard->vpi_feedback,
            'vpi_feedback_sent_at' => $reportCard->vpi_feedback_sent_at,
        ]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Approval workflow
    // ──────────────────────────────────────────────────────────────────────────

    public function mine(Request $request)
    {
        $student = \App\Models\Student::where('user_id', $request->user()->id)->first();
        if (!$student) {
            return response()->json(['message' => 'Student not found'], 404);
        }
        $reportCards = ReportCard::where('student_id', $student->id)
            ->where('approval_status', 'approved')
            ->with(['student.class', 'class', 'teacher'])
            ->latest()
            ->get();
        return response()->json($reportCards);
    }

    public function submitForApproval(Request $request, $id)
    {
        $reportCard = ReportCard::find($id);
        if (!$reportCard) {
            return response()->json(['message' => 'Report card not found'], 404);
        }
        if ($reportCard->approval_status !== 'draft') {
            return response()->json(['message' => 'Report card can only be submitted from draft status'], 400);
        }
        $reportCard->update(['approval_status' => 'pending_sponsor']);
        return response()->json($reportCard->load(['student.class', 'class', 'teacher']));
    }

    public function sponsorApprove(Request $request, $id)
    {
        $reportCard = ReportCard::find($id);
        if (!$reportCard) {
            return response()->json(['message' => 'Report card not found'], 404);
        }
        if ($reportCard->approval_status !== 'pending_sponsor') {
            return response()->json(['message' => 'Report card is not pending sponsor approval'], 400);
        }

        $data = $request->validate([
            'action'           => 'required|in:approve,reject',
            'rejection_reason' => 'required_if:action,reject|nullable|string',
        ]);

        if ($data['action'] === 'reject') {
            $reportCard->update(['approval_status' => 'rejected', 'rejection_reason' => $data['rejection_reason']]);
        } else {
            $reportCard->update([
                'approval_status'    => 'pending_vpi',
                'sponsor_approved_by'=> $request->user()->id,
                'sponsor_approved_at'=> now(),
                'vpi_review_status'  => null,   // clear any previous VPI review request
                'vpi_feedback'       => null,
                'vpi_feedback_sent_at' => null,
            ]);
        }
        return response()->json($reportCard->load(['student.class', 'class', 'teacher']));
    }

    public function vpiApprove(Request $request, $id)
    {
        $reportCard = ReportCard::find($id);
        if (!$reportCard) {
            return response()->json(['message' => 'Report card not found'], 404);
        }
        if ($reportCard->approval_status !== 'pending_vpi') {
            return response()->json(['message' => 'Report card is not pending VPI approval. Current status: ' . $reportCard->approval_status], 400);
        }

        $data = $request->validate([
            'action'           => 'required|in:approve,reject',
            'rejection_reason' => 'required_if:action,reject|nullable|string',
        ]);

        if ($data['action'] === 'reject') {
            $reportCard->update(['approval_status' => 'rejected', 'rejection_reason' => $data['rejection_reason']]);
        } else {
            $reportCard->update([
                'approval_status' => 'approved',
                'vpi_approved_by' => $request->user()->id,
                'vpi_approved_at' => now(),
            ]);
        }
        return response()->json($reportCard->load(['student.class', 'class', 'teacher']));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Private notification helpers
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * VPI sent a review request — notify the class sponsor of this report card's class.
     */
    private function notifySponsorVPIFeedback(ReportCard $reportCard, $vpiUser, string $message, string $studentName): void
    {
        try {
            $class = ClassModel::with('sponsor.user')->find($reportCard->class_id);
            if (!$class || !$class->sponsor || !$class->sponsor->user_id) {
                return;
            }
            $vpiName = $vpiUser->first_name . ' ' . $vpiUser->last_name;
            Announcement::create([
                'created_by' => $vpiUser->id,
                'title'      => "📋 VPI review request — {$studentName}",
                'body'       => "{$vpiName} (VPI) has reviewed the report card for {$studentName} and has a message for you: \"{$message}\" — Please reply in Report Cards.",
                'priority'   => 'important',
                'category'   => 'academic',
                'audience'   => (string) $class->sponsor->user_id,
                'is_active'  => true,
                'expires_at' => now()->addDays(14),
            ]);
        } catch (\Throwable $e) {
            \Log::warning('Failed to notify sponsor of VPI feedback: ' . $e->getMessage());
        }
    }

    /**
     * Class sponsor replied to VPI — notify the VPI user.
     */
    private function notifyVPISponsorReplied(ReportCard $reportCard, $sponsorUser, string $message, string $studentName): void
    {
        try {
            // Find VPI users to notify — look up vpi_approved_by if set, else find any active VPI user
            $vpiUserId = $reportCard->vpi_approved_by
                ?? DB::table('users')
                    ->join('roles', 'roles.id', '=', 'users.role_id')
                    ->where('roles.slug', 'vice-principal-instruction')
                    ->value('users.id');

            if (!$vpiUserId) return;

            $sponsorName = $sponsorUser->first_name . ' ' . $sponsorUser->last_name;
            Announcement::create([
                'created_by' => $sponsorUser->id,
                'title'      => "↩ Sponsor replied — {$studentName}",
                'body'       => "{$sponsorName} (class sponsor) has replied to your review request on the report card for {$studentName}: \"{$message}\" — View in Report Cards.",
                'priority'   => 'important',
                'category'   => 'academic',
                'audience'   => (string) $vpiUserId,
                'is_active'  => true,
                'expires_at' => now()->addDays(14),
            ]);
        } catch (\Throwable $e) {
            \Log::warning('Failed to notify VPI of sponsor reply: ' . $e->getMessage());
        }
    }
}
