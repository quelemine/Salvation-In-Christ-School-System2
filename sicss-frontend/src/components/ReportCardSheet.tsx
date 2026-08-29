/**
 * ReportCardSheet — mobile-responsive + printable
 *
 * Screen: stacked semesters, sticky subject column, large touch inputs,
 *         fluid clamp typography.
 * Print:  side-by-side A4 landscape via @media print, stamp + barcode shown.
 */
import React from 'react';
import {
  reportCardSubjects,
  SEM1_PERIODS,
  SEM2_PERIODS,
  semesterAvg,
  yearlyAvg,
  parseMark,
  scoreColor,
  type SubjectMarks,
} from '../services/reportCardService';
import { useSettingsStore } from '../store/settingsStore';
import Barcode from './Barcode';
import OfficialStamp from './OfficialStamp';

// ── Public types ──────────────────────────────────────────────────────────────
export interface SignatureImages {
  classSponsorSig?: string;
  principalSig?: string;
  stampOverride?: string;
}

export interface ReportCardSheetProps {
  studentName: string;
  studentId?: string;
  className?: string;
  teacherName?: string;
  academicYear?: string;
  marks: SubjectMarks;
  aggregate?: number | null;
  average?: number | null;
  rank?: number | null;
  totalInClass?: number | null;
  conduct?: string | null;
  conditionalSubjects?: string | null;
  promotedTo?: string | null;
  classSponsor?: string | null;
  principal?: string | null;
  closingDate?: string | null;
  signatures?: SignatureImages;
  editable?: boolean;
  /** Controls what prints: combined (default), sem1 only, sem2 only */
  printMode?: 'combined' | 'sem1' | 'sem2';
  onMarkChange?: (subject: string, period: string, value: string) => void;
  onFieldChange?: (field: string, value: string) => void;
}

// ── Style helpers ─────────────────────────────────────────────────────────────
function scoreStyle(value: string): React.CSSProperties {
  const n = parseMark(value);
  return { color: scoreColor(n), fontWeight: n !== null ? 700 : 400 };
}
function avgStyle(value: number | null): React.CSSProperties {
  return { color: scoreColor(value), fontWeight: value !== null ? 700 : 400 };
}

