import api from './api';
import type { User, ApiResponse } from '../types';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

interface ForgotPasswordData {
  email: string;
}

interface ResetPasswordData {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

interface ChangePasswordData {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export const authService = {
  dashboardSummary: async () => {
    const response = await api.get<{ students: number; teachers: number; classes: number; fees_collected: { LRD: number; USD: number }; attendance_present: number; attendance_absent: number; attendance_rate: number; academic_year: string }>('/dashboard/summary');
    return response.data;
  },
  users: async () => {
    const response = await api.get<User[]>('/users');
    return response.data;
  },

  roles: async () => {
    const response = await api.get<Array<{ id: number; name: string; slug: string }>>('/roles');
    return response.data;
  },

  createUser: async (data: { first_name: string; last_name: string; email: string; password: string; role_id: number; phone?: string; address?: string; profile_photo?: string; credential_image_path?: string }) => {
    const response = await api.post<User>('/users', data);
    return response.data;
  },

  activityLogs: async () => {
    const response = await api.get<Array<{ id: number; event: string; description: string; created_at: string; user_email?: string; ip_address?: string; device_type?: string; browser?: string; platform?: string; user_agent?: string; user?: { first_name: string; last_name: string; email: string } }>>('/activity-logs');
    return response.data;
  },
  login: async (credentials: LoginCredentials) => {
    const response = await api.post<{ user: User; token: string }>('/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterData) => {
    const response = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', data);
    return response.data;
  },

  logout: async () => {
    const response = await api.post<ApiResponse>('/auth/logout');
    return response.data;
  },

  me: async () => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordData) => {
    const response = await api.post<ApiResponse>('/auth/forgot-password', data);
    return response.data;
  },

  resetPassword: async (data: ResetPasswordData) => {
    const response = await api.post<ApiResponse>('/auth/reset-password', data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordData) => {
    const response = await api.post<ApiResponse>('/auth/change-password', data);
    return response.data;
  },
};
