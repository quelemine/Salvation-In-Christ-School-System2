import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { pageColumnService, type PageColumn } from '../services/pageColumnService';
import { Button, Card, CardContent, LoadingState } from '../components/ui';

const pageList = ['students', 'teachers', 'classes', 'subjects', 'divisions'];

export default function PageColumnEditor() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';
  const [selectedPage, setSelectedPage] = useState<string>('students');
  const [columns, setColumns] = useState<PageColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    loadColumns();
  }, [selectedPage]);

  const loadColumns = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await pageColumnService.getByPage(selectedPage);
      setColumns(data.columns);
      setIsDefault(data.is_default);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load page columns.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await pageColumnService.bulkUpdate(selectedPage, columns);
      await loadColumns();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save page columns.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    setError('');
    try {
      await pageColumnService.reset(selectedPage);
      await loadColumns();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset page columns.');
    } finally {
      setSaving(false);
    }
  };

  const toggleVisibility = (columnKey: string) => {
    setColumns(columns.map(col =>
      col.column_key === columnKey ? { ...col, visible: !col.visible } : col
    ));
  };

  const moveColumn = (columnKey: string, direction: 'up' | 'down') => {
    const newColumns = [...columns];
    const index = newColumns.findIndex(c => c.column_key === columnKey);
    
    if (direction === 'up' && index > 0) {
      [newColumns[index], newColumns[index - 1]] = [newColumns[index - 1], newColumns[index]];
    } else if (direction === 'down' && index < newColumns.length - 1) {
      [newColumns[index], newColumns[index + 1]] = [newColumns[index + 1], newColumns[index]];
    }
    
    setColumns(newColumns);
  };

  const updateLabel = (columnKey: string, label: string) => {
    setColumns(columns.map(col =>
      col.column_key === columnKey ? { ...col, label } : col
    ));
  };

  const updateWidth = (columnKey: string, width: string) => {
    setColumns(columns.map(col =>
      col.column_key === columnKey ? { ...col, width } : col
    ));
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
          <p className="text-slate-600 mt-2">This page is only accessible to administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Page Column Editor</h1>
        <p className="mt-2 text-slate-600">Customize table columns, visibility, and ordering for each page</p>
      </div>

      {/* Page Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Select Page</h3>
        <div className="flex flex-wrap gap-2">
          {pageList.map(page => (
            <Button
              key={page}
              onClick={() => setSelectedPage(page)}
              className={selectedPage === page 
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold shadow-md' 
                : 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold border border-slate-300'
              }
            >
              {page.charAt(0).toUpperCase() + page.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm">
          <p className="text-sm text-rose-800 mb-4">{error}</p>
          <Button onClick={loadColumns} className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold">Try Again</Button>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 shadow-sm">
          <LoadingState message="Loading page columns..." />
        </div>
      ) : (
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {selectedPage.charAt(0).toUpperCase() + selectedPage.slice(1)} Table Columns
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Manage column visibility, labels, and ordering</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleReset} className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold border border-slate-300">
                    Reset to Default
                  </Button>
                  <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold shadow-md" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Columns'}
                  </Button>
                </div>
              </div>

              {isDefault && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">Using default columns. Save to create custom configuration.</p>
                </div>
              )}

              <div className="space-y-3">
                {columns.map((column, index) => (
                  <div
                    key={column.column_key}
                    className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-lg bg-white hover:border-blue-300 transition-all duration-200"
                  >
                    <div className="flex-1 space-y-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Column Key</label>
                        <span className="text-sm font-semibold text-slate-900">{column.column_key}</span>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Label</label>
                        <input
                          type="text"
                          value={column.label}
                          onChange={(e) => updateLabel(column.column_key, e.target.value)}
                          className="w-full px-3 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="mb-1 block text-xs font-medium text-slate-600">Width</label>
                          <input
                            type="text"
                            value={column.width || ''}
                            onChange={(e) => updateWidth(column.column_key, e.target.value)}
                            placeholder="e.g., 150px, 20%"
                            className="w-full px-3 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                            <input
                              type="checkbox"
                              checked={column.sortable}
                              onChange={() => setColumns(columns.map(col =>
                                col.column_key === column.column_key ? { ...col, sortable: !col.sortable } : col
                              ))}
                              className="rounded border-slate-300"
                            />
                            Sortable
                          </label>
                          <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                            <input
                              type="checkbox"
                              checked={column.filterable}
                              onChange={() => setColumns(columns.map(col =>
                                col.column_key === column.column_key ? { ...col, filterable: !col.filterable } : col
                              ))}
                              className="rounded border-slate-300"
                            />
                            Filterable
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => moveColumn(column.column_key, 'up')}
                        className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold border border-slate-300 px-3 py-1"
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        onClick={() => moveColumn(column.column_key, 'down')}
                        className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold border border-slate-300 px-3 py-1"
                        disabled={index === columns.length - 1}
                      >
                        ↓
                      </Button>
                      <Button
                        onClick={() => toggleVisibility(column.column_key)}
                        className={column.visible 
                          ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold shadow-md px-3 py-1' 
                          : 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold border border-slate-300 px-3 py-1'
                        }
                      >
                        {column.visible ? 'Visible' : 'Hidden'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
