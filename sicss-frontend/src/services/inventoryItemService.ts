import api from './api';

export interface InventoryItem {
  id?: number;
  item_code: string;
  name: string;
  description?: string;
  category?: string;
  location?: string;
  quantity: number;
  minimum_stock: number;
  unit?: string;
  unit_price?: number;
  added_by?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const inventoryItemService = {
  getAll: async (params?: any): Promise<InventoryItem[]> => {
    const response = await api.get<InventoryItem[]>('/inventory-items', { params });
    return response.data;
  },

  getById: async (id: number): Promise<InventoryItem> => {
    const response = await api.get<InventoryItem>(`/inventory-items/${id}`);
    return response.data;
  },

  create: async (data: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryItem> => {
    const response = await api.post<InventoryItem>('/inventory-items', data);
    return response.data;
  },

  update: async (id: number, data: Partial<InventoryItem>): Promise<InventoryItem> => {
    const response = await api.put<InventoryItem>(`/inventory-items/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/inventory-items/${id}`);
  },
};
