import api from './api';

// Exact subject order matching the reference design
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

// Semester column definitions — matches the reference exactly
export const SEM1_PERIODS = ['1st pd', '2nd pd', '3rd pd'] as const;
export const SEM2_PERIODS = ['4th pd', '5th pd', '6th pd'] as const;
export const ALL_PERIODS = [...SEM1_PERIODS, 'Exam 1', 'Sem1 Ave', ...SEM2_PERIODS, 'Exam 2', 'Sem2 Ave', 'Yearly Ave'] as const;

export type Period = (typeof ALL_PERIODS)[number];

// subject_marks shape:  { "Bible": { "1st pd": "85", "Exam 1": "90", ... }, ... }
export type SubjectMarks = Record<string, Record<string, string>>;

export type ReportCard = {
  id: number;
  student_id: number;
  class_id: number;
  teacher_id?: number;
  academic_year: string;
  grade_level: string;
  subject_marks: SubjectMarks;
  // Summary rows
  aggregate?: number | null;
  average?: number | null;
  rank?: number | null;
  total_in_class?: number | null;
  conduct?: string | null;
  // Promotion
  promotion_status?: 'promoted' | 'conditional' | 'repeat' | 'not_enrolled' | null;
  conditional_subjects?: string | null;
  promoted_to?: string | null;
  // Signatures
  class_sponsor?: string | null;
  principal?: string | null;
  closing_date?: string | null;
  // Relations loaded by backend
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

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Parse a mark value to a number, returns null if blank/invalid */
export function parseMark(v: string | number | undefined | null): number | null {
  if (v === '' || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Calculate semester average for a subject from its period scores + exam */
export function semesterAvg(marks: Record<string, string>, periods: readonly string[], examKey: string): number | null {
  const scores: number[] = [];
  periods.forEach((p) => { const n = parseMark(marks[p]); if (n !== null) scores.push(n); });
  const exam = parseMark(marks[examKey]);
  if (exam !== null) scores.push(exam);
  if (scores.length === 0) return null;
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
}

/** Yearly average = mean of sem1 avg and sem2 avg */
export function yearlyAvg(s1: number | null, s2: number | null): number | null {
  if (s1 === null && s2 === null) return null;
  const vals = [s1, s2].filter((v): v is number => v !== null);
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

/** Grade letter from a score */
export function gradeLetter(score: number | null): string {
  if (score === null) return '';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  return 'D';
}

/** CSS color for a score */
export function scoreColor(score: number | null): string {
  if (score === null) return 'inherit';
  if (score < 70) return '#b91c1c';   // red-700
  return '#1d4ed8';                    // blue-700
}

// ── API ───────────────────────────────────────────────────────────────────────

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

  // Kept for backward compat
  create: async (data: ReportCardInput): Promise<ReportCard> => {
    const res = await api.post<ReportCard>('/report-cards', data);
    return res.data;
  },
};
