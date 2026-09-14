import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { syncManager } from '../sync/syncManager';
import { authService } from '../services/authService';
import { payrollService } from '../services/teacherService';
import { teacherAttendanceService } from '../services/teacherAttendanceService';
import { useEffect, useState } from 'react';
import api from '../services/api';
import { formatCurrency } from '../utils/currency';
import AnnouncementsBanner from '../components/AnnouncementsBanner';
import { StatCard } from '../components/ui';

type DashboardSummary = {
  students: number;
  teachers: number;
  classes: number;
  fees_collected: { LRD: number; USD: number };
  monthly_income: { LRD: number; USD: number };
  annual_income: { LRD: number; USD: number };
  monthly_payment_count: number;
  pending_payments: number;
  refunded_payments: number;
  attendance_present: number;
  attendance_absent: number;
  attendance_rate: number;
  monthly_salary: number | string | null;
  salary_currency: 'LRD' | 'USD';
  salary_status: 'pending' | 'paid';
};

type SalarySummary = { monthly_salary: number | string | null; annual_salary: number; annual_salary_estimate: number | null; currency: 'LRD' | 'USD' | null; status: 'pending' | 'paid'; role_title?: string | null };
type SearchResult = { type: string; title: string; subtitle: string; path: string };

export default function Dashboard() {
  const { user } = useAuthStore();
  const { settings } = useSettingsStore();
  const { system } = settings;
  const isOnline = useOnlineStatus();
  const role = user?.role?.slug || '';
  const isAdmin   = role === 'admin';
  const isVPI     = role === 'vice-principal-instruction';
  const isTeacher = ['teacher', 'class-teacher', 'subject-teacher'].includes(role);
  const isStudent = role === 'student';
  const isParent = role === 'parent';
  const isFinance = role === 'finance' || role === 'finance-staff';

  const [summary, setSummary] = useState<Partial<DashboardSummary>>({});
  const [salary, setSalary] = useState<SalarySummary | null>(null);
  const [teacherAttendance, setTeacherAttendance] = useState<{ today: { status: string; attendance_type: string } | null; month: Record<string, number> } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    // Only fetch full summary for admin/finance — teachers don't need finance data
    if (isAdmin || isFinance) {
      authService.dashboardSummary().then(setSummary).catch(() => setSummary({}));
    } else {
      // Teachers/students: only fetch non-financial summary
      authService.dashboardSummary().then((data) => {
        const { fees_collected: _, ...rest } = data as any;
        setSummary(rest);
      }).catch(() => setSummary({}));
    }

    // Scroll to top button visibility
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAdmin, isFinance]);

  useEffect(() => {
    if (isTeacher) payrollService.mySalary().then(setSalary).catch(() => setSalary(null));
  }, [isTeacher]);

  useEffect(() => {
    if (isTeacher) teacherAttendanceService.mine().then(setTeacherAttendance).catch(() => setTeacherAttendance(null));
  }, [isTeacher]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!isAdmin || query.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    let active = true;
    const timer = window.setTimeout(() => {
      setSearching(true);
      api.get<{ data: SearchResult[] }>('/search', { params: { q: query } })
        .then((response) => { if (active) setSearchResults(response.data.data); })
        .catch(() => { if (active) setSearchResults([]); })
        .finally(() => { if (active) setSearching(false); });
    }, 250);

    return () => { active = false; window.clearTimeout(timer); };
  }, [isAdmin, searchQuery]);

  const handleSync = async () => { await syncManager.sync(); };

  // ── Role-specific greeting ───────────────────────────────────────────────────
  const greeting = isAdmin   ? 'Administrator'
    : isTeacher ? `${user?.first_name || 'Teacher'}`
    : isFinance ? `${user?.first_name || 'Finance'}`
    : user?.first_name || 'User';

  // ── Role-specific metric cards ───────────────────────────────────────────────
  const adminMetrics = [
    { 
      label: 'Total Students', 
      value: summary.students ?? 0, 
      detail: 'Enrolled students',
      icon: <span className="text-xl">👨‍🎓</span>,
      accent: 'blue' as const,
      path: '/students' 
    },
    { 
      label: 'Teaching Staff', 
      value: summary.teachers ?? 0, 
      detail: 'Active teachers',
      icon: <span className="text-xl">👨‍🏫</span>,
      accent: 'emerald' as const,
      path: '/teachers' 
    },
    { 
      label: 'Active Classes', 
      value: summary.classes ?? 0, 
      detail: 'Configured classes',
      icon: <span className="text-xl">🏫</span>,
      accent: 'purple' as const,
      path: '/classes' 
    },
    { 
      label: 'Fees Collected', 
      value: formatCurrency(summary.fees_collected?.LRD ?? 0, 'LRD'), 
      detail: 'Current academic year',
      icon: <span className="text-xl">💰</span>,
      accent: 'gold' as const,
      path: '/payments' 
    },
  ];

  const teacherMetrics = [
    { 
      label: 'Total students', 
      value: summary.students ?? 0, 
      detail: 'Active learners',
      icon: <span className="text-xl">👨‍🎓</span>,
      accent: 'blue' as const,
      path: '/students' 
    },
    { 
      label: 'Active classes', 
      value: summary.classes ?? 0, 
      detail: 'Configured classes',
      icon: <span className="text-xl">🏫</span>,
      accent: 'purple' as const,
      path: '/classes' 
    },
    { 
      label: 'My attendance', 
      value: teacherAttendance?.today?.status || 'Pending', 
      detail: teacherAttendance?.today ? `${teacherAttendance.today.attendance_type === 'meeting' ? 'Meeting' : 'Working day'}` : 'Not recorded today',
      icon: <span className="text-xl">📋</span>,
      accent: 'emerald' as const,
      path: '/dashboard' 
    },
    { 
      label: 'My monthly salary', 
      value: salary?.monthly_salary != null ? formatCurrency(salary.monthly_salary, salary.currency || 'LRD') : 'Not assigned', 
      detail: salary?.status === 'paid' ? 'Paid this month' : 'Pending this month',
      icon: <span className="text-xl">💳</span>,
      accent: 'gold' as const,
      path: '/dashboard' 
    },
  ];

  const financeMetrics = [
    { 
      label: 'Monthly income', 
      value: formatCurrency(summary.monthly_income?.LRD ?? 0, 'LRD'), 
      detail: 'Completed payments this month',
      icon: <span className="text-xl">💰</span>,
      accent: 'emerald' as const,
      path: '/payments' 
    },
    { 
      label: 'Annual income', 
      value: formatCurrency(summary.annual_income?.LRD ?? 0, 'LRD'), 
      detail: 'Completed payments this year',
      icon: <span className="text-xl">📊</span>,
      accent: 'rose' as const,
      path: '/reports' 
    },
    { 
      label: 'Payments this month', 
      value: summary.monthly_payment_count ?? 0, 
      detail: 'Completed records',
      icon: <span className="text-xl">💵</span>,
      accent: 'blue' as const,
      path: '/payments' 
    },
    { 
      label: 'Pending payments', 
      value: summary.pending_payments ?? 0, 
      detail: 'Require follow-up',
      icon: <span className="text-xl">⚠️</span>,
      accent: 'gold' as const,
      path: '/payments' 
    },
  ];

  const studentMetrics = [
    { 
      label: 'My profile', 
      value: null, 
      detail: 'View your personal information',
      icon: <span className="text-xl">👤</span>,
      accent: 'blue' as const,
      path: '/student-profile' 
    },
    { 
      label: 'My report card', 
      value: null, 
      detail: 'View your academic report card',
      icon: <span className="text-xl">🎓</span>,
      accent: 'emerald' as const,
      path: '/my-report-card' 
    },
    { 
      label: 'My attendance rate', 
      value: `${summary.attendance_rate ?? 0}%`, 
      detail: 'Your recorded attendance',
      icon: <span className="text-xl">📋</span>,
      accent: 'purple' as const,
      path: '/my-attendance' 
    },
  ];

  const parentMetrics = [
    { 
      label: 'Child report card', 
      value: null, 
      detail: 'View your child academic report card',
      icon: <span className="text-xl">🎓</span>,
      accent: 'blue' as const,
      path: '/my-report-card' 
    },
    { 
      label: 'Child attendance', 
      value: null, 
      detail: 'View your child attendance record',
      icon: <span className="text-xl">📋</span>,
      accent: 'emerald' as const,
      path: '/my-attendance' 
    },
    { 
      label: 'Child assignments', 
      value: null, 
      detail: 'View your child assignments',
      icon: <span className="text-xl">📄</span>,
      accent: 'purple' as const,
      path: '/my-assignments' 
    },
    { 
      label: 'Financial status', 
      value: null, 
      detail: 'View fee payment status',
      icon: <span className="text-xl">💰</span>,
      accent: 'gold' as const,
      path: '/my-financial-records' 
    },
  ];

  const vpiMetrics = [
    { 
      label: 'Total teachers', 
      value: summary.teachers ?? 0, 
      detail: 'Teaching staff',
      icon: <span className="text-xl">👨‍🏫</span>,
      accent: 'emerald' as const,
      path: '/teachers' 
    },
    { 
      label: 'Total students', 
      value: summary.students ?? 0, 
      detail: 'Active learners',
      icon: <span className="text-xl">👨‍🎓</span>,
      accent: 'blue' as const,
      path: '/students' 
    },
    { 
      label: 'Academic records', 
      value: null, 
      detail: 'View student grades and report cards',
      icon: <span className="text-xl">📝</span>,
      accent: 'purple' as const,
      path: '/grades' 
    },
    { 
      label: 'Announcements', 
      value: null, 
      detail: 'Send announcements to teachers',
      icon: <span className="text-xl">📢</span>,
      accent: 'rose' as const,
      path: '/announcements' 
    },
  ];

  const displayMetrics = isAdmin ? adminMetrics : isVPI ? vpiMetrics : isTeacher ? teacherMetrics : isFinance ? financeMetrics : isStudent ? studentMetrics : isParent ? parentMetrics : teacherMetrics;

  // ── Role-specific quick actions ──────────────────────────────────────────────
  const adminActions   = [['/students', '+ Add student'], ['/teachers', '+ Add teacher'], ['/divisions', '+ New division'], ['/fees', '+ Record payment']];
  const teacherActions = [['/attendance', '+ Take attendance'], ['/grades', '+ Add grade'], ['/assignments', '+ New assignment'], ['/comments', '+ Add comment']];
  const financeActions = [['/payments', '+ Record payment'], ['/receipts', '+ Generate receipt'], ['/fees', '+ Add fee'], ['/reports', '+ View reports']];
  const studentActions = [['/my-report-card', 'View report card'], ['/my-grade-sheet', 'View grade sheet'], ['/my-attendance', 'View attendance'], ['/my-assignments', 'View assignments'], ['/my-financial-records', 'View finance']];
  const parentActions = [['/my-report-card', 'View report card'], ['/my-attendance', 'View attendance'], ['/my-assignments', 'View assignments'], ['/my-financial-records', 'View finance'], ['/helpdesk', 'Contact school']];
  const vpiActions = [['/teachers', 'View teachers'], ['/students', 'View students'], ['/grades', 'View academic records'], ['/announcements', 'Send announcements']];

  const quickActions = isAdmin ? adminActions : isVPI ? vpiActions : isTeacher ? teacherActions : isFinance ? financeActions : isStudent ? studentActions : isParent ? parentActions : teacherActions;

  return (
    <div className="space-y-6">
      <AnnouncementsBanner />

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-sicss-text-primary">
            Good morning, {greeting}
          </h1>
          <p className="mt-1 text-sm text-sicss-text-secondary">
            Welcome to SICSS — Salvation In Christ School System
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-semibold text-sicss-text-primary">Academic Year: {system.academicYear || '2026/2027'}</p>
            <p className="text-xs text-sicss-text-muted">Term: {system.currentTerm || 'Term 1'}</p>
          </div>
          <span className="flex items-center gap-2 text-xs font-medium text-sicss-text-secondary">
            <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-sicss-success' : 'bg-sicss-warning'}`} />
            {isOnline ? 'Online' : 'Offline mode'}
          </span>
          <button onClick={handleSync} disabled={!isOnline}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
            Sync data
          </button>
        </div>
      </div>

      {isAdmin && (
        <section className="rounded-xl border border-sicss-border bg-white p-6 shadow-sm">
          <label htmlFor="dashboard-search" className="text-sm font-semibold text-sicss-text-primary">Find a record</label>
          <p className="mt-1 text-sm text-sicss-text-secondary">Search students, teachers, and staff by name, ID, email, or phone number.</p>
          <div className="relative mt-4">
            <input
              id="dashboard-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Start typing a name, student ID, employee ID, email, or phone…"
              className="w-full rounded-lg border border-sicss-border px-4 py-2.5 text-sm focus:border-sicss-primary focus:outline-none focus:ring-2 focus:ring-sicss-primary/20"
              autoComplete="off"
            />
            {searching && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-sicss-text-muted">Searching…</span>}
          </div>
          {searchQuery.trim().length >= 2 && !searching && (
            <div className="mt-3 overflow-hidden rounded-lg border border-sicss-border bg-white">
              {searchResults.length === 0 ? <p className="px-4 py-3 text-sm text-sicss-text-secondary">No matching records found.</p> : searchResults.map((result, index) => (
                <Link key={`${result.type}-${result.title}-${index}`} to={result.path} className="flex items-center justify-between gap-4 border-b border-sicss-border px-4 py-3 last:border-b-0 hover:bg-slate-50">
                  <span><span className="block text-xs font-bold uppercase tracking-wide text-sicss-primary">{result.type}</span><span className="mt-0.5 block font-semibold text-sicss-text-primary">{result.title}</span><span className="mt-0.5 block text-xs text-sicss-text-secondary">{result.subtitle}</span></span>
                  <span className="text-sm font-semibold text-sicss-primary">Open →</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Metric cards */}
      <section className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${displayMetrics.length >= 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-2'}`}>
        {displayMetrics.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>

      {isTeacher && salary && (
        <section className="rounded-xl border border-sicss-border bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div><p className="text-xs font-bold uppercase tracking-widest text-sicss-primary">My salary</p><h2 className="mt-1 text-base sm:text-lg font-bold text-sicss-text-primary">Academic-year salary summary</h2><p className="mt-1 text-xs sm:text-sm text-sicss-text-secondary">Recorded payroll this year: {formatCurrency(salary.annual_salary, salary.currency || 'LRD')}{salary.annual_salary_estimate !== null ? ` · Annual estimate: ${formatCurrency(salary.annual_salary_estimate, salary.currency || 'LRD')}` : ''}</p></div>
            <span className={`self-start rounded-full px-3 py-1 text-xs font-bold ${salary.status === 'paid' ? 'bg-sicss-success/10 text-sicss-success' : 'bg-sicss-warning/10 text-sicss-warning'}`}>{salary.status === 'paid' ? 'This month paid' : 'This month pending'}</span>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        {/* Attendance snapshot */}
        <div className="rounded-xl border border-sicss-border bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-sicss-primary">Today</p>
              <h2 className="mt-1 text-lg sm:text-xl font-bold text-sicss-text-primary">{isStudent ? 'My attendance' : 'Attendance snapshot'}</h2>
              <p className="mt-1 text-sm text-sicss-text-secondary">{isStudent ? 'Your recorded attendance rate.' : 'Monitor participation across your classes.'}</p>
            </div>
            <Link to={isStudent ? '/my-attendance' : '/attendance'} className="text-xs sm:text-sm font-semibold text-sicss-primary hover:text-sicss-active">View attendance</Link>
          </div>
          {isStudent ? (
            <div className="mt-6 sm:mt-8 text-center"><p className="text-2xl sm:text-3xl font-bold text-sicss-text-primary">{summary.attendance_rate ?? 0}%</p><p className="mt-1 text-xs text-sicss-text-muted">My attendance rate</p></div>
          ) : (
            <div className="mt-6 sm:mt-8 grid grid-cols-3 gap-2 sm:gap-4 text-center">
              <div><p className="text-2xl sm:text-3xl font-bold text-sicss-text-primary">{summary.attendance_present ?? 0}</p><p className="mt-1 text-xs text-sicss-text-muted">Present</p></div>
              <div><p className="text-2xl sm:text-3xl font-bold text-sicss-text-primary">{summary.attendance_absent  ?? 0}</p><p className="mt-1 text-xs text-sicss-text-muted">Absent</p></div>
              <div><p className="text-2xl sm:text-3xl font-bold text-sicss-text-primary">{summary.attendance_rate    ?? 0}%</p><p className="mt-1 text-xs text-sicss-text-muted">Rate</p></div>
            </div>
          )}
          <div className="mt-5 sm:mt-7 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-sicss-primary" style={{ width: `${summary.attendance_rate ?? 0}%` }} />
          </div>
        </div>

        {/* Finance — admin and finance staff only */}
        {(isAdmin || isFinance) && (
          <div className="rounded-xl border border-sicss-border bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-sicss-warning">Finance</p>
                <h2 className="mt-1 text-lg sm:text-xl font-bold text-sicss-text-primary">Collections</h2>
              </div>
              <Link to="/payments" className="text-xs sm:text-sm font-semibold text-sicss-primary hover:text-sicss-active">Open finance</Link>
            </div>
            <p className="mt-6 sm:mt-8 text-2xl sm:text-3xl font-bold tracking-tight text-sicss-text-primary">
              {formatCurrency(summary.annual_income?.LRD ?? summary.fees_collected?.LRD, 'LRD')}
            </p>
            <p className="mt-1 text-sm font-medium text-sicss-text-muted">
              {formatCurrency(summary.annual_income?.USD ?? summary.fees_collected?.USD, 'USD')}
            </p>
            <p className="mt-2 text-xs sm:text-sm text-sicss-text-secondary">Completed income this academic year</p>
            <div className="mt-5 sm:mt-7 flex items-center justify-between border-t border-sicss-border pt-4 text-xs sm:text-sm">
              <span className="text-sicss-text-secondary">Pending payments</span>
              <span className="font-semibold text-sicss-text-primary">{summary.pending_payments ?? 0}</span>
            </div>
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section className="rounded-xl border border-sicss-border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-sicss-text-primary">Quick actions</h2>
            <p className="mt-1 text-xs sm:text-sm text-sicss-text-secondary">
              {isAdmin ? 'Common administration tasks.' : isTeacher ? 'Teaching shortcuts.' : isParent ? 'View child information.' : 'Finance shortcuts.'}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map(([path, label]) => (
            <Link key={path} to={path}
              className="rounded-lg border border-sicss-border px-3 py-2.5 text-sm font-semibold text-sicss-text-primary transition hover:border-sicss-primary hover:bg-sicss-primary/5 hover:text-sicss-primary">
              {label}
            </Link>
          ))}
        </div>
      </section>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-sicss-primary text-white shadow-lg transition hover:bg-sicss-active"
          title="Scroll to top"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  );
}
