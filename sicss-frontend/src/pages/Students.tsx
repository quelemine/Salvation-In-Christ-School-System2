import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentService } from '../services/studentService';
import { useAuthStore } from '../store/authStore';
import type { Student } from '../types';
import { syncManager } from '../sync/syncManager';
import api from '../services/api';

// ── Main Students page ────────────────────────────────────────────────────────
export default function Students() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';
  const isStudent = user?.role?.slug === 'student';
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterApplicationStatus, setFilterApplicationStatus] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'student_id', 'name', 'gender', 'grade_applying_for', 'class', 'status'
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
    } catch { /* silent */ }
    finally { setLoading(false); }
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
    { key: 'grade_applying_for', label: 'Grade Applying' },
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
            row['Date of Birth'] = student.date_of_birth?.split('T')[0] || '';
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
          case 'grade_applying_for':
            row['Grade Applying'] = ((student as any).grade_applying_for || '').split(' - ')[0];
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
            row['Admission Date'] = (student as any).admission_date?.split('T')[0] || '';
            break;
          case 'approved_by_registrar':
            row['Approved by Registrar'] = (student as any).approved_by_registrar || '';
            break;
          case 'approved_by_principal':
            row['Approved by Principal'] = (student as any).approved_by_principal || '';
            break;
          case 'approval_date':
            row['Approval Date'] = (student as any).approval_date?.split('T')[0] || '';
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
      case 'grade_applying_for':
        const gradeA = ((a as any).grade_applying_for || '').split(' - ')[0];
        const gradeB = ((b as any).grade_applying_for || '').split(' - ')[0];
        comparison = gradeA.localeCompare(gradeB);
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
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">My Application</p>
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
                    { label: 'Date of Birth', value: studentProfile.date_of_birth?.split('T')[0] || '—' },
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
                    { label: 'Grade Applying For', value: studentProfile.grade_applying_for || '—' },
                    { label: 'Admission Date', value: studentProfile.admission_date?.split('T')[0] || '—' },
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
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">People management</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Students</h1>
              <p className="mt-1 text-sm text-slate-500">{students.length} enrolled student{students.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleSync} disabled={!isOnline}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                ↻ Sync
              </button>
              {isAdmin && (
                <button onClick={() => setShowExportModal(true)}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  📊 Export to Excel
                </button>
              )}
              {isAdmin && (
                <button onClick={() => window.print()}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  🖨️ Print PDF
                </button>
              )}
              {isAdmin && <a href="/student-application"
                className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700">
                + Add student
              </a>}
            </div>
          </div>

      {/* Summary Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Total Students</p>
            <p className="mt-2 text-4xl font-bold tracking-tight text-slate-950">{students.length}</p>
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
          <input type="search" placeholder="Search by name or ID…" value={search}
            onChange={(e) => setSearch(e.target.value)} className="input-field w-full max-w-xs text-sm" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field w-auto text-sm flex-1 min-w-[120px]">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="graduated">Graduated</option>
            <option value="transferred">Transferred</option>
          </select>
          <select value={filterApplicationStatus} onChange={(e) => setFilterApplicationStatus(e.target.value)} className="input-field w-auto text-sm flex-1 min-w-[120px]">
            <option value="">All applications</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-field w-auto text-sm flex-1 min-w-[140px]">
            <option value="name">Sort by Name</option>
            <option value="student_id">Sort by ID</option>
            <option value="grade_applying_for">Sort by Grade</option>
            <option value="class">Sort by Class</option>
            <option value="status">Sort by Status</option>
            <option value="admission_date">Sort by Admission Date</option>
          </select>
          <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap">
            {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
          </button>
          <span className="ml-auto self-center text-xs text-slate-400">{filtered.length} of {students.length}</span>
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-slate-500">Loading students…</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-[600px] divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Student ID</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Name</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700 hidden sm:table-cell">Gender</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700 hidden md:table-cell">Grade</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700 hidden md:table-cell">Class</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Application</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700 hidden sm:table-cell">Status</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700 no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">No students found.</td></tr>
                ) : filtered.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 sm:px-4 py-3 font-mono text-xs text-slate-500">{student.user?.user_code || student.student_id}</td>
                    <td className="px-3 sm:px-4 py-3 font-semibold text-slate-900">{student.first_name} {student.last_name}</td>
                    <td className="px-3 sm:px-4 py-3 text-slate-600 capitalize hidden sm:table-cell">{student.gender || '—'}</td>
                    <td className="px-3 sm:px-4 py-3 text-slate-600 hidden md:table-cell">{((student as any).grade_applying_for || '—').split(' - ')[0]}</td>
                    <td className="px-3 sm:px-4 py-3 text-slate-600 hidden md:table-cell">{student.class?.name || '—'}</td>
                    <td className="px-3 sm:px-4 py-3">
                      {(() => {
                        const appStatus = (student as any).application_status || 'pending';
                        const cls = appStatus === 'approved' ? 'bg-emerald-100 text-emerald-700'
                          : appStatus === 'rejected' ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700';
                        return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${cls}`}>{appStatus}</span>;
                      })()}
                    </td>
                    <td className="px-3 sm:px-4 py-3 no-print">
                      {isAdmin ? (
                        <div className="flex gap-2 flex-wrap">
                          {(student as any).application_status === 'pending' && (
                            <button onClick={() => handleApprove(student.id)} disabled={approvingId === student.id}
                              className="text-xs font-semibold text-emerald-600 hover:underline whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50">
                              {approvingId === student.id ? 'Approving…' : 'Approve'}
                            </button>
                          )}
                          {(student as any).application_status === 'approved' && !student.user && (
                            <button onClick={() => handleCreateLogin(student)}
                              className="text-xs font-semibold text-cyan-600 hover:underline whitespace-nowrap">
                              Create Login
                            </button>
                          )}
                          <a href={`/student-application?id=${student.id}`}
                            className="text-xs font-semibold text-cyan-700 hover:underline whitespace-nowrap">
                            Edit
                          </a>
                          <button onClick={() => handleDelete(student.id)}
                            className="text-xs font-semibold text-rose-600 hover:underline whitespace-nowrap">
                            Delete
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">View only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                <td className="border border-black px-2 py-1 text-xs">{student.date_of_birth?.split('T')[0] || ''}</td>
                <td className="border border-black px-2 py-1 text-xs">{(student as any).nationality || ''}</td>
                <td className="border border-black px-2 py-1 text-xs">{(student as any).county || ''}</td>
                <td className="border border-black px-2 py-1 text-xs">{((student as any).grade_applying_for || '').split(' - ')[0]}</td>
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
                      className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-slate-700">{field.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowExportModal(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleExport} disabled={selectedFields.length === 0}
                className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50">
                Export ({selectedFields.length} fields)
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
