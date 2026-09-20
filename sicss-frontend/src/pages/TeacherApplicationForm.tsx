import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Button, Input, Select, Card, CardHeader, CardTitle, CardContent, Badge, LoadingState } from '../components/ui';
import { payrollService } from '../services/teacherService';
import { classService, type Class } from '../services/classService';
import { subjectService, type Subject } from '../services/subjectService';
import { authService } from '../services/authService';

type FormData = Record<string, string>;

const EMPTY: FormData = {
  full_name: '',
  email: '',
  phone: '',
  gender: '',
  date_of_birth: '',
  qualification: '',
  subject_specialization: '',
  joining_date: '',
  address: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  next_of_kin_name: '',
  next_of_kin_phone: '',
  next_of_kin_relationship: '',
  salary_structure_id: '',
  employment_type: '',
  photo_url: '',
  credential_image_path: '',
  notes: '',
  employee_id: '',
  is_active: 'true',
  status: 'active',
  user_id: '',
  sponsor_class_id: '',
};

const SUBJECT_SPECIALIZATIONS = [
  'Mathematics',
  'English Language',
  'Science',
  'Social Studies',
  'Bible',
  'Reading',
  'Physical Education',
  'Health Science',
  'Art',
  'Music',
  'Computer Science',
  'General Education',
  'Other',
];

const QUALIFICATIONS = [
  'High School Diploma',
  'Associate Degree',
  'Bachelor\'s Degree',
  'Master\'s Degree',
  'PhD',
  'Teaching Certificate',
  'Other',
];

