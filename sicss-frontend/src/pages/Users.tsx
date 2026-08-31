import { useEffect, useRef, useState } from 'react';
import { authService } from '../services/authService';
import api from '../services/api';
import type { Role, User } from '../types';
import { FormModal } from '../components/FormModal';

type CreateForm = { first_name: string; last_name: string; email: string; password: string; role_id: string; phone: string; address: string; profile_photo: string; credential_image_path: string };
type EditForm   = { first_name: string; last_name: string; email: string; phone: string; address: string; role_id: string; is_active: boolean; profile_photo: string; credential_image_path: string };
type NewCredentials = { user: User; password: string };

const emptyCreate: CreateForm = { first_name: '', last_name: '', email: '', password: '', role_id: '', phone: '', address: '', profile_photo: '', credential_image_path: '' };

const roleColor = (slug?: string) =>
  slug === 'admin' ? 'bg-rose-100 text-rose-700'
  : slug === 'teacher' ? 'bg-cyan-100 text-cyan-800'
  : slug?.includes('finance') ? 'bg-emerald-100 text-emerald-800'
  : 'bg-slate-100 text-slate-600';

export default function Users() {
  const [users, setUsers]         = useState<User[]>([]);
  const [roles, setRoles]         = useState<Pick<Role, 'id' | 'name' | 'slug'>[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [isApprovalRedirect, setIsApprovalRedirect] = useState(false);

  // Create
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating]         = useState(false);
  const [createForm, setCreateForm]     = useState<CreateForm>(emptyCreate);
  const [newCredentials, setNewCredentials] = useState<NewCredentials | null>(null);

  // Edit
  const [editUser, setEditUser]   = useState<User | null>(null);
  const [editForm, setEditForm]   = useState<EditForm>({ first_name: '', last_name: '', email: '', phone: '', address: '', role_id: '', is_active: true, profile_photo: '', credential_image_path: '' });
  const [editSaving, setEditSaving] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState<'profile' | 'credential' | null>(null);
  const [uploadTarget, setUploadTarget] = useState<'create' | 'edit'>('create');
  const profileImageRef = useRef<HTMLInputElement>(null);
  const credentialImageRef = useRef<HTMLInputElement>(null);

  useEffect(() => { 
    load(); 
    // Check for pre-filled parameters from student approval redirect
    const urlParams = new URLSearchParams(window.location.search);
    const prefillFirstName = urlParams.get('prefill_first_name');
    const prefillLastName = urlParams.get('prefill_last_name');
    const prefillEmail = urlParams.get('prefill_email');
    const prefillPhone = urlParams.get('prefill_phone');
    const prefillAddress = urlParams.get('prefill_address');
    
    if (prefillFirstName || prefillLastName || prefillEmail) {
      setIsApprovalRedirect(true);
      setCreateForm((prev) => ({
        ...prev,
        first_name: prefillFirstName || prev.first_name,
        last_name: prefillLastName || prev.last_name,
        email: prefillEmail || prev.email,
        phone: prefillPhone || prev.phone,
        address: prefillAddress || prev.address,
      }));
      // Auto-open the create modal
      setIsCreateOpen(true);
      // Clear URL parameters
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [userData, roleData] = await Promise.all([authService.users(), authService.roles()]);
      setUsers(userData);
      setRoles(roleData);
      if (!createForm.role_id && roleData[0]) setCreateForm((c) => ({ ...c, role_id: String(roleData[0].id) }));
    } catch { setError('Unable to load user accounts.'); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    setCreating(true); setError('');
    try {
      const user = await authService.createUser({
        ...createForm,
        role_id: Number(createForm.role_id),
        credential_image_path: isStudentRole(createForm.role_id) ? undefined : createForm.credential_image_path,
      });
      setUsers((prev) => [user, ...prev]);
      setIsCreateOpen(false);
      setNewCredentials({ user, password: createForm.password });
      setCreateForm({ ...emptyCreate, role_id: createForm.role_id });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to create account.');
    } finally { setCreating(false); }
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setEditForm({
      first_name: u.first_name || '',
      last_name:  u.last_name  || '',
      email:      u.email      || '',
      phone:      u.phone      || '',
      address:    u.address    || '',
      profile_photo: u.profile_photo || '',
      credential_image_path: (u as any).credential_image_path || '',
      role_id:    String(u.role_id || ''),
      is_active:  u.is_active !== false,
    });
    setError('');
  };

  const handleEdit = async () => {
    if (!editUser) return;
    setEditSaving(true); setError('');
    try {
      const res = await api.put(`/users/${editUser.id}`, {
        ...editForm,
        role_id: editForm.role_id ? Number(editForm.role_id) : undefined,
        credential_image_path: isStudentRole(editForm.role_id) ? null : editForm.credential_image_path,
      });
      setUsers((prev) => prev.map((u) => u.id === editUser.id ? res.data : u));
      setEditUser(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user.');
    } finally { setEditSaving(false); }
  };

  const handleToggleActive = async (u: User) => {
    try {
      const res = await api.put(`/users/${u.id}`, { is_active: !u.is_active });
      setUsers((prev) => prev.map((x) => x.id === u.id ? res.data : x));
    } catch { setError('Failed to update status.'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      // No backend delete endpoint yet — disable in UI and mark inactive as proxy
      await api.put(`/users/${deleteId}`, { is_active: false });
      setUsers((prev) => prev.map((u) => u.id === deleteId ? { ...u, is_active: false } : u));
      setDeleteId(null);
    } catch { setError('Failed to deactivate user.'); setDeleteId(null); }
  };

  const filtered = users.filter((u) =>
    `${u.user_code || ''} ${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const cf = (k: keyof CreateForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setCreateForm({ ...createForm, [k]: e.target.value });
  const roleEmail = (roleId: string) => {
    const slug = roles.find((role) => String(role.id) === roleId)?.slug;
    if (!slug) return '';

    const localPart = {
      admin: 'admin', teacher: 'teacher', 'class-teacher': 'class.teacher',
      'subject-teacher': 'subject.teacher', student: 'student', parent: 'parent',
      finance: 'finance', 'finance-staff': 'finance',
      'vice-principal-instruction': 'vice.principal', principal: 'principal', 'head-of-school': 'head.of.school',
    }[slug] || slug.replace(/-/g, '.');
    const used = new Set(users.map((user) => user.email.toLowerCase()));
    let candidate = `${localPart}@sicss.com`;
    let sequence = 2;
    while (used.has(candidate.toLowerCase())) candidate = `${localPart}${sequence++}@sicss.com`;
    return candidate;
  };
  const rolePassword = (roleId: string) => {
    const slug = roles.find((role) => String(role.id) === roleId)?.slug;
    const prefix = {
      admin: 'ADM', teacher: 'TCH', 'class-teacher': 'CTH', 'subject-teacher': 'STH',
      student: 'STU', parent: 'PAR', finance: 'FIN', 'finance-staff': 'FIN',
      'vice-principal-instruction': 'VPI', principal: 'PRI', 'head-of-school': 'HOS',
    }[slug || ''] || 'USR';
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    const values = crypto.getRandomValues(new Uint32Array(7));
    const suffix = Array.from(values, (value) => chars[value % chars.length]).join('');
    return `${prefix}!${suffix.slice(0, 2)}#${suffix.slice(2)}`;
  };
  const selectCreateRole = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const roleId = event.target.value;
    setCreateForm((form) => ({ ...form, role_id: roleId, email: roleEmail(roleId) || form.email, password: rolePassword(roleId) }));
  };
  const ef = (k: keyof EditForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setEditForm({ ...editForm, [k]: e.target.value });

  const isStudentRole = (roleId: string) => roles.find((role) => String(role.id) === roleId)?.slug === 'student';

  const credentialMessage = (credentials: NewCredentials) => {
    const { user, password } = credentials;
    return `Welcome to SICSS Management System, ${user.first_name}.\n\nYour User ID: ${user.user_code || 'Assigned on registration'}\nYour login credentials:\nEmail: ${user.email}\nPassword: ${password}\n\nPlease sign in and change your password after your first login.`;
  };

  const whatsappNumber = (phone?: string) => (phone || '').replace(/\D/g, '');

  const copyCredentials = async (credentials: NewCredentials) => {
    try {
      await navigator.clipboard.writeText(credentialMessage(credentials));
    } catch {
      setError('Unable to copy credentials. Please use Print or WhatsApp instead.');
    }
  };

  const sendCredentialsToWhatsApp = (credentials: NewCredentials) => {
    const number = whatsappNumber(credentials.user.phone);
    if (!number) {
      setError('Add the user’s phone number, including country code, to send credentials through WhatsApp.');
      return;
    }
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(credentialMessage(credentials))}`, '_blank', 'noopener,noreferrer');
  };

  const printCredentials = (credentials: NewCredentials) => {
    const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character] || character));
    const { user, password } = credentials;
    const frame = document.createElement('iframe');
    frame.setAttribute('title', 'Print login credentials');
    frame.style.cssText = 'position:fixed;width:0;height:0;border:0;right:0;bottom:0;visibility:hidden';
    frame.srcdoc = `<!doctype html><html><head><title>SICSS login credentials</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#0f172a}.card{max-width:640px;border:1px solid #cbd5e1;border-radius:12px;padding:28px}h1{margin:0 0 8px;font-size:24px}p{line-height:1.5}.label{font-size:12px;font-weight:bold;text-transform:uppercase;color:#475569;margin-top:20px}.value{font-size:18px;font-weight:600;word-break:break-word}.notice{margin-top:24px;padding:12px;background:#fef3c7;border-radius:8px;font-size:13px}</style></head><body><div class="card"><h1>SICSS Management System</h1><p>Login credentials for ${escapeHtml(`${user.first_name} ${user.last_name}`)}</p><div class="label">User ID</div><div class="value">${escapeHtml(user.user_code || 'Assigned on registration')}</div><div class="label">Email</div><div class="value">${escapeHtml(user.email)}</div><div class="label">Password</div><div class="value">${escapeHtml(password)}</div><div class="label">Role</div><div class="value">${escapeHtml(user.role?.name || 'User')}</div><p class="notice">Keep these credentials private. The user should change the password after first login.</p></div></body></html>`;
    frame.onload = () => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      window.setTimeout(() => frame.remove(), 1000);
    };
    document.body.appendChild(frame);
  };

  const uploadAccountImage = async (type: 'profile' | 'credential', file?: File) => {
    if (!file) return;
    setUploadingImage(type);
    setError('');
    try {
      const data = new FormData();
      data.append('file', file);
      data.append('type', type);
      const response = await api.post('/upload/user-image', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      const key = type === 'profile' ? 'profile_photo' : 'credential_image_path';
      if (uploadTarget === 'create') setCreateForm((form) => ({ ...form, [key]: response.data.full_url }));
      else setEditForm((form) => ({ ...form, [key]: response.data.full_url }));
    } catch {
      setError(`Unable to upload the ${type === 'profile' ? 'profile image' : 'credential image'}. Use a PNG, JPG, or WebP file up to 5 MB.`);
    } finally {
      setUploadingImage(null);
      const input = type === 'profile' ? profileImageRef.current : credentialImageRef.current;
      if (input) input.value = '';
    }
  };

  const accountImageFields = (form: Pick<CreateForm, 'profile_photo' | 'credential_image_path'>, setForm: React.Dispatch<React.SetStateAction<any>>, target: 'create' | 'edit', showCredential: boolean) => (
    <div className={`sm:col-span-2 grid grid-cols-1 gap-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 ${showCredential ? 'sm:grid-cols-2' : ''}`}>
      <input ref={profileImageRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => uploadAccountImage('profile', event.target.files?.[0])} />
      <input ref={credentialImageRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => uploadAccountImage('credential', event.target.files?.[0])} />
      <div>
        <p className="text-sm font-medium text-slate-700">Profile image <span className="font-normal text-slate-400">(optional)</span></p>
        <div className="mt-2 flex items-center gap-3">
          {form.profile_photo ? <img src={form.profile_photo} alt="Profile preview" className="h-14 w-14 rounded-full border border-slate-200 object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-xs text-slate-500">No photo</div>}
          <div className="flex flex-col items-start gap-1"><button type="button" onClick={() => { setUploadTarget(target); profileImageRef.current?.click(); }} disabled={uploadingImage !== null} className="text-sm font-semibold text-cyan-700 hover:underline disabled:opacity-50">{uploadingImage === 'profile' ? 'Uploading…' : form.profile_photo ? 'Replace photo' : 'Upload photo'}</button>{form.profile_photo && <button type="button" onClick={() => setForm((current: any) => ({ ...current, profile_photo: '' }))} className="text-xs font-medium text-rose-600 hover:underline">Remove</button>}</div>
        </div>
      </div>
      {showCredential && <div>
        <p className="text-sm font-medium text-slate-700">Credential image <span className="font-normal text-slate-400">(optional)</span></p>
        <div className="mt-2 flex items-center gap-3">
          {form.credential_image_path ? <img src={form.credential_image_path} alt="Credential preview" className="h-14 w-20 rounded border border-slate-200 object-cover" /> : <div className="flex h-14 w-20 items-center justify-center rounded border border-dashed border-slate-300 text-center text-xs text-slate-500">No credential</div>}
          <div className="flex flex-col items-start gap-1"><button type="button" onClick={() => { setUploadTarget(target); credentialImageRef.current?.click(); }} disabled={uploadingImage !== null} className="text-sm font-semibold text-cyan-700 hover:underline disabled:opacity-50">{uploadingImage === 'credential' ? 'Uploading…' : form.credential_image_path ? 'Replace image' : 'Upload image'}</button>{form.credential_image_path && <button type="button" onClick={() => setForm((current: any) => ({ ...current, credential_image_path: '' }))} className="text-xs font-medium text-rose-600 hover:underline">Remove</button>}</div>
        </div>
      </div>}
    </div>
  );

  return (
    <div className="space-y-5">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .rounded-xl { border-radius: 0 !important; }
          .shadow-sm { box-shadow: none !important; }
          table { border-collapse: collapse !important; width: 100% !important; }
          th, td { border: 1px solid black !important; padding: 4px !important; font-size: 10px !important; }
          th { background-color: #f0f0f0 !important; }
        }
      `}</style>
      {newCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Account created</p>
            <h3 className="mt-1 text-xl font-bold text-slate-950">Share login credentials</h3>
            <p className="mt-2 text-sm text-slate-500">Give these credentials to {newCredentials.user.first_name} now. For security, the password is shown only in this dialog.</p>
            <div className="mt-5 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <div><span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">User ID</span><span className="font-mono font-semibold text-slate-900">{newCredentials.user.user_code || 'Generated on save'}</span></div>
              <div><span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</span><span className="font-semibold text-slate-900">{newCredentials.user.email}</span></div>
              <div><span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Password</span><span className="font-mono font-semibold text-slate-900">{newCredentials.password}</span></div>
              <div><span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</span><span className="font-semibold text-slate-900">{newCredentials.user.phone || 'Not provided'}</span></div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => printCredentials(newCredentials)} className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700">Print credentials</button>
              <button onClick={() => copyCredentials(newCredentials)} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Copy</button>
              <button onClick={() => sendCredentialsToWhatsApp(newCredentials)} disabled={!whatsappNumber(newCredentials.user.phone)} className="rounded-lg border border-emerald-300 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50">Send via WhatsApp</button>
            </div>
            {!whatsappNumber(newCredentials.user.phone) && <p className="mt-3 text-xs text-amber-700">Add a phone number with country code to enable WhatsApp delivery.</p>}
            <div className="mt-5 flex justify-end"><button onClick={() => setNewCredentials(null)} className="text-sm font-semibold text-slate-600 hover:text-slate-950">Done</button></div>
          </div>
        </div>
      )}
      {/* Delete confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-950">Deactivate account?</h3>
            <p className="mt-2 text-sm text-slate-500">The user will be disabled and cannot sign in. This can be reversed by editing the account.</p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleDelete} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">Deactivate</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Access control</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">User accounts</h1>
          <p className="mt-1 text-sm text-slate-500">{users.length} account{users.length !== 1 ? 's' : ''} in the system.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!newCredentials && !isApprovalRedirect && (
            <button onClick={() => { setError(''); setIsCreateOpen(true); }} className="self-start rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 sm:self-auto">
              + Create user
            </button>
          )}
          <button onClick={() => window.print()} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 no-print">
            🖨️ Print
          </button>
        </div>
      </div>

      {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-5 no-print">
          <input type="search" placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field w-full max-w-xs text-sm" />
        </div>
        {loading ? <p className="py-12 text-center text-sm text-slate-500">Loading…</p> : (
          <div className="overflow-x-auto">
            <table className="min-w-[600px] divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>{['User ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-3 sm:px-5 py-3 text-left">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0
                  ? <tr><td colSpan={7} className="py-10 text-center text-slate-400">No users found.</td></tr>
                  : filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-3 sm:px-5 py-3 font-mono text-xs font-semibold text-cyan-700">{u.user_code || '—'}</td>
                    <td className="px-3 sm:px-5 py-3">
                      <div className="flex items-center gap-2">
                        {u.profile_photo
                          ? <img src={u.profile_photo} alt={`${u.first_name} ${u.last_name}`} className="h-6 w-6 sm:h-7 sm:w-7 shrink-0 rounded-full border border-slate-200 object-cover" />
                          : <div className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">{u.first_name?.charAt(0)}{u.last_name?.charAt(0)}</div>}
                        <span className="font-semibold text-slate-900">{u.first_name} {u.last_name}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-5 py-3 text-slate-600 hidden sm:table-cell">{u.email}</td>
                    <td className="px-3 sm:px-5 py-3 text-slate-600 hidden md:table-cell">{u.phone || '—'}</td>
                    <td className="px-3 sm:px-5 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${roleColor(u.role?.slug)}`}>
                        {u.role?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-5 py-3">
                      <button onClick={() => handleToggleActive(u)}
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold transition-colors ${u.is_active !== false ? 'bg-emerald-100 text-emerald-800 hover:bg-rose-50 hover:text-rose-700' : 'bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'}`}
                        title="Click to toggle">
                        {u.is_active !== false ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-3 sm:px-5 py-3">
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => openEdit(u)} className="text-xs font-semibold text-cyan-700 hover:underline whitespace-nowrap">Edit</button>
                        <button onClick={() => setDeleteId(u.id)} className="text-xs font-semibold text-rose-600 hover:underline whitespace-nowrap">Disable</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-slate-100 px-4 py-3 sm:px-5 text-xs text-slate-400">{filtered.length} of {users.length}</div>
      </div>

      {/* Create modal */}
      <FormModal isOpen={isCreateOpen} title="Create user account" onClose={() => setIsCreateOpen(false)} onSubmit={handleCreate} submitText="Create account" isLoading={creating}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><label className="mb-1.5 block text-sm font-semibold text-slate-700">First name <span className="text-rose-500">*</span></label><input required value={createForm.first_name} onChange={cf('first_name')} className="input-field" /></div>
          <div><label className="mb-1.5 block text-sm font-semibold text-slate-700">Last name <span className="text-rose-500">*</span></label><input required value={createForm.last_name} onChange={cf('last_name')} className="input-field" /></div>
          <div><label className="mb-1.5 block text-sm font-semibold text-slate-700">Email <span className="text-rose-500">*</span></label><input required type="email" value={createForm.email} onChange={cf('email')} className="input-field" /><p className="mt-1 text-xs text-slate-500">Updated automatically when a role is selected; you can edit it if needed.</p></div>
          <div><label className="mb-1.5 block text-sm font-semibold text-slate-700">Role <span className="text-rose-500">*</span></label>
            <select required value={createForm.role_id} onChange={selectCreateRole} className="input-field">
              <option value="">Select role</option>
              {roles.filter((r) => r.slug !== 'class-teacher' && r.slug !== 'finance-staff').map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div><label className="mb-1.5 block text-sm font-semibold text-slate-700">Phone <span className="text-rose-500">*</span></label><input required value={createForm.phone} onChange={cf('phone')} className="input-field" placeholder="+231..." /></div>
          <div><label className="mb-1.5 block text-sm font-semibold text-slate-700">Password <span className="text-rose-500">*</span></label><div className="flex gap-2"><input required type="password" minLength={8} value={createForm.password} onChange={cf('password')} className="input-field" placeholder="Select a role to generate" /><button type="button" onClick={() => setCreateForm((form) => ({ ...form, password: rolePassword(form.role_id) }))} disabled={!createForm.role_id} className="shrink-0 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Regenerate</button></div><p className="mt-1 text-xs text-slate-500">Generated with the role abbreviation and mixed characters.</p></div>
          <div className="sm:col-span-2"><label className="mb-1.5 block text-sm font-semibold text-slate-700">Address</label><input value={createForm.address} onChange={cf('address')} className="input-field" /></div>
          {accountImageFields(createForm, setCreateForm, 'create', !isStudentRole(createForm.role_id))}
        </div>
      </FormModal>

      {/* Edit modal */}
      <FormModal isOpen={!!editUser} title={`Edit — ${editUser?.first_name} ${editUser?.last_name}`} onClose={() => setEditUser(null)} onSubmit={handleEdit} submitText="Save changes" isLoading={editSaving}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><label className="mb-1.5 block text-sm font-semibold text-slate-700">First name</label><input value={editForm.first_name} onChange={ef('first_name')} className="input-field" /></div>
          <div><label className="mb-1.5 block text-sm font-semibold text-slate-700">Last name</label><input value={editForm.last_name} onChange={ef('last_name')} className="input-field" /></div>
          <div><label className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label><input type="email" value={editForm.email} onChange={ef('email')} className="input-field" /></div>
          <div><label className="mb-1.5 block text-sm font-semibold text-slate-700">Phone</label><input value={editForm.phone} onChange={ef('phone')} className="input-field" /></div>
          <div><label className="mb-1.5 block text-sm font-semibold text-slate-700">Role</label>
            <select value={editForm.role_id} onChange={ef('role_id')} className="input-field">
              <option value="">Keep current</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3 pt-4">
            <label className="flex cursor-pointer items-center gap-2">
              <div onClick={() => setEditForm((f) => ({ ...f, is_active: !f.is_active }))}
                className={`relative h-6 w-11 rounded-full transition-colors ${editForm.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${editForm.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm font-medium text-slate-700">Active account</span>
            </label>
          </div>
          <div className="sm:col-span-2"><label className="mb-1.5 block text-sm font-semibold text-slate-700">Address</label><input value={editForm.address} onChange={ef('address')} className="input-field" /></div>
          {accountImageFields(editForm, setEditForm, 'edit', !isStudentRole(editForm.role_id))}
        </div>
      </FormModal>
    </div>
  );
}
