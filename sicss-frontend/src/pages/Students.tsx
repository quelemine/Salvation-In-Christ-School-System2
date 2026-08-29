import { useState, useEffect, useRef } from 'react';
import { studentService } from '../services/studentService';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import api from '../services/api';
import { authService } from '../services/authService';
import type { Student } from '../types';
import { syncManager } from '../sync/syncManager';
import ApplicationHeader, { FormTitle } from '../components/application/ApplicationHeader';
import ApplicationFooter from '../components/application/ApplicationFooter';
import StudentInfoSection, { sec, secTitle, row, lbl, fld, fullFld } from '../components/application/StudentInfoSection';
import ParentGuardianSection from '../components/application/ParentGuardianSection';
import OfficialUseSection from '../components/application/OfficialUseSection';

// ── Additional Info section (same as StudentApplicationForm) ─────────────────
function AdditionalInfoSection({ data, onChange }: {
  data: Record<string, string>; onChange: (k: string, v: string) => void;
}) {
  const f = (k: string) => data[k] ?? '';
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => onChange(k, e.target.value);
  return (
    <section style={sec}>
      <div style={secTitle}>C. Additional Information</div>
      <div style={row}>
        <label style={lbl}>
          Does your child have any illness?
          <select style={fld} value={f('has_illness')} onChange={set('has_illness')}>
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </label>
        <label style={{ ...lbl, flex: 2 }}>
          If yes, please explain:
          <input style={fld} value={f('illness_details')} onChange={set('illness_details')} />
        </label>
      </div>
      <div style={row}>
        <label style={lbl}>
          Emergency Contact Name:
          <input style={fld} value={f('emergency_contact_name')} onChange={set('emergency_contact_name')} />
        </label>
        <label style={lbl}>
          Emergency Contact Phone:
          <input style={fld} value={f('emergency_contact_phone')} onChange={set('emergency_contact_phone')} />
        </label>
      </div>
      <label style={{ ...lbl, width: '100%', marginBottom: 10 }}>
        Sports / Extracurricular Interests:
        <input style={fullFld} value={f('sports_interest')} onChange={set('sports_interest')} />
      </label>
      <label style={{ ...lbl, width: '100%' }}>
        Additional Notes:
        <textarea style={{ ...fld, resize: 'vertical', minHeight: 52 }} value={f('additional_notes')} onChange={set('additional_notes')} />
      </label>
    </section>
  );
}

// ── Empty form state ─────────────────────────────────────────────────────────
const EMPTY: Record<string, string> = {
  full_name: '', gender: '', date_of_birth: '', place_of_birth: '',
  nationality: 'Liberian', county: '', previous_school: '', grade_applying_for: '',
  address: '',
  father_name: '', mother_name: '', father_occupation: '', mother_occupation: '',
  father_contact: '', mother_contact: '', parent_address: '',
  has_illness: 'false', illness_details: '', emergency_contact_name: '',
  emergency_contact_phone: '', sports_interest: '', additional_notes: '',
  student_id: '', registration_number: '', class_assigned: '', admission_date: '',
  approved_by_registrar: '', approved_by_principal: '', approval_date: '',
  application_status: 'pending',
};

