import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { sportsActivityService, type SportsActivity } from '../services/sportsActivityService';
import { Button, Card, CardContent, LoadingState } from '../components/ui';
import { FormModal } from '../components/FormModal';

export default function SportsActivities() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';
  const [activities, setActivities] = useState<SportsActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<SportsActivity | null>(null);
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  useEffect(() => {
    loadActivities();
  }, [filterCategory, showActiveOnly]);

  const loadActivities = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {};
      if (filterCategory !== 'all') {
        params.category = filterCategory;
      }
      if (showActiveOnly) {
        params.active = true;
      }
      const data = await sportsActivityService.getAll(params);
      setActivities(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load sports activities.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (activityData: Omit<SportsActivity, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingActivity?.id) {
        await sportsActivityService.update(editingActivity.id, activityData);
      } else {
        await sportsActivityService.create(activityData);
      }
      await loadActivities();
      setIsOpen(false);
      setEditingActivity(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save sports activity.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this sports activity?')) return;
    try {
      await sportsActivityService.delete(id);
      await loadActivities();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete sports activity.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Sports & Extracurricular Activities</h1>
        <p className="mt-2 text-slate-600">Manage sports teams, clubs, and extracurricular activities</p>
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
              {Array.from(new Set(activities.map(a => a.category).filter(Boolean))).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
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
                  setEditingActivity(null);
                  setIsOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold shadow-md"
              >
                + Add Activity
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm">
          <p className="text-sm text-rose-800 mb-4">{error}</p>
          <Button onClick={loadActivities} className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold">
            Try Again
          </Button>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 shadow-sm">
          <LoadingState message="Loading sports activities..." />
        </div>
      ) : (
        <div className="space-y-4">
          {activities.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">No sports activities found for the selected criteria.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activities.map((activity) => (
                <Card key={activity.id} className={`shadow-sm ${!activity.is_active ? 'opacity-60' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-bold text-slate-900">{activity.name}</h3>
                      {activity.is_active ? (
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
                      {activity.category}
                    </span>
                    <div className="space-y-1 text-sm text-slate-600 mb-3">
                      {activity.venue && <p><span className="font-medium">Venue:</span> {activity.venue}</p>}
                      {activity.schedule && <p><span className="font-medium">Schedule:</span> {activity.schedule}</p>}
                      {activity.capacity && <p><span className="font-medium">Capacity:</span> {activity.capacity}</p>}
                      {activity.start_date && activity.end_date && (
                        <p>
                          <span className="font-medium">Duration:</span>{' '}
                          {new Date(activity.start_date).toLocaleDateString()} - {new Date(activity.end_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {activity.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3">{activity.description}</p>
                    )}
                    {isAdmin && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setEditingActivity(activity);
                            setIsOpen(true);
                          }}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold border border-slate-300 px-2 py-1 text-xs"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => activity.id && handleDelete(activity.id)}
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
        title={editingActivity?.id ? 'Edit Sports Activity' : 'Add Sports Activity'}
        onClose={() => {
          setIsOpen(false);
          setEditingActivity(null);
        }}
        onSubmit={() => editingActivity && handleSave(editingActivity)}
        submitText={editingActivity?.id ? 'Update' : 'Create'}
        isLoading={false}
      >
        <SportsActivityForm activity={editingActivity} onChange={setEditingActivity} />
      </FormModal>
    </div>
  );
}

function SportsActivityForm({ activity, onChange }: any) {
  const [formData, setFormData] = useState<Partial<SportsActivity>>(
    activity || {
      name: '',
      description: '',
      category: 'sports',
      coach_id: undefined,
      venue: '',
      schedule: '',
      start_date: '',
      end_date: '',
      capacity: undefined,
      is_active: true,
    }
  );

  useEffect(() => {
    onChange(formData);
  }, [formData]);

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="sports">Sports</option>
          <option value="clubs">Clubs</option>
          <option value="arts">Arts</option>
          <option value="academic">Academic</option>
          <option value="other">Other</option>
        </select>
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
        <label className="mb-1 block text-sm font-medium text-slate-700">Coach ID</label>
        <input
          type="number"
          value={formData.coach_id || ''}
          onChange={(e) => setFormData({ ...formData, coach_id: e.target.value ? parseInt(e.target.value) : undefined })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Venue</label>
        <input
          type="text"
          value={formData.venue}
          onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Schedule</label>
        <input
          type="text"
          value={formData.schedule}
          onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Mon, Wed, Fri 3:00 PM"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Start Date</label>
          <input
            type="date"
            value={formData.start_date || ''}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">End Date</label>
          <input
            type="date"
            value={formData.end_date || ''}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Capacity</label>
        <input
          type="number"
          value={formData.capacity || ''}
          onChange={(e) => setFormData({ ...formData, capacity: e.target.value ? parseInt(e.target.value) : undefined })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="0"
        />
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          className="rounded border-slate-300"
        />
        Active
      </label>
    </div>
  );
}
