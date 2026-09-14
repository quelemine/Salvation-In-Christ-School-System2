import api from './api';

export interface DisciplineRecord {
  id?: number;
  student_id: number;
  type: 'warning' | 'suspension' | 'expulsion' | 'merit' | 'commendation';
  title: string;
  description?: string;
  incident_date: string;
  report_date: string;
  reported_by?: number;
  teacher_id?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  action_taken?: string;
  notes?: string;
  is_resolved: boolean;
  resolved_date?: string;
  resolved_by?: number;
  created_at?: string;
  updated_at?: string;
}

export const disciplineRecordService = {
  getAll: async (params?: any): Promise<DisciplineRecord[]> => {
    const response = await api.get<DisciplineRecord[]>('/discipline-records', { params });
    return response.data;
  },

  getById: async (id: number): Promise<DisciplineRecord> => {
    const response = await api.get<DisciplineRecord>(`/discipline-records/${id}`);
    return response.data;
  },

  create: async (data: Omit<DisciplineRecord, 'id' | 'created_at' | 'updated_at'>): Promise<DisciplineRecord> => {
    const response = await api.post<DisciplineRecord>('/discipline-records', data);
    return response.data;
  },

  update: async (id: number, data: Partial<DisciplineRecord>): Promise<DisciplineRecord> => {
    const response = await api.put<DisciplineRecord>(`/discipline-records/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/discipline-records/${id}`);
  },

  resolve: async (id: number): Promise<DisciplineRecord> => {
    const response = await api.post<DisciplineRecord>(`/discipline-records/${id}/resolve`);
    return response.data;
  },
};
