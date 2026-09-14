import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { documentService, type Document } from '../services/documentService';
import { Button, Card, CardContent, LoadingState } from '../components/ui';
import { FormModal } from '../components/FormModal';

export default function Documents() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [filterCategory]);

  const loadDocuments = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {};
      if (filterCategory !== 'all') {
        params.category = filterCategory;
      }
      const data = await documentService.getAll(params);
      setDocuments(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (formData: FormData) => {
    setUploading(true);
    setError('');
    try {
      await documentService.create(formData);
      await loadDocuments();
      setIsOpen(false);
      setEditingDocument(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = async (documentData: Partial<Document>) => {
    if (!editingDocument?.id) return;
    try {
      await documentService.update(editingDocument.id, documentData);
      await loadDocuments();
      setIsOpen(false);
      setEditingDocument(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update document.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await documentService.delete(id);
      await loadDocuments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete document.');
    }
  };

  const handleDownload = async (id: number) => {
    try {
      const blob = await documentService.download(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = documents.find(d => d.id === id)?.file_name || 'document';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to download document.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Document Management</h1>
        <p className="mt-2 text-slate-600">Upload and manage school documents</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-sm font-medium text-slate-700">Filter by Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {Array.from(new Set(documents.map(d => d.category).filter(Boolean))).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          {isAdmin && (
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setEditingDocument(null);
                  setIsOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold shadow-md"
              >
                + Upload Document
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm">
          <p className="text-sm text-rose-800 mb-4">{error}</p>
          <Button onClick={loadDocuments} className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold">
            Try Again
          </Button>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 shadow-sm">
          <LoadingState message="Loading documents..." />
        </div>
      ) : (
        <div className="space-y-4">
          {documents.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">No documents found for the selected criteria.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((document) => (
                <Card key={document.id} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-bold text-slate-900 line-clamp-2">{document.title}</h3>
                      {document.is_public && (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          Public
                        </span>
                      )}
                    </div>
                    {document.category && (
                      <span className="inline-block px-2 py-1 rounded text-xs bg-slate-100 text-slate-700 mb-3">
                        {document.category}
                      </span>
                    )}
                    <div className="space-y-1 text-sm text-slate-600 mb-3">
                      <p><span className="font-medium">Type:</span> {document.file_type.toUpperCase()}</p>
                      <p><span className="font-medium">Size:</span> {formatFileSize(document.file_size)}</p>
                      {document.description && (
                        <p className="text-xs text-slate-500 line-clamp-2">{document.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => document.id && handleDownload(document.id)}
                        className="flex-1 bg-blue-100 hover:bg-blue-200 active:bg-blue-300 text-blue-700 font-semibold border border-blue-300 px-2 py-1 text-xs"
                      >
                        Download
                      </Button>
                      {isAdmin && (
                        <>
                          <Button
                            onClick={() => {
                              setEditingDocument(document);
                              setIsOpen(true);
                            }}
                            className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold border border-slate-300 px-2 py-1 text-xs"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => document.id && handleDelete(document.id)}
                            className="bg-red-100 hover:bg-red-200 active:bg-red-300 text-red-700 font-semibold border border-red-300 px-2 py-1 text-xs"
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <FormModal
        isOpen={isOpen}
        title={editingDocument?.id ? 'Edit Document' : 'Upload Document'}
        onClose={() => {
          setIsOpen(false);
          setEditingDocument(null);
        }}
        onSubmit={() => editingDocument?.id ? handleEdit(editingDocument) : null}
        submitText={editingDocument?.id ? 'Update' : 'Upload'}
        isLoading={uploading}
      >
        <DocumentForm document={editingDocument} onChange={setEditingDocument} onUpload={handleUpload} />
      </FormModal>
    </div>
  );
}

function DocumentForm({ document, onChange, onUpload }: any) {
  const [formData, setFormData] = useState<Partial<Document> & { file?: File }>(
    document || {
      title: '',
      description: '',
      category: '',
      is_public: false,
    }
  );

  useEffect(() => {
    onChange(formData);
  }, [formData]);

  const handleSubmit = () => {
    const uploadFormData = new FormData();
    if (formData.file) {
      uploadFormData.append('file', formData.file);
    }
    uploadFormData.append('title', formData.title || '');
    uploadFormData.append('description', formData.description || '');
    uploadFormData.append('category', formData.category || '');
    uploadFormData.append('is_public', String(formData.is_public || false));
    onUpload(uploadFormData);
  };

  return (
    <div className="space-y-4">
      {!document?.id && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">File</label>
          <input
            type="file"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setFormData({ ...formData, file: e.target.files[0] });
              }
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      )}
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
        <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
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
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={formData.is_public}
          onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
          className="rounded border-slate-300"
        />
        Public Document
      </label>
      {!document?.id && (
        <Button
          onClick={handleSubmit}
          disabled={!formData.file}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold"
        >
          Upload Document
        </Button>
      )}
    </div>
  );
}
