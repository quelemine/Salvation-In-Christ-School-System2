<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PageContent;
use Illuminate\Http\Request;

class PageContentController extends Controller
{
    public function index()
    {
        $pageContents = PageContent::all();
        return response()->json($pageContents);
    }

    public function show($pageKey)
    {
        $pageContents = PageContent::where('page_key', $pageKey)->get();
        return response()->json($pageContents);
    }

    public function store(Request $request)
    {
        $request->validate([
            'page_key' => 'required|string',
            'section_key' => 'required|string',
            'content' => 'required|string',
            'content_type' => 'string|in:text,html,markdown',
            'text_color' => 'nullable|string',
            'background_color' => 'nullable|string',
        ]);

        $pageContent = PageContent::setContent(
            $request->page_key,
            $request->section_key,
            $request->content,
            $request->content_type ?? 'text'
        );

        if ($request->has('text_color')) {
            $pageContent->text_color = $request->text_color;
        }
        if ($request->has('background_color')) {
            $pageContent->background_color = $request->background_color;
        }
        $pageContent->save();

        return response()->json($pageContent, 201);
    }

    public function update(Request $request, $id)
    {
        $pageContent = PageContent::findOrFail($id);

        $request->validate([
            'content' => 'required|string',
            'content_type' => 'string|in:text,html,markdown',
            'text_color' => 'nullable|string',
            'background_color' => 'nullable|string',
        ]);

        $pageContent->update([
            'content' => $request->content,
            'content_type' => $request->content_type ?? 'text',
        ]);

        if ($request->has('text_color')) {
            $pageContent->text_color = $request->text_color;
        }
        if ($request->has('background_color')) {
            $pageContent->background_color = $request->background_color;
        }
        $pageContent->save();

        return response()->json($pageContent);
    }

    public function destroy($id)
    {
        $pageContent = PageContent::findOrFail($id);
        $pageContent->delete();
        return response()->json(['message' => 'Page content deleted successfully']);
    }

    public function bulkUpdate(Request $request)
    {
        $request->validate([
            'contents' => 'required|array',
            'contents.*.page_key' => 'required|string',
            'contents.*.section_key' => 'required|string',
            'contents.*.content' => 'required|string',
            'contents.*.content_type' => 'string|in:text,html,markdown',
        ]);

        foreach ($request->contents as $contentData) {
            PageContent::setContent(
                $contentData['page_key'],
                $contentData['section_key'],
                $contentData['content'],
                $contentData['content_type'] ?? 'text'
            );
        }

        return response()->json(['message' => 'Page contents updated successfully']);
    }
}
