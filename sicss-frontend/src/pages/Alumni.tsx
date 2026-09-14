import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { alumniService, type Alumni } from '../services/alumniService';
import { Button, Card, CardContent, LoadingState } from '../components/ui';
import { FormModal } from '../components/FormModal';

export default function Alumni() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingAlumni, setEditingAlumni] = useState<Alumni | null>(null);
  const [error, setError] = useState('');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  useEffect(() => {
    loadAlumni();
  }, [filterYear, searchQuery, showActiveOnly]);

  const loadAlumni = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {};
      if (filterYear !== 'all') {
        params.graduation_year = filterYear;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }
      if (showActiveOnly) {
        params.active = true;
      }
      const data = await alumniService.getAll(params);
      setAlumni(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load alumni records.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (alumniData: Omit<Alumni, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingAlumni?.id) {
        await alumniService.update(editingAlumni.id, alumniData);
      } else {
        await alumniService.create(alumniData);
      }
      await loadAlumni();
      setIsOpen(false);
      setEditingAlumni(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save alumni record.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this alumni record?')) return;
    try {
      await alumniService.delete(id);
      await loadAlumni();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete alumni record.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Alumni Management</h1>
        <p className="mt-2 text-slate-600">Track and manage school alumni records</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-sm font-medium text-slate-700">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search by name or email"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-sm font-medium text-slate-700">Graduation Year</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Years</option>
              {Array.from(new Set(alumni.map(a => a.graduation_year).filter(Boolean))).sort().reverse().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="rounded border-slate-300"
              />
              Active Only
            </label>
          </div>
          {isAdmin && (
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setEditingAlumni(null);
                  setIsOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold shadow-md"
              >
                + Add Alumni
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm">
          <p className="text-sm text-rose-800 mb-4">{error}</p>
          <Button onClick={loadAlumni} className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold">
            Try Again
          </Button>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 shadow-sm">
          <LoadingState message="Loading alumni records..." />
        </div>
      ) : (
        <div className="space-y-4">
          {alumni.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">No alumni records found for the selected criteria.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {alumni.map((alum) => (
                <Card key={alum.id} className={`shadow-sm ${!alum.is_active ? 'opacity-60' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-bold text-slate-900">{alum.first_name} {alum.last_name}</h3>
                      {alum.is_active ? (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                          Inactive
                        </span>
                      )}
                    </div>
                    <span className="inline-block px-2 py-1 rounded text-xs bg-blue-100 text-blue-700 mb-3">
                      Class of {alum.graduation_year}
                    </span>
                    <div className="space-y-1 text-sm text-slate-600 mb-3">
                      {alum.email && <p><span className="font-medium">Email:</span> {alum.email}</p>}
                      {alum.current_occupation && <p><span className="font-medium">Occupation:</span> {alum.current_occupation}</p>}
                      {alum.current_employer && <p><span className="font-medium">Employer:</span> {alum.current_employer}</p>}
                      {alum.phone && <p><span className="font-medium">Phone:</span> {alum.phone}</p>}
                    </div>
                    {alum.wants_newsletter && (
                      <span className="inline-block px-2 py-1 rounded text-xs bg-purple-100 text-purple-700 mb-3">
                        📧 Newsletter
                      </span>
                    )}
                    {isAdmin && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setEditingAlumni(alum);
                            setIsOpen(true);
                          }}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold border border-slate-300 px-2 py-1 text-xs"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => alum.id && handleDelete(alum.id)}
                          className="bg-red-100 hover:bg-red-200 active:bg-red-300 text-red-700 font-semibold border border-red-300 px-2 py-1 text-xs"
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <FormModal
        isOpen={isOpen}
        title={editingAlumni?.id ? 'Edit Alumni Record' : 'Add Alumni Record'}
        onClose={() => {
          setIsOpen(false);
          setEditingAlumni(null);
        }}
        onSubmit={() => editingAlumni && handleSave(editingAlumni)}
        submitText={editingAlumni?.id ? 'Update' : 'Create'}
        isLoading={false}
      >
        <AlumniForm alumni={editingAlumni} onChange={setEditingAlumni} />
      </FormModal>
    </div>
  );
}

function AlumniForm({ alumni, onChange }: any) {
  const [formData, setFormData] = useState<Partial<Alumni>>(
    alumni || {
      student_id: undefined,
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      graduation_year: new Date().getFullYear().toString(),
      current_occupation: '',
      current_employer: '',
      address: '',
      bio: '',
      is_active: true,
      wants_newsletter: true,
    }
  );

  useEffect(() => {
    onChange(formData);
  }, [formData]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">First Name</label>
          <input
            type="text"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Last Name</label>
          <input
            type="text"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Student ID (Optional)</label>
        <input
          type="number"
          value={formData.student_id || ''}
          onChange={(e) => setFormData({ ...formData, student_id: e.target.value ? parseInt(e.target.value) : undefined })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Graduation Year</label>
        <input
          type="text"
          value={formData.graduation_year}
          onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Current Occupation</label>
          <input
            type="text"
            value={formData.current_occupation}
            onChange={(e) => setFormData({ ...formData, current_occupation: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Current Employer</label>
          <input
            type="text"
            value={formData.current_employer}
            onChange={(e) => setFormData({ ...formData, current_employer: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Address</label>
        <textarea
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Bio</label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="rounded border-slate-300"
          />
          Active
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={formData.wants_newsletter}
            onChange={(e) => setFormData({ ...formData, wants_newsletter: e.target.checked })}
            className="rounded border-slate-300"
          />
          Subscribe to Newsletter
        </label>
      </div>
    </div>
  );
}
