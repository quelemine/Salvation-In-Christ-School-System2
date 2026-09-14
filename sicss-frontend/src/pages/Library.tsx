import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { libraryBookService, type LibraryBook } from '../services/libraryBookService';
import { libraryTransactionService, type LibraryTransaction } from '../services/libraryTransactionService';
import { Button, Card, CardContent, LoadingState } from '../components/ui';
import { FormModal } from '../components/FormModal';

export default function Library() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [transactions, setTransactions] = useState<LibraryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'books' | 'transactions'>('books');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<LibraryBook | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<LibraryTransaction | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeTab === 'books') {
      loadBooks();
    } else {
      loadTransactions();
    }
  }, [activeTab]);

  const loadBooks = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await libraryBookService.getAll();
      setBooks(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load books.');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await libraryTransactionService.getAll();
      setTransactions(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load transactions.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBook = async (bookData: Omit<LibraryBook, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingBook?.id) {
        await libraryBookService.update(editingBook.id, bookData);
      } else {
        await libraryBookService.create(bookData);
      }
      await loadBooks();
      setIsBookModalOpen(false);
      setEditingBook(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save book.');
    }
  };

  const handleDeleteBook = async (id: number) => {
    if (!confirm('Are you sure you want to delete this book?')) return;
    try {
      await libraryBookService.delete(id);
      await loadBooks();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete book.');
    }
  };

  const handleIssueBook = async (transactionData: Omit<LibraryTransaction, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await libraryTransactionService.create(transactionData);
      await loadBooks();
      await loadTransactions();
      setIsTransactionModalOpen(false);
      setEditingTransaction(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to issue book.');
    }
  };

  const handleReturnBook = async (id: number) => {
    try {
      await libraryTransactionService.returnBook(id, { return_date: new Date().toISOString().split('T')[0] });
      await loadBooks();
      await loadTransactions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to return book.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Library Management</h1>
        <p className="mt-2 text-slate-600">Manage books, issue/return transactions</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          onClick={() => setActiveTab('books')}
          className={activeTab === 'books' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}
        >
          Books ({books.length})
        </Button>
        <Button
          onClick={() => setActiveTab('transactions')}
          className={activeTab === 'transactions' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}
        >
          Transactions ({transactions.length})
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm">
          <p className="text-sm text-rose-800 mb-4">{error}</p>
          <Button onClick={activeTab === 'books' ? loadBooks : loadTransactions} className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold">
            Try Again
          </Button>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 shadow-sm">
          <LoadingState message="Loading library data..." />
        </div>
      ) : activeTab === 'books' ? (
        <div className="space-y-4">
          {isAdmin && (
            <Button
              onClick={() => {
                setEditingBook(null);
                setIsBookModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold shadow-md"
            >
              + Add Book
            </Button>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.map((book) => (
              <Card key={book.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-2">{book.title}</h3>
                    {!book.is_available && (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        Unavailable
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-2">by {book.author}</p>
                  <p className="text-xs text-slate-500 mb-3">ISBN: {book.isbn}</p>
                  {book.category && (
                    <span className="inline-block px-2 py-1 rounded text-xs bg-slate-100 text-slate-700 mb-3">
                      {book.category}
                    </span>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">
                      {book.available_copies}/{book.total_copies} available
                    </span>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setEditingBook(book);
                            setIsBookModalOpen(true);
                          }}
                          className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold border border-slate-300 px-2 py-1 text-xs"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => book.id && handleDeleteBook(book.id)}
                          className="bg-red-100 hover:bg-red-200 active:bg-red-300 text-red-700 font-semibold border border-red-300 px-2 py-1 text-xs"
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {isAdmin && (
            <Button
              onClick={() => {
                setEditingTransaction(null);
                setIsTransactionModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold shadow-md"
            >
              + Issue Book
            </Button>
          )}
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <Card key={transaction.id} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          transaction.status === 'issued' ? 'bg-blue-100 text-blue-800' :
                          transaction.status === 'returned' ? 'bg-green-100 text-green-800' :
                          transaction.status === 'overdue' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                        <span className="text-sm text-slate-600">
                          Book ID: {transaction.book_id}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600">
                        <span className="font-medium">Issued:</span> {new Date(transaction.issue_date).toLocaleDateString()}
                        <span className="ml-4 font-medium">Due:</span> {new Date(transaction.due_date).toLocaleDateString()}
                        {transaction.return_date && (
                          <>
                            <span className="ml-4 font-medium">Returned:</span> {new Date(transaction.return_date).toLocaleDateString()}
                          </>
                        )}
                      </div>
                      {transaction.fine_amount > 0 && (
                        <div className="text-sm text-red-600 mt-1">
                          Fine: ${transaction.fine_amount.toFixed(2)}
                        </div>
                      )}
                    </div>
                    {transaction.status === 'issued' && isAdmin && (
                      <Button
                        onClick={() => transaction.id && handleReturnBook(transaction.id)}
                        className="bg-green-100 hover:bg-green-200 active:bg-green-300 text-green-700 font-semibold border border-green-300 px-3 py-1"
                      >
                        Return
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <FormModal
        isOpen={isBookModalOpen}
        title={editingBook?.id ? 'Edit Book' : 'Add Book'}
        onClose={() => {
          setIsBookModalOpen(false);
          setEditingBook(null);
        }}
        onSubmit={() => editingBook && handleSaveBook(editingBook)}
        submitText={editingBook?.id ? 'Update' : 'Create'}
        isLoading={false}
      >
        <BookForm book={editingBook} onChange={setEditingBook} />
      </FormModal>

      <FormModal
        isOpen={isTransactionModalOpen}
        title="Issue Book"
        onClose={() => {
          setIsTransactionModalOpen(false);
          setEditingTransaction(null);
        }}
        onSubmit={() => editingTransaction && handleIssueBook(editingTransaction)}
        submitText="Issue"
        isLoading={false}
      >
        <TransactionForm transaction={editingTransaction} onChange={setEditingTransaction} books={books} />
      </FormModal>
    </div>
  );
}

function BookForm({ book, onChange }: any) {
  const [formData, setFormData] = useState<Partial<LibraryBook>>(
    book || {
      isbn: '',
      title: '',
      author: '',
      publisher: '',
      category: '',
      total_copies: 1,
      location: '',
      description: '',
      is_available: true,
    }
  );

  useEffect(() => {
    onChange(formData);
  }, [formData]);

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">ISBN</label>
        <input
          type="text"
          value={formData.isbn}
          onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Author</label>
        <input
          type="text"
          value={formData.author}
          onChange={(e) => setFormData({ ...formData, author: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Publisher</label>
        <input
          type="text"
          value={formData.publisher}
          onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
        <input
          type="text"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Total Copies</label>
        <input
          type="number"
          value={formData.total_copies}
          onChange={(e) => setFormData({ ...formData, total_copies: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Location</label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>
    </div>
  );
}

function TransactionForm({ transaction, onChange, books }: any) {
  const [formData, setFormData] = useState<Partial<LibraryTransaction>>(
    transaction || {
      book_id: 0,
      student_id: undefined,
      teacher_id: undefined,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: '',
      notes: '',
    }
  );

  useEffect(() => {
    onChange(formData);
  }, [formData]);

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Book</label>
        <select
          value={formData.book_id}
          onChange={(e) => setFormData({ ...formData, book_id: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select a book</option>
          {books.filter((b: LibraryBook) => b.available_copies > 0).map((book: LibraryBook) => (
            <option key={book.id} value={book.id}>{book.title} ({book.available_copies} available)</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Student ID</label>
        <input
          type="number"
          value={formData.student_id || ''}
          onChange={(e) => setFormData({ ...formData, student_id: e.target.value ? parseInt(e.target.value) : undefined })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Teacher ID</label>
        <input
          type="number"
          value={formData.teacher_id || ''}
          onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value ? parseInt(e.target.value) : undefined })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Issue Date</label>
          <input
            type="date"
            value={formData.issue_date || ''}
            onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Due Date</label>
          <input
            type="date"
            value={formData.due_date || ''}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
        />
      </div>
    </div>
  );
}
