import api from './api';

export interface LibraryTransaction {
  id?: number;
  book_id: number;
  student_id?: number;
  teacher_id?: number;
  issued_by?: number;
  returned_by?: number;
  issue_date: string;
  due_date: string;
  return_date?: string;
  status: 'issued' | 'returned' | 'overdue' | 'lost';
  notes?: string;
  fine_amount: number;
  fine_paid: boolean;
  created_at?: string;
  updated_at?: string;
}

export const libraryTransactionService = {
  getAll: async (params?: any): Promise<LibraryTransaction[]> => {
    const response = await api.get<LibraryTransaction[]>('/library-transactions', { params });
    return response.data;
  },

  getById: async (id: number): Promise<LibraryTransaction> => {
    const response = await api.get<LibraryTransaction>(`/library-transactions/${id}`);
    return response.data;
  },

  create: async (data: Omit<LibraryTransaction, 'id' | 'created_at' | 'updated_at'>): Promise<LibraryTransaction> => {
    const response = await api.post<LibraryTransaction>('/library-transactions', data);
    return response.data;
  },

  update: async (id: number, data: Partial<LibraryTransaction>): Promise<LibraryTransaction> => {
    const response = await api.put<LibraryTransaction>(`/library-transactions/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/library-transactions/${id}`);
  },

  returnBook: async (id: number, data: { return_date: string; fine_amount?: number }): Promise<LibraryTransaction> => {
    const response = await api.post<LibraryTransaction>(`/library-transactions/${id}/return`, data);
    return response.data;
  },
};
