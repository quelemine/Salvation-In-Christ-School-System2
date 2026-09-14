import { useEffect, useState } from 'react';
import api from '../services/api';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';
import ReportCardSheet from '../components/ReportCardSheet';
import NurseryKGReportCardSheet from '../components/NurseryKGReportCardSheet';
import type { SubjectMarks } from '../services/reportCardService';
import { reportCardSubjects, SEM1_PERIODS, SEM2_PERIODS } from '../services/reportCardService';
import { reportCardTemplateService, type LearningArea } from '../services/reportCardTemplateService';

type View = 'attendance' | 'assignments' | 'financial-records' | 'report-card';
const titles: Record<View, string> = { 
  attendance: 'My attendance', 
  assignments: 'My assignments', 
  'financial-records': 'My financial records',
  'report-card': 'My report card'
};

export default function StudentPortal({ view }: { view: View }) {
  const { settings } = useSettingsStore();
  const { user } = useAuthStore();
  const exchangeRate = settings.system.exchangeRate || 200; // Default 200 LRD = 1 USD
  const [data, setData] = useState<any>(null); 
  const [error, setError] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(new Date().getFullYear().toString());
  const [learningAreas, setLearningAreas] = useState<LearningArea[]>([]);
  const [template, setTemplate] = useState<any>(null);
  
  // Check if user is a school owner (admin or teacher)
  const isSchoolOwner = user?.role?.slug === 'admin' || user?.role?.slug === 'teacher';
  
  useEffect(() => { 
    const params = view === 'report-card' ? { academic_year: selectedAcademicYear } : {};
    api.get(`/student-portal/${view}`, { params })
      .then((r) => {
        setData(r.data);
        // If report card view, load template and learning areas based on class
        if (view === 'report-card' && r.data?.class) {
          loadTemplateAndLearningAreas(r.data.class);
        }
      })
      .catch((e) => setError(e.response?.data?.message || 'Unable to load your records.')); 
  }, [view, selectedAcademicYear]);

  const loadTemplateAndLearningAreas = async (classData: any) => {
    try {
      // Determine grade level type based on class name
      const className = classData.name?.toLowerCase() || '';
      let gradeLevelType = 'primary'; // default
      
      if (className.includes('nursery') || className.includes('kg') || className.includes('kindergarten')) {
        gradeLevelType = 'nursery_kg';
      } else if (className.includes('grade 7') || className.includes('grade 8') || className.includes('grade 9') || className.includes('jhs')) {
        gradeLevelType = 'junior_high';
      } else if (className.includes('grade 10') || className.includes('grade 11') || className.includes('grade 12') || className.includes('shs')) {
        gradeLevelType = 'senior_high';
      }

      // Load template
      const templates = await reportCardTemplateService.getAllTemplates();
      const matchedTemplate = templates.find(t => t.grade_level_type === gradeLevelType);
      setTemplate(matchedTemplate || null);

      // Load learning areas
      const areas = await reportCardTemplateService.getLearningAreas(gradeLevelType);
      setLearningAreas(areas);
    } catch (err) {
      console.error('Failed to load template/learning areas:', err);
    }
  };
  
  if (error) return <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">{error}</div>;
  if (!data) return <p className="py-12 text-center text-sm text-slate-500">Loading…</p>;
  
  if (view === 'financial-records') {
    const convertToUSD = (lrdAmount: number) => lrdAmount ? (lrdAmount / exchangeRate).toFixed(2) : '—';
    return (
      <div className="space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Finance</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">{titles[view]}</h1>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Total due" value={data.total_due || 0} valueUSD={convertToUSD(data.total_due || 0)} />
          <Stat label="Total paid" value={data.total_paid || 0} valueUSD={convertToUSD(data.total_paid || 0)} />
          <Stat label="Balance" value={data.balance || 0} valueUSD={convertToUSD(data.balance || 0)} />
        </div>
        <Table 
          headers={['Fee', 'Due date', 'LRD Amount', 'USD Amount']} 
          rows={(data.fees || []).map((x: any) => [
            x.name, 
            x.due_date ? new Date(x.due_date).toLocaleDateString() : '—', 
            x.amount_lrd ? `LRD ${Number(x.amount_lrd).toLocaleString()}` : '—', 
            x.amount_lrd ? `USD ${convertToUSD(x.amount_lrd)}` : '—'
          ])} 
        />
        <Table 
          headers={['Payment date', 'Fee', 'LRD Amount', 'USD Amount', 'Status']} 
          rows={(data.payments || []).map((x: any) => [
            x.payment_date ? new Date(x.payment_date).toLocaleDateString() : '—', 
            x.fee?.name || '—', 
            x.amount_lrd ? `LRD ${Number(x.amount_lrd).toLocaleString()}` : '—', 
            x.amount_lrd ? `USD ${convertToUSD(x.amount_lrd)}` : '—', 
            x.status
          ])} 
        />
      </div>
    );
  }

  if (view === 'report-card') {
    const reportCardData = data;
    const marks: SubjectMarks = reportCardData?.subject_marks || {};

    // Calculate overall semester averages from subject marks
    const calculateOverallSemAvg = (periods: readonly string[], examKey: string) => {
      const subjectAvgs: number[] = [];
      reportCardSubjects.forEach((subj: string) => {
        const subjMarks = marks[subj] || {};
        const scores: number[] = [];
        periods.forEach((p) => {
          const n = subjMarks[p] ? Number(subjMarks[p]) : null;
          if (n !== null && !isNaN(n)) scores.push(n);
        });
        const exam = subjMarks[examKey] ? Number(subjMarks[examKey]) : null;
        if (exam !== null && !isNaN(exam)) scores.push(exam);
        if (scores.length > 0) {
          const avg = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
          subjectAvgs.push(avg);
        }
      });
      if (subjectAvgs.length === 0) return null;
      return Math.round((subjectAvgs.reduce((a, b) => a + b, 0) / subjectAvgs.length) * 10) / 10;
    };

    const overallSem1Avg = calculateOverallSemAvg(SEM1_PERIODS, 'Exam 1');
    const overallSem2Avg = calculateOverallSemAvg(SEM2_PERIODS, 'Exam 2');
    
    // Calculate overall yearly average as (Sem1 + Sem2) / 2
    const calculatedYearlyAvg = () => {
      if (overallSem1Avg === null && overallSem2Avg === null) return null;
      if (overallSem1Avg === null) return overallSem2Avg;
      if (overallSem2Avg === null) return overallSem1Avg;
      return Math.round(((overallSem1Avg + overallSem2Avg) / 2) * 10) / 10;
    };

    // Calculate aggregate as sum of all individual scores across all subjects and periods
    const calculatedAggregate = () => {
      let total = 0;
      let count = 0;
      reportCardSubjects.forEach((subj: string) => {
        const subjMarks = marks[subj] || {};
        // Sum all period marks
        [...SEM1_PERIODS, 'Exam 1', ...SEM2_PERIODS, 'Exam 2'].forEach((period) => {
          const n = subjMarks[period] ? Number(subjMarks[period]) : null;
          if (n !== null && !isNaN(n)) {
            total += n;
            count++;
          }
        });
      });
      return count > 0 ? total : null;
    };

    const handleDownloadReportCard = () => {
      const printContent = document.getElementById('student-report-card');
      if (!printContent) return;
      
      const printWindow = window.open('', '', 'width=800,height=600');
      if (!printWindow) return;
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Student Report Card</title>
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
    };

    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Academic records</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{titles[view]}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Academic Year:</label>
              <select 
                value={selectedAcademicYear} 
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                className="rounded border border-slate-300 px-3 py-1.5 text-sm"
              >
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>
            {!isSchoolOwner && reportCardData && (
              <button 
                onClick={handleDownloadReportCard}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Download Report Card
              </button>
            )}
          </div>
        </div>
        {reportCardData ? (
          <div id="student-report-card">
            {template?.grade_level_type === 'nursery_kg' ? (
              <NurseryKGReportCardSheet
                studentName={`${reportCardData.student?.first_name || ''} ${reportCardData.student?.last_name || ''}`}
                studentId={reportCardData.student?.student_id}
                className={reportCardData.class?.name}
                teacherName={`${reportCardData.teacher?.first_name || ''} ${reportCardData.teacher?.last_name || ''}`}
                academicYear={reportCardData.academic_year}
                marks={marks}
                rank={reportCardData.rank ? Number(reportCardData.rank) : null}
                totalInClass={reportCardData.total_in_class ? Number(reportCardData.total_in_class) : null}
                conduct={reportCardData.conduct || null}
                promotedTo={reportCardData.promoted_to || null}
                classSponsor={reportCardData.class_sponsor || null}
                principal={reportCardData.principal || null}
                closingDate={reportCardData.closing_date || null}
                editable={false}
                learningAreas={learningAreas}
                assessmentPeriods={template?.assessment_periods || { sem1: ['1st pd', '2nd pd', '3rd pd', 'Exam'], sem2: ['4th pd', '5th pd', '6th pd', 'Exam'] }}
                gradingScale={template?.grading_scale || { 'A': 'Excellent', 'B': 'Good', 'C': 'Fair', 'D': 'Needs Improvement', 'E': 'Poor' }}
              />
            ) : (
              <ReportCardSheet
                studentName={`${reportCardData.student?.first_name || ''} ${reportCardData.student?.last_name || ''}`}
                studentId={reportCardData.student?.student_id}
                className={reportCardData.class?.name}
                teacherName={`${reportCardData.teacher?.first_name || ''} ${reportCardData.teacher?.last_name || ''}`}
                academicYear={reportCardData.academic_year}
                marks={marks}
                aggregate={calculatedAggregate()}
                average={calculatedYearlyAvg()}
                rank={reportCardData.rank ? Number(reportCardData.rank) : null}
                totalInClass={reportCardData.total_in_class ? Number(reportCardData.total_in_class) : null}
                conduct={reportCardData.conduct || null}
                promotedTo={reportCardData.promoted_to || null}
                conditionalSubjects={reportCardData.conditional_subjects || null}
                classSponsor={reportCardData.class_sponsor || null}
                principal={reportCardData.principal || null}
                closingDate={reportCardData.closing_date || null}
                editable={false}
              />
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
            The report card is not ready yet or check your financial status
          </div>
        )}
      </div>
    );
  }
  
  const rows = view === 'attendance'
    ? (data || []).map((x: any) => [x.date ? new Date(x.date).toLocaleDateString() : '—', x.status, x.remarks || '—'])
    : (data || []).map((x: any) => [x.subject?.name || '—', x.title, x.due_date ? new Date(x.due_date).toLocaleDateString() : '—', x.teacher ? `${x.teacher.first_name} ${x.teacher.last_name}` : '—']);
    
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Student portal</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950">{titles[view]}</h1>
      </div>
      <Table 
        headers={view === 'attendance' ? ['Date', 'Status', 'Remarks'] : ['Subject', 'Assignment', 'Due date', 'Teacher']} 
        rows={rows} 
      />
    </div>
  );
}

function Stat({ label, value, valueUSD }: { label: string; value: number; valueUSD?: string | number }) { 
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-950">{Number(value).toFixed(2)} LRD</p>
      {valueUSD != null && (
        <p className="mt-1 text-sm font-semibold text-slate-600">
          {typeof valueUSD === 'number' ? Number(valueUSD).toFixed(2) : valueUSD} USD
        </p>
      )}
    </div>
  ); 
}

function Table({ headers, rows }: { headers: string[]; rows: any[][] }) { 
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {headers.map((h) => <th key={h} className="px-5 py-3">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length ? (
            rows.map((r, i) => (
              <tr key={i}>
                {r.map((v, j) => <td key={j} className="px-5 py-3 text-slate-700">{v}</td>)}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={headers.length} className="px-5 py-10 text-center text-slate-400">
                No records available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  ); 
}
