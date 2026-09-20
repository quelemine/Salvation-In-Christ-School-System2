import { useState, useEffect } from 'react';
import api from '../services/api';
import { classService, type Class } from '../services/classService';
import { subjectService, type Subject } from '../services/subjectService';
import { teacherService, type Teacher } from '../services/teacherService';
import { FormModal } from '../components/FormModal';
import { Button, Input, Select, Badge, Table, TableHeader, TableBody, TableRow, TableCell, TableHead, LoadingState, EmptyState, Card, CardContent } from '../components/ui';

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

const statusBadgeVariant = (status: string) =>
  status === 'published' ? 'success' as const
  : status === 'draft' ? 'warning' as const
  : 'default' as const;

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
    setError('');
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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load assignments.');
    } finally { setLoading(false); }
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
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Teaching tools</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Assignments</h1>
        </div>
        <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white">
          + Add assignment
        </Button>
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
              placeholder="Search assignments…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>
          {loading ? (
            <LoadingState message="Loading assignments…" />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No assignments found"
              description="Try adjusting your search to find what you're looking for."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-semibold text-slate-900 max-w-[200px] truncate">{a.title}</TableCell>
                    <TableCell className="text-slate-600">{a.class?.name || '—'}</TableCell>
                    <TableCell className="text-slate-600">{a.subject?.name || '—'}</TableCell>
                    <TableCell className="text-slate-600">{a.teacher ? `${a.teacher.first_name} ${a.teacher.last_name}` : '—'}</TableCell>
                    <TableCell className="text-slate-600">{a.due_date ? new Date(a.due_date).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(a.status)}>
                        {a.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-3">
                        <Button onClick={() => openEdit(a)} variant="ghost" className="text-blue-600 hover:text-blue-700 text-xs p-0 h-auto">
                          Edit
                        </Button>
                        <Button onClick={() => handleDelete(a.id)} variant="ghost" className="text-rose-600 hover:text-rose-700 text-xs p-0 h-auto">
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-400">
            {filtered.length} of {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
          </div>
        </CardContent>
      </Card>

      <FormModal isOpen={isModalOpen} title={editingId ? 'Edit assignment' : 'Add assignment'} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit} submitText={editingId ? 'Save changes' : 'Add assignment'} isLoading={isSubmitting}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Title"
              value={formData.title}
              onChange={field('title')}
              placeholder="Chapter 3 exercises"
              required
            />
          </div>
          <div>
            <Select
              label="Class"
              value={formData.class_id}
              onChange={field('class_id')}
              options={[
                { value: '', label: 'Select class' },
                ...classes.map((c) => ({ value: String(c.id), label: `${c.name.replace(/\s[A-Z][a-z]*$/, '').trim()}` }))
              ]}
              required
            />
          </div>
          <div>
            <Select
              label="Subject"
              value={formData.subject_id}
              onChange={field('subject_id')}
              options={[
                { value: '', label: 'Select subject' },
                ...subjects.map((s) => ({ value: String(s.id), label: s.name }))
              ]}
              required
            />
          </div>
          <div>
            <Select
              label="Teacher"
              value={formData.teacher_id}
              onChange={field('teacher_id')}
              options={[
                { value: '', label: 'Select teacher (optional)' },
                ...teachers.map((t) => ({ value: String(t.id), label: `${t.first_name} ${t.last_name}` }))
              ]}
            />
          </div>
          <div>
            <Input
              label="Due date"
              type="date"
              value={formData.due_date}
              onChange={field('due_date')}
              required
            />
          </div>
          <div>
            <Select
              label="Status"
              value={formData.status}
              onChange={field('status')}
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'published', label: 'Published' },
                { value: 'closed', label: 'Closed' },
              ]}
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Description"
              type="textarea"
              value={formData.description}
              onChange={field('description')}
              rows={3}
              placeholder="Describe the assignment…"
            />
          </div>
        </div>
      </FormModal>
    </div>
  );
}
