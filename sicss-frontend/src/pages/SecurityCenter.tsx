import { useEffect, useState } from 'react';
import { authService } from '../services/authService';
import api from '../services/api';
import type { User } from '../types';

type ResetState = {
  userId: number | null;
  password: string;
  password_confirmation: string;
  show: boolean;
  showConfirm: boolean;
  saving: boolean;
  status: { ok: boolean; msg: string } | null;
};

const emptyReset = (): ResetState => ({
  userId: null, password: '', password_confirmation: '',
  show: false, showConfirm: false, saving: false, status: null,
});

function StrengthBar({ pw }: { pw: string }) {
  if (!pw) return null;
  let s = 0;
  if (pw.length >= 8)           s++;
  if (/[A-Z]/.test(pw))         s++;
  if (/[0-9]/.test(pw))         s++;
  if (/[^A-Za-z0-9]/.test(pw))  s++;
  const colors = ['', 'bg-rose-400', 'bg-amber-400', 'bg-cyan-500', 'bg-emerald-500'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= s ? colors[s] : 'bg-slate-200'}`} />
        ))}
      </div>
      <p className="text-xs text-slate-500">Strength: <span className="font-semibold text-slate-700">{labels[s]}</span></p>
    </div>
  );
}

export default function SecurityCenter() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [globalMsg, setGlobalMsg] = useState<{ ok: boolean; msg: string } | null>(null);
  const [reset, setReset] = useState<ResetState>(emptyReset());
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', email: '', phone: '', is_active: true });
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await authService.users();
      setUsers(data);
    } catch { setGlobalMsg({ ok: false, msg: 'Failed to load users.' }); }
    finally { setLoading(false); }
  };

  const filtered = users.filter((u) =>
    `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  // ── Open reset modal ──────────────────────────────────────────────────────
  const openReset = (userId: number) => {
    setReset({ ...emptyReset(), userId });
  };

  const handleReset = async () => {
    if (!reset.userId) return;
    if (reset.password !== reset.password_confirmation) {
      setReset((r) => ({ ...r, status: { ok: false, msg: 'Passwords do not match.' } })); return;
    }
    if (reset.password.length < 8) {
      setReset((r) => ({ ...r, status: { ok: false, msg: 'Password must be at least 8 characters.' } })); return;
    }
    setReset((r) => ({ ...r, saving: true, status: null }));
    try {
      await api.post(`/users/${reset.userId}/reset-password`, {
        password: reset.password,
        password_confirmation: reset.password_confirmation,
      });
      const u = users.find((x) => x.id === reset.userId);
      setReset({ ...emptyReset(), status: { ok: true, msg: `Password reset for ${u?.email ?? 'user'}.` } });
      setGlobalMsg({ ok: true, msg: `Password for ${u?.email ?? 'user'} was reset successfully.` });
      setTimeout(() => setGlobalMsg(null), 4000);
    } catch (err: any) {
      setReset((r) => ({
        ...r, saving: false,
        status: { ok: false, msg: err.response?.data?.message || 'Failed to reset password.' },
      }));
    }
  };

  // ── Open edit modal ───────────────────────────────────────────────────────
  const openEdit = (u: User) => {
    setEditUser(u);
    setEditForm({
      first_name: u.first_name || '',
      last_name:  u.last_name  || '',
      email:      u.email      || '',
      phone:      u.phone      || '',
      is_active:  u.is_active  !== false,
    });
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    setEditSaving(true);
    try {
      const res = await api.put(`/users/${editUser.id}`, editForm);
      setUsers((prev) => prev.map((u) => (u.id === editUser.id ? res.data : u)));
      setEditUser(null);
      setGlobalMsg({ ok: true, msg: `Account for ${editForm.email} updated.` });
      setTimeout(() => setGlobalMsg(null), 4000);
    } catch (err: any) {
      setGlobalMsg({ ok: false, msg: err.response?.data?.message || 'Failed to update user.' });
    } finally { setEditSaving(false); }
  };

  const roleColor = (slug?: string) =>
    slug === 'admin' ? 'bg-rose-100 text-rose-700'
    : slug === 'teacher' ? 'bg-cyan-100 text-cyan-800'
    : slug?.includes('finance') ? 'bg-emerald-100 text-emerald-800'
    : 'bg-slate-100 text-slate-600';

  return (
    <div className="space-y-5">

      {/* ── Reset password modal ─────────────────────────────── */}
      {reset.userId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-rose-600">Security action</p>
                <h2 className="text-lg font-bold text-slate-950">Reset password</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {users.find((u) => u.id === reset.userId)?.email}
                </p>
              </div>
              <button onClick={() => setReset(emptyReset())}
                className="h-8 w-8 rounded-full text-slate-400 hover:bg-slate-100 text-xl leading-none">×</button>
            </div>

            {reset.status && (
              <div className={`mb-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${
                reset.status.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {reset.status.ok ? '✓' : '✕'} {reset.status.msg}
              </div>
            )}

            {reset.status?.ok ? (
              <button onClick={() => setReset(emptyReset())}
                className="mt-2 w-full rounded-lg bg-slate-950 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700">
                Done
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">New password <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <input
                      type={reset.show ? 'text' : 'password'}
                      value={reset.password}
                      onChange={(e) => setReset((r) => ({ ...r, password: e.target.value }))}
                      className="input-field pr-10"
                      placeholder="Minimum 8 characters"
                    />
                    <button type="button" tabIndex={-1}
                      onClick={() => setReset((r) => ({ ...r, show: !r.show }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm">
                      {reset.show ? '🙈' : '👁'}
                    </button>
                  </div>
                  <StrengthBar pw={reset.password} />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Confirm password <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <input
                      type={reset.showConfirm ? 'text' : 'password'}
                      value={reset.password_confirmation}
                      onChange={(e) => setReset((r) => ({ ...r, password_confirmation: e.target.value }))}
                      className={`input-field pr-10 ${
                        reset.password_confirmation && reset.password !== reset.password_confirmation
                          ? 'border-rose-400 bg-rose-50' : ''
                      }`}
                      placeholder="Re-enter new password"
                    />
                    <button type="button" tabIndex={-1}
                      onClick={() => setReset((r) => ({ ...r, showConfirm: !r.showConfirm }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm">
                      {reset.showConfirm ? '🙈' : '👁'}
                    </button>
                  </div>
                  {reset.password_confirmation && reset.password !== reset.password_confirmation && (
                    <p className="mt-1 text-xs text-rose-600">Passwords do not match.</p>
                  )}
                </div>

                <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                  ⚠️ The user will need to use this new password on their next login. Notify them of the change.
                </div>

                <div className="flex justify-end gap-3 pt-1">
                  <button onClick={() => setReset(emptyReset())}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                    Cancel
                  </button>
                  <button onClick={handleReset} disabled={reset.saving}
                    className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">
                    {reset.saving ? 'Resetting…' : 'Reset password'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Edit user modal ──────────────────────────────────── */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Edit account</p>
                <h2 className="text-lg font-bold text-slate-950">{editUser.first_name} {editUser.last_name}</h2>
              </div>
              <button onClick={() => setEditUser(null)}
                className="h-8 w-8 rounded-full text-slate-400 hover:bg-slate-100 text-xl leading-none">×</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {([['first_name', 'First name'], ['last_name', 'Last name']] as [keyof typeof editForm, string][]).map(([k, l]) => (
                  <div key={k}>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">{l}</label>
                    <input value={editForm[k] as string} onChange={(e) => setEditForm({ ...editForm, [k]: e.target.value })}
                      className="input-field" />
                  </div>
                ))}
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Email</label>
                  <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="input-field" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Phone</label>
                  <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="input-field" />
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-3">
                <div
                  onClick={() => setEditForm((f) => ({ ...f, is_active: !f.is_active }))}
                  className={`relative h-6 w-11 rounded-full transition-colors ${editForm.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${editForm.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm font-medium text-slate-700">Account active</span>
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setEditUser(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button onClick={handleEditSave} disabled={editSaving}
                  className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50">
                  {editSaving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Page header ─────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Administration</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Security center</h1>
        <p className="mt-2 text-sm text-slate-500">
          Reset user passwords, update account details, and manage access. Changes are logged in the activity trail.
        </p>
      </div>

      {globalMsg && (
        <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${
          globalMsg.ok ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                       : 'border border-rose-200 bg-rose-50 text-rose-700'
        }`}>
          {globalMsg.ok ? '✓' : '✕'} {globalMsg.msg}
        </div>
      )}

      {/* Info banner */}
      <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-800">
        <span className="text-lg shrink-0">🔒</span>
        <p>Only administrators can reset other users&apos; passwords. All password resets are recorded in the <strong>Activity logs</strong>. After resetting a password, notify the user immediately.</p>
      </div>

      {/* User table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold text-slate-950">All user accounts ({users.length})</p>
          <input type="search" placeholder="Search users…" value={search}
            onChange={(e) => setSearch(e.target.value)} className="input-field max-w-xs text-sm" />
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-slate-500">Loading users…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  {['User', 'Email', 'Role', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="py-10 text-center text-slate-400">No users found.</td></tr>
                ) : filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                          {u.first_name?.charAt(0)}{u.last_name?.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-900">{u.first_name} {u.last_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${roleColor(u.role?.slug)}`}>
                        {u.role?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        u.is_active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {u.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-3">
                        <button onClick={() => openEdit(u)}
                          className="text-xs font-semibold text-cyan-700 hover:underline">
                          Edit
                        </button>
                        <button onClick={() => openReset(u.id)}
                          className="text-xs font-semibold text-rose-600 hover:underline">
                          Reset password
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
          {filtered.length} of {users.length} account{users.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
