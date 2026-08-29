import api from './api';
import type { ApiResponse } from '../types';

export interface Subject {
  id: number;
  uuid: string;
  name: string;
  code: string;
  description: string | null;
  credits: number;
  created_at: string;
  updated_at: string;
}

export const subjectService = {
  getAll: async () => {
    const response = await api.get<ApiResponse<Subject[]>>('/subjects');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<ApiResponse<Subject>>(`/subjects/${id}`);
    return response.data;
  },

  create: async (data: Omit<Subject, 'id' | 'uuid' | 'created_at' | 'updated_at'>) => {
    const response = await api.post<ApiResponse<Subject>>('/subjects', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Subject>) => {
    const response = await api.put<ApiResponse<Subject>>(`/subjects/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete<ApiResponse>(`/subjects/${id}`);
    return response.data;
  },
};
