import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

// ── Types ─────────────────────────────────────────────────────────────────────
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

// ── Meta maps ─────────────────────────────────────────────────────────────────
const STATUS_META: Record<TicketStatus, { label: string; color: string; dot: string }> = {
  open:        { label: 'Open',        color: 'bg-blue-100 text-blue-800',    dot: 'bg-blue-500'    },
  in_progress: { label: 'In progress', color: 'bg-amber-100 text-amber-800',  dot: 'bg-amber-500'   },
  resolved:    { label: 'Resolved',    color: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  closed:      { label: 'Closed',      color: 'bg-slate-100 text-slate-600',  dot: 'bg-slate-400'   },
};
const PRIORITY_META: Record<TicketPriority, { label: string; color: string }> = {
  low:    { label: 'Low',    color: 'bg-slate-100 text-slate-600'  },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700'   },
  high:   { label: 'High',   color: 'bg-amber-100 text-amber-800' },
  urgent: { label: 'Urgent', color: 'bg-rose-100 text-rose-700'   },
};
const CATEGORY_ICONS: Record<TicketCategory, string> = {
  account: '👤', academic: '🎓', finance: '💰', technical: '🔧', other: '💬',
};

// ── New ticket form ────────────────────────────────────────────────────────────
function NewTicketForm({ onCreated }: { onCreated: (t: Ticket) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    subject: '', description: '',
    category: 'other' as TicketCategory,
    priority: 'medium' as TicketPriority,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) {
      setError('Subject and description are required.'); return;
    }
    setSaving(true); setError('');
    try {
      const res = await api.post('/helpdesk/tickets', form);
      onCreated(res.data);
      setForm({ subject: '', description: '', category: 'other', priority: 'medium' });
      setOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit ticket.');
    } finally { setSaving(false); }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full rounded-xl border-2 border-dashed border-slate-300 py-5 text-sm font-semibold text-slate-500 hover:border-cyan-400 hover:text-cyan-700 transition-colors">
        + Submit a new support ticket
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-bold text-slate-950">New support ticket</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
      </div>

      {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</p>}

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Subject <span className="text-rose-500">*</span></label>
        <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className="input-field" placeholder="Briefly describe your issue…" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Category</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as TicketCategory })} className="input-field">
            {(Object.entries(CATEGORY_ICONS) as [TicketCategory, string][]).map(([k, icon]) => (
              <option key={k} value={k}>{icon} {k.charAt(0).toUpperCase() + k.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Priority</label>
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TicketPriority })} className="input-field">
            {(Object.entries(PRIORITY_META) as [TicketPriority, any][]).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Description <span className="text-rose-500">*</span></label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="input-field" rows={5}
          placeholder="Describe your issue in detail. Include steps to reproduce if it's a technical problem…" />
        <p className="mt-1 text-xs text-slate-400">{form.description.length} characters</p>
      </div>

      <div className="flex justify-end gap-3 pt-1">
        <button type="button" onClick={() => setOpen(false)}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="rounded-lg bg-slate-950 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50">
          {saving ? 'Submitting…' : '🎫 Submit ticket'}
        </button>
      </div>
    </form>
  );
}

