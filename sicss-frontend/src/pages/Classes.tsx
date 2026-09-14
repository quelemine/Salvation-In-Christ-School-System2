import { useEffect, useState } from 'react';
import { classService, type Class } from '../services/classService';
import { divisionService, type Division } from '../services/divisionService';
import { subjectService, type Subject } from '../services/subjectService';
import { teacherService, type Teacher } from '../services/teacherService';
import { FormModal } from '../components/FormModal';
import { useAuthStore } from '../store/authStore';
import { Button, Input, Badge, Table, TableHeader, TableBody, TableRow, TableCell, TableHead, LoadingState, EmptyState, Card, CardContent } from '../components/ui';

type Form = {
  division_id: string;
  name: string;
  capacity: string;
  is_active: boolean;
  sponsor_teacher_id: string;
  subject_ids: number[];
};

const empty: Form = {
  division_id: '',
  name: '',
  capacity: '30',
  is_active: true,
  sponsor_teacher_id: '',
  subject_ids: [],
};

// Suggested class names based on division description patterns
const getClassSuggestions = (divisionName: string, description: string): string[] => {
  const lowerDesc = description.toLowerCase();
  const lowerName = divisionName.toLowerCase();

  if (lowerName.includes('nursery division') || lowerDesc.includes('nursery division')) {
    return ['Nursery 1', 'Nursery 2', 'Nursery 3'];
  }
  if (lowerName.includes('kindergarten division') || lowerDesc.includes('kindergarten division')) {
    return ['ABC', 'K1', 'K2', 'Nursery 1', 'Nursery 2'];
  }
  if (lowerName.includes('elementary division') || lowerDesc.includes('elementary division') || lowerName.includes('primary division') || lowerDesc.includes('primary division')) {
    return ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];
  }
  if (lowerName.includes('junior high school') || lowerDesc.includes('junior high school') || lowerName.includes('junior high') || lowerDesc.includes('junior high') || lowerName.includes('middle school') || lowerDesc.includes('middle school')) {
    return ['Grade 7', 'Grade 8', 'Grade 9'];
  }
  return [];
};

