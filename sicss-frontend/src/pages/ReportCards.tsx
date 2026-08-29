import { useEffect, useState, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import api from '../services/api';
import { studentService } from '../services/studentService';
import { classService, type Class } from '../services/classService';
import { teacherService } from '../services/teacherService';
import {
  reportCardService,
  reportCardSubjects,
  SEM1_PERIODS,
  SEM2_PERIODS,
  semesterAvg,
  yearlyAvg,
  type ReportCard,
  type SubjectMarks,
} from '../services/reportCardService';
import { useSettingsStore } from '../store/settingsStore';
import ReportCardSheet, { type SignatureImages } from '../components/ReportCardSheet';
import type { Student } from '../types';

type Teacher = { id: number; first_name: string; last_name: string };

function emptyMarks(): SubjectMarks {
  const m: SubjectMarks = {};
  reportCardSubjects.forEach((s) => { m[s] = {}; });
  return m;
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.readAsDataURL(file);
  });
}

/**
 * Render a ReportCardSheet into a hidden iframe and trigger the browser print
 * dialog so only that single sheet is targeted regardless of what else is on
 * the screen.  printMode controls which semester(s) appear.
 */
function printIsolated(
  sheetProps: React.ComponentProps<typeof ReportCardSheet>,
  printMode: 'combined' | 'sem1' | 'sem2',
  pageSize: 'landscape' | 'portrait',
) {
  // Create a temporary hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument!;
  iframeDoc.open();
  iframeDoc.write(`<!DOCTYPE html><html><head>
    <meta charset="utf-8"/>
    <style>
      @page { size: A4 ${pageSize}; margin: 6mm; }
      body  { margin: 0; background: white; }
    </style>
  </head><body><div id="rc-root"></div></body></html>`);
  iframeDoc.close();

  const root = createRoot(iframeDoc.getElementById('rc-root')!);
  root.render(
    <ReportCardSheet
      {...sheetProps}
      printMode={printMode}
      editable={false}
    />,
  );

  // Wait for fonts/images then print
  setTimeout(() => {
    iframe.contentWindow!.print();
    // Clean up after print dialog closes
    setTimeout(() => {
      root.unmount();
      document.body.removeChild(iframe);
    }, 2000);
  }, 600);
}

