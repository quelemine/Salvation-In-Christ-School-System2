import api from './api';

export interface TransportationVehicle {
  id?: number;
  vehicle_number: string;
  vehicle_type: string;
  capacity: string;
  driver_name: string;
  driver_phone: string;
  route?: string;
  description?: string;
  added_by?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const transportationVehicleService = {
  getAll: async (params?: any): Promise<TransportationVehicle[]> => {
    const response = await api.get<TransportationVehicle[]>('/transportation-vehicles', { params });
    return response.data;
  },

  getById: async (id: number): Promise<TransportationVehicle> => {
    const response = await api.get<TransportationVehicle>(`/transportation-vehicles/${id}`);
    return response.data;
  },

  create: async (data: Omit<TransportationVehicle, 'id' | 'created_at' | 'updated_at'>): Promise<TransportationVehicle> => {
    const response = await api.post<TransportationVehicle>('/transportation-vehicles', data);
    return response.data;
  },

  update: async (id: number, data: Partial<TransportationVehicle>): Promise<TransportationVehicle> => {
    const response = await api.put<TransportationVehicle>(`/transportation-vehicles/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/transportation-vehicles/${id}`);
  },
};