export default function Classes() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';
  const [classes, setClasses]     = useState<Class[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [subjects, setSubjects]   = useState<Subject[]>([]);
  const [teachers, setTeachers]   = useState<Teacher[]>([]);
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
    setError('');
    try {
      const [c, d, s, t] = await Promise.all([
        classService.getAll(),
        divisionService.getAll(),
        subjectService.getAll(),
        teacherService.getAll(),
      ]);
      setClasses((c as unknown as Class[]) || []);
      setDivisions((Array.isArray(d) ? d : (d as any).data) || []);
      setSubjects((s as unknown as Subject[]) || []);
      setTeachers(((t as any).data || t as unknown as Teacher[]) || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data.');
    } finally { setLoading(false); }
  };

  const openAdd = () => { setEditingId(null); setForm(empty); setError(''); setIsOpen(true); };
  const openEdit = (cls: Class) => {
    setEditingId(cls.id);
    setForm({
      division_id:        String((cls as any).division_id ?? ''),
      name:               cls.name,
      capacity:           String(cls.capacity || 30),
      is_active:          (cls as any).is_active !== false,
      sponsor_teacher_id: String((cls as any).sponsor_teacher_id ?? ''),
      subject_ids:        ((cls as any).subjects || []).map((s: any) => s.id),
    });
    setError(''); setIsOpen(true);
  };

  const toggleSubject = (id: number) => {
    setForm((f) => ({
      ...f,
      subject_ids: f.subject_ids.includes(id)
        ? f.subject_ids.filter((s) => s !== id)
        : [...f.subject_ids, id],
    }));
  };

  const handleSubmit = async () => {
    if (!form.division_id) { setError('Please select a division.'); return; }
    if (!form.name.trim() || form.name === 'custom') { setError('Class name is required.'); return; }
    setSaving(true); setError('');
    const payload = {
      division_id:         form.division_id ? Number(form.division_id) : undefined,
      name:                form.name,
      slug:                form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      capacity:            Number(form.capacity),
      order:               0,
      is_active:           form.is_active,
      sponsor_teacher_id:  form.sponsor_teacher_id ? Number(form.sponsor_teacher_id) : null,
      subject_ids:         form.subject_ids,
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
    `${c.name.replace(/\s[A-Z][a-z]*$/, '').trim()}`.toLowerCase().includes(search.toLowerCase())
  );

  const divisionName = (cls: Class) =>
    (cls as any).division?.name || divisions.find((d) => d.id === (cls as any).division_id)?.name || '—';

  const sponsorTeacherName = (cls: Class) => {
    const t = (cls as any).sponsor;
    if (t) return `${t.first_name} ${t.last_name}`;
    const id = (cls as any).sponsor_teacher_id;
    if (!id) return '—';
    const found = teachers.find((x) => x.id === id);
    return found ? `${found.first_name} ${found.last_name}` : '—';
  };

  // Only class-sponsor or class-teacher role teachers can be sponsors
  const sponsorCandidates = teachers.filter((t) => {
    const slug = (t as any).user?.role?.slug || '';
    return slug === 'class-teacher' || slug === 'class-sponsor' || slug === 'subject-teacher' || slug === 'teacher';
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Academic structure</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Classes</h1>
          <p className="mt-1 text-sm text-slate-500">{classes.length} class{classes.length !== 1 ? 'es' : ''} configured.</p>
        </div>
        {isAdmin && (
          <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white">
            + Add class
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
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
            <Input
              type="search"
              placeholder="Search classes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>
          {loading ? (
            <LoadingState message="Loading…" />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No classes found"
              description="Try adjusting your search to find what you're looking for."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Division</TableHead>
                  <TableHead>Class Sponsor</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead className="hidden md:table-cell">Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-semibold text-slate-900">{cls.name}</TableCell>
                    <TableCell className="text-blue-600 font-medium">{divisionName(cls)}</TableCell>
                    <TableCell className="text-slate-600">{sponsorTeacherName(cls)}</TableCell>
                    <TableCell className="text-slate-600">
                      {((cls as any).subjects || []).length > 0
                        ? <Badge variant="info">{((cls as any).subjects || []).length} subject{((cls as any).subjects || []).length !== 1 ? 's' : ''}</Badge>
                        : <span className="text-slate-400">—</span>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-slate-600">{cls.capacity || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={(cls as any).is_active !== false ? 'success' : 'default'}>
                        {(cls as any).is_active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isAdmin ? (
                        <div className="flex gap-2 flex-wrap">
                          <Button onClick={() => openEdit(cls)} variant="ghost" className="text-blue-600 hover:text-blue-700 text-xs p-0 h-auto">
                            Edit
                          </Button>
                          <Button onClick={() => handleDelete(cls.id)} variant="ghost" className="text-rose-600 hover:text-rose-700 text-xs p-0 h-auto">
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
          <div className="border-t border-slate-200 px-4 py-3 sm:px-5 text-xs text-slate-400">{filtered.length} of {classes.length}</div>
        </CardContent>
      </Card>

      <FormModal isOpen={isOpen} title={editingId ? 'Edit class' : 'Add class'} onClose={() => setIsOpen(false)} onSubmit={handleSubmit} submitText={editingId ? 'Save changes' : 'Create class'} isLoading={saving}>
        <div className="space-y-4">

          {/* Division */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Division</label>
            <select value={form.division_id} onChange={(e) => setForm({ ...form, division_id: e.target.value })} className="input-field">
              <option value="">No division</option>
              {divisions.map((d) => <option key={d.id} value={d.id}>{d.name}{d.description ? ` - ${d.description}` : ''}</option>)}
            </select>
            {form.division_id && (
              <p className="mt-1 text-xs text-slate-500">
                {divisions.find((d) => d.id === Number(form.division_id))?.description || ''}
              </p>
            )}
          </div>

          {/* Class name */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Class name <span className="text-rose-500">*</span></label>
            {form.division_id ? (
              <select
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field"
              >
                <option value="">Select a class name</option>
                {(() => {
                  const selectedDivision = divisions.find((d) => d.id === Number(form.division_id));
                  if (!selectedDivision) return null;
                  const suggestions = getClassSuggestions(selectedDivision.name, selectedDivision.description || '');
                  return suggestions.map((suggestion, index) => (
                    <option key={`${suggestion}-${index}`} value={suggestion}>{suggestion}</option>
                  ));
                })()}
                <option value="custom">Custom class name…</option>
              </select>
            ) : (
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Select a division first, or type a name" />
            )}
            {form.name === 'custom' && (
              <input
                required
                autoFocus
                value=""
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field mt-2"
                placeholder="Enter custom class name"
              />
            )}
          </div>

          {/* Capacity */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Capacity</label>
            <input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="input-field" />
          </div>

          {/* Class sponsor */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Class sponsor (class teacher)</label>
            <select
              value={form.sponsor_teacher_id}
              onChange={(e) => setForm({ ...form, sponsor_teacher_id: e.target.value })}
              className="input-field"
            >
              <option value="">No class sponsor assigned</option>
              {sponsorCandidates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.first_name} {t.last_name}{(t as any).user?.role?.name ? ` — ${(t as any).user.role.name}` : ''}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">The class sponsor receives subject marks from subject teachers and compiles the final report card.</p>
          </div>

          {/* Subjects */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Subjects taught in this class</label>
            {subjects.length === 0 ? (
              <p className="text-xs text-slate-400">No subjects found. Add subjects first.</p>
            ) : (
              <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
                {subjects.map((s) => (
                  <label key={s.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600"
                      checked={form.subject_ids.includes(s.id)}
                      onChange={() => toggleSubject(s.id)}
                    />
                    <span className="text-sm text-slate-700">
                      <span className="font-mono text-xs text-blue-700 mr-1">{s.code}</span>
                      {s.name}
                    </span>
                  </label>
                ))}
              </div>
            )}
            {form.subject_ids.length > 0 && (
              <p className="mt-1 text-xs text-slate-500">{form.subject_ids.length} subject{form.subject_ids.length !== 1 ? 's' : ''} selected</p>
            )}
          </div>

          {/* Active */}
          <div className="flex items-center gap-3 pt-1">
            <input type="checkbox" id="cls_active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4 rounded" />
            <label htmlFor="cls_active" className="text-sm font-medium text-slate-700">Active</label>
          </div>

        </div>
      </FormModal>
    </div>
  );
}
