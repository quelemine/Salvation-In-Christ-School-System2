import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { syncManager } from '../sync/syncManager';
import { authService } from '../services/authService';
import { payrollService } from '../services/teacherService';
import { teacherAttendanceService } from '../services/teacherAttendanceService';
import { useEffect, useState } from 'react';
import { formatCurrency } from '../utils/currency';
import AnnouncementsBanner from '../components/AnnouncementsBanner';

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

export default function Dashboard() {
  const { user } = useAuthStore();
  const isOnline = useOnlineStatus();
  const role = user?.role?.slug || '';
  const isAdmin   = role === 'admin';
  const isTeacher = ['teacher', 'class-teacher', 'subject-teacher'].includes(role);
  const isStudent = role === 'student';
  const isFinance = role === 'finance' || role === 'finance-staff';

  const [summary, setSummary] = useState<Partial<DashboardSummary>>({});
  const [salary, setSalary] = useState<SalarySummary | null>(null);
  const [teacherAttendance, setTeacherAttendance] = useState<{ today: { status: string; attendance_type: string } | null; month: Record<string, number> } | null>(null);

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
  }, [isAdmin, isFinance]);

  useEffect(() => {
    if (isTeacher) payrollService.mySalary().then(setSalary).catch(() => setSalary(null));
  }, [isTeacher]);

  useEffect(() => {
    if (isTeacher) teacherAttendanceService.mine().then(setTeacherAttendance).catch(() => setTeacherAttendance(null));
  }, [isTeacher]);

  const handleSync = async () => { await syncManager.sync(); };

  // ── Role-specific greeting ───────────────────────────────────────────────────
  const greeting = isAdmin   ? 'Administrator'
    : isTeacher ? `${user?.first_name || 'Teacher'}`
    : isFinance ? `${user?.first_name || 'Finance'}`
    : user?.first_name || 'User';

  // ── Role-specific metric cards ───────────────────────────────────────────────
  const adminMetrics = [
    { label: 'Total students', value: summary.students ?? 0,  detail: 'Active learners',     accent: 'cyan',    path: '/students' },
    { label: 'Teaching staff', value: summary.teachers ?? 0,  detail: 'Active teachers',     accent: 'emerald', path: '/teachers' },
    { label: 'Active classes', value: summary.classes  ?? 0,  detail: 'Configured classes',  accent: 'amber',   path: '/classes'  },
    { label: 'Fees collected', value: null,                   detail: 'Current academic year', accent: 'rose',   path: '/fees'     },
  ];

  const teacherMetrics = [
    { label: 'Total students', value: summary.students ?? 0,  detail: 'Active learners',    accent: 'cyan',    path: '/students'    },
    { label: 'Active classes', value: summary.classes  ?? 0,  detail: 'Configured classes', accent: 'amber',   path: '/classes'     },
    { label: 'My attendance', value: null, detail: teacherAttendance?.today ? `${teacherAttendance.today.attendance_type === 'meeting' ? 'Meeting' : 'Working day'} · ${teacherAttendance.today.status}` : 'Not recorded today', accent: 'emerald', path: '/dashboard' },
    { label: 'My monthly salary', value: null,                detail: salary?.status === 'paid' ? 'Paid this month' : 'Pending this month', accent: 'emerald', path: '/dashboard' },
  ];

  const financeMetrics = [
    { label: 'Monthly income', value: null, detail: 'Completed payments this month', accent: 'emerald', path: '/payments' },
    { label: 'Annual income', value: null, detail: 'Completed payments this year', accent: 'rose', path: '/reports' },
    { label: 'Payments this month', value: summary.monthly_payment_count ?? 0, detail: 'Completed records', accent: 'cyan', path: '/payments' },
    { label: 'Pending payments', value: summary.pending_payments ?? 0, detail: 'Require follow-up', accent: 'amber', path: '/payments' },
  ];

  const studentMetrics = [
    { label: 'Students in my class', value: summary.students ?? 0, detail: 'Active classmates', accent: 'cyan', path: '/profile' },
    { label: 'My attendance rate', value: null, detail: 'Your recorded attendance', accent: 'blue', path: '/my-attendance' },
  ];

  const displayMetrics = isAdmin ? adminMetrics : isTeacher ? teacherMetrics : isFinance ? financeMetrics : isStudent ? studentMetrics : teacherMetrics;

  // ── Role-specific quick actions ──────────────────────────────────────────────
  const adminActions   = [['/students', '+ Add student'], ['/teachers', '+ Add teacher'], ['/divisions', '+ New division'], ['/fees', '+ Record payment']];
  const teacherActions = [['/attendance', '+ Take attendance'], ['/grades', '+ Add grade'], ['/assignments', '+ New assignment'], ['/comments', '+ Add comment']];
  const financeActions = [['/payments', '+ Record payment'], ['/receipts', '+ Generate receipt'], ['/fees', '+ Add fee'], ['/reports', '+ View reports']];
  const studentActions = [['/my-grade-sheet', 'View grade sheet'], ['/my-attendance', 'View attendance'], ['/my-assignments', 'View assignments'], ['/my-financial-records', 'View finance']];

  const quickActions = isAdmin ? adminActions : isTeacher ? teacherActions : isFinance ? financeActions : isStudent ? studentActions : teacherActions;

  return (
    <div className="space-y-7">
      <AnnouncementsBanner />

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-cyan-700">Overview</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Good morning, {greeting}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {isAdmin   ? 'Here is what is happening across your school today.' :
             isTeacher ? 'Here is your teaching overview for today.' :
             isFinance ? 'Here is the financial overview.' :
                         'Welcome to your school dashboard.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {isOnline ? 'Online' : 'Offline mode'}
          </span>
          <button onClick={handleSync} disabled={!isOnline}
            className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50">
            Sync data
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <section className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${displayMetrics.length >= 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-2'}`}>
        {displayMetrics.map((metric) => (
          <Link key={metric.label} to={metric.path}
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-slate-500">{metric.label}</p>
              <span className={`h-2.5 w-2.5 rounded-full bg-${metric.accent}-400`} />
            </div>
            <div className="mt-5">
              {metric.label === 'My attendance' ? (
                <><p className="text-2xl font-bold tracking-tight capitalize text-slate-950">{teacherAttendance?.today?.status || 'Pending'}</p><p className="mt-1 text-xs font-medium text-slate-400">This month: {teacherAttendance?.month.present ?? 0} present · {teacherAttendance?.month.late ?? 0} late · {teacherAttendance?.month.absent ?? 0} absent</p></>
              ) : metric.label === 'My monthly salary' ? (
                <>
                  <p className="text-2xl font-bold tracking-tight text-slate-950">{salary?.monthly_salary != null ? formatCurrency(salary.monthly_salary, salary.currency || 'LRD') : 'Not assigned'}</p>
                  <p className="mt-1 text-xs font-medium text-slate-400">{salary?.role_title || 'Salary structure not assigned'}</p>
                </>
              ) : metric.label === 'Fees collected' || metric.label === 'Monthly income' || metric.label === 'Annual income' ? (
                <>
                  <p className="text-3xl font-bold tracking-tight text-slate-950">
                    {formatCurrency(metric.label === 'Monthly income' ? summary.monthly_income?.LRD : metric.label === 'Annual income' ? summary.annual_income?.LRD : summary.fees_collected?.LRD, 'LRD')}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-400">
                    {formatCurrency(metric.label === 'Monthly income' ? summary.monthly_income?.USD : metric.label === 'Annual income' ? summary.annual_income?.USD : summary.fees_collected?.USD, 'USD')}
                  </p>
                </>
              ) : metric.label.toLowerCase().includes('attendance rate') ? (
                <>
                  <p className="text-3xl font-bold tracking-tight text-slate-950">
                    {summary.attendance_rate ?? 0}%
                  </p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-cyan-500" style={{ width: `${summary.attendance_rate ?? 0}%` }} />
                  </div>
                </>
              ) : (
                <p className="text-3xl font-bold tracking-tight text-slate-950">
                  {(metric.value as number).toLocaleString()}
                </p>
              )}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-slate-400">{metric.detail}</p>
              <span className="text-sm text-slate-300 transition group-hover:text-cyan-600">→</span>
            </div>
          </Link>
        ))}
      </section>

      {isTeacher && salary && (
        <section className="rounded-xl border border-cyan-100 bg-cyan-50/50 p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div><p className="text-xs font-bold uppercase tracking-widest text-cyan-700">My salary</p><h2 className="mt-1 text-lg font-bold text-slate-950">Academic-year salary summary</h2><p className="mt-1 text-sm text-slate-600">Recorded payroll this year: {formatCurrency(salary.annual_salary, salary.currency || 'LRD')}{salary.annual_salary_estimate !== null ? ` · Annual estimate: ${formatCurrency(salary.annual_salary_estimate, salary.currency || 'LRD')}` : ''}</p></div>
            <span className={`self-start rounded-full px-3 py-1 text-xs font-bold ${salary.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{salary.status === 'paid' ? 'This month paid' : 'This month pending'}</span>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        {/* Attendance snapshot */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Today</p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">{isStudent ? 'My attendance' : 'Attendance snapshot'}</h2>
              <p className="mt-1 text-sm text-slate-500">{isStudent ? 'Your recorded attendance rate.' : 'Monitor participation across your classes.'}</p>
            </div>
            <Link to={isStudent ? '/my-attendance' : '/attendance'} className="text-sm font-semibold text-cyan-700 hover:text-cyan-900">View attendance</Link>
          </div>
          {isStudent ? (
            <div className="mt-8 text-center"><p className="text-3xl font-bold text-slate-950">{summary.attendance_rate ?? 0}%</p><p className="mt-1 text-xs text-slate-500">My attendance rate</p></div>
          ) : (
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div><p className="text-3xl font-bold text-slate-950">{summary.attendance_present ?? 0}</p><p className="mt-1 text-xs text-slate-500">Present</p></div>
              <div><p className="text-3xl font-bold text-slate-950">{summary.attendance_absent  ?? 0}</p><p className="mt-1 text-xs text-slate-500">Absent</p></div>
              <div><p className="text-3xl font-bold text-slate-950">{summary.attendance_rate    ?? 0}%</p><p className="mt-1 text-xs text-slate-500">Rate</p></div>
            </div>
          )}
          <div className="mt-7 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-cyan-500" style={{ width: `${summary.attendance_rate ?? 0}%` }} />
          </div>
        </div>

        {/* Finance — admin and finance staff only */}
        {(isAdmin || isFinance) ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-rose-600">Finance</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">Collections</h2>
              </div>
              <Link to="/fees" className="text-sm font-semibold text-cyan-700 hover:text-cyan-900">Open finance</Link>
            </div>
            <p className="mt-8 text-3xl font-bold tracking-tight text-slate-950">
              {formatCurrency(summary.annual_income?.LRD ?? summary.fees_collected?.LRD, 'LRD')}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-400">
              {formatCurrency(summary.annual_income?.USD ?? summary.fees_collected?.USD, 'USD')}
            </p>
            <p className="mt-2 text-sm text-slate-500">Completed income this academic year</p>
            <div className="mt-7 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
              <span className="text-slate-500">Pending payments</span>
              <span className="font-semibold text-slate-900">{summary.pending_payments ?? 0}</span>
            </div>
          </div>
        ) : (
          /* Teacher / student: show a helpful tip instead */
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Help desk</p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">Need support?</h2>
              <p className="mt-2 text-sm text-slate-500">Submit a ticket and our team will respond as soon as possible.</p>
            </div>
            <Link to="/helpdesk"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-700 transition-colors">
              🎫 Open help desk
            </Link>
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Quick actions</h2>
            <p className="mt-1 text-sm text-slate-500">
              {isAdmin ? 'Common administration tasks.' : isTeacher ? 'Teaching shortcuts.' : 'Finance shortcuts.'}
            </p>
          </div>
          <span className="text-lg text-cyan-600">+</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map(([path, label]) => (
            <Link key={path} to={path}
              className="rounded-lg border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800">
              {label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
