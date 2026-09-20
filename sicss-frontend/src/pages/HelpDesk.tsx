import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Button, Input, Select, Badge } from '../components/ui';

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
const STATUS_META: Record<TicketStatus, { label: string; badgeVariant: 'success' | 'warning' | 'default'; dot: string }> = {
  open:        { label: 'Open',        badgeVariant: 'success', dot: 'bg-blue-500'    },
  in_progress: { label: 'In progress', badgeVariant: 'warning', dot: 'bg-amber-500'   },
  resolved:    { label: 'Resolved',    badgeVariant: 'success', dot: 'bg-emerald-500' },
  closed:      { label: 'Closed',      badgeVariant: 'default', dot: 'bg-slate-400'   },
};
const PRIORITY_META: Record<TicketPriority, { label: string; badgeVariant: 'default' | 'success' | 'warning' | 'danger' }> = {
  low:    { label: 'Low',    badgeVariant: 'default'  },
  medium: { label: 'Medium', badgeVariant: 'success'   },
  high:   { label: 'High',   badgeVariant: 'warning' },
  urgent: { label: 'Urgent', badgeVariant: 'danger'   },
};
const CATEGORY_ICONS: Record<TicketCategory, string> = {
  account: '👤', academic: '🎓', finance: '💰', technical: '🔧', other: '💬',
};

// ── New ticket form ────────────────────────────────────────────────────────────
function NewTicketForm({ onCreated }: { onCreated: (t: Ticket) => void }) {
  const { user } = useAuthStore();
  const isParent = user?.role?.slug === 'parent';
  const isVPI = user?.role?.slug === 'vice-principal-instruction';
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    subject: '', description: '',
    category: 'other' as TicketCategory,
    priority: 'medium' as TicketPriority,
    assigned_to: '' as 'proprietor' | 'proprietress' | 'principal' | 'vice-principal-instruction' | '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) {
      setError('Subject and description are required.'); return;
    }
    if ((isParent || isVPI) && !form.assigned_to) {
      setError('Please select a recipient.'); return;
    }
    setSaving(true); setError('');
    try {
      const res = await api.post('/helpdesk/tickets', form);
      onCreated(res.data);
      setForm({ subject: '', description: '', category: 'other', priority: 'medium', assigned_to: '' });
      setOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit ticket.');
    } finally { setSaving(false); }
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="ghost" className="w-full border-2 border-dashed py-5">
        + Submit a new support ticket
      </Button>
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
        <Input label="Subject" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Briefly describe your issue…" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Select
            label="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as TicketCategory })}
            options={(Object.entries(CATEGORY_ICONS) as [TicketCategory, string][]).map(([k, icon]) => ({ value: k, label: `${icon} ${k.charAt(0).toUpperCase() + k.slice(1)}` }))}
          />
        </div>
        <div>
          <Select
            label="Priority"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value as TicketPriority })}
            options={(Object.entries(PRIORITY_META) as [TicketPriority, any][]).map(([k, v]) => ({ value: k, label: v.label }))}
          />
        </div>
      </div>

      {(isParent || isVPI) && (
        <div>
          <Select
            label="Send message to"
            required
            value={form.assigned_to}
            onChange={(e) => setForm({ ...form, assigned_to: e.target.value as any })}
            options={[
              { value: '', label: 'Select recipient...' },
              { value: 'proprietor', label: 'Proprietor' },
              { value: 'proprietress', label: 'Proprietress' },
              { value: 'principal', label: 'Principal' },
              ...(isParent ? [{ value: 'vice-principal-instruction', label: 'Vice Principal Instruction' }] : [])
            ]}
          />
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Description <span className="text-rose-500">*</span></label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="input-field" rows={5}
          placeholder="Describe your issue in detail. Include steps to reproduce if it's a technical problem…" />
        <p className="mt-1 text-xs text-slate-400">{form.description.length} characters</p>
      </div>

      <div className="flex justify-end gap-3 pt-1">
        <Button type="button" onClick={() => setOpen(false)} variant="secondary">Cancel</Button>
        <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
          {saving ? 'Submitting…' : '🎫 Submit ticket'}
        </Button>
      </div>
    </form>
  );
}

// ── Main Help Desk page ────────────────────────────────────────────────────────
export default function HelpDesk() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
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

  const filtered = filterStatus ? tickets.filter((t) => t.status === filterStatus) : tickets;

  const counts = {
    open:        tickets.filter((t) => t.status === 'open').length,
    in_progress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved:    tickets.filter((t) => t.status === 'resolved').length,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Support</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Help desk</h1>
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <p className="text-sm font-bold text-slate-900">My tickets ({tickets.length})</p>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: '', label: 'All statuses' },
              ...(Object.entries(STATUS_META) as [TicketStatus, any][]).map(([k, v]) => ({ value: k, label: v.label }))
            ]}
            className="w-auto text-sm"
          />
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
              const sm = STATUS_META[t.status as keyof typeof STATUS_META] || { label: t.status || 'Unknown', badgeVariant: 'default' as const, dot: 'bg-slate-400' };
              const pm = PRIORITY_META[t.priority as keyof typeof PRIORITY_META] || { label: t.priority || 'Unknown', badgeVariant: 'default' as const };
              const categoryIcon = CATEGORY_ICONS[t.category as keyof typeof CATEGORY_ICONS] || '💬';
              const unread = t.replies.filter((r) => r.is_staff_reply).length;
              return (
                <button key={t.id}
                  className="w-full px-5 py-4 text-left hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-xl mt-0.5 shrink-0">{categoryIcon}</span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <Badge variant={sm.badgeVariant}>
                            {sm.label}
                          </Badge>
                          <Badge variant={pm.badgeVariant}>
                            {pm.label}
                          </Badge>
                          {unread > 0 && (
                            <Badge variant="success">
                              {unread} repl{unread === 1 ? 'y' : 'ies'}
                            </Badge>
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
