<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\TransportationVehicle;
use Illuminate\Http\Request;

class TransportationVehicleController extends Controller
{
    public function index(Request $request)
    {
        $query = TransportationVehicle::with(['addedBy', 'assignments']);

        if ($request->has('active')) {
            $query->active();
        }

        if ($request->has('vehicle_type')) {
            $query->byType($request->vehicle_type);
        }

        if ($request->has('route')) {
            $query->byRoute($request->route);
        }

        $vehicles = $query->orderBy('vehicle_number')->get();
        return response()->json($vehicles);
    }

    public function store(Request $request)
    {
        $request->validate([
            'vehicle_number' => 'required|string|unique:transportation_vehicles,vehicle_number',
            'vehicle_type' => 'required|string|max:100',
            'capacity' => 'required|string|max:50',
            'driver_name' => 'required|string|max:255',
            'driver_phone' => 'required|string|max:20',
            'route' => 'nullable|string',
            'description' => 'nullable|string',
        ]);

        $vehicle = TransportationVehicle::create([
            'vehicle_number' => $request->vehicle_number,
            'vehicle_type' => $request->vehicle_type,
            'capacity' => $request->capacity,
            'driver_name' => $request->driver_name,
            'driver_phone' => $request->driver_phone,
            'route' => $request->route,
            'description' => $request->description,
            'added_by' => auth()->id(),
            'is_active' => true,
        ]);

        return response()->json($vehicle, 201);
    }

    public function show($id)
    {
        $vehicle = TransportationVehicle::with(['addedBy', 'assignments.student', 'assignments.teacher'])->findOrFail($id);
        return response()->json($vehicle);
    }

    public function update(Request $request, $id)
    {
        $vehicle = TransportationVehicle::findOrFail($id);

        $request->validate([
            'vehicle_number' => 'required|string|unique:transportation_vehicles,vehicle_number,' . $id,
            'vehicle_type' => 'required|string|max:100',
            'capacity' => 'required|string|max:50',
            'driver_name' => 'required|string|max:255',
            'driver_phone' => 'required|string|max:20',
            'route' => 'nullable|string',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $vehicle->update([
            'vehicle_number' => $request->vehicle_number,
            'vehicle_type' => $request->vehicle_type,
            'capacity' => $request->capacity,
            'driver_name' => $request->driver_name,
            'driver_phone' => $request->driver_phone,
            'route' => $request->route,
            'description' => $request->description,
            'is_active' => $request->is_active ?? true,
        ]);

        return response()->json($vehicle);
    }

    public function destroy($id)
    {
        $vehicle = TransportationVehicle::findOrFail($id);
        $vehicle->delete();
        return response()->json(['message' => 'Vehicle deleted successfully']);
    }
}
