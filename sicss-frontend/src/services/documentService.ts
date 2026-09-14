import api from './api';

export interface Document {
  id?: number;
  title: string;
  description?: string;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  category?: string;
  uploaded_by?: number;
  student_id?: number;
  teacher_id?: number;
  is_public: boolean;
  created_at?: string;
  updated_at?: string;
}

export const documentService = {
  getAll: async (params?: any): Promise<Document[]> => {
    const response = await api.get<Document[]>('/documents', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Document> => {
    const response = await api.get<Document>(`/documents/${id}`);
    return response.data;
  },

  create: async (formData: FormData): Promise<Document> => {
    const response = await api.post<Document>('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  update: async (id: number, data: Partial<Document>): Promise<Document> => {
    const response = await api.put<Document>(`/documents/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/documents/${id}`);
  },

  download: async (id: number): Promise<Blob> => {
    const response = await api.get(`/documents/${id}/download`, { responseType: 'blob' });
    return response.data;
  },
};
