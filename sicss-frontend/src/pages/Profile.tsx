import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { authService } from '../services/authService';

type Tab = 'overview' | 'edit' | 'password';

function StatusBadge({ ok, msg }: { ok: boolean; msg: string }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${
      ok ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
         : 'border border-rose-200 bg-rose-50 text-rose-700'
    }`}>
      <span>{ok ? '✓' : '✕'}</span>
      {msg}
    </div>
  );
}

function StudentRegistrationDetails({ profile, error }: { profile: any; error: string }) {
  if (error) return <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p>;
  if (!profile) return <p className="mt-5 text-sm text-slate-500">Loading registration information…</p>;

  const value = (item: any) => item === null || item === undefined || item === '' ? '—' : String(item);
  const date = (item: any) => item ? new Date(item).toLocaleDateString() : '—';
  const sections = [
    { title: 'Student registration details', fields: [
      ['Student ID', profile.student_id], ['Date of birth', date(profile.date_of_birth)], ['Gender', profile.gender],
      ['Place of birth', profile.place_of_birth], ['Nationality', profile.nationality], ['County', profile.county],
      ['Phone', profile.phone], ['Home address', profile.address],
    ] },
    { title: 'School information', fields: [
      ['Class', profile.class?.name], ['Previous school', profile.previous_school], ['Grade applying for', profile.grade_applying_for],
      ['Admission date', date(profile.admission_date)], ['Application status', profile.application_status], ['Registration number', profile.registration_number],
    ] },
    { title: 'Parent / guardian information', fields: [
      ['Guardian name', profile.parent_guardian_name], ['Guardian phone', profile.parent_guardian_phone], ['Guardian email', profile.parent_guardian_email],
      ['Father name', profile.father_name], ['Father occupation', profile.father_occupation], ['Father contact', profile.father_contact],
      ['Mother name', profile.mother_name], ['Mother occupation', profile.mother_occupation], ['Mother contact', profile.mother_contact],
      ['Parent address', profile.parent_address],
    ] },
    { title: 'Health and emergency information', fields: [
      ['Medical condition', profile.has_illness ? 'Yes' : 'No'], ['Medical details', profile.illness_details],
      ['Emergency contact', profile.emergency_contact_name], ['Emergency phone', profile.emergency_contact_phone],
      ['Sports interest', profile.sports_interest], ['Additional notes', profile.additional_notes],
    ] },
  ];

  return (
    <div className="mt-6 space-y-5 border-t border-slate-100 pt-6">
      {sections.map((section) => (
        <div key={section.title}>
          <h3 className="mb-3 text-sm font-bold text-slate-950">{section.title}</h3>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {section.fields.map(([label, item]) => (
              <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
                <dd className="mt-1 break-words text-sm font-semibold text-slate-800">{value(item)}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [tab, setTab] = useState<Tab>('overview');
  const isAdmin = user?.role?.slug === 'admin';
  const isStudent = user?.role?.slug === 'student';
  const isProfileReadOnly = !isAdmin;
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [studentProfileError, setStudentProfileError] = useState('');

  useEffect(() => {
    if (!isStudent) {
      setStudentProfile(null);
      setStudentProfileError('');
      return;
    }

    api.get('/student-portal/profile')
      .then((response) => setStudentProfile(response.data))
      .catch((error) => setStudentProfileError(error.response?.data?.message || 'Unable to load your registration information.'));
  }, [isStudent]);

  // Profile edit form — keep in sync with the stored user object
  const [editForm, setEditForm] = useState({
    first_name: user?.first_name || '',
    last_name:  user?.last_name  || '',
    email:      user?.email      || '',
    phone:      user?.phone      || '',
    address:    user?.address    || '',
  });

  // Re-populate form whenever the user object changes (e.g. after another update)
  useEffect(() => {
    setEditForm({
      first_name: user?.first_name || '',
      last_name:  user?.last_name  || '',
      email:      user?.email      || '',
      phone:      user?.phone      || '',
      address:    user?.address    || '',
    });
  }, [user?.first_name, user?.last_name, user?.email, user?.phone, user?.address]);
  const [editSaving, setEditSaving] = useState(false);
  const [editStatus, setEditStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  // Change password form
  const [pwForm, setPwForm] = useState({
    current_password:      '',
    password:              '',
    password_confirmation: '',
  });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwStatus, setPwStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Password strength
  const pw = pwForm.password;
  const strength = (() => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8)            s++;
    if (/[A-Z]/.test(pw))          s++;
    if (/[0-9]/.test(pw))          s++;
    if (/[^A-Za-z0-9]/.test(pw))   s++;
    return s;
  })();
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', 'bg-rose-400', 'bg-amber-400', 'bg-cyan-500', 'bg-emerald-500'][strength];

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditSaving(true); setEditStatus(null);
    try {
      const updated = await api.put('/profile', editForm);
      // Update the store with the fresh user data from the response
      updateUser(updated.data);
      // Also refresh from /auth/me to ensure phone/address/role are all loaded
      try {
        const fresh = await authService.me();
        updateUser(fresh);
      } catch { /* non-critical — response data already applied */ }
      setEditStatus({ ok: true, msg: 'Profile updated successfully.' });
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      const msg = errors
        ? Object.values(errors).flat().join(' ')
        : err.response?.data?.message || 'Failed to update profile. Please try again.';
      setEditStatus({ ok: false, msg });
    } finally { setEditSaving(false); }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.password !== pwForm.password_confirmation) {
      setPwStatus({ ok: false, msg: 'New passwords do not match.' }); return;
    }
    if (pwForm.password.length < 8) {
      setPwStatus({ ok: false, msg: 'Password must be at least 8 characters.' }); return;
    }
    setPwSaving(true); setPwStatus(null);
    try {
      await authService.changePassword(pwForm);
      setPwStatus({ ok: true, msg: 'Password changed successfully. Use your new password next time you log in.' });
      setPwForm({ current_password: '', password: '', password_confirmation: '' });
    } catch (err: any) {
      const msg = err.response?.data?.errors?.current_password?.[0]
                || err.response?.data?.message
                || 'Failed to change password.';
      setPwStatus({ ok: false, msg });
    } finally { setPwSaving(false); }
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview',        icon: '👤' },
    { key: 'edit',     label: 'Edit profile',    icon: '✏️' },
    { key: 'password', label: 'Change password', icon: '🔑' },
  ];

  const visibleTabs = isProfileReadOnly ? tabs.filter((tab) => tab.key !== 'edit') : tabs;
  const initials = `${user?.first_name?.charAt(0) || ''}${user?.last_name?.charAt(0) || ''}`.toUpperCase() || 'U';
  const roleColor = user?.role?.slug === 'admin' ? 'bg-rose-100 text-rose-800'
    : user?.role?.slug === 'teacher' ? 'bg-cyan-100 text-cyan-800'
    : user?.role?.slug?.includes('finance') ? 'bg-emerald-100 text-emerald-800'
    : 'bg-slate-100 text-slate-700';

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Account</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">My profile</h1>
      </div>

      {/* Profile card */}
      <div className="flex items-center gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {user?.profile_photo
          ? <img src={user.profile_photo} alt={`${user.first_name} ${user.last_name}`} className="h-16 w-16 shrink-0 rounded-full border-2 border-white object-cover shadow" />
          : <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xl font-black text-white shadow">{initials}</div>}
        <div className="min-w-0">
          <h2 className="truncate text-xl font-bold text-slate-950">{user?.first_name} {user?.last_name}</h2>
          <p className="text-sm text-slate-500">{user?.email}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${roleColor}`}>
              {user?.role?.name || 'User'}
            </span>
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              user?.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
            }`}>
              {user?.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {visibleTabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm ${
              tab === t.key ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'
            }`}>
            <span className="hidden sm:inline">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview ──────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="mb-5 text-sm font-bold text-slate-950">Account details</p>
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {[
              { label: 'First name',   value: user?.first_name },
              { label: 'Last name',    value: user?.last_name },
              { label: 'Email',        value: user?.email },
              { label: 'Phone',        value: user?.phone || '—' },
              { label: 'Address',      value: user?.address || '—' },
              { label: 'Role',         value: user?.role?.name || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-800">{value}</dd>
              </div>
            ))}
          </dl>
          {isStudent && <StudentRegistrationDetails profile={studentProfile} error={studentProfileError} />}
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            🔑 If you are using a default or temporary password, go to the <strong>Change password</strong> tab to update it now.
          </div>
        </div>
      )}

      {/* ── Edit profile ──────────────────────────────────────── */}
      {tab === 'edit' && !isProfileReadOnly && (
        <form onSubmit={handleEditSave} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <p className="text-sm font-bold text-slate-950">Update your information</p>
          {editStatus && <StatusBadge ok={editStatus.ok} msg={editStatus.msg} />}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {([
              ['first_name', 'First name'],
              ['last_name',  'Last name'],
              ['email',      'Email address'],
              ['phone',      'Phone'],
            ] as [keyof typeof editForm, string][]).map(([key, label]) => (
              <div key={key}>
                <label className="mb-1 block text-sm font-semibold text-slate-700">{label}</label>
                <input
                  type={key === 'email' ? 'email' : 'text'}
                  value={editForm[key]}
                  onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                  className="input-field"
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-slate-700">Address</label>
              <input value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className="input-field" />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={editSaving}
              className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50">
              {editSaving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      )}

      {/* ── Change password ───────────────────────────────────── */}
      {tab === 'password' && (
        <form onSubmit={handlePasswordChange} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <p className="text-sm font-bold text-slate-950">Change your password</p>

          {pwStatus && <StatusBadge ok={pwStatus.ok} msg={pwStatus.msg} />}

          {/* Current password */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Current password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                required
                type={showCurrent ? 'text' : 'password'}
                value={pwForm.current_password}
                onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
                className="input-field pr-11"
                placeholder="Enter your current password"
              />
              <button type="button" tabIndex={-1} onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm">
                {showCurrent ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              New password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                required minLength={8}
                type={showNew ? 'text' : 'password'}
                value={pwForm.password}
                onChange={(e) => setPwForm({ ...pwForm, password: e.target.value })}
                className="input-field pr-11"
                placeholder="At least 8 characters"
              />
              <button type="button" tabIndex={-1} onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm">
                {showNew ? '🙈' : '👁'}
              </button>
            </div>
            {/* Strength meter */}
            {pw && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength ? strengthColor : 'bg-slate-200'}`} />
                  ))}
                </div>
                <p className="text-xs text-slate-500">
                  Strength: <span className="font-semibold text-slate-700">{strengthLabel}</span>
                  &nbsp;· Use uppercase, numbers, and symbols for a stronger password.
                </p>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Confirm new password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                required
                type={showConfirm ? 'text' : 'password'}
                value={pwForm.password_confirmation}
                onChange={(e) => setPwForm({ ...pwForm, password_confirmation: e.target.value })}
                className={`input-field pr-11 ${
                  pwForm.password_confirmation && pwForm.password !== pwForm.password_confirmation
                    ? 'border-rose-400 bg-rose-50' : ''
                }`}
                placeholder="Re-enter new password"
              />
              <button type="button" tabIndex={-1} onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm">
                {showConfirm ? '🙈' : '👁'}
              </button>
            </div>
            {pwForm.password_confirmation && pwForm.password !== pwForm.password_confirmation && (
              <p className="mt-1 text-xs text-rose-600">Passwords do not match.</p>
            )}
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            Password requirements: minimum 8 characters. We recommend a mix of uppercase letters, lowercase letters, numbers, and symbols.
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={pwSaving}
              className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50">
              {pwSaving ? 'Changing password…' : 'Change password'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
