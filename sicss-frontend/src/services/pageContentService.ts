import api from './api';

export interface PageContent {
  id: number;
  page_key: string;
  section_key: string;
  content: string;
  content_type: string;
  text_color?: string;
  background_color?: string;
  created_at: string;
  updated_at: string;
}

export const pageContentService = {
  getAll: async (): Promise<PageContent[]> => {
    const response = await api.get<PageContent[]>('/page-contents');
    return response.data;
  },

  getByPage: async (pageKey: string): Promise<PageContent[]> => {
    const response = await api.get<PageContent[]>(`/page-contents/${pageKey}`);
    return response.data;
  },

  create: async (data: Omit<PageContent, 'id' | 'created_at' | 'updated_at'>): Promise<PageContent> => {
    const response = await api.post<PageContent>('/page-contents', data);
    return response.data;
  },

  update: async (id: number, data: Partial<PageContent>): Promise<PageContent> => {
    const response = await api.put<PageContent>(`/page-contents/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/page-contents/${id}`);
  },

  bulkUpdate: async (contents: Omit<PageContent, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> => {
    await api.post('/page-contents/bulk', { contents });
  },
};
