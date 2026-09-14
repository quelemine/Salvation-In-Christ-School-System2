<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Alumni;
use Illuminate\Http\Request;

class AlumniController extends Controller
{
    public function index(Request $request)
    {
        $query = Alumni::with(['student', 'addedBy']);

        if ($request->has('graduation_year')) {
            $query->byGraduationYear($request->graduation_year);
        }

        if ($request->has('active')) {
            $query->active();
        }

        if ($request->has('newsletter')) {
            $query->wantsNewsletter();
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $alumni = $query->orderBy('graduation_year', 'desc')->get();
        return response()->json($alumni);
    }

    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'nullable|exists:students,id',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'graduation_year' => 'required|string|max:10',
            'current_occupation' => 'nullable|string|max:255',
            'current_employer' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'bio' => 'nullable|string',
            'wants_newsletter' => 'boolean',
        ]);

        $alumni = Alumni::create([
            'student_id' => $request->student_id,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'phone' => $request->phone,
            'graduation_year' => $request->graduation_year,
            'current_occupation' => $request->current_occupation,
            'current_employer' => $request->current_employer,
            'address' => $request->address,
            'bio' => $request->bio,
            'is_active' => true,
            'wants_newsletter' => $request->wants_newsletter ?? true,
            'added_by' => auth()->id(),
        ]);

        return response()->json($alumni, 201);
    }

    public function show($id)
    {
        $alumni = Alumni::with(['student', 'addedBy'])->findOrFail($id);
        return response()->json($alumni);
    }

    public function update(Request $request, $id)
    {
        $alumni = Alumni::findOrFail($id);

        $request->validate([
            'student_id' => 'nullable|exists:students,id',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'graduation_year' => 'required|string|max:10',
            'current_occupation' => 'nullable|string|max:255',
            'current_employer' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'bio' => 'nullable|string',
            'is_active' => 'boolean',
            'wants_newsletter' => 'boolean',
        ]);

        $alumni->update([
            'student_id' => $request->student_id,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'phone' => $request->phone,
            'graduation_year' => $request->graduation_year,
            'current_occupation' => $request->current_occupation,
            'current_employer' => $request->current_employer,
            'address' => $request->address,
            'bio' => $request->bio,
            'is_active' => $request->is_active ?? true,
            'wants_newsletter' => $request->wants_newsletter ?? true,
        ]);

        return response()->json($alumni);
    }

    public function destroy($id)
    {
        $alumni = Alumni::findOrFail($id);
        $alumni->delete();
        return response()->json(['message' => 'Alumni record deleted successfully']);
    }
}
