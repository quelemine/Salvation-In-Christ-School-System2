<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PageColumn;
use Illuminate\Http\Request;

class PageColumnController extends Controller
{
    public function index()
    {
        $pageColumns = PageColumn::all();
        return response()->json($pageColumns);
    }

    public function show($pageKey)
    {
        $columns = PageColumn::getColumns($pageKey);
        if (empty($columns)) {
            $defaultColumns = PageColumn::getDefaultColumns($pageKey);
            return response()->json([
                'page_key' => $pageKey,
                'columns' => $defaultColumns,
                'is_default' => true,
            ]);
        }
        return response()->json([
            'page_key' => $pageKey,
            'columns' => $columns,
            'is_default' => false,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'page_key' => 'required|string',
            'column_key' => 'required|string',
            'label' => 'required|string',
            'visible' => 'boolean',
            'order' => 'integer',
            'width' => 'nullable|string',
            'sortable' => 'boolean',
            'filterable' => 'boolean',
            'custom_options' => 'nullable|array',
        ]);

        $pageColumn = PageColumn::updateOrCreate(
            ['page_key' => $request->page_key, 'column_key' => $request->column_key],
            [
                'label' => $request->label,
                'visible' => $request->visible ?? true,
                'order' => $request->order ?? 0,
                'width' => $request->width,
                'sortable' => $request->sortable ?? true,
                'filterable' => $request->filterable ?? false,
                'custom_options' => $request->custom_options,
            ]
        );

        return response()->json($pageColumn, 201);
    }

    public function update(Request $request, $id)
    {
        $pageColumn = PageColumn::findOrFail($id);

        $request->validate([
            'label' => 'required|string',
            'visible' => 'boolean',
            'order' => 'integer',
            'width' => 'nullable|string',
            'sortable' => 'boolean',
            'filterable' => 'boolean',
            'custom_options' => 'nullable|array',
        ]);

        $pageColumn->update([
            'label' => $request->label,
            'visible' => $request->visible ?? true,
            'order' => $request->order ?? 0,
            'width' => $request->width,
            'sortable' => $request->sortable ?? true,
            'filterable' => $request->filterable ?? false,
            'custom_options' => $request->custom_options,
        ]);

        return response()->json($pageColumn);
    }

    public function destroy($id)
    {
        $pageColumn = PageColumn::findOrFail($id);
        $pageColumn->delete();
        return response()->json(['message' => 'Page column deleted successfully']);
    }

    public function bulkUpdate(Request $request)
    {
        $request->validate([
            'page_key' => 'required|string',
            'columns' => 'required|array',
        ]);

        PageColumn::setColumns($request->page_key, $request->columns);

        return response()->json(['message' => 'Columns updated successfully']);
    }

    public function reset($pageKey)
    {
        PageColumn::where('page_key', $pageKey)->delete();
        
        $defaultColumns = PageColumn::getDefaultColumns($pageKey);
        return response()->json([
            'page_key' => $pageKey,
            'columns' => $defaultColumns,
            'is_default' => true,
        ]);
    }
}
