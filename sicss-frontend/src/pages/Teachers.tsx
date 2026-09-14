import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { payrollService, teacherService, type SalaryStructure, type Teacher } from '../services/teacherService';
import { classService, type Class } from '../services/classService';
import { subjectService, type Subject } from '../services/subjectService';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import type { User } from '../types';
import { FormModal } from '../components/FormModal';
import api from '../services/api';
import { Button, Input, Select, Badge, Table, TableHeader, TableBody, TableRow, TableCell, TableHead, LoadingState, EmptyState, Card, CardContent } from '../components/ui';

type FormData = {
  user_id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string;
  hire_date: string;
  qualifications: string;
  photo: string;
  credential_image_path: string;
  specialization: string;
  status: string;
  sponsor_class_id: string;
  class_ids: number[];                                // classes this teacher is assigned to teach
  subject_assignments: { class_id: string; subject_id: string }[];
  salary_structure_id: string;
};

const emptyForm: FormData = {
  user_id: '',
  employee_id: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  gender: 'male',
  date_of_birth: '',
  hire_date: '',
  qualifications: '',
  photo: '',
  credential_image_path: '',
  specialization: '',
  status: 'active',
  sponsor_class_id: '',
  class_ids: [],
  subject_assignments: [],
  salary_structure_id: '',
};

