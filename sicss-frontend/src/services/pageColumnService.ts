import api from './api';

export interface PageColumn {
  id?: number;
  page_key: string;
  column_key: string;
  label: string;
  visible: boolean;
  order: number;
  width?: string;
  sortable: boolean;
  filterable: boolean;
  custom_options?: any;
  created_at?: string;
  updated_at?: string;
}

export const pageColumnService = {
  getAll: async (): Promise<PageColumn[]> => {
    const response = await api.get<PageColumn[]>('/page-columns');
    return response.data;
  },

  getByPage: async (pageKey: string): Promise<{ page_key: string; columns: PageColumn[]; is_default: boolean }> => {
    const response = await api.get(`/page-columns/${pageKey}`);
    return response.data;
  },

  create: async (data: Omit<PageColumn, 'id' | 'created_at' | 'updated_at'>): Promise<PageColumn> => {
    const response = await api.post<PageColumn>('/page-columns', data);
    return response.data;
  },

  update: async (id: number, data: Partial<PageColumn>): Promise<PageColumn> => {
    const response = await api.put<PageColumn>(`/page-columns/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/page-columns/${id}`);
  },

  bulkUpdate: async (pageKey: string, columns: PageColumn[]): Promise<void> => {
    await api.post('/page-columns/bulk', { page_key: pageKey, columns });
  },

  reset: async (pageKey: string): Promise<{ page_key: string; columns: PageColumn[]; is_default: boolean }> => {
    const response = await api.post(`/page-columns/${pageKey}/reset`);
    return response.data;
  },
};
