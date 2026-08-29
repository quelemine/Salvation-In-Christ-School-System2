import api from './api';
import type { ApiResponse } from '../types';

export interface Class {
  id: number;
  uuid: string;
  name: string;
  division_id: number;
  section: string | null;
  capacity: number;
  academic_year_id: number;
  created_at: string;
  updated_at: string;
}

export const classService = {
  getAll: async () => {
    const response = await api.get<ApiResponse<Class[]>>('/classes');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<ApiResponse<Class>>(`/classes/${id}`);
    return response.data;
  },

  create: async (data: Omit<Class, 'id' | 'uuid' | 'created_at' | 'updated_at'>) => {
    const response = await api.post<ApiResponse<Class>>('/classes', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Class>) => {
    const response = await api.put<ApiResponse<Class>>(`/classes/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete<ApiResponse>(`/classes/${id}`);
    return response.data;
  },
};
