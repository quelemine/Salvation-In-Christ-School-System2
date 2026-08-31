import { useEffect, useState } from 'react';
import api from '../../services/api';
import { sec, secTitle, row, lbl, fld } from './StudentInfoSection';

type ClassOption = { id: number; name: string; section?: string };

interface Props {
  data: Record<string, string>;
  onChange: (key: string, value: string) => void;
  classId?: string;           // the actual class_id to save
  onClassIdChange?: (id: string) => void;
  readOnly?: boolean;
  isAdmin?: boolean;
}

const sigLine: React.CSSProperties = {
  marginTop: 28, fontSize: 14, fontFamily: '"Times New Roman", serif',
  borderTop: '1px solid #555', paddingTop: 4, display: 'flex',
  justifyContent: 'space-between', alignItems: 'flex-end',
};

function SignatureLine({ label, name, date }: { label: string; name: string; date: string }) {
  const displayDate = date ? new Date(`${date}T00:00:00`).toLocaleDateString() : '____________';
  return (
    <div style={sigLine}>
      <span>
        {label} Signature:{' '}
        <span style={{ fontStyle: name ? 'italic' : 'normal', fontSize: name ? 17 : undefined }}>
          {name || '____________________________'}
        </span>
      </span>
      <span>Date: {displayDate}</span>
    </div>
  );
}

export default function OfficialUseSection({ data, onChange, classId, onClassIdChange, readOnly, isAdmin }: Props) {
  const f = (key: string) => data[key] ?? '';
  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange(key, e.target.value);
  const editable = isAdmin && !readOnly;
  const setApplicationStatus = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const status = event.target.value;
    onChange('application_status', status);
    // Approval records should carry a date even when the administrator does not
    // enter one manually. The date remains editable afterwards.
    if (status === 'approved' && !f('approval_date')) {
      onChange('approval_date', new Date().toISOString().slice(0, 10));
    }
  };

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [nextId, setNextId] = useState('');
  const [nextRegistrationNumber, setNextRegistrationNumber] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    // Load classes for dropdown
    api.get('/classes').then((res) => {
      const raw = res.data;
      setClasses(Array.isArray(raw) ? raw : raw.data ?? []);
    }).catch(() => {});

    // Fetch next sequential student ID only for new records (no student_id yet)
    if (!f('student_id')) {
      api.get('/students/next-id').then((res) => {
        setNextId(res.data.student_id);
        setNextRegistrationNumber(res.data.registration_number ?? '');
        onChange('student_id', res.data.student_id);
      }).catch(() => {});
    }
  }, [isAdmin]);

  return (
    <section className="application-section application-official-use" style={{ ...sec, marginTop: 18, background: isAdmin ? '#fffdf5' : '#f9f9f9', borderColor: '#888' }}>
      <div style={{ ...secTitle, background: '#ddd', borderBottom: '1px solid #aaa' }}>
        D. OFFICIAL USE ONLY
        {!isAdmin && (
          <span style={{ fontSize: 11, color: '#c00', marginLeft: 8 }}>(Admin access required)</span>
        )}
      </div>

      {!isAdmin && (
        <div style={{ textAlign: 'center', padding: '16px 0', color: '#888', fontSize: 13 }}>
          🔒 This section is restricted to authorized administrators.
          <div style={{ marginTop: 6 }}>
          </div>
        </div>
      )}

      {/* Signature lines visible when printing even for non-admin */}
      {!isAdmin && readOnly && (
        <>
          <SignatureLine label="Registrar" name={f('approved_by_registrar')} date={f('approval_date')} />
          <SignatureLine label="Principal" name={f('approved_by_principal')} date={f('approval_date')} />
        </>
      )}

      {isAdmin && (
        <>
          {/* Student ID — auto-generated, read-only display */}
          <div style={{ ...row, alignItems: 'flex-end', marginBottom: 12 }}>
            <label style={lbl}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Student ID (Auto-generated):</span>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                borderBottom: '1px solid #555', paddingBottom: 2,
              }}>
                <span style={{
                  fontSize: 16, fontWeight: 700, letterSpacing: '0.05em',
                  color: '#0e7490', fontFamily: 'monospace',
                  padding: '2px 8px', background: '#ecfeff', borderRadius: 4,
                  border: '1px solid #a5f3fc',
                }}>
                  {f('student_id') || nextId || 'STU-2026-???'}
                </span>
                <span style={{ fontSize: 10, color: '#888' }}>Generated automatically</span>
              </div>
            </label>
            <label style={lbl}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Registration Number (Auto-generated):</span>
              <div style={{ ...fld, minHeight: 30, padding: '5px 8px', background: '#f8fafc', color: '#0f172a', fontFamily: 'monospace', fontWeight: 700 }}>
                {f('registration_number') || nextRegistrationNumber || 'REG-2026-???'}
              </div>
              <span style={{ display: 'block', marginTop: 3, fontSize: 10, color: '#888' }}>Assigned automatically when the student is saved</span>
            </label>
          </div>

          {/* Class Assigned — dropdown */}
          <div style={row}>
            <label style={lbl}>
              Class Assigned:
              {editable
                ? <select
                    style={fld}
                    value={classId ?? ''}
                    onChange={(e) => {
                      const id = e.target.value;
                      onClassIdChange?.(id);
                      const cls = classes.find((c) => String(c.id) === id);
                      if (cls) onChange('class_assigned', cls.name + (cls.section ? ` - ${cls.section}` : ''));
                    }}
                  >
                    <option value="">— Select class —</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}{c.section ? ` - ${c.section}` : ''}
                      </option>
                    ))}
                  </select>
                : <input style={fld} value={f('class_assigned')} readOnly />
              }
            </label>
            <label style={lbl}>
              Admission Date:
              <input style={fld} type={editable ? 'date' : 'text'} value={f('admission_date')}
                onChange={set('admission_date')} readOnly={!editable} />
            </label>
          </div>

          {/* Approvals */}
          <div style={row}>
            <label style={lbl}>
              Registrar Signature (name):
              <input style={fld} value={f('approved_by_registrar')} onChange={set('approved_by_registrar')} readOnly={!editable} placeholder="Registrar's full name" />
            </label>
            <label style={lbl}>
              Principal Signature (name):
              <input style={fld} value={f('approved_by_principal')} onChange={set('approved_by_principal')} readOnly={!editable} placeholder="Principal's full name" />
            </label>
          </div>

          {/* Approval date + Status */}
          <div style={row}>
            <label style={lbl}>
              Approval Date:
              <input style={fld} type={editable ? 'date' : 'text'} value={f('approval_date')}
                onChange={set('approval_date')} readOnly={!editable} />
            </label>
            <label style={lbl}>
              Application Status:
              {editable
                ? <select style={fld} value={f('application_status')} onChange={setApplicationStatus}>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                : <input style={fld} value={f('application_status') || 'pending'} readOnly />
              }
            </label>
          </div>

          {/* Signature lines */}
          <SignatureLine label="Registrar" name={f('approved_by_registrar')} date={f('approval_date')} />
          <SignatureLine label="Principal" name={f('approved_by_principal')} date={f('approval_date')} />
        </>
      )}
    </section>
  );
}
