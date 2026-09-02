import { useState, useEffect, useRef } from 'react';
import { payrollService, teacherService, type SalaryStructure, type Teacher } from '../services/teacherService';
import { classService, type Class } from '../services/classService';
import { subjectService, type Subject } from '../services/subjectService';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import type { User } from '../types';
import { FormModal } from '../components/FormModal';
import api from '../services/api';

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
    } catch { setError('Failed to load teachers.'); }
    finally { setLoading(false); }
  };

  const filtered = teachers.filter((t) => {
    const displayId = (t as any).user?.user_code || t.employee_id;
    return `${t.first_name} ${t.last_name} ${t.email} ${displayId}`.toLowerCase().includes(search.toLowerCase());
  });

  const openAdd = () => { setEditingId(null); setUploadError(''); setFormData(emptyForm); setIsModalOpen(true); };
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
    <div className="space-y-5">
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
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Staff management</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">Teachers</h1>
          <p className="mt-1 text-sm text-slate-500">{teachers.length} teacher{teachers.length !== 1 ? 's' : ''} in the system.</p>
        </div>
        {isAdmin && (
          <button onClick={openAdd} className="self-start rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 sm:self-auto">
            + Add teacher
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => window.print()} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          🖨️ Print
        </button>
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-5 no-print">
          <input
            type="search"
            placeholder="Search teachers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field w-full max-w-xs"
          />
        </div>
        {loading ? (
          <p className="py-12 text-center text-sm text-slate-500">Loading teachers…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 sm:px-5 py-3 text-left">Photo</th>
                  <th className="px-3 sm:px-5 py-3 text-left">Employee ID</th>
                  <th className="px-3 sm:px-5 py-3 text-left">Name</th>
                  <th className="px-3 sm:px-5 py-3 text-left hidden sm:table-cell">Salary structure</th>
                  <th className="px-3 sm:px-5 py-3 text-left hidden md:table-cell">Email</th>
                  <th className="px-3 sm:px-5 py-3 text-left hidden md:table-cell">Phone</th>
                  <th className="px-3 sm:px-5 py-3 text-left hidden lg:table-cell">Class(es)</th>
                  <th className="px-3 sm:px-5 py-3 text-left hidden lg:table-cell">Specialization</th>
                  <th className="px-3 sm:px-5 py-3 text-left hidden lg:table-cell">Hire date</th>                  <th className="px-3 sm:px-5 py-3 text-left">Status</th>
                  <th className="px-3 sm:px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={11} className="py-10 text-center text-slate-400">No teachers found.</td></tr>
                ) : filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-3 sm:px-5 py-3">
                      {(t as any).photo
                        ? <img src={(t as any).photo} alt={`${t.first_name} ${t.last_name}`} className="h-8 w-8 sm:h-9 sm:w-9 rounded-full border border-slate-200 object-cover" />
                        : <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">{t.first_name?.[0]}{t.last_name?.[0]}</div>}
                    </td>
                    <td className="px-3 sm:px-5 py-3 font-mono text-xs text-slate-600">{(t as any).user?.user_code || t.employee_id}</td>
                    <td className="px-3 sm:px-5 py-3 font-semibold text-slate-900">{t.first_name} {t.last_name}</td>
                    <td className="px-3 sm:px-5 py-3 text-slate-600 hidden sm:table-cell">{t.salary_structure?.name || '—'}</td>
                    <td className="px-3 sm:px-5 py-3 text-slate-600 hidden md:table-cell">{t.email}</td>
                    <td className="px-3 sm:px-5 py-3 text-slate-600 hidden md:table-cell">{t.phone || '—'}</td>
                    <td className="px-3 sm:px-5 py-3 text-slate-600 hidden lg:table-cell">
                      {((t as any).classes || []).length > 0
                        ? ((t as any).classes as any[]).map((c: any) => c.name + (c.section ? ` ${c.section}` : '')).join(', ')
                        : (t as any).sponsored_class?.name
                          ? `${(t as any).sponsored_class.name}${(t as any).sponsored_class.section ? ` ${(t as any).sponsored_class.section}` : ''}`
                          : '—'}
                    </td>
                    <td className="px-3 sm:px-5 py-3 text-slate-600 hidden lg:table-cell">{t.subject_specialization || (t as any).specialization || '—'}</td>
                    <td className="px-3 sm:px-5 py-3 text-slate-600 hidden lg:table-cell">{(t as any).hire_date || '—'}</td>
                    <td className="px-3 sm:px-5 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        (t as any).status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                        (t as any).status === 'on_leave' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>{(t as any).status || 'active'}</span>
                    </td>
                    <td className="px-3 sm:px-5 py-3">
                      {isAdmin ? (
                        <div className="flex gap-2 flex-wrap">
                          <button onClick={() => openEdit(t)} className="text-xs font-semibold text-cyan-700 hover:underline whitespace-nowrap">Edit</button>
                          <button onClick={() => handleDelete(t.id)} className="text-xs font-semibold text-rose-600 hover:underline whitespace-nowrap">Delete</button>
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
        <div className="border-t border-slate-100 px-4 py-3 sm:px-5 text-xs text-slate-400">
          {filtered.length} of {teachers.length} teacher{teachers.length !== 1 ? 's' : ''}
        </div>
      </div>

      <FormModal isOpen={isModalOpen} title={editingId ? 'Edit teacher' : 'Add teacher'} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit} submitText={editingId ? 'Save changes' : 'Add teacher'} isLoading={isSubmitting}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="mb-1 block text-sm font-medium text-slate-700">User account</label>
            <select value={formData.user_id} onChange={field('user_id')} className="input-field">
              <option value="">No linked account</option>
              {users.filter((u) => ['teacher', 'class-teacher', 'subject-teacher'].includes(u.role?.slug || '')).map((u) => <option key={u.id} value={u.id}>{u.first_name} {u.last_name} — {u.role?.name}</option>)}
            </select>
            <p className="mt-1 text-xs text-slate-500">Create the user with a Class Teacher or Subject Teacher role first, then link it here.</p>
          </div>
          <div><label className="mb-1 block text-sm font-medium text-slate-700">Employee ID (optional - auto-generated if empty)</label><input value={formData.employee_id} onChange={field('employee_id')} className="input-field" placeholder="EMP-2026-0001" /></div>
          <div><label className="mb-1 block text-sm font-medium text-slate-700">First name <span className="text-rose-500">*</span></label><input required value={formData.first_name} onChange={field('first_name')} className="input-field" /></div>
          <div><label className="mb-1 block text-sm font-medium text-slate-700">Last name <span className="text-rose-500">*</span></label><input required value={formData.last_name} onChange={field('last_name')} className="input-field" /></div>
          <div><label className="mb-1 block text-sm font-medium text-slate-700">Email <span className="text-rose-500">*</span></label><input required type="email" value={formData.email} onChange={field('email')} className="input-field" /></div>
          <div><label className="mb-1 block text-sm font-medium text-slate-700">Phone</label><input value={formData.phone} onChange={field('phone')} className="input-field" /></div>
          <div><label className="mb-1 block text-sm font-medium text-slate-700">Gender</label>
            <select value={formData.gender} onChange={field('gender')} className="input-field">
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div><label className="mb-1 block text-sm font-medium text-slate-700">Date of birth</label><input type="date" value={formData.date_of_birth} onChange={field('date_of_birth')} className="input-field" /></div>
          <div><label className="mb-1 block text-sm font-medium text-slate-700">Hire date <span className="text-rose-500">*</span></label><input required type="date" value={formData.hire_date} onChange={field('hire_date')} className="input-field" /></div>
          <div><label className="mb-1 block text-sm font-medium text-slate-700">Qualifications</label><input value={formData.qualifications} onChange={field('qualifications')} className="input-field" placeholder="B.Ed, M.Ed…" /></div>
          <div className="sm:col-span-2 grid grid-cols-1 gap-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 sm:grid-cols-2">
            <input ref={profileImageRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => uploadTeacherImage('profile', event.target.files?.[0])} />
            <input ref={credentialImageRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => uploadTeacherImage('credential', event.target.files?.[0])} />
            <div>
              <p className="text-sm font-medium text-slate-700">Profile image <span className="font-normal text-slate-400">(optional)</span></p>
              <div className="mt-2 flex items-center gap-3">
                {formData.photo ? <img src={formData.photo} alt="Teacher profile preview" className="h-14 w-14 rounded-full border border-slate-200 object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-xs text-slate-500">No photo</div>}
                <div className="flex flex-col items-start gap-1">
                  <button type="button" onClick={() => profileImageRef.current?.click()} disabled={uploadingImage !== null} className="text-sm font-semibold text-cyan-700 hover:underline disabled:opacity-50">{uploadingImage === 'profile' ? 'Uploading…' : formData.photo ? 'Replace photo' : 'Upload photo'}</button>
                  {formData.photo && <button type="button" onClick={() => setFormData((current) => ({ ...current, photo: '' }))} className="text-xs font-medium text-rose-600 hover:underline">Remove</button>}
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Qualification / credential image <span className="font-normal text-slate-400">(optional)</span></p>
              <div className="mt-2 flex items-center gap-3">
                {formData.credential_image_path ? <img src={formData.credential_image_path} alt="Credential preview" className="h-14 w-20 rounded border border-slate-200 object-cover" /> : <div className="flex h-14 w-20 items-center justify-center rounded border border-dashed border-slate-300 text-center text-xs text-slate-500">No credential</div>}
                <div className="flex flex-col items-start gap-1">
                  <button type="button" onClick={() => credentialImageRef.current?.click()} disabled={uploadingImage !== null} className="text-sm font-semibold text-cyan-700 hover:underline disabled:opacity-50">{uploadingImage === 'credential' ? 'Uploading…' : formData.credential_image_path ? 'Replace image' : 'Upload image'}</button>
                  {formData.credential_image_path && <button type="button" onClick={() => setFormData((current) => ({ ...current, credential_image_path: '' }))} className="text-xs font-medium text-rose-600 hover:underline">Remove</button>}
                </div>
              </div>
            </div>
            {uploadError && <p className="sm:col-span-2 text-xs text-rose-600">{uploadError}</p>}
          </div>
          <div><label className="mb-1 block text-sm font-medium text-slate-700">Specialization</label><input value={formData.specialization} onChange={field('specialization')} className="input-field" placeholder="Mathematics, Science…" /></div>
          <div><label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
            <select value={formData.status} onChange={field('status')} className="input-field">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On leave</option>
            </select>
          </div>
          <div className="sm:col-span-2"><label className="mb-1 block text-sm font-medium text-slate-700">Salary structure</label>
            <select value={formData.salary_structure_id} onChange={field('salary_structure_id')} className="input-field"><option value="">No structure assigned</option>{salaryStructures.filter((structure) => structure.is_active).map((structure) => <option key={structure.id} value={structure.id}>{structure.name} — {structure.currency} {structure.monthly_salary}/month</option>)}</select>
            <p className="mt-1 text-xs text-slate-500">Payroll uses this as the default monthly salary. It can be adjusted when a monthly payroll is created.</p>
          </div>

          {/* ── Classes assigned to this teacher (all roles) ── */}
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Classes assigned to this teacher</label>
            {classes.length === 0 ? (
              <p className="text-xs text-slate-400">No classes found. Add classes first.</p>
            ) : (
              <div className="max-h-44 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
                {classes.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 accent-cyan-600"
                      checked={formData.class_ids.includes(c.id)}
                      onChange={() => toggleClass(c.id)}
                    />
                    <span className="text-sm text-slate-700">
                      {c.name}{c.section ? ` — ${c.section}` : ''}
                    </span>
                  </label>
                ))}
              </div>
            )}
            {formData.class_ids.length > 0 && (
              <p className="mt-1 text-xs text-slate-500">{formData.class_ids.length} class{formData.class_ids.length !== 1 ? 'es' : ''} selected</p>
            )}
          </div>

          {/* ── Sponsored class — class-sponsor / class-teacher roles ── */}
          {isSponsorRole && (
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Sponsored class (home class)</label>
              <select value={formData.sponsor_class_id} onChange={field('sponsor_class_id')} className="input-field">
                <option value="">No sponsored class</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.section ? ` — ${c.section}` : ''}</option>)}
              </select>
              <p className="mt-1 text-xs text-slate-500">The sponsored class is the teacher's home class. They compile the mark sheet and send it to the VPI for approval.</p>
            </div>
          )}

          {/* ── Subject + class assignments — subject-teacher role ── */}
          {isSubjectRole && (
            <div className="sm:col-span-2 space-y-2">
              <label className="block text-sm font-medium text-slate-700">Subject and class assignments</label>
              <p className="text-xs text-slate-500">Assign this teacher to specific subjects within specific classes.</p>
              {formData.subject_assignments.map((assignment, index) => (
                <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <select value={assignment.class_id} onChange={(e) => setFormData((f) => ({ ...f, subject_assignments: f.subject_assignments.map((a, i) => i === index ? { ...a, class_id: e.target.value } : a) }))} className="input-field">
                    <option value="">Class</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.section ? ` — ${c.section}` : ''}</option>)}
                  </select>
                  <select value={assignment.subject_id} onChange={(e) => setFormData((f) => ({ ...f, subject_assignments: f.subject_assignments.map((a, i) => i === index ? { ...a, subject_id: e.target.value } : a) }))} className="input-field">
                    <option value="">Subject</option>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
                  </select>
                  <button type="button" onClick={() => setFormData((f) => ({ ...f, subject_assignments: f.subject_assignments.filter((_, i) => i !== index) }))} className="px-2 text-sm font-semibold text-rose-600">Remove</button>
                </div>
              ))}
              <button type="button" onClick={() => setFormData((f) => ({ ...f, subject_assignments: [...f.subject_assignments, { class_id: '', subject_id: '' }] }))} className="text-sm font-semibold text-cyan-700">
                + Assign a subject to a class
              </button>
            </div>
          )}

          {/* ── If no user account is linked yet, show a note about assigning roles ── */}
          {!formData.user_id && (
            <div className="sm:col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-semibold text-amber-800">Tip — link a user account to unlock role-specific fields</p>
              <p className="text-xs text-amber-700 mt-0.5">Select a user account above. If the linked user has the <strong>class-sponsor</strong> role, the sponsored class field appears. If they have <strong>subject-teacher</strong>, the subject assignment builder appears.</p>
            </div>
          )}
        </div>
      </FormModal>
    </div>
  );
}
