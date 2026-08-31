import { useState, useEffect } from 'react';
import { attendanceService } from '../services/attendanceService';
import { studentService } from '../services/studentService';
import { classService, type Class } from '../services/classService';
import type { Attendance, Student } from '../types';

type StatusType = 'present' | 'absent' | 'late' | 'excused';

const STATUS_META: Record<StatusType, { label: string; color: string; bg: string }> = {
  present:  { label: 'Present',  color: 'text-emerald-800', bg: 'bg-emerald-100' },
  absent:   { label: 'Absent',   color: 'text-rose-700',    bg: 'bg-rose-100'    },
  late:     { label: 'Late',     color: 'text-amber-800',   bg: 'bg-amber-100'   },
  excused:  { label: 'Excused',  color: 'text-slate-600',   bg: 'bg-slate-100'   },
};

// ── Take Attendance Modal ─────────────────────────────────────────────────────
function TakeAttendanceModal({
  classes, onClose, onSaved,
}: {
  classes: Class[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [classId, setClassId]     = useState('');
  const [date, setDate]           = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents]   = useState<Student[]>([]);
  const [statuses, setStatuses]   = useState<Record<number, StatusType>>({});
  const [remarks, setRemarks]     = useState<Record<number, string>>({});
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [step, setStep]           = useState<'select' | 'mark'>('select');

  const loadStudents = async () => {
    if (!classId) { setError('Please select a class.'); return; }
    setLoading(true); setError('');
    try {
      const res = await studentService.getAll();
      const filtered = (res.data || []).filter((s: Student) => s.class_id === Number(classId));
      if (filtered.length === 0) { setError('No students found in this class.'); setLoading(false); return; }
      setStudents(filtered);
      // Default everyone to present
      const defaultStatuses: Record<number, StatusType> = {};
      filtered.forEach((s: Student) => { defaultStatuses[s.id] = 'present'; });
      setStatuses(defaultStatuses);
      setRemarks({});
      setStep('mark');
    } catch { setError('Failed to load students.'); }
    finally { setLoading(false); }
  };

  const markAll = (status: StatusType) => {
    const updated: Record<number, StatusType> = {};
    students.forEach((s) => { updated[s.id] = status; });
    setStatuses(updated);
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const payload = students.map((s) => ({
        student_id: s.id,
        class_id:   Number(classId),
        date,
        status:     statuses[s.id] || 'present',
        remarks:    remarks[s.id] || undefined,
      }));
      await attendanceService.createBulk(payload);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save attendance.');
    } finally { setSaving(false); }
  };

  const counts = {
    present: students.filter((s) => statuses[s.id] === 'present').length,
    absent:  students.filter((s) => statuses[s.id] === 'absent').length,
    late:    students.filter((s) => statuses[s.id] === 'late').length,
    excused: students.filter((s) => statuses[s.id] === 'excused').length,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-8">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Academic</p>
            <h2 className="text-lg font-bold text-slate-950">Take Attendance</h2>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 text-xl">×</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

          {step === 'select' ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Class <span className="text-rose-500">*</span></label>
                  <select value={classId} onChange={(e) => setClassId(e.target.value)} className="input-field">
                    <option value="">Select a class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Date <span className="text-rose-500">*</span></label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field" />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button onClick={loadStudents} disabled={!classId || loading}
                  className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50">
                  {loading ? 'Loading students…' : 'Load students →'}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Summary bar */}
              <div className="flex flex-wrap gap-2">
                {(Object.entries(counts) as [StatusType, number][]).map(([s, n]) => (
                  <span key={s} className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_META[s].bg} ${STATUS_META[s].color}`}>
                    {STATUS_META[s].label}: {n}
                  </span>
                ))}
              </div>

              {/* Mark all row */}
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="text-xs font-semibold text-slate-600">Mark all:</span>
                {(['present', 'absent', 'late', 'excused'] as StatusType[]).map((s) => (
                  <button key={s} onClick={() => markAll(s)}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold ${STATUS_META[s].bg} ${STATUS_META[s].color} hover:opacity-80`}>
                    {STATUS_META[s].label}
                  </button>
                ))}
              </div>

              {/* Student rows */}
              <div className="max-h-[340px] overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                {students.map((student, idx) => {
                  const status = statuses[student.id] || 'present';
                  const sm = STATUS_META[status];
                  return (
                    <div key={student.id} className={`flex items-center gap-3 px-4 py-3 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                      {/* Avatar */}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                        {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
                      </div>
                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-xs text-slate-400">{(student as any).user?.user_code || student.student_id}</p>
                      </div>
                      {/* Status selector */}
                      <select
                        value={status}
                        onChange={(e) => setStatuses({ ...statuses, [student.id]: e.target.value as StatusType })}
                        className={`rounded-lg border-0 px-2 py-1.5 text-xs font-semibold ${sm.bg} ${sm.color} focus:outline-none focus:ring-1 focus:ring-offset-1`}
                      >
                        {(['present', 'absent', 'late', 'excused'] as StatusType[]).map((s) => (
                          <option key={s} value={s}>{STATUS_META[s].label}</option>
                        ))}
                      </select>
                      {/* Remarks input */}
                      <input
                        value={remarks[student.id] || ''}
                        onChange={(e) => setRemarks({ ...remarks, [student.id]: e.target.value })}
                        className="w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-xs placeholder:text-slate-300 focus:border-cyan-400 focus:outline-none"
                        placeholder="Remarks…"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-1">
                <button onClick={() => setStep('select')} className="text-xs font-semibold text-slate-500 hover:underline">
                  ← Change class / date
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50">
                  {saving ? 'Saving…' : `✓ Save attendance (${students.length} students)`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Attendance() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [classes, setClasses]       = useState<Class[]>([]);
  const [loading, setLoading]       = useState(true);
  const [syncing, setSyncing]       = useState(false);
  const [syncMsg, setSyncMsg]       = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterClass, setFilterClass]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal]       = useState(false);

  useEffect(() => { loadClasses(); }, []);
  useEffect(() => { loadAttendance(); }, [selectedDate, filterClass, filterStatus]);

  const loadClasses = async () => {
    try {
      const res = await classService.getAll();
      setClasses((res as unknown as Class[]) || []);
    } catch { /* silent */ }
  };

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { date_from: selectedDate, date_to: selectedDate };
      if (filterClass)  params.class_id = filterClass;
      if (filterStatus) params.status   = filterStatus;
      const res = await attendanceService.getAll(params);
      setAttendance(res.data || []);
    } catch {
      setAttendance([]);
    } finally { setLoading(false); }
  };

  const handleSync = async () => {
    setSyncing(true); setSyncMsg('');
    try {
      // Re-fetch from backend — this is what "sync" means in this context
      await loadAttendance();
      setSyncMsg('Synced successfully.');
    } catch { setSyncMsg('Sync failed. Check your connection.'); }
    finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(''), 3000);
    }
  };

  const handleStatusChange = async (record: Attendance, status: StatusType) => {
    try {
      await attendanceService.update(record.id, {
        student_id: (record as any).student_id,
        class_id:   (record as any).class_id,
        date:       (record as any).date,
        status,
      } as any);
      setAttendance((prev) =>
        prev.map((r) => r.id === record.id ? { ...r, status } : r)
      );
    } catch { /* silent — reload on error */ loadAttendance(); }
  };

  const handleDeleteRecord = async (id: number) => {
    if (!confirm('Remove this attendance record?')) return;
    try {
      await attendanceService.delete(id);
      setAttendance((prev) => prev.filter((r) => r.id !== id));
    } catch { setAttendance((prev) => prev); }
  };

  // Summary counts for selected day
  const counts = {
    present: attendance.filter((r) => r.status === 'present').length,
    absent:  attendance.filter((r) => r.status === 'absent').length,
    late:    attendance.filter((r) => r.status === 'late').length,
    excused: attendance.filter((r) => r.status === 'excused').length,
  };

  return (
    <div className="space-y-5">
      {showModal && (
        <TakeAttendanceModal
          classes={classes}
          onClose={() => setShowModal(false)}
          onSaved={loadAttendance}
        />
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Academic</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">Attendance</h1>
          <p className="mt-1 text-sm text-slate-500">Record and review daily student attendance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleSync} disabled={syncing}
            className="rounded-lg border border-slate-300 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            {syncing ? '↻ Syncing…' : '↻ Sync'}
          </button>
          <button onClick={() => setShowModal(true)}
            className="rounded-lg bg-slate-950 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-cyan-700">
            📋 Take Attendance
          </button>
        </div>
      </div>

      {syncMsg && (
        <p className={`rounded-lg px-4 py-2.5 text-sm font-medium ${
          syncMsg.includes('failed') ? 'border border-rose-200 bg-rose-50 text-rose-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-800'
        }`}>{syncMsg}</p>
      )}

      {/* Summary cards */}
      {attendance.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(Object.entries(counts) as [StatusType, number][]).map(([s, n]) => (
            <div key={s} className={`rounded-xl border p-4 text-center ${STATUS_META[s].bg}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide ${STATUS_META[s].color}`}>{STATUS_META[s].label}</p>
              <p className={`mt-1 text-2xl font-bold ${STATUS_META[s].color}`}>{n}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
          <input type="date" value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input-field w-auto flex-1 sm:flex-none" />
          <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}
            className="input-field w-auto flex-1 sm:flex-none">
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field w-auto flex-1 sm:flex-none">
            <option value="">All statuses</option>
            {(['present', 'absent', 'late', 'excused'] as StatusType[]).map((s) => (
              <option key={s} value={s}>{STATUS_META[s].label}</option>
            ))}
          </select>
          <span className="ml-auto text-xs text-slate-400">{attendance.length} record{attendance.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-slate-500">Loading attendance…</p>
        ) : attendance.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-3xl mb-3">📋</p>
            <p className="text-sm font-semibold text-slate-700">No records for {selectedDate}</p>
            <p className="text-xs text-slate-400 mt-1">Click <strong>Take Attendance</strong> to mark attendance for a class.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[700px] divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 sm:px-5 py-3 text-left">Student</th>
                  <th className="px-3 sm:px-5 py-3 text-left hidden sm:table-cell">Class</th>
                  <th className="px-3 sm:px-5 py-3 text-left hidden md:table-cell">Date</th>
                  <th className="px-3 sm:px-5 py-3 text-left">Status</th>
                  <th className="px-3 sm:px-5 py-3 text-left hidden md:table-cell">Remarks</th>
                  <th className="px-3 sm:px-5 py-3 text-left">Change status</th>
                  <th className="px-3 sm:px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance.map((record) => {
                  const status = (record.status as StatusType) || 'present';
                  const sm = STATUS_META[status] || STATUS_META.present;
                  return (
                    <tr key={record.id} className="hover:bg-slate-50">
                      <td className="px-3 sm:px-5 py-3 font-semibold text-slate-900">
                        {record.student?.first_name} {record.student?.last_name}
                      </td>
                      <td className="px-3 sm:px-5 py-3 text-slate-600 hidden sm:table-cell">
                        {(record as any).class?.name || '—'}
                      </td>
                      <td className="px-3 sm:px-5 py-3 text-slate-600 hidden md:table-cell">
                        {(record as any).date || selectedDate}
                      </td>
                      <td className="px-3 sm:px-5 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${sm.bg} ${sm.color}`}>
                          {sm.label}
                        </span>
                      </td>
                      <td className="px-3 sm:px-5 py-3 text-slate-600 hidden md:table-cell">
                        {(record as any).remarks || '—'}
                      </td>
                      <td className="px-3 sm:px-5 py-3">
                        <select
                          value={status}
                          onChange={(e) => handleStatusChange(record, e.target.value as StatusType)}
                          className={`rounded-lg border-0 px-2 py-1.5 text-xs font-semibold ${sm.bg} ${sm.color} focus:outline-none focus:ring-1 focus:ring-offset-1`}
                        >
                          {(['present', 'absent', 'late', 'excused'] as StatusType[]).map((s) => (
                            <option key={s} value={s}>{STATUS_META[s].label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 sm:px-5 py-3">
                        <button
                          onClick={() => handleDeleteRecord(record.id)}
                          className="text-xs font-semibold text-rose-600 hover:underline whitespace-nowrap"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
