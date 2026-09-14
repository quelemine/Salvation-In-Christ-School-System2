import { useState, useEffect } from 'react';
import { divisionService, type Division } from '../services/divisionService';
import { FormModal } from '../components/FormModal';
import { useAuthStore } from '../store/authStore';
import { Button, Input, Table, TableHeader, TableBody, TableRow, TableCell, TableHead, LoadingState, EmptyState, Card, CardContent } from '../components/ui';

type Form = { name: string; description: string };
const empty: Form = { name: '', description: '' };

export default function Divisions() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [isOpen, setIsOpen]       = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm]           = useState<Form>(empty);
  const [search, setSearch]       = useState('');
  const [deleteId, setDeleteId]   = useState<number | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await divisionService.getAll();
      setDivisions((Array.isArray(res) ? res : (res as any).data) || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load divisions.');
    } finally { setLoading(false); }
  };

  const openAdd = () => { setEditingId(null); setForm(empty); setError(''); setIsOpen(true); };
  const openEdit = (d: Division) => { setEditingId(d.id); setForm({ name: d.name, description: d.description || '' }); setError(''); setIsOpen(true); };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Division name is required.'); return; }
    setSaving(true); setError('');
    const payload = { name: form.name, description: form.description || null };
    try {
      if (editingId) {
        await divisionService.update(editingId, payload);
        setDivisions((p) => p.map((d) => d.id === editingId ? { ...d, ...payload } : d));
      } else {
        const res = await divisionService.create(payload);
        const created = (res as any).data ?? res;
        setDivisions((p) => [created, ...p]);
      }
      setIsOpen(false);
    } catch { setError('Failed to save division.'); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await divisionService.delete(deleteId);
      setDivisions((p) => p.filter((d) => d.id !== deleteId));
      setDeleteId(null);
    } catch { setError('Failed to delete division. It may have classes attached.'); setDeleteId(null); }
  };

  const filtered = divisions.filter((d) =>
    `${d.name} ${d.description || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Delete confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Delete division?</h3>
            <p className="mt-2 text-sm text-slate-500">This cannot be undone. Classes inside this division may be affected.</p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition-all hover:bg-rose-700 hover:shadow-xl">Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Academic structure</p>
          <h1 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">Divisions</h1>
          <p className="mt-2 text-base text-slate-500">Divisions group related classes together (e.g. Primary, Junior High).</p>
        </div>
        {isAdmin && (
          <Button onClick={openAdd} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 hover:shadow-xl">
            + Add division
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
          <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-rose-800">{error}</p>
            <Button onClick={load} variant="secondary" className="mt-2 text-xs">Try Again</Button>
          </div>
        </div>
      )}

      <Card className="shadow-lg shadow-slate-200/50">
        <CardContent className="p-0">
          <div className="border-b border-slate-200 px-6 py-4">
            <div className="relative max-w-xs">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <Input
                type="search"
                placeholder="Search divisions…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 max-w-xs rounded-xl border-slate-300 bg-white shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-400"
              />
            </div>
          </div>
          {loading ? (
            <LoadingState message="Loading…" />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No divisions found"
              description="Try adjusting your search to find what you're looking for."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">Name</TableHead>
                  <TableHead className="font-semibold text-slate-700">Description</TableHead>
                  <TableHead className="font-semibold text-slate-700">Created</TableHead>
                  <TableHead className="font-semibold text-slate-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => (
                  <TableRow key={d.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="font-semibold text-slate-900">{d.name}</TableCell>
                    <TableCell className="text-slate-600">{d.description || '—'}</TableCell>
                    <TableCell className="text-slate-400 text-xs">{d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>
                      {isAdmin ? (
                        <div className="flex gap-2">
                          <Button onClick={() => openEdit(d)} variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                            Edit
                          </Button>
                          <Button onClick={() => setDeleteId(d.id)} variant="ghost" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                            Delete
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">View only</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="border-t border-slate-200 px-6 py-4 text-xs text-slate-500 font-medium">{filtered.length} of {divisions.length}</div>
        </CardContent>
      </Card>

      <FormModal isOpen={isOpen} title={editingId ? 'Edit division' : 'Add division'} onClose={() => setIsOpen(false)} onSubmit={handleSubmit} submitText={editingId ? 'Save changes' : 'Create division'} isLoading={saving}>
        <div className="space-y-5">
          <div>
            <Input
              label="Division name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Primary School, Junior High…"
              required
            />
          </div>
          <div>
            <Input
              label="Description"
              type="textarea"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Optional description…"
            />
          </div>
        </div>
      </FormModal>
    </div>
  );
}
