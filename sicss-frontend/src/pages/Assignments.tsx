import { useState, useEffect } from 'react';
import api from '../services/api';
import { classService, type Class } from '../services/classService';
import { subjectService, type Subject } from '../services/subjectService';
import { teacherService, type Teacher } from '../services/teacherService';
import { FormModal } from '../components/FormModal';

type Assignment = {
  id: number;
  title: string;
  description: string | null;
  due_date: string;
  status: string;
  class?: Class;
  subject?: Subject;
  teacher?: Teacher;
};

type FormData = {
  title: string;
  description: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  due_date: string;
  status: string;
};

const emptyForm: FormData = {
  title: '',
  description: '',
  class_id: '',
  subject_id: '',
  teacher_id: '',
  due_date: '',
  status: 'published',
};

const statusColors: Record<string, string> = {
  published: 'bg-emerald-100 text-emerald-800',
  draft: 'bg-amber-100 text-amber-800',
  closed: 'bg-slate-100 text-slate-600',
};

export default function Assignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
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
      const [aRes, cRes, sRes, tRes] = await Promise.all([
        api.get('/assignments'),
        classService.getAll(),
        subjectService.getAll(),
        teacherService.getAll(),
      ]);
      const aData = aRes.data;
      // Response is paginated: { current_page, data: [...], ... }
      setAssignments(aData.data ?? (Array.isArray(aData) ? aData : []));
      setClasses((cRes as unknown as Class[]) || []);
      setSubjects((sRes as unknown as Subject[]) || []);
      setTeachers(tRes.data || []);
    } catch { setError('Failed to load assignments.'); }
    finally { setLoading(false); }
  };

  const filtered = assignments.filter((a) =>
    `${a.title} ${a.class?.name || ''} ${a.subject?.name || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditingId(null); setFormData(emptyForm); setIsModalOpen(true); };
  const openEdit = (a: Assignment) => {
    setEditingId(a.id);
    setFormData({
      title: a.title || '',
      description: a.description || '',
      class_id: String(a.class?.id || ''),
      subject_id: String(a.subject?.id || ''),
      teacher_id: String(a.teacher?.id || ''),
      due_date: a.due_date || '',
      status: a.status || 'published',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        class_id: Number(formData.class_id),
        subject_id: Number(formData.subject_id),
        teacher_id: formData.teacher_id ? Number(formData.teacher_id) : undefined,
      };
      if (editingId) {
        const res = await api.put(`/assignments/${editingId}`, payload);
        setAssignments((c) => c.map((a) => (a.id === editingId ? res.data : a)));
      } else {
        const res = await api.post('/assignments', payload);
        setAssignments((c) => [res.data, ...c]);
      }
      setIsModalOpen(false);
    } catch { setError('Failed to save assignment.'); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this assignment?')) return;
    try {
      await api.delete(`/assignments/${id}`);
      setAssignments((c) => c.filter((a) => a.id !== id));
    } catch { setError('Failed to delete assignment.'); }
  };

  const field = (key: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setFormData({ ...formData, [key]: e.target.value });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Teaching tools</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Assignments</h1>
        </div>
        <button onClick={openAdd} className="self-start rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 sm:self-auto">
          + Add assignment
        </button>
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <input type="search" placeholder="Search assignments…" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field max-w-xs" />
        </div>
        {loading ? (
          <p className="py-12 text-center text-sm text-slate-500">Loading assignments…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  {['Title', 'Class', 'Subject', 'Teacher', 'Due date', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-10 text-center text-slate-400">No assignments found.</td></tr>
                ) : filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-semibold text-slate-900 max-w-[200px] truncate">{a.title}</td>
                    <td className="px-5 py-3 text-slate-600">{a.class?.name || '—'}</td>
                    <td className="px-5 py-3 text-slate-600">{a.subject?.name || '—'}</td>
                    <td className="px-5 py-3 text-slate-600">{a.teacher ? `${a.teacher.first_name} ${a.teacher.last_name}` : '—'}</td>
                    <td className="px-5 py-3 text-slate-600">{a.due_date || '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[a.status] || 'bg-slate-100 text-slate-600'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-3">
                        <button onClick={() => openEdit(a)} className="text-xs font-semibold text-cyan-700 hover:underline">Edit</button>
                        <button onClick={() => handleDelete(a.id)} className="text-xs font-semibold text-rose-600 hover:underline">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
          {filtered.length} of {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
        </div>
      </div>

      <FormModal isOpen={isModalOpen} title={editingId ? 'Edit assignment' : 'Add assignment'} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit} submitText={editingId ? 'Save changes' : 'Add assignment'} isLoading={isSubmitting}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Title <span className="text-rose-500">*</span></label>
            <input required value={formData.title} onChange={field('title')} className="input-field" placeholder="Chapter 3 exercises" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Class <span className="text-rose-500">*</span></label>
            <select required value={formData.class_id} onChange={field('class_id')} className="input-field">
              <option value="">Select class</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Subject <span className="text-rose-500">*</span></label>
            <select required value={formData.subject_id} onChange={field('subject_id')} className="input-field">
              <option value="">Select subject</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Teacher</label>
            <select value={formData.teacher_id} onChange={field('teacher_id')} className="input-field">
              <option value="">Select teacher (optional)</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Due date <span className="text-rose-500">*</span></label>
            <input required type="date" value={formData.due_date} onChange={field('due_date')} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
            <select value={formData.status} onChange={field('status')} className="input-field">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <textarea value={formData.description} onChange={field('description')} className="input-field" rows={3} placeholder="Describe the assignment…" />
          </div>
        </div>
      </FormModal>
    </div>
  );
}
