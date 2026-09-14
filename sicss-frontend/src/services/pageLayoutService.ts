import api from './api';

export interface PageSection {
  id: string;
  type: string;
  visible: boolean;
  order: number;
}

export interface PageLayout {
  id: number;
  page_key: string;
  sections: PageSection[];
  layout_type: string;
  primary_button_color?: string;
  secondary_button_color?: string;
  created_at: string;
  updated_at: string;
  is_default?: boolean;
}

export const pageLayoutService = {
  getAll: async (): Promise<PageLayout[]> => {
    const response = await api.get<PageLayout[]>('/page-layouts');
    return response.data;
  },

  getByPage: async (pageKey: string): Promise<PageLayout> => {
    const response = await api.get<PageLayout>(`/page-layouts/${pageKey}`);
    return response.data;
  },

  create: async (data: Omit<PageLayout, 'id' | 'created_at' | 'updated_at' | 'is_default'>): Promise<PageLayout> => {
    const response = await api.post<PageLayout>('/page-layouts', data);
    return response.data;
  },

  update: async (id: number, data: Partial<PageLayout>): Promise<PageLayout> => {
    const response = await api.put<PageLayout>(`/page-layouts/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/page-layouts/${id}`);
  },

  reset: async (pageKey: string): Promise<PageLayout> => {
    const response = await api.post<PageLayout>(`/page-layouts/${pageKey}/reset`);
    return response.data;
  },
};
