import { useEffect, useState } from 'react';
import api from '../services/api';
import { classService, type Class } from '../services/classService';
import { formatCurrency, type CurrencyCode } from '../utils/currency';
import { useSettingsStore } from '../store/settingsStore';

// ── Types ─────────────────────────────────────────────────────────────────────
type Category = 'tuition' | 'registration' | 'uniform' | 'exam' | 'activity' | 'library' | 'other';

interface StructureItem {
  id?: number;
  label: string;
  amount: string;
  currency: CurrencyCode;
  category: Category;
  is_mandatory: boolean;
  due_date: string;
}

interface Structure {
  id: number;
  name: string;
  academic_year: string;
  class_id: number | null;
  applies_to: 'all' | 'class';
  description: string;
  is_active: boolean;
  total_amount: number;
  class?: { id: number; name: string };
  items: (StructureItem & { id: number })[];
}

const CAT_META: Record<Category, { label: string; color: string }> = {
  tuition:      { label: 'Tuition',      color: 'bg-blue-100 text-blue-800'    },
  registration: { label: 'Registration', color: 'bg-purple-100 text-purple-800' },
  uniform:      { label: 'Uniform',      color: 'bg-cyan-100 text-cyan-800'    },
  exam:         { label: 'Exam',         color: 'bg-amber-100 text-amber-800'   },
  activity:     { label: 'Activity',     color: 'bg-emerald-100 text-emerald-800' },
  library:      { label: 'Library',      color: 'bg-slate-100 text-slate-700'  },
  other:        { label: 'Other',        color: 'bg-gray-100 text-gray-600'    },
};

