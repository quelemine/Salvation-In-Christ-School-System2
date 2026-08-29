import api from './api';
import type { ApiResponse } from '../types';

export interface Teacher {
  id: number;
  uuid: string;
  user_id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  photo?: string | null;
  credential_image_path?: string | null;
  qualification: string | null;
  subject_specialization: string | null;
  joining_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  salary_structure_id?: number | null;
  salary_structure?: SalaryStructure | null;
}

export interface SalaryStructure {
  id: number;
  name: string;
  employment_type: 'self_contained' | 'part_time';
  role_title: string;
  monthly_salary: number | string;
  currency: 'LRD' | 'USD';
  is_active: boolean;
  notes?: string | null;
}

export interface TeacherPayroll {
  id: number;
  teacher_id: number;
  payroll_month: string;
  role_title: string;
  employment_type: 'self_contained' | 'part_time';
  amount: number | string;
  base_amount?: number | string | null;
  deduction_amount?: number | string;
  late_count?: number;
  absent_count?: number;
  currency: 'LRD' | 'USD';
  status: 'pending' | 'paid';
  paid_at?: string | null;
  notes?: string | null;
  teacher?: Teacher;
  salary_structure?: SalaryStructure | null;
}

export const teacherService = {
  getAll: async () => {
    const response = await api.get<ApiResponse<Teacher[]>>('/teachers');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<ApiResponse<Teacher>>(`/teachers/${id}`);
    return response.data;
  },

  create: async (data: Omit<Teacher, 'id' | 'uuid' | 'created_at' | 'updated_at'>) => {
    const response = await api.post<ApiResponse<Teacher>>('/teachers', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Teacher>) => {
    const response = await api.put<ApiResponse<Teacher>>(`/teachers/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete<ApiResponse>(`/teachers/${id}`);
    return response.data;
  },
};

export const payrollService = {
  structures: async () => (await api.get<SalaryStructure[]>('/salary-structures')).data,
  createStructure: async (data: Omit<SalaryStructure, 'id'>) => (await api.post<SalaryStructure>('/salary-structures', data)).data,
  updateStructure: async (id: number, data: Omit<SalaryStructure, 'id'>) => (await api.put<SalaryStructure>(`/salary-structures/${id}`, data)).data,
  payrolls: async (month?: string) => (await api.get<TeacherPayroll[]>('/teacher-payrolls', { params: month ? { month } : {} })).data,
  createPayroll: async (data: Record<string, unknown>) => (await api.post<TeacherPayroll>('/teacher-payrolls', data)).data,
  markPaid: async (id: number) => (await api.post<TeacherPayroll>(`/teacher-payrolls/${id}/mark-paid`)).data,
  mySalary: async () => (await api.get<{ monthly_salary: number | string | null; annual_salary: number; annual_salary_estimate: number | null; currency: 'LRD' | 'USD' | null; status: 'pending' | 'paid'; role_title?: string | null }>('/my-salary')).data,
};
