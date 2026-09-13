import { useEffect, useState } from 'react';
import { classService, type Class } from '../services/classService';
import { divisionService, type Division } from '../services/divisionService';
import { studentService } from '../services/studentService';
import { subjectService, type Subject } from '../services/subjectService';
import { gradeService, type GradeRecord } from '../services/gradeService';
import { FormModal } from '../components/FormModal';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { Button, Input, Select, Badge, Table, TableHeader, TableBody, TableRow, TableCell, TableHead, Card, CardContent } from '../components/ui';

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
          <p className="text-sm font-semibold text-blue-700">Academic performance</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {isApprover ? 'Grade Approvals' : 'Grades'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {isApprover ? 'Review student report cards and approve or return for revision.' : 'Complete grades for your assigned students and submit them for approval.'}
          </p>
        </div>
        {!isApprover && (
          <Button onClick={() => setIsOpen(true)}>
            + Add grade
          </Button>
        )}
      </div>
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
          <p className="text-sm text-rose-800 mb-4">{error}</p>
          <Button onClick={() => setError('')} variant="secondary">Dismiss</Button>
        </div>
      )}

      {isApprover ? (
        // VPI/Principal Report Card View
        <div className="space-y-4">
          {reportCards.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-slate-500">{isVPI ? 'No report cards pending VPI approval.' : 'No report cards found.'}</p>
              </CardContent>
            </Card>
          ) : (
            reportCards.map((rc) => (
              <Card key={rc.id}>
                <CardContent className="p-5">
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
                        <Button
                          onClick={() => handleReportCardAction(rc.id, 'approve')}
                          disabled={saving}
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleReportCardAction(rc.id, 'reject')}
                          disabled={saving}
                          variant="danger"
                        >
                          Return to Sponsor
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        // Teacher Grades View
        <>
          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Select
                    label="Division"
                    value={divisionId}
                    onChange={(event) => { setDivisionId(event.target.value); setClassId(''); }}
                    options={[
                      { value: '', label: 'All divisions' },
                      ...divisions.map((division) => ({ 
                        value: String(division.id), 
                        label: division.description ? `${division.name} - ${division.description}` : division.name 
                      }))
                    ]}
                  />
                </div>
                <div>
                  <Select
                    label="Class"
                    value={classId}
                    onChange={(event) => setClassId(event.target.value)}
                    options={[
                      { value: '', label: 'All classes' },
                      ...filteredClasses.map((item) => ({ value: String(item.id), label: `${item.name} ${item.section ? `- ${item.section}` : ''}` }))
                    ]}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead className="hidden sm:table-cell">Class</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grades.filter((item) => !classId || item.student?.class?.id === Number(classId)).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-semibold text-slate-800">{item.student?.first_name} {item.student?.last_name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-slate-500">{item.student?.class?.name || '-'}</TableCell>
                        <TableCell className="text-slate-500">{item.subject?.name || '-'}</TableCell>
                        <TableCell className="text-slate-500">{item.score}</TableCell>
                        <TableCell className="font-bold text-blue-600">{item.grade}</TableCell>
                        <TableCell className="capitalize text-slate-600">
                          <Badge variant={item.approval_status === 'draft' ? 'default' : 'success'}>
                            {item.approval_status || 'draft'}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {isTeacher && item.approval_status === 'draft' && (
                            <Button onClick={() => submitGrade(item.id)} variant="ghost" className="text-blue-600 hover:text-blue-700 text-xs p-0 h-auto">
                              Submit
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
      <FormModal isOpen={isOpen} title="Add grade" onClose={() => setIsOpen(false)} onSubmit={createGrade} submitText="Save grade" isLoading={saving}>
        <div className="space-y-4">
          <div>
            <Select
              label="Division"
              value={divisionId}
              onChange={(event) => { setDivisionId(event.target.value); setClassId(''); setForm({ ...form, student_id: '' }); }}
              options={[
                { value: '', label: 'Select a division' },
                ...divisions.map((division) => ({ 
                  value: String(division.id), 
                  label: division.description ? `${division.name} - ${division.description}` : division.name 
                }))
              ]}
              required
            />
          </div>
          <div>
            <Select
              label="Class"
              value={classId}
              onChange={(event) => { setClassId(event.target.value); setForm({ ...form, student_id: '' }); }}
              options={[
                { value: '', label: 'Select a class' },
                ...filteredClasses.map((item) => ({ value: String(item.id), label: `${item.name} ${item.section ? `- ${item.section}` : ''}` }))
              ]}
              required
            />
          </div>
          <div>
            <Select
              label="Student"
              value={form.student_id}
              onChange={(event) => setForm({ ...form, student_id: event.target.value })}
              options={[
                { value: '', label: 'Select a student' },
                ...students.map((student) => ({ value: String(student.id), label: `${student.user?.user_code || student.student_id} - ${student.first_name} ${student.last_name}` }))
              ]}
              required
            />
          </div>
          <div>
            <Select
              label="Subject"
              value={form.subject_id}
              onChange={(event) => setForm({ ...form, subject_id: event.target.value })}
              options={[
                { value: '', label: 'Select a subject' },
                ...subjects.map((subject) => ({ value: String(subject.id), label: `${subject.code} - ${subject.name}` }))
              ]}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Score"
                type="number"
                value={form.score}
                onChange={(event) => setForm({ ...form, score: event.target.value })}
                min={0}
                max={100}
                required
              />
            </div>
            <div>
              <Select
                label="Term"
                value={form.term}
                onChange={(event) => setForm({ ...form, term: event.target.value })}
                options={[
                  { value: 'Term 1', label: 'Term 1' },
                  { value: 'Term 2', label: 'Term 2' },
                  { value: 'Term 3', label: 'Term 3' },
                ]}
              />
            </div>
          </div>
        </div>
      </FormModal>
    </div>
  );
}
