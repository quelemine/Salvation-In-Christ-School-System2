import { useEffect, useState } from 'react';
import api from '../services/api';
import { classService, type Class } from '../services/classService';
import { useSettingsStore } from '../store/settingsStore';

interface StudentRow {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  class?: { id: number; name: string };
  fees_cleared: boolean;
  clearance_academic_year: string | null;
  cleared_at: string | null;
  is_cleared: boolean;
  status: string;
}

export default function FeeClearance() {
  const { settings } = useSettingsStore();
  const currentYear = settings.system.academicYear;

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [year, setYear] = useState(currentYear);
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => { load(); }, [year, filterClass]);

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([
        api.get('/student-clearances', { params: { academic_year: year, class_id: filterClass || undefined } }),
        classService.getAll(),
      ]);
      setStudents(sRes.data);
      setClasses((cRes as unknown as Class[]) || []);
    } catch { notify(false, 'Failed to load clearance data.'); }
    finally { setLoading(false); }
  };

  const notify = (ok: boolean, text: string) => { setMsg({ ok, text }); setTimeout(() => setMsg(null), 4000); };

  const toggle = async (student: StudentRow) => {
    setSaving((p) => ({ ...p, [student.id]: true }));
    try {
      const res = await api.post(`/students/${student.id}/clearance`, {
        fees_cleared: !student.is_cleared,
        clearance_academic_year: year,
      });
      const updated = res.data.student;
      setStudents((p) => p.map((s) => s.id === student.id
        ? { ...s, fees_cleared: updated.fees_cleared, clearance_academic_year: updated.clearance_academic_year, cleared_at: updated.cleared_at, is_cleared: updated.fees_cleared && updated.clearance_academic_year === year }
        : s
      ));
      notify(true, `${student.first_name} ${student.last_name} ${!student.is_cleared ? 'marked as cleared' : 'clearance revoked'}.`);
    } catch { notify(false, 'Failed to update clearance.'); }
    finally { setSaving((p) => ({ ...p, [student.id]: false })); }
  };

  const clearAll = async () => {
    if (!confirm(`Mark ALL displayed students as fee-cleared for ${year}?`)) return;
    const pending = filtered.filter((s) => !s.is_cleared);
    for (const s of pending) await toggle(s);
    notify(true, `${pending.length} student(s) marked as cleared.`);
  };

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !search || `${s.first_name} ${s.last_name} ${s.student_id}`.toLowerCase().includes(q);
    const matchStatus = !filterStatus
      || (filterStatus === 'cleared' && s.is_cleared)
      || (filterStatus === 'outstanding' && !s.is_cleared);
    return matchSearch && matchStatus;
  });

  const clearedCount    = students.filter((s) => s.is_cleared).length;
  const outstandingCount = students.length - clearedCount;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Finance</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Fee clearance</h1>
          <p className="mt-2 text-sm text-slate-500">Mark students as fee-cleared. Only cleared students can print or download their report cards.</p>
        </div>
        <button onClick={clearAll} disabled={filtered.every((s) => s.is_cleared)}
          className="self-start rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-40 sm:self-auto">
          ✓ Clear all visible
        </button>
      </div>

      {msg && <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${msg.ok ? 'border border-emerald-200 bg-emerald-50 text-emerald-800' : 'border border-rose-200 bg-rose-50 text-rose-700'}`}>{msg.ok ? '✓' : '✕'} {msg.text}</div>}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total students',  value: students.length,    color: 'text-slate-950' },
          { label: 'Cleared',         value: clearedCount,       color: 'text-emerald-700' },
          { label: 'Outstanding',     value: outstandingCount,   color: 'text-rose-600' },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{c.label}</p>
            <p className={`mt-2 text-3xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap gap-3 border-b border-slate-100 px-5 py-4">
          <input type="search" placeholder="Search students…" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field max-w-xs text-sm" />
          <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="input-field w-auto text-sm">
            <option value="">All classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field w-auto text-sm">
            <option value="">All statuses</option>
            <option value="cleared">Cleared</option>
            <option value="outstanding">Outstanding</option>
          </select>
          <input value={year} onChange={(e) => setYear(e.target.value)} className="input-field w-28 text-sm" placeholder="Year" />
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-slate-500">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>{['Student', 'ID', 'Class', 'Status', 'Cleared at', 'Clearance'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-slate-400">No students found.</td></tr>
                ) : filtered.map((s) => (
                  <tr key={s.id} className={`hover:bg-slate-50 ${!s.is_cleared ? 'border-l-2 border-rose-400' : ''}`}>
                    <td className="px-5 py-3 font-semibold text-slate-900">{s.first_name} {s.last_name}</td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{s.student_id}</td>
                    <td className="px-5 py-3 text-slate-600">{s.class?.name || '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                        s.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>{s.status}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs">
                      {s.cleared_at ? new Date(s.cleared_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => toggle(s)}
                        disabled={saving[s.id]}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                          s.is_cleared
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-rose-50 hover:text-rose-700'
                            : 'bg-rose-100 text-rose-700 hover:bg-emerald-50 hover:text-emerald-800'
                        }`}
                      >
                        {saving[s.id] ? '…' : s.is_cleared ? '✓ Cleared — Revoke' : '✕ Outstanding — Clear'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
          {filtered.length} of {students.length} student{students.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
