import api from './api';

export interface Hostel {
  id?: number;
  name: string;
  description?: string;
  location?: string;
  total_rooms: number;
  capacity: number;
  warden_name?: string;
  warden_phone?: string;
  added_by?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const hostelService = {
  getAll: async (params?: any): Promise<Hostel[]> => {
    const response = await api.get<Hostel[]>('/hostels', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Hostel> => {
    const response = await api.get<Hostel>(`/hostels/${id}`);
    return response.data;
  },

  create: async (data: Omit<Hostel, 'id' | 'created_at' | 'updated_at'>): Promise<Hostel> => {
    const response = await api.post<Hostel>('/hostels', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Hostel>): Promise<Hostel> => {
    const response = await api.put<Hostel>(`/hostels/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/hostels/${id}`);
  },
};
