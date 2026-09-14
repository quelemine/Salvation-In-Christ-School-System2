<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ParentAccount;
use Illuminate\Http\Request;

class ParentAccountController extends Controller
{
    public function index(Request $request)
    {
        $query = ParentAccount::with(['user']);

        if ($request->has('relationship')) {
            $query->byRelationship($request->relationship);
        }

        if ($request->has('receive_notifications')) {
            $query->receiveNotifications();
        }

        $accounts = $query->orderBy('created_at', 'desc')->get();
        return response()->json($accounts);
    }

    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'relationship' => 'required|string|max:50',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'emergency_contact' => 'nullable|string',
            'receive_notifications' => 'boolean',
            'receive_sms' => 'boolean',
            'receive_email' => 'boolean',
        ]);

        $account = ParentAccount::create([
            'user_id' => $request->user_id,
            'relationship' => $request->relationship,
            'phone' => $request->phone,
            'address' => $request->address,
            'emergency_contact' => $request->emergency_contact,
            'receive_notifications' => $request->receive_notifications ?? true,
            'receive_sms' => $request->receive_sms ?? false,
            'receive_email' => $request->receive_email ?? true,
        ]);

        return response()->json($account, 201);
    }

    public function show($id)
    {
        $account = ParentAccount::with(['user'])->findOrFail($id);
        return response()->json($account);
    }

    public function update(Request $request, $id)
    {
        $account = ParentAccount::findOrFail($id);

        $request->validate([
            'relationship' => 'required|string|max:50',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'emergency_contact' => 'nullable|string',
            'receive_notifications' => 'boolean',
            'receive_sms' => 'boolean',
            'receive_email' => 'boolean',
        ]);

        $account->update([
            'relationship' => $request->relationship,
            'phone' => $request->phone,
            'address' => $request->address,
            'emergency_contact' => $request->emergency_contact,
            'receive_notifications' => $request->receive_notifications ?? true,
            'receive_sms' => $request->receive_sms ?? false,
            'receive_email' => $request->receive_email ?? true,
        ]);

        return response()->json($account);
    }

    public function destroy($id)
    {
        $account = ParentAccount::findOrFail($id);
        $account->delete();
        return response()->json(['message' => 'Parent account deleted successfully']);
    }
}
