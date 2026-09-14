import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentService } from '../services/studentService';
import { useAuthStore } from '../store/authStore';
import type { Student } from '../types';
import { syncManager } from '../sync/syncManager';
import api from '../services/api';
import { Button, Input, Select, Badge, Table, TableHeader, TableBody, TableRow, TableCell, TableHead, LoadingState, EmptyState } from '../components/ui';

// ── Main Students page ────────────────────────────────────────────────────────
export default function Students() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';
  const isStudent = user?.role?.slug === 'student';
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterApplicationStatus, setFilterApplicationStatus] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'student_id', 'name', 'gender', 'class', 'status'
  ]);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [approvalError, setApprovalError] = useState('');
  const [approvingId, setApprovingId] = useState<number | null>(null);

  useEffect(() => {
    if (isStudent) {
      // Load student's own application record
      api.get('/student-portal/profile')
        .then((response) => setStudentProfile(response.data))
        .catch(() => setStudentProfile(null));
      setLoading(false);
    } else {
      loadStudents();
    }
    const up = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, [isStudent]);

  const loadStudents = async () => {
    try {
      const response = await studentService.getAll();
      setStudents((response as any).data || (response as any).data?.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load students. Please try again.');
    } finally { setLoading(false); }
  };

  const handleSync = async () => { await syncManager.sync(); loadStudents(); };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this student record?')) return;
    try { await studentService.delete(id); setStudents((s) => s.filter((x) => x.id !== id)); }
    catch { /* silent */ }
  };

  const handleApprove = async (id: number) => {
    setApprovalError('');
    setApprovingId(id);
    try {
      await api.post(`/students/${id}/approve`, {
        application_status: 'approved',
      });
      navigate(`/users/account/student/${id}`);
    } catch (error: any) {
      setApprovalError(error.response?.data?.message || 'Unable to approve this student. Please try again.');
    } finally {
      setApprovingId(null);
    }
  };

  const handleCreateLogin = (student: Student) => {
    navigate(`/users/account/student/${student.id}`);
  };

  const availableFields = [
    { key: 'student_id', label: 'Student ID' },
    { key: 'name', label: 'Full Name' },
    { key: 'gender', label: 'Gender' },
    { key: 'date_of_birth', label: 'Date of Birth' },
    { key: 'nationality', label: 'Nationality' },
    { key: 'county', label: 'County' },
    { key: 'previous_school', label: 'Previous School' },
    { key: 'address', label: 'Address' },
    { key: 'father_name', label: "Father's Name" },
    { key: 'mother_name', label: "Mother's Name" },
    { key: 'father_occupation', label: "Father's Occupation" },
    { key: 'mother_occupation', label: "Mother's Occupation" },
    { key: 'father_contact', label: "Father's Contact" },
    { key: 'mother_contact', label: "Mother's Contact" },
    { key: 'parent_address', label: 'Parent Address' },
    { key: 'has_illness', label: 'Has Illness' },
    { key: 'emergency_contact_name', label: 'Emergency Contact Name' },
    { key: 'emergency_contact_phone', label: 'Emergency Contact Phone' },
    { key: 'sports_interest', label: 'Sports Interest' },
    { key: 'additional_notes', label: 'Additional Notes' },
    { key: 'class', label: 'Class' },
    { key: 'admission_date', label: 'Admission Date' },
    { key: 'approved_by_registrar', label: 'Approved by Registrar' },
    { key: 'approved_by_principal', label: 'Approved by Principal' },
    { key: 'approval_date', label: 'Approval Date' },
    { key: 'application_status', label: 'Application Status' },
    { key: 'status', label: 'Status' },
  ];

  const handleExport = () => {
    const exportData = filtered.map((student) => {
      const row: Record<string, any> = {};
      selectedFields.forEach((field) => {
        switch (field) {
          case 'student_id':
            row['Student ID'] = student.user?.user_code || student.student_id || '';
            break;
          case 'name':
            row['Full Name'] = `${student.first_name} ${student.last_name}`;
            break;
          case 'gender':
            row['Gender'] = student.gender || '';
            break;
          case 'date_of_birth':
            row['Date of Birth'] = student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : '';
            break;
          case 'nationality':
            row['Nationality'] = (student as any).nationality || '';
            break;
          case 'county':
            row['County'] = (student as any).county || '';
            break;
          case 'previous_school':
            row['Previous School'] = (student as any).previous_school || '';
            break;
          case 'address':
            row['Address'] = student.address || '';
            break;
          case 'father_name':
            row["Father's Name"] = (student as any).father_name || '';
            break;
          case 'mother_name':
            row["Mother's Name"] = (student as any).mother_name || '';
            break;
          case 'father_occupation':
            row["Father's Occupation"] = (student as any).father_occupation || '';
            break;
          case 'mother_occupation':
            row["Mother's Occupation"] = (student as any).mother_occupation || '';
            break;
          case 'father_contact':
            row["Father's Contact"] = (student as any).father_contact || '';
            break;
          case 'mother_contact':
            row["Mother's Contact"] = (student as any).mother_contact || '';
            break;
          case 'parent_address':
            row['Parent Address'] = (student as any).parent_address || '';
            break;
          case 'has_illness':
            row['Has Illness'] = (student as any).has_illness ? 'Yes' : 'No';
            break;
          case 'emergency_contact_name':
            row['Emergency Contact Name'] = (student as any).emergency_contact_name || '';
            break;
          case 'emergency_contact_phone':
            row['Emergency Contact Phone'] = (student as any).emergency_contact_phone || '';
            break;
          case 'sports_interest':
            row['Sports Interest'] = (student as any).sports_interest || '';
            break;
          case 'additional_notes':
            row['Additional Notes'] = (student as any).additional_notes || '';
            break;
          case 'class':
            row['Class'] = student.class?.name || '';
            break;
          case 'admission_date':
            row['Admission Date'] = (student as any).admission_date ? new Date((student as any).admission_date).toLocaleDateString() : '';
            break;
          case 'approved_by_registrar':
            row['Approved by Registrar'] = (student as any).approved_by_registrar || '';
            break;
          case 'approved_by_principal':
            row['Approved by Principal'] = (student as any).approved_by_principal || '';
            break;
          case 'approval_date':
            row['Approval Date'] = (student as any).approval_date ? new Date((student as any).approval_date).toLocaleDateString() : '';
            break;
          case 'application_status':
            row['Application Status'] = (student as any).application_status || '';
            break;
          case 'status':
            row['Status'] = student.status || '';
            break;
        }
      });
      return row;
    });

    // Convert to CSV
    const headers = selectedFields.map(f => availableFields.find(af => af.key === f)?.label || f);
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => headers.map(header => {
        const value = row[header] || '';
        // Escape quotes and wrap in quotes if contains comma or quote
        const escaped = String(value).replace(/"/g, '""');
        return /[,"\n]/.test(escaped) ? `"${escaped}"` : escaped;
      }).join(','))
    ].join('\n');

    // Download as CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  };

  const toggleField = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    const displayId = s.user?.user_code || s.student_id;
    const matchSearch = !search || `${s.first_name} ${s.last_name} ${displayId}`.toLowerCase().includes(q);
    const matchStatus = !filterStatus || s.status === filterStatus;
    const matchAppStatus = !filterApplicationStatus || (s as any).application_status === filterApplicationStatus;
    return matchSearch && matchStatus && matchAppStatus;
  }).sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
        break;
      case 'student_id':
        const idA = a.user?.user_code || a.student_id || '';
        const idB = b.user?.user_code || b.student_id || '';
        comparison = idA.localeCompare(idB);
        break;
      case 'class':
        comparison = (a.class?.name || '').localeCompare(b.class?.name || '');
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'admission_date':
        const dateA = (a as any).admission_date || '';
        const dateB = (b as any).admission_date || '';
        comparison = dateA.localeCompare(dateB);
        break;
      default:
        comparison = 0;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="space-y-5">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; }
          .overflow-x-auto > div { display: none !important; }
          .print-only { display: block !important; }
          table { border-collapse: collapse !important; width: 100% !important; }
          th, td { border: 1px solid black !important; padding: 4px !important; font-size: 10px !important; }
          th { background-color: #f0f0f0 !important; }
        }
      `}</style>
      
      {/* Student View - Show own application record */}
      {isStudent ? (
        <>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-700">My Application</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">My Application Record</h1>
            <p className="mt-1 text-sm text-slate-500">View your student application details</p>
          </div>

          {approvalError && <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{approvalError}</p>}

          {loading ? (
            <p className="py-12 text-center text-sm text-slate-500">Loading your application record…</p>
          ) : !studentProfile ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
              No application record found. Please contact the school administration.
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-950">Personal Information</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    { label: 'Student ID', value: studentProfile.student_id },
                    { label: 'First Name', value: studentProfile.first_name },
                    { label: 'Last Name', value: studentProfile.last_name },
                    { label: 'Date of Birth', value: studentProfile.date_of_birth ? new Date(studentProfile.date_of_birth).toLocaleDateString() : '—' },
                    { label: 'Gender', value: studentProfile.gender },
                    { label: 'Place of Birth', value: studentProfile.place_of_birth || '—' },
                    { label: 'Nationality', value: studentProfile.nationality || '—' },
                    { label: 'County', value: studentProfile.county || '—' },
                    { label: 'Phone', value: studentProfile.phone || '—' },
                    { label: 'Address', value: studentProfile.address || '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-800">{value || '—'}</dd>
                    </div>
                  ))}
                </div>
              </div>

              {/* School Information */}
              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-950">School Information</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    { label: 'Class', value: studentProfile.class?.name || '—' },
                    { label: 'Previous School', value: studentProfile.previous_school || '—' },
                    { label: 'Admission Date', value: studentProfile.admission_date ? new Date(studentProfile.admission_date).toLocaleDateString() : '—' },
                    { label: 'Application Status', value: studentProfile.application_status || '—' },
                    { label: 'Registration Number', value: studentProfile.registration_number || '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-800">{value || '—'}</dd>
                    </div>
                  ))}
                </div>
              </div>

              {/* Parent/Guardian Information */}
              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-950">Parent/Guardian Information</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    { label: 'Guardian Name', value: studentProfile.parent_guardian_name || '—' },
                    { label: 'Guardian Phone', value: studentProfile.parent_guardian_phone || '—' },
                    { label: 'Guardian Email', value: studentProfile.parent_guardian_email || '—' },
                    { label: 'Father Name', value: studentProfile.father_name || '—' },
                    { label: 'Father Occupation', value: studentProfile.father_occupation || '—' },
                    { label: 'Father Contact', value: studentProfile.father_contact || '—' },
                    { label: 'Mother Name', value: studentProfile.mother_name || '—' },
                    { label: 'Mother Occupation', value: studentProfile.mother_occupation || '—' },
                    { label: 'Mother Contact', value: studentProfile.mother_contact || '—' },
                    { label: 'Parent Address', value: studentProfile.parent_address || '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-800">{value || '—'}</dd>
                    </div>
                  ))}
                </div>
              </div>

              {/* Health Information */}
              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-950">Health & Emergency Information</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    { label: 'Medical Condition', value: studentProfile.has_illness ? 'Yes' : 'No' },
                    { label: 'Medical Details', value: studentProfile.illness_details || '—' },
                    { label: 'Emergency Contact', value: studentProfile.emergency_contact_name || '—' },
                    { label: 'Emergency Phone', value: studentProfile.emergency_contact_phone || '—' },
                    { label: 'Sports Interest', value: studentProfile.sports_interest || '—' },
                    { label: 'Additional Notes', value: studentProfile.additional_notes || '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-800">{value || '—'}</dd>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Admin View - Show all students */}
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between no-print">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-700">People management</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Students</h1>
              <p className="mt-1 text-sm text-slate-500">{students.length} enrolled student{students.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSync} disabled={!isOnline} className="bg-blue-600 hover:bg-blue-700 text-white">
                ↻ Sync
              </Button>
              {isAdmin && (
                <Button onClick={() => setShowExportModal(true)} variant="secondary">
                  📊 Export to Excel
                </Button>
              )}
              {isAdmin && (
                <Button onClick={() => window.print()} variant="secondary">
                  🖨️ Print PDF
                </Button>
              )}
              {isAdmin && <a href="/application"
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
                + Add student
              </a>}
            </div>
          </div>

      {/* Summary Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Total Students</p>
            <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900">{students.length}</p>
            <p className="mt-1 text-sm text-slate-500">Enrolled students</p>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-emerald-600">{students.filter(s => s.status === 'active').length}</p>
              <p className="text-xs text-slate-500">Active</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{students.filter(s => (s as any).application_status === 'pending').length}</p>
              <p className="text-xs text-slate-500">Pending</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{students.filter(s => (s as any).application_status === 'approved').length}</p>
              <p className="text-xs text-slate-500">Approved</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-rose-600">{students.filter(s => (s as any).application_status === 'rejected').length}</p>
              <p className="text-xs text-slate-500">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm no-print">
        <div className="flex flex-wrap gap-3 border-b border-slate-100 px-4 py-4 sm:px-5 no-print">
          <Input 
            type="search" 
            placeholder="Search by name or ID…" 
            value={search}
            onChange={(e) => setSearch(e.target.value)} 
            className="w-full max-w-xs text-sm" 
          />
          <Select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)} 
            className="w-auto text-sm flex-1 min-w-[120px]"
            options={[
              { value: '', label: 'All statuses' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'graduated', label: 'Graduated' },
              { value: 'transferred', label: 'Transferred' },
            ]}
          />
          <Select 
            value={filterApplicationStatus} 
            onChange={(e) => setFilterApplicationStatus(e.target.value)} 
            className="w-auto text-sm flex-1 min-w-[120px]"
            options={[
              { value: '', label: 'All applications' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ]}
          />
          <Select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)} 
            className="w-auto text-sm flex-1 min-w-[140px]"
            options={[
              { value: 'name', label: 'Sort by Name' },
              { value: 'student_id', label: 'Sort by ID' },
              { value: 'class', label: 'Sort by Class' },
              { value: 'status', label: 'Sort by Status' },
              { value: 'admission_date', label: 'Sort by Admission Date' },
            ]}
          />
          <Button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} variant="secondary" className="whitespace-nowrap">
            {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
          </Button>
          <span className="ml-auto self-center text-xs text-slate-400">{filtered.length} of {students.length}</span>
        </div>

        {loading ? (
          <LoadingState message="Loading students…" />
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
            <p className="text-sm text-rose-800 mb-4">{error}</p>
            <Button onClick={loadStudents} variant="secondary">Try Again</Button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No students found"
            description="Try adjusting your search or filters to find what you're looking for."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Gender</TableHead>
                <TableHead className="hidden md:table-cell">Grade</TableHead>
                <TableHead className="hidden md:table-cell">Class</TableHead>
                <TableHead>Application</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="no-print">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((student) => (
                <TableRow key={student.id} onClick={() => navigate(`/students/${student.id}`)}>
                  <TableCell className="font-mono text-xs text-slate-500">{student.user?.user_code || student.student_id}</TableCell>
                  <TableCell className="font-semibold text-slate-900">{student.first_name} {student.last_name}</TableCell>
                  <TableCell className="hidden sm:table-cell capitalize text-slate-600">{student.gender || '—'}</TableCell>
                  <TableCell className="hidden md:table-cell text-slate-600">{student.class?.name || '—'}</TableCell>
                  <TableCell>
                    {(() => {
                      const appStatus = (student as any).application_status || 'pending';
                      const variant = appStatus === 'approved' ? 'success' as const
                        : appStatus === 'rejected' ? 'danger' as const
                        : 'warning' as const;
                      return <Badge variant={variant}>{appStatus}</Badge>;
                    })()}
                  </TableCell>
                  <TableCell className="no-print" onClick={(e: React.MouseEvent<HTMLTableCellElement>) => e.stopPropagation()}>
                    {isAdmin ? (
                      <div className="flex gap-2 flex-wrap">
                        {(student as any).application_status === 'pending' && (
                          <Button onClick={() => handleApprove(student.id)} disabled={approvingId === student.id} variant="ghost" className="text-emerald-600 hover:text-emerald-700 text-xs">
                            {approvingId === student.id ? 'Approving…' : 'Approve'}
                          </Button>
                        )}
                        {(student as any).application_status === 'approved' && !student.user && (
                          <Button onClick={() => handleCreateLogin(student)} variant="ghost" className="text-blue-600 hover:text-blue-700 text-xs">
                            Create Login
                          </Button>
                        )}
                        <a href={`/application?id=${student.id}&type=student`} className="text-xs font-semibold text-blue-700 hover:text-blue-900">
                          Edit
                        </a>
                        <Button onClick={() => handleDelete(student.id)} variant="ghost" className="text-rose-600 hover:text-rose-700 text-xs">
                          Delete
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">View only</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Print-only table */}
      <div className="print-only hidden">
        <h2 className="text-2xl font-bold mb-4">Student List Report</h2>
        <p className="text-sm mb-4">Generated on: {new Date().toLocaleDateString()}</p>
        <table className="w-full border-collapse border border-black">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black px-2 py-1 text-left text-xs">Student ID</th>
              <th className="border border-black px-2 py-1 text-left text-xs">Name</th>
              <th className="border border-black px-2 py-1 text-left text-xs">Gender</th>
              <th className="border border-black px-2 py-1 text-left text-xs">DOB</th>
              <th className="border border-black px-2 py-1 text-left text-xs">Nationality</th>
              <th className="border border-black px-2 py-1 text-left text-xs">County</th>
              <th className="border border-black px-2 py-1 text-left text-xs">Grade Applying</th>
              <th className="border border-black px-2 py-1 text-left text-xs">Class</th>
              <th className="border border-black px-2 py-1 text-left text-xs">Father</th>
              <th className="border border-black px-2 py-1 text-left text-xs">Mother</th>
              <th className="border border-black px-2 py-1 text-left text-xs">Father Contact</th>
              <th className="border border-black px-2 py-1 text-left text-xs">Mother Contact</th>
              <th className="border border-black px-2 py-1 text-left text-xs">Address</th>
              <th className="border border-black px-2 py-1 text-left text-xs">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((student) => (
              <tr key={student.id}>
                <td className="border border-black px-2 py-1 text-xs">{student.user?.user_code || student.student_id || ''}</td>
                <td className="border border-black px-2 py-1 text-xs">{student.first_name} {student.last_name}</td>
                <td className="border border-black px-2 py-1 text-xs capitalize">{student.gender || ''}</td>
                <td className="border border-black px-2 py-1 text-xs">{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : ''}</td>
                <td className="border border-black px-2 py-1 text-xs">{(student as any).nationality || ''}</td>
                <td className="border border-black px-2 py-1 text-xs">{(student as any).county || ''}</td>
                <td className="border border-black px-2 py-1 text-xs">{student.class?.name || ''}</td>
                <td className="border border-black px-2 py-1 text-xs">{(student as any).father_name || ''}</td>
                <td className="border border-black px-2 py-1 text-xs">{(student as any).mother_name || ''}</td>
                <td className="border border-black px-2 py-1 text-xs">{(student as any).father_contact || ''}</td>
                <td className="border border-black px-2 py-1 text-xs">{(student as any).mother_contact || ''}</td>
                <td className="border border-black px-2 py-1 text-xs">{student.address || ''}</td>
                <td className="border border-black px-2 py-1 text-xs capitalize">{student.status || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Export Students to Excel</h2>
              <button onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            <p className="mb-4 text-sm text-slate-600">
              Select the fields you want to include in the Excel export. Only the selected fields will be exported.
            </p>
            <div className="mb-4 max-h-80 overflow-y-auto rounded-lg border border-slate-200 p-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {availableFields.map((field) => (
                  <label key={field.key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedFields.includes(field.key)}
                      onChange={() => toggleField(field.key)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-700">{field.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setShowExportModal(false)} variant="secondary">
                Cancel
              </Button>
              <Button onClick={handleExport} disabled={selectedFields.length === 0}>
                Export ({selectedFields.length} fields)
              </Button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
