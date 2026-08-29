import { useEffect, useState } from 'react';
import api from '../services/api';
import { authService } from '../services/authService';
import type { User } from '../types';

// ── Types ─────────────────────────────────────────────────────────────────────
type Priority = 'normal' | 'important' | 'urgent';
type Category = 'general' | 'academic' | 'finance' | 'event' | 'emergency';

interface Announcement {
  id: number;
  title: string;
  body: string;
  priority: Priority;
  category: Category;
  audience: string;        // 'all' | '1,2,5'
  is_active: boolean;
  publish_at: string | null;
  expires_at: string | null;
  created_at: string;
  read_count?: number;
  author?: { first_name: string; last_name: string; email: string };
}

// ── Constants ─────────────────────────────────────────────────────────────────
const PRIORITY_META: Record<Priority, { label: string; color: string; dot: string }> = {
  normal:    { label: 'Normal',    color: 'bg-slate-100 text-slate-700',    dot: 'bg-slate-400'    },
  important: { label: 'Important', color: 'bg-amber-100 text-amber-800',   dot: 'bg-amber-500'    },
  urgent:    { label: 'Urgent',    color: 'bg-rose-100 text-rose-700',     dot: 'bg-rose-500'     },
};
const CATEGORY_META: Record<Category, { label: string; icon: string }> = {
  general:   { label: 'General',   icon: '📢' },
  academic:  { label: 'Academic',  icon: '🎓' },
  finance:   { label: 'Finance',   icon: '💰' },
  event:     { label: 'Event',     icon: '📅' },
  emergency: { label: 'Emergency', icon: '🚨' },
};

