/**
 * SubjectMarks — /subject-marks
 *
 * Subject teachers use this page to:
 *   1. Select a report card (filtered to their class)
 *   2. Pick their subject
 *   3. Enter marks for all students' periods and exam
 *   4. Submit to the class sponsor
 */
import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { reportCardSubjects, SEM1_PERIODS, SEM2_PERIODS, parseMark, scoreColor } from '../services/reportCardService';

type RC = {
  id: number;
  academic_year: string;
  approval_status: string;
  student?: { first_name: string; last_name: string; student_id: string };
  class?: { name: string; section?: string };
};

type Submission = {
  subject: string;
  subject_marks: Record<string, string>;
  teacher_name: string;
  submitted_at: string;
};

const ALL_PERIODS = [...SEM1_PERIODS, 'Exam 1', ...SEM2_PERIODS, 'Exam 2'];
const STATUS_COLORS: Record<string, string> = {
  draft:          'bg-slate-100 text-slate-700',
  pending_sponsor:'bg-amber-100 text-amber-800',
  pending_vpi:    'bg-blue-100 text-blue-800',
  approved:       'bg-emerald-100 text-emerald-800',
  rejected:       'bg-rose-100 text-rose-700',
};

function ScoreInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const n = parseMark(value);
  const isInvalid = n !== null && (n < 50 || n > 100);
  return (
    <div className="relative">
      <input
        type="number" min={50} max={100} inputMode="numeric" value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (v === '' || Number(v) <= 100) onChange(v);
        }}
        className="w-full rounded border text-center text-sm font-semibold focus:outline-none focus:ring-1"
        style={{
          height: 34,
          color: isInvalid ? '#b91c1c' : scoreColor(n),
          fontWeight: n !== null ? 700 : 400,
          border: isInvalid ? '1.5px solid #ef4444' : '1px solid #e2e8f0',
          background: isInvalid ? '#fff5f5' : 'white',
        }}
      />
      {isInvalid && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-10 rounded bg-red-900 px-2 py-1 text-[10px] text-white whitespace-nowrap shadow pointer-events-none">
          50–100 only
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-red-900" />
        </div>
      )}
    </div>
  );
}

