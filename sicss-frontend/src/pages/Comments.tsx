import { useState, useEffect } from 'react';
import api from '../services/api';
import { studentService } from '../services/studentService';
import { teacherService, type Teacher } from '../services/teacherService';
import { FormModal } from '../components/FormModal';
import type { Student } from '../types';

type Comment = {
  id: number;
  student_id: number;
  teacher_id: number | null;
  academic_year: string;
  term: string;
  comment_type: string;
  comment: string;
  student?: Student;
  teacher?: Teacher;
};

type FormData = {
  student_id: string;
  teacher_id: string;
  academic_year: string;
  term: string;
  comment_type: string;
  comment: string;
};

const emptyForm: FormData = {
  student_id: '',
  teacher_id: '',
  academic_year: new Date().getFullYear().toString(),
  term: '1st',
  comment_type: 'academic',
  comment: '',
};

const typeColors: Record<string, string> = {
  academic: 'bg-blue-100 text-blue-800',
  behavior: 'bg-amber-100 text-amber-800',
  general: 'bg-slate-100 text-slate-600',
};

export default function Comments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');  // '' = show all

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [cRes, sRes, tRes] = await Promise.all([
        api.get('/student-comments'),
        studentService.getAll(),
        teacherService.getAll(),
      ]);
      const cData = cRes.data;
      // Response is paginated: { current_page, data: [...], ... }
      setComments(cData.data ?? (Array.isArray(cData) ? cData : []));
      setStudents(sRes.data || []);
      setTeachers(tRes.data || []);
    } catch { setError('Failed to load comments.'); }
    finally { setLoading(false); }
  };

  const filtered = comments.filter((c) => {
    const q = search.toLowerCase();
    const student = c.student;
    const matchSearch = (
      c.comment.toLowerCase().includes(q) ||
      (student ? `${student.first_name} ${student.last_name}`.toLowerCase().includes(q) : false)
    );
    const matchType = !filterType || c.comment_type === filterType;
    return matchSearch && matchType;
  });

  const openAdd = () => { setEditingId(null); setFormData(emptyForm); setIsModalOpen(true); };
  const openEdit = (c: Comment) => {
    setEditingId(c.id);
    setFormData({
      student_id: String(c.student_id),
      teacher_id: c.teacher_id ? String(c.teacher_id) : '',
      academic_year: c.academic_year,
      term: c.term,
      comment_type: c.comment_type,
      comment: c.comment,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        student_id: Number(formData.student_id),
        teacher_id: formData.teacher_id ? Number(formData.teacher_id) : undefined,
      };
      if (editingId) {
        const res = await api.put(`/student-comments/${editingId}`, payload);
        setComments((prev) => prev.map((c) => (c.id === editingId ? res.data : c)));
      } else {
        const res = await api.post('/student-comments', payload);
        setComments((prev) => [res.data, ...prev]);
      }
      setIsModalOpen(false);
    } catch { setError('Failed to save comment.'); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await api.delete(`/student-comments/${id}`);
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch { setError('Failed to delete comment.'); }
  };

  const field = (key: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setFormData({ ...formData, [key]: e.target.value });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Student support</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Student comments</h1>
        </div>
        <button onClick={openAdd} className="self-start rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 sm:self-auto">
          + Add comment
        </button>
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row">
          <input type="search" placeholder="Search comments…" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field max-w-xs" />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input-field max-w-[160px]">
            <option value="">All types</option>
            <option value="academic">Academic</option>
            <option value="behavior">Behavior</option>
            <option value="general">General</option>
          </select>
        </div>
        {loading ? (
          <p className="py-12 text-center text-sm text-slate-500">Loading comments…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  {['Student', 'Type', 'Term', 'Year', 'Teacher', 'Comment', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-10 text-center text-slate-400">No comments found.</td></tr>
                ) : filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-semibold text-slate-900">
                      {c.student ? `${c.student.first_name} ${c.student.last_name}` : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${typeColors[c.comment_type] || 'bg-slate-100 text-slate-600'}`}>
                        {c.comment_type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{c.term}</td>
                    <td className="px-5 py-3 text-slate-600">{c.academic_year}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {c.teacher ? `${c.teacher.first_name} ${c.teacher.last_name}` : '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-600 max-w-[260px]">
                      <span className="line-clamp-2">{c.comment}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-3">
                        <button onClick={() => openEdit(c)} className="text-xs font-semibold text-cyan-700 hover:underline">Edit</button>
                        <button onClick={() => handleDelete(c.id)} className="text-xs font-semibold text-rose-600 hover:underline">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
          {filtered.length} of {comments.length} comment{comments.length !== 1 ? 's' : ''}
        </div>
      </div>

      <FormModal isOpen={isModalOpen} title={editingId ? 'Edit comment' : 'Add comment'} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit} submitText={editingId ? 'Save changes' : 'Add comment'} isLoading={isSubmitting}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Student <span className="text-rose-500">*</span></label>
            <select required value={formData.student_id} onChange={field('student_id')} className="input-field">
              <option value="">Select student</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
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
            <label className="mb-1 block text-sm font-medium text-slate-700">Academic year <span className="text-rose-500">*</span></label>
            <input required value={formData.academic_year} onChange={field('academic_year')} className="input-field" placeholder="2026" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Term <span className="text-rose-500">*</span></label>
            <select required value={formData.term} onChange={field('term')} className="input-field">
              <option value="1st">1st Term</option>
              <option value="2nd">2nd Term</option>
              <option value="3rd">3rd Term</option>
              <option value="annual">Annual</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Comment type</label>
            <select value={formData.comment_type} onChange={field('comment_type')} className="input-field">
              <option value="academic">Academic</option>
              <option value="behavior">Behavior</option>
              <option value="general">General</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Comment <span className="text-rose-500">*</span></label>
            <textarea required value={formData.comment} onChange={field('comment')} className="input-field" rows={4} placeholder="Enter your comment about the student…" />
          </div>
        </div>
      </FormModal>
    </div>
  );
}
