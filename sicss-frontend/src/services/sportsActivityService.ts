import api from './api';

export interface SportsActivity {
  id?: number;
  name: string;
  description?: string;
  category: string;
  coach_id?: number;
  venue?: string;
  schedule?: string;
  start_date?: string;
  end_date?: string;
  capacity?: number;
  added_by?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const sportsActivityService = {
  getAll: async (params?: any): Promise<SportsActivity[]> => {
    const response = await api.get<SportsActivity[]>('/sports-activities', { params });
    return response.data;
  },

  getById: async (id: number): Promise<SportsActivity> => {
    const response = await api.get<SportsActivity>(`/sports-activities/${id}`);
    return response.data;
  },

  create: async (data: Omit<SportsActivity, 'id' | 'created_at' | 'updated_at'>): Promise<SportsActivity> => {
    const response = await api.post<SportsActivity>('/sports-activities', data);
    return response.data;
  },

  update: async (id: number, data: Partial<SportsActivity>): Promise<SportsActivity> => {
    const response = await api.put<SportsActivity>(`/sports-activities/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/sports-activities/${id}`);
  },
};
