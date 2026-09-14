import { useState, useEffect } from 'react';
import { subjectService, type Subject } from '../services/subjectService';
import { classService, type Class } from '../services/classService';
import { teacherService, type Teacher } from '../services/teacherService';
import { FormModal } from '../components/FormModal';
import { useAuthStore } from '../store/authStore';
import { Button, Input, Badge, Table, TableHeader, TableBody, TableRow, TableCell, TableHead, LoadingState, EmptyState, Card, CardContent } from '../components/ui';

type FormData = {
  name: string;
  slug: string;
  description: string;
  credits: string;
  order: string;
  is_active: boolean;
  teacher_id: string;
  class_ids: number[];
};

const emptyForm: FormData = {
  name: '',
  slug: '',
  description: '',
  credits: '1',
  order: '0',
  is_active: true,
  teacher_id: '',
  class_ids: [],
};

function toSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function Subjects() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';
  const [subjects, setSubjects]   = useState<Subject[]>([]);
  const [classes, setClasses]     = useState<Class[]>([]);
  const [teachers, setTeachers]   = useState<Teacher[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData]   = useState<FormData>(emptyForm);
  const [search, setSearch]       = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [s, c, t] = await Promise.all([
        subjectService.getAll(),
        classService.getAll(),
        teacherService.getAll(),
      ]);
      setSubjects((s as unknown as Subject[]) || []);
      setClasses((c as unknown as Class[]) || []);
      setTeachers(((t as any).data || t as unknown as Teacher[]) || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load subjects.');
    } finally { setLoading(false); }
  };

  const filtered = subjects.filter((s) =>
    `${s.name}`.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditingId(null); setFormData(emptyForm); setIsModalOpen(true); };
  const openEdit = (s: Subject) => {
    setEditingId(s.id);
    setFormData({
      name:        s.name || '',
      slug:        (s as any).slug || toSlug(s.name),
      description: s.description || '',
      credits:     String(s.credits || 1),
      order:       String((s as any).order || 0),
      is_active:   (s as any).is_active !== false,
      teacher_id:  String(((s as any).teachers?.[0]?.id) ?? ''),
      class_ids:   ((s as any).classes || []).map((c: any) => c.id),
    });
    setIsModalOpen(true);
  };

  const toggleClass = (id: number) => {
    setFormData((f) => ({
      ...f,
      class_ids: f.class_ids.includes(id)
        ? f.class_ids.filter((c) => c !== id)
        : [...f.class_ids, id],
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        slug:       formData.slug || toSlug(formData.name),
        credits:    Number(formData.credits),
        order:      Number(formData.order),
        teacher_id: formData.teacher_id ? Number(formData.teacher_id) : null,
        class_ids:  formData.class_ids,
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

  // Subject teachers only
  const subjectTeachers = teachers.filter((t) => {
    const slug = (t as any).user?.role?.slug || '';
    return slug === 'subject-teacher' || slug === 'teacher' || slug === 'class-teacher' || slug === 'class-sponsor';
  });

  const assignedTeacherName = (s: Subject) => {
    const t = (s as any).teachers?.[0];
    return t ? `${t.first_name} ${t.last_name}` : '—';
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Academic structure</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Subjects</h1>
          <p className="mt-1 text-sm text-slate-500">{subjects.length} subject{subjects.length !== 1 ? 's' : ''} in the system.</p>
        </div>
        {isAdmin && (
          <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white">
            + Add subject
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
          <p className="text-sm text-rose-800 mb-4">{error}</p>
          <Button onClick={load} variant="secondary">Try Again</Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="border-b border-slate-200 px-5 py-4">
            <Input
              type="search"
              placeholder="Search subjects…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>
          {loading ? (
            <LoadingState message="Loading subjects…" />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No subjects found"
              description="Try adjusting your search to find what you're looking for."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Classes</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-semibold text-slate-900">{s.name}</TableCell>
                    <TableCell className="text-slate-600">{assignedTeacherName(s)}</TableCell>
                    <TableCell className="text-slate-600">
                      {((s as any).classes || []).length > 0
                        ? <Badge variant="info">{((s as any).classes || []).length} class{((s as any).classes || []).length !== 1 ? 'es' : ''}</Badge>
                        : <span className="text-slate-400">—</span>}
                    </TableCell>
                    <TableCell className="text-slate-600">{s.credits}</TableCell>
                    <TableCell>
                      <Badge variant={(s as any).is_active !== false ? 'success' : 'default'}>
                        {(s as any).is_active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isAdmin ? (
                        <div className="flex gap-3">
                          <Button onClick={() => openEdit(s)} variant="ghost" className="text-blue-600 hover:text-blue-700 text-xs p-0 h-auto">
                            Edit
                          </Button>
                          <Button onClick={() => handleDelete(s.id)} variant="ghost" className="text-rose-600 hover:text-rose-700 text-xs p-0 h-auto">
                            Delete
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">View only</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-400">
            {filtered.length} of {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
          </div>
        </CardContent>
      </Card>

      <FormModal
        isOpen={isModalOpen}
        title={editingId ? 'Edit subject' : 'Add subject'}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        submitText={editingId ? 'Save changes' : 'Add subject'}
        isLoading={isSubmitting}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          {/* Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name <span className="text-rose-500">*</span></label>
            <input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: toSlug(e.target.value) })}
              className="input-field"
              placeholder="Mathematics"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Slug <span className="text-rose-500">*</span></label>
            <input required value={formData.slug} onChange={field('slug')} className="input-field" placeholder="mathematics" />
          </div>

          {/* Credits */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Credits</label>
            <input type="number" min="1" value={formData.credits} onChange={field('credits')} className="input-field" />
          </div>

          {/* Display order */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Display order</label>
            <input type="number" min="0" value={formData.order} onChange={field('order')} className="input-field" />
          </div>

          {/* Active */}
          <div className="flex items-center gap-3 pt-5">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-slate-700">Active</label>
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <textarea value={formData.description} onChange={field('description')} className="input-field" rows={2} />
          </div>

          {/* Assign teacher */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Assign subject teacher</label>
            <select
              value={formData.teacher_id}
              onChange={field('teacher_id')}
              className="input-field"
            >
              <option value="">No teacher assigned</option>
              {subjectTeachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.first_name} {t.last_name}{(t as any).user?.role?.name ? ` — ${(t as any).user.role.name}` : ''}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">The assigned teacher will submit marks for this subject to the class sponsor.</p>
          </div>

          {/* Assign to classes */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Assign to classes</label>
            {classes.length === 0 ? (
              <p className="text-xs text-slate-400">No classes found. Add classes first.</p>
            ) : (
              <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
                {classes.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600"
                      checked={formData.class_ids.includes(c.id)}
                      onChange={() => toggleClass(c.id)}
                    />
                    <span className="text-sm text-slate-700">
                      {c.name.replace(/\s[A-Z][a-z]*$/, '').trim()}
                    </span>
                  </label>
                ))}
              </div>
            )}
            {formData.class_ids.length > 0 && (
              <p className="mt-1 text-xs text-slate-500">{formData.class_ids.length} class{formData.class_ids.length !== 1 ? 'es' : ''} selected</p>
            )}
          </div>

        </div>
      </FormModal>
    </div>
  );
}
