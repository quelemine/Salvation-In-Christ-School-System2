import api from './api';

export interface Timetable {
  id?: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  subject_id?: number;
  teacher_id?: number;
  class_id?: number;
  division_id?: number;
  room_id?: number;
  room_name?: string;
  created_by?: number;
  is_active: boolean;
  academic_year: string;
  created_at?: string;
  updated_at?: string;
}

export const timetableService = {
  getAll: async (params?: any): Promise<Timetable[]> => {
    const response = await api.get<Timetable[]>('/timetables', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Timetable> => {
    const response = await api.get<Timetable>(`/timetables/${id}`);
    return response.data;
  },

  create: async (data: Omit<Timetable, 'id' | 'created_at' | 'updated_at'>): Promise<Timetable> => {
    const response = await api.post<Timetable>('/timetables', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Timetable>): Promise<Timetable> => {
    const response = await api.put<Timetable>(`/timetables/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/timetables/${id}`);
  },
};
