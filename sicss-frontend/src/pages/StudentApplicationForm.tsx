import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Button, Input, Select, Card, CardHeader, CardTitle, CardContent, Badge, LoadingState } from '../components/ui';

type FormData = Record<string, string>;

const EMPTY: FormData = {
  full_name: '', gender: '', date_of_birth: '', place_of_birth: '',
  nationality: 'Liberian', county: '', previous_school: '',
  address: '',
  father_name: '', mother_name: '', father_occupation: '', mother_occupation: '',
  father_contact: '', mother_contact: '', parent_address: '',
  has_illness: 'false', illness_details: '', emergency_contact_name: '',
  emergency_contact_phone: '', sports_interest: '', additional_notes: '',
  student_id: '', registration_number: '', class_assigned: '', admission_date: '',
  approved_by_registrar: '', approved_by_principal: '', approval_date: '',
  application_status: 'pending',
  username: '', default_password: '',
  photo_url: '',
};

const LIBERIAN_COUNTIES = [
  'Bomi', 'Bong', 'Gbarpolu', 'Grand Bassa', 'Grand Cape Mount',
  'Grand Gedeh', 'Grand Kru', 'Lofa', 'Margibi', 'Maryland',
  'Montserrado', 'Nimba', 'River Cess', 'River Gee', 'Sinoe',
];

function statusBadgeVariant(status: string): 'success' | 'warning' | 'danger' | 'default' {
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'danger';
  if (status === 'pending') return 'warning';
  return 'default';
}

