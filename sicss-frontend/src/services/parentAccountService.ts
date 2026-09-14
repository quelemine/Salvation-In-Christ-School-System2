import api from './api';

export interface ParentAccount {
  id?: number;
  user_id: number;
  relationship: string;
  phone?: string;
  address?: string;
  emergency_contact?: string;
  receive_notifications: boolean;
  receive_sms: boolean;
  receive_email: boolean;
  created_at?: string;
  updated_at?: string;
}

export const parentAccountService = {
  getAll: async (params?: any): Promise<ParentAccount[]> => {
    const response = await api.get<ParentAccount[]>('/parent-accounts', { params });
    return response.data;
  },

  getById: async (id: number): Promise<ParentAccount> => {
    const response = await api.get<ParentAccount>(`/parent-accounts/${id}`);
    return response.data;
  },

  create: async (data: Omit<ParentAccount, 'id' | 'created_at' | 'updated_at'>): Promise<ParentAccount> => {
    const response = await api.post<ParentAccount>('/parent-accounts', data);
    return response.data;
  },

  update: async (id: number, data: Partial<ParentAccount>): Promise<ParentAccount> => {
    const response = await api.put<ParentAccount>(`/parent-accounts/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/parent-accounts/${id}`);
  },
};
