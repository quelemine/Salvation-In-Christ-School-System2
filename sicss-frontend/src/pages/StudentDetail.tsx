import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSettingsStore } from '../store/settingsStore';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Tabs, TabsList, TabsTrigger, TabsContent, LoadingState } from '../components/ui';

interface Student {
  id: number;
  student_id?: string;
  first_name: string;
  last_name: string;
  gender?: string;
  date_of_birth?: string;
  place_of_birth?: string;
  nationality?: string;
  county?: string;
  phone?: string;
  address?: string;
  previous_school?: string;
  admission_date?: string;
  application_status?: string;
  registration_number?: string;
  status?: string;
  father_name?: string;
  father_occupation?: string;
  father_contact?: string;
  mother_name?: string;
  mother_occupation?: string;
  mother_contact?: string;
  parent_address?: string;
  parent_guardian_name?: string;
  parent_guardian_phone?: string;
  parent_guardian_email?: string;
  has_illness?: boolean;
  illness_details?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  sports_interest?: string;
  additional_notes?: string;
  user?: {
    user_code?: string;
  };
  class?: {
    name: string;
  };
}

export default function StudentDetail() {
  const { studentId: paramStudentId } = useParams<{ studentId: string }>();
  const { settings } = useSettingsStore();
  const { branding, system } = settings;
  
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showIdCard, setShowIdCard] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (paramStudentId) {
      loadStudent(paramStudentId);
    }
  }, [paramStudentId]);

  const loadStudent = async (id: string) => {
    try {
      const response = await api.get(`/students/${id}`);
      setStudent(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load student information');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintIdCard = () => {
    setShowIdCard(true);
    setTimeout(() => {
      window.print();
      setShowIdCard(false);
    }, 100);
  };

  const handlePrintProfile = () => {
    window.print();
  };

  if (loading) {
    return <LoadingState message="Loading student information…" />;
  }

  if (error || !student) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="text-sm text-rose-800 mb-4">{error || 'Student not found'}</p>
        <div className="flex justify-center gap-2">
          <Button onClick={() => paramStudentId && loadStudent(paramStudentId)} variant="secondary">Try Again</Button>
          <Link to="/students">
            <Button variant="secondary">Back to Students</Button>
          </Link>
        </div>
      </div>
    );
  }

  const studentId = student.user?.user_code || student.student_id || 'N/A';
  const fullName = `${student.first_name} ${student.last_name}`;

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; }
          .id-card-print { 
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999 !important;
            background: white !important;
          }
          .profile-print { display: block !important; }
          .id-card-hide { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between no-print">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Student Profile</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{fullName}</h1>
          <p className="mt-1 text-sm text-slate-500">Student ID: {studentId}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handlePrintProfile} variant="secondary">
            🖨️ Print Profile
          </Button>
          <Button onClick={handlePrintIdCard} variant="secondary">
            🆔 Print ID Card
          </Button>
          <Link to="/students">
            <Button variant="secondary">← Back to List</Button>
          </Link>
        </div>
      </div>

      {/* ID Card Preview (shown when printing ID card) */}
      {showIdCard && (
        <div className="id-card-print fixed inset-0 bg-white p-8 flex items-center justify-center">
          <div className="w-[85.6mm] h-[53.98mm] bg-gradient-to-br from-cyan-600 to-cyan-800 rounded-lg shadow-2xl p-4 text-white relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
            </div>
            
            {/* School Logo/Name */}
            <div className="relative z-10 flex items-center gap-2 mb-3">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt="Logo" className="h-10 w-10 rounded-lg object-contain bg-white/20 p-1" />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center font-bold text-lg">
                  {system.systemName.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold leading-tight truncate">{system.systemName}</p>
                <p className="text-[8px] opacity-80 truncate">{branding.schoolSubtitle || 'School Management System'}</p>
              </div>
            </div>

            {/* Student Photo Placeholder */}
            <div className="relative z-10 flex items-center gap-3 mb-3">
              <div className="h-16 w-16 rounded-lg bg-white/20 flex items-center justify-center text-2xl font-bold">
                {student.first_name.charAt(0)}{student.last_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold leading-tight truncate">{fullName}</p>
                <p className="text-[10px] opacity-80">ID: {studentId}</p>
                <p className="text-[10px] opacity-80">{student.class?.name || 'N/A'}</p>
              </div>
            </div>

            {/* Student Details */}
            <div className="relative z-10 grid grid-cols-2 gap-1 text-[9px]">
              <div>
                <p className="opacity-60">Gender:</p>
                <p className="font-semibold capitalize">{student.gender || 'N/A'}</p>
              </div>
              <div>
                <p className="opacity-60">DOB:</p>
                <p className="font-semibold">{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="opacity-60">Status:</p>
                <p className="font-semibold capitalize">{student.status || 'Active'}</p>
              </div>
              <div>
                <p className="opacity-60">Year:</p>
                <p className="font-semibold">{system.academicYear}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-2 left-4 right-4 z-10">
              <p className="text-[8px] text-center opacity-60">{branding.schoolAddress || 'School Address'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Header Card */}
      <Card className={`no-print ${showIdCard ? 'id-card-hide' : ''}`}>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="h-20 w-20 rounded-xl bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-700">
              {student.first_name.charAt(0)}{student.last_name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-slate-900">{fullName}</h2>
                <Badge variant={student.application_status === 'approved' ? 'success' : student.application_status === 'rejected' ? 'danger' : 'warning'}>
                  {student.application_status || 'Pending'}
                </Badge>
                <Badge variant={student.status === 'active' ? 'success' : 'default'}>
                  {student.status || 'Active'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Student ID</p>
                  <p className="font-semibold text-slate-900 font-mono">{studentId}</p>
                </div>
                <div>
                  <p className="text-slate-500">Class</p>
                  <p className="font-semibold text-slate-900">{student.class?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Admission Date</p>
                  <p className="font-semibold text-slate-900">{student.admission_date ? new Date(student.admission_date).toLocaleDateString() : '—'}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs className="no-print">
        <TabsList>
          <TabsTrigger value="overview" activeValue={activeTab} onClick={setActiveTab}>Overview</TabsTrigger>
          <TabsTrigger value="personal" activeValue={activeTab} onClick={setActiveTab}>Personal Information</TabsTrigger>
          <TabsTrigger value="guardian" activeValue={activeTab} onClick={setActiveTab}>Guardian</TabsTrigger>
          <TabsTrigger value="health" activeValue={activeTab} onClick={setActiveTab}>Health & Emergency</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" activeValue={activeTab}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Full Name</span>
                    <span className="font-semibold text-slate-900">{fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Student ID</span>
                    <span className="font-semibold text-slate-900 font-mono">{studentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date of Birth</span>
                    <span className="font-semibold text-slate-900">{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gender</span>
                    <span className="font-semibold text-slate-900 capitalize">{student.gender || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone</span>
                    <span className="font-semibold text-slate-900">{student.phone || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Address</span>
                    <span className="font-semibold text-slate-900">{student.address || '—'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Academic Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Class</span>
                    <span className="font-semibold text-slate-900">{student.class?.name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Academic Year</span>
                    <span className="font-semibold text-slate-900">{system.academicYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Enrollment Date</span>
                    <span className="font-semibold text-slate-900">{student.admission_date ? new Date(student.admission_date).toLocaleDateString() : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status</span>
                    <span className="font-semibold text-slate-900 capitalize">{student.status || 'Active'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Guardian Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Guardian Name</span>
                    <span className="font-semibold text-slate-900">{student.parent_guardian_name || student.father_name || student.mother_name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Relationship</span>
                    <span className="font-semibold text-slate-900">Parent/Guardian</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone</span>
                    <span className="font-semibold text-slate-900">{student.parent_guardian_phone || student.father_contact || student.mother_contact || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email</span>
                    <span className="font-semibold text-slate-900">{student.parent_guardian_email || '—'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Attendance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 rounded-lg bg-emerald-50">
                    <p className="text-2xl font-bold text-emerald-600">—</p>
                    <p className="text-sm text-slate-500">Present</p>
                  </div>
                  <div className="p-4 rounded-lg bg-rose-50">
                    <p className="text-2xl font-bold text-rose-600">—</p>
                    <p className="text-sm text-slate-500">Absent</p>
                  </div>
                  <div className="p-4 rounded-lg bg-amber-50">
                    <p className="text-2xl font-bold text-amber-600">—</p>
                    <p className="text-sm text-slate-500">Late</p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-50">
                    <p className="text-2xl font-bold text-blue-600">—</p>
                    <p className="text-sm text-slate-500">Excused</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="personal" activeValue={activeTab}>
          <Card className={`profile-print ${showIdCard ? 'id-card-hide' : ''}`}>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoCard label="Student ID" value={studentId} />
              <InfoCard label="Full Name" value={fullName} />
              <InfoCard label="Gender" value={student.gender || '—'} />
              <InfoCard label="Date of Birth" value={student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : '—'} />
              <InfoCard label="Place of Birth" value={student.place_of_birth || '—'} />
              <InfoCard label="Nationality" value={student.nationality || '—'} />
              <InfoCard label="County" value={student.county || '—'} />
              <InfoCard label="Phone" value={student.phone || '—'} />
              <InfoCard label="Address" value={student.address || '—'} />
            </div>
          </CardContent>
        </Card>

        <Card className={`profile-print ${showIdCard ? 'id-card-hide' : ''}`}>
          <CardHeader>
            <CardTitle>School Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoCard label="Class" value={student.class?.name || '—'} />
              <InfoCard label="Previous School" value={student.previous_school || '—'} />
              <InfoCard label="Admission Date" value={student.admission_date ? new Date(student.admission_date).toLocaleDateString() : '—'} />
              <InfoCard label="Application Status" value={student.application_status || '—'} />
              <InfoCard label="Registration Number" value={student.registration_number || '—'} />
              <InfoCard label="Current Status" value={student.status || '—'} />
            </div>
          </CardContent>
        </Card>

        </TabsContent>

        <TabsContent value="guardian" activeValue={activeTab}>
          <Card className={`profile-print ${showIdCard ? 'id-card-hide' : ''}`}>
            <CardHeader>
              <CardTitle>Parent/Guardian Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <InfoCard label="Guardian Name" value={student.parent_guardian_name || '—'} />
                <InfoCard label="Guardian Phone" value={student.parent_guardian_phone || '—'} />
                <InfoCard label="Guardian Email" value={student.parent_guardian_email || '—'} />
                <InfoCard label="Father Name" value={student.father_name || '—'} />
                <InfoCard label="Father Occupation" value={student.father_occupation || '—'} />
                <InfoCard label="Father Contact" value={student.father_contact || '—'} />
                <InfoCard label="Mother Name" value={student.mother_name || '—'} />
                <InfoCard label="Mother Occupation" value={student.mother_occupation || '—'} />
                <InfoCard label="Mother Contact" value={student.mother_contact || '—'} />
                <InfoCard label="Parent Address" value={student.parent_address || '—'} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" activeValue={activeTab}>
          <Card className={`profile-print ${showIdCard ? 'id-card-hide' : ''}`}>

          <CardHeader>
            <CardTitle>Health & Emergency Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoCard label="Medical Condition" value={student.has_illness ? 'Yes' : 'No'} />
              <InfoCard label="Medical Details" value={student.illness_details || '—'} />
              <InfoCard label="Emergency Contact" value={student.emergency_contact_name || '—'} />
              <InfoCard label="Emergency Phone" value={student.emergency_contact_phone || '—'} />
              <InfoCard label="Sports Interest" value={student.sports_interest || '—'} />
              <InfoCard label="Additional Notes" value={student.additional_notes || '—'} />
            </div>
          </CardContent>
        </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-slate-800">{value || '—'}</dd>
    </div>
  );
}