export default function Teachers() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [search, setSearch] = useState('');
  const [uploadingImage, setUploadingImage] = useState<'profile' | 'credential' | null>(null);
  const [uploadError, setUploadError] = useState('');
  const profileImageRef = useRef<HTMLInputElement>(null);
  const credentialImageRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      if (isAdmin) {
        const [res, userData, classData, subjectData, structures] = await Promise.all([teacherService.getAll(), authService.users(), classService.getAll(), subjectService.getAll(), payrollService.structures()]);
        setTeachers(res.data || (res as unknown as Teacher[]) || []);
        setUsers(userData);
        setClasses((classData as any).data || classData as any);
        setSubjects((subjectData as any).data || subjectData as any);
        setSalaryStructures(structures);
      } else {
        const res = await teacherService.getAll();
        setTeachers(res.data || (res as unknown as Teacher[]) || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load teachers.');
    } finally { setLoading(false); }
  };

  const filtered = teachers.filter((t) => {
    const displayId = (t as any).user?.user_code || t.employee_id;
    return `${t.first_name} ${t.last_name} ${t.email} ${displayId}`.toLowerCase().includes(search.toLowerCase());
  });

  const openEdit = (t: Teacher) => {
    setEditingId(t.id);
    setUploadError('');
    setFormData({
      user_id: String((t as any).user_id || ''),
      employee_id: t.employee_id || '',
      first_name: t.first_name || '',
      last_name: t.last_name || '',
      email: t.email || '',
      phone: t.phone || '',
      gender: (t as any).gender || 'male',
      date_of_birth: (t as any).date_of_birth || '',
      hire_date: (t as any).hire_date || '',
      qualifications: (t as any).qualifications || '',
      photo: (t as any).photo || '',
      credential_image_path: (t as any).credential_image_path || '',
      specialization: (t as any).specialization || t.subject_specialization || '',
      status: (t as any).status || 'active',
      sponsor_class_id: String((t as any).sponsored_class?.id || ''),
      class_ids: ((t as any).classes || []).map((c: any) => c.id),
      subject_assignments: ((t as any).subject_class_assignments || []).map((a: any) => ({ class_id: String(a.class_id), subject_id: String(a.subject_id) })),
      salary_structure_id: String(t.salary_structure_id || ''),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        user_id: formData.user_id ? Number(formData.user_id) : undefined,
        salary_structure_id: formData.salary_structure_id ? Number(formData.salary_structure_id) : null,
        sponsor_class_id: formData.sponsor_class_id ? Number(formData.sponsor_class_id) : null,
        class_ids: formData.class_ids,
        subject_assignments: formData.subject_assignments.filter((a) => a.class_id && a.subject_id).map((a) => ({ class_id: Number(a.class_id), subject_id: Number(a.subject_id) })),
      };
      if (editingId) {
        const updated = await teacherService.update(editingId, payload as any);
        setTeachers((c) => c.map((t) => (t.id === editingId ? (updated as any) : t)));
      } else {
        const created = await teacherService.create(payload as any);
        setTeachers((c) => [created as any, ...c]);
      }
      setIsModalOpen(false);
    } catch { setError('Failed to save teacher.'); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this teacher record?')) return;
    try {
      await teacherService.delete(id);
      setTeachers((c) => c.filter((t) => t.id !== id));
    } catch { setError('Failed to delete teacher.'); }
  };

  const field = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setFormData({ ...formData, [key]: e.target.value });

  const uploadTeacherImage = async (type: 'profile' | 'credential', file?: File) => {
    if (!file) return;
    setUploadingImage(type);
    setUploadError('');
    try {
      const upload = new FormData();
      upload.append('file', file);
      upload.append('type', type);
      const response = await api.post('/upload/teacher-image', upload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData((current) => ({
        ...current,
        [type === 'profile' ? 'photo' : 'credential_image_path']: response.data.full_url,
      }));
    } catch {
      setUploadError(`Unable to upload the ${type === 'profile' ? 'profile photo' : 'credential image'}. Please use a PNG, JPG, or WebP image up to 5 MB.`);
    } finally {
      setUploadingImage(null);
      const input = type === 'profile' ? profileImageRef.current : credentialImageRef.current;
      if (input) input.value = '';
    }
  };

  const selectedUser = users.find((u) => u.id === Number(formData.user_id));
  const teachingRole = selectedUser?.role?.slug;

  // Toggle a class in the class_ids list
  const toggleClass = (id: number) => {
    setFormData((f) => ({
      ...f,
      class_ids: f.class_ids.includes(id)
        ? f.class_ids.filter((c) => c !== id)
        : [...f.class_ids, id],
    }));
  };

  // A class-sponsor or class-teacher role qualifies for the sponsored class field
  const isSponsorRole = teachingRole === 'class-teacher' || teachingRole === 'class-sponsor';
  // Subject-teacher gets the subject+class assignment builder
  const isSubjectRole = teachingRole === 'subject-teacher';

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .rounded-xl { border-radius: 0 !important; }
          .shadow-sm { box-shadow: none !important; }
          table { border-collapse: collapse !important; width: 100% !important; }
          th, td { border: 1px solid black !important; padding: 4px !important; font-size: 10px !important; }
          th { background-color: #f0f0f0 !important; }
        }
      `}</style>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Staff management</p>
          <h1 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">Teachers</h1>
          <p className="mt-2 text-base text-slate-500">{teachers.length} teacher{teachers.length !== 1 ? 's' : ''} in the system.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => window.print()} variant="secondary" className="rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:bg-slate-100">
            🖨️ Print
          </Button>
          {isAdmin && (
            <Button onClick={() => navigate('/application')} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 hover:shadow-xl">
              📝 Add Teacher
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
          <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-rose-800">{error}</p>
            <Button onClick={load} variant="secondary" className="mt-2 text-xs">Try Again</Button>
          </div>
        </div>
      )}

      <Card className="shadow-lg shadow-slate-200/50">
        <CardContent className="p-0">
          <div className="border-b border-slate-200 px-6 py-4 sm:px-6 no-print">
            <div className="relative max-w-xs">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <Input
                type="search"
                placeholder="Search teachers…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 max-w-xs rounded-xl border-slate-300 bg-white shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-400"
              />
            </div>
          </div>
          {loading ? (
            <LoadingState message="Loading teachers…" />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No teachers found"
              description="Try adjusting your search to find what you're looking for."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">Photo</TableHead>
                  <TableHead className="font-semibold text-slate-700">Employee ID</TableHead>
                  <TableHead className="font-semibold text-slate-700">Name</TableHead>
                  <TableHead className="hidden sm:table-cell font-semibold text-slate-700">Salary structure</TableHead>
                  <TableHead className="hidden md:table-cell font-semibold text-slate-700">Email</TableHead>
                  <TableHead className="hidden md:table-cell font-semibold text-slate-700">Phone</TableHead>
                  <TableHead className="hidden lg:table-cell font-semibold text-slate-700">Class(es)</TableHead>
                  <TableHead className="hidden lg:table-cell font-semibold text-slate-700">Specialization</TableHead>
                  <TableHead className="hidden lg:table-cell font-semibold text-slate-700">Hire date</TableHead>
                  <TableHead className="font-semibold text-slate-700">Status</TableHead>
                  <TableHead className="no-print font-semibold text-slate-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell>
                      {(t as any).photo
                        ? <img src={(t as any).photo} alt={`${t.first_name} ${t.last_name}`} className="h-8 w-8 sm:h-9 sm:w-9 rounded-full border border-slate-200 object-cover" />
                        : <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">{t.first_name?.[0]}{t.last_name?.[0]}</div>}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{t.employee_id}</TableCell>
                    <TableCell className="font-semibold text-slate-900">{t.first_name} {t.last_name}</TableCell>
                    <TableCell className="hidden sm:table-cell text-slate-600">{t.salary_structure?.name || '—'}</TableCell>
                    <TableCell className="hidden md:table-cell text-slate-600">{t.email}</TableCell>
                    <TableCell className="hidden md:table-cell text-slate-600">{t.phone || '—'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-slate-600">
                      {((t as any).classes || []).length > 0
                        ? ((t as any).classes as any[]).map((c: any) => c.name.replace(/\s[A-Z][a-z]*$/, '').trim()).join(', ')
                        : (t as any).sponsored_class?.name
                          ? `${(t as any).sponsored_class.name.replace(/\s[A-Z][a-z]*$/, '').trim()}`
                          : '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-slate-600">{t.subject_specialization || (t as any).specialization || '—'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-slate-600">{(t as any).hire_date ? new Date((t as any).hire_date).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>
                      <Badge variant={(t as any).status === 'active' ? 'success' : (t as any).status === 'on_leave' ? 'warning' : 'default'}>
                        {(t as any).status || 'active'}
                      </Badge>
                    </TableCell>
                    <TableCell className="no-print">
                      {isAdmin ? (
                        <div className="flex gap-2">
                          <Button onClick={() => openEdit(t)} variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                            Edit
                          </Button>
                          <Button onClick={() => handleDelete(t.id)} variant="ghost" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
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
          <div className="border-t border-slate-200 px-6 py-4 text-xs text-slate-500 font-medium">
            {filtered.length} of {teachers.length} teacher{teachers.length !== 1 ? 's' : ''}
          </div>
        </CardContent>
      </Card>

      <FormModal isOpen={isModalOpen} title={editingId ? 'Edit teacher' : 'Add teacher'} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit} submitText={editingId ? 'Save changes' : 'Add teacher'} isLoading={isSubmitting}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Select
              label="User account"
              value={formData.user_id}
              onChange={field('user_id')}
              options={[
                { value: '', label: 'No linked account' },
                ...(users.some((u) => ['class-sponsor', 'class-teacher'].includes(u.role?.slug || '')) ? [{ value: 'class-sponsor', label: 'Class Sponsor' }] : []),
                ...(users.some((u) => ['subject-teacher'].includes(u.role?.slug || '')) ? [{ value: 'subject-teacher', label: 'Subject Teacher' }] : [])
              ]}
              helperText="Create the user with a Class Teacher or Subject Teacher role first, then link it here."
            />
          </div>
          <div>
            <Input
              label="Employee ID (optional - auto-generated if empty)"
              value={formData.employee_id}
              onChange={field('employee_id')}
              placeholder="EMP-2026-0001"
            />
          </div>
          <div>
            <Input
              label="First name"
              value={formData.first_name}
              onChange={field('first_name')}
              required
            />
          </div>
          <div>
            <Input
              label="Last name"
              value={formData.last_name}
              onChange={field('last_name')}
              required
            />
          </div>
          <div>
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={field('email')}
              required
            />
          </div>
          <div>
            <Input
              label="Phone"
              value={formData.phone}
              onChange={field('phone')}
            />
          </div>
          <div>
            <Select
              label="Gender"
              value={formData.gender}
              onChange={field('gender')}
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </div>
          <div>
            <Input
              label="Date of birth"
              type="date"
              value={formData.date_of_birth}
              onChange={field('date_of_birth')}
            />
          </div>
          <div>
            <Input
              label="Hire date"
              type="date"
              value={formData.hire_date}
              onChange={field('hire_date')}
              required
            />
          </div>
          <div>
            <Input
              label="Qualifications"
              value={formData.qualifications}
              onChange={field('qualifications')}
              placeholder="B.Ed, M.Ed…"
            />
          </div>
          <div className="sm:col-span-2 grid grid-cols-1 gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 sm:grid-cols-2">
            <input ref={profileImageRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => uploadTeacherImage('profile', event.target.files?.[0])} />
            <input ref={credentialImageRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => uploadTeacherImage('credential', event.target.files?.[0])} />
            <div>
              <p className="text-sm font-medium text-slate-700">Profile image <span className="font-normal text-slate-400">(optional)</span></p>
              <div className="mt-2 flex items-center gap-3">
                {formData.photo ? <img src={formData.photo} alt="Teacher profile preview" className="h-14 w-14 rounded-full border border-slate-200 object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-xs text-slate-500">No photo</div>}
                <div className="flex flex-col items-start gap-1">
                  <button type="button" onClick={() => profileImageRef.current?.click()} disabled={uploadingImage !== null} className="text-sm font-semibold text-blue-600 hover:underline disabled:opacity-50">{uploadingImage === 'profile' ? 'Uploading…' : formData.photo ? 'Replace photo' : 'Upload photo'}</button>
                  {formData.photo && <button type="button" onClick={() => setFormData((current) => ({ ...current, photo: '' }))} className="text-xs font-medium text-rose-600 hover:underline">Remove</button>}
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Qualification / credential image <span className="font-normal text-slate-400">(optional)</span></p>
              <div className="mt-2 flex items-center gap-3">
                {formData.credential_image_path ? <img src={formData.credential_image_path} alt="Credential preview" className="h-14 w-20 rounded border border-slate-200 object-cover" /> : <div className="flex h-14 w-20 items-center justify-center rounded border border-dashed border-slate-300 text-center text-xs text-slate-500">No credential</div>}
                <div className="flex flex-col items-start gap-1">
                  <button type="button" onClick={() => credentialImageRef.current?.click()} disabled={uploadingImage !== null} className="text-sm font-semibold text-blue-600 hover:underline disabled:opacity-50">{uploadingImage === 'credential' ? 'Uploading…' : formData.credential_image_path ? 'Replace image' : 'Upload image'}</button>
                  {formData.credential_image_path && <button type="button" onClick={() => setFormData((current) => ({ ...current, credential_image_path: '' }))} className="text-xs font-medium text-rose-600 hover:underline">Remove</button>}
                </div>
              </div>
            </div>
            {uploadError && <p className="sm:col-span-2 text-xs text-rose-600">{uploadError}</p>}
          </div>
          <div>
            <Input
              label="Specialization"
              value={formData.specialization}
              onChange={field('specialization')}
              placeholder="Mathematics, Science…"
            />
          </div>
          <div>
            <Select
              label="Status"
              value={formData.status}
              onChange={field('status')}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'on_leave', label: 'On leave' },
              ]}
            />
          </div>
          <div className="sm:col-span-2">
            <Select
              label="Salary structure"
              value={formData.salary_structure_id}
              onChange={field('salary_structure_id')}
              options={[
                { value: '', label: 'No structure assigned' },
                ...salaryStructures.filter((structure) => structure.is_active).map((structure) => ({ value: String(structure.id), label: `${structure.name} — ${structure.currency} ${structure.monthly_salary}/month` }))
              ]}
              helperText="Payroll uses this as the default monthly salary. It can be adjusted when a monthly payroll is created."
            />
          </div>

          {/* ── Classes assigned to this teacher (all roles) ── */}
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Classes assigned to this teacher</label>
            {classes.length === 0 ? (
              <p className="text-xs text-slate-400">No classes found. Add classes first.</p>
            ) : (
              <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-sm">
                {classes.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 accent-blue-600 focus:ring-2 focus:ring-blue-500/20"
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
              <p className="mt-2 text-xs text-slate-500">{formData.class_ids.length} class{formData.class_ids.length !== 1 ? 'es' : ''} selected</p>
            )}
          </div>

          {/* ── Sponsored class — class-sponsor / class-teacher roles ── */}
          {isSponsorRole && (
            <div className="sm:col-span-2">
              <Select
                label="Sponsored class (home class)"
                value={formData.sponsor_class_id}
                onChange={field('sponsor_class_id')}
                options={[
                  { value: '', label: 'No sponsored class' },
                  ...classes.map((c) => ({ value: String(c.id), label: `${c.name.replace(/\s[A-Z][a-z]*$/, '').trim()}` }))
                ]}
                helperText="The sponsored class is the teacher's home class. They compile the mark sheet and send it to the VPI for approval."
              />
            </div>
          )}

          {/* ── Subject + class assignments — subject-teacher role ── */}
          {isSubjectRole && (
            <div className="sm:col-span-2 space-y-2">
              <label className="block text-sm font-medium text-slate-700">Subject and class assignments</label>
              <p className="text-xs text-slate-500">Assign this teacher to specific subjects within specific classes.</p>
              {formData.subject_assignments.map((assignment, index) => (
                <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <select value={assignment.class_id} onChange={(e) => setFormData((f) => ({ ...f, subject_assignments: f.subject_assignments.map((a, i) => i === index ? { ...a, class_id: e.target.value } : a) }))} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
                    <option value="">Class</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name.replace(/\s[A-Z][a-z]*$/, '').trim()}</option>)}
                  </select>
                  <select value={assignment.subject_id} onChange={(e) => setFormData((f) => ({ ...f, subject_assignments: f.subject_assignments.map((a, i) => i === index ? { ...a, subject_id: e.target.value } : a) }))} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
                    <option value="">Subject</option>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
                  </select>
                  <button type="button" onClick={() => setFormData((f) => ({ ...f, subject_assignments: f.subject_assignments.filter((_, i) => i !== index) }))} className="px-2 text-sm font-semibold text-rose-600">Remove</button>
                </div>
              ))}
              <button type="button" onClick={() => setFormData((f) => ({ ...f, subject_assignments: [...f.subject_assignments, { class_id: '', subject_id: '' }] }))} className="text-sm font-semibold text-blue-600">
                + Assign a subject to a class
              </button>
            </div>
          )}

          {/* ── If no user account is linked yet, show a note about assigning roles ── */}
          {!formData.user_id && (
            <div className="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold text-amber-800">Tip — link a user account to unlock role-specific fields</p>
              <p className="text-xs text-amber-700 mt-0.5">Select a user account above. If the linked user has the <strong>class-sponsor</strong> role, the sponsored class field appears. If they have <strong>subject-teacher</strong>, the subject assignment builder appears.</p>
            </div>
          )}
        </div>
      </FormModal>
    </div>
  );
}