export default function SubjectMarks() {
  const { user } = useAuthStore();
  const isClassSponsor = user?.role?.slug === 'class-sponsor';

  const [reportCards, setReportCards] = useState<RC[]>([]);
  const [selectedRC, setSelectedRC]   = useState<number | ''>('');
  const [subject, setSubject]         = useState('');
  const [marks, setMarks]             = useState<Record<string, string>>({});
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [msg, setMsg]                 = useState<{ ok: boolean; text: string } | null>(null);
  const [filterYear, setFilterYear]   = useState(new Date().getFullYear().toString());
  const [filterClass, _setFilterClass] = useState('');

  useEffect(() => { loadReportCards(); }, [filterYear, filterClass]);

  const loadReportCards = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { academic_year: filterYear };
      if (filterClass) params.class_id = filterClass;
      const res = await api.get('/report-cards', { params });
      // For subject teachers, only show draft/pending_sponsor cards (still accepting marks)
      const cards = (res.data || []).filter((rc: RC) =>
        isClassSponsor || ['draft', 'pending_sponsor'].includes(rc.approval_status)
      );
      setReportCards(cards);
    } catch { setMsg({ ok: false, text: 'Failed to load report cards.' }); }
    finally { setLoading(false); }
  };

  const loadSubmissions = async (rcId: number) => {
    try {
      const res = await api.get(`/report-cards/${rcId}/subject-submissions`);
      setSubmissions(res.data.submissions || []);
    } catch { setSubmissions([]); }
  };

  const handleSelectRC = (id: number | '') => {
    setSelectedRC(id);
    setMarks({});
    setMsg(null);
    if (id) loadSubmissions(id as number);
    else setSubmissions([]);
  };

  const handleSelectSubject = (subj: string) => {
    setSubject(subj);
    setMsg(null);
    // Pre-fill with any existing submission for this subject
    const existing = submissions.find((s) => s.subject === subj);
    setMarks(existing?.subject_marks || {});
  };

  const handleSubmit = async () => {
    if (!selectedRC || !subject) { setMsg({ ok: false, text: 'Select a report card and subject first.' }); return; }
    const hasAnyMark = Object.values(marks).some((v) => v !== '');
    if (!hasAnyMark) { setMsg({ ok: false, text: 'Enter at least one mark before submitting.' }); return; }
    const invalid = Object.values(marks).some((v) => {
      const n = parseMark(v); return v !== '' && (n === null || n < 50 || n > 100);
    });
    if (invalid) { setMsg({ ok: false, text: 'Fix marks outside 50–100 range before submitting.' }); return; }

    setSaving(true); setMsg(null);
    try {
      await api.post(`/report-cards/${selectedRC}/subject-marks`, {
        subject,
        subject_marks: Object.fromEntries(Object.entries(marks).filter(([, v]) => v !== '')),
      });
      setMsg({ ok: true, text: `Marks for ${subject} submitted successfully to the class sponsor.` });
      loadSubmissions(selectedRC as number);
    } catch (err: any) {
      setMsg({ ok: false, msg: err.response?.data?.message || 'Failed to submit marks.' } as any);
    } finally { setSaving(false); }
  };

  const activeRC = reportCards.find((rc) => rc.id === selectedRC);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Academic work</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Subject marks</h1>
        <p className="mt-2 text-sm text-slate-500">
          Enter and submit marks for your subject. The class sponsor will collect all marks and compile the final report card.
        </p>
      </div>

      {msg && (
        <div className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm font-medium ${
          msg.ok ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                 : 'border border-rose-200 bg-rose-50 text-rose-700'
        }`}>
          <span className="shrink-0">{msg.ok ? '✓' : '⚠'}</span> {msg.text}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Academic year</label>
          <input value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="input-field w-24 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Report card</label>
          <select value={selectedRC} onChange={(e) => handleSelectRC(e.target.value ? Number(e.target.value) : '')} className="input-field text-sm">
            <option value="">Select student / report card</option>
            {loading ? <option disabled>Loading…</option> : reportCards.map((rc) => (
              <option key={rc.id} value={rc.id}>
                {rc.student ? `${rc.student.first_name} ${rc.student.last_name} (${rc.student.student_id})` : `RC #${rc.id}`}
                {' — '}{rc.class?.name}{rc.class?.section ? ` ${rc.class.section}` : ''} {rc.academic_year}
                {' ['}{rc.approval_status}{']'}
              </option>
            ))}
          </select>
        </div>
        {selectedRC && (
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Subject</label>
            <select value={subject} onChange={(e) => handleSelectSubject(e.target.value)} className="input-field text-sm">
              <option value="">Select your subject</option>
              {reportCardSubjects.map((s) => (
                <option key={s} value={s}>
                  {s}{submissions.find((sub) => sub.subject === s) ? ' ✓' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Status banner for selected RC */}
      {activeRC && (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <div>
            <p className="font-semibold text-slate-900">
              {activeRC.student?.first_name} {activeRC.student?.last_name}
            </p>
            <p className="text-xs text-slate-500">
              {activeRC.class?.name}{activeRC.class?.section ? ` - ${activeRC.class.section}` : ''} · {activeRC.academic_year}
            </p>
          </div>
          <span className={`ml-auto inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_COLORS[activeRC.approval_status]}`}>
            {activeRC.approval_status?.replace('_', ' ')}
          </span>
          {!['draft', 'pending_sponsor'].includes(activeRC.approval_status) && (
            <span className="text-xs text-rose-600 font-semibold">Marks locked — card already submitted</span>
          )}
        </div>
      )}

      {/* Submissions overview */}
      {selectedRC && submissions.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3">
            <p className="text-sm font-bold text-slate-900">Submitted subjects ({submissions.length} of {reportCardSubjects.length})</p>
          </div>
          <div className="flex flex-wrap gap-2 p-4">
            {reportCardSubjects.map((s) => {
              const sub = submissions.find((x) => x.subject === s);
              return (
                <span key={s} className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  sub ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                }`}>
                  {sub ? '✓ ' : ''}{s}
                  {sub && <span className="ml-1 opacity-60">· {sub.teacher_name}</span>}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Marks entry grid */}
      {selectedRC && subject && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">{subject} — mark entry</p>
              <p className="text-xs text-slate-400 mt-0.5">Enter marks in range 50–100. Leave blank if not applicable.</p>
            </div>
            <button onClick={handleSubmit} disabled={saving || !['draft', 'pending_sponsor'].includes(activeRC?.approval_status || '')}
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700 disabled:opacity-40">
              {saving ? 'Submitting…' : '📤 Submit marks'}
            </button>
          </div>

          <div className="overflow-x-auto p-4">
            <table className="w-full text-sm" style={{ fontFamily: '"Times New Roman", serif' }}>
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase border border-slate-200">Period</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500 uppercase border border-slate-200">Mark (50–100)</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase border border-slate-200">Semester</th>
                </tr>
              </thead>
              <tbody>
                {ALL_PERIODS.map((period) => {
                  const sem = SEM1_PERIODS.includes(period as any) || period === 'Exam 1' ? '1st Semester' : '2nd Semester';
                  const value = marks[period] || '';
                  return (
                    <tr key={period} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-2 font-semibold text-slate-800 border border-slate-200 whitespace-nowrap">{period}</td>
                      <td className="px-2 py-1.5 border border-slate-200" style={{ width: 100 }}>
                        <ScoreInput
                          value={value}
                          onChange={(v) => setMarks((p) => ({ ...p, [period]: v }))}
                        />
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-400 border border-slate-200">{sem}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
