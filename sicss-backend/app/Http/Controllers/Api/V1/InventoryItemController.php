<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use Illuminate\Http\Request;

class InventoryItemController extends Controller
{
    public function index(Request $request)
    {
        $query = InventoryItem::with(['addedBy']);

        if ($request->has('active')) {
            $query->active();
        }

        if ($request->has('category')) {
            $query->byCategory($request->category);
        }

        if ($request->has('low_stock')) {
            $query->lowStock();
        }

        if ($request->has('search')) {
            $query->search($request->search);
        }

        $items = $query->orderBy('name')->get();
        return response()->json($items);
    }

    public function store(Request $request)
    {
        $request->validate([
            'item_code' => 'required|string|unique:inventory_items,item_code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:100',
            'location' => 'nullable|string|max:100',
            'quantity' => 'required|integer|min:0',
            'minimum_stock' => 'required|integer|min:0',
            'unit' => 'nullable|string|max:50',
            'unit_price' => 'nullable|numeric|min:0',
        ]);

        $item = InventoryItem::create([
            'item_code' => $request->item_code,
            'name' => $request->name,
            'description' => $request->description,
            'category' => $request->category,
            'location' => $request->location,
            'quantity' => $request->quantity,
            'minimum_stock' => $request->minimum_stock,
            'unit' => $request->unit,
            'unit_price' => $request->unit_price,
            'added_by' => auth()->id(),
            'is_active' => true,
        ]);

        return response()->json($item, 201);
    }

    public function show($id)
    {
        $item = InventoryItem::with(['addedBy'])->findOrFail($id);
        return response()->json($item);
    }

    public function update(Request $request, $id)
    {
        $item = InventoryItem::findOrFail($id);

        $request->validate([
            'item_code' => 'required|string|unique:inventory_items,item_code,' . $id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:100',
            'location' => 'nullable|string|max:100',
            'quantity' => 'required|integer|min:0',
            'minimum_stock' => 'required|integer|min:0',
            'unit' => 'nullable|string|max:50',
            'unit_price' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $item->update([
            'item_code' => $request->item_code,
            'name' => $request->name,
            'description' => $request->description,
            'category' => $request->category,
            'location' => $request->location,
            'quantity' => $request->quantity,
            'minimum_stock' => $request->minimum_stock,
            'unit' => $request->unit,
            'unit_price' => $request->unit_price,
            'is_active' => $request->is_active ?? true,
        ]);

        return response()->json($item);
    }

    public function destroy($id)
    {
        $item = InventoryItem::findOrFail($id);
        $item->delete();
        return response()->json(['message' => 'Inventory item deleted successfully']);
    }
}
