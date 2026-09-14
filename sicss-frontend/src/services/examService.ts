import api from './api';

export interface Exam {
  id?: number;
  name: string;
  description?: string;
  type: 'midterm' | 'final' | 'quiz' | 'assignment' | 'practical';
  exam_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  subject_id?: number;
  class_id?: number;
  division_id?: number;
  created_by?: number;
  is_published: boolean;
  academic_year: string;
  created_at?: string;
  updated_at?: string;
}

export const examService = {
  getAll: async (params?: any): Promise<Exam[]> => {
    const response = await api.get<Exam[]>('/exams', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Exam> => {
    const response = await api.get<Exam>(`/exams/${id}`);
    return response.data;
  },

  create: async (data: Omit<Exam, 'id' | 'created_at' | 'updated_at'>): Promise<Exam> => {
    const response = await api.post<Exam>('/exams', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Exam>): Promise<Exam> => {
    const response = await api.put<Exam>(`/exams/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/exams/${id}`);
  },

  publish: async (id: number): Promise<Exam> => {
    const response = await api.post<Exam>(`/exams/${id}/publish`);
    return response.data;
  },

  unpublish: async (id: number): Promise<Exam> => {
    const response = await api.post<Exam>(`/exams/${id}/unpublish`);
    return response.data;
  },
};
