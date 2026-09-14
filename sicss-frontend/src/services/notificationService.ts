import api from './api';

export interface Notification {
  id?: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  status: string;
  channel: 'email' | 'sms' | 'both';
  data?: any;
  sent_at?: string;
  sent_by?: number;
  is_read: boolean;
  read_at?: string;
  created_at?: string;
  updated_at?: string;
}

export const notificationService = {
  getAll: async (params?: any): Promise<Notification[]> => {
    const response = await api.get<Notification[]>('/notifications', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Notification> => {
    const response = await api.get<Notification>(`/notifications/${id}`);
    return response.data;
  },

  create: async (data: Omit<Notification, 'id' | 'created_at' | 'updated_at'>): Promise<Notification> => {
    const response = await api.post<Notification>('/notifications', data);
    return response.data;
  },

  markAsRead: async (id: number): Promise<Notification> => {
    const response = await api.post<Notification>(`/notifications/${id}/mark-read`);
    return response.data;
  },

  markAllAsRead: async (userId?: number): Promise<any> => {
    const response = await api.post('/notifications/mark-all-read', { user_id: userId });
    return response.data;
  },

  sendBulk: async (data: {
    user_ids: number[];
    type: string;
    title: string;
    message: string;
    channel: 'email' | 'sms' | 'both';
    data?: any;
  }): Promise<Notification[]> => {
    const response = await api.post<Notification[]>('/notifications/send-bulk', data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },
};
