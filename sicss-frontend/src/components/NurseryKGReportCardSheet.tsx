/**
 * NurseryKGReportCardSheet — Report card for Nursery/Kindergarten with letter grades
 * Features separate 1st and 2nd Semester sections (left/right layout)
 */
import type { LearningArea } from '../services/reportCardTemplateService';

export interface NurseryKGReportCardProps {
  studentName: string;
  studentId?: string;
  className?: string;
  teacherName?: string;
  academicYear?: string;
  marks: Record<string, Record<string, string>>; // learning_area -> period -> grade letter
  aggregate?: number | null;
  average?: number | null;
  rank?: number | null;
  totalInClass?: number | null;
  conduct?: string | null;
  promotedTo?: string | null;
  classSponsor?: string | null;
  principal?: string | null;
  closingDate?: string | null;
  editable?: boolean;
  onMarkChange?: (learningArea: string, period: string, value: string) => void;
  learningAreas: LearningArea[];
  assessmentPeriods: any; // { sem1: [...], sem2: [...] }
  gradingScale: Record<string, string>;
}

function LetterGradeSelect({ value, onChange, gradingScale }: { value: string; onChange: (v: string) => void; gradingScale: Record<string, string> }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded text-center text-sm font-semibold border border-slate-300 bg-white"
      style={{ height: 32 }}
    >
      <option value="">—</option>
      {Object.entries(gradingScale).map(([grade]) => (
        <option key={grade} value={grade}>{grade}</option>
      ))}
    </select>
  );
}

