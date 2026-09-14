<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PageLayout;
use Illuminate\Http\Request;

class PageLayoutController extends Controller
{
    public function index()
    {
        $pageLayouts = PageLayout::all();
        return response()->json($pageLayouts);
    }

    public function show($pageKey)
    {
        $layout = PageLayout::getLayout($pageKey);
        if (!$layout) {
            $defaultSections = PageLayout::getDefaultSections($pageKey);
            return response()->json([
                'page_key' => $pageKey,
                'sections' => $defaultSections,
                'layout_type' => 'default',
                'is_default' => true,
            ]);
        }
        return response()->json($layout);
    }

    public function store(Request $request)
    {
        $request->validate([
            'page_key' => 'required|string',
            'sections' => 'required|array',
            'layout_type' => 'string',
            'primary_button_color' => 'nullable|string',
            'secondary_button_color' => 'nullable|string',
        ]);

        $pageLayout = PageLayout::setLayout(
            $request->page_key,
            $request->sections,
            $request->layout_type ?? 'default'
        );

        if ($request->has('primary_button_color')) {
            $pageLayout->primary_button_color = $request->primary_button_color;
        }
        if ($request->has('secondary_button_color')) {
            $pageLayout->secondary_button_color = $request->secondary_button_color;
        }
        $pageLayout->save();

        return response()->json($pageLayout, 201);
    }

    public function update(Request $request, $id)
    {
        $pageLayout = PageLayout::findOrFail($id);

        $request->validate([
            'sections' => 'required|array',
            'layout_type' => 'string',
            'primary_button_color' => 'nullable|string',
            'secondary_button_color' => 'nullable|string',
        ]);

        $pageLayout->update([
            'sections' => $request->sections,
            'layout_type' => $request->layout_type ?? 'default',
        ]);

        if ($request->has('primary_button_color')) {
            $pageLayout->primary_button_color = $request->primary_button_color;
        }
        if ($request->has('secondary_button_color')) {
            $pageLayout->secondary_button_color = $request->secondary_button_color;
        }
        $pageLayout->save();

        return response()->json($pageLayout);
    }

    public function destroy($id)
    {
        $pageLayout = PageLayout::findOrFail($id);
        $pageLayout->delete();
        return response()->json(['message' => 'Page layout deleted successfully']);
    }

    public function reset($pageKey)
    {
        $pageLayout = PageLayout::where('page_key', $pageKey)->first();
        if ($pageLayout) {
            $pageLayout->delete();
        }
        
        $defaultSections = PageLayout::getDefaultSections($pageKey);
        return response()->json([
            'page_key' => $pageKey,
            'sections' => $defaultSections,
            'layout_type' => 'default',
            'is_default' => true,
        ]);
    }
}
