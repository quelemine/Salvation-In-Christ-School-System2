import api from './api';

export interface ImportResult {
  message: string;
  imported: number;
  failed: number;
  errors: Array<{
    row: any;
    errors: string[];
  }>;
}

export const bulkImportService = {
  importStudents: async (file: File): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<ImportResult>('/bulk-import/students', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  importTeachers: async (file: File): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<ImportResult>('/bulk-import/teachers', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  exportStudents: async (): Promise<Blob> => {
    const response = await api.get('/bulk-export/students', { responseType: 'blob' });
    return response.data;
  },

  exportTeachers: async (): Promise<Blob> => {
    const response = await api.get('/bulk-export/teachers', { responseType: 'blob' });
    return response.data;
  },

  exportClasses: async (): Promise<Blob> => {
    const response = await api.get('/bulk-export/classes', { responseType: 'blob' });
    return response.data;
  },
};
