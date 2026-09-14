import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { disciplineRecordService, type DisciplineRecord } from '../services/disciplineRecordService';
import { Button, Card, CardContent, LoadingState } from '../components/ui';
import { FormModal } from '../components/FormModal';

export default function DisciplineRecords() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';
  const [records, setRecords] = useState<DisciplineRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DisciplineRecord | null>(null);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadRecords();
  }, [filterType, filterStatus]);

  const loadRecords = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {};
      if (filterType !== 'all') {
        params.type = filterType;
      }
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      const data = await disciplineRecordService.getAll(params);
      setRecords(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load discipline records.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (recordData: Omit<DisciplineRecord, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingRecord?.id) {
        await disciplineRecordService.update(editingRecord.id, recordData);
      } else {
        await disciplineRecordService.create(recordData);
      }
      await loadRecords();
      setIsOpen(false);
      setEditingRecord(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save record.');
    }
  };

  const handleEdit = (record: DisciplineRecord) => {
    setEditingRecord(record);
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      await disciplineRecordService.delete(id);
      await loadRecords();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete record.');
    }
  };

  const handleResolve = async (id: number) => {
    try {
      await disciplineRecordService.resolve(id);
      await loadRecords();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resolve record.');
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      suspension: 'bg-red-100 text-red-800 border-red-200',
      expulsion: 'bg-red-900 text-white border-red-950',
      merit: 'bg-green-100 text-green-800 border-green-200',
      commendation: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'bg-green-50 text-green-700',
      medium: 'bg-yellow-50 text-yellow-700',
      high: 'bg-orange-50 text-orange-700',
      critical: 'bg-red-50 text-red-700',
    };
    return colors[severity as keyof typeof colors] || 'bg-gray-50 text-gray-700';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-slate-100 text-slate-700',
      investigating: 'bg-blue-100 text-blue-700',
      resolved: 'bg-green-100 text-green-700',
      dismissed: 'bg-gray-100 text-gray-700',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Discipline & Behavior</h1>
        <p className="mt-2 text-slate-600">Track student behavior, warnings, and commendations</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-sm font-medium text-slate-700">Filter by Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="warning">Warnings</option>
              <option value="suspension">Suspensions</option>
              <option value="expulsion">Expulsions</option>
              <option value="merit">Merits</option>
              <option value="commendation">Commendations</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-sm font-medium text-slate-700">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>
          {isAdmin && (
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setEditingRecord(null);
                  setIsOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold shadow-md"
              >
                + Add Record
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm">
          <p className="text-sm text-rose-800 mb-4">{error}</p>
          <Button onClick={loadRecords} className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold">
            Try Again
          </Button>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 shadow-sm">
          <LoadingState message="Loading discipline records..." />
        </div>
      ) : (
        <div className="space-y-4">
          {records.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">No discipline records found for the selected criteria.</p>
              </CardContent>
            </Card>
          ) : (
            records.map((record) => (
              <Card key={record.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getTypeColor(record.type)}`}>
                          {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(record.severity)}`}>
                          {record.severity.charAt(0).toUpperCase() + record.severity.slice(1)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(record.status)}`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                        {record.is_resolved && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
                            Resolved
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-1">{record.title}</h3>
                      {record.description && (
                        <p className="text-slate-600 mb-3">{record.description}</p>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          📅 Incident: {new Date(record.incident_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          📝 Reported: {new Date(record.report_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          👤 Student ID: {record.student_id}
                        </span>
                      </div>
                      {record.action_taken && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm font-medium text-slate-700">Action Taken:</p>
                          <p className="text-sm text-slate-600">{record.action_taken}</p>
                        </div>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex flex-col gap-2 ml-4">
                        {!record.is_resolved && (
                          <Button
                            onClick={() => record.id && handleResolve(record.id)}
                            className="bg-green-100 hover:bg-green-200 active:bg-green-300 text-green-700 font-semibold border border-green-300 px-3 py-1"
                          >
                            Resolve
                          </Button>
                        )}
                        <Button
                          onClick={() => handleEdit(record)}
                          className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold border border-slate-300 px-3 py-1"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => record.id && handleDelete(record.id)}
                          className="bg-red-100 hover:bg-red-200 active:bg-red-300 text-red-700 font-semibold border border-red-300 px-3 py-1"
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      <FormModal
        isOpen={isOpen}
        title={editingRecord?.id ? 'Edit Record' : 'Add Record'}
        onClose={() => {
          setIsOpen(false);
          setEditingRecord(null);
        }}
        onSubmit={() => editingRecord && handleSave(editingRecord)}
        submitText={editingRecord?.id ? 'Update' : 'Create'}
        isLoading={false}
      >
        <DisciplineRecordForm record={editingRecord} onChange={setEditingRecord} />
      </FormModal>
    </div>
  );
}

function DisciplineRecordForm({ record, onChange }: any) {
  const [formData, setFormData] = useState<Partial<DisciplineRecord>>(
    record || {
      type: 'warning',
      title: '',
      description: '',
      incident_date: '',
      severity: 'medium',
      status: 'pending',
      is_resolved: false,
    }
  );

  useEffect(() => {
    onChange(formData);
  }, [formData]);

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Student ID</label>
        <input
          type="number"
          value={formData.student_id}
          onChange={(e) => setFormData({ ...formData, student_id: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="warning">Warning</option>
          <option value="suspension">Suspension</option>
          <option value="expulsion">Expulsion</option>
          <option value="merit">Merit</option>
          <option value="commendation">Commendation</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
        <label className="mb-1 block text-sm font-medium text-slate-700">Incident Date</label>
        <input
          type="date"
          value={formData.incident_date}
          onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Severity</label>
        <select
          value={formData.severity}
          onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="pending">Pending</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Action Taken</label>
        <textarea
          value={formData.action_taken}
          onChange={(e) => setFormData({ ...formData, action_taken: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
        />
      </div>
    </div>
  );
}
