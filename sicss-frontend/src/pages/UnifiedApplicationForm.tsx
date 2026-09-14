import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Button, Input, Select, Card, CardContent, LoadingState } from '../components/ui';

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
  email: '', phone: '', qualification: '', subject_specialization: '',
  joining_date: '', employment_type: '', salary_structure_id: '', employee_id: '',
  qualification_document: '',
  next_of_kin_name: '', next_of_kin_phone: '', next_of_kin_relationship: '',
};

const LIBERIAN_COUNTIES = [
  'Bomi', 'Bong', 'Gbarpolu', 'Grand Bassa', 'Grand Cape Mount',
  'Grand Gedeh', 'Grand Kru', 'Lofa', 'Margibi', 'Maryland',
  'Montserrado', 'Nimba', 'River Cess', 'River Gee', 'Sinoe',
];

const EMPLOYMENT_TYPES = [
  'Full-time', 'Part-time', 'Contract', 'Internship',
];

const SUBJECT_SPECIALIZATIONS = [
  'Mathematics', 'English', 'Science', 'Social Studies',
  'Physical Education', 'Arts', 'Music', 'Computer Science',
];

const QUALIFICATIONS = [
  'High School Diploma', 'Teaching Certificate', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD',
];

export default function UnifiedApplicationForm() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const roleParam = searchParams.get('role');

  const [form, setForm] = useState<FormData>(EMPTY);
  const [photoUrl, setPhotoUrl] = useState('');
  const [qualificationDocumentUrl, setQualificationDocumentUrl] = useState('');
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [classId, setClassId] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [classes, setClasses] = useState<any[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<any[]>([]);
  const [createUserAccount, setCreateUserAccount] = useState(false);
  const [generatedUsername, setGeneratedUsername] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accountActive, setAccountActive] = useState(true);
  const [userPhone, setUserPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState(roleParam || 'student');

  const isStudentRole = selectedRole === 'student';
  const isTeacherRole = selectedRole === 'teacher';

  useEffect(() => {
    api.get('/classes').then((res) => {
      const raw = res.data;
      const classesData = Array.isArray(raw) ? raw : raw.data ?? [];
      // Remove duplicates based on class name
      const uniqueClasses = classesData.filter((classItem: any, index: number, self: any[]) =>
        index === self.findIndex((c: any) => c.name === classItem.name)
      );
      setClasses(uniqueClasses);
    }).catch(() => {});

    api.get('/salary-structures').then((res) => {
      const raw = res.data;
      setSalaryStructures(Array.isArray(raw) ? raw : raw.data ?? []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!editId) return;
    setLoading(true);
    const endpoint = isStudentRole ? `/students/${editId}` : `/teachers/${editId}`;
    api.get(endpoint)
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
          email:                  s.email ?? '',
          phone:                  s.phone ?? '',
          qualification:          s.qualification ?? '',
          subject_specialization:  s.subject_specialization ?? '',
          joining_date:            s.joining_date?.slice?.(0, 10) ?? '',
          employment_type:        s.employment_type ?? '',
          salary_structure_id:    s.salary_structure_id ?? '',
          employee_id:            s.employee_id ?? '',
          next_of_kin_name:       s.next_of_kin_name ?? '',
          next_of_kin_phone:      s.next_of_kin_phone ?? '',
          next_of_kin_relationship: s.next_of_kin_relationship ?? '',
        });
        if (s.photo_url) setPhotoUrl(s.photo_url);
        if (s.class_id) setClassId(String(s.class_id));
      })
      .catch(() => notify(false, 'Failed to load record.'))
      .finally(() => setLoading(false));
  }, [editId, isStudentRole]);

  const generateTeacherStaffId = () => {
    const year = new Date().getFullYear();
    const prefix = isTeacherRole ? 'TCH' : 'STF';
    // This is just a placeholder - the backend will generate the actual sequential ID
    return `${prefix}-${year}-0001`;
  };

  useEffect(() => {
    if (!editId && !isStudentRole && !form.employee_id) {
      set('employee_id', generateTeacherStaffId());
    }
  }, [selectedRole, isStudentRole]);

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

  const handleQualificationDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingDocument(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'credential');
      
      const response = await api.post('/upload/teacher-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setQualificationDocumentUrl(response.data.url);
      notify(true, 'Document uploaded successfully');
    } catch (err: any) {
      notify(false, err.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploadingDocument(false);
    }
  };

  const generateUsername = () => {
    const nameParts = form.full_name.trim().split(' ');
    const firstName = nameParts[0]?.toLowerCase() || 'user';
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
        const fieldNames = missing.map(f => f.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
        notify(false, `Please fill in the required field(s): ${fieldNames.join(', ')}`);
        return;
      }
      setMissingFields([]);
    }
    if (currentStep === 2) {
      const missing: string[] = [];
      if (!isStudentRole) {
        if (!form.email) missing.push('email');
        if (!form.phone) missing.push('phone');
        if (!form.qualification) missing.push('qualification');
        if (!form.joining_date) missing.push('hire date');
      } else {
        if (!form.father_name) missing.push("father's name");
        if (!form.father_contact) missing.push("father's contact");
      }
      if (missing.length > 0) {
        setMissingFields(missing);
        notify(false, `Please fill in the required field(s): ${missing.join(', ')}`);
        return;
      }
      setMissingFields([]);
    }
    if (currentStep === 3) {
      const missing: string[] = [];
      if (!form.emergency_contact_name) missing.push('emergency contact name');
      if (!form.emergency_contact_phone) missing.push('emergency contact phone');
      if (missing.length > 0) {
        setMissingFields(missing);
        notify(false, `Please fill in the required field(s): ${missing.join(', ')}`);
        return;
      }
      setMissingFields([]);
    }
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    const nameParts = form.full_name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const payload: any = {
      first_name: firstName,
      last_name: lastName,
      gender: form.gender,
      date_of_birth: form.date_of_birth,
      place_of_birth: form.place_of_birth,
      nationality: form.nationality,
      county: form.county,
      address: form.address,
      emergency_contact_name: form.emergency_contact_name,
      emergency_contact_phone: form.emergency_contact_phone,
      photo_url: photoUrl,
      application_status: form.application_status,
    };

    if (isStudentRole) {
      payload.previous_school = form.previous_school;
      payload.father_name = form.father_name;
      payload.mother_name = form.mother_name;
      payload.father_occupation = form.father_occupation;
      payload.mother_occupation = form.mother_occupation;
      payload.father_contact = form.father_contact;
      payload.mother_contact = form.mother_contact;
      payload.parent_address = form.parent_address;
      payload.has_illness = form.has_illness === 'true';
      payload.illness_details = form.illness_details;
      payload.sports_interest = form.sports_interest;
      payload.additional_notes = form.additional_notes;
      payload.class_id = classId;
    } else {
      payload.email = form.email;
      payload.phone = form.phone;
      payload.qualifications = form.qualification;
      payload.specialization = form.subject_specialization;
      payload.hire_date = form.joining_date;
      payload.salary_structure_id = form.salary_structure_id;
      payload.employee_id = form.employee_id;
      payload.credential_image_path = qualificationDocumentUrl;
      payload.role = isTeacherRole ? 'TEACHER' : 'STAFF';
    }

    if (createUserAccount) {
      payload.username = form.username;
      payload.password = form.default_password;
      payload.phone = userPhone;
      payload.role = isStudentRole ? 'STUDENT' : (isTeacherRole ? 'TEACHER' : 'STAFF');
      payload.is_active = accountActive;
    }

    try {
      if (editId) {
        await api.put(isStudentRole ? `/students/${editId}` : `/teachers/${editId}`, payload);
        notify(true, 'Application updated successfully.');
      } else {
        await api.post(isStudentRole ? '/students' : '/teachers', payload);
        notify(true, 'Application submitted successfully.');
        setForm(EMPTY);
        setPhotoUrl('');
        setQualificationDocumentUrl('');
        setClassId('');
        setCurrentStep(1);
      }
    } catch (err: any) {
      console.error('Save error:', err);
      console.error('Response data:', err.response?.data);
      console.error('Payload:', payload);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to save application.';
      notify(false, errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {editId ? 'Edit Application' : 'New Application'}
          </h1>
          <p className="text-sm text-slate-500">
            {isStudentRole ? 'Student Application Form' : 'Staff Application Form'}
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            options={[
              { value: 'student', label: 'Student' },
              { value: 'teacher', label: 'Teacher' },
              { value: 'staff', label: 'Staff' },
            ]}
          />
        </div>
      </div>

      {msg && (
        <div className={`rounded-lg px-4 py-3 ${msg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          {/* Progress Steps */}
          <div className="mb-8 flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  currentStep >= step ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {step}
                </div>
                {step < 4 && <div className="h-0.5 w-16 bg-slate-200" />}
              </div>
            ))}
          </div>

          <div>
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={form.full_name}
                      onChange={(e) => set('full_name', e.target.value)}
                      placeholder="First and Last Name"
                      className={missingFields.includes('full_name') ? 'border-red-500' : ''}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={form.gender}
                      onChange={(e) => set('gender', e.target.value)}
                      options={[
                        { value: '', label: 'Select gender' },
                        { value: 'Male', label: 'Male' },
                        { value: 'Female', label: 'Female' },
                      ]}
                      className={missingFields.includes('gender') ? 'border-red-500' : ''}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="date"
                      value={form.date_of_birth}
                      onChange={(e) => set('date_of_birth', e.target.value)}
                      className={missingFields.includes('date_of_birth') ? 'border-red-500' : ''}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Place of Birth
                    </label>
                    <Input
                      value={form.place_of_birth}
                      onChange={(e) => set('place_of_birth', e.target.value)}
                      placeholder="City, Country"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Nationality
                    </label>
                    <Select
                      value={form.nationality}
                      onChange={(e) => set('nationality', e.target.value)}
                      options={[
                        { value: 'Liberian', label: 'Liberian' },
                        { value: 'Other', label: 'Other' },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      County
                    </label>
                    <Select
                      value={form.county}
                      onChange={(e) => set('county', e.target.value)}
                      options={[
                        { value: '', label: 'Select county' },
                        ...LIBERIAN_COUNTIES.map((c) => ({ value: c, label: c })),
                      ]}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Address
                    </label>
                    <Input
                      value={form.address}
                      onChange={(e) => set('address', e.target.value)}
                      placeholder="Residential address"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Role-Specific Information */}
            {currentStep === 2 && (
              <>
                {!isStudentRole && (
                  <div className="border-b border-slate-200 pb-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Staff Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="email"
                          value={form.email}
                          onChange={(e) => set('email', e.target.value)}
                          placeholder="email@example.com"
                          className={missingFields.includes('email') ? 'border-red-500' : ''}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Phone <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="text"
                          value={form.phone}
                          onChange={(e) => set('phone', e.target.value)}
                          placeholder="+231..."
                          className={missingFields.includes('phone') ? 'border-red-500' : ''}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Qualification <span className="text-red-500">*</span>
                        </label>
                        <Select
                          value={form.qualification}
                          onChange={(e) => set('qualification', e.target.value)}
                          options={[
                            { value: '', label: 'Select qualification' },
                            ...QUALIFICATIONS.map((q) => ({ value: q, label: q })),
                          ]}
                          className={missingFields.includes('qualification') ? 'border-red-500' : ''}
                        />
                      </div>

                      {isTeacherRole && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Subject Specialization
                          </label>
                          <Select
                            value={form.subject_specialization}
                            onChange={(e) => set('subject_specialization', e.target.value)}
                            options={[
                              { value: '', label: 'Select subject' },
                              ...SUBJECT_SPECIALIZATIONS.map((s) => ({ value: s, label: s })),
                            ]}
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Hire Date <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="date"
                          value={form.joining_date}
                          onChange={(e) => set('joining_date', e.target.value)}
                          className={missingFields.includes('joining_date') ? 'border-red-500' : ''}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Employment Type
                        </label>
                        <Select
                          value={form.employment_type}
                          onChange={(e) => set('employment_type', e.target.value)}
                          options={[
                            { value: '', label: 'Select type' },
                            ...EMPLOYMENT_TYPES.map((t) => ({ value: t, label: t })),
                          ]}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Salary Structure
                        </label>
                        <Select
                          value={form.salary_structure_id}
                          onChange={(e) => set('salary_structure_id', e.target.value)}
                          options={[
                            { value: '', label: 'Select structure' },
                            ...salaryStructures.map((s) => ({ value: String(s.id), label: s.name })),
                          ]}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          {isTeacherRole ? 'Teacher ID' : 'Staff ID'}
                        </label>
                        <Input
                          value={form.employee_id}
                          onChange={(e) => set('employee_id', e.target.value)}
                          placeholder={isTeacherRole ? 'TCH-XXXX' : 'STF-XXXX'}
                          readOnly
                          className="bg-slate-100"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Qualification Document (Optional)
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                          onChange={handleQualificationDocument}
                          disabled={uploadingDocument}
                          className="mb-2"
                        />
                        {uploadingDocument && (
                          <p className="text-xs text-blue-600">Uploading...</p>
                        )}
                        {qualificationDocumentUrl && !uploadingDocument && (
                          <p className="text-xs text-green-600">Document uploaded successfully</p>
                        )}
                        <p className="text-xs text-slate-500">Upload qualification document (PDF, DOC, DOCX, PNG, JPG)</p>
                      </div>
                    </div>
                  </div>
                )}

                {isStudentRole && (
                  <div className="border-b border-slate-200 pb-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Student Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Previous School
                        </label>
                        <Input
                          value={form.previous_school}
                          onChange={(e) => set('previous_school', e.target.value)}
                          placeholder="Name of previous school"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Class
                        </label>
                        <Select
                          value={classId}
                          onChange={(e) => setClassId(e.target.value)}
                          options={[
                            { value: '', label: 'Select class' },
                            ...classes.map((c) => ({ value: String(c.id), label: c.name })),
                          ]}
                        />
                      </div>
                    </div>

                    <h3 className="text-md font-semibold text-slate-900 mt-6 mb-4">Parent/Guardian Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Father's Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={form.father_name}
                          onChange={(e) => set('father_name', e.target.value)}
                          placeholder="Father's full name"
                          className={missingFields.includes('father_name') ? 'border-red-500' : ''}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Mother's Name
                        </label>
                        <Input
                          value={form.mother_name}
                          onChange={(e) => set('mother_name', e.target.value)}
                          placeholder="Mother's full name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Father's Occupation
                        </label>
                        <Input
                          value={form.father_occupation}
                          onChange={(e) => set('father_occupation', e.target.value)}
                          placeholder="Father's occupation"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Mother's Occupation
                        </label>
                        <Input
                          value={form.mother_occupation}
                          onChange={(e) => set('mother_occupation', e.target.value)}
                          placeholder="Mother's occupation"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Father's Contact <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={form.father_contact}
                          onChange={(e) => set('father_contact', e.target.value)}
                          placeholder="+231..."
                          className={missingFields.includes('father_contact') ? 'border-red-500' : ''}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Mother's Contact
                        </label>
                        <Input
                          value={form.mother_contact}
                          onChange={(e) => set('mother_contact', e.target.value)}
                          placeholder="+231..."
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Parent Address
                        </label>
                        <Input
                          value={form.parent_address}
                          onChange={(e) => set('parent_address', e.target.value)}
                          placeholder="Parent's residential address"
                        />
                      </div>
                    </div>

                    <h3 className="text-md font-semibold text-slate-900 mt-6 mb-4">Medical Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={form.has_illness === 'true'}
                            onChange={(e) => set('has_illness', e.target.checked ? 'true' : 'false')}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                          <span className="text-sm font-medium text-slate-700">Has any illness or medical condition?</span>
                        </label>
                      </div>

                      {form.has_illness === 'true' && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Illness Details
                          </label>
                          <Input
                            value={form.illness_details}
                            onChange={(e) => set('illness_details', e.target.value)}
                            placeholder="Describe the illness or condition"
                          />
                        </div>
                      )}
                    </div>

                    <h3 className="text-md font-semibold text-slate-900 mt-6 mb-4">Additional Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Sports Interest
                        </label>
                        <Input
                          value={form.sports_interest}
                          onChange={(e) => set('sports_interest', e.target.value)}
                          placeholder="Sports activities of interest"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Additional Notes
                        </label>
                        <Input
                          value={form.additional_notes}
                          onChange={(e) => set('additional_notes', e.target.value)}
                          placeholder="Any additional information"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Step 3: Emergency Contact */}
            {currentStep === 3 && (
              <>
                <div className="border-b border-slate-200 pb-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Emergency Contact</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Emergency Contact Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={form.emergency_contact_name}
                        onChange={(e) => set('emergency_contact_name', e.target.value)}
                        placeholder="Emergency contact person"
                        className={missingFields.includes('emergency_contact_name') ? 'border-red-500' : ''}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Emergency Contact Phone <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={form.emergency_contact_phone}
                        onChange={(e) => set('emergency_contact_phone', e.target.value)}
                        placeholder="+231..."
                        className={missingFields.includes('emergency_contact_phone') ? 'border-red-500' : ''}
                      />
                    </div>

                    {!isStudentRole && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Next of Kin Name
                          </label>
                          <Input
                            value={form.next_of_kin_name}
                            onChange={(e) => set('next_of_kin_name', e.target.value)}
                            placeholder="Next of kin name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Next of Kin Phone
                          </label>
                          <Input
                            value={form.next_of_kin_phone}
                            onChange={(e) => set('next_of_kin_phone', e.target.value)}
                            placeholder="+231..."
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Next of Kin Relationship
                          </label>
                          <Input
                            value={form.next_of_kin_relationship}
                            onChange={(e) => set('next_of_kin_relationship', e.target.value)}
                            placeholder="e.g., Spouse, Sibling, Parent"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Photo Upload */}
                <div className="border-b border-slate-200 pb-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Photo</h2>
                  <div className="flex items-start gap-4">
                    {photoUrl ? (
                      <img src={photoUrl} alt="Profile" className="h-24 w-24 rounded-lg object-cover border border-slate-200" />
                    ) : (
                      <div className="h-24 w-24 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400">
                        No photo
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhoto}
                        className="mb-2"
                      />
                      <p className="text-xs text-slate-500">Upload a passport-sized photo (JPG, PNG)</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Review & Submit */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h2 className="text-lg font-semibold text-blue-900 mb-2">📋 Review Your Application</h2>
                  <p className="text-sm text-blue-700">Please review all information below before submitting. You can go back to make changes if needed.</p>
                </div>
                
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">1</span>
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-slate-500">Full Name:</span> <span className="font-medium">{form.full_name}</span></div>
                    <div><span className="text-slate-500">Gender:</span> <span className="font-medium">{form.gender}</span></div>
                    <div><span className="text-slate-500">Date of Birth:</span> <span className="font-medium">{form.date_of_birth}</span></div>
                    <div><span className="text-slate-500">Place of Birth:</span> <span className="font-medium">{form.place_of_birth}</span></div>
                    <div><span className="text-slate-500">Nationality:</span> <span className="font-medium">{form.nationality}</span></div>
                    <div><span className="text-slate-500">County:</span> <span className="font-medium">{form.county}</span></div>
                    <div className="col-span-2"><span className="text-slate-500">Address:</span> <span className="font-medium">{form.address}</span></div>
                  </div>
                </div>

                {isStudentRole && (
                  <>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <h3 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">2</span>
                        Student Information
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-slate-500">Previous School:</span> <span className="font-medium">{form.previous_school}</span></div>
                        <div><span className="text-slate-500">Class:</span> <span className="font-medium">{classes.find(c => c.id === Number(classId))?.name}</span></div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <h3 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">3</span>
                        Parent/Guardian Information
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-slate-500">Father's Name:</span> <span className="font-medium">{form.father_name}</span></div>
                        <div><span className="text-slate-500">Mother's Name:</span> <span className="font-medium">{form.mother_name}</span></div>
                        <div><span className="text-slate-500">Father's Contact:</span> <span className="font-medium">{form.father_contact}</span></div>
                        <div><span className="text-slate-500">Mother's Contact:</span> <span className="font-medium">{form.mother_contact}</span></div>
                        <div className="col-span-2"><span className="text-slate-500">Parent Address:</span> <span className="font-medium">{form.parent_address}</span></div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <h3 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">4</span>
                        Emergency Contact
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-slate-500">Emergency Contact Name:</span> <span className="font-medium">{form.emergency_contact_name}</span></div>
                        <div><span className="text-slate-500">Emergency Contact Phone:</span> <span className="font-medium">{form.emergency_contact_phone}</span></div>
                      </div>
                    </div>
                  </>
                )}

                {!isStudentRole && (
                  <>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <h3 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">2</span>
                        Staff Information
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-slate-500">Email:</span> <span className="font-medium">{form.email}</span></div>
                        <div><span className="text-slate-500">Phone:</span> <span className="font-medium">{form.phone}</span></div>
                        <div><span className="text-slate-500">Qualification:</span> <span className="font-medium">{form.qualification}</span></div>
                        <div><span className="text-slate-500">Specialization:</span> <span className="font-medium">{form.subject_specialization}</span></div>
                        <div><span className="text-slate-500">Joining Date:</span> <span className="font-medium">{form.joining_date}</span></div>
                        <div><span className="text-slate-500">Employment Type:</span> <span className="font-medium">{form.employment_type}</span></div>
                        <div><span className="text-slate-500">{isTeacherRole ? 'Teacher ID' : 'Staff ID'}:</span> <span className="font-medium">{form.employee_id}</span></div>
                        <div><span className="text-slate-500">Qualification Document:</span> <span className="font-medium">{qualificationDocumentUrl ? 'Uploaded' : 'Not uploaded'}</span></div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <h3 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">3</span>
                        Next of Kin
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-slate-500">Name:</span> <span className="font-medium">{form.next_of_kin_name}</span></div>
                        <div><span className="text-slate-500">Phone:</span> <span className="font-medium">{form.next_of_kin_phone}</span></div>
                        <div className="col-span-2"><span className="text-slate-500">Relationship:</span> <span className="font-medium">{form.next_of_kin_relationship}</span></div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <h3 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">4</span>
                        Emergency Contact
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-slate-500">Emergency Contact Name:</span> <span className="font-medium">{form.emergency_contact_name}</span></div>
                        <div><span className="text-slate-500">Emergency Contact Phone:</span> <span className="font-medium">{form.emergency_contact_phone}</span></div>
                      </div>
                    </div>
                  </>
                )}

                {/* User Account Creation */}
                {isAdmin && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-slate-900 flex items-center gap-2">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">5</span>
                        Create User Account
                      </h3>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={createUserAccount}
                          onChange={(e) => setCreateUserAccount(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">Enable</span>
                      </label>
                    </div>

                    {createUserAccount && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                            <Input
                              value={form.username}
                              onChange={(e) => set('username', e.target.value)}
                              placeholder="Username"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone (for SMS)</label>
                            <Input
                              value={userPhone}
                              onChange={(e) => setUserPhone(e.target.value)}
                              placeholder="+231..."
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                          <div className="flex gap-2">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              value={form.default_password}
                              onChange={(e) => set('default_password', e.target.value)}
                              placeholder="Password"
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? 'Hide' : 'Show'}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={handleGenerateCredentials}
                            >
                              Generate
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={accountActive}
                              onChange={(e) => setAccountActive(e.target.checked)}
                              className="h-4 w-4 rounded border-slate-300"
                            />
                            <span className="text-sm text-slate-700">Account Active</span>
                          </label>
                        </div>
                        {createUserAccount && (
                          <div className="mt-4 flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => {
                                const accountInfo = `
User Account Information
========================
Username: ${form.username}
Password: ${form.default_password}
Phone: ${userPhone}
Role: ${isStudentRole ? 'STUDENT' : (isTeacherRole ? 'TEACHER' : 'STAFF')}
Status: ${accountActive ? 'Active' : 'Inactive'}
                                `.trim();
                                const blob = new Blob([accountInfo], { type: 'text/plain' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `account-info-${form.username}.txt`;
                                a.click();
                                URL.revokeObjectURL(url);
                              }}
                            >
                              Download Info
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => {
                                const accountInfo = `
User Account Information
========================
Username: ${form.username}
Password: ${form.default_password}
Phone: ${userPhone}
Role: ${isStudentRole ? 'STUDENT' : (isTeacherRole ? 'TEACHER' : 'STAFF')}
Status: ${accountActive ? 'Active' : 'Inactive'}
                                `.trim();
                                const printWindow = window.open('', '_blank');
                                if (printWindow) {
                                  printWindow.document.write(`<pre>${accountInfo}</pre>`);
                                  printWindow.document.close();
                                  printWindow.print();
                                }
                              }}
                            >
                              Print Info
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    ⚠️ <strong>Important:</strong> Once you submit, your application will be saved. Please ensure all information is correct before proceeding.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between sticky bottom-0 bg-white py-4 border-t border-slate-200">
              <Button
                type="button"
                className="bg-blue-600 text-white hover:bg-blue-700"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                ← Previous
              </Button>

              {currentStep < 4 ? (
                <Button type="button" className="bg-blue-600 text-white hover:bg-blue-700" onClick={nextStep}>
                  Next →
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} disabled={saving} className="bg-blue-600 text-white hover:bg-blue-700">
                  {saving ? 'Submitting...' : editId ? 'Update Application' : 'Submit Application'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
