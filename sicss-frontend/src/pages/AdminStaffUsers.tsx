import { useEffect, useState } from 'react';
import api from '../services/api';
import { Button, Input, Badge } from '../components/ui';
import { FormModal } from '../components/FormModal';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';

type AdminStaffUser = {
  id: number;
  user_code: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: {
    id: number;
    name: string;
    slug: string;
  } | null;
  is_active: boolean;
};

const adminRoles = ['admin', 'finance', 'finance-staff', 'vice-principal-instruction', 'principal', 'proprietor', 'proprietress'];

type Form = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role_id: string;
  address: string;
  is_active: boolean;
};

const emptyForm: Form = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  role_id: '',
  address: '',
  is_active: true,
};

export default function AdminStaffUsers() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';
  
  const [users, setUsers] = useState<AdminStaffUser[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users');
      const allUsers = response.data || [];
      const adminStaffUsers = allUsers.filter((user: any) =>
        user.role && adminRoles.includes(user.role.slug)
      );
      setUsers(adminStaffUsers);
    } catch (error) {
      console.error('Failed to load admin/staff users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await authService.roles();
      const adminStaffRoles = response.filter((r: any) => adminRoles.includes(r.slug));
      setRoles(adminStaffRoles);
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const filtered = users.filter(user => {
    const q = search.toLowerCase();
    const matchSearch = !search || 
      `${user.first_name} ${user.last_name} ${user.email} ${user.user_code || ''}`.toLowerCase().includes(q);
    return matchSearch;
  }).sort((a, b) => {
    // Sort by role name first, then by name
    const roleA = a.role?.name || '';
    const roleB = b.role?.name || '';
    if (roleA !== roleB) {
      return roleA.localeCompare(roleB);
    }
    const nameA = `${a.first_name} ${a.last_name}`;
    const nameB = `${b.first_name} ${b.last_name}`;
    return nameA.localeCompare(nameB);
  });

  const grouped = filtered.reduce((acc, user) => {
    const roleName = user.role?.name || 'Other';
    if (!acc[roleName]) acc[roleName] = [];
    acc[roleName].push(user);
    return acc;
  }, {} as Record<string, AdminStaffUser[]>);

  const handlePrint = () => {
    window.print();
  };


  const openEdit = (user: AdminStaffUser) => {
    setEditingId(user.id);
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone || '',
      role_id: String(user.role?.id || ''),
      address: '',
      is_active: user.is_active,
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await api.put(`/users/${editingId}`, formData);
      } else {
        await api.post('/users', { ...formData, password: 'TempPassword123!' });
      }
      setIsModalOpen(false);
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  return (
    <div className="space-y-5">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .rounded-xl { border-radius: 0 !important; }
          .shadow-sm { box-shadow: none !important; }
          table { border-collapse: collapse !important; width: 100% !important; }
          th, td { border: 1px solid black !important; padding: 4px !important; font-size: 10px !important; }
          th { background-color: #f0f0f0 !important; }
        }
      `}</style>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Administration</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Admin & Staff Users</h1>
          <p className="mt-1 text-sm text-slate-500">{users.length} admin/staff user{users.length !== 1 ? 's' : ''} in the system.</p>
        </div>
        <div className="flex gap-2 no-print">
          {isAdmin && (
            <Button onClick={() => window.location.href = '/application'} className="bg-blue-600 hover:bg-blue-700 text-white">+ Add User</Button>
          )}
          <Button onClick={handlePrint} className="self-start sm:self-auto">
            🖨️ Print
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap gap-3 border-b border-slate-200 px-5 py-4 no-print">
          <Input type="search" placeholder="Search by name, email, or user code…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs text-sm" />
          <span className="ml-auto self-center text-xs text-slate-400">{filtered.length} of {users.length}</span>
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-slate-500">Loading admin/staff users…</p>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">No admin/staff users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">User Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Active</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{user.id}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{user.user_code || 'N/A'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{user.first_name} {user.last_name}</td>
                    <td className="px-4 py-3 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={user.role?.slug === 'admin' ? 'danger' : user.role?.slug?.includes('finance') ? 'success' : 'default'}>
                        {user.role?.name || 'N/A'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{user.phone || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={user.is_active ? 'success' : 'danger'}>
                        {user.is_active ? 'Yes' : 'No'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 no-print">
                        {isAdmin && (
                          <>
                            <Button size="sm" variant="secondary" onClick={() => openEdit(user)}>Edit</Button>
                            <Button size="sm" variant="danger" onClick={() => handleDelete(user.id)} className="bg-rose-600 hover:bg-rose-700 text-white">Delete</Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary by role */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Summary by Role</h3>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
          {Object.entries(grouped).map(([roleName, roleUsers]) => (
            <div key={roleName} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-2xl font-bold text-slate-900">{roleUsers.length}</p>
              <p className="text-xs text-slate-600">{roleName}</p>
            </div>
          ))}
        </div>
      </div>

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Admin Staff' : 'Add Admin Staff'}
        onSubmit={handleSubmit}
        submitText={editingId ? 'Update' : 'Create'}
        isLoading={saving}
      >
        {error && <div className="text-rose-600 text-sm mb-4">{error}</div>}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">First Name *</label>
              <Input
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="First name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Last Name *</label>
              <Input
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Last name"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+231..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Role *</label>
            <select
              value={formData.role_id}
              onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              required
            >
              <option value="">Select role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Residential address"
            />
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-slate-300"
              />
              <span className="text-sm text-slate-700">Active</span>
            </label>
          </div>
        </div>
      </FormModal>
    </div>
  );
}

