import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { medicalRecordService, type MedicalRecord } from '../services/medicalRecordService';
import { Button, Card, CardContent, LoadingState } from '../components/ui';
import { FormModal } from '../components/FormModal';

export default function MedicalRecords() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'student' | 'teacher'>('all');
  const [filterId, setFilterId] = useState<string>('');

  useEffect(() => {
    loadRecords();
  }, [filterType, filterId]);

  const loadRecords = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {};
      if (filterType !== 'all' && filterId) {
        params[`${filterType}_id`] = parseInt(filterId);
      }
      const data = await medicalRecordService.getAll(params);
      setRecords(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load medical records.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (recordData: Omit<MedicalRecord, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingRecord?.id) {
        await medicalRecordService.update(editingRecord.id, recordData);
      } else {
        await medicalRecordService.create(recordData);
      }
      await loadRecords();
      setIsOpen(false);
      setEditingRecord(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save medical record.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this medical record?')) return;
    try {
      await medicalRecordService.delete(id);
      await loadRecords();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete medical record.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Health/Medical Records</h1>
        <p className="mt-2 text-slate-600">Track health information for students and teachers</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-sm font-medium text-slate-700">Filter By</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'student' | 'teacher')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Records</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
          {filterType !== 'all' && (
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-sm font-medium text-slate-700">ID</label>
              <input
                type="number"
                value={filterId}
                onChange={(e) => setFilterId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter ID"
              />
            </div>
          )}
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
          <LoadingState message="Loading medical records..." />
        </div>
      ) : (
        <div className="space-y-4">
          {records.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">No medical records found for the selected criteria.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <Card key={record.id} className={`shadow-sm ${record.is_confidential ? 'border-l-4 border-l-red-500' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {record.condition || 'Medical Record'}
                          </h3>
                          {record.is_confidential && (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                              Confidential
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-slate-600 mb-2">
                          {record.student_id && <span className="mr-4">Student ID: {record.student_id}</span>}
                          {record.teacher_id && <span className="mr-4">Teacher ID: {record.teacher_id}</span>}
                          {record.record_date && <span className="mr-4">Date: {new Date(record.record_date).toLocaleDateString()}</span>}
                        </div>
                        {record.symptoms && (
                          <p className="text-sm text-slate-600 mb-1"><span className="font-medium">Symptoms:</span> {record.symptoms}</p>
                        )}
                        {record.diagnosis && (
                          <p className="text-sm text-slate-600 mb-1"><span className="font-medium">Diagnosis:</span> {record.diagnosis}</p>
                        )}
                        {record.treatment && (
                          <p className="text-sm text-slate-600 mb-1"><span className="font-medium">Treatment:</span> {record.treatment}</p>
                        )}
                        {record.medication && (
                          <p className="text-sm text-slate-600 mb-1">
                            <span className="font-medium">Medication:</span> {record.medication}
                            {record.dosage && ` (${record.dosage})`}
                          </p>
                        )}
                        {record.prescription_date && (
                          <p className="text-xs text-slate-500 mt-2">
                            Prescription Date: {new Date(record.prescription_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setEditingRecord(record);
                              setIsOpen(true);
                            }}
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
              ))}
            </div>
          )}
        </div>
      )}

      <FormModal
        isOpen={isOpen}
        title={editingRecord?.id ? 'Edit Medical Record' : 'Add Medical Record'}
        onClose={() => {
          setIsOpen(false);
          setEditingRecord(null);
        }}
        onSubmit={() => editingRecord && handleSave(editingRecord)}
        submitText={editingRecord?.id ? 'Update' : 'Create'}
        isLoading={false}
      >
        <MedicalRecordForm record={editingRecord} onChange={setEditingRecord} />
      </FormModal>
    </div>
  );
}

function MedicalRecordForm({ record, onChange }: any) {
  const [formData, setFormData] = useState<Partial<MedicalRecord>>(
    record || {
      student_id: undefined,
      teacher_id: undefined,
      record_date: '',
      condition: '',
      symptoms: '',
      diagnosis: '',
      treatment: '',
      medication: '',
      dosage: '',
      prescription_date: '',
      is_confidential: false,
      notes: '',
    }
  );

  useEffect(() => {
    onChange(formData);
  }, [formData]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
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
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Record Date</label>
          <input
            type="date"
            value={formData.record_date || ''}
            onChange={(e) => setFormData({ ...formData, record_date: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Condition</label>
          <input
            type="text"
            value={formData.condition}
            onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Symptoms</label>
        <textarea
          value={formData.symptoms}
          onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Diagnosis</label>
        <textarea
          value={formData.diagnosis}
          onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Treatment</label>
        <textarea
          value={formData.treatment}
          onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Medication</label>
          <input
            type="text"
            value={formData.medication}
            onChange={(e) => setFormData({ ...formData, medication: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Dosage</label>
          <input
            type="text"
            value={formData.dosage}
            onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Prescription Date</label>
        <input
          type="date"
          value={formData.prescription_date || ''}
          onChange={(e) => setFormData({ ...formData, prescription_date: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={formData.is_confidential}
          onChange={(e) => setFormData({ ...formData, is_confidential: e.target.checked })}
          className="rounded border-slate-300"
        />
        Confidential Record
      </label>
    </div>
  );
}
