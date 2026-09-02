/**
 * NotificationBell
 * Header bell icon with dropdown panel.
 * Shows announcements + helpdesk reply notifications grouped by kind.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, type NotifItem } from '../hooks/useNotifications';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

const KIND_ICON: Record<string, string> = {
  announcement:       '📢',
  marks_submitted:    '📝',
  revision_requested: '↩',
  vpi_review_request: '📋',
  sponsor_replied:    '↩',
  ticket_reply:       '💬',
  ticket_new:         '🎫',
  ticket_status:      '🔔',
};

const PRIORITY_DOT: Record<string, string> = {
  urgent:    'bg-rose-500',
  high:      'bg-amber-500',
  important: 'bg-amber-500',
  medium:    'bg-blue-400',
  normal:    'bg-slate-400',
  low:       'bg-slate-300',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';
  const { items, unreadCount, loading, refresh, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef   = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current   && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Refresh when panel opens
  useEffect(() => { if (open) refresh(); }, [open]);

  const displayed = tab === 'unread' ? items.filter((i) => !i.isRead) : items;

  const handleClick = async (item: NotifItem) => {
    // Mark announcement-backed items as read in backend
    if (['announcement', 'marks_submitted', 'revision_requested'].includes(item.kind)) {
      const annId = item.id.replace('ann-', '');
      api.post(`/announcements/${annId}/read`).catch(() => {});
    }
    markRead(item.id);
    setOpen(false);
    navigate(item.href);
  };

  const handleMarkAllRead = () => {
    // Mark all announcement reads in backend
    api.post('/announcements/read-all').catch(() => {});
    markAllRead();
  };

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-1"
        style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
      >
        {/* Bell SVG */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-0.5 text-[9px] font-bold text-white leading-none shadow-sm"
            aria-hidden
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full z-50 mt-2 w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          role="dialog"
          aria-label="Notifications panel"
        >
          {/* Panel header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-950">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:underline"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-slate-100">
            {(['all', 'unread'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                  tab === t
                    ? 'border-b-2 border-slate-950 text-slate-950'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {t === 'all' ? `All (${items.length})` : `Unread (${unreadCount})`}
              </button>
            ))}
          </div>

          {/* Notification list */}
          <div className="max-h-[min(420px,60vh)] overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="py-10 text-center">
                <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
              </div>
            ) : displayed.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-2xl mb-2">🔔</p>
                <p className="text-sm font-semibold text-slate-600">
                  {tab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  You'll be notified of announcements and support replies here.
                </p>
              </div>
            ) : (
              <ul>
                {displayed.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => handleClick(item)}
                      className={`w-full text-left flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50 border-b border-slate-100 last:border-0 ${
                        !item.isRead ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      {/* Icon / avatar */}
                      <div className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base ${
                        item.kind === 'marks_submitted'    ? 'bg-cyan-100'    :
                        item.kind === 'revision_requested' ? 'bg-rose-100'    :
                        item.kind === 'vpi_review_request' ? 'bg-amber-100'   :
                        item.kind === 'sponsor_replied'    ? 'bg-emerald-100' :
                        item.kind === 'ticket_reply'       ? 'bg-cyan-100'    :
                        item.kind === 'ticket_new'         ? 'bg-rose-100'    :
                        item.kind === 'ticket_status'      ? 'bg-emerald-100' :
                        'bg-slate-100'
                      }`}>
                        {KIND_ICON[item.kind] ?? '📢'}
                        {/* Priority dot */}
                        {item.priority && (
                          <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${PRIORITY_DOT[item.priority] ?? 'bg-slate-400'}`} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-semibold leading-snug ${!item.isRead ? 'text-slate-950' : 'text-slate-700'}`}>
                            {item.title}
                          </p>
                          <span className="shrink-0 text-[10px] text-slate-400 mt-0.5">{timeAgo(item.createdAt)}</span>
                        </div>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 line-clamp-2">
                          {item.body}
                        </p>
                        {/* Kind label */}
                        <span className={`mt-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                          item.kind === 'marks_submitted'    ? 'bg-cyan-100 text-cyan-800'       :
                          item.kind === 'revision_requested' ? 'bg-rose-100 text-rose-700'       :
                          item.kind === 'vpi_review_request' ? 'bg-amber-100 text-amber-800'     :
                          item.kind === 'sponsor_replied'    ? 'bg-emerald-100 text-emerald-800' :
                          item.kind === 'ticket_reply'       ? 'bg-cyan-100 text-cyan-800'       :
                          item.kind === 'ticket_new'         ? 'bg-rose-100 text-rose-700'       :
                          item.kind === 'ticket_status'      ? 'bg-emerald-100 text-emerald-800' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {item.kind === 'marks_submitted'    ? '📝 Marks submitted'    :
                           item.kind === 'revision_requested' ? '↩ Revision needed'     :
                           item.kind === 'vpi_review_request' ? '📋 VPI review request' :
                           item.kind === 'sponsor_replied'    ? '↩ Sponsor replied'     :
                           item.kind === 'ticket_reply'       ? '💬 Support reply'      :
                           item.kind === 'ticket_new'         ? '🎫 New ticket'         :
                           item.kind === 'ticket_status'      ? '🔔 Status update'      :
                           '📢 Announcement'}
                        </span>
                      </div>

                      {/* Unread dot */}
                      {!item.isRead && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500" aria-label="Unread" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between">
            <button
              onClick={() => { refresh(); }}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-slate-700"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
              Refresh
            </button>
            <div className="flex gap-3 text-[11px] font-semibold text-slate-400">
              <button onClick={() => { setOpen(false); navigate(isAdmin ? '/helpdesk-admin' : '/helpdesk'); }}
                className="hover:text-cyan-700 hover:underline">Help desk</button>
              <button onClick={() => { setOpen(false); navigate('/dashboard'); }}
                className="hover:text-slate-700 hover:underline">Dashboard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
