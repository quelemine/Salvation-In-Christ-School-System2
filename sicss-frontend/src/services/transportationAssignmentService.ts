import api from './api';

export interface TransportationAssignment {
  id?: number;
  vehicle_id: number;
  student_id?: number;
  teacher_id?: number;
  pickup_location?: string;
  dropoff_location?: string;
  pickup_time?: string;
  dropoff_time?: string;
  assigned_by?: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at?: string;
  updated_at?: string;
}

export const transportationAssignmentService = {
  getAll: async (params?: any): Promise<TransportationAssignment[]> => {
    const response = await api.get<TransportationAssignment[]>('/transportation-assignments', { params });
    return response.data;
  },

  getById: async (id: number): Promise<TransportationAssignment> => {
    const response = await api.get<TransportationAssignment>(`/transportation-assignments/${id}`);
    return response.data;
  },

  create: async (data: Omit<TransportationAssignment, 'id' | 'created_at' | 'updated_at'>): Promise<TransportationAssignment> => {
    const response = await api.post<TransportationAssignment>('/transportation-assignments', data);
    return response.data;
  },

  update: async (id: number, data: Partial<TransportationAssignment>): Promise<TransportationAssignment> => {
    const response = await api.put<TransportationAssignment>(`/transportation-assignments/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/transportation-assignments/${id}`);
  },
};
