import api from './api';

export const reportCardSubjects = [
  'Bible',
  'English',
  'Reading',
  'Spelling',
  'Phonics',
  'Science',
  'Reciting',
  'Health Science',
  'Social Studies',
  'Writing',
  'Identifying Object',
  'Mathematics',
  'Drawing',
  'Identifying Color',
  'Physical Education',
];

export const SEM1_PERIODS = ['1st pd', '2nd pd', '3rd pd'] as const;
export const SEM2_PERIODS = ['4th pd', '5th pd', '6th pd'] as const;
export const ALL_PERIODS = [...SEM1_PERIODS, 'Exam 1', 'Sem1 Ave', ...SEM2_PERIODS, 'Exam 2', 'Sem2 Ave', 'Yearly Ave'] as const;

export type Period = (typeof ALL_PERIODS)[number];
export type SubjectMarks = Record<string, Record<string, string>>;

export type ReportCard = {
  id: number;
  student_id: number;
  class_id: number;
  teacher_id?: number;
  academic_year: string;
  grade_level: string;
  subject_marks: SubjectMarks;
  aggregate?: number | null;
  average?: number | null;
  rank?: number | null;
  total_in_class?: number | null;
  conduct?: string | null;
  promotion_status?: 'promoted' | 'conditional' | 'repeat' | 'not_enrolled' | null;
  conditional_subjects?: string | null;
  promoted_to?: string | null;
  class_sponsor?: string | null;
  principal?: string | null;
  closing_date?: string | null;
  student?: {
    id: number;
    first_name: string;
    last_name: string;
    student_id: string;
    class?: { id: number; name: string; section?: string };
  };
  class?: { id: number; name: string; section?: string };
  teacher?: { id: number; first_name: string; last_name: string };
};

export type ReportCardInput = Omit<ReportCard, 'id' | 'student' | 'class' | 'teacher'>;

export function parseMark(v: string | number | undefined | null): number | null {
  if (v === '' || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function semesterAvg(marks: Record<string, string>, periods: readonly string[], examKey: string): number | null {
  const scores: number[] = [];
  periods.forEach((p) => { const n = parseMark(marks[p]); if (n !== null) scores.push(n); });
  const exam = parseMark(marks[examKey]);
  if (exam !== null) scores.push(exam);
  if (scores.length === 0) return null;
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
}

export function yearlyAvg(s1: number | null, s2: number | null): number | null {
  if (s1 === null && s2 === null) return null;
  const vals = [s1, s2].filter((v): v is number => v !== null);
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

export function gradeLetter(score: number | null): string {
  if (score === null) return '';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  return 'D';
}

export function scoreColor(score: number | null): string {
  if (score === null) return 'inherit';
  if (score < 0 || score > 100) return '#b91c1c';
  if (score < 70) return '#b91c1c';
  return '#1d4ed8';
}

export const reportCardService = {
  getAll: async (params?: Record<string, string>): Promise<ReportCard[]> => {
    const res = await api.get<ReportCard[]>('/report-cards', { params });
    return Array.isArray(res.data) ? res.data : (res.data as any).data ?? [];
  },

  getById: async (id: number): Promise<ReportCard> => {
    const res = await api.get<ReportCard>(`/report-cards/${id}`);
    return res.data;
  },

  save: async (data: ReportCardInput): Promise<ReportCard> => {
    const res = await api.post<ReportCard>('/report-cards', data);
    return res.data;
  },

  update: async (id: number, data: Partial<ReportCardInput>): Promise<ReportCard> => {
    const res = await api.put<ReportCard>(`/report-cards/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/report-cards/${id}`);
  },
};
