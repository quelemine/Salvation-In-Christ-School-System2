import api from './api';

export interface AcademicCalendar {
  id?: number;
  title: string;
  description?: string;
  type: 'term' | 'holiday' | 'event' | 'exam' | 'break';
  start_date: string;
  end_date: string;
  is_active: boolean;
  academic_year: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export const academicCalendarService = {
  getAll: async (params?: { type?: string; academic_year?: string; active?: boolean }): Promise<AcademicCalendar[]> => {
    const response = await api.get<AcademicCalendar[]>('/academic-calendar', { params });
    return response.data;
  },

  getById: async (id: number): Promise<AcademicCalendar> => {
    const response = await api.get<AcademicCalendar>(`/academic-calendar/${id}`);
    return response.data;
  },

  create: async (data: Omit<AcademicCalendar, 'id' | 'created_at' | 'updated_at'>): Promise<AcademicCalendar> => {
    const response = await api.post<AcademicCalendar>('/academic-calendar', data);
    return response.data;
  },

  update: async (id: number, data: Partial<AcademicCalendar>): Promise<AcademicCalendar> => {
    const response = await api.put<AcademicCalendar>(`/academic-calendar/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/academic-calendar/${id}`);
  },
};
