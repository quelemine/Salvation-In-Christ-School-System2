import { useState, useEffect } from 'react';
import api from '../services/api';

export default function StudentProfile() {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadStudentProfile();
  }, []);

  const loadStudentProfile = async () => {
    try {
      const response = await api.get('/students/me');
      setStudent(response.data);
    } catch (error: any) {
      console.error('Failed to load student profile:', error);
      setMsg({ ok: false, text: error.response?.data?.message || 'Failed to load profile data. Please contact the administrator.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMsg({ ok: false, text: 'New passwords do not match.' });
      return;
    }

    if (newPassword.length < 6) {
      setMsg({ ok: false, text: 'Password must be at least 6 characters.' });
      return;
    }

    setSaving(true);
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setMsg({ ok: true, text: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setMsg({ ok: false, text: error.response?.data?.message || 'Failed to change password.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="py-12 text-center text-sm text-slate-500">Loading profile…</p>;
  }

  if (!student) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-slate-500">Profile not found.</p>
        {msg && <p className="mt-2 text-xs text-rose-600">{msg.text}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">My Profile</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Student Information</h1>
        <p className="mt-1 text-sm text-slate-500">View and manage your personal information.</p>
      </div>

      {msg && (
        <div className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm font-medium ${
          msg.ok ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                 : 'border border-rose-200 bg-rose-50 text-rose-700'
        }`}>
          <span className="mt-0.5 shrink-0">{msg.ok ? '✓' : '⚠'}</span>
          {msg.text}
        </div>
      )}

      {/* Profile Information */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Personal Information</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <p className="text-sm text-slate-900">{student.first_name} {student.last_name}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Student ID</label>
            <p className="text-sm text-slate-900 font-mono">{student.student_id || student.user?.user_code}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
            <p className="text-sm text-slate-900">{student.user?.username}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
            <p className="text-sm text-slate-900">{student.user?.email || '—'}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
            <p className="text-sm text-slate-900 capitalize">{student.gender || '—'}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
            <p className="text-sm text-slate-900">{student.date_of_birth?.split('T')[0] || '—'}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nationality</label>
            <p className="text-sm text-slate-900">{student.nationality || '—'}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">County</label>
            <p className="text-sm text-slate-900">{student.county || '—'}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Grade Applying For</label>
            <p className="text-sm text-slate-900">{student.grade_applying_for || '—'}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Class</label>
            <p className="text-sm text-slate-900">{student.class?.name || '—'}</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
            <p className="text-sm text-slate-900">{student.address || '—'}</p>
          </div>
        </div>
      </div>

      {/* Parent/Guardian Information */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Parent/Guardian Information</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Father's Name</label>
            <p className="text-sm text-slate-900">{student.father_name || '—'}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mother's Name</label>
            <p className="text-sm text-slate-900">{student.mother_name || '—'}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Father's Contact</label>
            <p className="text-sm text-slate-900">{student.father_contact || '—'}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mother's Contact</label>
            <p className="text-sm text-slate-900">{student.mother_contact || '—'}</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Address</label>
            <p className="text-sm text-slate-900">{student.parent_address || '—'}</p>
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Emergency Contact</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Name</label>
            <p className="text-sm text-slate-900">{student.emergency_contact_name || '—'}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Phone</label>
            <p className="text-sm text-slate-900">{student.emergency_contact_phone || '—'}</p>
          </div>
        </div>
      </div>

      {/* Login Credentials */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Login Credentials</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
            <p className="text-sm text-slate-900 font-mono">{student.user?.username || '—'}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Default Password</label>
            <p className="text-sm text-slate-900 font-mono">{student.default_password || '—'}</p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50"
          >
            {saving ? 'Changing password…' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
