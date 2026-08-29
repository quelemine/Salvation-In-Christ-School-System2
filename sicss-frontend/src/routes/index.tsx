import { createBrowserRouter, Navigate, Link, useRouteError } from 'react-router-dom';
import Login from '../pages/Login';
import ForgotPassword from '../pages/ForgotPassword';
import MainLayout from '../layouts/MainLayout';
import Dashboard from '../pages/Dashboard';
import Students from '../pages/Students';
import Attendance from '../pages/Attendance';
import Fees from '../pages/Fees';
import Divisions from '../pages/Divisions';
import Users from '../pages/Users';
import ActivityLogs from '../pages/ActivityLogs';
import Profile from '../pages/Profile';
import Classes from '../pages/Classes';
import Grades from '../pages/Grades';
import ReportCards from '../pages/ReportCards';
import Teachers from '../pages/Teachers';
import Subjects from '../pages/Subjects';
import Payments from '../pages/Payments';
import Receipts from '../pages/Receipts';
import Assignments from '../pages/Assignments';
import Comments from '../pages/Comments';
import Reports from '../pages/Reports';
import SyncStatus from '../pages/SyncStatus';
import Settings from '../pages/Settings';
import Invoices from '../pages/Invoices';
import SecurityCenter from '../pages/SecurityCenter';
import ChangePassword from '../pages/ChangePassword';
import Announcements from '../pages/Announcements';
import HelpDesk from '../pages/HelpDesk';
import HelpDeskAdmin from '../pages/HelpDeskAdmin';
import FeeStructure from '../pages/FeeStructure';
import FeeClearance from '../pages/FeeClearance';
import StudentApplicationForm from '../pages/StudentApplicationForm';
import MyGradeSheet from '../pages/MyGradeSheet';
import StudentPortal from '../pages/StudentPortal';
import TeacherPayroll from '../pages/TeacherPayroll';
import TeacherAttendance from '../pages/TeacherAttendance';

function RouteError() {
  const error = useRouteError() as { statusText?: string; status?: number };

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-sm font-bold uppercase tracking-widest text-rose-600">{error?.status || 404}</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-950">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500">That page is not available. Use the dashboard to continue.</p>
      <Link to="/dashboard" className="mt-6 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Back to dashboard</Link>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'profile', element: <Profile /> },
      { path: 'change-password', element: <ChangePassword /> },
      // Academic structure
      { path: 'divisions', element: <Divisions /> },
      { path: 'classes', element: <Classes /> },
      { path: 'subjects', element: <Subjects /> },
      // People
      { path: 'students', element: <Students /> },
      { path: 'student-application', element: <StudentApplicationForm /> },
      { path: 'teachers', element: <Teachers /> },
      { path: 'teacher-payroll', element: <TeacherPayroll /> },
      { path: 'teacher-attendance', element: <TeacherAttendance /> },
      // Academic work
      { path: 'grades', element: <Grades /> },
      { path: 'my-grade-sheet', element: <MyGradeSheet /> },
      { path: 'my-attendance', element: <StudentPortal view="attendance" /> },
      { path: 'my-assignments', element: <StudentPortal view="assignments" /> },
      { path: 'my-financial-records', element: <StudentPortal view="financial-records" /> },
      { path: 'attendance', element: <Attendance /> },
      { path: 'assignments', element: <Assignments /> },
      { path: 'comments', element: <Comments /> },
      { path: 'report-cards', element: <ReportCards /> },
      // Finance
      { path: 'fees', element: <Fees /> },
      { path: 'fee-structure', element: <FeeStructure /> },
      { path: 'fee-clearance', element: <FeeClearance /> },
      { path: 'payments', element: <Payments /> },
      { path: 'invoices', element: <Invoices /> },
      { path: 'receipts', element: <Receipts /> },
      { path: 'reports', element: <Reports /> },
      // System
      { path: 'users', element: <Users /> },
      { path: 'announcements', element: <Announcements /> },
      { path: 'helpdesk', element: <HelpDesk /> },
      { path: 'helpdesk-admin', element: <HelpDeskAdmin /> },
      { path: 'security', element: <SecurityCenter /> },
      { path: 'activity-logs', element: <ActivityLogs /> },
      { path: 'sync', element: <SyncStatus /> },
      { path: 'settings', element: <Settings /> },    ],
  },
]);

export default router;
