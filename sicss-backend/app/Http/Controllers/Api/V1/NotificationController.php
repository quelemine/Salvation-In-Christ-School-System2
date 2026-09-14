<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $query = Notification::with(['user', 'sentBy']);

        if ($request->has('user_id')) {
            $query->byUser($request->user_id);
        }

        if ($request->has('status')) {
            $query->byStatus($request->status);
        }

        if ($request->has('channel')) {
            $query->byChannel($request->channel);
        }

        if ($request->has('unread')) {
            $query->unread();
        }

        if ($request->has('pending')) {
            $query->pending();
        }

        $notifications = $query->orderBy('created_at', 'desc')->get();
        return response()->json($notifications);
    }

    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'type' => 'required|string|max:100',
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'channel' => 'required|in:email,sms,both',
            'data' => 'nullable|array',
        ]);

        $notification = Notification::create([
            'user_id' => $request->user_id,
            'type' => $request->type,
            'title' => $request->title,
            'message' => $request->message,
            'channel' => $request->channel,
            'data' => $request->data,
            'status' => 'pending',
            'sent_by' => auth()->id(),
        ]);

        return response()->json($notification, 201);
    }

    public function show($id)
    {
        $notification = Notification::with(['user', 'sentBy'])->findOrFail($id);
        return response()->json($notification);
    }

    public function markAsRead($id)
    {
        $notification = Notification::findOrFail($id);
        $notification->markAsRead();
        return response()->json($notification);
    }

    public function markAllAsRead(Request $request)
    {
        $userId = $request->user_id ?? auth()->id();
        Notification::byUser($userId)->unread()->update([
            'is_read' => true,
            'read_at' => now(),
        ]);
        return response()->json(['message' => 'All notifications marked as read']);
    }

    public function sendBulk(Request $request)
    {
        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
            'type' => 'required|string|max:100',
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'channel' => 'required|in:email,sms,both',
            'data' => 'nullable|array',
        ]);

        $notifications = [];
        foreach ($request->user_ids as $userId) {
            $notification = Notification::create([
                'user_id' => $userId,
                'type' => $request->type,
                'title' => $request->title,
                'message' => $request->message,
                'channel' => $request->channel,
                'data' => $request->data,
                'status' => 'pending',
                'sent_by' => auth()->id(),
            ]);
            $notifications[] = $notification;
        }

        return response()->json($notifications, 201);
    }

    public function destroy($id)
    {
        $notification = Notification::findOrFail($id);
        $notification->delete();
        return response()->json(['message' => 'Notification deleted successfully']);
    }
}
