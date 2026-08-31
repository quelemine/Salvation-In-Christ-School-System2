import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import ApplicationHeader, { FormTitle } from '../components/application/ApplicationHeader';
import ApplicationFooter from '../components/application/ApplicationFooter';
import StudentInfoSection, { sec, secTitle, row, lbl, fld, fullFld } from '../components/application/StudentInfoSection';
import ParentGuardianSection from '../components/application/ParentGuardianSection';
import OfficialUseSection from '../components/application/OfficialUseSection';

// ── Additional info section (inline, not extracted to keep it simple) ────────
function AdditionalInfoSection({ data, onChange, readOnly }: {
  data: Record<string, string>; onChange: (k: string, v: string) => void; readOnly?: boolean;
}) {
  const f = (k: string) => data[k] ?? '';
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => onChange(k, e.target.value);
  return (
    <section className="application-section application-additional-info" style={sec}>
      <div style={secTitle}>C. Additional Information</div>

      <div style={row}>
        <label style={lbl}>
          Does your child have any illness?
          {readOnly
            ? <input style={fld} value={f('has_illness') === 'true' ? 'Yes' : 'No'} readOnly />
            : <select style={fld} value={f('has_illness')} onChange={set('has_illness')}>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
          }
        </label>
        <label style={{ ...lbl, flex: 2 }}>
          If yes, please explain:
          <input style={fld} value={f('illness_details')} onChange={set('illness_details')} readOnly={readOnly} />
        </label>
      </div>

      <div style={row}>
        <label style={lbl}>
          Emergency Contact Name:
          <input style={fld} value={f('emergency_contact_name')} onChange={set('emergency_contact_name')} readOnly={readOnly} />
        </label>
        <label style={lbl}>
          Emergency Contact Phone:
          <input style={fld} value={f('emergency_contact_phone')} onChange={set('emergency_contact_phone')} readOnly={readOnly} />
        </label>
      </div>

      <label style={{ ...lbl, width: '100%', marginBottom: 10 }}>
        Sports / Extracurricular Interests:
        <input style={fullFld} value={f('sports_interest')} onChange={set('sports_interest')} readOnly={readOnly} />
      </label>

      <label style={{ ...lbl, width: '100%' }}>
        Additional Notes:
        {readOnly
          ? <input style={fullFld} value={f('additional_notes')} readOnly />
          : <textarea
              style={{ ...fld, resize: 'vertical', minHeight: 52 }}
              value={f('additional_notes')}
              onChange={set('additional_notes')}
            />
        }
      </label>
    </section>
  );
}

// ── Form type ─────────────────────────────────────────────────────────────────
type FormData = Record<string, string>;

const EMPTY: FormData = {
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
  username: '', default_password: '',
};

