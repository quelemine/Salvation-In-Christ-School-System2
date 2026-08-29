/**
 * AnnouncementsBanner
 * Shows active announcements visible to the current user.
 * Displayed at the top of the Dashboard for all roles.
 */
import { useEffect, useState } from 'react';
import api from '../services/api';

type Priority = 'normal' | 'important' | 'urgent';
type Category = 'general' | 'academic' | 'finance' | 'event' | 'emergency';

interface Announcement {
  id: number;
  title: string;
  body: string;
  priority: Priority;
  category: Category;
  is_read: boolean;
  created_at: string;
  author?: { first_name: string; last_name: string };
}

const PRIORITY_STYLES: Record<Priority, { bar: string; bg: string; title: string; badge: string; icon: string }> = {
  normal:    { bar: 'bg-cyan-500',   bg: 'bg-cyan-50  border-cyan-200',    title: 'text-cyan-900',  badge: 'bg-cyan-100 text-cyan-800',   icon: '📢' },
  important: { bar: 'bg-amber-500',  bg: 'bg-amber-50 border-amber-200',   title: 'text-amber-900', badge: 'bg-amber-100 text-amber-800',  icon: '⚠️' },
  urgent:    { bar: 'bg-rose-600',   bg: 'bg-rose-50  border-rose-300',    title: 'text-rose-900',  badge: 'bg-rose-100 text-rose-700',    icon: '🚨' },
};

const CATEGORY_ICONS: Record<Category, string> = {
  general: '📢', academic: '🎓', finance: '💰', event: '📅', emergency: '🚨',
};

export default function AnnouncementsBanner() {
  const [items, setItems]         = useState<Announcement[]>([]);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState<number | null>(null);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [showAll, setShowAll]     = useState(false);

  useEffect(() => {
    api.get('/announcements/feed')
      .then((r) => setItems(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id: number) => {
    try { await api.post(`/announcements/${id}/read`); }
    catch { /* non-critical */ }
    setItems((prev) => prev.map((a) => a.id === id ? { ...a, is_read: true } : a));
  };

  const dismiss = (id: number) => {
    markRead(id);
    setDismissed((s) => new Set([...s, id]));
  };

  const markAllRead = async () => {
    try { await api.post('/announcements/read-all'); }
    catch { /* non-critical */ }
    setItems((prev) => prev.map((a) => ({ ...a, is_read: true })));
  };

  if (loading) return null;

  const visible = items.filter((a) => !dismissed.has(a.id));
  const unread  = visible.filter((a) => !a.is_read);

  if (visible.length === 0) return null;

  const displayed = showAll ? visible : visible.slice(0, 3);

  return (
    <section className="space-y-2" aria-label="Announcements">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-800">Announcements</h2>
          {unread.length > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white min-w-[20px]">
              {unread.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {unread.length > 0 && (
            <button onClick={markAllRead}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 hover:underline">
              Mark all read
            </button>
          )}
          {visible.length > 3 && (
            <button onClick={() => setShowAll((v) => !v)}
              className="text-xs font-semibold text-cyan-700 hover:underline">
              {showAll ? 'Show less' : `Show all (${visible.length})`}
            </button>
          )}
        </div>
      </div>

      {/* Cards */}
      {displayed.map((ann) => {
        const s   = PRIORITY_STYLES[ann.priority];
        const cat = CATEGORY_ICONS[ann.category];
        const isExp = expanded === ann.id;

        return (
          <div
            key={ann.id}
            className={`relative flex overflow-hidden rounded-xl border transition-shadow ${s.bg} ${!ann.is_read ? 'shadow-sm' : ''}`}
          >
            {/* Priority colour bar */}
            <div className={`w-1 shrink-0 ${s.bar}`} />

            <div className="flex-1 min-w-0 px-4 py-3">
              {/* Top row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">{cat}</span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className={`text-sm font-bold truncate ${s.title} ${!ann.is_read ? '' : 'opacity-80'}`}>
                        {ann.title}
                      </h3>
                      {!ann.is_read && (
                        <span className="inline-block h-2 w-2 rounded-full bg-rose-500 shrink-0" title="Unread" />
                      )}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${s.badge}`}>
                        {ann.priority}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {ann.author ? `${ann.author.first_name} ${ann.author.last_name}` : 'Admin'}
                      {' · '}{new Date(ann.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    onClick={() => { setExpanded(isExp ? null : ann.id); if (!ann.is_read) markRead(ann.id); }}
                    className="rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-black/5">
                    {isExp ? 'Less' : 'Read'}
                  </button>
                  <button onClick={() => dismiss(ann.id)}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-black/10 hover:text-slate-700 text-sm"
                    title="Dismiss">
                    ×
                  </button>
                </div>
              </div>

              {/* Body — shown when expanded or for short messages */}
              {(isExp || ann.body.length <= 120) && (
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{ann.body}</p>
              )}
              {!isExp && ann.body.length > 120 && (
                <p className="mt-1.5 text-sm text-slate-600 line-clamp-1">{ann.body}</p>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
