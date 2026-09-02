/**
 * SubjectMarks — /subject-marks
 *
 * Subject teachers use this page to:
 *   1. Select a report card (filtered to their class)
 *   2. Pick their subject
 *   3. See if the class sponsor has requested a revision (with their feedback comment)
 *   4. Enter or correct marks for all periods/exams
 *   5. Submit (or resubmit) to the class sponsor
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
  id: number;
  subject: string;
  subject_marks: Record<string, string>;
  teacher_name: string;
  employee_id: string;
  submitted_at: string;
  submission_status: 'submitted' | 'revision_requested' | 'accepted';
  sponsor_feedback?: string | null;
  feedback_sent_at?: string | null;
};

const ALL_PERIODS = [...SEM1_PERIODS, 'Exam 1', ...SEM2_PERIODS, 'Exam 2'];

const STATUS_COLORS: Record<string, string> = {
  draft:           'bg-slate-100 text-slate-700',
  pending_sponsor: 'bg-amber-100 text-amber-800',
  pending_vpi:     'bg-blue-100 text-blue-800',
  approved:        'bg-emerald-100 text-emerald-800',
  rejected:        'bg-rose-100 text-rose-700',
};

const SUB_STATUS_COLORS: Record<string, string> = {
  submitted:          'bg-amber-100 text-amber-800 border-amber-200',
  revision_requested: 'bg-rose-100 text-rose-700 border-rose-200',
  accepted:           'bg-emerald-100 text-emerald-800 border-emerald-200',
};
const SUB_STATUS_LABELS: Record<string, string> = {
  submitted:          'Submitted',
  revision_requested: 'Revision requested',
  accepted:           'Accepted',
};

function ScoreInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const n = parseMark(value);
  const isInvalid = n !== null && (n < 50 || n > 100);
  return (
    <div className="relative">
      <input
        type="number" min={50} max={100} inputMode="numeric" value={value}
        disabled={disabled}
        onChange={(e) => {
          const v = e.target.value;
          if (v === '' || Number(v) <= 100) onChange(v);
        }}
        className="w-full rounded border text-center text-sm font-semibold focus:outline-none focus:ring-1 disabled:bg-slate-50 disabled:cursor-not-allowed"
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
    setSubject('');
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
      const isResubmit = currentSubmission?.submission_status === 'revision_requested';
      await api.post(`/report-cards/${selectedRC}/subject-marks`, {
        subject,
        subject_marks: Object.fromEntries(Object.entries(marks).filter(([, v]) => v !== '')),
      });
      setMsg({
        ok: true,
        text: isResubmit
          ? `✓ Marks for ${subject} resubmitted. The class sponsor will review your corrections.`
          : `✓ Marks for ${subject} submitted successfully to the class sponsor.`,
      });
      await loadSubmissions(selectedRC as number);
    } catch (err: any) {
      setMsg({ ok: false, text: err.response?.data?.message || 'Failed to submit marks.' });
    } finally { setSaving(false); }
  };

  const activeRC           = reportCards.find((rc) => rc.id === selectedRC);
  const currentSubmission  = submissions.find((s) => s.subject === subject);
  const isLocked           = !['draft', 'pending_sponsor'].includes(activeRC?.approval_status || '');
  const isRevisionRequired = currentSubmission?.submission_status === 'revision_requested';
  const isAccepted         = currentSubmission?.submission_status === 'accepted';

  // Subjects with revision requested — shown in overview as alerts
  const revisionRequested  = submissions.filter((s) => s.submission_status === 'revision_requested');

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

      {/* ── Revision alerts (shown as soon as a card is selected) ── */}
      {revisionRequested.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 space-y-2">
          <p className="text-sm font-bold text-rose-800">
            ⚠ {revisionRequested.length} subject{revisionRequested.length !== 1 ? 's' : ''} need your attention
          </p>
          {revisionRequested.map((s) => (
            <div key={s.subject} className="rounded-lg border border-rose-200 bg-white p-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-slate-900">{s.subject}</span>
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">Revision requested</span>
                {s.feedback_sent_at && (
                  <span className="text-[10px] text-slate-400">
                    {new Date(s.feedback_sent_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
              {s.sponsor_feedback && (
                <div className="mt-2 rounded-lg border-l-4 border-rose-400 bg-rose-50 px-3 py-2">
                  <p className="text-xs font-semibold text-rose-700 mb-1">Class sponsor's comment:</p>
                  <p className="text-sm text-slate-800">{s.sponsor_feedback}</p>
                </div>
              )}
              <button
                onClick={() => {
                  handleSelectSubject(s.subject);
                  if (selectedRC !== activeRC?.id) return;
                  // scroll down to entry grid
                  setTimeout(() => document.getElementById('marks-entry')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }}
                className="mt-2 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700"
              >
                ✏ Edit and resubmit {s.subject}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters ── */}
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
              {reportCardSubjects.map((s) => {
                const sub = submissions.find((x) => x.subject === s);
                const suffix = sub?.submission_status === 'revision_requested' ? ' ⚠ Revision'
                             : sub?.submission_status === 'accepted'           ? ' ✓ Accepted'
                             : sub                                             ? ' ✓'
                             : '';
                return <option key={s} value={s}>{s}{suffix}</option>;
              })}
            </select>
          </div>
        )}
      </div>

      {/* ── Selected RC banner ── */}
      {activeRC && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <div>
            <p className="font-semibold text-slate-900">
              {activeRC.student?.first_name} {activeRC.student?.last_name}
            </p>
            <p className="text-xs text-slate-500">
              {activeRC.class?.name}{activeRC.class?.section ? ` - ${activeRC.class.section}` : ''} · {activeRC.academic_year}
            </p>
          </div>
          <span className={`ml-auto inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_COLORS[activeRC.approval_status]}`}>
            {activeRC.approval_status?.replace(/_/g, ' ')}
          </span>
          {isLocked && (
            <span className="text-xs text-rose-600 font-semibold">Marks locked — card already submitted</span>
          )}
        </div>
      )}

      {/* ── Submissions overview ── */}
      {selectedRC && submissions.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3">
            <p className="text-sm font-bold text-slate-900">Your submitted subjects ({submissions.length} of {reportCardSubjects.length})</p>
          </div>
          <div className="divide-y divide-slate-100">
            {reportCardSubjects.map((s) => {
              const sub = submissions.find((x) => x.subject === s);
              if (!sub) return (
                <div key={s} className="flex items-center gap-2 px-5 py-2.5">
                  <span className="w-2 h-2 rounded-full bg-slate-200 shrink-0" />
                  <span className="text-sm text-slate-400">{s}</span>
                  <span className="ml-auto text-[10px] text-slate-300">Not submitted</span>
                </div>
              );
              return (
                <div key={s} className="flex flex-wrap items-center gap-2 px-5 py-2.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    sub.submission_status === 'accepted' ? 'bg-emerald-500'
                    : sub.submission_status === 'revision_requested' ? 'bg-rose-500'
                    : 'bg-amber-400'
                  }`} />
                  <span className="text-sm font-medium text-slate-800">{s}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${SUB_STATUS_COLORS[sub.submission_status]}`}>
                    {SUB_STATUS_LABELS[sub.submission_status]}
                  </span>
                  <span className="text-[10px] text-slate-400 ml-auto">
                    {new Date(sub.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Per-subject sponsor feedback banner ── */}
      {subject && isRevisionRequired && currentSubmission?.sponsor_feedback && (
        <div className="rounded-xl border-2 border-rose-300 bg-rose-50 p-4 space-y-2" id="revision-banner">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠</span>
            <p className="text-sm font-bold text-rose-800">The class sponsor has requested a revision for <span className="underline">{subject}</span></p>
          </div>
          <div className="rounded-lg border-l-4 border-rose-400 bg-white px-4 py-3">
            <p className="text-xs font-semibold text-rose-600 mb-1">Sponsor's comment:</p>
            <p className="text-sm text-slate-800">{currentSubmission.sponsor_feedback}</p>
          </div>
          {currentSubmission.feedback_sent_at && (
            <p className="text-[10px] text-rose-400">
              Sent {new Date(currentSubmission.feedback_sent_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
          <p className="text-xs text-rose-700 font-medium">Please correct the marks below and resubmit.</p>
        </div>
      )}

      {/* ── Accepted banner ── */}
      {subject && isAccepted && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-800">✓ These marks have been accepted by the class sponsor.</p>
          <p className="text-xs text-emerald-600 mt-0.5">No further action needed unless the sponsor requests a revision.</p>
        </div>
      )}

      {/* ── Marks entry grid ── */}
      {selectedRC && subject && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm" id="marks-entry">
          <div className="border-b border-slate-100 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-900">
                {subject} — mark entry
                {isRevisionRequired && <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">Resubmission</span>}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Enter marks in range 50–100. Leave blank if not applicable.</p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={saving || isLocked}
              className={`rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40 ${
                isRevisionRequired ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-950 hover:bg-cyan-700'
              }`}
            >
              {saving ? 'Submitting…' : isRevisionRequired ? '↩ Resubmit corrected marks' : '📤 Submit marks'}
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
                          disabled={isLocked}
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
