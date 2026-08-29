import api from './api';
import type { ApiResponse } from '../types';

export interface Division {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export const divisionService = {
  getAll: async () => {
    const response = await api.get<ApiResponse<Division[]>>('/divisions');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<ApiResponse<Division>>(`/divisions/${id}`);
    return response.data;
  },

  create: async (data: Omit<Division, 'id' | 'uuid' | 'created_at' | 'updated_at'>) => {
    const response = await api.post<ApiResponse<Division>>('/divisions', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Division>) => {
    const response = await api.put<ApiResponse<Division>>(`/divisions/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete<ApiResponse>(`/divisions/${id}`);
    return response.data;
  },
};
