<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Fee;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class FeeController extends Controller
{
    public function index(Request $request)
    {
        $query = Fee::with('class');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        if ($request->has('academic_year')) {
            $query->where('academic_year', $request->academic_year);
        }

        $fees = $query->orderBy('created_at', 'desc')->paginate($request->per_page ?? 15);
        return response()->json($fees);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'amount_lrd' => 'required|numeric|min:0',
            'amount_usd' => 'required|numeric|min:0',
            'class_id' => 'nullable|exists:classes,id',
            'academic_year' => 'required|string|max:20',
            'status' => 'in:active,inactive',
            'is_mandatory' => 'boolean',
            'due_date' => 'nullable|date',
        ]);

        $fee = Fee::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name) . '-' . time(),
            'description' => $request->description,
            'amount_lrd' => $request->amount_lrd,
            'amount_usd' => $request->amount_usd,
            'class_id' => $request->class_id,
            'academic_year' => $request->academic_year,
            'status' => $request->status ?? 'active',
            'is_mandatory' => $request->is_mandatory ?? true,
            'due_date' => $request->due_date,
        ]);

        $fee->load('class');
        return response()->json($fee, 201);
    }

    public function show(Fee $fee)
    {
        $fee->load('class', 'payments');
        return response()->json($fee);
    }

    public function update(Request $request, Fee $fee)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'amount_lrd' => 'required|numeric|min:0',
            'amount_usd' => 'required|numeric|min:0',
            'class_id' => 'nullable|exists:classes,id',
            'academic_year' => 'required|string|max:20',
            'status' => 'in:active,inactive',
            'is_mandatory' => 'boolean',
            'due_date' => 'nullable|date',
        ]);

        $fee->update([
            'name' => $request->name,
            'slug' => Str::slug($request->name) . '-' . time(),
            'description' => $request->description,
            'amount_lrd' => $request->amount_lrd,
            'amount_usd' => $request->amount_usd,
            'class_id' => $request->class_id,
            'academic_year' => $request->academic_year,
            'status' => $request->status ?? 'active',
            'is_mandatory' => $request->is_mandatory ?? true,
            'due_date' => $request->due_date,
        ]);

        $fee->load('class');
        return response()->json($fee);
    }

    public function destroy(Fee $fee)
    {
        $fee->delete();
        return response()->json(['message' => 'Fee deleted successfully']);
    }
}
