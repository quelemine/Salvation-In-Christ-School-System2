import { useRef, useEffect, useState } from 'react';
import api from '../../services/api';

// ── Shared inline styles ──────────────────────────────────────────────────────
export const sec: React.CSSProperties = {
  border: '1px solid #555', padding: '12px 14px', marginTop: 14,
  fontFamily: '"Times New Roman", serif', position: 'relative',
};
export const secTitle: React.CSSProperties = {
  textAlign: 'center', background: '#eee', padding: '4px 8px',
  margin: '-12px -14px 10px', fontSize: 15, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.05em',
  borderBottom: '1px solid #bbb',
};
export const row: React.CSSProperties = { display: 'flex', gap: 18, marginBottom: 10, flexWrap: 'wrap' };
export const lbl: React.CSSProperties = {
  flex: 1, minWidth: 160, fontSize: 14, fontFamily: '"Times New Roman", serif',
  display: 'flex', flexDirection: 'column', gap: 2,
};
export const fld: React.CSSProperties = {
  background: 'transparent', outline: 'none', fontSize: 14,
  width: '100%', padding: '2px 0', fontFamily: '"Times New Roman", serif',
  border: 'none', borderBottom: '1px solid #555',
};
export const fullFld: React.CSSProperties = { ...fld, width: '100%' };

// Liberian counties
const LIBERIAN_COUNTIES = [
  'Bomi', 'Bong', 'Gbarpolu', 'Grand Bassa', 'Grand Cape Mount',
  'Grand Gedeh', 'Grand Kru', 'Lofa', 'Margibi', 'Maryland',
  'Montserrado', 'Nimba', 'River Cess', 'River Gee', 'Sinoe',
];

type ClassOption = { id: number; name: string; section?: string };

interface Props {
  data: Record<string, string>;
  onChange: (key: string, value: string) => void;
  photoUrl: string;
  onPhotoChange: (url: string) => void;
  readOnly?: boolean;
  isNewStudent?: boolean;          // true = show document upload section
  classes?: ClassOption[];
  missingFields?: string[];
}