export default function NurseryKGReportCardSheet(props: NurseryKGReportCardProps) {
  const {
    studentName,
    studentId,
    className,
    teacherName,
    academicYear,
    marks,
    rank,
    totalInClass,
    conduct,
    promotedTo,
    classSponsor,
    principal,
    closingDate,
    editable = false,
    onMarkChange,
    learningAreas,
    assessmentPeriods,
    gradingScale,
  } = props;

  const getMark = (learningArea: string, period: string) => marks[learningArea]?.[period] || '';
  const setMark = (learningArea: string, period: string, value: string) => {
    if (editable && onMarkChange) onMarkChange(learningArea, period, value);
  };

  const getLetterGradeValue = (grade: string): number => {
    const gradeValues: Record<string, number> = {
      'A': 5,
      'B': 4,
      'C': 3,
      'D': 2,
      'E': 1,
    };
    return gradeValues[grade] || 0;
  };

  const calculateSemesterAvg = (learningArea: string, periods: string[]): number | null => {
    const areaMarks = marks[learningArea] || {};
    const values: number[] = [];
    periods.forEach((period) => {
      const grade = areaMarks[period];
      if (grade) values.push(getLetterGradeValue(grade));
    });
    if (values.length === 0) return null;
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  };

  const calculateSemesterAggregate = (periods: string[]): number | null => {
    let total = 0;
    let count = 0;
    learningAreas.forEach((area) => {
      periods.forEach((period) => {
        const grade = marks[area.name]?.[period];
        if (grade) {
          total += getLetterGradeValue(grade);
          count++;
        }
      });
    });
    return count > 0 ? total : null;
  };

  const calculateSemesterAverage = (periods: string[]): number | null => {
    const avgs: number[] = [];
    learningAreas.forEach((area) => {
      const avg = calculateSemesterAvg(area.name, periods);
      if (avg !== null) avgs.push(avg);
    });
    if (avgs.length === 0) return null;
    return Math.round((avgs.reduce((a, b) => a + b, 0) / avgs.length) * 10) / 10;
  };

  const sem1Periods = assessmentPeriods?.sem1 || ['1st pd', '2nd pd', '3rd pd', 'Exam'];
  const sem2Periods = assessmentPeriods?.sem2 || ['4th pd', '5th pd', '6th pd', 'Exam'];

  const sem1Avg = calculateSemesterAverage(sem1Periods);
  const sem2Avg = calculateSemesterAverage(sem2Periods);
  const yearlyAvg = sem1Avg !== null && sem2Avg !== null 
    ? Math.round(((sem1Avg + sem2Avg) / 2) * 10) / 10 
    : (sem1Avg ?? sem2Avg ?? null);

  return (
    <div className="bg-white p-6 max-w-5xl mx-auto shadow-lg" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">SICSS — Salvation In Christ School System</h1>
        <p className="text-sm text-slate-600">Nursery/Kindergarten Report Card</p>
      </div>

      {/* Student Info */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-sm border-b pb-4">
        <div>
          <span className="font-semibold text-slate-700">Student Name:</span>
          <span className="ml-2 text-slate-900">{studentName}</span>
        </div>
        <div>
          <span className="font-semibold text-slate-700">Student ID:</span>
          <span className="ml-2 text-slate-900">{studentId || '—'}</span>
        </div>
        <div>
          <span className="font-semibold text-slate-700">Class:</span>
          <span className="ml-2 text-slate-900">{className || '—'}</span>
        </div>
        <div>
          <span className="font-semibold text-slate-700">Academic Year:</span>
          <span className="ml-2 text-slate-900">{academicYear || '—'}</span>
        </div>
        <div>
          <span className="font-semibold text-slate-700">Class Teacher:</span>
          <span className="ml-2 text-slate-900">{teacherName || '—'}</span>
        </div>
      </div>

      {/* Two Semester Sections - Side by Side */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* 1st Semester */}
        <div className="border-2 border-slate-300 rounded-lg p-4">
          <h3 className="text-lg font-bold text-center text-slate-900 mb-4 border-b pb-2">1st SEMESTER</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-2 py-2 text-left font-semibold">SUBJECTS</th>
                  {sem1Periods.map((p: string) => <th key={p} className="border border-slate-300 px-2 py-2 font-semibold">{p}</th>)}
                  <th className="border border-slate-300 px-2 py-2 font-semibold">Sem. Ave</th>
                </tr>
              </thead>
              <tbody>
                {learningAreas.map(area => (
                  <tr key={area.id}>
                    <td className="border border-slate-300 px-2 py-2 font-medium">{area.name}</td>
                    {sem1Periods.map((p: string) => (
                      <td key={p} className="border border-slate-300 px-1 py-1">
                        {editable ? (
                          <LetterGradeSelect
                            value={getMark(area.name, p)}
                            onChange={(v) => setMark(area.name, p, v)}
                            gradingScale={gradingScale}
                          />
                        ) : (
                          <span className="block text-center font-semibold text-blue-700">
                            {getMark(area.name, p) || '—'}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="border border-slate-300 px-1 py-1">
                      <span className="block text-center font-bold text-slate-900">
                        {calculateSemesterAvg(area.name, sem1Periods) ?? '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* 1st Semester Summary */}
          <div className="mt-4 pt-4 border-t space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-700">Aggregate:</span>
              <span className="font-bold text-slate-900">{calculateSemesterAggregate(sem1Periods) ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-700">Average:</span>
              <span className="font-bold text-slate-900">{sem1Avg ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-700">Total No. in Class:</span>
              <span className="font-bold text-slate-900">{totalInClass || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-700">Rank:</span>
              <span className="font-bold text-slate-900">{rank || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-700">Conduct:</span>
              <span className="text-slate-900">{conduct || '—'}</span>
            </div>
          </div>
        </div>

        {/* 2nd Semester */}
        <div className="border-2 border-slate-300 rounded-lg p-4">
          <h3 className="text-lg font-bold text-center text-slate-900 mb-4 border-b pb-2">2nd SEMESTER</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-2 py-2 text-left font-semibold">SUBJECTS</th>
                  {sem2Periods.map((p: string) => <th key={p} className="border border-slate-300 px-2 py-2 font-semibold">{p}</th>)}
                  <th className="border border-slate-300 px-2 py-2 font-semibold">Sem. Ave</th>
                </tr>
              </thead>
              <tbody>
                {learningAreas.map(area => (
                  <tr key={area.id}>
                    <td className="border border-slate-300 px-2 py-2 font-medium">{area.name}</td>
                    {sem2Periods.map((p: string) => (
                      <td key={p} className="border border-slate-300 px-1 py-1">
                        {editable ? (
                          <LetterGradeSelect
                            value={getMark(area.name, p)}
                            onChange={(v) => setMark(area.name, p, v)}
                            gradingScale={gradingScale}
                          />
                        ) : (
                          <span className="block text-center font-semibold text-blue-700">
                            {getMark(area.name, p) || '—'}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="border border-slate-300 px-1 py-1">
                      <span className="block text-center font-bold text-slate-900">
                        {calculateSemesterAvg(area.name, sem2Periods) ?? '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* 2nd Semester Summary */}
          <div className="mt-4 pt-4 border-t space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-700">Aggregate:</span>
              <span className="font-bold text-slate-900">{calculateSemesterAggregate(sem2Periods) ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-700">Average:</span>
              <span className="font-bold text-slate-900">{sem2Avg ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-700">Total No. in Class:</span>
              <span className="font-bold text-slate-900">{totalInClass || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-700">Rank:</span>
              <span className="font-bold text-slate-900">{rank || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-700">Conduct:</span>
              <span className="text-slate-900">{conduct || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Yearly Summary */}
      <div className="border-2 border-slate-300 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-bold text-center text-slate-900 mb-4 border-b pb-2">YEARLY SUMMARY</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="font-semibold text-slate-700">1st Semester Average:</span>
            <span className="font-bold text-slate-900">{sem1Avg ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-slate-700">2nd Semester Average:</span>
            <span className="font-bold text-slate-900">{sem2Avg ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-slate-700">Yearly Average:</span>
            <span className="font-bold text-blue-700">{yearlyAvg ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-slate-700">Final Rank:</span>
            <span className="font-bold text-slate-900">{rank || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-slate-700">Promotion Status:</span>
            <span className="font-bold text-slate-900">{promotedTo || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-slate-700">Grading Method:</span>
            <span className="text-slate-900">Letter Grades (A-E)</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t text-sm">
          <p className="font-semibold text-slate-700">Yearly Average Formula:</p>
          <p className="text-slate-600">Yearly Average = (1st Semester Average + 2nd Semester Average) / 2</p>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t text-sm">
        <div className="text-center">
          <div className="h-16 mb-2"></div>
          <p className="font-semibold text-slate-700">Class Sponsor</p>
          <p className="text-slate-900">{classSponsor || '—'}</p>
        </div>
        <div className="text-center">
          <div className="h-16 mb-2"></div>
          <p className="font-semibold text-slate-700">Principal</p>
          <p className="text-slate-900">{principal || '—'}</p>
        </div>
        <div className="text-center">
          <div className="h-16 mb-2"></div>
          <p className="font-semibold text-slate-700 mt-2">Closing Date</p>
          <p className="text-slate-900">{closingDate || '—'}</p>
        </div>
      </div>
    </div>
  );
}
