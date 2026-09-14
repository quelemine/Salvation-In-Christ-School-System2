import api from './api';

export interface LibraryBook {
  id?: number;
  isbn: string;
  title: string;
  author: string;
  publisher?: string;
  publication_year?: string;
  category?: string;
  total_copies: number;
  available_copies: number;
  location?: string;
  description?: string;
  added_by?: number;
  is_available: boolean;
  created_at?: string;
  updated_at?: string;
}

export const libraryBookService = {
  getAll: async (params?: any): Promise<LibraryBook[]> => {
    const response = await api.get<LibraryBook[]>('/library-books', { params });
    return response.data;
  },

  getById: async (id: number): Promise<LibraryBook> => {
    const response = await api.get<LibraryBook>(`/library-books/${id}`);
    return response.data;
  },

  create: async (data: Omit<LibraryBook, 'id' | 'created_at' | 'updated_at'>): Promise<LibraryBook> => {
    const response = await api.post<LibraryBook>('/library-books', data);
    return response.data;
  },

  update: async (id: number, data: Partial<LibraryBook>): Promise<LibraryBook> => {
    const response = await api.put<LibraryBook>(`/library-books/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/library-books/${id}`);
  },
};