export default function StudentInfoSection({ data, onChange, photoUrl, onPhotoChange, readOnly, isNewStudent = true, classes: classesProp, missingFields = [] }: Props) {
  const photoRef   = useRef<HTMLInputElement>(null);
  const docRef     = useRef<HTMLInputElement>(null);
  const [classes, setClasses] = useState<ClassOption[]>(classesProp ?? []);
  const [docName, setDocName] = useState<string>(data['prev_doc_name'] ?? '');

  useEffect(() => {
    if (classesProp) { setClasses(classesProp); return; }
    if (readOnly) return;
    api.get('/classes').then((res) => {
      const raw = res.data;
      setClasses(Array.isArray(raw) ? raw : raw.data ?? []);
    }).catch(() => {});
  }, [classesProp, readOnly]);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onPhotoChange(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDoc = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocName(file.name);
    onChange('prev_doc_name', file.name);
    const reader = new FileReader();
    reader.onload = (ev) => onChange('prev_doc_data', ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const f = (key: string) => data[key] ?? '';
  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange(key, e.target.value);
  const invalid = (key: string): React.CSSProperties => missingFields.includes(key) ? { borderBottom: '2px solid #dc2626', background: '#fef2f2' } : {};

  return (
    <section className="application-section application-student-info" style={sec}>
      <div style={secTitle}>A. Student Information</div>
      {!readOnly && missingFields.length > 0 && <p style={{ margin: '0 0 10px', fontSize: 12, color: '#b91c1c', fontFamily: 'system-ui, sans-serif' }}>Please complete the highlighted fields.</p>}

      {/* Photo box — right-floated */}
      <div style={{ float: 'right', marginLeft: 14, marginBottom: 10, textAlign: 'center' }}>
        <div
          onClick={() => !readOnly && photoRef.current?.click()}
          style={{
            width: 90, height: 105, border: '1.5px solid #555',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', cursor: readOnly ? 'default' : 'pointer',
            background: '#f9f9f9', fontSize: 11, color: '#888',
          }}
        >
          {photoUrl
            ? <img src={photoUrl} alt="Student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ textAlign: 'center', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {readOnly ? 'PHOTO' : '📷\nUpload Photo'}
              </span>
          }
        </div>
        {!readOnly && <p style={{ fontSize: 9, color: '#999', marginTop: 3 }}>Click to upload</p>}
        <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
      </div>

      {/* Full name + Gender */}
      <div style={row}>
        <label style={{ ...lbl, flex: 2 }}>
          Full Name:
          <input style={{ ...fld, ...invalid('full_name') }} value={f('full_name')} onChange={set('full_name')} readOnly={readOnly}
            placeholder={readOnly ? '' : 'First Middle Last'} />
        </label>
        <label style={lbl}>
          Gender:
          {readOnly
            ? <input style={fld} value={f('gender')} readOnly />
            : <select style={{ ...fld, ...invalid('gender') }} value={f('gender')} onChange={set('gender')}>
                <option value="">— Select —</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
          }
        </label>
      </div>

      {/* DOB + Place of birth */}
      <div style={row}>
        <label style={lbl}>
          Date of Birth:
          <input style={{ ...fld, ...invalid('date_of_birth') }} type={readOnly ? 'text' : 'date'} value={f('date_of_birth')} onChange={set('date_of_birth')} readOnly={readOnly} />
        </label>
        <label style={lbl}>
          Place of Birth:
          <input style={fld} value={f('place_of_birth')} onChange={set('place_of_birth')} readOnly={readOnly} placeholder="City / Town" />
        </label>
      </div>

      {/* Nationality + County */}
      <div style={row}>
        <label style={lbl}>
          Nationality:
          <input style={fld} value={f('nationality')} onChange={set('nationality')} readOnly={readOnly} />
        </label>
        <label style={lbl}>
          County:
          {readOnly
            ? <input style={fld} value={f('county')} readOnly />
            : <select style={fld} value={f('county')} onChange={set('county')}>
                <option value="">— Select county —</option>
                {LIBERIAN_COUNTIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
          }
        </label>
      </div>

      {/* Previous school + Grade applying for */}
      <div style={row}>
        <label style={lbl}>
          Previous School:
          <input style={fld} value={f('previous_school')} onChange={set('previous_school')} readOnly={readOnly}
            placeholder="Name of last school attended" />
        </label>
        <label style={lbl}>
          Grade / Class Applying For:
          {readOnly
            ? <input style={fld} value={f('grade_applying_for')} readOnly />
            : <select style={fld} value={f('grade_applying_for')} onChange={set('grade_applying_for')}>
                <option value="">— Select class —</option>
                {classes.length > 0
                  ? classes.map((c) => (
                      <option key={c.id} value={c.name + (c.section ? ` - ${c.section}` : '')}>
                        {c.name}{c.section ? ` - ${c.section}` : ''}
                      </option>
                    ))
                  : ['Nursery', 'LKG', 'UKG', 'Grade 1', 'Grade 2', 'Grade 3',
                     'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8',
                     'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))
                }
              </select>
          }
        </label>
      </div>

      {/* Address full width */}
      <div style={{ clear: 'both' }}>
        <label style={{ ...lbl, width: '100%' }}>
          Home Address:
          <input style={fullFld} value={f('address')} onChange={set('address')} readOnly={readOnly}
            placeholder="Street, Community, City" />
        </label>
      </div>

      {/* Previous school document — only for new students, hidden when readOnly/print */}
      {isNewStudent && !readOnly && (
        <div style={{ marginTop: 14, padding: '10px 12px', border: '1px dashed #94a3b8', borderRadius: 6, background: '#f8fafc' }}>
          <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, fontFamily: '"Times New Roman", serif', color: '#0e7490' }}>
            📎 Previous School Document <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>(Optional)</span>
          </p>
          <p style={{ fontSize: 11, color: '#64748b', marginBottom: 8, fontFamily: '"Times New Roman", serif' }}>
            New students may attach a document from their previous school (report card, transfer letter, transcript). Old/returning students do not need to submit this.
          </p>
          <input ref={docRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{ display: 'none' }} onChange={handleDoc} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={() => docRef.current?.click()}
              style={{
                padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: '1px solid #0891b2', borderRadius: 5, background: '#ecfeff', color: '#0e7490',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {docName ? '↻ Replace document' : '+ Attach document'}
            </button>
            {docName && (
              <span style={{ fontSize: 12, color: '#059669', fontFamily: 'system-ui, sans-serif' }}>
                ✓ {docName}
                <button
                  type="button"
                  onClick={() => { setDocName(''); onChange('prev_doc_name', ''); onChange('prev_doc_data', ''); if (docRef.current) docRef.current.value = ''; }}
                  style={{ marginLeft: 6, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}
                >✕</button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Show attached doc name in print/readOnly */}
      {isNewStudent && readOnly && data['prev_doc_name'] && (
        <p style={{ marginTop: 8, fontSize: 12, color: '#0e7490', fontFamily: '"Times New Roman", serif' }}>
          📎 Attached document: {data['prev_doc_name']}
        </p>
      )}
    </section>
  );
}
