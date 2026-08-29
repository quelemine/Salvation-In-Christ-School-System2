import { useEffect, useState } from 'react';
import api from '../services/api';

type TicketStatus   = 'open' | 'in_progress' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
type TicketCategory = 'account' | 'academic' | 'finance' | 'technical' | 'other';

interface Reply {
  id: number;
  message: string;
  is_staff_reply: boolean;
  created_at: string;
  user: { first_name: string; last_name: string; email: string };
}

interface Ticket {
  id: number;
  ticket_number: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  resolved_at: string | null;
  user?: { first_name: string; last_name: string; email: string };
  assigned_to?: { first_name: string; last_name: string } | null;
  replies: Reply[];
}

const STATUS_META: Record<TicketStatus, { label: string; color: string; dot: string }> = {
  open:        { label: 'Open',        color: 'bg-blue-100 text-blue-800',       dot: 'bg-blue-500'    },
  in_progress: { label: 'In progress', color: 'bg-amber-100 text-amber-800',     dot: 'bg-amber-500'   },
  resolved:    { label: 'Resolved',    color: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  closed:      { label: 'Closed',      color: 'bg-slate-100 text-slate-600',     dot: 'bg-slate-400'   },
};
const PRIORITY_META: Record<TicketPriority, { label: string; color: string; row: string }> = {
  low:    { label: 'Low',    color: 'bg-slate-100 text-slate-600',  row: '' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700',    row: '' },
  high:   { label: 'High',   color: 'bg-amber-100 text-amber-800',  row: 'border-l-2 border-amber-400' },
  urgent: { label: 'Urgent', color: 'bg-rose-100 text-rose-700',    row: 'border-l-2 border-rose-500' },
};
const CATEGORY_ICONS: Record<TicketCategory, string> = {
  account: '👤', academic: '🎓', finance: '💰', technical: '🔧', other: '💬',
};

export default function HelpDeskAdmin() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState({ open: 0, in_progress: 0, resolved: 0, closed: 0, total: 0, urgent: 0 });
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Ticket | null>(null);

  // Filters
  const [fStatus,   setFStatus]   = useState('');
  const [fPriority, setFPriority] = useState('');
  const [search,    setSearch]    = useState('');

  // Reply / status panel
  const [reply,       setReply]       = useState('');
  const [sending,     setSending]     = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [replyError,  setReplyError]  = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [tRes, sRes] = await Promise.all([
        api.get('/helpdesk/tickets'),
        api.get('/helpdesk/stats'),
      ]);
      setTickets(tRes.data);
      setStats(sRes.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const filtered = tickets.filter((t) => {
    if (fStatus   && t.status   !== fStatus)   return false;
    if (fPriority && t.priority !== fPriority) return false;
    if (search) {
      const q = search.toLowerCase();
      return `${t.ticket_number} ${t.subject} ${t.user?.first_name} ${t.user?.last_name} ${t.user?.email}`.toLowerCase().includes(q);
    }
    return true;
  });

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !reply.trim()) return;
    setSending(true); setReplyError('');
    try {
      const res = await api.post(`/helpdesk/tickets/${active.id}/reply`, { message: reply });
      const newReply = res.data;
      const updated = { ...active, replies: [...active.replies, newReply], status: active.status === 'open' ? 'in_progress' as TicketStatus : active.status };
      setActive(updated);
      setTickets((p) => p.map((t) => (t.id === active.id ? updated : t)));
      setReply('');
      // Refresh stats
      api.get('/helpdesk/stats').then((r) => setStats(r.data)).catch(() => {});
    } catch { setReplyError('Failed to send reply. Please try again.'); }
    finally { setSending(false); }
  };

  const updateStatus = async (status: TicketStatus) => {
    if (!active) return;
    setUpdatingStatus(true);
    try {
      const res = await api.put(`/helpdesk/tickets/${active.id}`, { status });
      setActive(res.data);
      setTickets((p) => p.map((t) => (t.id === active.id ? res.data : t)));
      api.get('/helpdesk/stats').then((r) => setStats(r.data)).catch(() => {});
    } catch { /* silent */ }
    finally { setUpdatingStatus(false); }
  };

  const deleteTicket = async (id: number) => {
    if (!confirm('Delete this ticket permanently?')) return;
    await api.delete(`/helpdesk/tickets/${id}`);
    setTickets((p) => p.filter((t) => t.id !== id));
    if (active?.id === id) setActive(null);
    api.get('/helpdesk/stats').then((r) => setStats(r.data)).catch(() => {});
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Support management</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Help desk</h1>
        <p className="mt-2 text-sm text-slate-500">Manage and respond to user support tickets.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Total',       value: stats.total,       color: 'text-slate-950' },
          { label: 'Open',        value: stats.open,        color: 'text-blue-700'  },
          { label: 'In progress', value: stats.in_progress, color: 'text-amber-700' },
          { label: 'Resolved',    value: stats.resolved,    color: 'text-emerald-700' },
          { label: 'Closed',      value: stats.closed,      color: 'text-slate-500' },
          { label: 'Urgent',      value: stats.urgent,      color: 'text-rose-600'  },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Two-panel layout */}
      <div className="flex gap-5 flex-col xl:flex-row" style={{ minHeight: 600 }}>

        {/* ── Left: ticket list ── */}
        <div className="xl:w-96 shrink-0 flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Filters */}
          <div className="border-b border-slate-100 p-4 space-y-3">
            <input type="search" placeholder="Search tickets…" value={search}
              onChange={(e) => setSearch(e.target.value)} className="input-field text-sm" />
            <div className="flex gap-2">
              <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="input-field text-xs flex-1">
                <option value="">All statuses</option>
                {(Object.entries(STATUS_META) as [TicketStatus, any][]).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <select value={fPriority} onChange={(e) => setFPriority(e.target.value)} className="input-field text-xs flex-1">
                <option value="">All priorities</option>
                {(Object.entries(PRIORITY_META) as [TicketPriority, any][]).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <p className="py-10 text-center text-sm text-slate-500">Loading…</p>
            ) : filtered.length === 0 ? (
              <div className="py-14 text-center">
                <p className="text-3xl mb-2">🎫</p>
                <p className="text-sm text-slate-400">No tickets found.</p>
              </div>
            ) : filtered.map((t) => {
              const sm = STATUS_META[t.status];
              const pm = PRIORITY_META[t.priority];
              const isActive = active?.id === t.id;
              return (
                <button key={t.id} onClick={() => { setActive(t); setReply(''); setReplyError(''); }}
                  className={`w-full text-left px-4 py-3.5 transition-colors ${pm.row} ${isActive ? 'bg-cyan-50 border-r-2 border-r-cyan-600' : 'hover:bg-slate-50'}`}>
                  <div className="flex items-start gap-2">
                    <span className="text-lg mt-0.5 shrink-0">{CATEGORY_ICONS[t.category]}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{t.subject}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {t.user ? `${t.user.first_name} ${t.user.last_name}` : '—'}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${sm.color}`}>
                          <span className={`h-1 w-1 rounded-full ${sm.dot}`} />{sm.label}
                        </span>
                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${pm.color}`}>{pm.label}</span>
                        <span className="text-[9px] text-slate-400">{t.ticket_number}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[9px] text-slate-400">{new Date(t.created_at).toLocaleDateString()}</p>
                      {t.replies.filter((r: any) => r.is_staff_reply).length === 0 ? (
                        <span className="mt-1 inline-block rounded-full bg-rose-600 px-1.5 py-0.5 text-[8px] font-bold text-white animate-pulse">NEW</span>
                      ) : (
                        <p className="text-[9px] text-cyan-600 mt-1">{t.replies.length} repl{t.replies.length === 1 ? 'y' : 'ies'}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
            {filtered.length} of {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* ── Right: ticket detail ── */}
        <div className="flex-1 min-w-0">
          {!active ? (
            <div className="flex h-full items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white">
              <div className="text-center">
                <p className="text-4xl mb-3">🎫</p>
                <p className="text-sm font-semibold text-slate-600">Select a ticket to view details</p>
                <p className="text-xs text-slate-400 mt-1">Click any ticket from the list on the left.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden h-full">
              {/* Ticket header */}
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-lg">{CATEGORY_ICONS[active.category]}</span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_META[active.status].color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[active.status].dot}`} />
                        {STATUS_META[active.status].label}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PRIORITY_META[active.priority].color}`}>
                        {PRIORITY_META[active.priority].label}
                      </span>
                      <span className="font-mono text-xs text-slate-400">{active.ticket_number}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-950">{active.subject}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      From: <strong>{active.user ? `${active.user.first_name} ${active.user.last_name} (${active.user.email})` : '—'}</strong>
                      {' · '}{new Date(active.created_at).toLocaleString()}
                    </p>
                  </div>
                  {/* Status actions */}
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {(['open', 'in_progress', 'resolved', 'closed'] as TicketStatus[])
                      .filter((s) => s !== active.status)
                      .map((s) => {
                        const labels: Record<string, string> = {
                          open:        '↩ Re-open',
                          in_progress: '🔄 Mark in progress',
                          resolved:    '✅ Mark resolved',
                          closed:      '🔒 Close ticket',
                        };
                        const colors: Record<string, string> = {
                          open:        'border-slate-300 text-slate-600 hover:bg-slate-50',
                          in_progress: 'border-amber-300 text-amber-700 hover:bg-amber-50',
                          resolved:    'border-emerald-300 text-emerald-700 hover:bg-emerald-50',
                          closed:      'border-rose-200 text-rose-600 hover:bg-rose-50',
                        };
                        return (
                          <button key={s} onClick={() => updateStatus(s)} disabled={updatingStatus}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-40 ${colors[s]}`}>
                            {updatingStatus ? '…' : labels[s]}
                          </button>
                        );
                      })}
                    <button onClick={() => deleteTicket(active.id)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50">
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* Original description */}
              <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-300 text-xs font-bold text-slate-700">
                    {active.user?.first_name?.charAt(0)}{active.user?.last_name?.charAt(0)}
                  </div>
                  <span className="text-sm font-semibold">{active.user?.first_name} {active.user?.last_name}</span>
                  <span className="text-xs text-slate-400">{new Date(active.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{active.description}</p>
              </div>

              {/* Replies */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 min-h-0" style={{ maxHeight: 340 }}>
                {active.replies.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-400">No replies yet. Respond below to help the user.</p>
                ) : active.replies.map((r) => (
                  <div key={r.id} className={`px-5 py-4 ${r.is_staff_reply ? 'bg-cyan-50' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        r.is_staff_reply ? 'bg-cyan-700 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {r.is_staff_reply ? '🛠' : `${r.user.first_name?.charAt(0)}${r.user.last_name?.charAt(0)}`}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-sm font-semibold">{r.user.first_name} {r.user.last_name}</span>
                          {r.is_staff_reply && (
                            <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-800 uppercase tracking-wide">Support</span>
                          )}
                          <span className="text-xs text-slate-400">{new Date(r.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{r.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Admin reply form */}
              {active.status !== 'closed' ? (
                <form onSubmit={sendReply} className="border-t border-slate-200 p-4 space-y-2">
                  {replyError && <p className="text-xs text-rose-600">{replyError}</p>}
                  <textarea value={reply} onChange={(e) => setReply(e.target.value)}
                    className="input-field" rows={3}
                    placeholder="Write your support response…" />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-xs text-slate-400">Your reply will be marked as a staff response.</p>
                      <p className="text-[10px] text-slate-400">Changing status above also auto-notifies the user with a message.</p>
                    </div>
                    <button type="submit" disabled={sending || !reply.trim()}
                      className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-40">
                      {sending ? 'Sending…' : '🛠 Send response'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-sm text-slate-400 text-center">
                  Ticket is closed.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
