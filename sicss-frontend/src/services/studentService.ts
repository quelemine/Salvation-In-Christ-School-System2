import api from './api';
import type { Student, PaginatedResponse } from '../types';

export const studentService = {
  getAll: async (params?: any) => {
    const response = await api.get<PaginatedResponse<Student>>('/students', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<Student>(`/students/${id}`);
    return response.data;
  },

  create: async (data: Partial<Student>) => {
    const response = await api.post<Student>('/students', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Student>) => {
    const response = await api.put<Student>(`/students/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  },
};
