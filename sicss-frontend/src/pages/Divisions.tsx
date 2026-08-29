import { useState, useEffect } from 'react';
import { divisionService, type Division } from '../services/divisionService';
import { FormModal } from '../components/FormModal';

type Form = { name: string; description: string };
const empty: Form = { name: '', description: '' };

export default function Divisions() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [isOpen, setIsOpen]       = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm]           = useState<Form>(empty);
  const [search, setSearch]       = useState('');
  const [deleteId, setDeleteId]   = useState<number | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await divisionService.getAll();
      setDivisions((Array.isArray(res) ? res : (res as any).data) || []);
    } catch { setError('Failed to load divisions.'); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setEditingId(null); setForm(empty); setError(''); setIsOpen(true); };
  const openEdit = (d: Division) => { setEditingId(d.id); setForm({ name: d.name, description: d.description || '' }); setError(''); setIsOpen(true); };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Division name is required.'); return; }
    setSaving(true); setError('');
    const payload = { name: form.name, description: form.description || null };
    try {
      if (editingId) {
        await divisionService.update(editingId, payload);
        setDivisions((p) => p.map((d) => d.id === editingId ? { ...d, ...payload } : d));
      } else {
        const res = await divisionService.create(payload);
        const created = (res as any).data ?? res;
        setDivisions((p) => [created, ...p]);
      }
      setIsOpen(false);
    } catch { setError('Failed to save division.'); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await divisionService.delete(deleteId);
      setDivisions((p) => p.filter((d) => d.id !== deleteId));
      setDeleteId(null);
    } catch { setError('Failed to delete division. It may have classes attached.'); setDeleteId(null); }
  };

  const filtered = divisions.filter((d) =>
    `${d.name} ${d.description || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Delete confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-950">Delete division?</h3>
            <p className="mt-2 text-sm text-slate-500">This cannot be undone. Classes inside this division may be affected.</p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={confirmDelete} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Academic structure</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Divisions</h1>
          <p className="mt-1 text-sm text-slate-500">Divisions group related classes together (e.g. Primary, Junior High).</p>
        </div>
        <button onClick={openAdd} className="self-start rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 sm:self-auto">
          + Add division
        </button>
      </div>

      {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <input type="search" placeholder="Search divisions…" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field max-w-xs text-sm" />
        </div>
        {loading ? <p className="py-12 text-center text-sm text-slate-500">Loading…</p> : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>{['Name', 'Description', 'Created', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0
                  ? <tr><td colSpan={4} className="py-10 text-center text-slate-400">No divisions found.</td></tr>
                  : filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-semibold text-slate-900">{d.name}</td>
                    <td className="px-5 py-3 text-slate-600">{d.description || '—'}</td>
                    <td className="px-5 py-3 text-slate-400 text-xs">{d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-3">
                        <button onClick={() => openEdit(d)} className="text-xs font-semibold text-cyan-700 hover:underline">Edit</button>
                        <button onClick={() => setDeleteId(d.id)} className="text-xs font-semibold text-rose-600 hover:underline">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">{filtered.length} of {divisions.length}</div>
      </div>

      <FormModal isOpen={isOpen} title={editingId ? 'Edit division' : 'Add division'} onClose={() => setIsOpen(false)} onSubmit={handleSubmit} submitText={editingId ? 'Save changes' : 'Create division'} isLoading={saving}>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Division name <span className="text-rose-500">*</span></label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Primary School, Junior High…" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={3} placeholder="Optional description…" />
          </div>
        </div>
      </FormModal>
    </div>
  );
}
