import api from './api';
import type { Attendance, PaginatedResponse } from '../types';

export const attendanceService = {
  getAll: async (params?: any) => {
    const response = await api.get<PaginatedResponse<Attendance>>('/attendance', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<Attendance>(`/attendance/${id}`);
    return response.data;
  },

  create: async (data: Partial<Attendance>) => {
    const response = await api.post<Attendance>('/attendance', data);
    return response.data;
  },

  createBulk: async (data: Partial<Attendance>[]) => {
    const response = await api.post('/attendance/bulk', { attendance: data });
    return response.data;
  },

  update: async (id: number, data: Partial<Attendance>) => {
    const response = await api.put<Attendance>(`/attendance/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/attendance/${id}`);
    return response.data;
  },

  getStudentHistory: async (studentId: number) => {
    const response = await api.get(`/attendance/student/${studentId}/history`);
    return response.data;
  },

  getClassReport: async (classId: number, params?: any) => {
    const response = await api.get(`/attendance/class/${classId}/report`, { params });
    return response.data;
  },
};