export default function StudentApplicationForm() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get('id');

  const [form, setForm] = useState<FormData>(EMPTY);
  const [photoUrl, setPhotoUrl] = useState('');
  const [classId, setClassId] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [classes, setClasses] = useState<any[]>([]);
  const [createUserAccount, setCreateUserAccount] = useState(false);
  const [generatedUsername, setGeneratedUsername] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accountActive, setAccountActive] = useState(true);
  const [userPhone, setUserPhone] = useState('');
  const [userRole, setUserRole] = useState('STUDENT');

  useEffect(() => {
    api.get('/classes').then((res) => {
      const raw = res.data;
      setClasses(Array.isArray(raw) ? raw : raw.data ?? []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!editId) return;
    setLoading(true);
    api.get(`/students/${editId}`)
      .then((res) => {
        const s = res.data;
        setForm({
          full_name:               `${s.first_name} ${s.last_name}`.trim(),
          gender:                  s.gender   ?? '',
          date_of_birth:           s.date_of_birth?.slice?.(0, 10) ?? '',
          place_of_birth:          s.place_of_birth ?? '',
          nationality:             s.nationality ?? 'Liberian',
          county:                  s.county ?? '',
          previous_school:         s.previous_school ?? '',
          address:                 s.address ?? '',
          father_name:             s.father_name ?? '',
          mother_name:             s.mother_name ?? '',
          father_occupation:       s.father_occupation ?? '',
          mother_occupation:       s.mother_occupation ?? '',
          father_contact:          s.father_contact ?? '',
          mother_contact:          s.mother_contact ?? '',
          parent_address:          s.parent_address ?? '',
          has_illness:             s.has_illness ? 'true' : 'false',
          illness_details:         s.illness_details ?? '',
          emergency_contact_name:  s.emergency_contact_name ?? '',
          emergency_contact_phone: s.emergency_contact_phone ?? '',
          sports_interest:         s.sports_interest ?? '',
          additional_notes:        s.additional_notes ?? '',
          student_id:              s.student_id ?? '',
          registration_number:     s.registration_number ?? '',
          class_assigned:          s.class_assigned ?? s.class?.name ?? '',
          admission_date:          s.admission_date?.slice?.(0, 10) ?? '',
          approved_by_registrar:   s.approved_by_registrar ?? '',
          approved_by_principal:   s.approved_by_principal ?? '',
          approval_date:           s.approval_date?.slice?.(0, 10) ?? '',
          application_status:      s.application_status ?? 'pending',
          username:               s.user?.username ?? '',
          default_password:        '',
          photo_url:               s.photo_url || '',
        });
        if (s.photo_url) setPhotoUrl(s.photo_url);
        if (s.class_id) setClassId(String(s.class_id));
      })
      .catch(() => notify(false, 'Failed to load student record.'))
      .finally(() => setLoading(false));
  }, [editId]);

  const set = (key: string, value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    setMissingFields((fields) => fields.filter((field) => field !== key));
  };

  const notify = (ok: boolean, text: string) => {
    setMsg({ ok, text }); setTimeout(() => setMsg(null), 5000);
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const generateUsername = () => {
    const nameParts = form.full_name.trim().split(' ');
    const firstName = nameParts[0]?.toLowerCase() || 'student';
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
    set('username', generatedUsername || generateUsername());
    set('default_password', generatedPassword || generatePassword());
  };

  useEffect(() => {
    if (createUserAccount && !generatedUsername) {
      handleGenerateCredentials();
    }
  }, [createUserAccount]);

  const nextStep = () => {
    if (currentStep === 1) {
      const missing = [!form.full_name && 'full_name', !form.gender && 'gender', !form.date_of_birth && 'date_of_birth'].filter(Boolean) as string[];
      if (missing.length > 0) {
        setMissingFields(missing);
        notify(false, 'Please complete the required fields before proceeding.');
        return;
      }
      setMissingFields([]);
    }
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSave = async () => {
    const nameParts = form.full_name.trim().split(' ');
    const first_name = nameParts[0] || '';
    const last_name  = nameParts.slice(1).join(' ') || '_';

    const missing = [!first_name && 'full_name', !form.gender && 'gender', !form.date_of_birth && 'date_of_birth'].filter(Boolean) as string[];
    if (missing.length > 0) {
      setMissingFields(missing);
      notify(false, 'Please complete the highlighted fields before saving.');
      return;
    }
    setMissingFields([]);

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        first_name, last_name,
        gender:                  form.gender.toLowerCase(),   // API expects lowercase
        date_of_birth:           form.date_of_birth,
        place_of_birth:          form.place_of_birth,
        nationality:             form.nationality,
        county:                  form.county,
        previous_school:         form.previous_school,
        address:                 form.address,
        father_name:             form.father_name,
        mother_name:             form.mother_name,
        father_occupation:       form.father_occupation,
        mother_occupation:       form.mother_occupation,
        father_contact:          form.father_contact,
        mother_contact:          form.mother_contact,
        parent_address:          form.parent_address,
        parent_guardian_name:    form.father_name || form.mother_name,
        parent_guardian_phone:   form.father_contact || form.mother_contact,
        has_illness:             form.has_illness === 'true',
        illness_details:         form.illness_details,
        emergency_contact_name:  form.emergency_contact_name,
        emergency_contact_phone: form.emergency_contact_phone,
        sports_interest:         form.sports_interest,
        additional_notes:        form.additional_notes,
        photo_url:               photoUrl || undefined,
        status:                  'active',
        admission_date:          form.admission_date || new Date().toISOString().split('T')[0],
      };

      if (isAdmin) {
        payload.student_id          = form.student_id || undefined;
        payload.class_id            = classId ? Number(classId) : undefined;
        payload.class_assigned      = form.class_assigned;
        payload.approved_by_registrar = form.approved_by_registrar;
        payload.approved_by_principal = form.approved_by_principal;
        payload.approval_date       = form.approval_date || undefined;
        payload.application_status  = form.application_status;
        if (createUserAccount) {
          payload.username = generatedUsername || generateUsername();
          payload.password = generatedPassword || generatePassword();
          payload.phone = userPhone;
          payload.role_id = userRole;
          payload.is_active = accountActive;
        }
      } else {
        payload.student_id         = undefined;  // backend auto-generates STU-YYYY-NNN
        payload.application_status = 'pending';
      }

      if (editId) {
        await api.put(`/students/${editId}`, payload);
        notify(true, 'Application updated successfully and saved to the student database.');
        setForm(EMPTY);
        setPhotoUrl('');
        setClassId('');
        navigate('/application');
      } else {
        const res = await api.post('/students', payload);
        const saved = res.data;
        notify(true, `Application submitted and saved! Student ID: ${saved.student_id}. The admin will review your application.`);
        setForm(EMPTY);
        setPhotoUrl('');
        setClassId('');
      }
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      const msg = errors ? Object.values(errors).flat().join(' ') : (err.response?.data?.message || 'Failed to save. Please check all required fields.');
      notify(false, msg);
    } finally { setSaving(false); }
  };

  if (loading) return <LoadingState message="Loading application…" />;

  const f = (key: string) => form[key] ?? '';

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
                  <Badge variant={statusBadgeVariant(form.application_status)}>
                    {form.application_status.charAt(0).toUpperCase() + form.application_status.slice(1)}
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Student Application Form
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                {editId 
                  ? 'Edit the student application details below.'
                  : 'Complete all sections to submit a new student application.'}
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
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm ${
                currentStep >= step 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-200 text-slate-600'
              }`}>
                {currentStep > step ? '✓' : step}
              </div>
              {step < 4 && (
                <div className={`flex-1 h-1 mx-2 ${currentStep > step ? 'bg-blue-600' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-slate-600 mb-6">
          <span>Personal Info</span>
          <span>Parent Info</span>
          <span>Additional Info</span>
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
                    {photoUrl ? (
                      <img src={photoUrl} alt="Student" className="w-full h-full object-cover" />
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
                  />
                </div>
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
                  <Select 
                    label="Gender *"
                    value={f('gender')} 
                    onChange={(e) => set('gender', e.target.value)}
                    options={[
                      { value: '', label: 'Select Gender' },
                      { value: 'Male', label: 'Male' },
                      { value: 'Female', label: 'Female' },
                    ]}
                    error={missingFields.includes('gender') ? 'This field is required' : undefined}
                  />
                </div>

                <div>
                  <Input 
                    label="Date of Birth *"
                    type="date" 
                    value={f('date_of_birth')} 
                    onChange={(e) => set('date_of_birth', e.target.value)}
                    error={missingFields.includes('date_of_birth') ? 'This field is required' : undefined}
                    required
                  />
                </div>

                <div>
                  <Input 
                    label="Place of Birth"
                    type="text" 
                    value={f('place_of_birth')} 
                    onChange={(e) => set('place_of_birth', e.target.value)}
                    placeholder="City / Town"
                  />
                </div>

                <div>
                  <Input 
                    label="Nationality"
                    type="text" 
                    value={f('nationality')} 
                    onChange={(e) => set('nationality', e.target.value)}
                  />
                </div>

                <div>
                  <Select 
                    label="County"
                    value={f('county')} 
                    onChange={(e) => set('county', e.target.value)}
                    options={[
                      { value: '', label: 'Select County' },
                      ...LIBERIAN_COUNTIES.map((c) => ({ value: c, label: c }))
                    ]}
                  />
                </div>

                <div>
                  <Input 
                    label="Previous School"
                    type="text" 
                    value={f('previous_school')} 
                    onChange={(e) => set('previous_school', e.target.value)}
                    placeholder="Name of last school attended"
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
                <Button onClick={() => navigate('/students')} variant="secondary">
                  Cancel
                </Button>
                <Button onClick={nextStep} variant="primary" style={{ backgroundColor: '#2563EB', color: 'white' }}>
                  Next →
                </Button>
              </div>
            </CardContent>
          )}

          {/* Step 2: Parent/Guardian Information */}
          {currentStep === 2 && (
            <CardContent className="p-6 sm:p-8">
              <CardHeader className="p-0 mb-6">
                <CardTitle>Parent/Guardian Information</CardTitle>
              </CardHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input 
                    label="Father's Name"
                    type="text" 
                    value={f('father_name')} 
                    onChange={(e) => set('father_name', e.target.value)}
                  />
                </div>

                <div>
                  <Input 
                    label="Father's Occupation"
                    type="text" 
                    value={f('father_occupation')} 
                    onChange={(e) => set('father_occupation', e.target.value)}
                  />
                </div>

                <div>
                  <Input 
                    label="Father's Contact"
                    type="text" 
                    value={f('father_contact')} 
                    onChange={(e) => set('father_contact', e.target.value)}
                    placeholder="Phone number"
                  />
                </div>

                <div>
                  <Input 
                    label="Mother's Name"
                    type="text" 
                    value={f('mother_name')} 
                    onChange={(e) => set('mother_name', e.target.value)}
                  />
                </div>

                <div>
                  <Input 
                    label="Mother's Occupation"
                    type="text" 
                    value={f('mother_occupation')} 
                    onChange={(e) => set('mother_occupation', e.target.value)}
                  />
                </div>

                <div>
                  <Input 
                    label="Mother's Contact"
                    type="text" 
                    value={f('mother_contact')} 
                    onChange={(e) => set('mother_contact', e.target.value)}
                    placeholder="Phone number"
                  />
                </div>

                <div className="md:col-span-2">
                  <Input 
                    label="Parent Address"
                    type="text" 
                    value={f('parent_address')} 
                    onChange={(e) => set('parent_address', e.target.value)}
                    placeholder="Street, Community, City"
                  />
                </div>
              </div>

              <div className="flex justify-between mt-8 pt-4 border-t border-slate-200">
                <Button onClick={prevStep} variant="secondary">
                  ← Back
                </Button>
                <Button onClick={nextStep} variant="primary" style={{ backgroundColor: '#2563EB', color: 'white' }}>
                  Next →
                </Button>
              </div>
            </CardContent>
          )}

          {/* Step 3: Additional Information */}
          {currentStep === 3 && (
            <CardContent className="p-6 sm:p-8">
              <CardHeader className="p-0 mb-6">
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Select 
                    label="Does your child have any illness?"
                    value={f('has_illness')} 
                    onChange={(e) => set('has_illness', e.target.value)}
                    options={[
                      { value: 'false', label: 'No' },
                      { value: 'true', label: 'Yes' },
                    ]}
                  />
                </div>

                <div>
                  <Input 
                    label="If yes, please explain"
                    type="text" 
                    value={f('illness_details')} 
                    onChange={(e) => set('illness_details', e.target.value)}
                  />
                </div>

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
                  />
                </div>

                <div className="md:col-span-2">
                  <Input 
                    label="Sports / Extracurricular Interests"
                    type="text" 
                    value={f('sports_interest')} 
                    onChange={(e) => set('sports_interest', e.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <Input 
                    label="Additional Notes"
                    type="textarea" 
                    value={f('additional_notes')} 
                    onChange={(e) => set('additional_notes', e.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex justify-between mt-8 pt-4 border-t border-slate-200">
                <Button onClick={prevStep} variant="secondary">
                  ← Back
                </Button>
                <Button onClick={nextStep} variant="primary" style={{ backgroundColor: '#2563EB', color: 'white' }}>
                  Next →
                </Button>
              </div>
            </CardContent>
          )}

          {/* Step 4: Review & Submit */}
          {currentStep === 4 && (
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
                    <div><span className="text-slate-600">Gender:</span> {f('gender')}</div>
                    <div><span className="text-slate-600">DOB:</span> {f('date_of_birth')}</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-base">Parent Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-slate-600">Father:</span> {f('father_name')}</div>
                    <div><span className="text-slate-600">Mother:</span> {f('mother_name')}</div>
                    <div><span className="text-slate-600">Father Contact:</span> {f('father_contact')}</div>
                    <div><span className="text-slate-600">Mother Contact:</span> {f('mother_contact')}</div>
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

              {isAdmin && (
                <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-base text-blue-900 font-semibold">Admin Only Fields</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Application Status & Class */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Application Status</label>
                          <Select 
                            value={f('application_status')} 
                            onChange={(e) => set('application_status', e.target.value)}
                            options={[
                              { value: 'pending', label: 'Pending' },
                              { value: 'approved', label: 'Approved' },
                              { value: 'rejected', label: 'Rejected' },
                            ]}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Assign Class</label>
                          <Select 
                            value={classId} 
                            onChange={(e) => setClassId(e.target.value)}
                            options={[
                              { value: '', label: 'Select Class' },
                              ...classes.map((c) => ({ value: String(c.id), label: c.name }))
                            ]}
                          />
                        </div>
                      </div>

                      {/* User Account Section */}
                      <div className="bg-white rounded-lg border border-blue-100 overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-blue-100">
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
                          <div className="p-4 space-y-4">
                            {/* Email/Username */}
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">
                                Email / Username <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={generatedUsername}
                                readOnly
                                placeholder="isaac.l.quelemine@sicss.edu"
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
                                  { value: 'STUDENT', label: 'STUDENT' },
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
                                <span className="text-xs text-slate-500">Auto-generated · hand to student securely</span>
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between mt-8 pt-4 border-t border-slate-200">
                <Button onClick={prevStep} variant="secondary">
                  ← Back
                </Button>
                <Button onClick={handleSave} disabled={saving} variant="primary" style={{ backgroundColor: '#2563EB', color: 'white' }}>
                  {saving ? 'Saving…' : editId ? 'Save Changes' : 'Submit Application'}
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

    </div>
  );
}
