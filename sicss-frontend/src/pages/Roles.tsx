import { useEffect, useState } from 'react';
import { roleService, type Role } from '../services/roleService';
import { useAuthStore } from '../store/authStore';
import { Button, Input, Badge, Table, TableHeader, TableBody, TableRow, TableCell, TableHead, LoadingState, EmptyState, Card, CardContent } from '../components/ui';
import { FormModal } from '../components/FormModal';

type Form = {
  name: string;
  slug: string;
  description: string;
};

const empty: Form = {
  name: '',
  slug: '',
  description: '',
};

export default function Roles() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await roleService.getAll();
      setRoles(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load roles.');
    } finally { setLoading(false); }
  };

  const openAdd = () => { setEditingId(null); setForm(empty); setError(''); setIsOpen(true); };
  const openEdit = (role: Role) => {
    setEditingId(role.id);
    setForm({
      name: role.name,
      slug: role.slug,
      description: role.description || '',
    });
    setError(''); setIsOpen(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await roleService.update(editingId, form);
      } else {
        await roleService.create(form);
      }
      setIsOpen(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save role.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    setSaving(true);
    try {
      await roleService.delete(id);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete role.');
    } finally { setSaving(false); }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const filtered = roles.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.slug.toLowerCase().includes(search.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <EmptyState title="Access Denied" description="You don't have permission to manage roles." />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Role Management</h1>
          <p className="text-slate-500">Manage system roles and permissions</p>
        </div>
        <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white">+ Add Role</Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <Input
              placeholder="Search roles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {loading ? (
            <LoadingState />
          ) : error ? (
            <div className="text-rose-600">{error}</div>
          ) : filtered.length === 0 ? (
            <EmptyState title="No roles found" description="Create your first role to get started." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell><Badge>{role.slug}</Badge></TableCell>
                    <TableCell className="text-slate-500">{role.description || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => openEdit(role)}>
                          Edit
                        </Button>
                        {role.slug !== 'admin' && role.slug !== 'super-admin' && (
                          <Button size="sm" variant="danger" onClick={() => handleDelete(role.id)} className="bg-rose-600 hover:bg-rose-700 text-white">
                            Delete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <FormModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        title={editingId ? 'Edit Role' : 'Add Role'}
        onSubmit={handleSubmit}
        submitText={editingId ? 'Update' : 'Create'}
        isLoading={saving}
      >
        {error && <div className="text-rose-600 text-sm mb-4">{error}</div>}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Role Name *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })}
              placeholder="e.g., Subject Teacher"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Slug *</label>
            <Input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="e.g., subject-teacher"
              required
            />
            <p className="text-xs text-slate-500 mt-1">Unique identifier for the role</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of the role"
            />
          </div>
        </div>
      </FormModal>
    </div>
  );
}
