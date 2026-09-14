import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { academicCalendarService, type AcademicCalendar } from '../services/academicCalendarService';
import { Button, Card, CardContent, LoadingState } from '../components/ui';
import { FormModal } from '../components/FormModal';

export default function AcademicCalendar() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';
  const [events, setEvents] = useState<AcademicCalendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AcademicCalendar | null>(null);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [academicYear, setAcademicYear] = useState<string>('2024-2025');

  useEffect(() => {
    loadEvents();
  }, [filterType, academicYear]);

  const loadEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = { academic_year: academicYear };
      if (filterType !== 'all') {
        params.type = filterType;
      }
      const data = await academicCalendarService.getAll(params);
      setEvents(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load calendar events.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (eventData: Omit<AcademicCalendar, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingEvent?.id) {
        await academicCalendarService.update(editingEvent.id, eventData);
      } else {
        await academicCalendarService.create(eventData);
      }
      await loadEvents();
      setIsOpen(false);
      setEditingEvent(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save event.');
    }
  };

  const handleEdit = (event: AcademicCalendar) => {
    setEditingEvent(event);
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await academicCalendarService.delete(id);
      await loadEvents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete event.');
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      term: 'bg-blue-100 text-blue-800 border-blue-200',
      holiday: 'bg-green-100 text-green-800 border-green-200',
      event: 'bg-purple-100 text-purple-800 border-purple-200',
      exam: 'bg-red-100 text-red-800 border-red-200',
      break: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Academic Calendar</h1>
        <p className="mt-2 text-slate-600">Manage terms, holidays, events, and exams</p>
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
            <label className="mb-1 block text-sm font-medium text-slate-700">Filter by Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="term">Terms</option>
              <option value="holiday">Holidays</option>
              <option value="event">Events</option>
              <option value="exam">Exams</option>
              <option value="break">Breaks</option>
            </select>
          </div>
          {isAdmin && (
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setEditingEvent(null);
                  setIsOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold shadow-md"
              >
                + Add Event
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm">
          <p className="text-sm text-rose-800 mb-4">{error}</p>
          <Button onClick={loadEvents} className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold">
            Try Again
          </Button>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 shadow-sm">
          <LoadingState message="Loading calendar events..." />
        </div>
      ) : (
        <div className="space-y-4">
          {events.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">No calendar events found for the selected criteria.</p>
              </CardContent>
            </Card>
          ) : (
            events.map((event) => (
              <Card key={event.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getTypeColor(event.type)}`}>
                          {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                        </span>
                        {!event.is_active && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300">
                            Inactive
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-1">{event.title}</h3>
                      {event.description && (
                        <p className="text-slate-600 mb-3">{event.description}</p>
                      )}
                      <div className="flex gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          📅 {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          🎓 {event.academic_year}
                        </span>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          onClick={() => handleEdit(event)}
                          className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold border border-slate-300 px-3 py-1"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => event.id && handleDelete(event.id)}
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
        title={editingEvent?.id ? 'Edit Event' : 'Add Event'}
        onClose={() => {
          setIsOpen(false);
          setEditingEvent(null);
        }}
        onSubmit={() => editingEvent && handleSave(editingEvent)}
        submitText={editingEvent?.id ? 'Update' : 'Create'}
        isLoading={false}
      >
        <AcademicCalendarForm
          event={editingEvent}
          academicYear={academicYear}
          onChange={setEditingEvent}
        />
      </FormModal>
    </div>
  );
}

function AcademicCalendarForm({ event, academicYear, onChange }: any) {
  const [formData, setFormData] = useState<Partial<AcademicCalendar>>(
    event || {
      title: '',
      description: '',
      type: 'event',
      start_date: '',
      end_date: '',
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
        <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="term">Term</option>
          <option value="holiday">Holiday</option>
          <option value="event">Event</option>
          <option value="exam">Exam</option>
          <option value="break">Break</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Start Date</label>
          <input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">End Date</label>
          <input
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
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
