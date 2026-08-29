import { useEffect, useState } from 'react';
import api from '../services/api';
import type { GradeRecord } from '../services/gradeService';

type Sheet = { student: { first_name: string; last_name: string; student_id: string; class?: { name: string; section?: string } }; grades: GradeRecord[]; average_score: number };

export default function MyGradeSheet() {
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Sheet>('/my-grade-sheet').then((response) => setSheet(response.data)).catch((err) => setError(err.response?.data?.message || 'Unable to load your grade sheet.'));
  }, []);

  if (error) return <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">{error}</div>;
  if (!sheet) return <p className="py-12 text-center text-sm text-slate-500">Loading your grade sheet…</p>;

  return <div className="space-y-5">
    <div><p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Academic performance</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">My grade sheet</h1><p className="mt-2 text-sm text-slate-500">{sheet.student.first_name} {sheet.student.last_name} · {sheet.student.student_id} · {sheet.student.class?.name || 'No class assigned'}</p></div>
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Subject</th><th className="px-5 py-3">Term</th><th className="px-5 py-3">Year</th><th className="px-5 py-3">Score</th><th className="px-5 py-3">Grade</th><th className="px-5 py-3">Remarks</th></tr></thead><tbody className="divide-y divide-slate-100">{sheet.grades.length ? sheet.grades.map((grade) => <tr key={grade.id}><td className="px-5 py-3 font-semibold text-slate-800">{grade.subject?.code} — {grade.subject?.name}</td><td className="px-5 py-3 text-slate-600">{grade.term}</td><td className="px-5 py-3 text-slate-600">{grade.academic_year}</td><td className="px-5 py-3 text-slate-600">{grade.score}</td><td className="px-5 py-3 font-bold text-cyan-700">{grade.grade}</td><td className="px-5 py-3 text-slate-600">{grade.remarks || '—'}</td></tr>) : <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">No grades have been published yet.</td></tr>}</tbody></table></div>
    {sheet.grades.length > 0 && <p className="text-right text-sm font-semibold text-slate-700">Average score: <span className="text-cyan-700">{sheet.average_score}%</span></p>}
  </div>;
}