// ── Compose/Edit modal ────────────────────────────────────────────────────────
function ComposeModal({
  initial, users, onSave, onClose,
}: {
  initial?: Announcement;
  users: User[];
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
}) {
  const existing = initial;
  const preSelectedIds = existing
    ? (existing.audience === 'all' ? [] : existing.audience.split(',').map(Number))
    : [];

  const [form, setForm] = useState({
    title:        existing?.title        ?? '',
    body:         existing?.body         ?? '',
    priority:     (existing?.priority   ?? 'normal') as Priority,
    category:     (existing?.category   ?? 'general') as Category,
    audience:     (existing?.audience === 'all' || !existing) ? 'all' : 'specific',
    selectedUsers: preSelectedIds,
    publish_at:   existing?.publish_at?.slice(0, 16) ?? '',
    expires_at:   existing?.expires_at?.slice(0, 16) ?? '',
    is_active:    existing?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const filteredUsers = users.filter((u) =>
    `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(userSearch.toLowerCase())
  );

  const toggleUser = (id: number) =>
    setForm((f) => ({
      ...f,
      selectedUsers: f.selectedUsers.includes(id)
        ? f.selectedUsers.filter((x) => x !== id)
        : [...f.selectedUsers, id],
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required.'); return; }
    if (!form.body.trim())  { setError('Message body is required.'); return; }
    if (form.audience === 'specific' && form.selectedUsers.length === 0) {
      setError('Select at least one recipient.'); return;
    }
    setSaving(true); setError('');
    const payload = {
      title:      form.title,
      body:       form.body,
      priority:   form.priority,
      category:   form.category,
      audience:   form.audience === 'all' ? 'all' : form.selectedUsers.join(','),
      publish_at: form.publish_at || null,
      expires_at: form.expires_at || null,
      is_active:  form.is_active,
    };
    try { await onSave(payload); onClose(); }
    catch (err: any) { setError(err.response?.data?.message || 'Failed to save.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-8">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">
              {existing ? 'Edit' : 'New'} announcement
            </p>
            <h2 className="text-lg font-bold text-slate-950">
              {existing ? 'Edit announcement' : 'Compose announcement'}
            </h2>
          </div>
          <button onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="divide-y divide-slate-100">
          <div className="space-y-4 px-6 py-5">
            {error && (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
            )}

            {/* Title */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Title <span className="text-rose-500">*</span></label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input-field" placeholder="Announcement title…" />
            </div>

            {/* Priority + Category row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Priority</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
                  className="input-field">
                  {Object.entries(PRIORITY_META).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                  className="input-field">
                  {Object.entries(CATEGORY_META).map(([k, v]) => (
                    <option key={k} value={k}>{v.icon} {v.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Body */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Message <span className="text-rose-500">*</span></label>
              <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
                className="input-field" rows={5} placeholder="Write your announcement here…" />
              <p className="mt-1 text-xs text-slate-400">{form.body.length} characters</p>
            </div>
          </div>

          {/* Audience */}
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm font-bold text-slate-950">Recipients</p>
            <div className="flex gap-3">
              {[
                { value: 'all',      label: '📣 Everyone',         desc: 'All users see this' },
                { value: 'specific', label: '👥 Specific users',    desc: 'Choose recipients' },
              ].map((opt) => (
                <label key={opt.value}
                  className={`flex flex-1 cursor-pointer items-start gap-3 rounded-xl border-2 p-3.5 transition-all ${
                    form.audience === opt.value ? 'border-slate-950 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                  <input type="radio" name="audience" value={opt.value}
                    checked={form.audience === opt.value}
                    onChange={() => setForm({ ...form, audience: opt.value })}
                    className="mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{opt.label}</p>
                    <p className="text-xs text-slate-500">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* User picker */}
            {form.audience === 'specific' && (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <input type="search" placeholder="Search users…" value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="input-field text-sm" />
                  <p className="mt-2 text-xs text-slate-400">
                    {form.selectedUsers.length} selected
                  </p>
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <label key={u.id}
                      className={`flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-slate-50 ${
                        form.selectedUsers.includes(u.id) ? 'bg-cyan-50' : ''
                      }`}>
                      <input type="checkbox" checked={form.selectedUsers.includes(u.id)}
                        onChange={() => toggleUser(u.id)}
                        className="h-4 w-4 rounded border-slate-300" />
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                        {u.first_name?.charAt(0)}{u.last_name?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{u.first_name} {u.last_name}</p>
                        <p className="text-xs text-slate-400 truncate">{u.email} · {u.role?.name}</p>
                      </div>
                    </label>
                  ))}
                  {filteredUsers.length === 0 && (
                    <p className="py-6 text-center text-sm text-slate-400">No users found.</p>
                  )}
                </div>
                {form.selectedUsers.length > 0 && (
                  <div className="border-t border-slate-100 bg-slate-50 px-4 py-2">
                    <button type="button" onClick={() => setForm({ ...form, selectedUsers: [] })}
                      className="text-xs text-rose-500 hover:underline">Clear selection</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Schedule + options */}
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm font-bold text-slate-950">Schedule & options</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Publish at <span className="text-slate-400 font-normal">(leave blank = immediately)</span>
                </label>
                <input type="datetime-local" value={form.publish_at}
                  onChange={(e) => setForm({ ...form, publish_at: e.target.value })}
                  className="input-field" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Expires at <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input type="datetime-local" value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                  className="input-field" />
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-3">
              <div onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                className={`relative h-6 w-11 rounded-full transition-colors ${form.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm font-medium text-slate-700">Active (visible to recipients)</span>
            </label>
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-3 px-6 py-4">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50">
              {saving ? 'Sending…' : existing ? 'Save changes' : '📢 Send announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [editing, setEditing] = useState<Announcement | undefined>();
  const [filterPriority, setFilterPriority] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [annRes, userRes] = await Promise.all([
        api.get('/announcements'),
        authService.users(),
      ]);
      setAnnouncements(annRes.data);
      setUsers(userRes);
    } catch { notify(false, 'Failed to load announcements.'); }
    finally { setLoading(false); }
  };

  const notify = (ok: boolean, text: string) => {
    setMessage({ ok, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleCreate = async (payload: any) => {
    const res = await api.post('/announcements', payload);
    setAnnouncements((p) => [res.data, ...p]);
    notify(true, 'Announcement published successfully.');
  };

  const handleUpdate = async (payload: any) => {
    if (!editing) return;
    const res = await api.put(`/announcements/${editing.id}`, payload);
    setAnnouncements((p) => p.map((a) => (a.id === editing.id ? res.data : a)));
    notify(true, 'Announcement updated.');
    setEditing(undefined);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this announcement permanently?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements((p) => p.filter((a) => a.id !== id));
      notify(true, 'Announcement deleted.');
    } catch { notify(false, 'Failed to delete.'); }
  };

  const handleToggleActive = async (ann: Announcement) => {
    const res = await api.put(`/announcements/${ann.id}`, { is_active: !ann.is_active });
    setAnnouncements((p) => p.map((a) => (a.id === ann.id ? res.data : a)));
  };

  const filtered = announcements.filter((a) => {
    if (filterPriority && a.priority !== filterPriority) return false;
    if (filterActive === 'active' && !a.is_active) return false;
    if (filterActive === 'inactive' && a.is_active) return false;
    return true;
  });

  const audienceLabel = (audience: string) => {
    if (audience === 'all') return '📣 Everyone';
    const ids = audience.split(',').map(Number);
    if (ids.length <= 2) {
      return ids.map((id) => {
        const u = users.find((x) => x.id === id);
        return u ? `${u.first_name} ${u.last_name}` : `#${id}`;
      }).join(', ');
    }
    return `${ids.length} users`;
  };

  const stats = {
    total:    announcements.length,
    active:   announcements.filter((a) => a.is_active).length,
    urgent:   announcements.filter((a) => a.priority === 'urgent' && a.is_active).length,
  };

  return (
    <div className="space-y-5">
      {showCompose && (
        <ComposeModal users={users} onSave={handleCreate} onClose={() => setShowCompose(false)} />
      )}
      {editing && (
        <ComposeModal initial={editing} users={users} onSave={handleUpdate} onClose={() => setEditing(undefined)} />
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Communications</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Announcements</h1>
          <p className="mt-2 text-sm text-slate-500">
            Send messages to everyone or specific users. Active announcements appear on each user's dashboard.
          </p>
        </div>
        <button onClick={() => setShowCompose(true)}
          className="self-start rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 shadow-sm sm:self-auto">
          📢 New announcement
        </button>
      </div>

      {/* Status message */}
      {message && (
        <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${
          message.ok ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                     : 'border border-rose-200 bg-rose-50 text-rose-700'
        }`}>
          {message.ok ? '✓' : '✕'} {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total announcements', value: stats.total, color: 'text-slate-950' },
          { label: 'Active now',          value: stats.active, color: 'text-emerald-700' },
          { label: 'Urgent / active',     value: stats.urgent, color: 'text-rose-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{s.label}</p>
            <p className={`mt-2 text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters + table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
            className="input-field w-auto text-sm">
            <option value="">All priorities</option>
            {Object.entries(PRIORITY_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select value={filterActive} onChange={(e) => setFilterActive(e.target.value)}
            className="input-field w-auto text-sm">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <span className="ml-auto text-xs text-slate-400">{filtered.length} announcement{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-slate-500">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-3xl">📢</p>
            <p className="mt-3 text-sm font-semibold text-slate-700">No announcements yet</p>
            <p className="mt-1 text-xs text-slate-400">Click New announcement to send your first message.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((ann) => {
              const pm = PRIORITY_META[ann.priority];
              const cm = CATEGORY_META[ann.category];
              const isExpired = ann.expires_at && new Date(ann.expires_at) < new Date();
              return (
                <div key={ann.id} className={`px-5 py-5 transition-colors hover:bg-slate-50 ${!ann.is_active ? 'opacity-60' : ''}`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    {/* Left: meta + content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-base">{cm.icon}</span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${pm.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${pm.dot}`} />
                          {pm.label}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 capitalize">
                          {cm.label}
                        </span>
                        {!ann.is_active && (
                          <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-500">Inactive</span>
                        )}
                        {isExpired && (
                          <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-600">Expired</span>
                        )}
                        {ann.publish_at && new Date(ann.publish_at) > new Date() && (
                          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                            Scheduled: {new Date(ann.publish_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-950 truncate">{ann.title}</h3>
                      <p className="mt-1 text-sm text-slate-600 line-clamp-2">{ann.body}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span>To: <strong className="text-slate-600">{audienceLabel(ann.audience)}</strong></span>
                        <span>·</span>
                        <span>{ann.read_count ?? 0} read{(ann.read_count ?? 0) !== 1 ? 's' : ''}</span>
                        <span>·</span>
                        <span>By {ann.author ? `${ann.author.first_name} ${ann.author.last_name}` : '—'}</span>
                        <span>·</span>
                        <span>{new Date(ann.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {/* Right: actions */}
                    <div className="flex shrink-0 items-center gap-2 sm:ml-4">
                      <button onClick={() => handleToggleActive(ann)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          ann.is_active
                            ? 'border-slate-300 text-slate-600 hover:bg-slate-50'
                            : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                        }`}>
                        {ann.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => setEditing(ann)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(ann.id)}
                        className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
