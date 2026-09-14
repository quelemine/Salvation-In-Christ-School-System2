import api from './api';

export interface HostelAssignment {
  id?: number;
  hostel_id: number;
  student_id?: number;
  teacher_id?: number;
  room_number?: string;
  bed_number?: string;
  assignment_date?: string;
  checkout_date?: string;
  assigned_by?: number;
  is_active: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export const hostelAssignmentService = {
  getAll: async (params?: any): Promise<HostelAssignment[]> => {
    const response = await api.get<HostelAssignment[]>('/hostel-assignments', { params });
    return response.data;
  },

  getById: async (id: number): Promise<HostelAssignment> => {
    const response = await api.get<HostelAssignment>(`/hostel-assignments/${id}`);
    return response.data;
  },

  create: async (data: Omit<HostelAssignment, 'id' | 'created_at' | 'updated_at'>): Promise<HostelAssignment> => {
    const response = await api.post<HostelAssignment>('/hostel-assignments', data);
    return response.data;
  },

  update: async (id: number, data: Partial<HostelAssignment>): Promise<HostelAssignment> => {
    const response = await api.put<HostelAssignment>(`/hostel-assignments/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/hostel-assignments/${id}`);
  },
};
