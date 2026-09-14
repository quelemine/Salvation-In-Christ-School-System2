import { createBrowserRouter, Navigate, Link, useRouteError } from 'react-router-dom';
import Login from '../pages/Login';
import ForgotPassword from '../pages/ForgotPassword';
import MainLayout from '../layouts/MainLayout';
import Dashboard from '../pages/Dashboard';
import AdminDashboard from '../pages/AdminDashboard';
import PageContentEditor from '../pages/PageContentEditor';
import PageLayoutEditor from '../pages/PageLayoutEditor';
import PageColumnEditor from '../pages/PageColumnEditor';
import AcademicCalendar from '../pages/AcademicCalendar';
import Exams from '../pages/Exams';
import Timetable from '../pages/Timetable';
import DisciplineRecords from '../pages/DisciplineRecords';
import Library from '../pages/Library';
import Transportation from '../pages/Transportation';
import Hostel from '../pages/Hostel';
import Inventory from '../pages/Inventory';
import Notifications from '../pages/Notifications';
import BulkImportExport from '../pages/BulkImportExport';
import Documents from '../pages/Documents';
import MedicalRecords from '../pages/MedicalRecords';
import SportsActivities from '../pages/SportsActivities';
import IdCards from '../pages/IdCards';
import Certificates from '../pages/Certificates';
import Alumni from '../pages/Alumni';
import Students from '../pages/Students';
import Attendance from '../pages/Attendance';
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
import FinancialReports from '../pages/FinancialReports';
import StudentPortal from '../pages/StudentPortal';
import StudentProfile from '../pages/StudentProfile';
import StudentDetail from '../pages/StudentDetail';
import TeacherPayroll from '../pages/TeacherPayroll';
import TeacherAttendance from '../pages/TeacherAttendance';
import AdminStaffUsers from '../pages/AdminStaffUsers';
import UserAccountPage from '../pages/UserAccountPage';
import ParentPortal from '../pages/ParentPortal';
import SubjectMarks from '../pages/SubjectMarks';
import ClassSponsorPortal from '../pages/ClassSponsorPortal';
import TeacherApplicationForm from '../pages/TeacherApplicationForm';
import UnifiedApplicationForm from '../pages/UnifiedApplicationForm';
import Roles from '../pages/Roles';
import BlankApplicationForm from '../pages/BlankApplicationForm';

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
      { path: 'admin-dashboard', element: <AdminDashboard /> },
      { path: 'admin/page-content', element: <PageContentEditor /> },
      { path: 'admin/page-layouts', element: <PageLayoutEditor /> },
      { path: 'admin/page-columns', element: <PageColumnEditor /> },
      { path: 'academic-calendar', element: <AcademicCalendar /> },
      { path: 'exams', element: <Exams /> },
      { path: 'timetable', element: <Timetable /> },
      { path: 'discipline-records', element: <DisciplineRecords /> },
      { path: 'library', element: <Library /> },
      { path: 'transportation', element: <Transportation /> },
      { path: 'hostel', element: <Hostel /> },
      { path: 'inventory', element: <Inventory /> },
      { path: 'notifications', element: <Notifications /> },
      { path: 'bulk-import-export', element: <BulkImportExport /> },
      { path: 'documents', element: <Documents /> },
      { path: 'medical-records', element: <MedicalRecords /> },
      { path: 'sports-activities', element: <SportsActivities /> },
      { path: 'id-cards', element: <IdCards /> },
      { path: 'certificates', element: <Certificates /> },
      { path: 'alumni', element: <Alumni /> },
      { path: 'profile', element: <Profile /> },
      { path: 'change-password', element: <ChangePassword /> },
      // Academic structure
      { path: 'divisions', element: <Divisions /> },
      { path: 'classes', element: <Classes /> },
      { path: 'subjects', element: <Subjects /> },
      // People
      { path: 'students', element: <Students /> },
      { path: 'students/:studentId', element: <StudentDetail /> },
      { path: 'student-profile', element: <StudentProfile /> },
      { path: 'teachers', element: <Teachers /> },
      { path: 'teacher-application', element: <TeacherApplicationForm /> },
      { path: 'application', element: <UnifiedApplicationForm /> },
      { path: 'blank-form', element: <BlankApplicationForm /> },
      { path: 'teacher-payroll', element: <TeacherPayroll /> },
      { path: 'salary-structures', element: <TeacherPayroll /> },
      { path: 'teacher-attendance', element: <TeacherAttendance /> },
      { path: 'admin-staff', element: <AdminStaffUsers /> },
      // User account setup — opened after approving a student application
      { path: 'users/account/student/:studentId', element: <UserAccountPage /> },
      // Parent portal — children's academic records
      { path: 'parent-portal', element: <ParentPortal /> },
      // Subject teacher marks submission
      { path: 'subject-marks', element: <SubjectMarks /> },
      // Class sponsor mark sheet compilation
      { path: 'class-sponsor-portal', element: <ClassSponsorPortal /> },
      // Academic work
      { path: 'grades', element: <Grades /> },
      { path: 'my-grade-sheet', element: <StudentPortal view="report-card" /> },
      { path: 'my-attendance', element: <StudentPortal view="attendance" /> },
      { path: 'my-assignments', element: <StudentPortal view="assignments" /> },
      { path: 'my-financial-records', element: <StudentPortal view="financial-records" /> },
      { path: 'my-report-card', element: <StudentPortal view="report-card" /> },
      { path: 'attendance', element: <Attendance /> },
      { path: 'assignments', element: <Assignments /> },
      { path: 'comments', element: <Comments /> },
      { path: 'report-cards', element: <ReportCards /> },
      // Finance
      { path: 'fee-structure', element: <FeeStructure /> },
      { path: 'fee-clearance', element: <FeeClearance /> },
      { path: 'payments', element: <Payments /> },
      { path: 'invoices', element: <Invoices /> },
      { path: 'receipts', element: <Receipts /> },
      { path: 'financial-reports', element: <FinancialReports /> },
      { path: 'reports', element: <Reports /> },
      // System
      { path: 'users', element: <Users /> },
      { path: 'roles', element: <Roles /> },
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
