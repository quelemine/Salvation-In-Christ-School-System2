<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Hostel;
use Illuminate\Http\Request;

class HostelController extends Controller
{
    public function index(Request $request)
    {
        $query = Hostel::with(['addedBy', 'assignments']);

        if ($request->has('active')) {
            $query->active();
        }

        if ($request->has('location')) {
            $query->byLocation($request->location);
        }

        $hostels = $query->orderBy('name')->get();
        return response()->json($hostels);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'location' => 'nullable|string',
            'total_rooms' => 'required|integer|min:0',
            'capacity' => 'required|integer|min:0',
            'warden_name' => 'nullable|string|max:255',
            'warden_phone' => 'nullable|string|max:20',
        ]);

        $hostel = Hostel::create([
            'name' => $request->name,
            'description' => $request->description,
            'location' => $request->location,
            'total_rooms' => $request->total_rooms,
            'capacity' => $request->capacity,
            'warden_name' => $request->warden_name,
            'warden_phone' => $request->warden_phone,
            'added_by' => auth()->id(),
            'is_active' => true,
        ]);

        return response()->json($hostel, 201);
    }

    public function show($id)
    {
        $hostel = Hostel::with(['addedBy', 'assignments.student', 'assignments.teacher'])->findOrFail($id);
        return response()->json($hostel);
    }

    public function update(Request $request, $id)
    {
        $hostel = Hostel::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'location' => 'nullable|string',
            'total_rooms' => 'required|integer|min:0',
            'capacity' => 'required|integer|min:0',
            'warden_name' => 'nullable|string|max:255',
            'warden_phone' => 'nullable|string|max:20',
            'is_active' => 'boolean',
        ]);

        $hostel->update([
            'name' => $request->name,
            'description' => $request->description,
            'location' => $request->location,
            'total_rooms' => $request->total_rooms,
            'capacity' => $request->capacity,
            'warden_name' => $request->warden_name,
            'warden_phone' => $request->warden_phone,
            'is_active' => $request->is_active ?? true,
        ]);

        return response()->json($hostel);
    }

    public function destroy($id)
    {
        $hostel = Hostel::findOrFail($id);
        $hostel->delete();
        return response()->json(['message' => 'Hostel deleted successfully']);
    }
}
