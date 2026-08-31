<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\HelpdeskTicket;
use App\Models\HelpdeskReply;
use Illuminate\Http\Request;

class HelpdeskController extends Controller
{
    private function ticketWith()
    {
        return ['user:id,first_name,last_name,email', 'assignedTo:id,first_name,last_name', 'replies.user:id,first_name,last_name,email'];
    }

    // ── Any user: list own tickets ──────────────────────────────────────────
    public function myTickets(Request $request)
    {
        $tickets = HelpdeskTicket::with($this->ticketWith())
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json($tickets);
    }

    // ── Any user: create ticket ─────────────────────────────────────────────
    public function store(Request $request)
    {
        $data = $request->validate([
            'subject'     => 'required|string|max:255',
            'description' => 'required|string',
            'category'    => 'in:account,academic,finance,technical,other',
            'priority'    => 'in:low,medium,high,urgent',
            'assigned_to' => 'sometimes|nullable|in:head-of-school,principal,vice-principal-instruction',
        ]);

        $data['user_id'] = $request->user()->id;
        
        // If parent specified a role to assign to, find a user with that role
        if (!empty($data['assigned_to'])) {
            $assignedUser = \App\Models\User::where('role_id', function($query) use ($data) {
                $query->select('id')->from('roles')->where('slug', $data['assigned_to']);
            })->first();
            
            if ($assignedUser) {
                $data['assigned_to'] = $assignedUser->id;
            } else {
                unset($data['assigned_to']);
            }
        }
        
        $ticket = HelpdeskTicket::create($data)->load($this->ticketWith());

        return response()->json($ticket, 201);
    }

    // ── Any user: view own ticket ───────────────────────────────────────────
    public function show(Request $request, HelpdeskTicket $ticket)
    {
        // Non-admin can only see their own tickets
        if ($request->user()->role->slug !== 'admin' && $ticket->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }
        return response()->json($ticket->load($this->ticketWith()));
    }

    // ── Any user: add a reply ───────────────────────────────────────────────
    public function reply(Request $request, HelpdeskTicket $ticket)
    {
        $isAdmin = $request->user()->role->slug === 'admin';

        // Non-admin can only reply to their own tickets
        if (!$isAdmin && $ticket->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $data = $request->validate(['message' => 'required|string']);

        $reply = HelpdeskReply::create([
            'ticket_id'      => $ticket->id,
            'user_id'        => $request->user()->id,
            'message'        => $data['message'],
            'is_staff_reply' => $isAdmin,
        ]);

        // Auto-set status to in_progress when admin first replies
        if ($isAdmin && $ticket->status === 'open') {
            $ticket->update(['status' => 'in_progress']);
        }

        return response()->json($reply->load('user:id,first_name,last_name,email'), 201);
    }

    // ── Admin: list all tickets ─────────────────────────────────────────────
    public function index(Request $request)
    {
        $query = HelpdeskTicket::with($this->ticketWith());

        if ($request->filled('status'))   $query->where('status', $request->status);
        if ($request->filled('priority')) $query->where('priority', $request->priority);
        if ($request->filled('category')) $query->where('category', $request->category);

        return response()->json($query->latest()->get());
    }

    // ── Admin: update ticket status / assignment ────────────────────────────
    public function update(Request $request, HelpdeskTicket $ticket)
    {
        $data = $request->validate([
            'status'      => 'sometimes|in:open,in_progress,resolved,closed',
            'priority'    => 'sometimes|in:low,medium,high,urgent',
            'assigned_to' => 'sometimes|nullable|exists:users,id',
        ]);

        $oldStatus = $ticket->status;

        if (isset($data['status']) && $data['status'] === 'resolved') {
            $data['resolved_at'] = now();
        }

        $ticket->update($data);

        // Auto-post a system reply when status changes so the user is notified
        if (isset($data['status']) && $data['status'] !== $oldStatus) {
            $messages = [
                'in_progress' => 'Your ticket is now being reviewed by our support team. We will get back to you shortly.',
                'resolved'    => '✅ Your ticket has been marked as resolved. If your issue has been fixed, no further action is needed. If the problem persists, please reply to re-open this ticket.',
                'closed'      => '🔒 This ticket has been closed. Thank you for contacting support. Please open a new ticket if you need further assistance.',
                'open'        => 'ℹ️ Your ticket has been re-opened and is awaiting review by our support team.',
            ];

            if (isset($messages[$data['status']])) {
                HelpdeskReply::create([
                    'ticket_id'      => $ticket->id,
                    'user_id'        => $request->user()->id,
                    'message'        => $messages[$data['status']],
                    'is_staff_reply' => true,
                ]);
            }
        }

        return response()->json($ticket->load($this->ticketWith()));
    }

    // ── Admin: count of tickets with no staff reply yet (new / unread) ──────
    public function adminUnread()
    {
        $newTickets = HelpdeskTicket::with($this->ticketWith())
            ->whereIn('status', ['open', 'in_progress'])
            ->whereDoesntHave('replies', fn($q) => $q->where('is_staff_reply', true))
            ->latest()
            ->get();

        return response()->json([
            'count'   => $newTickets->count(),
            'tickets' => $newTickets,
        ]);
    }

    // ── Admin: delete ticket ────────────────────────────────────────────────
    public function destroy(HelpdeskTicket $ticket)
    {
        $ticket->delete();
        return response()->json(['message' => 'Ticket deleted.']);
    }

    // ── Admin: summary stats ────────────────────────────────────────────────
    public function stats()
    {
        return response()->json([
            'open'        => HelpdeskTicket::where('status', 'open')->count(),
            'in_progress' => HelpdeskTicket::where('status', 'in_progress')->count(),
            'resolved'    => HelpdeskTicket::where('status', 'resolved')->count(),
            'closed'      => HelpdeskTicket::where('status', 'closed')->count(),
            'total'       => HelpdeskTicket::count(),
            'urgent'      => HelpdeskTicket::where('priority', 'urgent')
                                ->whereIn('status', ['open', 'in_progress'])->count(),
        ]);
    }
}