// ── Application form modal ────────────────────────────────────────────────────
function ApplicationModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { user } = useAuthStore();
  const { settings } = useSettingsStore();
  const isAdmin = user?.role?.slug === 'admin';
  const logoUrl = settings.branding.logoUrl;

  const [form, setForm] = useState<Record<string, string>>(EMPTY);
  const [photoUrl, setPhotoUrl] = useState('');
  const [classId, setClassId] = useState('');
  const [studentUsers, setStudentUsers] = useState<{ id: number; first_name: string; last_name: string; email: string; role?: { slug?: string } }[]>([]);
  const [studentUserId, setStudentUserId] = useState('');
  const [saving, setSaving] = useState(false);
  const [formMsg, setFormMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  useEffect(() => {
    if (isAdmin) authService.users().then((users) => setStudentUsers(users.filter((account: any) => account.role?.slug === 'student'))).catch(() => setStudentUsers([]));
  }, [isAdmin]);

  const handleSave = async () => {
    const nameParts = form.full_name.trim().split(' ');
    const first_name = nameParts[0] || '';
    const last_name  = nameParts.slice(1).join(' ') || '_';

    if (!first_name) { setFormMsg({ ok: false, text: 'Full name is required.' }); scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (!form.gender) { setFormMsg({ ok: false, text: 'Gender is required.' }); return; }
    if (!form.date_of_birth) { setFormMsg({ ok: false, text: 'Date of birth is required.' }); return; }

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        first_name, last_name,
        gender:                  form.gender.toLowerCase(),
        date_of_birth:           form.date_of_birth,
        place_of_birth:          form.place_of_birth,
        nationality:             form.nationality,
        county:                  form.county,
        previous_school:         form.previous_school,
        grade_applying_for:      form.grade_applying_for,
        address:                 form.address,
        father_name:             form.father_name,
        mother_name:             form.mother_name,
        father_occupation:       form.father_occupation,
        mother_occupation:       form.mother_occupation,
        father_contact:          form.father_contact,
        mother_contact:          form.mother_contact,
        parent_address:          form.parent_address,
        parent_guardian_name:    form.father_name || form.mother_name,
        parent_guardian_phone:   form.father_contact || form.mother_contact,
        has_illness:             form.has_illness === 'true',
        illness_details:         form.illness_details,
        emergency_contact_name:  form.emergency_contact_name,
        emergency_contact_phone: form.emergency_contact_phone,
        sports_interest:         form.sports_interest,
        additional_notes:        form.additional_notes,
        photo_url:               photoUrl || undefined,
        status:                  'active',
        admission_date:          form.admission_date || new Date().toISOString().split('T')[0],
        student_id:              form.student_id || undefined,
        user_id:                 studentUserId ? Number(studentUserId) : undefined,
        registration_number:     form.registration_number,
        class_id:                classId ? Number(classId) : undefined,
        class_assigned:          form.class_assigned,
        approved_by_registrar:   form.approved_by_registrar,
        approved_by_principal:   form.approved_by_principal,
        approval_date:           form.approval_date || undefined,
        application_status:      form.application_status || 'pending',
      };

      const res = await api.post('/students', payload);
      const saved = res.data;
      setFormMsg({ ok: true, text: `✓ Student saved — ID: ${saved.student_id}` });
        setTimeout(() => { onSaved(); onClose(); }, 1200);
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      const msg = errors ? Object.values(errors).flat().join(' ') : (err.response?.data?.message || 'Failed to save. Please check required fields.');
      setFormMsg({ ok: false, text: msg });
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-3 pt-6">
      <div className="w-full max-w-4xl">
        {/* Modal toolbar */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Registration</p>
            <h2 className="text-base font-bold text-slate-950">New Student Application</h2>
          </div>
          <div className="flex gap-2">
            {formMsg && (
              <span className={`self-center rounded-lg px-3 py-1.5 text-xs font-semibold ${
                formMsg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'
              }`}>
                {formMsg.text}
              </span>
            )}
            <button onClick={handleSave} disabled={saving}
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50">
              {saving ? 'Saving…' : '💾 Save student'}
            </button>
            <button onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </div>
        {isAdmin && <div className="mb-3 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm"><label className="block text-sm font-semibold text-slate-700">Link student account (optional)<select value={studentUserId} onChange={(e) => setStudentUserId(e.target.value)} className="input-field mt-1"><option value="">No linked account</option>{studentUsers.map((account) => <option key={account.id} value={account.id}>{account.first_name} {account.last_name} — {account.email}</option>)}</select></label></div>}

        {/* The actual application form */}
        <div ref={scrollRef}
          style={{
            width: '100%', background: 'white', border: '2px solid #444',
            padding: '20px 24px', fontFamily: '"Times New Roman", serif',
            position: 'relative', boxSizing: 'border-box', borderRadius: 4,
          }}
        >
          {/* Watermark */}
          {logoUrl && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
              backgroundImage: `url("${logoUrl}")`, backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center', backgroundSize: '400px', opacity: 0.07,
            }} />
          )}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <ApplicationHeader />
            <FormTitle title="Student Application Form" />
            <StudentInfoSection data={form} onChange={set} photoUrl={photoUrl} onPhotoChange={setPhotoUrl} isNewStudent={true} />
            <ParentGuardianSection data={form} onChange={set} />
            <AdditionalInfoSection data={form} onChange={set} />
            <OfficialUseSection data={form} onChange={set} classId={classId} onClassIdChange={setClassId} isAdmin={isAdmin} />
            <ApplicationFooter />
          </div>
        </div>

        <p className="mt-3 text-center text-xs text-slate-400">
          All sections are required for a complete application. The Official section is admin-only.
        </p>
      </div>
    </div>
  );
}

// ── Main Students page ────────────────────────────────────────────────────────
export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showAppModal, setShowAppModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    loadStudents();
    const up = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);

  const loadStudents = async () => {
    try {
      const response = await studentService.getAll();
      setStudents(response.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleSync = async () => { await syncManager.sync(); loadStudents(); };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this student record?')) return;
    try { await studentService.delete(id); setStudents((s) => s.filter((x) => x.id !== id)); }
    catch { /* silent */ }
  };

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !search || `${s.first_name} ${s.last_name} ${s.student_id}`.toLowerCase().includes(q);
    const matchStatus = !filterStatus || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5">
      {showAppModal && (
        <ApplicationModal onClose={() => setShowAppModal(false)} onSaved={loadStudents} />
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">People management</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Students</h1>
          <p className="mt-1 text-sm text-slate-500">{students.length} enrolled student{students.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleSync} disabled={!isOnline}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            ↻ Sync
          </button>
          <button onClick={() => setShowAppModal(true)}
            className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700">
            + Add student
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap gap-3 border-b border-slate-100 px-5 py-4">
          <input type="search" placeholder="Search by name or ID…" value={search}
            onChange={(e) => setSearch(e.target.value)} className="input-field max-w-xs text-sm" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field w-auto text-sm">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="graduated">Graduated</option>
            <option value="transferred">Transferred</option>
          </select>
          <span className="ml-auto self-center text-xs text-slate-400">{filtered.length} of {students.length}</span>
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-slate-500">Loading students…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  {['Student ID', 'Name', 'Class', 'Application', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-slate-400">No students found.</td></tr>
                ) : filtered.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{student.student_id}</td>
                    <td className="px-5 py-3 font-semibold text-slate-900">
                      {student.first_name} {student.last_name}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{student.class?.name || '—'}</td>
                    <td className="px-5 py-3">
                      {(() => {
                        const appStatus = (student as any).application_status || 'pending';
                        const cls = appStatus === 'approved' ? 'bg-emerald-100 text-emerald-800'
                          : appStatus === 'rejected' ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-800';
                        return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${cls}`}>{appStatus}</span>;
                      })()}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                        student.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>{student.status}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-3">
                        <a href={`/student-application?id=${student.id}`}
                          className="text-xs font-semibold text-cyan-700 hover:underline">
                          Edit
                        </a>
                        <button onClick={() => handleDelete(student.id)}
                          className="text-xs font-semibold text-rose-600 hover:underline">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
