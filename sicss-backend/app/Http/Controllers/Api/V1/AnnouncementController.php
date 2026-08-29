<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnnouncementController extends Controller
{
    // ── Admin: list all ──────────────────────────────────────────────────────
    public function index()
    {
        $items = Announcement::with('author:id,first_name,last_name,email')
            ->latest()
            ->get()
            ->map(function ($a) {
                $a->read_count = DB::table('announcement_reads')
                    ->where('announcement_id', $a->id)->count();
                return $a;
            });

        return response()->json($items);
    }

    // ── Admin: create ────────────────────────────────────────────────────────
    public function store(Request $request)
    {
        $data = $request->validate([
            'title'      => 'required|string|max:255',
            'body'       => 'required|string',
            'priority'   => 'in:normal,important,urgent',
            'category'   => 'in:general,academic,finance,event,emergency',
            'audience'   => 'required|string',   // 'all' or '1,2,3'
            'publish_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after:now',
            'is_active'  => 'boolean',
        ]);

        $data['created_by'] = $request->user()->id;
        $announcement = Announcement::create($data);

        return response()->json(
            $announcement->load('author:id,first_name,last_name,email'),
            201
        );
    }

    // ── Admin: update ────────────────────────────────────────────────────────
    public function update(Request $request, Announcement $announcement)
    {
        $data = $request->validate([
            'title'      => 'sometimes|string|max:255',
            'body'       => 'sometimes|string',
            'priority'   => 'in:normal,important,urgent',
            'category'   => 'in:general,academic,finance,event,emergency',
            'audience'   => 'sometimes|string',
            'publish_at' => 'nullable|date',
            'expires_at' => 'nullable|date',
            'is_active'  => 'boolean',
        ]);

        $announcement->update($data);
        return response()->json($announcement->load('author:id,first_name,last_name,email'));
    }

    // ── Admin: delete ────────────────────────────────────────────────────────
    public function destroy(Announcement $announcement)
    {
        $announcement->delete();
        return response()->json(['message' => 'Announcement deleted.']);
    }

    // ── Any user: fetch announcements visible to them ─────────────────────────
    public function feed(Request $request)
    {
        $userId = $request->user()->id;

        $items = Announcement::visibleTo($userId)
            ->with('author:id,first_name,last_name')
            ->latest('publish_at')
            ->get()
            ->map(function ($a) use ($userId) {
                $a->is_read = DB::table('announcement_reads')
                    ->where('announcement_id', $a->id)
                    ->where('user_id', $userId)
                    ->exists();
                return $a;
            });

        return response()->json($items);
    }

    // ── Any user: mark as read ────────────────────────────────────────────────
    public function markRead(Request $request, Announcement $announcement)
    {
        DB::table('announcement_reads')->insertOrIgnore([
            'announcement_id' => $announcement->id,
            'user_id'         => $request->user()->id,
            'read_at'         => now(),
        ]);
        return response()->json(['message' => 'Marked as read.']);
    }

    // ── Any user: mark all as read ────────────────────────────────────────────
    public function markAllRead(Request $request)
    {
        $userId = $request->user()->id;
        $ids    = Announcement::visibleTo($userId)->pluck('id');

        foreach ($ids as $id) {
            DB::table('announcement_reads')->insertOrIgnore([
                'announcement_id' => $id,
                'user_id'         => $userId,
                'read_at'         => now(),
            ]);
        }
        return response()->json(['message' => 'All marked as read.']);
    }
}
