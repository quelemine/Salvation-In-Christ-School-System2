<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ReportCard;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SubjectMarkController extends Controller
{
    /**
     * Subject teacher submits marks for their subject on a report card.
     * Creates or updates a row in report_card_subject_submissions.
     * Merges the marks into the parent report card's subject_marks JSON.
     */
    public function submit(Request $request, $reportCardId)
    {
        $data = $request->validate([
            'subject'       => 'required|string|max:255',
            'subject_marks' => 'required|array',   // e.g. {"1st pd":"85","Exam 1":"90"}
        ]);

        $reportCard = ReportCard::findOrFail($reportCardId);

        // Only allow submission while the card is in draft or pending_sponsor
        if (!in_array($reportCard->approval_status, ['draft', 'pending_sponsor'])) {
            return response()->json([
                'message' => 'Marks can only be submitted while the report card is in draft or pending sponsor review.',
            ], 422);
        }

        // Resolve the teacher record for the authenticated user
        $teacher = Teacher::where('user_id', $request->user()->id)->first();
        if (!$teacher) {
            return response()->json(['message' => 'No teacher profile linked to your account.'], 403);
        }

        DB::transaction(function () use ($data, $reportCard, $teacher) {
            // Upsert the submission record
            DB::table('report_card_subject_submissions')->upsert(
                [[
                    'report_card_id' => $reportCard->id,
                    'teacher_id'     => $teacher->id,
                    'subject'        => $data['subject'],
                    'subject_marks'  => json_encode($data['subject_marks']),
                    'submitted_at'   => now(),
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ]],
                ['report_card_id', 'subject'],
                ['teacher_id', 'subject_marks', 'submitted_at', 'updated_at']
            );

            // Merge into the parent report card's subject_marks
            $current = $reportCard->subject_marks ?? [];
            $current[$data['subject']] = array_merge(
                $current[$data['subject']] ?? [],
                $data['subject_marks']
            );
            $reportCard->update(['subject_marks' => $current]);
        });

        return response()->json([
            'message'       => "Marks for {$data['subject']} submitted successfully.",
            'report_card'   => $reportCard->fresh(['student.class', 'class', 'teacher']),
        ], 201);
    }

    /**
     * List all subject submissions for a report card.
     * Used by the class sponsor to see which subjects have been submitted.
     */
    public function index($reportCardId)
    {
        $reportCard = ReportCard::findOrFail($reportCardId);

        $submissions = DB::table('report_card_subject_submissions')
            ->join('teachers', 'teachers.id', '=', 'report_card_subject_submissions.teacher_id')
            ->where('report_card_id', $reportCardId)
            ->orderBy('subject')
            ->get([
                'report_card_subject_submissions.id',
                'report_card_subject_submissions.subject',
                'report_card_subject_submissions.subject_marks',
                'report_card_subject_submissions.submitted_at',
                'teachers.first_name',
                'teachers.last_name',
                'teachers.employee_id',
            ]);

        return response()->json([
            'report_card_id'  => $reportCardId,
            'approval_status' => $reportCard->approval_status,
            'submissions'     => $submissions->map(function ($s) {
                return [
                    'id'           => $s->id,
                    'subject'      => $s->subject,
                    'subject_marks'=> json_decode($s->subject_marks, true),
                    'submitted_at' => $s->submitted_at,
                    'teacher_name' => "{$s->first_name} {$s->last_name}",
                    'employee_id'  => $s->employee_id,
                ];
            }),
        ]);
    }

    /**
     * Class sponsor pulls all submitted marks into the report card
     * subject_marks, recalculates aggregate/average, then submits to VPI.
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

        $reportCard->update(array_merge(
            ['subject_marks' => $mergedMarks, 'approval_status' => 'pending_vpi'],
            array_filter($data, fn($v) => $v !== null)
        ));

        return response()->json([
            'message'     => 'Report card compiled and submitted to VPI for review.',
            'report_card' => $reportCard->fresh(['student.class', 'class', 'teacher']),
        ]);
    }
}
