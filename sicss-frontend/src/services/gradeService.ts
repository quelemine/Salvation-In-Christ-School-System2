import api from './api';

export type GradeRecord = {
  id: number;
  student_id: number;
  subject_id: number;
  teacher_id?: number;
  term: string;
  academic_year: string;
  score: number;
  grade: string;
  remarks?: string;
  approval_status?: 'draft' | 'submitted' | 'approved' | 'rejected';
  review_note?: string;
  student?: { first_name: string; last_name: string; student_id: string; class?: { id: number; name: string } };
  subject?: { name: string; code: string };
};

export const gradeService = {
  getAll: async (params?: Record<string, string | number>) => {
    const response = await api.get<{ data: GradeRecord[] }>('/grades', { params });
    return response.data;
  },
  create: async (data: Omit<GradeRecord, 'id' | 'grade' | 'student' | 'subject'>) => {
    const response = await api.post<GradeRecord>('/grades', data);
    return response.data;
  },
  submit: async (id: number) => {
    const response = await api.post<GradeRecord>(`/grades/${id}/submit`);
    return response.data;
  },
  review: async (id: number, approval_status: 'approved' | 'rejected', review_note?: string) => {
    const response = await api.put<GradeRecord>(`/grades/${id}/review`, { approval_status, review_note });
    return response.data;
  },
};
