import { useState, useEffect } from 'react';
import { subjectService, type Subject } from '../services/subjectService';
import { FormModal } from '../components/FormModal';
import { useAuthStore } from '../store/authStore';

type FormData = {
  code: string;
  name: string;
  slug: string;
  description: string;
  credits: string;
  order: string;
  is_active: boolean;
};

const emptyForm: FormData = {
  code: '',
  name: '',
  slug: '',
  description: '',
  credits: '1',
  order: '0',
  is_active: true,
};

function toSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function Subjects() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await subjectService.getAll();
      setSubjects((res as unknown as Subject[]) || []);
    } catch { setError('Failed to load subjects.'); }
    finally { setLoading(false); }
  };

  const filtered = subjects.filter((s) =>
    `${s.name} ${s.code}`.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditingId(null); setFormData(emptyForm); setIsModalOpen(true); };
  const openEdit = (s: Subject) => {
    setEditingId(s.id);
    setFormData({
      code: s.code || '',
      name: s.name || '',
      slug: (s as any).slug || toSlug(s.name),
      description: s.description || '',
      credits: String(s.credits || 1),
      order: String((s as any).order || 0),
      is_active: (s as any).is_active !== false,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        slug: formData.slug || toSlug(formData.name),
        credits: Number(formData.credits),
        order: Number(formData.order),
      };
      if (editingId) {
        const updated = await subjectService.update(editingId, payload as any);
        setSubjects((c) => c.map((s) => (s.id === editingId ? (updated as any) : s)));
      } else {
        const created = await subjectService.create(payload as any);
        setSubjects((c) => [...c, created as any]);
      }
      setIsModalOpen(false);
    } catch { setError('Failed to save subject.'); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this subject?')) return;
    try {
      await subjectService.delete(id);
      setSubjects((c) => c.filter((s) => s.id !== id));
    } catch { setError('Failed to delete subject.'); }
  };

  const field = (key: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setFormData({ ...formData, [key]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Academic structure</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Subjects</h1>
        </div>
        {isAdmin && (
          <button onClick={openAdd} className="self-start rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 sm:self-auto">
            + Add subject
          </button>
        )}
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <input
            type="search"
            placeholder="Search subjects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field max-w-xs"
          />
        </div>
        {loading ? (
          <p className="py-12 text-center text-sm text-slate-500">Loading subjects…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  {['Code', 'Name', 'Credits', 'Order', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-slate-400">No subjects found.</td></tr>
                ) : filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-cyan-700">{s.code}</td>
                    <td className="px-5 py-3 font-semibold text-slate-900">{s.name}</td>
                    <td className="px-5 py-3 text-slate-600">{s.credits}</td>
                    <td className="px-5 py-3 text-slate-600">{(s as any).order ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        (s as any).is_active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {(s as any).is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {isAdmin ? (
                        <div className="flex gap-3">
                          <button onClick={() => openEdit(s)} className="text-xs font-semibold text-cyan-700 hover:underline">Edit</button>
                          <button onClick={() => handleDelete(s.id)} className="text-xs font-semibold text-rose-600 hover:underline">Delete</button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">View only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
          {filtered.length} of {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
        </div>
      </div>

      <FormModal isOpen={isModalOpen} title={editingId ? 'Edit subject' : 'Add subject'} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit} submitText={editingId ? 'Save changes' : 'Add subject'} isLoading={isSubmitting}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Code <span className="text-rose-500">*</span></label>
            <input required value={formData.code} onChange={field('code')} className="input-field" placeholder="MATH-101" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name <span className="text-rose-500">*</span></label>
            <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: toSlug(e.target.value) })} className="input-field" placeholder="Mathematics" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Slug <span className="text-rose-500">*</span></label>
            <input required value={formData.slug} onChange={field('slug')} className="input-field" placeholder="mathematics" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Credits</label>
            <input type="number" min="1" value={formData.credits} onChange={field('credits')} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Display order</label>
            <input type="number" min="0" value={formData.order} onChange={field('order')} className="input-field" />
          </div>
          <div className="flex items-center gap-3 pt-5">
            <input type="checkbox" id="is_active" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-cyan-600" />
            <label htmlFor="is_active" className="text-sm font-medium text-slate-700">Active</label>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <textarea value={formData.description} onChange={field('description')} className="input-field" rows={3} />
          </div>
        </div>
      </FormModal>
    </div>
  );
}
