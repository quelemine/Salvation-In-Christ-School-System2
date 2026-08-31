import { useEffect, useState } from 'react';
import api from '../services/api';

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

const adminRoles = ['admin', 'finance', 'finance-staff', 'vice-principal-instruction', 'principal', 'head-of-school'];

export default function AdminStaffUsers() {
  const [users, setUsers] = useState<AdminStaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUsers();
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

  const roleColor = (slug?: string) => {
    if (!slug) return 'bg-slate-100 text-slate-600';
    switch (slug) {
      case 'admin': return 'bg-rose-100 text-rose-700';
      case 'finance':
      case 'finance-staff': return 'bg-emerald-100 text-emerald-800';
      case 'vice-principal-instruction': return 'bg-purple-100 text-purple-700';
      case 'principal': return 'bg-blue-100 text-blue-700';
      case 'head-of-school': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const grouped = filtered.reduce((acc, user) => {
    const roleName = user.role?.name || 'Other';
    if (!acc[roleName]) acc[roleName] = [];
    acc[roleName].push(user);
    return acc;
  }, {} as Record<string, AdminStaffUser[]>);

  const handlePrint = () => {
    window.print();
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
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Administration</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Admin & Staff Users</h1>
          <p className="mt-1 text-sm text-slate-500">{users.length} admin/staff user{users.length !== 1 ? 's' : ''} in the system.</p>
        </div>
        <button 
          onClick={handlePrint}
          className="self-start rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 sm:self-auto no-print"
        >
          🖨️ Print
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap gap-3 border-b border-slate-100 px-5 py-4 no-print">
          <input 
            type="search" 
            placeholder="Search by name, email, or user code…" 
            value={search}
            onChange={(e) => setSearch(e.target.value)} 
            className="input-field max-w-xs text-sm" 
          />
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
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${roleColor(user.role?.slug)}`}>
                        {user.role?.name || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{user.phone || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                        user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {user.is_active ? 'Yes' : 'No'}
                      </span>
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
    </div>
  );
}
