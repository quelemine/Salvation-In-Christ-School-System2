import { useEffect, useState } from 'react';
import api from '../services/api';
import { studentService } from '../services/studentService';
import { classService, type Class } from '../services/classService';
import { teacherService } from '../services/teacherService';
import { useAuthStore } from '../store/authStore';
import {
  reportCardService,
  reportCardSubjects,
  SEM1_PERIODS,
  SEM2_PERIODS,
  parseMark,
  scoreColor,
  type ReportCard,
  type SubjectMarks,
} from '../services/reportCardService';
import ReportCardSheet from '../components/ReportCardSheet';

type Student = { id: number; first_name: string; last_name: string; student_id: string; class_id: number };
type Teacher = { id: number; first_name: string; last_name: string };

function emptyMarks(): SubjectMarks {
  const m: SubjectMarks = {};
  reportCardSubjects.forEach((s) => { m[s] = {}; });
  return m;
}

export default function ReportCards() {
  const { user } = useAuthStore();
  const role = user?.role?.slug || '';
  const isClassSponsor = role === 'class-sponsor';
  const isVPI          = role === 'vice-principal-instruction';
  const isAdmin        = role === 'admin';
  // Viewer roles: can view, comment, print — cannot create, edit, or delete
  const isViewer       = ['principal', 'proprietor', 'proprietress'].includes(role);
  const canCreate      = isAdmin || isClassSponsor;   // can create / edit report cards
  const canDelete      = isAdmin;                      // only admin can delete
  
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
  const [gradeLevel, setGradeLevel] = useState('');
  const [marks, setMarks] = useState<SubjectMarks>(emptyMarks());
  const [aggregate, setAggregate] = useState<number | null>(null);
  const [average, setAverage] = useState<number | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [totalInClass, setTotalInClass] = useState<number | null>(null);
  const [conduct, setConduct] = useState('');
  const [promotedTo, setPromotedTo] = useState('');
  const [conditionalSubjects, setConditionalSubjects] = useState('');
  const [classSponsor, setClassSponsor] = useState('');
  const [principal, setPrincipal] = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [approvalFilter, setApprovalFilter] = useState('');
  // Comments / review notes (viewer roles)
  const [commentingId, setCommentingId]   = useState<number | null>(null);
  const [commentText, setCommentText]     = useState('');
  const [comments, setComments]           = useState<any[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, c, t, rc] = await Promise.all([
        studentService.getAll(),
        classService.getAll(),
        teacherService.getAll(),
        reportCardService.getAll(),
      ]);
      setStudents(Array.isArray(s) ? s : (s as any).data ?? []);
      setClasses(Array.isArray(c) ? c : (c as any).data ?? []);
      setTeachers(Array.isArray(t) ? t : (t as any).data ?? []);
      setReportCards((rc as unknown as ReportCard[]) || []);
    } catch { setError('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handleMarkChange = (subject: string, period: string, value: string) => {
    setMarks((prev) => ({
      ...prev,
      [subject]: { ...prev[subject], [period]: value },
    }));
  };

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

  const handleSave = async () => {
    if (!selectedStudent || !selectedClass) {
      setError('Please select a student and class');
      return;
    }

    setSaving(true);
    setError('');
    
    try {
      const cls = classes.find(c => c.id === selectedClass);
      
      // Calculate aggregate and average from marks
      const allScores: number[] = [];
      reportCardSubjects.forEach((subj) => {
        Object.values(marks[subj] || {}).forEach((val) => {
         const n = parseMark(val);
          if (n !== null) allScores.push(n);
        });
      });
      
      const calculatedAggregate = allScores.length > 0 
        ? Math.round(allScores.reduce((a, b) => a + b, 0)) 
        : null;
      const calculatedAverage = allScores.length > 0 
        ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10 
        : null;

      const data = {
        student_id: selectedStudent,
        class_id: selectedClass,
        teacher_id: selectedTeacher || null,
        academic_year: academicYear,
        grade_level: gradeLevel || cls?.name || '',
        subject_marks: marks,
        aggregate: aggregate ?? calculatedAggregate,
        average: average ?? calculatedAverage,
        rank: rank ?? null,
        total_in_class: totalInClass ?? null,
        conduct: conduct || null,
        promoted_to: promotedTo || null,
        conditional_subjects: conditionalSubjects || null,
        class_sponsor: classSponsor || null,
        principal: principal || null,
        closing_date: closingDate || null,
      };

      const response = await reportCardService.save(data as any);
      await loadData();
      
      // Ask if they want to submit for approval
      if (confirm('Report card saved successfully. Would you like to submit it for approval?')) {
        await api.post(`/report-cards/${response.id}/submit`);
        await loadData();
        alert('Report card submitted for approval.');
      }
      
      setError('');
      setPreviewMode(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save report card');
    } finally {
      setSaving(false);
    }
  };

  const handleSponsorApprove = async (id: number, action: 'approve' | 'reject', reason?: string) => {
    try {
      await api.post(`/report-cards/${id}/sponsor-approve`, {
        action,
        rejection_reason: reason,
      });
      await loadData();
      alert(action === 'approve' ? 'Report card approved and sent to VPI' : 'Report card rejected');
    } catch (err: any) {
      alert('Failed to process approval: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleVPIApprove = async (id: number, action: 'approve' | 'reject', reason?: string) => {
    try {
      await api.post(`/report-cards/${id}/vpi-approve`, {
        action,
        rejection_reason: reason,
      });
      await loadData();
      alert(action === 'approve' ? 'Report card approved and now visible to student' : 'Report card rejected');
    } catch (err: any) {
      alert('Failed to process approval: ' + (err.response?.data?.message || err.message));
    }
  };

  const approvalStatusColor = (status?: string) => {
    switch (status) {
      case 'draft': return 'bg-slate-100 text-slate-600';
      case 'pending_sponsor': return 'bg-amber-100 text-amber-700';
      case 'pending_vpi': return 'bg-blue-100 text-blue-700';
      case 'approved': return 'bg-emerald-100 text-emerald-700';
      case 'rejected': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const filteredReportCards = reportCards.filter(rc => {
    if (!approvalFilter) return true;
    return (rc as any).approval_status === approvalFilter;
  });

  const [printTarget, setPrintTarget] = useState<'report-card' | 'marks-sheet'>('report-card');

  const handlePrint = () => {
    if (printTarget === 'report-card') {
      // Print only the report card preview
      const printContent = document.getElementById('report-card-preview');
      if (!printContent) return;
      
      const printWindow = window.open('', '', 'width=800,height=600');
      if (!printWindow) return;
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Report Card</title>
          <style>
            @media print {
              @page { margin: 0.5cm; }
              body { margin: 0; }
            }
            body { font-family: Arial, sans-serif; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 250);
    } else if (printTarget === 'marks-sheet') {
      // Print only the marks entry form
      const printContent = document.getElementById('marks-sheet');
      if (!printContent) return;
      
      const printWindow = window.open('', '', 'width=800,height=600');
      if (!printWindow) return;
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Marks Sheet</title>
          <style>
            @media print {
              @page { margin: 0.5cm; }
              body { margin: 0; }
            }
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 4px; text-align: center; }
            input { border: none; text-align: center; width: 100%; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 250);
    }
  };

  const loadReportCard = async (rc: ReportCard) => {
    setSelectedStudent(rc.student_id);
    setSelectedClass(rc.class_id);
    setSelectedTeacher(rc.teacher_id ?? null);
    setAcademicYear(rc.academic_year);
    setGradeLevel(rc.grade_level);
    setMarks(rc.subject_marks || emptyMarks());
    setAggregate(rc.aggregate ?? null);
    setAverage(rc.average ?? null);
    setRank(rc.rank ?? null);
    setTotalInClass(rc.total_in_class ?? null);
    setConduct(rc.conduct ?? '');
    setPromotedTo(rc.promoted_to ?? '');
    setConditionalSubjects(rc.conditional_subjects ?? '');
    setClassSponsor(rc.class_sponsor ?? '');
    setPrincipal(rc.principal ?? '');
    setClosingDate(rc.closing_date ?? '');
    setPreviewMode(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this report card?')) return;
    try {
      await api.delete(`/report-cards/${id}`);
      await loadData();
    } catch { setError('Failed to delete report card'); }
  };

  const openComments = async (id: number) => {
    setCommentingId(id);
    setCommentText('');
    setCommentLoading(true);
    try {
      const res = await api.get(`/report-cards/${id}/comments`);
      setComments(res.data.comments || []);
    } catch { setComments([]); }
    finally { setCommentLoading(false); }
  };

  const submitComment = async () => {
    if (!commentText.trim() || !commentingId) return;
    setCommentLoading(true);
    try {
      const res = await api.post(`/report-cards/${commentingId}/comment`, { comment: commentText.trim() });
      setComments(res.data.comments || []);
      setCommentText('');
    } catch { setError('Failed to add comment.'); }
    finally { setCommentLoading(false); }
  };

  const selectedStudentData = students.find(s => s.id === selectedStudent);
  const selectedClassData = classes.find(c => c.id === selectedClass);
  const selectedTeacherData = teachers.find(t => t.id === selectedTeacher);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Academic work</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Report Cards</h1>
          <p className="mt-1 text-sm text-slate-500">{reportCards.length} report card{reportCards.length !== 1 ? 's' : ''} generated.</p>
        </div>
        {canCreate && (
        <button 
          onClick={() => { 
            setPreviewMode(true); 
            setSelectedStudent(null); 
            setSelectedClass(null); 
            setSelectedTeacher(null); 
            setMarks(emptyMarks()); 
            setAggregate(null);
            setAverage(null);
            setRank(null);
            setTotalInClass(null);
            setConduct('');
            setPromotedTo('');
            setConditionalSubjects('');
            setClassSponsor('');
            setPrincipal('');
            setClosingDate('');
            setGradeLevel('');
            setAcademicYear(new Date().getFullYear().toString());
          }} 
          className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 cursor-pointer"
          type="button"
        >
          + New Report Card
        </button>
        )}
      </div>

      {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {/* ── Comments panel (viewer roles) ── */}
      {commentingId !== null && (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 p-4 pt-16 sm:pt-20">
          <div className="flex h-[calc(100vh-6rem)] w-full max-w-md flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-amber-700">Review notes</p>
                <h3 className="text-base font-bold text-slate-950">Comments on report card</h3>
              </div>
              <button onClick={() => setCommentingId(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 text-xl">×</button>
            </div>

            {/* Existing comments */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 px-1">
              {commentLoading && comments.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">Loading comments…</p>
              ) : comments.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-2xl mb-2">💬</p>
                  <p className="text-sm text-slate-400">No comments yet. Be the first to add a review note.</p>
                </div>
              ) : comments.map((c: any) => (
                <div key={c.id} className="px-4 py-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                      {c.user_name?.charAt(0)}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-900">{c.user_name}</span>
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">{c.role}</span>
                    </div>
                    <span className="ml-auto text-xs text-slate-400">{new Date(c.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed pl-9">{c.comment}</p>
                </div>
              ))}
            </div>

            {/* Add comment box */}
            <div className="border-t border-slate-200 p-4 space-y-3">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="input-field"
                rows={3}
                placeholder="Write your review note or comment…"
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setCommentingId(null)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  Close
                </button>
                <button onClick={submitComment} disabled={commentLoading || !commentText.trim()}
                  className="rounded-lg bg-slate-950 px-4 py-1.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-40">
                  {commentLoading ? 'Saving…' : '💬 Add comment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!previewMode ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-4 sm:px-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Existing Report Cards</h2>
            {(isClassSponsor || isVPI || isAdmin) && (
              <select 
                value={approvalFilter} 
                onChange={(e) => setApprovalFilter(e.target.value)}
                className="input-field w-full sm:w-auto text-sm"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="pending_sponsor">Pending Sponsor</option>
                <option value="pending_vpi">Pending VPI</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            )}
          </div>
          {loading ? (
            <p className="py-12 text-center text-sm text-slate-500">Loading…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[700px] divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 sm:px-5 py-3 text-left">Student</th>
                    <th className="px-3 sm:px-5 py-3 text-left hidden sm:table-cell">Class</th>
                    <th className="px-3 sm:px-5 py-3 text-left hidden md:table-cell">Academic Year</th>
                    <th className="px-3 sm:px-5 py-3 text-left hidden md:table-cell">Aggregate</th>
                    <th className="px-3 sm:px-5 py-3 text-left hidden md:table-cell">Average</th>
                    <th className="px-3 sm:px-5 py-3 text-left hidden lg:table-cell">Rank</th>
                    <th className="px-3 sm:px-5 py-3 text-left">Status</th>
                    <th className="px-3 sm:px-5 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReportCards.length === 0 ? (
                    <tr><td colSpan={8} className="py-10 text-center text-slate-400">No report cards found.</td></tr>
                  ) : (
                    filteredReportCards.map((rc) => (
                      <tr key={rc.id} className="hover:bg-slate-50">
                        <td className="px-3 sm:px-5 py-3 font-semibold text-slate-900">
                          {rc.student?.first_name} {rc.student?.last_name}
                        </td>
                        <td className="px-3 sm:px-5 py-3 text-slate-600 hidden sm:table-cell">{rc.class?.name}</td>
                        <td className="px-3 sm:px-5 py-3 text-slate-600 hidden md:table-cell">{rc.academic_year}</td>
                        <td className="px-3 sm:px-5 py-3 text-slate-600 hidden md:table-cell">{rc.aggregate ?? '—'}</td>
                        <td className="px-3 sm:px-5 py-3 text-slate-600 hidden md:table-cell">{rc.average ?? '—'}</td>
                        <td className="px-3 sm:px-5 py-3 text-slate-600 hidden lg:table-cell">{rc.rank ?? '—'}</td>
                        <td className="px-3 sm:px-5 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${approvalStatusColor((rc as any).approval_status)}`}>
                            {(rc as any).approval_status?.replace('_', ' ') || 'draft'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-5 py-3">
                          <div className="flex gap-2 flex-wrap">
                            <button onClick={() => loadReportCard(rc)} className="text-xs font-semibold text-cyan-700 hover:underline whitespace-nowrap">View</button>
                            {(isClassSponsor || isAdmin) && (rc as any).approval_status === 'pending_sponsor' && (
                              <>
                                <button onClick={() => handleSponsorApprove(rc.id, 'approve')} className="text-xs font-semibold text-emerald-600 hover:underline whitespace-nowrap">Approve</button>
                                <button onClick={() => {
                                  const reason = prompt('Rejection reason:');
                                  if (reason) handleSponsorApprove(rc.id, 'reject', reason);
                                }} className="text-xs font-semibold text-rose-600 hover:underline whitespace-nowrap">Reject</button>
                              </>
                            )}
                            {(isVPI || isAdmin) && (rc as any).approval_status === 'pending_vpi' && (
                              <>
                                <button onClick={() => handleVPIApprove(rc.id, 'approve')} className="text-xs font-semibold text-emerald-600 hover:underline whitespace-nowrap">Approve</button>
                                <button onClick={() => {
                                  const reason = prompt('Rejection reason:');
                                  if (reason) handleVPIApprove(rc.id, 'reject', reason);
                                }} className="text-xs font-semibold text-rose-600 hover:underline whitespace-nowrap">Reject</button>
                              </>
                            )}
                            {/* Comment button for viewers (principal, proprietor, proprietress, VPI) */}
                            {(isViewer || isVPI) && (
                              <button onClick={() => openComments(rc.id)} className="text-xs font-semibold text-amber-700 hover:underline whitespace-nowrap">💬 Comment</button>
                            )}
                            {/* Delete — admin only */}
                            {canDelete && (
                              <button onClick={() => handleDelete(rc.id)} className="text-xs font-semibold text-rose-600 hover:underline whitespace-nowrap">Delete</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Form */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Report Card Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Student *</label>
                <select value={selectedStudent || ''} onChange={(e) => setSelectedStudent(Number(e.target.value))} className="input-field">
                  <option value="">Select student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.student_id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Class *</label>
                <select value={selectedClass || ''} onChange={(e) => setSelectedClass(Number(e.target.value))} className="input-field">
                  <option value="">Select class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} {c.section ? `(${c.section})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Class Teacher</label>
                <select value={selectedTeacher || ''} onChange={(e) => setSelectedTeacher(Number(e.target.value) || null)} className="input-field">
                  <option value="">Select teacher</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Academic Year *</label>
                <input type="text" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="input-field" placeholder="2026" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Grade Level</label>
                <input type="text" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} className="input-field" placeholder="Grade 1" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Aggregate</label>
                <input type="number" value={aggregate || ''} onChange={(e) => setAggregate(Number(e.target.value) || null)} className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Average</label>
                <input type="number" step="0.1" value={average || ''} onChange={(e) => setAverage(Number(e.target.value) || null)} className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Rank</label>
                <input type="number" value={rank || ''} onChange={(e) => setRank(Number(e.target.value) || null)} className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Total in Class</label>
                <input type="number" value={totalInClass || ''} onChange={(e) => setTotalInClass(Number(e.target.value) || null)} className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Conduct</label>
                <input type="text" value={conduct} onChange={(e) => setConduct(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Promoted To</label>
                <input type="text" value={promotedTo} onChange={(e) => setPromotedTo(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Conditional Subjects</label>
                <input type="text" value={conditionalSubjects} onChange={(e) => setConditionalSubjects(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Class Sponsor</label>
                <select value={classSponsor} onChange={(e) => setClassSponsor(e.target.value)} className="input-field">
                  <option value="">Select sponsor</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={`${t.first_name} ${t.last_name}`}>{t.first_name} {t.last_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Principal</label>
                <input type="text" value={principal} onChange={(e) => setPrincipal(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Closing Date</label>
                <input type="date" value={closingDate} onChange={(e) => setClosingDate(e.target.value)} className="input-field" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving} className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Report Card'}
              </button>
              <button onClick={() => setPreviewMode(false)} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
            </div>
          </div>

          {/* Grades Entry */}
          <div id="marks-sheet" className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Subject Marks</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 px-2 py-2 text-left font-semibold">Subject</th>
                    {SEM1_PERIODS.map(p => <th key={p} className="border border-slate-300 px-2 py-2 font-semibold">{p}</th>)}
                    <th className="border border-slate-300 px-2 py-2 font-semibold">Exam 1</th>
                    {SEM2_PERIODS.map(p => <th key={p} className="border border-slate-300 px-2 py-2 font-semibold">{p}</th>)}
                    <th className="border border-slate-300 px-2 py-2 font-semibold">Exam 2</th>
                  </tr>
                </thead>
                <tbody>
                  {reportCardSubjects.map(subject => (
                    <tr key={subject}>
                      <td className="border border-slate-300 px-2 py-2 font-medium">{subject}</td>
                      {[...SEM1_PERIODS, 'Exam 1', ...SEM2_PERIODS, 'Exam 2'].map(period => (
                        <td key={period} className="border border-slate-300 px-1 py-1">
                          <input
                            type="number"
                            inputMode="numeric"
                            value={marks[subject]?.[period] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') { handleMarkChange(subject, period, ''); return; }
                              const num = Number(val);
                              if (num > 100) { handleMarkChange(subject, period, '100'); return; }
                              if (num < 0) { handleMarkChange(subject, period, '0'); return; }
                              handleMarkChange(subject, period, val);
                            }}
                            className="w-full rounded text-center text-sm font-semibold"
                            style={{
                              height: 28,
                              border: '1px solid #e2e8f0',
                              color: scoreColor(parseMark(marks[subject]?.[period])),
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                  {/* Aggregate Row */}
                  <tr className="bg-slate-100">
                    <td className="border border-slate-300 px-2 py-2 font-bold text-slate-700">Aggregate</td>
                    {[...SEM1_PERIODS, 'Exam 1', ...SEM2_PERIODS, 'Exam 2'].map(period => (
                      <td key={period} className="border border-slate-300 px-1 py-1">
                        <span className="block text-center font-bold" style={{ color: '#1d4ed8' }}>
                          {periodAggregate(period) ?? '—'}
                        </span>
                      </td>
                    ))}
                  </tr>
                  {/* Average Row */}
                  <tr className="bg-slate-50">
                    <td className="border border-slate-300 px-2 py-2 font-bold text-slate-700">Average</td>
                    {[...SEM1_PERIODS, 'Exam 1', ...SEM2_PERIODS, 'Exam 2'].map(period => (
                      <td key={period} className="border border-slate-300 px-1 py-1">
                        <span className="block text-center font-bold" style={{ color: scoreColor(periodAverage(period)) }}>
                          {periodAverage(period) ?? '—'}
                        </span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Preview</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-slate-700">Print:</label>
                  <select 
                    value={printTarget} 
                    onChange={(e) => setPrintTarget(e.target.value as 'report-card' | 'marks-sheet')}
                    className="rounded border border-slate-300 px-3 py-1.5 text-sm"
                  >
                    <option value="report-card">Report Card</option>
                    <option value="marks-sheet">Marks Sheet</option>
                  </select>
                </div>
                <button onClick={handlePrint} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Print
                </button>
              </div>
            </div>
            {selectedStudent ? (
              <div id="report-card-preview">
                <ReportCardSheet
                  studentName={`${selectedStudentData?.first_name || ''} ${selectedStudentData?.last_name || ''}`}
                  studentId={selectedStudentData?.student_id}
                  className={selectedClassData?.name}
                  teacherName={`${selectedTeacherData?.first_name || ''} ${selectedTeacherData?.last_name || ''}`}
                  academicYear={academicYear}
                  marks={marks}
                  aggregate={aggregate}
                  average={average}
                  rank={rank}
                  totalInClass={totalInClass}
                  conduct={conduct}
                  conditionalSubjects={conditionalSubjects}
                  promotedTo={promotedTo}
                  classSponsor={classSponsor}
                  principal={principal}
                  closingDate={closingDate}
                  editable={false}
                />
              </div>
            ) : (
              <p className="text-center text-slate-500 py-8">Please select a student to preview the report card</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
