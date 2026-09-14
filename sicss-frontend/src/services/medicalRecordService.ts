import api from './api';

export interface MedicalRecord {
  id?: number;
  student_id?: number;
  teacher_id?: number;
  record_date?: string;
  condition?: string;
  symptoms?: string;
  diagnosis?: string;
  treatment?: string;
  medication?: string;
  dosage?: string;
  prescription_date?: string;
  recorded_by?: number;
  is_confidential: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export const medicalRecordService = {
  getAll: async (params?: any): Promise<MedicalRecord[]> => {
    const response = await api.get<MedicalRecord[]>('/medical-records', { params });
    return response.data;
  },

  getById: async (id: number): Promise<MedicalRecord> => {
    const response = await api.get<MedicalRecord>(`/medical-records/${id}`);
    return response.data;
  },

  create: async (data: Omit<MedicalRecord, 'id' | 'created_at' | 'updated_at'>): Promise<MedicalRecord> => {
    const response = await api.post<MedicalRecord>('/medical-records', data);
    return response.data;
  },

  update: async (id: number, data: Partial<MedicalRecord>): Promise<MedicalRecord> => {
    const response = await api.put<MedicalRecord>(`/medical-records/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/medical-records/${id}`);
  },
};
