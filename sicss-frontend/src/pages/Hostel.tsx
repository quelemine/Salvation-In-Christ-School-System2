import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { hostelService, type Hostel } from '../services/hostelService';
import { hostelAssignmentService, type HostelAssignment } from '../services/hostelAssignmentService';
import { Button, Card, CardContent, LoadingState } from '../components/ui';
import { FormModal } from '../components/FormModal';

export default function Hostel() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [assignments, setAssignments] = useState<HostelAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'hostels' | 'assignments'>('hostels');
  const [isHostelModalOpen, setIsHostelModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [editingHostel, setEditingHostel] = useState<Hostel | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<HostelAssignment | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeTab === 'hostels') {
      loadHostels();
    } else {
      loadAssignments();
    }
  }, [activeTab]);

  const loadHostels = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await hostelService.getAll();
      setHostels(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load hostels.');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await hostelAssignmentService.getAll();
      setAssignments(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHostel = async (hostelData: Omit<Hostel, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingHostel?.id) {
        await hostelService.update(editingHostel.id, hostelData);
      } else {
        await hostelService.create(hostelData);
      }
      await loadHostels();
      setIsHostelModalOpen(false);
      setEditingHostel(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save hostel.');
    }
  };

  const handleDeleteHostel = async (id: number) => {
    if (!confirm('Are you sure you want to delete this hostel?')) return;
    try {
      await hostelService.delete(id);
      await loadHostels();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete hostel.');
    }
  };

  const handleSaveAssignment = async (assignmentData: Omit<HostelAssignment, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingAssignment?.id) {
        await hostelAssignmentService.update(editingAssignment.id, assignmentData);
      } else {
        await hostelAssignmentService.create(assignmentData);
      }
      await loadAssignments();
      setIsAssignmentModalOpen(false);
      setEditingAssignment(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save assignment.');
    }
  };

  const handleDeleteAssignment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await hostelAssignmentService.delete(id);
      await loadAssignments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete assignment.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Hostel/Dormitory Management</h1>
        <p className="mt-2 text-slate-600">Manage hostels and room assignments</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          onClick={() => setActiveTab('hostels')}
          className={activeTab === 'hostels' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}
        >
          Hostels ({hostels.length})
        </Button>
        <Button
          onClick={() => setActiveTab('assignments')}
          className={activeTab === 'assignments' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}
        >
          Assignments ({assignments.length})
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm">
          <p className="text-sm text-rose-800 mb-4">{error}</p>
          <Button onClick={activeTab === 'hostels' ? loadHostels : loadAssignments} className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold">
            Try Again
          </Button>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 shadow-sm">
          <LoadingState message="Loading hostel data..." />
        </div>
      ) : activeTab === 'hostels' ? (
        <div className="space-y-4">
          {isAdmin && (
            <Button
              onClick={() => {
                setEditingHostel(null);
                setIsHostelModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold shadow-md"
            >
              + Add Hostel
            </Button>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hostels.map((hostel) => (
              <Card key={hostel.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-slate-900">{hostel.name}</h3>
                    {!hostel.is_active && (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        Inactive
                      </span>
                    )}
                  </div>
                  {hostel.location && (
                    <p className="text-sm text-slate-600 mb-3">📍 {hostel.location}</p>
                  )}
                  <div className="space-y-1 text-sm text-slate-600 mb-3">
                    <p><span className="font-medium">Rooms:</span> {hostel.total_rooms}</p>
                    <p><span className="font-medium">Capacity:</span> {hostel.capacity}</p>
                  </div>
                  {hostel.warden_name && (
                    <div className="space-y-1 text-sm text-slate-600">
                      <p><span className="font-medium">Warden:</span> {hostel.warden_name}</p>
                      <p><span className="font-medium">Phone:</span> {hostel.warden_phone}</p>
                    </div>
                  )}
                  {isAdmin && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => {
                          setEditingHostel(hostel);
                          setIsHostelModalOpen(true);
                        }}
                        className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold border border-slate-300 px-2 py-1 text-xs"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => hostel.id && handleDeleteHostel(hostel.id)}
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
        </div>
      ) : (
        <div className="space-y-4">
          {isAdmin && (
            <Button
              onClick={() => {
                setEditingAssignment(null);
                setIsAssignmentModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold shadow-md"
            >
              + Add Assignment
            </Button>
          )}
          <div className="space-y-3">
            {assignments.map((assignment) => (
              <Card key={assignment.id} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-semibold text-blue-600">
                          Hostel ID: {assignment.hostel_id}
                        </span>
                        {assignment.student_id && (
                          <span className="text-sm text-slate-600">Student ID: {assignment.student_id}</span>
                        )}
                        {assignment.teacher_id && (
                          <span className="text-sm text-slate-600">Teacher ID: {assignment.teacher_id}</span>
                        )}
                      </div>
                      <div className="text-sm text-slate-600">
                        {assignment.room_number && (
                          <span className="mr-4"><span className="font-medium">Room:</span> {assignment.room_number}</span>
                        )}
                        {assignment.bed_number && (
                          <span className="mr-4"><span className="font-medium">Bed:</span> {assignment.bed_number}</span>
                        )}
                      </div>
                      {assignment.assignment_date && (
                        <div className="text-sm text-slate-600 mt-1">
                          <span className="font-medium">Assigned:</span> {new Date(assignment.assignment_date).toLocaleDateString()}
                        </div>
                      )}
                      {assignment.checkout_date && (
                        <div className="text-sm text-slate-600">
                          <span className="font-medium">Checkout:</span> {new Date(assignment.checkout_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    {isAdmin && (
                      <Button
                        onClick={() => assignment.id && handleDeleteAssignment(assignment.id)}
                        className="bg-red-100 hover:bg-red-200 active:bg-red-300 text-red-700 font-semibold border border-red-300 px-3 py-1"
                      >
                        Delete
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
        isOpen={isHostelModalOpen}
        title={editingHostel?.id ? 'Edit Hostel' : 'Add Hostel'}
        onClose={() => {
          setIsHostelModalOpen(false);
          setEditingHostel(null);
        }}
        onSubmit={() => editingHostel && handleSaveHostel(editingHostel)}
        submitText={editingHostel?.id ? 'Update' : 'Create'}
        isLoading={false}
      >
        <HostelForm hostel={editingHostel} onChange={setEditingHostel} />
      </FormModal>

      <FormModal
        isOpen={isAssignmentModalOpen}
        title={editingAssignment?.id ? 'Edit Assignment' : 'Add Assignment'}
        onClose={() => {
          setIsAssignmentModalOpen(false);
          setEditingAssignment(null);
        }}
        onSubmit={() => editingAssignment && handleSaveAssignment(editingAssignment)}
        submitText={editingAssignment?.id ? 'Update' : 'Create'}
        isLoading={false}
      >
        <AssignmentForm assignment={editingAssignment} onChange={setEditingAssignment} hostels={hostels} />
      </FormModal>
    </div>
  );
}

function HostelForm({ hostel, onChange }: any) {
  const [formData, setFormData] = useState<Partial<Hostel>>(
    hostel || {
      name: '',
      description: '',
      location: '',
      total_rooms: 0,
      capacity: 0,
      warden_name: '',
      warden_phone: '',
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
        <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Total Rooms</label>
          <input
            type="number"
            value={formData.total_rooms}
            onChange={(e) => setFormData({ ...formData, total_rooms: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Capacity</label>
          <input
            type="number"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Warden Name</label>
        <input
          type="text"
          value={formData.warden_name}
          onChange={(e) => setFormData({ ...formData, warden_name: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Warden Phone</label>
        <input
          type="text"
          value={formData.warden_phone}
          onChange={(e) => setFormData({ ...formData, warden_phone: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}

function AssignmentForm({ assignment, onChange, hostels }: any) {
  const [formData, setFormData] = useState<Partial<HostelAssignment>>(
    assignment || {
      hostel_id: 0,
      student_id: undefined,
      teacher_id: undefined,
      room_number: '',
      bed_number: '',
      assignment_date: '',
      checkout_date: '',
      is_active: true,
    }
  );

  useEffect(() => {
    onChange(formData);
  }, [formData]);

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Hostel</label>
        <select
          value={formData.hostel_id}
          onChange={(e) => setFormData({ ...formData, hostel_id: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select a hostel</option>
          {hostels.map((hostel: Hostel) => (
            <option key={hostel.id} value={hostel.id}>{hostel.name}</option>
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
          <label className="mb-1 block text-sm font-medium text-slate-700">Room Number</label>
          <input
            type="text"
            value={formData.room_number || ''}
            onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Bed Number</label>
          <input
            type="text"
            value={formData.bed_number || ''}
            onChange={(e) => setFormData({ ...formData, bed_number: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Assignment Date</label>
          <input
            type="date"
            value={formData.assignment_date || ''}
            onChange={(e) => setFormData({ ...formData, assignment_date: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Checkout Date</label>
          <input
            type="date"
            value={formData.checkout_date || ''}
            onChange={(e) => setFormData({ ...formData, checkout_date: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