// ── Ticket thread view ─────────────────────────────────────────────────────────
function TicketThread({ ticket, onClose, onUpdated }: {
  ticket: Ticket; onClose: () => void; onUpdated: (t: Ticket) => void;
}) {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';
  const [replies, setReplies] = useState<Reply[]>(ticket.replies || []);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true); setError('');
    try {
      const res = await api.post(`/helpdesk/tickets/${ticket.id}/reply`, { message });
      setReplies((p) => [...p, res.data]);
      setMessage('');
      onUpdated({ ...ticket, replies: [...replies, res.data], status: isAdmin && ticket.status === 'open' ? 'in_progress' : ticket.status });
    } catch { setError('Failed to send reply.'); }
    finally { setSending(false); }
  };

  const sm = STATUS_META[ticket.status];
  const pm = PRIORITY_META[ticket.priority];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Thread header */}
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-base">{CATEGORY_ICONS[ticket.category]}</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${sm.color}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${sm.dot}`} />
                {sm.label}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${pm.color}`}>{pm.label}</span>
              <span className="font-mono text-xs text-slate-400">{ticket.ticket_number}</span>
            </div>
            <h3 className="text-base font-bold text-slate-950 truncate">{ticket.subject}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Opened {new Date(ticket.created_at).toLocaleString()}
              {ticket.assigned_to && ` · Assigned to ${ticket.assigned_to.first_name} ${ticket.assigned_to.last_name}`}
            </p>
          </div>
          <button onClick={onClose} className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50">
            ← Back
          </button>
        </div>
      </div>

      {/* Original description */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-300 text-xs font-bold text-slate-700">
            {ticket.user?.first_name?.charAt(0)}{ticket.user?.last_name?.charAt(0)}
          </div>
          <span className="text-sm font-semibold text-slate-900">
            {ticket.user ? `${ticket.user.first_name} ${ticket.user.last_name}` : 'You'}
          </span>
          <span className="text-xs text-slate-400">{new Date(ticket.created_at).toLocaleString()}</span>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
      </div>

      {/* Replies */}
      <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
        {replies.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-sm text-slate-400">No replies yet. Our support team will respond shortly.</p>
          </div>
        )}
        {replies.map((r) => (
          <div key={r.id} className={`px-5 py-4 ${r.is_staff_reply ? 'bg-cyan-50' : ''}`}>
            <div className="flex items-start gap-3">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                r.is_staff_reply ? 'bg-cyan-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {r.is_staff_reply ? '🛠' : `${r.user.first_name?.charAt(0)}${r.user.last_name?.charAt(0)}`}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-slate-900">
                    {r.user.first_name} {r.user.last_name}
                  </span>
                  {r.is_staff_reply && (
                    <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-800 uppercase tracking-wide">
                      Support
                    </span>
                  )}
                  <span className="text-xs text-slate-400">{new Date(r.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{r.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reply box */}
      {ticket.status !== 'closed' ? (
        <form onSubmit={sendReply} className="border-t border-slate-200 p-4 space-y-3">
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <textarea value={message} onChange={(e) => setMessage(e.target.value)}
            className="input-field" rows={3}
            placeholder={isAdmin ? 'Write a support response…' : 'Add a follow-up message…'} />
          <div className="flex justify-end">
            <button type="submit" disabled={sending || !message.trim()}
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-40">
              {sending ? 'Sending…' : isAdmin ? '🛠 Send response' : '💬 Send reply'}
            </button>
          </div>
        </form>
      ) : (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-sm text-slate-400 text-center">
          This ticket is closed. Open a new ticket if you need further assistance.
        </div>
      )}
    </div>
  );
}

// ── Main Help Desk page ────────────────────────────────────────────────────────
export default function HelpDesk() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/helpdesk/my-tickets');
      setTickets(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleCreated = (t: Ticket) => setTickets((p) => [t, ...p]);
  const handleUpdated = (t: Ticket) => {
    setTickets((p) => p.map((x) => (x.id === t.id ? t : x)));
    setActiveTicket(t);
  };

  const filtered = filterStatus ? tickets.filter((t) => t.status === filterStatus) : tickets;

  const counts = {
    open:        tickets.filter((t) => t.status === 'open').length,
    in_progress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved:    tickets.filter((t) => t.status === 'resolved').length,
  };

  if (activeTicket) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Help desk</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">Ticket thread</h1>
        </div>
        <TicketThread
          ticket={activeTicket}
          onClose={() => setActiveTicket(null)}
          onUpdated={handleUpdated}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Support</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Help desk</h1>
        <p className="mt-2 text-sm text-slate-500">
          Submit a support ticket and our team will respond as soon as possible.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Open',        value: counts.open,        color: 'text-blue-700'    },
          { label: 'In progress', value: counts.in_progress, color: 'text-amber-700'   },
          { label: 'Resolved',    value: counts.resolved,    color: 'text-emerald-700' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* New ticket */}
      <NewTicketForm onCreated={handleCreated} />

      {/* My tickets list */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <p className="text-sm font-bold text-slate-950">My tickets ({tickets.length})</p>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field w-auto text-sm">
            <option value="">All statuses</option>
            {(Object.entries(STATUS_META) as [TicketStatus, any][]).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-slate-500">Loading tickets…</p>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-3xl mb-3">🎫</p>
            <p className="text-sm font-semibold text-slate-700">No tickets yet</p>
            <p className="text-xs text-slate-400 mt-1">Submit a ticket above when you need help.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((t) => {
              const sm = STATUS_META[t.status];
              const pm = PRIORITY_META[t.priority];
              const unread = t.replies.filter((r) => r.is_staff_reply).length;
              return (
                <button key={t.id} onClick={() => setActiveTicket(t)}
                  className="w-full px-5 py-4 text-left hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-xl mt-0.5 shrink-0">{CATEGORY_ICONS[t.category]}</span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${sm.color}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${sm.dot}`} />{sm.label}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${pm.color}`}>{pm.label}</span>
                          {unread > 0 && (
                            <span className="rounded-full bg-cyan-600 px-2 py-0.5 text-[10px] font-bold text-white">
                              {unread} repl{unread === 1 ? 'y' : 'ies'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-slate-900 truncate">{t.subject}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {t.ticket_number} · {new Date(t.created_at).toLocaleDateString()}
                          {t.resolved_at && ` · Resolved ${new Date(t.resolved_at).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-slate-300 text-lg mt-0.5">›</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
