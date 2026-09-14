import api from './api';
import type { ApiResponse } from '../types';

export interface Role {
  id: number;
  name: string;
  slug: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const roleService = {
  getAll: async () => {
    const response = await api.get<ApiResponse<Role[]>>('/roles');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<ApiResponse<Role>>(`/roles/${id}`);
    return response.data;
  },

  create: async (data: Omit<Role, 'id' | 'created_at' | 'updated_at'>) => {
    const response = await api.post<ApiResponse<Role>>('/roles', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Role>) => {
    const response = await api.put<ApiResponse<Role>>(`/roles/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete<ApiResponse>(`/roles/${id}`);
    return response.data;
  },
};
