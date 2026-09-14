<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ReportCardTemplate;
use App\Models\LearningArea;
use Illuminate\Http\Request;

class ReportCardTemplateController extends Controller
{
    // Report Card Templates
    public function indexTemplates()
    {
        return response()->json(ReportCardTemplate::all());
    }

    public function showTemplate($id)
    {
        $template = ReportCardTemplate::with('reportCards')->find($id);
        if (!$template) {
            return response()->json(['message' => 'Template not found'], 404);
        }
        return response()->json($template);
    }

    public function storeTemplate(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:report_card_templates,slug',
            'grade_level_type' => 'required|in:nursery_kg,primary,junior_high,senior_high',
            'assessment_periods' => 'nullable|array',
            'grading_method' => 'required|in:numeric,letter',
            'grading_scale' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        $template = ReportCardTemplate::create($data);
        return response()->json($template, 201);
    }

    public function updateTemplate(Request $request, $id)
    {
        $template = ReportCardTemplate::find($id);
        if (!$template) {
            return response()->json(['message' => 'Template not found'], 404);
        }

        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'slug' => 'sometimes|required|string|max:255|unique:report_card_templates,slug,' . $id,
            'grade_level_type' => 'sometimes|required|in:nursery_kg,primary,junior_high,senior_high',
            'assessment_periods' => 'nullable|array',
            'grading_method' => 'sometimes|required|in:numeric,letter',
            'grading_scale' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        $template->update($data);
        return response()->json($template);
    }

    public function destroyTemplate($id)
    {
        $template = ReportCardTemplate::find($id);
        if (!$template) {
            return response()->json(['message' => 'Template not found'], 404);
        }
        $template->delete();
        return response()->json(['message' => 'Template deleted successfully']);
    }

    // Learning Areas
    public function indexLearningAreas(Request $request)
    {
        $query = LearningArea::query();
        if ($request->filled('grade_level_type')) {
            $query->where('grade_level_type', $request->grade_level_type);
        }
        return response()->json($query->orderBy('order')->get());
    }

    public function showLearningArea($id)
    {
        $area = LearningArea::find($id);
        if (!$area) {
            return response()->json(['message' => 'Learning area not found'], 404);
        }
        return response()->json($area);
    }

    public function storeLearningArea(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'grade_level_type' => 'required|in:nursery_kg,primary,junior_high,senior_high',
            'order' => 'integer',
            'is_active' => 'boolean',
        ]);

        $area = LearningArea::create($data);
        return response()->json($area, 201);
    }

    public function updateLearningArea(Request $request, $id)
    {
        $area = LearningArea::find($id);
        if (!$area) {
            return response()->json(['message' => 'Learning area not found'], 404);
        }

        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => 'nullable|string|max:50',
            'grade_level_type' => 'sometimes|required|in:nursery_kg,primary,junior_high,senior_high',
            'order' => 'sometimes|integer',
            'is_active' => 'boolean',
        ]);

        $area->update($data);
        return response()->json($area);
    }

    public function destroyLearningArea($id)
    {
        $area = LearningArea::find($id);
        if (!$area) {
            return response()->json(['message' => 'Learning area not found'], 404);
        }
        $area->delete();
        return response()->json(['message' => 'Learning area deleted successfully']);
    }
}