const newItem = (currency: CurrencyCode): StructureItem => ({
  label: '', amount: '', currency, category: 'tuition', is_mandatory: true, due_date: '',
});

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FeeStructure() {
  const { settings } = useSettingsStore();
  const defaultCurrency = settings.system.currency as CurrencyCode;
  const currentYear = settings.system.academicYear;

  const [structures, setStructures] = useState<Structure[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Structure | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [filterYear, setFilterYear] = useState(currentYear);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: '', academic_year: currentYear, class_id: '',
    applies_to: 'all' as 'all' | 'class', description: '', is_active: true,
    items: [newItem(defaultCurrency)],
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([api.get('/fee-structures'), classService.getAll()]);
      setStructures(sRes.data);
      setClasses((cRes as unknown as Class[]) || []);
    } catch { notify(false, 'Failed to load fee structures.'); }
    finally { setLoading(false); }
  };

  const notify = (ok: boolean, text: string) => {
    setMsg({ ok, text }); setTimeout(() => setMsg(null), 4000);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', academic_year: currentYear, class_id: '', applies_to: 'all', description: '', is_active: true, items: [newItem(defaultCurrency)] });
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (s: Structure) => {
    setEditing(s);
    setForm({
      name: s.name, academic_year: s.academic_year,
      class_id: s.class_id ? String(s.class_id) : '',
      applies_to: s.applies_to, description: s.description || '', is_active: s.is_active,
      items: s.items.map((i) => ({ ...i, amount: String(i.amount), due_date: (i.due_date as any)?.slice?.(0, 10) ?? '' })),
    });
    setFormError('');
    setShowForm(true);
  };

  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, newItem(defaultCurrency)] }));
  const removeItem = (i: number) => setForm((f) => ({ ...f, items: f.items.filter((_, j) => j !== i) }));
  const updateItem = (i: number, patch: Partial<StructureItem>) =>
    setForm((f) => ({ ...f, items: f.items.map((item, j) => j === i ? { ...item, ...patch } : item) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.items.some((i) => !i.label || !i.amount)) {
      setFormError('All fee line items require a label and amount.'); return;
    }
    setSaving(true); setFormError('');
    const payload = {
      ...form,
      class_id: form.class_id ? Number(form.class_id) : null,
      items: form.items.map((i) => ({ ...i, amount: Number(i.amount) })),
    };
    try {
      if (editing) {
        const res = await api.put(`/fee-structures/${editing.id}`, payload);
        setStructures((p) => p.map((s) => (s.id === editing.id ? res.data : s)));
        notify(true, 'Fee structure updated.');
      } else {
        const res = await api.post('/fee-structures', payload);
        setStructures((p) => [res.data, ...p]);
        notify(true, 'Fee structure created.');
      }
      setShowForm(false);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save fee structure.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this fee structure?')) return;
    await api.delete(`/fee-structures/${id}`);
    setStructures((p) => p.filter((s) => s.id !== id));
    if (activeId === id) setActiveId(null);
    notify(true, 'Fee structure deleted.');
  };

  const filtered = structures.filter((s) => !filterYear || s.academic_year === filterYear);
  const activeStructure = activeId ? structures.find((s) => s.id === activeId) : null;

  const totalMandatory = (s: Structure) => s.items.filter((i) => i.is_mandatory).reduce((sum, i) => sum + Number(i.amount), 0);
  const totalOptional  = (s: Structure) => s.items.filter((i) => !i.is_mandatory).reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <div className="space-y-5">
      {/* Compose modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-8">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Finance</p>
                <h2 className="text-lg font-bold text-slate-950">{editing ? 'Edit' : 'New'} fee structure</h2>
              </div>
              <button onClick={() => setShowForm(false)} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 text-xl">×</button>
            </div>

            <form onSubmit={handleSubmit} className="divide-y divide-slate-100">
              <div className="space-y-4 px-6 py-5">
                {formError && <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</p>}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Structure name <span className="text-rose-500">*</span></label>
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="e.g. 2026 Annual School Fees" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Academic year <span className="text-rose-500">*</span></label>
                    <input required value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Applies to</label>
                    <select value={form.applies_to} onChange={(e) => setForm({ ...form, applies_to: e.target.value as any })} className="input-field">
                      <option value="all">All classes</option>
                      <option value="class">Specific class</option>
                    </select>
                  </div>
                  {form.applies_to === 'class' && (
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">Class</label>
                      <select value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })} className="input-field">
                        <option value="">Select class</option>
                        {classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Description</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={2} />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex cursor-pointer items-center gap-2">
                      <div onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                        className={`relative h-6 w-11 rounded-full transition-colors ${form.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </div>
                      <span className="text-sm font-medium text-slate-700">Active</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Line items */}
              <div className="px-6 py-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-950">Fee line items</p>
                  <button type="button" onClick={addItem}
                    className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:border-cyan-400 hover:text-cyan-700">
                    + Add item
                  </button>
                </div>
                {form.items.map((item, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">Label <span className="text-rose-500">*</span></label>
                        <input required value={item.label} onChange={(e) => updateItem(i, { label: e.target.value })} className="input-field text-sm" placeholder="e.g. Tuition Fee" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">Category</label>
                        <select value={item.category} onChange={(e) => updateItem(i, { category: e.target.value as Category })} className="input-field text-sm">
                          {Object.entries(CAT_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">Amount <span className="text-rose-500">*</span></label>
                        <input required type="number" min="0" step="0.01" value={item.amount} onChange={(e) => updateItem(i, { amount: e.target.value })} className="input-field text-sm" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">Currency</label>
                        <select value={item.currency} onChange={(e) => updateItem(i, { currency: e.target.value as CurrencyCode })} className="input-field text-sm">
                          <option value="LRD">LRD</option><option value="USD">USD</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">Due date</label>
                        <input type="date" value={item.due_date} onChange={(e) => updateItem(i, { due_date: e.target.value })} className="input-field text-sm" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input type="checkbox" checked={item.is_mandatory} onChange={(e) => updateItem(i, { is_mandatory: e.target.checked })} className="h-4 w-4 rounded" />
                        <span className="text-xs font-medium text-slate-700">Mandatory</span>
                      </label>
                      {form.items.length > 1 && (
                        <button type="button" onClick={() => removeItem(i)} className="text-xs font-semibold text-rose-500 hover:underline">Remove</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 px-6 py-4">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50">
                  {saving ? 'Saving…' : editing ? 'Save changes' : 'Create structure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Finance</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Fee structure</h1>
          <p className="mt-2 text-sm text-slate-500">Define the complete fee breakdown for each academic year. Use these structures to verify student clearance before printing report cards.</p>
        </div>
        <button onClick={openAdd} className="self-start rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 sm:self-auto">
          + New fee structure
        </button>
      </div>

      {msg && <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${msg.ok ? 'border border-emerald-200 bg-emerald-50 text-emerald-800' : 'border border-rose-200 bg-rose-50 text-rose-700'}`}>{msg.ok ? '✓' : '✕'} {msg.text}</div>}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="input-field w-auto">
          <option value="">All years</option>
          {[...new Set(structures.map((s) => s.academic_year))].sort().reverse().map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <span className="text-xs text-slate-400">{filtered.length} structure{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-5 flex-col lg:flex-row">
        {/* List */}
        <div className="lg:w-80 shrink-0 space-y-3">
          {loading ? <p className="py-8 text-center text-sm text-slate-500">Loading…</p>
            : filtered.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-slate-200 py-14 text-center">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm font-semibold text-slate-600">No fee structures</p>
              <p className="text-xs text-slate-400 mt-1">Create one to define the fee breakdown.</p>
            </div>
          ) : filtered.map((s) => (
            <div key={s.id}
              onClick={() => setActiveId(activeId === s.id ? null : s.id)}
              className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${activeId === s.id ? 'border-slate-950 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-slate-950 truncate">{s.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.academic_year} · {s.applies_to === 'all' ? 'All classes' : s.class?.name || 'Specific class'}</p>
                  <p className="mt-2 text-base font-bold text-emerald-700">
                    {formatCurrency(s.total_amount, (s.items[0]?.currency as CurrencyCode) || 'LRD')}
                  </p>
                  <p className="text-xs text-slate-400">{s.items.length} line item{s.items.length !== 1 ? 's' : ''}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                  {s.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Detail */}
        <div className="flex-1 min-w-0">
          {!activeStructure ? (
            <div className="flex h-full min-h-[300px] items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white">
              <div className="text-center">
                <p className="text-3xl mb-2">📋</p>
                <p className="text-sm font-semibold text-slate-600">Select a structure to view details</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">{activeStructure.name}</h3>
                  <p className="text-sm text-slate-500">
                    {activeStructure.academic_year} · {activeStructure.applies_to === 'all' ? 'All classes' : activeStructure.class?.name}
                    {activeStructure.description && ` · ${activeStructure.description}`}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEdit(activeStructure)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Edit</button>
                  <button onClick={() => handleDelete(activeStructure.id)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50">Delete</button>
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-1 gap-4 border-b border-slate-100 p-5 sm:grid-cols-3">
                {[
                  { label: 'Total fees',         value: formatCurrency(activeStructure.total_amount, (activeStructure.items[0]?.currency as CurrencyCode) || 'LRD'), color: 'text-slate-950' },
                  { label: 'Mandatory total',    value: formatCurrency(totalMandatory(activeStructure), (activeStructure.items[0]?.currency as CurrencyCode) || 'LRD'), color: 'text-rose-700' },
                  { label: 'Optional total',     value: formatCurrency(totalOptional(activeStructure), (activeStructure.items[0]?.currency as CurrencyCode) || 'LRD'), color: 'text-slate-600' },
                ].map((c) => (
                  <div key={c.label} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{c.label}</p>
                    <p className={`mt-1 text-xl font-bold ${c.color}`}>{c.value}</p>
                  </div>
                ))}
              </div>

              {/* Line items */}
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <tr>{['Description', 'Category', 'Amount', 'Currency', 'Due date', 'Required'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeStructure.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-semibold text-slate-900">{item.label}</td>
                        <td className="px-5 py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CAT_META[item.category as Category]?.color}`}>
                            {CAT_META[item.category as Category]?.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-bold text-slate-900">{formatCurrency(Number(item.amount), (item.currency as CurrencyCode) || 'LRD')}</td>
                        <td className="px-5 py-3 font-mono text-xs text-slate-500">{item.currency}</td>
                        <td className="px-5 py-3 text-slate-600">{item.due_date ? String(item.due_date).slice(0, 10) : '—'}</td>
                        <td className="px-5 py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.is_mandatory ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
                            {item.is_mandatory ? 'Required' : 'Optional'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
