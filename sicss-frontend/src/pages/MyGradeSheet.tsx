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

  // Calculate semester averages, yearly average, and aggregate
  const sem1Grades = sheet.grades.filter(g => g.term.toLowerCase().includes('sem1') || g.term.toLowerCase().includes('semester 1') || g.term.toLowerCase().includes('1st'));
  const sem2Grades = sheet.grades.filter(g => g.term.toLowerCase().includes('sem2') || g.term.toLowerCase().includes('semester 2') || g.term.toLowerCase().includes('2nd'));
  
  const sem1Avg = sem1Grades.length > 0 ? sem1Grades.reduce((sum, g) => sum + Number(g.score), 0) / sem1Grades.length : 0;
  const sem2Avg = sem2Grades.length > 0 ? sem2Grades.reduce((sum, g) => sum + Number(g.score), 0) / sem2Grades.length : 0;
  const yearlyAvg = sheet.grades.length > 0 ? sheet.grades.reduce((sum, g) => sum + Number(g.score), 0) / sheet.grades.length : 0;
  const aggregate = sheet.grades.reduce((sum, g) => sum + Number(g.score), 0);

  return <div className="space-y-5">
    <div><p className="text-xs font-bold uppercase tracking-widest text-blue-700">Academic performance</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">My grade sheet</h1><p className="mt-2 text-sm text-slate-500">{sheet.student.first_name} {sheet.student.last_name} · {sheet.student.student_id} · {sheet.student.class?.name || 'No class assigned'}</p></div>
    
    {/* Summary Cards */}
    {sheet.grades.length > 0 && (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Sem1 Average</p>
          <p className="mt-1 text-xl font-bold text-blue-700">{sem1Avg.toFixed(1)}%</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Sem2 Average</p>
          <p className="mt-1 text-xl font-bold text-blue-700">{sem2Avg.toFixed(1)}%</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Yearly Average</p>
          <p className="mt-1 text-xl font-bold text-blue-700">{yearlyAvg.toFixed(1)}%</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Aggregate</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{aggregate.toFixed(1)}</p>
        </div>
      </div>
    )}

    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Subject</th><th className="px-5 py-3">Term</th><th className="px-5 py-3">Year</th><th className="px-5 py-3">Score</th><th className="px-5 py-3">Grade</th><th className="px-5 py-3">Remarks</th></tr></thead><tbody className="divide-y divide-slate-100">{sheet.grades.length ? sheet.grades.map((grade) => <tr key={grade.id}><td className="px-5 py-3 font-semibold text-slate-800">{grade.subject?.code} — {grade.subject?.name}</td><td className="px-5 py-3 text-slate-600">{grade.term}</td><td className="px-5 py-3 text-slate-600">{grade.academic_year}</td><td className="px-5 py-3 text-slate-600">{grade.score}</td><td className="px-5 py-3 font-bold text-blue-700">{grade.grade}</td><td className="px-5 py-3 text-slate-600">{grade.remarks || '—'}</td></tr>) : <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">No grades have been published yet.</td></tr>}</tbody></table></div>
  </div>;
}
