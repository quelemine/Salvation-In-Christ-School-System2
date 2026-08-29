import { useEffect, useState } from 'react';
import { classService, type Class } from '../services/classService';
import { divisionService, type Division } from '../services/divisionService';
import { FormModal } from '../components/FormModal';

type Form = { division_id: string; name: string; section: string; capacity: string; is_active: boolean };
const empty: Form = { division_id: '', name: '', section: '', capacity: '30', is_active: true };

export default function Classes() {
  const [classes, setClasses]     = useState<Class[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [isOpen, setIsOpen]       = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm]           = useState<Form>(empty);
  const [search, setSearch]       = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [c, d] = await Promise.all([classService.getAll(), divisionService.getAll()]);
      setClasses((c as unknown as Class[]) || []);
      setDivisions((Array.isArray(d) ? d : (d as any).data) || []);
    } catch { setError('Failed to load data.'); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setEditingId(null); setForm(empty); setError(''); setIsOpen(true); };
  const openEdit = (cls: Class) => {
    setEditingId(cls.id);
    setForm({
      division_id: String((cls as any).division_id ?? ''),
      name:        cls.name,
      section:     cls.section || '',
      capacity:    String(cls.capacity || 30),
      is_active:   (cls as any).is_active !== false,
    });
    setError(''); setIsOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Class name is required.'); return; }
    setSaving(true); setError('');
    const payload = {
      division_id: form.division_id ? Number(form.division_id) : undefined,
      name: form.name,
      slug: `${form.name}-${form.section || 'main'}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      section: form.section || null,
      capacity: Number(form.capacity),
      order: 0,
      is_active: form.is_active,
    };
    try {
      if (editingId) {
        const updated = await classService.update(editingId, payload as any);
        setClasses((p) => p.map((c) => c.id === editingId ? (updated as unknown as Class) : c));
      } else {
        const created = await classService.create(payload as any);
        setClasses((p) => [created as unknown as Class, ...p]);
      }
      setIsOpen(false);
    } catch { setError('Failed to save class.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this class? Students assigned to it will become unassigned.')) return;
    try { await classService.delete(id); setClasses((p) => p.filter((c) => c.id !== id)); }
    catch { setError('Failed to delete class.'); }
  };

  const filtered = classes.filter((c) =>
    `${c.name} ${c.section || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const divisionName = (cls: Class) =>
    (cls as any).division?.name || divisions.find((d) => d.id === (cls as any).division_id)?.name || '—';

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Academic structure</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Classes</h1>
          <p className="mt-1 text-sm text-slate-500">{classes.length} class{classes.length !== 1 ? 'es' : ''} configured.</p>
        </div>
        <button onClick={openAdd} className="self-start rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 sm:self-auto">
          + Add class
        </button>
      </div>

      {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <input type="search" placeholder="Search classes…" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field max-w-xs text-sm" />
        </div>
        {loading ? <p className="py-12 text-center text-sm text-slate-500">Loading…</p> : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>{['Class', 'Section', 'Division', 'Capacity', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0
                  ? <tr><td colSpan={6} className="py-10 text-center text-slate-400">No classes found.</td></tr>
                  : filtered.map((cls) => (
                  <tr key={cls.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-semibold text-slate-900">{cls.name}</td>
                    <td className="px-5 py-3 text-slate-600">{cls.section || '—'}</td>
                    <td className="px-5 py-3 text-cyan-700 font-medium">{divisionName(cls)}</td>
                    <td className="px-5 py-3 text-slate-600">{cls.capacity || '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${(cls as any).is_active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                        {(cls as any).is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-3">
                        <button onClick={() => openEdit(cls)} className="text-xs font-semibold text-cyan-700 hover:underline">Edit</button>
                        <button onClick={() => handleDelete(cls.id)} className="text-xs font-semibold text-rose-600 hover:underline">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">{filtered.length} of {classes.length}</div>
      </div>

      <FormModal isOpen={isOpen} title={editingId ? 'Edit class' : 'Add class'} onClose={() => setIsOpen(false)} onSubmit={handleSubmit} submitText={editingId ? 'Save changes' : 'Create class'} isLoading={saving}>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Division</label>
            <select value={form.division_id} onChange={(e) => setForm({ ...form, division_id: e.target.value })} className="input-field">
              <option value="">No division</option>
              {divisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Class name <span className="text-rose-500">*</span></label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Grade 4" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Section</label>
              <input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className="input-field" placeholder="Blue, A, Morning…" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Capacity</label>
              <input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="input-field" />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <input type="checkbox" id="cls_active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4 rounded" />
              <label htmlFor="cls_active" className="text-sm font-medium text-slate-700">Active</label>
            </div>
          </div>
        </div>
      </FormModal>
    </div>
  );
}
