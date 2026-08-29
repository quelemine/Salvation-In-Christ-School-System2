import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
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
  const { settings } = useSettingsStore();
  const isAdmin = user?.role?.slug === 'admin';
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');   // ?id=42 opens existing student

  const [form, setForm] = useState<FormData>(EMPTY);
  const [photoUrl, setPhotoUrl] = useState('');
  const [classId, setClassId] = useState('');   // actual class_id FK
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPrintPreview, setIsPrintPreview] = useState(false);

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
          class_assigned:          s.class_assigned ?? s.class?.name ?? '',          admission_date:          s.admission_date?.slice?.(0, 10) ?? '',
          approved_by_registrar:   s.approved_by_registrar ?? '',
          approved_by_principal:   s.approved_by_principal ?? '',
          approval_date:           s.approval_date?.slice?.(0, 10) ?? '',
          application_status:      s.application_status ?? 'pending',
        });
        if (s.photo_url) setPhotoUrl(s.photo_url);
        if (s.class_id) setClassId(String(s.class_id));
      })
      .catch(() => notify(false, 'Failed to load student record.'))
      .finally(() => setLoading(false));
  }, [editId]);

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const notify = (ok: boolean, text: string) => {
    setMsg({ ok, text }); setTimeout(() => setMsg(null), 5000);
  };

  const handleSave = async () => {
    const nameParts = form.full_name.trim().split(' ');
    const first_name = nameParts[0] || '';
    const last_name  = nameParts.slice(1).join(' ') || '_';

    if (!first_name) { notify(false, 'Full name is required.'); return; }
    if (!form.gender) { notify(false, 'Gender is required.'); return; }
    if (!form.date_of_birth) { notify(false, 'Date of birth is required.'); return; }

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
        payload.registration_number = form.registration_number;
        payload.class_assigned      = form.class_assigned;
        payload.approved_by_registrar = form.approved_by_registrar;
        payload.approved_by_principal = form.approved_by_principal;
        payload.approval_date       = form.approval_date || undefined;
        payload.application_status  = form.application_status;
      } else {
        payload.student_id         = undefined;  // backend auto-generates STU-YYYY-NNN
        payload.application_status = 'pending';
      }

      if (editId) {
        await api.put(`/students/${editId}`, payload);
        notify(true, 'Application updated successfully and saved to the student database.');
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

  const handlePrint = () => {
    setIsPrintPreview(true);
    // Wait for React to render the read-only, print-ready version of the form.
    requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
  };

  useEffect(() => {
    const restoreEditing = () => setIsPrintPreview(false);
    window.addEventListener('afterprint', restoreEditing);
    return () => window.removeEventListener('afterprint', restoreEditing);
  }, []);

  if (loading) return <p className="py-12 text-center text-sm text-slate-500">Loading application…</p>;

  const logoUrl = settings.branding.logoUrl;

  return (
    <div>
      {/* Print CSS */}
      <style>{`
        @media print {
          .app-screen-only { display: none !important; }
          body { background: #fff !important; }
          body * { visibility: hidden !important; }
          #student-app-form {
            visibility: visible !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            border: 1px solid #444 !important;
          }
          #student-app-form * { visibility: visible !important; }
          /* Keep each form section intact. Page two starts with section C so
             the additional information and official approval area stay together. */
          .application-section {
            break-inside: avoid-page;
            page-break-inside: avoid;
          }
          .application-additional-info {
            break-before: page;
            page-break-before: always;
            margin-top: 0 !important;
          }
          .application-official-use {
            break-before: auto;
            page-break-before: auto;
          }
          .application-school-header,
          .app-form-title,
          .application-footer {
            break-inside: avoid-page;
            page-break-inside: avoid;
          }
          @page { size: A4 portrait; margin: 8mm; }
        }
        #student-app-form { background: white; }
      `}</style>

      {/* Screen toolbar */}
      <div className="app-screen-only space-y-4 mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Registration</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Student Application Form</h1>
            <p className="mt-1 text-sm text-slate-500">
              {editId ? 'Editing existing application.' : 'Complete all sections and submit. The admin will review and approve your application.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {editId && (
              <span className={`self-start rounded-full px-3 py-1.5 text-xs font-semibold ${statusBadge(form.application_status)}`}>
                {form.application_status.charAt(0).toUpperCase() + form.application_status.slice(1)}
              </span>
            )}
            <button onClick={handlePrint}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              🖨 Print / PDF
            </button>
            <button onClick={handleSave} disabled={saving}
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50">
              {saving ? 'Saving…' : editId ? '💾 Save changes' : '📤 Submit application'}
            </button>
          </div>
        </div>

        {msg && (
          <div className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm font-medium ${
            msg.ok ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                   : 'border border-rose-200 bg-rose-50 text-rose-700'
          }`}>
            <span className="mt-0.5 shrink-0">{msg.ok ? '✓' : '⚠'}</span>
            {msg.text}
          </div>
        )}
      </div>

      {/* ── The printable form ── */}
      <div
        id="student-app-form"
        style={{
          width: '100%', maxWidth: 860, margin: '0 auto',
          padding: '20px 24px',
          background: 'white',
          border: '2px solid #444',
          fontFamily: '"Times New Roman", serif',
          position: 'relative',
          boxSizing: 'border-box',
        }}
      >
        {/* Watermark */}
        {logoUrl && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
            backgroundImage: `url("${logoUrl}")`,
            backgroundRepeat: 'no-repeat', backgroundPosition: 'center',
            backgroundSize: '420px', opacity: 0.07,
          }} />
        )}

        <div style={{ position: 'relative', zIndex: 1 }}>
          <ApplicationHeader />
          <FormTitle title="Student Application Form" />

          <StudentInfoSection
            data={form} onChange={set}
            photoUrl={photoUrl} onPhotoChange={setPhotoUrl}
            isNewStudent={!editId}
            readOnly={isPrintPreview}
          />

          <ParentGuardianSection
            data={form} onChange={set}
            readOnly={isPrintPreview}
          />

          <AdditionalInfoSection
            data={form} onChange={set}
            readOnly={isPrintPreview}
          />

          <OfficialUseSection
            data={form} onChange={set}
            classId={classId}
            onClassIdChange={setClassId}
            isAdmin={isAdmin}
            readOnly={isPrintPreview}
          />

          <ApplicationFooter />
        </div>
      </div>
    </div>
  );
}