// ── Mobile/screen score input (50–100 validated) ─────────────────────────────
function ScoreInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const n = parseMark(value);

  // Validation: empty = ok, otherwise must be 50–100
  const isInvalid = n !== null && (n < 50 || n > 100);
  const color = isInvalid ? '#b91c1c' : scoreColor(n);   // red for invalid, normal colour otherwise

  const handleChange = (raw: string) => {
    // Allow clearing the field
    if (raw === '' || raw === '-') { onChange(''); return; }
    // Clamp silently only above 100 — below 50 we allow entry so the user
    // can type freely but we show the warning
    const num = Number(raw);
    if (num > 100) {
      onChange('100'); // hard-cap at 100
      return;
    }
    onChange(raw);
  };

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="number" min={50} max={100} inputMode="numeric" value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={(e) => {
          // On blur, if below 50 (and not empty) clear to empty so user re-enters
          const v = e.target.value;
          if (v !== '' && Number(v) < 50) onChange('');
        }}
        className="w-full rounded text-center text-sm font-semibold focus:outline-none focus:ring-1"
        style={{
          height: 36,
          color,
          fontWeight: n !== null ? 700 : 400,
          border: isInvalid ? '1.5px solid #ef4444' : '1px solid #e2e8f0',
          background: isInvalid ? '#fff5f5' : 'white',
          boxShadow: isInvalid ? '0 0 0 2px #fee2e2' : undefined,
          borderRadius: 4,
        }}
      />
      {/* Warning tooltip shown when out of range */}
      {isInvalid && (
        <div style={{
          position: 'absolute',
          bottom: '110%',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#7f1d1d',
          color: '#fff',
          fontSize: 10,
          fontWeight: 600,
          borderRadius: 5,
          padding: '4px 8px',
          whiteSpace: 'nowrap',
          zIndex: 50,
          pointerEvents: 'none',
          lineHeight: 1.4,
          boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
        }}>
          Grade must be between 50 and 100
          {/* Arrow */}
          <span style={{
            position: 'absolute',
            top: '100%', left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid #7f1d1d',
          }} />
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ReportCardSheet(props: ReportCardSheetProps) {
  const {
    studentName, studentId, className, teacherName, academicYear,
    marks, aggregate, average, rank, totalInClass, conduct,
    conditionalSubjects, promotedTo, classSponsor, principal, closingDate,
    signatures = {}, editable, printMode = 'combined', onMarkChange, onFieldChange,
  } = props;

  const { settings } = useSettingsStore();
  const { logoUrl, schoolName, schoolMotto, schoolAddress, schoolPhone } = settings.branding;

  const s1Avg = (s: string) => semesterAvg(marks[s] || {}, SEM1_PERIODS, 'Exam 1');
  const s2Avg = (s: string) => semesterAvg(marks[s] || {}, SEM2_PERIODS, 'Exam 2');
  const yrAvg = (s: string) => yearlyAvg(s1Avg(s), s2Avg(s));
  const gm = (s: string, p: string) => (marks[s]?.[p] ?? '').toString();

  const barcodeValue = [
    studentId || 'STU',
    (academicYear || '').replace(/[^0-9]/g, ''),
    aggregate != null ? String(aggregate) : '',
  ].filter(Boolean).join('-').toUpperCase();

  const isFinalized = !editable;

  const summaryRows: { label: string; value: string; field: string }[] = [
    { label: 'Aggregate',          value: aggregate != null ? String(aggregate) : '',          field: 'aggregate'    },
    { label: 'Average',            value: average != null ? String(average) : '',              field: 'average'      },
    { label: 'Total No. In Class', value: totalInClass != null ? String(totalInClass) : '',    field: 'totalInClass' },
    { label: 'Rank',               value: rank != null ? String(rank) : '',                    field: 'rank'         },
    { label: 'Conduct',            value: conduct ?? '',                                       field: 'conduct'      },
  ];

  return (
    <>
      {/* ── Responsive + print CSS ──────────────────────────────────────────── */}
      <style>{`
        /* ── Wrapper ─────────────────────────────────────────── */
        .rc-wrap {
          background: white;
          border: 3px double #333;
          border-radius: 4px;
          position: relative;
          overflow: hidden;
          font-family: "Times New Roman", serif;
        }

        /* ── Header ──────────────────────────────────────────── */
        .rc-head {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 16px 10px;
          border-bottom: 2px solid #ddd;
          text-align: center;
        }
        .rc-head-logo { height: 56px; object-fit: contain; flex-shrink: 0; }
        .rc-head-text h1 {
          font-size: clamp(13px, 3.5vw, 22px);
          font-weight: 900; text-transform: uppercase; margin: 0 0 2px;
          letter-spacing: 0.03em;
        }
        .rc-head-text p { font-size: clamp(10px, 2.2vw, 12px); color: #555; margin: 1px 0; }
        .rc-head-text h3 {
          font-size: clamp(11px, 2.8vw, 16px); font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.07em;
          margin: 5px 0 0; border-top: 1px solid #bbb; padding-top: 4px;
        }

        /* ── Student info ─────────────────────────────────────── */
        .rc-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-size: clamp(11px, 2.8vw, 14px);
          border-bottom: 2px solid #ddd;
        }
        .rc-info-cell {
          padding: 5px 10px;
          border-right: 1px solid #ddd;
          border-bottom: 1px solid #ddd;
        }
        .rc-info-cell:nth-child(even) { border-right: none; }
        .rc-info-full {
          grid-column: 1 / -1;
          padding: 5px 10px;
          border-bottom: 1px solid #ddd;
          font-size: clamp(11px, 2.8vw, 14px);
        }
        @media (min-width: 600px) {
          .rc-info { grid-template-columns: 2fr 1fr 1.2fr 0.8fr; }
          .rc-info-cell:nth-child(even) { border-right: 1px solid #ddd; }
          .rc-info-cell:last-of-type { border-right: none; }
        }

        /* ── Semesters ────────────────────────────────────────── */
        .rc-semesters { display: flex; flex-direction: column; }
        .rc-sem { padding: 10px 12px; }
        .rc-sem + .rc-sem { border-top: 2px solid #ddd; }
        @media (min-width: 1100px) {
          .rc-semesters { flex-direction: row; }
          .rc-sem { flex: 1; min-width: 0; }
          .rc-sem + .rc-sem { border-top: none; border-left: 2px solid #ddd; }
        }
        .rc-sem-title {
          text-align: center;
          font-size: clamp(15px, 4vw, 24px);
          font-style: italic; font-weight: 700;
          margin: 0 0 8px; padding-bottom: 5px;
          border-bottom: 1px solid #eee;
        }

        /* ── Grade table ──────────────────────────────────────── */
        .rc-tscroll {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border: 1px solid #bbb;
          border-radius: 3px;
          margin-bottom: 4px;
        }
        .rc-table {
          width: 100%;
          border-collapse: collapse;
          font-size: clamp(10px, 2.3vw, 14px);
          min-width: 360px;
        }
        .rc-table th {
          background: #e8e8e8;
          font-weight: bold;
          text-align: center;
          padding: 4px 3px;
          border: 1px solid #999;
          white-space: nowrap;
          font-size: clamp(9px, 2vw, 12px);
        }
        .rc-table td {
          border: 1px solid #bbb;
          padding: 2px 3px;
          height: 30px;
          text-align: center;
          vertical-align: middle;
        }
        .rc-table td.rc-subj {
          text-align: left;
          padding-left: 8px;
          white-space: nowrap;
          background: #fafafa;
          position: sticky;
          left: 0;
          z-index: 1;
          min-width: 120px;
          font-size: clamp(10px, 2.3vw, 14px);
        }
        .rc-table tr.rc-smry td { background: #f0f0f0; font-weight: 700; }
        .rc-table tr.rc-smry td.rc-subj { background: #e8e8e8; font-weight: 700; }
        .rc-table tr:nth-child(even) td { background: #f8f8f8; }
        .rc-table tr:nth-child(even) td.rc-subj { background: #f3f3f3; }

        /* ── Grading box ──────────────────────────────────────── */
        .rc-grade-box {
          display: flex;
          border: 1px solid #555;
          margin-top: 10px;
          font-size: clamp(10px, 2.3vw, 13px);
        }
        .rc-grade-label {
          padding: 8px; min-width: 85px; text-align: center;
          border-right: 1px solid #555;
          display: flex; align-items: center; justify-content: center;
          font-weight: bold;
        }
        .rc-grade-scale { padding: 8px 12px; line-height: 1.8; }

        /* ── Note / promotion ─────────────────────────────────── */
        .rc-note {
          margin-top: 12px;
          font-size: clamp(10px, 2.3vw, 14px);
          line-height: 1.7;
        }
        .rc-promo {
          margin-top: 10px;
          font-size: clamp(10px, 2.3vw, 13px);
          line-height: 2;
        }
        .rc-field {
          border: none;
          border-bottom: 1px solid #aaa;
          outline: none;
          font-family: "Times New Roman", serif;
          font-size: inherit;
          background: transparent;
        }
        .rc-uline {
          display: inline-block;
          border-bottom: 1px solid #555;
          min-width: 60px;
          font-weight: 700;
        }

        /* ── Signatures ───────────────────────────────────────── */
        .rc-sigs {
          position: relative;
          margin-top: 20px;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          text-align: center;
          font-size: clamp(10px, 2.2vw, 12px);
        }
        .rc-sigline { border-top: 1px solid #555; padding-top: 3px; margin-top: 32px; }
        .rc-sigimg  { height: 38px; max-width: 90%; object-fit: contain; margin: 0 auto 2px; display: block; }
        .rc-stamp-pos {
          position: absolute; bottom: 8px; left: 50%;
          transform: translateX(-50%);
          opacity: 0.82; pointer-events: none;
        }

        /* ── Bottom bar ───────────────────────────────────────── */
        .rc-bottom {
          display: flex; justify-content: space-between;
          align-items: flex-end; flex-wrap: wrap; gap: 8px;
          margin-top: 10px;
          font-size: clamp(10px, 2.3vw, 12px);
        }

        /* ── Footer ───────────────────────────────────────────── */
        .rc-footer {
          text-align: center;
          padding: 8px 0 10px;
          font-size: clamp(12px, 3.5vw, 19px);
          font-weight: bold;
          border-top: 1px solid #ccc;
          margin-top: 10px;
        }

        /* ── PRINT overrides ──────────────────────────────────── */
        @media print {
          .rc-screen-only { display: none !important; }
          .rc-wrap { border: 4px double #222 !important; border-radius: 0 !important; }
          .rc-head { flex-wrap: nowrap; }
          .rc-info { grid-template-columns: 2fr 1fr 1.2fr 0.8fr !important; }
          .rc-info-cell:nth-child(even) { border-right: 1px solid #ddd !important; }
          .rc-semesters { flex-direction: row !important; }
          .rc-sem { flex: 1; min-width: 0; padding: 8px 10px; }
          .rc-sem + .rc-sem { border-top: none !important; border-left: 2px solid #ddd !important; }
          .rc-tscroll { overflow: visible !important; border: none !important; }
          .rc-table { min-width: unset !important; font-size: 11px !important; }
          .rc-table td.rc-subj { position: static !important; background: #fafafa !important; }
          .rc-sem-title { font-size: 20px !important; }
          .rc-note, .rc-promo { font-size: 11px !important; }
          .rc-sigs { font-size: 10px !important; }
          .rc-footer { font-size: 15px !important; }
          .rc-grade-box { font-size: 11px; }

          /* ── semester-only modes ────────────────────────────── */
          /* sem1 only: hide the right semester column */
          [data-print-mode="sem1"] .rc-sem-right { display: none !important; }
          [data-print-mode="sem1"] .rc-semesters { flex-direction: column !important; }
          [data-print-mode="sem1"] .rc-sem-left { max-width: 100%; width: 100%; }

          /* sem2 only: hide the left semester column */
          [data-print-mode="sem2"] .rc-sem-left { display: none !important; }
          [data-print-mode="sem2"] .rc-semesters { flex-direction: column !important; }
          [data-print-mode="sem2"] .rc-sem-right { max-width: 100%; width: 100%; }

          /* combined: side by side */
          [data-print-mode="combined"] .rc-semesters { flex-direction: row !important; }

          /* sem1/sem2 single-column: use portrait A4 */
          [data-print-mode="sem1"],
          [data-print-mode="sem2"] {
            /* page size handled by JS before print */
          }
        }
      `}</style>

      <div id="report-card-sheet" className="rc-wrap" data-print-mode={printMode}>

        {/* Watermark */}
        {logoUrl && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
            backgroundImage: `url("${logoUrl}")`, backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center', backgroundSize: '380px', opacity: 0.07,
          }} />
        )}

        <div style={{ position: 'relative', zIndex: 1 }}>

          {/* ── HEADER ──────────────────────────────────────────────── */}
          <div className="rc-head">
            {logoUrl && <img src={logoUrl} alt="Logo" className="rc-head-logo" />}
            <div className="rc-head-text">
              <h1>{schoolName}</h1>
              {schoolAddress && <p>{schoolAddress}</p>}
              {schoolPhone && <p>Tel: {schoolPhone}</p>}
              <h3>Student Report Card</h3>
            </div>
            {isFinalized && barcodeValue && (
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <Barcode value={barcodeValue} width={160} height={44} showText />
                <div style={{ fontSize: 9, color: '#aaa', marginTop: 1 }}>Card No.</div>
              </div>
            )}
          </div>

          {/* ── STUDENT INFO ────────────────────────────────────────── */}
          <div className="rc-info">
            <div className="rc-info-cell">
              <b>Name:</b>{' '}
              {editable
                ? <input value={studentName} onChange={(e) => onFieldChange?.('studentName', e.target.value)}
                    className="rc-field" style={{ width: '55%', minWidth: 80 }} />
                : <strong>{studentName || '__________________'}</strong>}
            </div>
            <div className="rc-info-cell"><b>ID:</b> <strong>{studentId || '______'}</strong></div>
            <div className="rc-info-cell"><b>Class:</b> <strong>{className || '______'}</strong></div>
            <div className="rc-info-cell"><b>Year:</b> <strong>{academicYear || '____'}</strong></div>
            <div className="rc-info-full">
              <b>Class Teacher:</b> <strong>{teacherName || '____________________________'}</strong>
            </div>
          </div>

          {/* ── SEMESTERS ───────────────────────────────────────────── */}
          <div className="rc-semesters">

            {/* ════ 1st SEMESTER ════ */}
            <div className="rc-sem rc-sem-left">
              <div className="rc-sem-title">1<sup>st</sup> SEMESTER</div>
              <div className="rc-tscroll">
                <table className="rc-table">
                  <thead>
                    <tr>
                      <th className="rc-subj" style={{ textAlign: 'left', paddingLeft: 8, minWidth: 120 }} rowSpan={2}>SUBJECTS</th>
                      <th>1<sup>st</sup> pd</th>
                      <th>2<sup>nd</sup> pd</th>
                      <th>3<sup>rd</sup> pd</th>
                      <th rowSpan={2}>Exam</th>
                      <th rowSpan={2}>Sem. Ave</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportCardSubjects.map((subj) => {
                      const avg = s1Avg(subj);
                      return (
                        <tr key={subj}>
                          <td className="rc-subj">{subj}</td>
                          {SEM1_PERIODS.map((p) => (
                            <td key={p} style={editable ? { padding: 2 } : undefined}>
                              {editable
                                ? <ScoreInput value={gm(subj, p)} onChange={(v) => onMarkChange?.(subj, p, v)} />
                                : <span style={scoreStyle(gm(subj, p))}>{gm(subj, p) || ''}</span>}
                            </td>
                          ))}
                          <td style={editable ? { padding: 2 } : undefined}>
                            {editable
                              ? <ScoreInput value={gm(subj, 'Exam 1')} onChange={(v) => onMarkChange?.(subj, 'Exam 1', v)} />
                              : <span style={scoreStyle(gm(subj, 'Exam 1'))}>{gm(subj, 'Exam 1') || ''}</span>}
                          </td>
                          <td style={avgStyle(avg)}>{avg !== null ? avg.toFixed(1) : ''}</td>
                        </tr>
                      );
                    })}
                    {summaryRows.map((row) => (
                      <tr key={row.field} className="rc-smry">
                        <td className="rc-subj">{row.label}</td>
                        <td colSpan={5} style={{ textAlign: 'left', paddingLeft: 8 }}>
                          {editable
                            ? <input value={row.value} onChange={(e) => onFieldChange?.(row.field, e.target.value)}
                                className="rc-field" style={{ width: '80%', fontWeight: 700 }} />
                            : <strong>{row.value || ''}</strong>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Grading box */}
              <div className="rc-grade-box">
                <div className="rc-grade-label"><strong>Grading<br />Methods</strong></div>
                <div className="rc-grade-scale">
                  A ...... 90 - 100 ...... Excellent<br />
                  B ...... 80 - 89 ...... Good<br />
                  C ...... 70 - 79 ...... Fair<br />
                  D ...... Below 70 ...... Fail
                </div>
              </div>
            </div>

            {/* ════ 2nd SEMESTER ════ */}
            <div className="rc-sem rc-sem-right">
              <div className="rc-sem-title">2<sup>nd</sup> SEMESTER</div>
              <div className="rc-tscroll">
                <table className="rc-table">
                  <thead>
                    <tr>
                      {/* Subject column repeated on screen for usability */}
                      <th className="rc-subj rc-screen-only" style={{ textAlign: 'left', paddingLeft: 8, minWidth: 120 }}>SUBJECTS</th>
                      <th>4<sup>th</sup> pd</th>
                      <th>5<sup>th</sup> pd</th>
                      <th>6<sup>th</sup> pd</th>
                      <th>Exam</th>
                      <th>Sem. Ave</th>
                      <th>Yearly Ave</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportCardSubjects.map((subj) => {
                      const s2 = s2Avg(subj);
                      const yr = yrAvg(subj);
                      return (
                        <tr key={subj}>
                          <td className="rc-subj rc-screen-only">{subj}</td>
                          {SEM2_PERIODS.map((p) => (
                            <td key={p} style={editable ? { padding: 2 } : undefined}>
                              {editable
                                ? <ScoreInput value={gm(subj, p)} onChange={(v) => onMarkChange?.(subj, p, v)} />
                                : <span style={scoreStyle(gm(subj, p))}>{gm(subj, p) || ''}</span>}
                            </td>
                          ))}
                          <td style={editable ? { padding: 2 } : undefined}>
                            {editable
                              ? <ScoreInput value={gm(subj, 'Exam 2')} onChange={(v) => onMarkChange?.(subj, 'Exam 2', v)} />
                              : <span style={scoreStyle(gm(subj, 'Exam 2'))}>{gm(subj, 'Exam 2') || ''}</span>}
                          </td>
                          <td style={avgStyle(s2)}>{s2 !== null ? s2.toFixed(1) : ''}</td>
                          <td style={avgStyle(yr)}>{yr !== null ? yr.toFixed(1) : ''}</td>
                        </tr>
                      );
                    })}
                    {/* Blank mirror rows for print alignment */}
                    {[...Array(5)].map((_, i) => (
                      <tr key={i} style={{ height: 28 }} className="rc-smry">
                        <td className="rc-subj rc-screen-only" />
                        <td colSpan={6} />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Note */}
              <div className="rc-note">
                <strong>Note:</strong><br />
                Any erasure on this card makes it invalid.<br />
                Any grade lower than 70 will not be honored by promotion.
              </div>

              {/* Promotion */}
              <div className="rc-promo">
                <p style={{ margin: '2px 0' }}>
                  This is to certify that the student has satisfactorily completed the work of grade _______ and is:
                </p>
                <p style={{ margin: '4px 0', lineHeight: 2.2 }}>
                  [ ] Promoted to Grade{' '}
                  {editable
                    ? <input value={promotedTo ?? ''} onChange={(e) => onFieldChange?.('promotedTo', e.target.value)}
                        className="rc-field" style={{ width: 70 }} />
                    : <span className="rc-uline">{promotedTo ?? ''}</span>}
                  &nbsp;&nbsp;[ ] Conditional in{' '}
                  {editable
                    ? <input value={conditionalSubjects ?? ''} onChange={(e) => onFieldChange?.('conditionalSubjects', e.target.value)}
                        className="rc-field" style={{ width: 120 }} />
                    : <span className="rc-uline">{conditionalSubjects ?? ''}</span>}
                </p>
                <p style={{ margin: '2px 0' }}>[ ] Required to Repeat the Grade &nbsp;&nbsp; [ ] Asked not to enroll next year</p>
              </div>

              {/* Signatures + stamp */}
              <div className="rc-sigs">
                <div>
                  {isFinalized && signatures.classSponsorSig && (
                    <img src={signatures.classSponsorSig} alt="Class sponsor sig" className="rc-sigimg" />
                  )}
                  <div className="rc-sigline" />
                  <div>Class Sponsor</div>
                  {classSponsor && <div style={{ fontSize: '0.9em', color: '#444' }}>{classSponsor}</div>}
                </div>
                <div>
                  <div className="rc-sigline" />
                  <div>Parent / Guardian</div>
                </div>
                <div>
                  {isFinalized && signatures.principalSig && (
                    <img src={signatures.principalSig} alt="Principal sig" className="rc-sigimg" />
                  )}
                  <div className="rc-sigline" />
                  <div>Principal</div>
                  {principal && <div style={{ fontSize: '0.9em', color: '#444' }}>{principal}</div>}
                </div>
                {isFinalized && (
                  <div className="rc-stamp-pos">
                    {signatures.stampOverride
                      ? <img src={signatures.stampOverride} alt="Stamp" style={{ width: 92, height: 92 }} />
                      : <OfficialStamp schoolName={schoolName} motto={schoolMotto} size={92} color="#1a3a6b" />}
                  </div>
                )}
              </div>

              {/* Bottom bar */}
              <div className="rc-bottom">
                <span>
                  <b>Closing Date:</b>{' '}
                  {editable
                    ? <input value={closingDate ?? ''} onChange={(e) => onFieldChange?.('closingDate', e.target.value)}
                        className="rc-field" style={{ width: 120 }} />
                    : <span className="rc-uline">{closingDate || ''}</span>}
                </span>
                {isFinalized && barcodeValue && (
                  <div style={{ textAlign: 'right' }}>
                    <Barcode value={barcodeValue} width={140} height={34} showText={false} />
                    <div style={{ fontSize: 8, color: '#bbb', fontFamily: 'monospace', marginTop: 1 }}>{barcodeValue}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── FOOTER ────────────────────────────────────────────────── */}
          <div className="rc-footer">Motto: &ldquo;{schoolMotto}&rdquo;</div>
        </div>
      </div>
    </>
  );
}