// ── Signature upload modal ────────────────────────────────────────────────────
function SignatureModal({
  signatures, onSave, onClose,
}: {
  signatures: SignatureImages;
  onSave: (s: SignatureImages) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<SignatureImages>(signatures);
  const sponsorRef = useRef<HTMLInputElement>(null);
  const principalRef = useRef<HTMLInputElement>(null);
  const stampRef = useRef<HTMLInputElement>(null);

  const handleFile = async (key: keyof SignatureImages, file: File) => {
    const url = await readFile(file);
    setDraft((d) => ({ ...d, [key]: url }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-950">Signatures &amp; stamp</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-full text-slate-400 hover:bg-slate-100 text-xl">×</button>
        </div>

        {[
          { key: 'classSponsorSig' as const, label: 'Class Sponsor signature', ref: sponsorRef },
          { key: 'principalSig' as const,   label: 'Principal signature',      ref: principalRef },
          { key: 'stampOverride' as const,  label: 'Custom stamp image (optional)', ref: stampRef },
        ].map(({ key, label, ref }) => (
          <div key={key} className="mb-4">
            <p className="mb-1.5 text-sm font-semibold text-slate-700">{label}</p>
            <div className="flex items-center gap-3">
              {draft[key] && (
                <img src={draft[key]} alt={label} className="h-12 rounded border border-slate-200 object-contain bg-slate-50" />
              )}
              <div className="flex gap-2">
                <button onClick={() => ref.current?.click()}
                  className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:border-cyan-400 hover:text-cyan-700">
                  {draft[key] ? 'Replace' : 'Upload'}
                </button>
                {draft[key] && (
                  <button onClick={() => setDraft((d) => ({ ...d, [key]: undefined }))}
                    className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50">
                    Remove
                  </button>
                )}
              </div>
              <input ref={ref} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(key, f); }} />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Upload a PNG/JPG of the signature on white or transparent background. Max 2 MB.
            </p>
          </div>
        ))}

        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2.5 text-xs text-blue-800">
          💡 Signatures and the stamp appear only on the generated/printed report card, not in the editing view.
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={() => { onSave(draft); onClose(); }}
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700">
            Save signatures
          </button>
        </div>
      </div>
    </div>
  );
}

function GeneratedModal({
  onClose, onPrint, onDownloadSem1, onDownloadSem2, children,
}: {
  onClose: () => void;
  onPrint: () => void;
  onDownloadSem1: () => void;
  onDownloadSem2: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-2 pt-4 sm:p-4 sm:pt-10">
      <div className="w-full max-w-[1280px]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Generated</p>
            <h2 className="text-base font-bold text-slate-950 sm:text-lg">Official Report Card</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={onPrint}
              className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-700 sm:px-4 sm:text-sm">
              🖨 Print combined
            </button>
            <button onClick={onDownloadSem1}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-cyan-400 hover:bg-cyan-50 sm:px-4 sm:text-sm">
              ↓ Sem 1
            </button>
            <button onClick={onDownloadSem2}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-cyan-400 hover:bg-cyan-50 sm:px-4 sm:text-sm">
              ↓ Sem 2
            </button>
            <button onClick={onClose}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:px-4 sm:text-sm">
              Close
            </button>
          </div>
        </div>
        {/* Horizontally scrollable on very small screens so print layout is always visible */}
        <div className="overflow-x-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ReportCards() {
  const { settings } = useSettingsStore();

  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [savedCards, setSavedCards] = useState<ReportCard[]>([]);

  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [year, setYear] = useState(settings.system.academicYear);

  const [marks, setMarks] = useState<SubjectMarks>(emptyMarks());
  const [aggregate, setAggregate] = useState('');
  const [average, setAverage] = useState('');
  const [rank, setRank] = useState('');
  const [totalInClass, setTotalInClass] = useState('');
  const [conduct, setConduct] = useState('');
  const [promotedTo, setPromotedTo] = useState('');
  const [conditionalSubjects, setConditionalSubjects] = useState('');
  const [classSponsor, setClassSponsor] = useState('');
  const [principal, setPrincipal] = useState('');
  const [closingDate, setClosingDate] = useState('');

  const [signatures, setSignatures] = useState<SignatureImages>({});
  const [showSigModal, setShowSigModal] = useState(false);
  const [showGenerated, setShowGenerated] = useState(false);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'ok' | 'err'>('ok');
  const [loading, setLoading] = useState(true);
  const [activeCardId, setActiveCardId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([classService.getAll(), teacherService.getAll(), reportCardService.getAll()])
      .then(([cRes, tRes, rRes]) => {
        setClasses((cRes as unknown as Class[]) || []);
        setTeachers((tRes.data || []) as Teacher[]);
        setSavedCards(rRes);
      })
      .catch(() => notify('Failed to load data.', 'err'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!classId) { setStudents([]); setStudentId(''); return; }
    studentService.getAll().then((r) => {
      setStudents((r.data || []).filter((s: Student) => s.class_id === Number(classId)));
      setStudentId('');
    });
  }, [classId]);

  useEffect(() => {
    if (!studentId || !year) return;
    const existing = savedCards.find((c) => c.student_id === Number(studentId) && c.academic_year === year);
    if (existing) loadCardIntoForm(existing);
    else resetForm();
  }, [studentId, year]);

  const resetForm = () => {
    setMarks(emptyMarks());
    setAggregate(''); setAverage(''); setRank(''); setTotalInClass('');
    setConduct(''); setPromotedTo(''); setConditionalSubjects('');
    setClassSponsor(''); setPrincipal(''); setClosingDate('');
    setActiveCardId(null);
  };

  const loadCardIntoForm = (card: ReportCard) => {
    const m = emptyMarks();
    Object.keys(card.subject_marks || {}).forEach((s) => { m[s] = { ...card.subject_marks[s] }; });
    setMarks(m);
    setAggregate(card.aggregate != null ? String(card.aggregate) : '');
    setAverage(card.average != null ? String(card.average) : '');
    setRank(card.rank != null ? String(card.rank) : '');
    setTotalInClass(card.total_in_class != null ? String(card.total_in_class) : '');
    setConduct(card.conduct || '');
    setPromotedTo(card.promoted_to || '');
    setConditionalSubjects(card.conditional_subjects || '');
    setClassSponsor(card.class_sponsor || '');
    setPrincipal(card.principal || '');
    setClosingDate(card.closing_date || '');
    setActiveCardId(card.id);
  };

  const autoCalculate = useCallback(() => {
    const yrAvgs: number[] = [];
    reportCardSubjects.forEach((subj) => {
      const yr = yearlyAvg(
        semesterAvg(marks[subj] || {}, SEM1_PERIODS, 'Exam 1'),
        semesterAvg(marks[subj] || {}, SEM2_PERIODS, 'Exam 2'),
      );
      if (yr !== null) yrAvgs.push(yr);
    });
    if (!yrAvgs.length) { notify('Enter some scores first.', 'err'); return; }
    const agg = yrAvgs.reduce((a, b) => a + b, 0);
    setAggregate(String(Math.round(agg)));
    setAverage((agg / yrAvgs.length).toFixed(1));
    notify('Aggregate and average calculated.', 'ok');
  }, [marks]);

  const notify = (msg: string, type: 'ok' | 'err') => {
    setMessage(msg); setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const selectedStudent = students.find((s) => s.id === Number(studentId));
  const selectedClass   = classes.find((c) => c.id === Number(classId));
  const selectedTeacher = teachers.find((t) => t.id === Number(teacherId));

  const sharedProps = {
    studentName:  selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : '',
    studentId:    selectedStudent?.student_id,
    className:    selectedClass ? `${selectedClass.name}${selectedClass.section ? ` - ${selectedClass.section}` : ''}` : '',
    teacherName:  selectedTeacher ? `${selectedTeacher.first_name} ${selectedTeacher.last_name}` : '',
    academicYear: year,
    marks,
    aggregate:    aggregate ? Number(aggregate) : null,
    average:      average   ? Number(average)   : null,
    rank:         rank      ? Number(rank)       : null,
    totalInClass: totalInClass ? Number(totalInClass) : null,
    conduct:      conduct || null,
    promotedTo:   promotedTo || null,
    conditionalSubjects: conditionalSubjects || null,
    classSponsor: classSponsor || null,
    principal:    principal || null,
    closingDate:  closingDate || null,
  };

  const handleSave = async () => {
    if (!studentId || !classId) { notify('Select a class and student first.', 'err'); return; }
    setSaving(true);
    try {
      const saved = await reportCardService.save({
        student_id: Number(studentId), class_id: Number(classId),
        teacher_id: teacherId ? Number(teacherId) : undefined,
        academic_year: year, grade_level: selectedClass?.name || '',
        subject_marks: marks,
        aggregate: aggregate ? Number(aggregate) : null,
        average:   average   ? Number(average)   : null,
        rank:      rank      ? Number(rank)       : null,
        total_in_class: totalInClass ? Number(totalInClass) : null,
        conduct: conduct || null, promotion_status: 'promoted',
        conditional_subjects: conditionalSubjects || null,
        promoted_to: promotedTo || null,
        class_sponsor: classSponsor || null,
        principal: principal || null,
        closing_date: closingDate || null,
      });
      setActiveCardId(saved.id);
      setSavedCards((prev) => {
        const i = prev.findIndex((c) => c.id === saved.id);
        return i >= 0 ? prev.map((c) => (c.id === saved.id ? saved : c)) : [saved, ...prev];
      });
      notify('Report card saved.', 'ok');
    } catch { notify('Failed to save.', 'err'); }
    finally { setSaving(false); }
  };

  // Clearance check — blocks print/generate if fees outstanding
  const checkClearance = async (): Promise<boolean> => {
    if (!studentId || !year) return true;
    try {
      const res = await api.get(`/students/${studentId}/clearance`, { params: { academic_year: year } });
      if (!res.data.cleared) {
        notify(`⛔ ${res.data.student_name} has outstanding school fees for ${year}. Report card cannot be printed until fees are cleared.`, 'err');
        return false;
      }
    } catch {
      // If clearance check fails (e.g. network), allow admin but warn
    }
    return true;
  };

  const handleGenerate = async () => {
    if (!studentId) { notify('Select a student first.', 'err'); return; }
    const cleared = await checkClearance();
    if (!cleared) return;
    setShowGenerated(true);
  };

  const handlePrint = () => { window.print(); };

  // Download helpers — each renders into a hidden iframe then triggers print
  const downloadSheet = async (mode: 'combined' | 'sem1' | 'sem2') => {
    if (!studentId) { notify('Select a student first.', 'err'); return; }
    const cleared = await checkClearance();
    if (!cleared) return;
    const pageSize = mode === 'combined' ? 'landscape' : 'portrait';
    printIsolated({ ...sharedProps, signatures }, mode, pageSize);
  };

  if (loading) return <p className="py-12 text-center text-sm text-slate-500">Loading…</p>;

  return (
    <div className="space-y-5">
      {/* Print CSS — targets generated card overlay */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #rc-generated-print { display: block !important; }
          #rc-generated-print * { visibility: visible; }
          @page { size: A4 landscape; margin: 6mm; }
        }
        #rc-generated-print { display: none; }
      `}</style>

      {showGenerated && (
        <div id="rc-generated-print">
          <ReportCardSheet {...sharedProps} editable={false} signatures={signatures} printMode="combined" />
        </div>
      )}

      {/* ── Signature upload modal ── */}
      {showSigModal && (
        <SignatureModal
          signatures={signatures}
          onSave={setSignatures}
          onClose={() => setShowSigModal(false)}
        />
      )}

      {showGenerated && (
        <GeneratedModal
          onClose={() => setShowGenerated(false)}
          onPrint={handlePrint}
          onDownloadSem1={() => downloadSheet('sem1')}
          onDownloadSem2={() => downloadSheet('sem2')}
        >
          <ReportCardSheet {...sharedProps} editable={false} signatures={signatures} printMode="combined" />
        </GeneratedModal>
      )}

      {/* ── Screen: entry view ── */}
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Academic records</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Report cards</h1>
            <p className="mt-1 text-sm text-slate-500">
              Enter scores then tap <strong>Generate</strong> for the official document.
            </p>
          </div>
          {/* Action buttons — wrap on small screens */}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {/* Utility row */}
            <div className="flex flex-wrap gap-2">
              <button onClick={autoCalculate}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:px-4 sm:text-sm">
                ⟳ Auto-calc
              </button>
              <button onClick={() => setShowSigModal(true)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:px-4 sm:text-sm">
                ✍ Signatures
              </button>
              <button onClick={handleSave} disabled={saving || !studentId}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 sm:px-4 sm:text-sm">
                {saving ? 'Saving…' : '💾 Save'}
              </button>
            </div>
            {/* Download / generate row */}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => downloadSheet('sem1')} disabled={!studentId}
                title="Print or save as PDF — 1st Semester only (portrait A4)"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-800 disabled:opacity-40 sm:px-4 sm:text-sm">
                ↓ Sem&nbsp;1
              </button>
              <button onClick={() => downloadSheet('sem2')} disabled={!studentId}
                title="Print or save as PDF — 2nd Semester only (portrait A4)"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-800 disabled:opacity-40 sm:px-4 sm:text-sm">
                ↓ Sem&nbsp;2
              </button>
              <button onClick={() => downloadSheet('combined')} disabled={!studentId}
                title="Print or save as PDF — full combined card (landscape A4)"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-800 disabled:opacity-40 sm:px-4 sm:text-sm">
                ↓ Combined
              </button>
              <button onClick={handleGenerate} disabled={!studentId}
                className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white hover:bg-cyan-700 disabled:opacity-40 shadow-sm sm:px-4 sm:text-sm">
                🎓 Generate
              </button>
            </div>
          </div>
        </div>

        {/* Status message */}
        {message && (
          <p className={`rounded-lg px-4 py-2.5 text-sm font-medium ${messageType === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'}`}>
            {message}
          </p>
        )}

        {/* Signatures status */}
        {(signatures.classSponsorSig || signatures.principalSig) && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800">
            ✓ Signatures loaded —{' '}
            {[signatures.classSponsorSig && 'Class Sponsor', signatures.principalSig && 'Principal', signatures.stampOverride && 'Custom stamp'].filter(Boolean).join(', ')}
          </div>
        )}

        {/* Selection row */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-sm font-bold text-slate-900">Select student</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5">
            <select value={classId} onChange={(e) => setClassId(e.target.value)} className="input-field">
              <option value="">Select class</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>)}
            </select>
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="input-field" disabled={!classId}>
              <option value="">Select student</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
            </select>
            <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="input-field">
              <option value="">Select teacher</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
            </select>
            <input value={year} onChange={(e) => setYear(e.target.value)} className="input-field" placeholder="Academic year" />
            {activeCardId && (
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                ✓ Saved (ID {activeCardId})
              </div>
            )}
          </div>
        </div>

        {/* Saved cards table */}
        {savedCards.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-3 text-sm font-bold text-slate-950">
              Saved report cards ({savedCards.length})
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>{['Student', 'Class', 'Year', 'Average', 'Rank', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {savedCards.map((card) => (
                    <tr key={card.id} className={`hover:bg-slate-50 ${activeCardId === card.id ? 'bg-cyan-50' : ''}`}>
                      <td className="px-4 py-2 font-semibold text-slate-900">
                        {card.student ? `${card.student.first_name} ${card.student.last_name}` : `#${card.student_id}`}
                      </td>
                      <td className="px-4 py-2 text-slate-600">{card.class?.name || '—'}</td>
                      <td className="px-4 py-2 text-slate-600">{card.academic_year}</td>
                      <td className="px-4 py-2 font-semibold"
                        style={{ color: card.average ? (Number(card.average) < 70 ? '#b91c1c' : '#1d4ed8') : 'inherit' }}>
                        {card.average ?? '—'}
                      </td>
                      <td className="px-4 py-2 text-slate-600">{card.rank ?? '—'}</td>
                      <td className="px-4 py-2 capitalize text-slate-600">
                        {card.promotion_status?.replace('_', ' ') || '—'}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-3">
                          <button onClick={() => {
                            setClassId(String(card.class_id));
                            setStudentId(String(card.student_id));
                            setYear(card.academic_year);
                            if (card.teacher_id) setTeacherId(String(card.teacher_id));
                            setTimeout(() => loadCardIntoForm(card), 50);
                          }} className="text-xs font-semibold text-cyan-700 hover:underline">Open</button>
                          <button onClick={() => {
                            loadCardIntoForm(card);
                            setStudentId(String(card.student_id));
                            setClassId(String(card.class_id));
                            setYear(card.academic_year);
                            setTimeout(() => setShowGenerated(true), 60);
                          }} className="text-xs font-semibold text-slate-600 hover:underline">Generate</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Editable grade entry sheet ── */}
      <ReportCardSheet
        {...sharedProps}
        editable={true}
        onMarkChange={(subj, period, v) =>
          setMarks((prev) => ({ ...prev, [subj]: { ...prev[subj], [period]: v } }))}
        onFieldChange={(field, value) => {
          const m: Record<string, (v: string) => void> = {
            aggregate: setAggregate, average: setAverage, rank: setRank,
            totalInClass: setTotalInClass, conduct: setConduct,
            promotedTo: setPromotedTo, classSponsor: setClassSponsor,
            principal: setPrincipal, closingDate: setClosingDate,
          };
          m[field]?.(value);
        }}
      />

      <p className="text-xs text-slate-400">
        Scores below 70 shown in red · 70 and above in blue · averages auto-calculated.
      </p>
    </div>
  );
}
