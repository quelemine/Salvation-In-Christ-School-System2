import { useEffect, useState } from 'react';
import { classService, type Class } from '../services/classService';
import { divisionService, type Division } from '../services/divisionService';
import { studentService } from '../services/studentService';
import { subjectService, type Subject } from '../services/subjectService';
import { gradeService, type GradeRecord } from '../services/gradeService';
import { FormModal } from '../components/FormModal';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

type StudentOption = { id: number; first_name: string; last_name: string; student_id: string; class_id?: number; class?: { name: string }; user?: { user_code?: string } };
type ReportCard = { id: number; student: { id: number; first_name: string; last_name: string; class?: { name: string } }; class?: { name: string }; academic_year: string; approval_status: string; average?: number; rank?: number };

export default function Grades() {
  const { user } = useAuthStore();
  const role = user?.role?.slug || '';
  const isTeacher = ['teacher', 'class-teacher', 'subject-teacher'].includes(role);
  const isApprover = ['admin', 'vice-principal-instruction', 'principal', 'proprietor', 'proprietress'].includes(role);
  const isVPI = role === 'vice-principal-instruction';
  const canApprove = ['admin', 'vice-principal-instruction'].includes(role);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [divisionId, setDivisionId] = useState('');
  const [classId, setClassId] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ student_id: '', subject_id: '', score: '', term: 'Term 1', academic_year: '2026', remarks: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([divisionService.getAll(), classService.getAll(), subjectService.getAll()]).then(([divisionResult, classResult, subjectResult]) => {
      setDivisions((Array.isArray(divisionResult) ? divisionResult : divisionResult.data) || []);
      setClasses((classResult as unknown as Class[]) || []);
      setSubjects((Array.isArray(subjectResult) ? subjectResult : subjectResult.data || []) as unknown as Subject[]);
    }).catch(() => setError('Unable to load academic records.'));

    if (isApprover) {
      // For VPI: load report cards pending VPI approval
      // For Principal/Proprietor/Proprietress: load all report cards
      const isVPI = role === 'vice-principal-instruction';
      const endpoint = isVPI ? '/report-cards?approval_status=pending_vpi' : '/report-cards';
      api.get(endpoint).then((res) => setReportCards(res.data || [])).catch(() => setError('Unable to load report cards.'));
    } else {
      gradeService.getAll().then((gradeResult) => setGrades(gradeResult.data || [])).catch(() => setError('Unable to load grades.'));
    }
  }, [isApprover, role]);

  useEffect(() => {
    if (!classId) { setStudents([]); return; }
    studentService.getAll({ class_id: classId }).then((result) => setStudents((result.data || []) as StudentOption[])).catch(() => setError('Unable to load students for this class.'));
  }, [classId]);

  const filteredClasses = classes.filter((item) => !divisionId || item.division_id === Number(divisionId));
  const createGrade = async () => {
    setSaving(true); setError('');
    try {
      const created = await gradeService.create({ ...form, student_id: Number(form.student_id), subject_id: Number(form.subject_id), score: Number(form.score) });
      setGrades((current) => [created, ...current]); setIsOpen(false); setForm({ ...form, student_id: '', subject_id: '', score: '', remarks: '' });
    } catch { setError('Unable to save this grade.'); } finally { setSaving(false); }
  };

  const replaceGrade = (updated: GradeRecord) => setGrades((current) => current.map((grade) => grade.id === updated.id ? updated : grade));
  const submitGrade = async (id: number) => {
    try { replaceGrade(await gradeService.submit(id)); } catch { setError('Unable to submit this grade for approval.'); }
  };
  // reviewGrade is reserved for future VPI/Principal approval UI

  const handleReportCardAction = async (id: number, action: 'approve' | 'reject') => {
    const reason = action === 'reject' ? window.prompt('Reason for returning this report card (optional):') || '' : '';
    setSaving(true);
    try {
      await api.post(`/report-cards/${id}/vpi-approve`, { action, rejection_reason: reason });
      setReportCards((prev) => prev.filter((rc) => rc.id !== id));
    } catch { setError('Unable to process this report card.'); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-cyan-700">Academic performance</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
            {isApprover ? 'Grade Approvals' : 'Grades'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {isApprover ? 'Review student report cards and approve or return for revision.' : 'Complete grades for your assigned students and submit them for approval.'}
          </p>
        </div>
        {!isApprover && (
          <button onClick={() => setIsOpen(true)} className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700">
            + Add grade
          </button>
        )}
      </div>
      {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {isApprover ? (
        // VPI/Principal Report Card View
        <div className="space-y-4">
          {reportCards.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-slate-500">{isVPI ? 'No report cards pending VPI approval.' : 'No report cards found.'}</p>
            </div>
          ) : (
            reportCards.map((rc) => (
              <div key={rc.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {rc.student.first_name} {rc.student.last_name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {rc.student.class?.name || 'No class'} · {rc.academic_year}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      <span className="font-semibold">Status:</span> {rc.approval_status || 'Unknown'}
                    </p>
                    {typeof rc.average === 'number' && (
                      <p className="mt-2 text-sm">
                        <span className="font-semibold text-slate-700">Average:</span> {rc.average.toFixed(2)}
                        {typeof rc.rank === 'number' && (
                          <>
                            <span className="ml-3 font-semibold text-slate-700">Rank:</span> {rc.rank}
                          </>
                        )}
                      </p>
                    )}
                  </div>
                  {canApprove && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReportCardAction(rc.id, 'approve')}
                        disabled={saving}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReportCardAction(rc.id, 'reject')}
                        disabled={saving}
                        className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                      >
                        Return to Sponsor
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        // Teacher Grades View
        <>
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Division</label>
              <select value={divisionId} onChange={(event) => { setDivisionId(event.target.value); setClassId(''); }} className="input-field">
                <option value="">All divisions</option>
                {divisions.map((division) => <option key={division.id} value={division.id}>{division.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Class</label>
              <select value={classId} onChange={(event) => setClassId(event.target.value)} className="input-field">
                <option value="">All classes</option>
                {filteredClasses.map((item) => <option key={item.id} value={item.id}>{item.name} {item.section ? `- ${item.section}` : ''}</option>)}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 sm:px-6 py-3">Student</th>
                  <th className="px-3 sm:px-6 py-3 hidden sm:table-cell">Class</th>
                  <th className="px-3 sm:px-6 py-3">Subject</th>
                  <th className="px-3 sm:px-6 py-3">Score</th>
                  <th className="px-3 sm:px-6 py-3">Grade</th>
                  <th className="px-3 sm:px-6 py-3">Status</th>
                  <th className="px-3 sm:px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grades.filter((item) => !classId || item.student?.class?.id === Number(classId)).map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-slate-800">{item.student?.first_name} {item.student?.last_name}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-slate-500 hidden sm:table-cell">{item.student?.class?.name || '-'}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-slate-500">{item.subject?.name || '-'}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-slate-500">{item.score}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 font-bold text-cyan-700">{item.grade}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 capitalize text-slate-600">{item.approval_status || 'draft'}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {isTeacher && item.approval_status === 'draft' && (
                        <button onClick={() => submitGrade(item.id)} className="text-xs sm:text-sm font-semibold text-cyan-700 hover:text-cyan-900">Submit</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <FormModal isOpen={isOpen} title="Add grade" onClose={() => setIsOpen(false)} onSubmit={createGrade} submitText="Save grade" isLoading={saving}>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Division</label>
            <select required value={divisionId} onChange={(event) => { setDivisionId(event.target.value); setClassId(''); setForm({ ...form, student_id: '' }); }} className="input-field">
              <option value="">Select a division</option>
              {divisions.map((division) => <option key={division.id} value={division.id}>{division.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Class</label>
            <select required value={classId} onChange={(event) => { setClassId(event.target.value); setForm({ ...form, student_id: '' }); }} className="input-field">
              <option value="">Select a class</option>
              {filteredClasses.map((item) => <option key={item.id} value={item.id}>{item.name} {item.section ? `- ${item.section}` : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Student</label>
            <select required value={form.student_id} onChange={(event) => setForm({ ...form, student_id: event.target.value })} className="input-field">
              <option value="">Select a student</option>
              {students.map((student) => <option key={student.id} value={student.id}>{student.user?.user_code || student.student_id} - {student.first_name} {student.last_name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Subject</label>
            <select required value={form.subject_id} onChange={(event) => setForm({ ...form, subject_id: event.target.value })} className="input-field">
              <option value="">Select a subject</option>
              {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.code} - {subject.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Score</label>
              <input required min="0" max="100" type="number" value={form.score} onChange={(event) => setForm({ ...form, score: event.target.value })} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Term</label>
              <select value={form.term} onChange={(event) => setForm({ ...form, term: event.target.value })} className="input-field">
                <option>Term 1</option>
                <option>Term 2</option>
                <option>Term 3</option>
              </select>
            </div>
          </div>
        </div>
      </FormModal>
    </div>
  );
}
