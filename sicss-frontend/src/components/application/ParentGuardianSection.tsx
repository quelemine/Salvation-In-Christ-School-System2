import { sec, secTitle, row, lbl, fld, fullFld } from './StudentInfoSection';

interface Props {
  data: Record<string, string>;
  onChange: (key: string, value: string) => void;
  readOnly?: boolean;
}

export default function ParentGuardianSection({ data, onChange, readOnly }: Props) {
  const f = (key: string) => data[key] ?? '';
  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange(key, e.target.value);

  return (
    <section className="application-section application-parent-guardian" style={sec}>
      <div style={secTitle}>B. Name of Parents / Guardians</div>

      {/* Father + Mother */}
      <div style={row}>
        <label style={lbl}>
          Father / Guardian Name:
          <input style={fld} value={f('father_name')} onChange={set('father_name')} readOnly={readOnly} />
        </label>
        <label style={lbl}>
          Mother / Guardian Name:
          <input style={fld} value={f('mother_name')} onChange={set('mother_name')} readOnly={readOnly} />
        </label>
      </div>

      {/* Occupation + Contact */}
      <div style={row}>
        <label style={lbl}>
          Father's Occupation:
          <input style={fld} value={f('father_occupation')} onChange={set('father_occupation')} readOnly={readOnly} />
        </label>
        <label style={lbl}>
          Mother's Occupation:
          <input style={fld} value={f('mother_occupation')} onChange={set('mother_occupation')} readOnly={readOnly} />
        </label>
      </div>

      <div style={row}>
        <label style={lbl}>
          Father's Contact:
          <input style={fld} value={f('father_contact')} onChange={set('father_contact')} readOnly={readOnly} />
        </label>
        <label style={lbl}>
          Mother's Contact:
          <input style={fld} value={f('mother_contact')} onChange={set('mother_contact')} readOnly={readOnly} />
        </label>
      </div>

      {/* Parent address */}
      <label style={{ ...lbl, width: '100%' }}>
        Parent / Guardian Address:
        <input style={fullFld} value={f('parent_address')} onChange={set('parent_address')} readOnly={readOnly} />
      </label>
    </section>
  );
}
