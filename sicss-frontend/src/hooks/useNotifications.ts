/**
 * useNotifications
 * Polls every 30 s for:
 *   - Unread announcements          (all users)
 *   - Helpdesk ticket replies       (non-admin users: staff replied to my ticket)
 *   - New helpdesk tickets          (admin only: tickets with no staff reply yet)
 *   - Status-change notifications   (non-admin: ticket status changed)
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export type NotifKind =
  | 'announcement'
  | 'ticket_reply'
  | 'ticket_new'        // admin sees new user ticket
  | 'ticket_status';    // user sees status change

export interface NotifItem {
  id: string;
  kind: NotifKind;
  title: string;
  body: string;
  isRead: boolean;
  href: string;
  createdAt: string;
  meta?: string;
  priority?: string;    // 'urgent' | 'high' | 'medium' | 'low'
}

const POLL_MS = 20_000; // 20 s — faster for support context

const STATUS_LABELS: Record<string, string> = {
  open:        '🔵 Ticket re-opened',
  in_progress: '🟡 In progress',
  resolved:    '✅ Resolved',
  closed:      '🔒 Closed',
};

export function useNotifications() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';

  const [items, setItems]     = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef              = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch = useCallback(async () => {
    if (!user) return;
    try {
      const notifs: NotifItem[] = [];

      // ── 1. Announcements (all users) ────────────────────────────────────
      try {
        const annRes = await api.get('/announcements/feed');
        console.log('Notifications hook - announcements loaded:', annRes.data);
        for (const ann of annRes.data as any[]) {
          notifs.push({
            id:        `ann-${ann.id}`,
            kind:      'announcement',
            title:     ann.title,
            body:      ann.body?.slice(0, 90) + (ann.body?.length > 90 ? '…' : ''),
            isRead:    ann.is_read,
            href:      '/dashboard',
            createdAt: ann.created_at,
            meta:      ann.category,
            priority:  ann.priority,
          });
        }
      } catch (err) {
        console.error('Notifications hook - failed to load announcements:', err);
      }

      if (isAdmin) {
        // ── 2a. Admin: new tickets with no staff reply yet ─────────────────
        try {
          const unreadRes = await api.get('/helpdesk/unread');
          for (const ticket of unreadRes.data.tickets as any[]) {
            notifs.push({
              id:        `new-ticket-${ticket.id}`,
              kind:      'ticket_new',
              title:     `New ticket — ${ticket.ticket_number}`,
              body:      ticket.subject,
              isRead:    false,
              href:      '/helpdesk-admin',
              createdAt: ticket.created_at,
              meta:      ticket.ticket_number,
              priority:  ticket.priority,
            });
          }
        } catch { /* silent */ }
      } else {
        // ── 2b. Non-admin: staff replies + status changes on my tickets ────
        try {
          const ticketRes = await api.get('/helpdesk/my-tickets');
          for (const ticket of ticketRes.data as any[]) {
            const staffReplies: any[] = (ticket.replies || [])
              .filter((r: any) => r.is_staff_reply);

            if (staffReplies.length === 0) continue;

            const latest = staffReplies[staffReplies.length - 1];

            // Determine if this is a status-update system message or a real reply
            const statusKeywords = [
              'being reviewed', 'marked as resolved', 'been closed',
              're-opened', 'in progress', '✅', '🔒', 'ℹ️',
            ];
            const isStatusMsg = statusKeywords.some((kw) =>
              latest.message?.includes(kw)
            );

            const isRead =
              ticket.status === 'resolved' || ticket.status === 'closed';

            notifs.push({
              id:        `ticket-${ticket.id}`,
              kind:      isStatusMsg ? 'ticket_status' : 'ticket_reply',
              title:     isStatusMsg
                ? `${STATUS_LABELS[ticket.status] ?? 'Status update'} — ${ticket.ticket_number}`
                : `Support reply — ${ticket.ticket_number}`,
              body:      latest.message?.slice(0, 90) +
                         (latest.message?.length > 90 ? '…' : ''),
              isRead,
              href:      '/helpdesk',
              createdAt: latest.created_at,
              meta:      ticket.ticket_number,
              priority:  ticket.priority,
            });
          }
        } catch { /* silent */ }
      }

      // Sort newest first
      notifs.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setItems(notifs);
    } catch { /* silent */ }
  }, [user, isAdmin]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetch();
    setLoading(false);
  }, [fetch]);

  useEffect(() => {
    refresh();
    timerRef.current = setInterval(fetch, POLL_MS);
    const onFocus = () => fetch();
    window.addEventListener('focus', onFocus);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetch, refresh]);

  const unreadCount = items.filter((i) => !i.isRead).length;

  const markRead = useCallback((id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, isRead: true } : i)));
  }, []);

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
  }, []);

  return { items, unreadCount, loading, refresh, markRead, markAllRead };
}