function statusBadge(status: string) {
  const m: Record<string, string> = {
    pending:  'bg-amber-100 text-amber-800',
    approved: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-rose-100 text-rose-700',
  };
  return m[status] ?? 'bg-slate-100 text-slate-600';
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StudentApplicationForm() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get('id');   // ?id=42 opens existing student

  const [form, setForm] = useState<FormData>(EMPTY);
  const [photoUrl, setPhotoUrl] = useState('');
  const [classId, setClassId] = useState('');   // actual class_id FK
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [showGuidelines, setShowGuidelines] = useState(false);

  // Load existing student if editing
  useEffect(() => {
    if (!editId) return;
    setLoading(true);
    api.get(`/students/${editId}`)
      .then((res) => {
        const s = res.data;
        setForm({
          full_name:               `${s.first_name} ${s.last_name}`.trim(),
          gender:                  s.gender   ?? '',
          date_of_birth:           s.date_of_birth?.slice?.(0, 10) ?? '',
          place_of_birth:          s.place_of_birth ?? '',
          nationality:             s.nationality ?? 'Liberian',
          county:                  s.county ?? '',
          previous_school:         s.previous_school ?? '',
          grade_applying_for:      s.grade_applying_for ?? '',
          address:                 s.address ?? '',
          father_name:             s.father_name ?? '',
          mother_name:             s.mother_name ?? '',
          father_occupation:       s.father_occupation ?? '',
          mother_occupation:       s.mother_occupation ?? '',
          father_contact:          s.father_contact ?? '',
          mother_contact:          s.mother_contact ?? '',
          parent_address:          s.parent_address ?? '',
          has_illness:             s.has_illness ? 'true' : 'false',
          illness_details:         s.illness_details ?? '',
          emergency_contact_name:  s.emergency_contact_name ?? '',
          emergency_contact_phone: s.emergency_contact_phone ?? '',
          sports_interest:         s.sports_interest ?? '',
          additional_notes:        s.additional_notes ?? '',
          student_id:              s.student_id ?? '',
          registration_number:     s.registration_number ?? '',
          class_assigned:          s.class_assigned ?? s.class?.name ?? '',
          admission_date:          s.admission_date?.slice?.(0, 10) ?? '',
          approved_by_registrar:   s.approved_by_registrar ?? '',
          approved_by_principal:   s.approved_by_principal ?? '',
          approval_date:           s.approval_date?.slice?.(0, 10) ?? '',
          application_status:      s.application_status ?? 'pending',
          username:               s.user?.username ?? '',
          default_password:        '',
        });
        if (s.photo_url) setPhotoUrl(s.photo_url);
        if (s.class_id) setClassId(String(s.class_id));
      })
      .catch(() => notify(false, 'Failed to load student record.'))
      .finally(() => setLoading(false));
  }, [editId]);

  const set = (key: string, value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    setMissingFields((fields) => fields.filter((field) => field !== key));
  };

  const notify = (ok: boolean, text: string) => {
    setMsg({ ok, text }); setTimeout(() => setMsg(null), 5000);
  };

  const handleSave = async () => {
    const nameParts = form.full_name.trim().split(' ');
    const first_name = nameParts[0] || '';
    const last_name  = nameParts.slice(1).join(' ') || '_';

    const missing = [!first_name && 'full_name', !form.gender && 'gender', !form.date_of_birth && 'date_of_birth'].filter(Boolean) as string[];
    if (missing.length > 0) {
      setMissingFields(missing);
      notify(false, 'Please complete the highlighted fields before saving.');
      return;
    }
    setMissingFields([]);

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        first_name, last_name,
        gender:                  form.gender.toLowerCase(),   // API expects lowercase
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
      };

      if (isAdmin) {
        payload.student_id          = form.student_id || undefined;
        payload.class_id            = classId ? Number(classId) : undefined;
        payload.class_assigned      = form.class_assigned;
        payload.approved_by_registrar = form.approved_by_registrar;
        payload.approved_by_principal = form.approved_by_principal;
        payload.approval_date       = form.approval_date || undefined;
        payload.application_status  = form.application_status;
        if (form.username) payload.username = form.username;
        if (form.default_password) payload.password = form.default_password;
      } else {
        payload.student_id         = undefined;  // backend auto-generates STU-YYYY-NNN
        payload.application_status = 'pending';
      }

      if (editId) {
        await api.put(`/students/${editId}`, payload);
        notify(true, 'Application updated successfully and saved to the student database.');
        setForm(EMPTY);
        setPhotoUrl('');
        setClassId('');
        navigate('/student-application');
      } else {
        const res = await api.post('/students', payload);
        const saved = res.data;
        notify(true, `Application submitted and saved! Student ID: ${saved.student_id}. The admin will review your application.`);
        setForm(EMPTY);
        setPhotoUrl('');
        setClassId('');
      }
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      const msg = errors ? Object.values(errors).flat().join(' ') : (err.response?.data?.message || 'Failed to save. Please check all required fields.');
      notify(false, msg);
    } finally { setSaving(false); }
  };

  if (loading) return <p className="py-12 text-center text-sm text-slate-500">Loading application…</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-800 uppercase tracking-widest">
                  Registration
                </span>
                {editId && (
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(form.application_status)}`}>
                    {form.application_status.charAt(0).toUpperCase() + form.application_status.slice(1)}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                Student Application Form
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                {editId 
                  ? 'Edit the student application details below. All changes will be saved to the database.'
                  : 'Complete all sections to submit a new student application. The administration will review and approve your application.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => window.print()}
                className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
              >
                🖨️ Print Form
              </button>
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="inline-flex items-center rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving…
                  </>
                ) : editId ? '💾 Save Changes' : '📤 Submit Application'}
              </button>
            </div>
          </div>

          {msg && (
            <div className={`mt-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
              msg.ok 
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800' 
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}>
              <span className="mt-0.5 shrink-0 text-lg">{msg.ok ? '✓' : '⚠'}</span>
              <span>{msg.text}</span>
              <button 
                onClick={() => setMsg(null)}
                className="ml-auto shrink-0 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Form Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div
          id="student-app-form"
          className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden"
          style={{
            fontFamily: '"Times New Roman", serif',
          }}
        >
          {/* Form Header */}
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-cyan-50 px-8 py-6">
            <div style={{ position: 'relative', zIndex: 1 }}>
              <ApplicationHeader />
              <FormTitle title="Student Application Form" />
            </div>
          </div>

          {/* Form Content */}
          <div className="px-8 py-8 space-y-8">
            <StudentInfoSection
              data={form} onChange={set}
              photoUrl={photoUrl} onPhotoChange={setPhotoUrl}
              isNewStudent={!editId}
              missingFields={missingFields}
            />

            <ParentGuardianSection
              data={form} onChange={set}
            />

            <AdditionalInfoSection
              data={form} onChange={set}
            />

            <OfficialUseSection
              data={form} onChange={set}
              classId={classId}
              onClassIdChange={setClassId}
              isAdmin={isAdmin}
            />
          </div>

          {/* Form Footer */}
          <div className="border-t border-slate-200 bg-slate-50 px-8 py-6">
            <ApplicationFooter />
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
              <span className="text-lg">💡</span>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-slate-900">Need Help?</h3>
              <p className="mt-1 text-sm text-slate-600">
                If you have questions about the application process, please contact the school administration office or visit our help desk.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button 
                  onClick={() => window.location.href = '/helpdesk'}
                  className="inline-flex items-center rounded-lg bg-slate-950 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-700 transition-colors cursor-pointer"
                >
                  Contact Support
                </button>
                <button 
                  onClick={() => setShowGuidelines(true)}
                  className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  View Guidelines
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-xs text-slate-500">
            © {new Date().getFullYear()} Salvation In Christ School System. All rights reserved.
          </p>
        </div>
      </div>

      {/* Guidelines Modal */}
      {showGuidelines && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">Application Guidelines</h3>
              <button 
                onClick={() => setShowGuidelines(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4 text-sm text-slate-600">
                <div>
                  <h4 className="font-semibold text-slate-900">1. Eligibility</h4>
                  <p>Students must meet the age requirements for the grade they are applying for. Previous school records may be required.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">2. Required Documents</h4>
                  <p>Please have the following documents ready: birth certificate, previous school transcripts, parent/guardian ID, and recent passport photo.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">3. Parent/Guardian Information</h4>
                  <p>Accurate contact information for at least one parent or guardian is required for communication purposes.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">4. Health Information</h4>
                  <p>Any medical conditions or allergies should be disclosed to ensure proper care and emergency response.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">5. Application Process</h4>
                  <p>Submit the complete application form. The school will review and contact you within 3-5 business days regarding approval status.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">6. Contact Information</h4>
                  <p>For questions, contact the school administration office or visit our help desk.</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end border-t border-slate-200 px-6 py-4">
              <button 
                onClick={() => setShowGuidelines(false)}
                className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
