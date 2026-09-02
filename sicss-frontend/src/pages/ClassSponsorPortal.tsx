/**
 * ClassSponsorPortal — /class-sponsor-portal
 *
 * Class sponsors use this page to:
 *   1. See all report cards for their class with subject submission status
 *   2. View which subjects have been submitted by subject teachers
 *   3. Add any missing marks directly
 *   4. Complete the final fields (aggregate, average, rank, conduct, promotion)
 *   5. Submit the completed mark sheet to the VPI for review
 */
import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { reportCardSubjects, parseMark, scoreColor, SEM1_PERIODS, SEM2_PERIODS } from '../services/reportCardService';

type RC = {
  id: number;
  academic_year: string;
  approval_status: string;
  subject_marks: Record<string, Record<string, string>>;
  aggregate?: number;
  average?: number;
  rank?: number;
  total_in_class?: number;
  conduct?: string;
  class_sponsor?: string;
  promoted_to?: string;
  conditional_subjects?: string;
  closing_date?: string;
  rejection_reason?: string;
  student?: { id: number; first_name: string; last_name: string; student_id: string };
  class?: { name: string; section?: string };
};

type Submission = { subject: string; teacher_name: string; submitted_at: string; subject_marks: Record<string, string> };

const STATUS_COLORS: Record<string, string> = {
  draft:          'bg-slate-100 text-slate-700',
  pending_sponsor:'bg-amber-100 text-amber-800',
  pending_vpi:    'bg-blue-100 text-blue-800',
  approved:       'bg-emerald-100 text-emerald-800',
  rejected:       'bg-rose-100 text-rose-700',
};

const ALL_PERIODS = [...SEM1_PERIODS, 'Exam 1', ...SEM2_PERIODS, 'Exam 2'];

function ScoreCell({ value }: { value: string }) {
  const n = parseMark(value);
  return (
    <td style={{
      border: '1px solid #e2e8f0', padding: '4px 6px', textAlign: 'center',
      color: scoreColor(n), fontWeight: n !== null ? 700 : 400, fontSize: 13,
    }}>
      {value || '—'}
    </td>
  );
}

