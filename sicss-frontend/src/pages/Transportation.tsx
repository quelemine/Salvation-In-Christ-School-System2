import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { transportationVehicleService, type TransportationVehicle } from '../services/transportationVehicleService';
import { transportationAssignmentService, type TransportationAssignment } from '../services/transportationAssignmentService';
import { Button, Card, CardContent, LoadingState } from '../components/ui';
import { FormModal } from '../components/FormModal';

export default function Transportation() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';
  const [vehicles, setVehicles] = useState<TransportationVehicle[]>([]);
  const [assignments, setAssignments] = useState<TransportationAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'vehicles' | 'assignments'>('vehicles');
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<TransportationVehicle | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<TransportationAssignment | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeTab === 'vehicles') {
      loadVehicles();
    } else {
      loadAssignments();
    }
  }, [activeTab]);

  const loadVehicles = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await transportationVehicleService.getAll();
      setVehicles(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load vehicles.');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await transportationAssignmentService.getAll();
      setAssignments(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVehicle = async (vehicleData: Omit<TransportationVehicle, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingVehicle?.id) {
        await transportationVehicleService.update(editingVehicle.id, vehicleData);
      } else {
        await transportationVehicleService.create(vehicleData);
      }
      await loadVehicles();
      setIsVehicleModalOpen(false);
      setEditingVehicle(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save vehicle.');
    }
  };

  const handleDeleteVehicle = async (id: number) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await transportationVehicleService.delete(id);
      await loadVehicles();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete vehicle.');
    }
  };

  const handleSaveAssignment = async (assignmentData: Omit<TransportationAssignment, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingAssignment?.id) {
        await transportationAssignmentService.update(editingAssignment.id, assignmentData);
      } else {
        await transportationAssignmentService.create(assignmentData);
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
      await transportationAssignmentService.delete(id);
      await loadAssignments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete assignment.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Transportation Management</h1>
        <p className="mt-2 text-slate-600">Manage vehicles and transportation assignments</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          onClick={() => setActiveTab('vehicles')}
          className={activeTab === 'vehicles' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}
        >
          Vehicles ({vehicles.length})
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
          <Button onClick={activeTab === 'vehicles' ? loadVehicles : loadAssignments} className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold">
            Try Again
          </Button>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 shadow-sm">
          <LoadingState message="Loading transportation data..." />
        </div>
      ) : activeTab === 'vehicles' ? (
        <div className="space-y-4">
          {isAdmin && (
            <Button
              onClick={() => {
                setEditingVehicle(null);
                setIsVehicleModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold shadow-md"
            >
              + Add Vehicle
            </Button>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((vehicle) => (
              <Card key={vehicle.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-slate-900">{vehicle.vehicle_number}</h3>
                    {!vehicle.is_active && (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{vehicle.vehicle_type}</p>
                  <p className="text-xs text-slate-500 mb-3">Capacity: {vehicle.capacity}</p>
                  {vehicle.route && (
                    <span className="inline-block px-2 py-1 rounded text-xs bg-slate-100 text-slate-700 mb-3">
                      {vehicle.route}
                    </span>
                  )}
                  <div className="space-y-1 text-sm text-slate-600">
                    <p><span className="font-medium">Driver:</span> {vehicle.driver_name}</p>
                    <p><span className="font-medium">Phone:</span> {vehicle.driver_phone}</p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => {
                          setEditingVehicle(vehicle);
                          setIsVehicleModalOpen(true);
                        }}
                        className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold border border-slate-300 px-2 py-1 text-xs"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => vehicle.id && handleDeleteVehicle(vehicle.id)}
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
                          Vehicle ID: {assignment.vehicle_id}
                        </span>
                        {assignment.student_id && (
                          <span className="text-sm text-slate-600">Student ID: {assignment.student_id}</span>
                        )}
                        {assignment.teacher_id && (
                          <span className="text-sm text-slate-600">Teacher ID: {assignment.teacher_id}</span>
                        )}
                      </div>
                      <div className="text-sm text-slate-600">
                        {assignment.pickup_location && (
                          <span className="mr-4"><span className="font-medium">Pickup:</span> {assignment.pickup_location}</span>
                        )}
                        {assignment.dropoff_location && (
                          <span className="mr-4"><span className="font-medium">Dropoff:</span> {assignment.dropoff_location}</span>
                        )}
                      </div>
                      {assignment.pickup_time && (
                        <div className="text-sm text-slate-600 mt-1">
                          <span className="font-medium">Pickup Time:</span> {assignment.pickup_time}
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
        isOpen={isVehicleModalOpen}
        title={editingVehicle?.id ? 'Edit Vehicle' : 'Add Vehicle'}
        onClose={() => {
          setIsVehicleModalOpen(false);
          setEditingVehicle(null);
        }}
        onSubmit={() => editingVehicle && handleSaveVehicle(editingVehicle)}
        submitText={editingVehicle?.id ? 'Update' : 'Create'}
        isLoading={false}
      >
        <VehicleForm vehicle={editingVehicle} onChange={setEditingVehicle} />
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
        <AssignmentForm assignment={editingAssignment} onChange={setEditingAssignment} vehicles={vehicles} />
      </FormModal>
    </div>
  );
}

function VehicleForm({ vehicle, onChange }: any) {
  const [formData, setFormData] = useState<Partial<TransportationVehicle>>(
    vehicle || {
      vehicle_number: '',
      vehicle_type: '',
      capacity: '',
      driver_name: '',
      driver_phone: '',
      route: '',
      description: '',
      is_active: true,
    }
  );

  useEffect(() => {
    onChange(formData);
  }, [formData]);

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Vehicle Number</label>
        <input
          type="text"
          value={formData.vehicle_number}
          onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Vehicle Type</label>
        <input
          type="text"
          value={formData.vehicle_type}
          onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Capacity</label>
        <input
          type="text"
          value={formData.capacity}
          onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Driver Name</label>
        <input
          type="text"
          value={formData.driver_name}
          onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Driver Phone</label>
        <input
          type="text"
          value={formData.driver_phone}
          onChange={(e) => setFormData({ ...formData, driver_phone: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Route</label>
        <input
          type="text"
          value={formData.route}
          onChange={(e) => setFormData({ ...formData, route: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
    </div>
  );
}

function AssignmentForm({ assignment, onChange, vehicles }: any) {
  const [formData, setFormData] = useState<Partial<TransportationAssignment>>(
    assignment || {
      vehicle_id: 0,
      student_id: undefined,
      teacher_id: undefined,
      pickup_location: '',
      dropoff_location: '',
      pickup_time: '',
      dropoff_time: '',
      is_active: true,
    }
  );

  useEffect(() => {
    onChange(formData);
  }, [formData]);

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Vehicle</label>
        <select
          value={formData.vehicle_id}
          onChange={(e) => setFormData({ ...formData, vehicle_id: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select a vehicle</option>
          {vehicles.map((vehicle: TransportationVehicle) => (
            <option key={vehicle.id} value={vehicle.id}>{vehicle.vehicle_number} - {vehicle.vehicle_type}</option>
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
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Pickup Location</label>
        <input
          type="text"
          value={formData.pickup_location || ''}
          onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Dropoff Location</label>
        <input
          type="text"
          value={formData.dropoff_location || ''}
          onChange={(e) => setFormData({ ...formData, dropoff_location: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Pickup Time</label>
          <input
            type="time"
            value={formData.pickup_time || ''}
            onChange={(e) => setFormData({ ...formData, pickup_time: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Dropoff Time</label>
          <input
            type="time"
            value={formData.dropoff_time || ''}
            onChange={(e) => setFormData({ ...formData, dropoff_time: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
