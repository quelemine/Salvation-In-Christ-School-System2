import api from './api';
import type { Fee, Payment, Receipt, PaginatedResponse } from '../types';

export const financeService = {
  // Fees
  getAllFees: async (params?: any) => {
    const response = await api.get<PaginatedResponse<Fee>>('/fees', { params });
    return response.data;
  },

  getFeeById: async (id: number) => {
    const response = await api.get<Fee>(`/fees/${id}`);
    return response.data;
  },

  createFee: async (data: Partial<Fee>) => {
    const response = await api.post<Fee>('/fees', data);
    return response.data;
  },

  updateFee: async (id: number, data: Partial<Fee>) => {
    const response = await api.put<Fee>(`/fees/${id}`, data);
    return response.data;
  },

  deleteFee: async (id: number) => {
    const response = await api.delete(`/fees/${id}`);
    return response.data;
  },

  // Payments
  getAllPayments: async (params?: any) => {
    const response = await api.get<PaginatedResponse<Payment>>('/payments', { params });
    return response.data;
  },

  getPaymentById: async (id: number) => {
    const response = await api.get<Payment>(`/payments/${id}`);
    return response.data;
  },

  createPayment: async (data: Partial<Payment>) => {
    const response = await api.post<Payment>('/payments', data);
    return response.data;
  },

  updatePayment: async (id: number, data: Partial<Payment>) => {
    const response = await api.put<Payment>(`/payments/${id}`, data);
    return response.data;
  },

  deletePayment: async (id: number) => {
    const response = await api.delete(`/payments/${id}`);
    return response.data;
  },

  getStudentPayments: async (studentId: number) => {
    const response = await api.get(`/payments/student/${studentId}`);
    return response.data;
  },

  // Receipts
  getAllReceipts: async (params?: any) => {
    const response = await api.get<PaginatedResponse<Receipt>>('/receipts', { params });
    return response.data;
  },

  getReceiptById: async (id: number) => {
    const response = await api.get<Receipt>(`/receipts/${id}`);
    return response.data;
  },

  createReceipt: async (data: Partial<Receipt>) => {
    const response = await api.post<Receipt>('/receipts', data);
    return response.data;
  },

  deleteReceipt: async (id: number) => {
    const response = await api.delete(`/receipts/${id}`);
    return response.data;
  },

  // Reports
  getDailyReport: async (params?: any) => {
    const response = await api.get('/financial-reports/daily', { params });
    return response.data;
  },

  getMonthlyReport: async (params?: any) => {
    const response = await api.get('/financial-reports/monthly', { params });
    return response.data;
  },

  getClassReport: async (params?: any) => {
    const response = await api.get('/financial-reports/class', { params });
    return response.data;
  },

  getOutstandingBalances: async (params?: any) => {
    const response = await api.get('/financial-reports/outstanding', { params });
    return response.data;
  },

  getStudentFinancialHistory: async (studentId: number) => {
    const response = await api.get(`/financial-reports/student/${studentId}`);
    return response.data;
  },

  sendManagementReport: async (month: string) => {
    const response = await api.post('/financial-reports/management-report', { month });
    return response.data;
  },
};
