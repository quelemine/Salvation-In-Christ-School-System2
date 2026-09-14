import api from './api';

export interface Alumni {
  id?: number;
  student_id?: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  graduation_year: string;
  current_occupation?: string;
  current_employer?: string;
  address?: string;
  bio?: string;
  is_active: boolean;
  wants_newsletter: boolean;
  added_by?: number;
  created_at?: string;
  updated_at?: string;
}

export const alumniService = {
  getAll: async (params?: any): Promise<Alumni[]> => {
    const response = await api.get<Alumni[]>('/alumni', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Alumni> => {
    const response = await api.get<Alumni>(`/alumni/${id}`);
    return response.data;
  },

  create: async (data: Omit<Alumni, 'id' | 'created_at' | 'updated_at'>): Promise<Alumni> => {
    const response = await api.post<Alumni>('/alumni', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Alumni>): Promise<Alumni> => {
    const response = await api.put<Alumni>(`/alumni/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/alumni/${id}`);
  },
};
