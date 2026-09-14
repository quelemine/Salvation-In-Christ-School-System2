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
    <div className="space-y-5">
      {/* Delete confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-950">Delete division?</h3>
            <p className="mt-2 text-sm text-slate-500">This cannot be undone. Classes inside this division may be affected.</p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={confirmDelete} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Academic structure</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Divisions</h1>
          <p className="mt-1 text-sm text-slate-500">Divisions group related classes together (e.g. Primary, Junior High).</p>
        </div>
        {isAdmin && (
          <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white">
            + Add division
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
          <p className="text-sm text-rose-800 mb-4">{error}</p>
          <Button onClick={load} variant="secondary">Try Again</Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="border-b border-slate-200 px-5 py-4">
            <Input
              type="search"
              placeholder="Search divisions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
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
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-semibold text-slate-900">{d.name}</TableCell>
                    <TableCell className="text-slate-600">{d.description || '—'}</TableCell>
                    <TableCell className="text-slate-400 text-xs">{d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>
                      {isAdmin ? (
                        <div className="flex gap-3">
                          <Button onClick={() => openEdit(d)} variant="ghost" className="text-blue-600 hover:text-blue-700 text-xs p-0 h-auto">
                            Edit
                          </Button>
                          <Button onClick={() => setDeleteId(d.id)} variant="ghost" className="text-rose-600 hover:text-rose-700 text-xs p-0 h-auto">
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
          <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-400">{filtered.length} of {divisions.length}</div>
        </CardContent>
      </Card>

      <FormModal isOpen={isOpen} title={editingId ? 'Edit division' : 'Add division'} onClose={() => setIsOpen(false)} onSubmit={handleSubmit} submitText={editingId ? 'Save changes' : 'Create division'} isLoading={saving}>
        <div className="space-y-4">
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
