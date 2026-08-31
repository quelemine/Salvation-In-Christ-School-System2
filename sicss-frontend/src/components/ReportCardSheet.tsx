/**
 * ReportCardSheet — Clean, printable report card component
 */
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
import QRCode from './QRCode';
import OfficialStamp from './OfficialStamp';

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
  editable?: boolean;
  onMarkChange?: (subject: string, period: string, value: string) => void;
}

function ScoreInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const n = parseMark(value);
  const isInvalid = n !== null && (n < 0 || n > 100);
  const color = isInvalid ? '#b91c1c' : scoreColor(n);

  return (
    <input
      type="number"
      inputMode="numeric"
      value={value}
      onChange={(e) => {
        const val = e.target.value;
        if (val === '') { onChange(''); return; }
        const num = Number(val);
        if (num > 100) { onChange('100'); }
        else if (num < 0) { onChange('0'); }
        else { onChange(val); }
      }}
      className="w-full rounded text-center text-sm font-semibold"
      style={{
        height: 32,
        color,
        border: isInvalid ? '2px solid #ef4444' : '1px solid #e2e8f0',
        background: isInvalid ? '#fff5f5' : 'white',
      }}
    />
  );
}

export default function ReportCardSheet(props: ReportCardSheetProps) {
  const {
    studentName,
    studentId,
    className,
    teacherName,
    academicYear,
    marks,
    aggregate,
    average,
    rank,
    totalInClass,
    conduct,
    conditionalSubjects,
    promotedTo,
    classSponsor,
    principal,
    closingDate,
    editable = false,
    onMarkChange,
  } = props;

  const barcodeValue = studentId && academicYear && aggregate
    ? `${studentId}-${academicYear}-${Math.round(aggregate)}`.toUpperCase()
    : '';

  const getMark = (subject: string, period: string) => marks[subject]?.[period] || '';
  const setMark = (subject: string, period: string, value: string) => {
    if (editable && onMarkChange) onMarkChange(subject, period, value);
  };

  const s1Avg = (s: string) => semesterAvg(marks[s] || {}, SEM1_PERIODS, 'Exam 1');
  const s2Avg = (s: string) => semesterAvg(marks[s] || {}, SEM2_PERIODS, 'Exam 2');
  const yrAvg = (s: string) => yearlyAvg(s1Avg(s), s2Avg(s));

  const periodAggregate = (period: string): number | null => {
    const scores: number[] = [];
    reportCardSubjects.forEach((subj) => {
      const n = parseMark(marks[subj]?.[period]);
      if (n !== null) scores.push(n);
    });
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0));
  };

  const periodAverage = (period: string): number | null => {
    const scores: number[] = [];
    reportCardSubjects.forEach((subj) => {
      const n = parseMark(marks[subj]?.[period]);
      if (n !== null) scores.push(n);
    });
    if (scores.length === 0) return null;
    return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
  };

  return (
    <div className="bg-white p-6 max-w-4xl mx-auto shadow-lg" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">SALVATION IN CHRIST SCHOOL SYSTEM</h1>
        <p className="text-sm text-slate-600">Student Report Card</p>
      </div>

      {/* Student Info */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-sm border-b pb-4">
        <div>
          <span className="font-semibold text-slate-700">Student Name:</span>
          <span className="ml-2 text-slate-900">{studentName}</span>
        </div>
        <div>
          <span className="font-semibold text-slate-700">Student ID:</span>
          <span className="ml-2 text-slate-900">{studentId || '—'}</span>
        </div>
        <div>
          <span className="font-semibold text-slate-700">Class:</span>
          <span className="ml-2 text-slate-900">{className || '—'}</span>
        </div>
        <div>
          <span className="font-semibold text-slate-700">Academic Year:</span>
          <span className="ml-2 text-slate-900">{academicYear || '—'}</span>
        </div>
        <div>
          <span className="font-semibold text-slate-700">Class Teacher:</span>
          <span className="ml-2 text-slate-900">{teacherName || '—'}</span>
        </div>
      </div>

      {/* Grades Table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 px-2 py-2 text-left font-semibold">Subject</th>
              {SEM1_PERIODS.map(p => <th key={p} className="border border-slate-300 px-2 py-2 font-semibold">{p}</th>)}
              <th className="border border-slate-300 px-2 py-2 font-semibold">Exam 1</th>
              <th className="border border-slate-300 px-2 py-2 font-semibold">Sem1 Ave</th>
              {SEM2_PERIODS.map(p => <th key={p} className="border border-slate-300 px-2 py-2 font-semibold">{p}</th>)}
              <th className="border border-slate-300 px-2 py-2 font-semibold">Exam 2</th>
              <th className="border border-slate-300 px-2 py-2 font-semibold">Sem2 Ave</th>
              <th className="border border-slate-300 px-2 py-2 font-semibold">Yearly Ave</th>
            </tr>
          </thead>
          <tbody>
            {reportCardSubjects.map(subject => (
              <tr key={subject}>
                <td className="border border-slate-300 px-2 py-2 font-medium">{subject}</td>
                {SEM1_PERIODS.map(p => (
                  <td key={p} className="border border-slate-300 px-1 py-1">
                    {editable ? (
                      <ScoreInput value={getMark(subject, p)} onChange={(v) => setMark(subject, p, v)} />
                    ) : (
                      <span className="block text-center" style={{ color: scoreColor(parseMark(getMark(subject, p))) }}>
                        {getMark(subject, p) || 'NG'}
                      </span>
                    )}
                  </td>
                ))}
                <td className="border border-slate-300 px-1 py-1">
                  {editable ? (
                    <ScoreInput value={getMark(subject, 'Exam 1')} onChange={(v) => setMark(subject, 'Exam 1', v)} />
                  ) : (
                    <span className="block text-center" style={{ color: scoreColor(parseMark(getMark(subject, 'Exam 1'))) }}>
                      {getMark(subject, 'Exam 1') || 'NG'}
                    </span>
                  )}
                </td>
                <td className="border border-slate-300 px-1 py-1">
                  <span className="block text-center font-semibold" style={{ color: scoreColor(s1Avg(subject)) }}>
                    {s1Avg(subject) ?? '—'}
                  </span>
                </td>
                {SEM2_PERIODS.map(p => (
                  <td key={p} className="border border-slate-300 px-1 py-1">
                    {editable ? (
                      <ScoreInput value={getMark(subject, p)} onChange={(v) => setMark(subject, p, v)} />
                    ) : (
                      <span className="block text-center" style={{ color: scoreColor(parseMark(getMark(subject, p))) }}>
                        {getMark(subject, p) || 'NG'}
                      </span>
                    )}
                  </td>
                ))}
                <td className="border border-slate-300 px-1 py-1">
                  {editable ? (
                    <ScoreInput value={getMark(subject, 'Exam 2')} onChange={(v) => setMark(subject, 'Exam 2', v)} />
                  ) : (
                    <span className="block text-center" style={{ color: scoreColor(parseMark(getMark(subject, 'Exam 2'))) }}>
                      {getMark(subject, 'Exam 2') || 'NG'}
                    </span>
                  )}
                </td>
                <td className="border border-slate-300 px-1 py-1">
                  <span className="block text-center font-semibold" style={{ color: scoreColor(s2Avg(subject)) }}>
                    {s2Avg(subject) ?? '—'}
                  </span>
                </td>
                <td className="border border-slate-300 px-1 py-1">
                  <span className="block text-center font-bold" style={{ color: scoreColor(yrAvg(subject)) }}>
                    {yrAvg(subject) ?? '—'}
                  </span>
                </td>
              </tr>
            ))}
            {/* Aggregate Row */}
            <tr className="bg-slate-100">
              <td className="border border-slate-300 px-2 py-2 font-bold text-slate-700">Aggregate</td>
              {SEM1_PERIODS.map(p => (
                <td key={p} className="border border-slate-300 px-1 py-1">
                  <span className="block text-center font-bold" style={{ color: '#1d4ed8' }}>
                    {periodAggregate(p) ?? '—'}
                  </span>
                </td>
              ))}
              <td className="border border-slate-300 px-1 py-1">
                <span className="block text-center font-bold" style={{ color: '#1d4ed8' }}>
                  {periodAggregate('Exam 1') ?? '—'}
                </span>
              </td>
              <td className="border border-slate-300 px-1 py-1">
                <span className="block text-center font-bold" style={{ color: '#1d4ed8' }}>
                  {periodAggregate('Sem1 Ave') ?? '—'}
                </span>
              </td>
              {SEM2_PERIODS.map(p => (
                <td key={p} className="border border-slate-300 px-1 py-1">
                  <span className="block text-center font-bold" style={{ color: '#1d4ed8' }}>
                    {periodAggregate(p) ?? '—'}
                  </span>
                </td>
              ))}
              <td className="border border-slate-300 px-1 py-1">
                <span className="block text-center font-bold" style={{ color: '#1d4ed8' }}>
                  {periodAggregate('Exam 2') ?? '—'}
                </span>
              </td>
              <td className="border border-slate-300 px-1 py-1">
                <span className="block text-center font-bold" style={{ color: '#1d4ed8' }}>
                  {periodAggregate('Sem2 Ave') ?? '—'}
                </span>
              </td>
              <td className="border border-slate-300 px-1 py-1">
                <span className="block text-center font-bold" style={{ color: '#1d4ed8' }}>
                  {periodAggregate('Yearly Ave') ?? '—'}
                </span>
              </td>
            </tr>
            {/* Average Row */}
            <tr className="bg-slate-50">
              <td className="border border-slate-300 px-2 py-2 font-bold text-slate-700">Average</td>
              {SEM1_PERIODS.map(p => (
                <td key={p} className="border border-slate-300 px-1 py-1">
                  <span className="block text-center font-bold" style={{ color: scoreColor(periodAverage(p)) }}>
                    {periodAverage(p) ?? '—'}
                  </span>
                </td>
              ))}
              <td className="border border-slate-300 px-1 py-1">
                <span className="block text-center font-bold" style={{ color: scoreColor(periodAverage('Exam 1')) }}>
                  {periodAverage('Exam 1') ?? '—'}
                </span>
              </td>
              <td className="border border-slate-300 px-1 py-1">
                <span className="block text-center font-bold" style={{ color: scoreColor(periodAverage('Sem1 Ave')) }}>
                  {periodAverage('Sem1 Ave') ?? '—'}
                </span>
              </td>
              {SEM2_PERIODS.map(p => (
                <td key={p} className="border border-slate-300 px-1 py-1">
                  <span className="block text-center font-bold" style={{ color: scoreColor(periodAverage(p)) }}>
                    {periodAverage(p) ?? '—'}
                  </span>
                </td>
              ))}
              <td className="border border-slate-300 px-1 py-1">
                <span className="block text-center font-bold" style={{ color: scoreColor(periodAverage('Exam 2')) }}>
                  {periodAverage('Exam 2') ?? '—'}
                </span>
              </td>
              <td className="border border-slate-300 px-1 py-1">
                <span className="block text-center font-bold" style={{ color: scoreColor(periodAverage('Sem2 Ave')) }}>
                  {periodAverage('Sem2 Ave') ?? '—'}
                </span>
              </td>
              <td className="border border-slate-300 px-1 py-1">
                <span className="block text-center font-bold" style={{ color: scoreColor(periodAverage('Yearly Ave')) }}>
                  {periodAverage('Yearly Ave') ?? '—'}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6 text-sm border-t pt-4">
        <div>
          <span className="font-semibold text-slate-700">Aggregate:</span>
          <span className="ml-2 font-bold text-slate-900">{aggregate ?? '—'}</span>
        </div>
        <div>
          <span className="font-semibold text-slate-700">Average:</span>
          <span className="ml-2 font-bold text-slate-900">{average ?? '—'}</span>
        </div>
        <div>
          <span className="font-semibold text-slate-700">Rank:</span>
          <span className="ml-2 font-bold text-slate-900">{rank ? `${rank} / ${totalInClass}` : '—'}</span>
        </div>
        <div>
          <span className="font-semibold text-slate-700">Conduct:</span>
          <span className="ml-2 text-slate-900">{conduct || '—'}</span>
        </div>
      </div>

      {/* Promotion Status */}
      {(promotedTo || conditionalSubjects) && (
        <div className="mb-6 text-sm border-t pt-4">
          {promotedTo && (
            <div>
              <span className="font-semibold text-slate-700">Promoted To:</span>
              <span className="ml-2 text-slate-900">{promotedTo}</span>
            </div>
          )}
          {conditionalSubjects && (
            <div>
              <span className="font-semibold text-slate-700">Conditional Subjects:</span>
              <span className="ml-2 text-slate-900">{conditionalSubjects}</span>
            </div>
          )}
        </div>
      )}

      {/* Signatures */}
      <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t text-sm">
        <div className="text-center">
          <div className="h-16 mb-2 flex items-center justify-center">
            <OfficialStamp schoolName="Salvation in Christ School System" />
          </div>
          <p className="font-semibold text-slate-700">Class Sponsor</p>
          <p className="text-slate-900">{classSponsor || '—'}</p>
        </div>
        <div className="text-center">
          <div className="h-16 mb-2"></div>
          <p className="font-semibold text-slate-700">Principal</p>
          <p className="text-slate-900">{principal || '—'}</p>
        </div>
        <div className="text-center">
          {barcodeValue && (
            <div className="flex flex-col items-center">
              <QRCode value={barcodeValue} size={80} showText={false} />
              <p className="text-xs text-slate-500 mt-1">{barcodeValue}</p>
            </div>
          )}
          <p className="font-semibold text-slate-700 mt-2">Closing Date</p>
          <p className="text-slate-900">{closingDate || '—'}</p>
        </div>
      </div>
    </div>
  );
}