export default function ClassSponsorPortal() {
  const { user } = useAuthStore();

  const [reportCards, setReportCards] = useState<RC[]>([]);
  const [selected, setSelected]       = useState<RC | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading]         = useState(true);
  const [compiling, setCompiling]     = useState(false);
  const [msg, setMsg]                 = useState<{ ok: boolean; text: string } | null>(null);
  const [filterYear, setFilterYear]   = useState(new Date().getFullYear().toString());

  // Compile form fields
  const [compileForm, setCompileForm] = useState({
    aggregate: '', average: '', rank: '', total_in_class: '',
    conduct: '', class_sponsor: user?.first_name ? `${user.first_name} ${user.last_name}` : '',
    promoted_to: '', conditional_subjects: '', closing_date: '',
  });

  useEffect(() => { load(); }, [filterYear]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/report-cards', { params: { academic_year: filterYear } });
      setReportCards(res.data || []);
    } catch { setMsg({ ok: false, text: 'Failed to load report cards.' }); }
    finally { setLoading(false); }
  };

  const selectCard = async (rc: RC) => {
    setSelected(rc);
    setMsg(null);
    setCompileForm({
      aggregate:            rc.aggregate != null ? String(rc.aggregate) : '',
      average:              rc.average   != null ? String(rc.average)   : '',
      rank:                 rc.rank      != null ? String(rc.rank)      : '',
      total_in_class:       rc.total_in_class != null ? String(rc.total_in_class) : '',
      conduct:              rc.conduct             || '',
      class_sponsor:        rc.class_sponsor       || (user?.first_name ? `${user.first_name} ${user.last_name}` : ''),
      promoted_to:          rc.promoted_to          || '',
      conditional_subjects: rc.conditional_subjects || '',
      closing_date:         rc.closing_date         || '',
    });
    try {
      const subRes = await api.get(`/report-cards/${rc.id}/subject-submissions`);
      setSubmissions(subRes.data.submissions || []);
    } catch { setSubmissions([]); }
  };

  // Auto-calculate aggregate and average from subject_marks
  const autoCalculate = () => {
    if (!selected) return;
    const allScores: number[] = [];
    reportCardSubjects.forEach((subj) => {
      const subjMarks = selected.subject_marks?.[subj] || {};
      Object.values(subjMarks).forEach((v) => {
        const n = parseMark(v as string);
        if (n !== null) allScores.push(n);
      });
    });
    if (!allScores.length) { setMsg({ ok: false, text: 'No marks entered yet to calculate from.' }); return; }
    const agg = Math.round(allScores.reduce((a, b) => a + b, 0));
    const avg = (agg / allScores.length).toFixed(1);
    setCompileForm((f) => ({ ...f, aggregate: String(agg), average: avg }));
  };

  const handleCompile = async () => {
    if (!selected) return;
    const unanswered = reportCardSubjects.filter((s) => {
      const sub = selected.subject_marks?.[s];
      return !sub || Object.keys(sub).length === 0;
    });
    if (unanswered.length > 0) {
      const proceed = confirm(`${unanswered.length} subject(s) have no marks yet:\n${unanswered.join(', ')}\n\nSend to VPI anyway?`);
      if (!proceed) return;
    }

    setCompiling(true); setMsg(null);
    try {
      await api.post(`/report-cards/${selected.id}/compile-and-submit`, {
        aggregate:            compileForm.aggregate    ? Number(compileForm.aggregate)    : undefined,
        average:              compileForm.average      ? Number(compileForm.average)      : undefined,
        rank:                 compileForm.rank         ? Number(compileForm.rank)         : undefined,
        total_in_class:       compileForm.total_in_class ? Number(compileForm.total_in_class) : undefined,
        conduct:              compileForm.conduct              || undefined,
        class_sponsor:        compileForm.class_sponsor        || undefined,
        promoted_to:          compileForm.promoted_to          || undefined,
        conditional_subjects: compileForm.conditional_subjects || undefined,
        closing_date:         compileForm.closing_date         || undefined,
      });
      setMsg({ ok: true, text: `✓ Report card compiled and sent to VPI for review.` });
      await load();
      setSelected(null);
    } catch (err: any) {
      setMsg({ ok: false, text: err.response?.data?.message || 'Failed to submit to VPI.' });
    } finally { setCompiling(false); }
  };

  const submittedCount = submissions.length;
  const totalSubjects  = reportCardSubjects.length;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Class sponsor</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Mark sheet compilation</h1>
        <p className="mt-2 text-sm text-slate-500">
          Collect subject marks from teachers, complete the mark sheet, and submit to the VPI for approval.
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

      {/* Filter + card list */}
      <div className="flex gap-5 flex-col lg:flex-row">
        <div className="lg:w-80 shrink-0 space-y-3">
          <div className="flex gap-2 items-center">
            <input value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
              className="input-field w-24 text-sm" placeholder="Year" />
            <span className="text-xs text-slate-400">{reportCards.length} card{reportCards.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? <p className="py-8 text-center text-sm text-slate-500">Loading…</p>
            : reportCards.length === 0
              ? <div className="rounded-xl border-2 border-dashed border-slate-200 py-12 text-center">
                  <p className="text-3xl mb-2">📋</p>
                  <p className="text-sm text-slate-400">No report cards for {filterYear}.<br/>Create them via Report Cards.</p>
                </div>
              : reportCards.map((rc) => {
                const isSelected = selected?.id === rc.id;
                return (
                  <button key={rc.id} onClick={() => selectCard(rc)}
                    className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                      isSelected ? 'border-slate-950 bg-slate-50 shadow-sm'
                                 : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">
                          {rc.student?.first_name} {rc.student?.last_name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {rc.class?.name}{rc.class?.section ? ` - ${rc.class.section}` : ''} · {rc.academic_year}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">{rc.student?.student_id}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_COLORS[rc.approval_status]}`}>
                        {rc.approval_status?.replace('_', ' ')}
                      </span>
                    </div>
                    {rc.rejection_reason && (
                      <p className="mt-2 rounded bg-rose-50 px-2 py-1 text-[10px] text-rose-700">
                        Rejected: {rc.rejection_reason}
                      </p>
                    )}
                  </button>
                );
              })}
        </div>

        {/* Detail panel */}
        {selected ? (
          <div className="flex-1 min-w-0 space-y-4">

            {/* Subject submissions tracker */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">Subject marks received</p>
                  <p className="text-xs text-slate-400 mt-0.5">{submittedCount} of {totalSubjects} subjects submitted by teachers</p>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-32 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full rounded-full bg-cyan-500 transition-all"
                      style={{ width: `${totalSubjects > 0 ? (submittedCount / totalSubjects) * 100 : 0}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 ml-1">
                    {Math.round((submittedCount / totalSubjects) * 100)}%
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 p-4">
                {reportCardSubjects.map((s) => {
                  const sub = submissions.find((x) => x.subject === s);
                  return (
                    <div key={s} className={`rounded-lg border px-3 py-1.5 text-xs ${
                      sub ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'
                    }`}>
                      <span className={sub ? 'font-semibold text-emerald-800' : 'text-slate-500'}>{s}</span>
                      {sub && <span className="ml-1 text-emerald-600 text-[10px]">· {sub.teacher_name}</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Full marks preview */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
              <div className="border-b border-slate-100 px-5 py-3 text-sm font-bold text-slate-900">
                Mark sheet — {selected.student?.first_name} {selected.student?.last_name}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: '"Times New Roman", serif', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ border: '1px solid #e2e8f0', padding: '6px 10px', textAlign: 'left', fontWeight: 700, fontSize: 11 }}>SUBJECT</th>
                    {ALL_PERIODS.map((p) => (
                      <th key={p} style={{ border: '1px solid #e2e8f0', padding: '4px 6px', textAlign: 'center', fontWeight: 700, fontSize: 10, whiteSpace: 'nowrap' }}>{p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportCardSubjects.map((subj) => (
                    <tr key={subj}>
                      <td style={{ border: '1px solid #e2e8f0', padding: '4px 10px', fontWeight: 600, whiteSpace: 'nowrap' }}>{subj}</td>
                      {ALL_PERIODS.map((period) => (
                        <ScoreCell key={period} value={(selected.subject_marks?.[subj]?.[period] || '')} />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Compile form — only for draft/rejected cards */}
            {['draft', 'rejected'].includes(selected.approval_status) && (
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-950">Complete mark sheet details</p>
                  <button onClick={autoCalculate} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                    ⟳ Auto-calculate
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {([
                    ['aggregate',      'Aggregate'],
                    ['average',        'Average'],
                    ['rank',           'Rank in class'],
                    ['total_in_class', 'Total in class'],
                    ['conduct',        'Conduct'],
                    ['class_sponsor',  'Class sponsor name'],
                    ['promoted_to',    'Promoted to grade'],
                    ['conditional_subjects', 'Conditional subjects'],
                    ['closing_date',   'Closing date'],
                  ] as [keyof typeof compileForm, string][]).map(([k, label]) => (
                    <div key={k}>
                      <label className="mb-1 block text-xs font-semibold text-slate-600">{label}</label>
                      <input
                        value={compileForm[k]}
                        onChange={(e) => setCompileForm((f) => ({ ...f, [k]: e.target.value }))}
                        type={['aggregate','average','rank','total_in_class'].includes(k) ? 'number' : 'text'}
                        className="input-field text-sm"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <p className="text-xs text-slate-400">
                    This will merge all subject marks and send the complete report card to the VPI for review.
                  </p>
                  <button onClick={handleCompile} disabled={compiling}
                    className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-cyan-700 disabled:opacity-50 shadow-sm">
                    {compiling ? 'Sending to VPI…' : '📨 Send to VPI for approval'}
                  </button>
                </div>
              </div>
            )}

            {/* Status message for cards already submitted */}
            {selected.approval_status === 'pending_vpi' && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-800 space-y-1">
                <p className="font-bold">⏳ Awaiting VPI review</p>
                <p>This report card has been submitted and is awaiting the VPI's approval.</p>
              </div>
            )}
            {selected.approval_status === 'approved' && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800 space-y-1">
                <p className="font-bold">✓ Approved by VPI</p>
                <p>This report card has been approved and is available to students and parents.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white min-h-[300px]">
            <div className="text-center">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm font-semibold text-slate-600">Select a report card to compile</p>
              <p className="text-xs text-slate-400 mt-1">Choose a student from the list to view and complete their mark sheet.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