export default function TeacherApplicationForm() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get('id');

  const [form, setForm] = useState<FormData>(EMPTY);
  const [photoUrl, setPhotoUrl] = useState('');
  const [credentialUrl, setCredentialUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [salaryStructures, setSalaryStructures] = useState<any[]>([]);
  const [uploadingImage, setUploadingImage] = useState<'profile' | 'credential' | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [subjectAssignments, setSubjectAssignments] = useState<{ class_id: string; subject_id: string }[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [createUserAccount, setCreateUserAccount] = useState(false);
  const [generatedUsername, setGeneratedUsername] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accountActive, setAccountActive] = useState(true);
  const [userPhone, setUserPhone] = useState('');
  const [userRole, setUserRole] = useState('TEACHER');

  useEffect(() => {
    Promise.all([
      payrollService.structures(),
      classService.getAll(),
      subjectService.getAll(),
      authService.users(),
    ]).then(([structures, classData, subjectData, userData]) => {
      setSalaryStructures(structures);
      setClasses((classData as any).data || classData as any);
      setSubjects((subjectData as any).data || subjectData as any);
      setUsers(userData);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!editId) return;
    setLoading(true);
    api.get(`/teachers/${editId}`)
      .then((res) => {
        const t = res.data;
        setForm({
          full_name: `${t.first_name} ${t.last_name}`.trim(),
          email: t.email ?? '',
          phone: t.phone ?? '',
          gender: t.gender ?? '',
          date_of_birth: t.date_of_birth?.slice?.(0, 10) ?? '',
          qualification: t.qualification ?? '',
          subject_specialization: t.subject_specialization ?? '',
          joining_date: t.hire_date?.slice?.(0, 10) ?? '',
          address: t.address ?? '',
          emergency_contact_name: t.emergency_contact_name ?? '',
          emergency_contact_phone: t.emergency_contact_phone ?? '',
          next_of_kin_name: t.next_of_kin_name ?? '',
          next_of_kin_phone: t.next_of_kin_phone ?? '',
          next_of_kin_relationship: t.next_of_kin_relationship ?? '',
          salary_structure_id: t.salary_structure_id ? String(t.salary_structure_id) : '',
          employment_type: t.salary_structure?.employment_type || '',
          photo_url: t.photo || '',
          credential_image_path: t.credential_image_path || '',
          notes: t.notes ?? '',
          employee_id: t.employee_id || '',
          is_active: t.is_active ? 'true' : 'false',
        });
        if (t.photo) setPhotoUrl(t.photo);
        if (t.credential_image_path) setCredentialUrl(t.credential_image_path);
      })
      .catch(() => notify(false, 'Failed to load teacher record.'))
      .finally(() => setLoading(false));
  }, [editId]);

  const set = (key: string, value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    setMissingFields((fields) => fields.filter((field) => field !== key));
  };

  const notify = (ok: boolean, text: string) => {
    setMsg({ ok, text }); setTimeout(() => setMsg(null), 5000);
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage('profile');
    setUploadError('');
    try {
      const upload = new FormData();
      upload.append('file', file);
      upload.append('type', 'profile');
      const response = await api.post('/upload/teacher-image', upload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPhotoUrl(response.data.full_url);
    } catch {
      setUploadError('Unable to upload profile photo. Please use a PNG, JPG, or WebP image up to 5 MB.');
    } finally {
      setUploadingImage(null);
      const input = document.getElementById('photo-upload') as HTMLInputElement;
      if (input) input.value = '';
    }
  };

  const handleCredential = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage('credential');
    setUploadError('');
    try {
      const upload = new FormData();
      upload.append('file', file);
      upload.append('type', 'credential');
      const response = await api.post('/upload/teacher-image', upload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCredentialUrl(response.data.full_url);
    } catch {
      setUploadError('Unable to upload credential document. Please use a PNG, JPG, or WebP image up to 5 MB.');
    } finally {
      setUploadingImage(null);
      const input = document.getElementById('credential-upload') as HTMLInputElement;
      if (input) input.value = '';
    }
  };

  const generateUsername = () => {
    const nameParts = form.full_name.trim().split(' ');
    const firstName = nameParts[0]?.toLowerCase() || 'teacher';
    const lastName = nameParts[1]?.toLowerCase() || '';
    const randomNum = Math.floor(Math.random() * 1000);
    return `${firstName}${lastName}${randomNum}`;
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const getPasswordStrength = (password: string): { label: string; color: string } => {
    if (!password) return { label: 'None', color: 'text-slate-400' };
    if (password.length < 8) return { label: 'Weak', color: 'text-red-500' };
    if (password.length < 12) return { label: 'Medium', color: 'text-yellow-500' };
    if (/[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
      return { label: 'Strong', color: 'text-green-500' };
    }
    return { label: 'Medium', color: 'text-yellow-500' };
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    notify(true, 'Password copied to clipboard');
  };

  const handleGenerateCredentials = () => {
    setGeneratedUsername(generateUsername());
    setGeneratedPassword(generatePassword());
  };

  useEffect(() => {
    if (createUserAccount && !generatedUsername) {
      handleGenerateCredentials();
    }
  }, [createUserAccount]);

  const nextStep = () => {
    if (currentStep === 1) {
      const missing = [
        (!form.full_name || !form.full_name.trim()) && 'full_name',
        (!form.email || !form.email.trim()) && 'email',
        (!form.phone || !form.phone.trim()) && 'phone',
      ].filter(Boolean) as string[];
      if (missing.length > 0) {
        setMissingFields(missing);
        notify(false, 'Please complete the required fields before proceeding.');
        return;
      }
      setMissingFields([]);
    }
    if (currentStep === 2) {
      const missing = [
        (!form.qualification || !form.qualification.trim()) && 'qualification',
        (!form.subject_specialization || !form.subject_specialization.trim()) && 'subject_specialization',
      ].filter(Boolean) as string[];
      if (missing.length > 0) {
        setMissingFields(missing);
        notify(false, 'Please complete the required fields before proceeding.');
        return;
      }
      setMissingFields([]);
    }
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSave = async () => {
    const nameParts = form.full_name.trim().split(' ');
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '_';

    const missing = [
      !first_name && 'full_name',
      !form.email?.trim() && 'email',
      !form.phone?.trim() && 'phone',
      !form.qualification?.trim() && 'qualification',
      !form.subject_specialization?.trim() && 'subject_specialization',
    ].filter(Boolean) as string[];
    if (missing.length > 0) {
      setMissingFields(missing);
      notify(false, 'Please complete the highlighted fields before saving.');
      return;
    }
    setMissingFields([]);

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        first_name,
        last_name,
        email: form.email,
        phone: form.phone,
        qualification: form.qualification,
        subject_specialization: form.subject_specialization,
        hire_date: form.joining_date || new Date().toISOString().split('T')[0],
        is_active: form.is_active === 'true',
      };

      if (photoUrl) {
        payload.photo = photoUrl;
      }

      if (credentialUrl) {
        payload.credential_image_path = credentialUrl;
      }

      if (form.salary_structure_id) {
        payload.salary_structure_id = Number(form.salary_structure_id);
      }

      if (selectedClasses.length > 0) {
        payload.class_ids = selectedClasses;
      }

      if (subjectAssignments.length > 0) {
        payload.subject_assignments = subjectAssignments
          .filter((a) => a.class_id && a.subject_id)
          .map((a) => ({ class_id: Number(a.class_id), subject_id: Number(a.subject_id) }));
      }

      payload.status = form.status || 'active';

      if (createUserAccount) {
        payload.username = generatedUsername || generateUsername();
        payload.password = generatedPassword || generatePassword();
        payload.phone = userPhone;
        payload.role_id = userRole;
        payload.is_active = accountActive;
      } else if (form.user_id) {
        payload.user_id = Number(form.user_id);
      }

      if (form.sponsor_class_id) {
        payload.sponsor_class_id = Number(form.sponsor_class_id);
      }

      if (editId) {
        await api.put(`/teachers/${editId}`, payload);
        notify(true, 'Teacher updated successfully.');
        setForm(EMPTY);
        setPhotoUrl('');
        setCredentialUrl('');
        navigate('/teachers');
      } else {
        const res = await api.post('/teachers', payload);
        const saved = res.data;
        notify(true, `Teacher application submitted! Employee ID: ${saved.employee_id}. The admin will review your application.`);
        setForm(EMPTY);
        setPhotoUrl('');
        setCredentialUrl('');
        setCurrentStep(1);
        setSelectedClasses([]);
        setSubjectAssignments([]);
        setMissingFields([]);
        setUploadError('');
      }
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      const msg = errors ? Object.values(errors).flat().join(' ') : (err.response?.data?.message || 'Failed to save. Please check all required fields.');
      notify(false, msg);
    } finally { setSaving(false); }
  };

  if (loading) return <LoadingState message="Loading application…" />;

  const f = (key: string) => form[key] ?? '';

  const selectedUser = users.find((u) => u.id === Number(form.user_id));
  const teachingRole = selectedUser?.role?.slug;
  const isSponsorRole = teachingRole === 'class-sponsor' || teachingRole === 'class-teacher';
  const isSubjectRole = teachingRole === 'subject-teacher';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 uppercase tracking-widest">
                  Registration
                </span>
                {editId && (
                  <Badge variant={form.is_active === 'true' ? 'success' : 'warning'}>
                    {form.is_active === 'true' ? 'Active' : 'Inactive'}
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Teacher Application Form
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                {editId 
                  ? 'Edit the teacher application details below.'
                  : 'Complete all sections to submit a new teacher application.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => window.print()} variant="secondary">
                🖨️ Print
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editId ? '💾 Save Changes' : '📤 Submit Application'}
              </Button>
            </div>
          </div>

          {msg && (
            <div className={`mt-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
              msg.ok 
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800' 
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}>
              <span className="mt-0.5 shrink-0 text-lg">{msg.ok ? '✓' : '⚠'}</span>
              <span>{msg.text}</span>
              <button 
                onClick={() => setMsg(null)}
                className="ml-auto shrink-0 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm ${
                currentStep >= step
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}>
                {currentStep > step ? '✓' : step}
              </div>
              {step < 5 && (
                <div className={`flex-1 h-1 mx-2 ${currentStep > step ? 'bg-blue-600' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-slate-600 mb-6">
          <span>Personal Info</span>
          <span>Professional Info</span>
          <span>Emergency Info</span>
          <span>Assignments</span>
          <span>Review</span>
        </div>
      </div>

      {/* Form Container */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-6">
        <Card>
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <CardContent className="p-6 sm:p-8">
              <CardHeader className="p-0 mb-6">
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              
              {/* Photo Upload */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div 
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    className="w-32 h-32 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors overflow-hidden"
                  >
                    {uploadingImage === 'profile' ? (
                      <div className="text-center">
                        <span className="text-2xl animate-spin">⏳</span>
                        <p className="text-xs text-slate-500 mt-1">Uploading...</p>
                      </div>
                    ) : photoUrl ? (
                      <img src={photoUrl} alt="Teacher" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <span className="text-3xl">📷</span>
                        <p className="text-xs text-slate-500 mt-1">Upload Photo</p>
                      </div>
                    )}
                  </div>
                  <input 
                    id="photo-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handlePhoto} 
                    disabled={uploadingImage === 'profile'}
                  />
                </div>
              </div>

              {uploadError && (
                <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {uploadError}
                </div>
              )}

              {/* User Account Creation */}
              <div className="mb-6">
                <Card className="border-2 border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="create-account"
                          checked={createUserAccount}
                          onChange={(e) => setCreateUserAccount(e.target.checked)}
                          className="h-5 w-5 rounded border-slate-300 text-blue-600 accent-blue-600"
                        />
                        <label htmlFor="create-account" className="text-sm font-semibold text-slate-800 cursor-pointer">
                          Create login account
                        </label>
                      </div>
                      <span className="text-xs text-slate-500">Optional</span>
                    </div>
                    
                    {createUserAccount && (
                      <div className="mt-4 space-y-4">
                        {/* Email/Username */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Email / Username <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={generatedUsername}
                            readOnly
                            placeholder="teacher.sicss@sicss.edu"
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-slate-100 text-slate-700"
                          />
                        </div>

                        {/* Role */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Role <span className="text-red-500">*</span>
                          </label>
                          <Select 
                            value={userRole}
                            onChange={(e) => setUserRole(e.target.value)}
                            options={[
                              { value: 'TEACHER', label: 'TEACHER' },
                              { value: 'ADMIN', label: 'ADMIN' },
                            ]}
                          />
                        </div>

                        {/* Phone */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Phone (for WhatsApp/SMS delivery)
                          </label>
                          <input
                            type="text"
                            value={userPhone}
                            onChange={(e) => setUserPhone(e.target.value)}
                            placeholder="e.g. 0770123456"
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md text-slate-700"
                          />
                        </div>

                        {/* Password */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Password <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={generatedPassword}
                              readOnly
                              className="w-full px-3 py-2 pr-24 text-sm border border-slate-300 rounded-md bg-slate-100 text-slate-700"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                              <button
                                type="button"
                                onClick={handleGenerateCredentials}
                                className="p-1.5 text-slate-500 hover:text-slate-700 rounded hover:bg-slate-200"
                                title="Regenerate"
                              >
                                ↺
                              </button>
                              <button
                                type="button"
                                onClick={handleCopyPassword}
                                className="p-1.5 text-slate-500 hover:text-slate-700 rounded hover:bg-slate-200"
                                title="Copy password"
                              >
                                ⎘
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="p-1.5 text-slate-500 hover:text-slate-700 rounded hover:bg-slate-200"
                                title="Show/Hide"
                              >
                                {showPassword ? '👁' : '👁‍🗨'}
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500">Auto-generated · hand to teacher securely</span>
                            <span className={`text-xs font-medium ${getPasswordStrength(generatedPassword).color}`}>
                              Strength: {getPasswordStrength(generatedPassword).label}
                            </span>
                          </div>
                        </div>

                        {/* Account Active Toggle */}
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-sm font-medium text-slate-700">Account active</span>
                          <button
                            type="button"
                            onClick={() => setAccountActive(!accountActive)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              accountActive ? 'bg-green-500' : 'bg-slate-300'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              accountActive ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Input 
                    label="Full Name *"
                    type="text" 
                    value={f('full_name')} 
                    onChange={(e) => set('full_name', e.target.value)}
                    placeholder="First Middle Last"
                    error={missingFields.includes('full_name') ? 'This field is required' : undefined}
                    required
                  />
                </div>

                <div>
                  <Input 
                    label="Email Address *"
                    type="email" 
                    value={f('email')} 
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="teacher@example.com"
                    error={missingFields.includes('email') ? 'This field is required' : undefined}
                    required
                  />
                </div>

                <div>
                  <Input 
                    label="Phone Number *"
                    type="text" 
                    value={f('phone')} 
                    onChange={(e) => set('phone', e.target.value)}
                    placeholder="+231 XXX XXX XXX"
                    error={missingFields.includes('phone') ? 'This field is required' : undefined}
                    required
                  />
                </div>

                <div>
                  <Select 
                    label="Gender"
                    value={f('gender')} 
                    onChange={(e) => set('gender', e.target.value)}
                    options={[
                      { value: '', label: 'Select Gender' },
                      { value: 'Male', label: 'Male' },
                      { value: 'Female', label: 'Female' },
                    ]}
                  />
                </div>

                <div>
                  <Input 
                    label="Date of Birth"
                    type="date" 
                    value={f('date_of_birth')} 
                    onChange={(e) => set('date_of_birth', e.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <Input 
                    label="Home Address"
                    type="text" 
                    value={f('address')} 
                    onChange={(e) => set('address', e.target.value)}
                    placeholder="Street, Community, City"
                  />
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button onClick={() => navigate('/teachers')} variant="secondary">
                  Cancel
                </Button>
                <Button onClick={nextStep}>
                  Next →
                </Button>
              </div>
            </CardContent>
          )}

          {/* Step 2: Professional Information */}
          {currentStep === 2 && (
            <CardContent className="p-6 sm:p-8">
              <CardHeader className="p-0 mb-6">
                <CardTitle>Professional Information</CardTitle>
              </CardHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Select 
                    label="Qualification *"
                    value={f('qualification')} 
                    onChange={(e) => set('qualification', e.target.value)}
                    options={[
                      { value: '', label: 'Select Qualification' },
                      ...QUALIFICATIONS.map((q) => ({ value: q, label: q }))
                    ]}
                    error={missingFields.includes('qualification') ? 'This field is required' : undefined}
                  />
                </div>

                <div>
                  <Select 
                    label="Subject Specialization *"
                    value={f('subject_specialization')} 
                    onChange={(e) => set('subject_specialization', e.target.value)}
                    options={[
                      { value: '', label: 'Select Subject' },
                      ...SUBJECT_SPECIALIZATIONS.map((s) => ({ value: s, label: s }))
                    ]}
                    error={missingFields.includes('subject_specialization') ? 'This field is required' : undefined}
                  />
                </div>

                <div>
                  <Input 
                    label="Joining Date"
                    type="date" 
                    value={f('joining_date')} 
                    onChange={(e) => set('joining_date', e.target.value)}
                  />
                </div>

                <div>
                  <Select 
                    label="Salary Structure"
                    value={f('salary_structure_id')} 
                    onChange={(e) => set('salary_structure_id', e.target.value)}
                    options={[
                      { value: '', label: 'Select Salary Structure' },
                      ...salaryStructures.map((s) => ({ value: String(s.id), label: `${s.name} - ${s.role_title} (${s.currency})` }))
                    ]}
                  />
                </div>

                {/* Credential Upload */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Credential Document (Certificate, Diploma, etc.)
                  </label>
                  <div className="flex items-center gap-4">
                    <div 
                      onClick={() => document.getElementById('credential-upload')?.click()}
                      className="w-full h-24 rounded-lg bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
                    >
                      {uploadingImage === 'credential' ? (
                        <div className="text-center">
                          <span className="text-2xl animate-spin">⏳</span>
                          <p className="text-xs text-slate-500 mt-1">Uploading...</p>
                        </div>
                      ) : credentialUrl ? (
                        <div className="text-center">
                          <span className="text-2xl">📄</span>
                          <p className="text-xs text-slate-600 mt-1">Document uploaded</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <span className="text-2xl">📤</span>
                          <p className="text-xs text-slate-500 mt-1">Click to upload credential</p>
                        </div>
                      )}
                    </div>
                    <input 
                      id="credential-upload" 
                      type="file" 
                      accept="image/*,.pdf" 
                      className="hidden" 
                      onChange={handleCredential} 
                      disabled={uploadingImage === 'credential'}
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Input 
                    label="Additional Notes"
                    type="textarea" 
                    value={f('notes')} 
                    onChange={(e) => set('notes', e.target.value)}
                    rows={3}
                    placeholder="Any additional information about qualifications or experience"
                  />
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button onClick={prevStep} variant="secondary">
                  ← Back
                </Button>
                <Button onClick={nextStep}>
                  Next →
                </Button>
              </div>
            </CardContent>
          )}

          {/* Step 3: Emergency & Next of Kin */}
          {currentStep === 3 && (
            <CardContent className="p-6 sm:p-8">
              <CardHeader className="p-0 mb-6">
                <CardTitle>Emergency Contact & Next of Kin</CardTitle>
              </CardHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input 
                    label="Emergency Contact Name"
                    type="text" 
                    value={f('emergency_contact_name')} 
                    onChange={(e) => set('emergency_contact_name', e.target.value)}
                  />
                </div>

                <div>
                  <Input 
                    label="Emergency Contact Phone"
                    type="text" 
                    value={f('emergency_contact_phone')} 
                    onChange={(e) => set('emergency_contact_phone', e.target.value)}
                    placeholder="+231 XXX XXX XXX"
                  />
                </div>

                <div>
                  <Input 
                    label="Next of Kin Name"
                    type="text" 
                    value={f('next_of_kin_name')} 
                    onChange={(e) => set('next_of_kin_name', e.target.value)}
                  />
                </div>

                <div>
                  <Input 
                    label="Next of Kin Phone"
                    type="text" 
                    value={f('next_of_kin_phone')} 
                    onChange={(e) => set('next_of_kin_phone', e.target.value)}
                    placeholder="+231 XXX XXX XXX"
                  />
                </div>

                <div>
                  <Input 
                    label="Next of Kin Relationship"
                    type="text" 
                    value={f('next_of_kin_relationship')} 
                    onChange={(e) => set('next_of_kin_relationship', e.target.value)}
                    placeholder="e.g., Spouse, Parent, Sibling"
                  />
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button onClick={prevStep} variant="secondary">
                  ← Back
                </Button>
                <Button onClick={nextStep}>
                  Next →
                </Button>
              </div>
            </CardContent>
          )}

          {/* Step 4: Class & Subject Assignments */}
          {currentStep === 4 && (
            <CardContent className="p-6 sm:p-8">
              <CardHeader className="p-0 mb-6">
                <CardTitle>Class & Subject Assignments</CardTitle>
              </CardHeader>
              
              {/* Status */}
              <div className="mb-6">
                <Select 
                  label="Employment Status"
                  value={f('status')} 
                  onChange={(e) => set('status', e.target.value)}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                    { value: 'on_leave', label: 'On Leave' },
                  ]}
                />
              </div>

              {/* Sponsored Class - class-sponsor / class-teacher roles */}
              {isSponsorRole && (
                <div className="mb-6">
                  <Select
                    label="Sponsored Class (Home Class)"
                    value={f('sponsor_class_id')}
                    onChange={(e) => set('sponsor_class_id', e.target.value)}
                    options={[
                      { value: '', label: 'No sponsored class' },
                      ...classes.map((c) => ({ value: String(c.id), label: `${c.name.replace(/\s[A-Z][a-z]*$/, '').trim()}` }))
                    ]}
                    helperText="The sponsored class is the teacher's home class. They compile the mark sheet and send it to the VPI for approval."
                  />
                </div>
              )}

              {/* Classes Assigned */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Classes Assigned to this Teacher
                </label>
                {classes.length === 0 ? (
                  <p className="text-xs text-slate-400">No classes found. Add classes first.</p>
                ) : (
                  <div className="max-h-44 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
                    {classes.map((c) => (
                      <label key={c.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-slate-50">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                          checked={selectedClasses.includes(c.id)}
                          onChange={() => {
                            setSelectedClasses((prev) =>
                              prev.includes(c.id)
                                ? prev.filter((id) => id !== c.id)
                                : [...prev, c.id]
                            );
                          }}
                        />
                        <span className="text-sm text-slate-700">
                          {c.name.replace(/\s[A-Z][a-z]*$/, '').trim()}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                {selectedClasses.length > 0 && (
                  <p className="mt-1 text-xs text-slate-500">{selectedClasses.length} class{selectedClasses.length !== 1 ? 'es' : ''} selected</p>
                )}
              </div>

              {/* Subject Assignments */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Subject & Class Assignments
                </label>
                <p className="mb-3 text-xs text-slate-500">Assign this teacher to specific subjects within specific classes.</p>
                
                {/* Only show subject assignment builder for subject-teacher role */}
                {isSubjectRole ? (
                  <>
                    {subjectAssignments.map((assignment, index) => (
                      <div key={index} className="mb-2 grid grid-cols-[1fr_1fr_auto] gap-2">
                        <select
                          value={assignment.class_id}
                          onChange={(e) => {
                            const updated = [...subjectAssignments];
                            updated[index].class_id = e.target.value;
                            setSubjectAssignments(updated);
                          }}
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        >
                          <option value="">Class</option>
                          {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name.replace(/\s[A-Z][a-z]*$/, '').trim()}
                            </option>
                          ))}
                        </select>
                        <select
                          value={assignment.subject_id}
                          onChange={(e) => {
                            const updated = [...subjectAssignments];
                            updated[index].subject_id = e.target.value;
                            setSubjectAssignments(updated);
                          }}
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        >
                          <option value="">Subject</option>
                          {subjects.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.code} — {s.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setSubjectAssignments((prev) => prev.filter((_, i) => i !== index))}
                          className="px-2 text-sm font-semibold text-rose-600"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {subjectAssignments.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {subjectAssignments.map((assignment, index) => {
                          const selectedClass = classes.find(c => String(c.id) === assignment.class_id);
                          const selectedSubject = subjects.find(s => String(s.id) === assignment.subject_id);
                          if (!selectedClass || !selectedSubject) return null;
                          const colors = ['bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-purple-100 text-purple-800', 'bg-orange-100 text-orange-800', 'bg-pink-100 text-pink-800'];
                          const color = colors[index % colors.length];
                          // Remove section letters/words from class name (e.g., "Grade 10A" -> "Grade 10", "Grade 7 Green" -> "Grade 7")
                          const classNameWithoutSection = selectedClass.name.replace(/\s[A-Z][a-z]*$/, '').trim();
                          return (
                            <span key={index} className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${color}`}>
                              {classNameWithoutSection} — {selectedSubject.code}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setSubjectAssignments((prev) => [...prev, { class_id: '', subject_id: '' }])}
                      className="text-sm font-semibold text-blue-600"
                    >
                      + Assign a subject to a class
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-slate-500 italic">Link a user account with the subject-teacher role to enable subject assignments.</p>
                )}
              </div>

              {/* Tip about user account linking */}
              {!form.user_id && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-xs font-semibold text-amber-800">Tip — link a user account to unlock role-specific fields</p>
                  <p className="text-xs text-amber-700 mt-0.5">Select a user account above. If the linked user has the <strong>class-sponsor</strong> role, the sponsored class field appears. If they have <strong>subject-teacher</strong>, the subject assignment builder appears.</p>
                </div>
              )}

              <div className="flex justify-between mt-8">
                <Button onClick={prevStep} variant="secondary">
                  ← Back
                </Button>
                <Button onClick={nextStep}>
                  Next →
                </Button>
              </div>
            </CardContent>
          )}

          {/* Step 5: Review & Submit (was Step 4) */}
          {currentStep === 5 && (
            <CardContent className="p-6 sm:p-8">
              <CardHeader className="p-0 mb-6">
                <CardTitle>Review & Submit</CardTitle>
              </CardHeader>
              
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-base">Personal Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-slate-600">Name:</span> {f('full_name')}</div>
                    <div><span className="text-slate-600">Email:</span> {f('email')}</div>
                    <div><span className="text-slate-600">Phone:</span> {f('phone')}</div>
                    <div><span className="text-slate-600">Gender:</span> {f('gender')}</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-base">Professional Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-slate-600">Qualification:</span> {f('qualification')}</div>
                    <div><span className="text-slate-600">Subject:</span> {f('subject_specialization')}</div>
                    <div><span className="text-slate-600">Joining Date:</span> {f('joining_date')}</div>
                    <div><span className="text-slate-600">Salary Structure:</span> {salaryStructures.find(s => String(s.id) === f('salary_structure_id'))?.name || 'Not selected'}</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-base">Emergency Contact</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-slate-600">Name:</span> {f('emergency_contact_name')}</div>
                    <div><span className="text-slate-600">Phone:</span> {f('emergency_contact_phone')}</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-base">Next of Kin</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-slate-600">Name:</span> {f('next_of_kin_name')}</div>
                    <div><span className="text-slate-600">Phone:</span> {f('next_of_kin_phone')}</div>
                    <div className="col-span-2"><span className="text-slate-600">Relationship:</span> {f('next_of_kin_relationship')}</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-base">Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-slate-600">Status:</span> {f('status')}</div>
                    <div><span className="text-slate-600">Classes:</span> {selectedClasses.length > 0 ? `${selectedClasses.length} class(es)` : 'None'}</div>
                    <div className="col-span-2"><span className="text-slate-600">Subject Assignments:</span> {subjectAssignments.length > 0 ? `${subjectAssignments.length} assignment(s)` : 'None'}</div>
                  </div>
                </CardContent>
              </Card>

              {isAdmin && (
                <Card className="mb-6 border-amber-200 bg-amber-50">
                  <CardHeader>
                    <CardTitle className="text-base text-amber-900">Admin Only Fields</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Input 
                          label="Employee ID"
                          type="text" 
                          value={f('employee_id')} 
                          onChange={(e) => set('employee_id', e.target.value)}
                          placeholder="Auto-generated if empty"
                        />
                      </div>
                      <div>
                        <Select 
                          label="Status"
                          value={f('is_active')} 
                          onChange={(e) => set('is_active', e.target.value)}
                          options={[
                            { value: 'true', label: 'Active' },
                            { value: 'false', label: 'Inactive' },
                          ]}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between mt-8">
                <Button onClick={prevStep} variant="secondary">
                  ← Back
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : editId ? '💾 Save Changes' : '📤 Submit Application'}
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

    </div>
  );
}
