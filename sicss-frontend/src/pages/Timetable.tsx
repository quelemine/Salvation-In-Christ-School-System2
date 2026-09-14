import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { timetableService, type Timetable } from '../services/timetableService';
import { Button, Card, CardContent, LoadingState } from '../components/ui';
import { FormModal } from '../components/FormModal';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Timetable() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingTimetable, setEditingTimetable] = useState<Timetable | null>(null);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [academicYear, setAcademicYear] = useState<string>('2024-2025');

  useEffect(() => {
    loadTimetables();
  }, [selectedDay, academicYear]);

  const loadTimetables = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = { academic_year: academicYear };
      if (selectedDay !== 'all') {
        params.day_of_week = selectedDay;
      }
      const data = await timetableService.getAll(params);
      setTimetables(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load timetable.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (timetableData: Omit<Timetable, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingTimetable?.id) {
        await timetableService.update(editingTimetable.id, timetableData);
      } else {
        await timetableService.create(timetableData);
      }
      await loadTimetables();
      setIsOpen(false);
      setEditingTimetable(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save timetable entry.');
    }
  };

  const handleEdit = (timetable: Timetable) => {
    setEditingTimetable(timetable);
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this timetable entry?')) return;
    try {
      await timetableService.delete(id);
      await loadTimetables();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete timetable entry.');
    }
  };

  const getTimetablesByDay = (day: string) => {
    return timetables.filter(t => t.day_of_week === day);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Timetable & Schedule</h1>
        <p className="mt-2 text-slate-600">Manage class schedules and teacher assignments</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-sm font-medium text-slate-700">Academic Year</label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="2024-2025">2024-2025</option>
              <option value="2025-2026">2025-2026</option>
              <option value="2026-2027">2026-2027</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-sm font-medium text-slate-700">Filter by Day</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Days</option>
              {DAYS.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
          {isAdmin && (
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setEditingTimetable(null);
                  setIsOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold shadow-md"
              >
                + Add Schedule
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm">
          <p className="text-sm text-rose-800 mb-4">{error}</p>
          <Button onClick={loadTimetables} className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold">
            Try Again
          </Button>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 shadow-sm">
          <LoadingState message="Loading timetable..." />
        </div>
      ) : (
        <div className="space-y-4">
          {selectedDay !== 'all' ? (
            <TimetableDayView
              day={selectedDay}
              entries={getTimetablesByDay(selectedDay)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isAdmin={isAdmin}
            />
          ) : (
            DAYS.map(day => (
              <TimetableDayView
                key={day}
                day={day}
                entries={getTimetablesByDay(day)}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isAdmin={isAdmin}
              />
            ))
          )}
        </div>
      )}

      <FormModal
        isOpen={isOpen}
        title={editingTimetable?.id ? 'Edit Schedule' : 'Add Schedule'}
        onClose={() => {
          setIsOpen(false);
          setEditingTimetable(null);
        }}
        onSubmit={() => editingTimetable && handleSave(editingTimetable)}
        submitText={editingTimetable?.id ? 'Update' : 'Create'}
        isLoading={false}
      >
        <TimetableForm timetable={editingTimetable} academicYear={academicYear} onChange={setEditingTimetable} />
      </FormModal>
    </div>
  );
}

function TimetableDayView({ day, entries, onEdit, onDelete, isAdmin }: any) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-4">{day}</h3>
        {entries.length === 0 ? (
          <p className="text-slate-500 text-center py-4">No scheduled classes for this day</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry: Timetable) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {entry.start_time} - {entry.end_time}
                    </span>
                    <span className="text-sm font-medium text-slate-900">
                      {entry.room_name || 'Room TBD'}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    <span className="font-medium">Subject:</span> {entry.subject_id || 'TBD'} | 
                    <span className="font-medium ml-2">Teacher:</span> {entry.teacher_id || 'TBD'}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={() => onEdit(entry)}
                      className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold border border-slate-300 px-3 py-1"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => entry.id && onDelete(entry.id)}
                      className="bg-red-100 hover:bg-red-200 active:bg-red-300 text-red-700 font-semibold border border-red-300 px-3 py-1"
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TimetableForm({ timetable, academicYear, onChange }: any) {
  const [formData, setFormData] = useState<Partial<Timetable>>(
    timetable || {
      day_of_week: 'Monday',
      start_time: '',
      end_time: '',
      room_name: '',
      is_active: true,
      academic_year: academicYear,
    }
  );

  useEffect(() => {
    onChange(formData);
  }, [formData]);

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Day of Week</label>
        <select
          value={formData.day_of_week}
          onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          {DAYS.map(day => (
            <option key={day} value={day}>{day}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Start Time</label>
          <input
            type="time"
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">End Time</label>
          <input
            type="time"
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Room Name</label>
        <input
          type="text"
          value={formData.room_name}
          onChange={(e) => setFormData({ ...formData, room_name: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Room 101, Science Lab"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Academic Year</label>
        <input
          type="text"
          value={formData.academic_year}
          onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          className="rounded border-slate-300"
        />
        <label htmlFor="is_active" className="text-sm font-medium text-slate-700">Active</label>
      </div>
    </div>
  );
}
