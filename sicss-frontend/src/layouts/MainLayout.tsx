import { useEffect, useState } from 'react';
import { Outlet, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import OfflineBanner from '../components/OfflineBanner';
import NotificationBell from '../components/NotificationBell';
import { authService } from '../services/authService';

export default function MainLayout() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { settings } = useSettingsStore();
  const { branding, theme, system } = settings;

  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  // ── Sidebar colour scheme based on settings ──────────────────────────────
  const sidebarBg =
    theme.sidebarStyle === 'light'   ? 'bg-white border-r border-slate-200 text-slate-900' :
    theme.sidebarStyle === 'colored' ? 'text-white'                                         :
    'bg-slate-950 text-white';  // dark (default)

  const sidebarColorStyle =
    theme.sidebarStyle === 'colored' ? { backgroundColor: 'var(--accent)' } : {};

  const activeItemCls =
    theme.sidebarStyle === 'light'
      ? 'bg-slate-100 text-slate-950 font-semibold'
      : 'bg-white/20 text-white font-semibold';

  const inactiveItemCls =
    theme.sidebarStyle === 'light'
      ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      : 'text-white/70 hover:bg-white/10 hover:text-white';

  const logoTextCls =
    theme.sidebarStyle === 'light' ? 'text-slate-950' : 'text-white';

  const logoSubCls =
    theme.sidebarStyle === 'light' ? 'text-slate-400' : 'text-white/50';

  const logoBadgeStyle =
    theme.sidebarStyle === 'colored'
      ? { backgroundColor: '#ffffff22', color: '#fff' }
      : { backgroundColor: 'var(--accent)', color: 'var(--accent-dark)' };

  // ── Menu items by role ────────────────────────────────────────────────────
  const getMenuItems = () => {
    const role = user?.role?.slug || '';

    const commonItems = [
      { path: '/dashboard',       label: 'Dashboard',       icon: '📊' },
      { path: '/profile',         label: 'My profile',      icon: '👤' },
      { path: '/helpdesk',        label: 'Help desk',       icon: '🎫' },
    ];

    const adminItems = [
      { path: '/users',          label: 'User accounts',   icon: '◉'  },
      { path: '/admin-staff',    label: 'Admin & Staff',   icon: '👥' },
      { path: '/announcements',  label: 'Announcements',   icon: '📢' },
      { path: '/helpdesk-admin', label: 'Help desk',       icon: '🎫' },
      { path: '/divisions',     label: 'Divisions',     icon: '🏫' },
      { path: '/classes',       label: 'Classes',       icon: '📚' },
      { path: '/students',            label: 'Students',          icon: '👨‍🎓' },
      { path: '/student-application', label: 'Apply / Register',  icon: '📝' },
      { path: '/teachers',      label: 'Teachers',      icon: '👨‍🏫' },
      { path: '/teacher-payroll', label: 'Teacher payroll', icon: '💰' },
      { path: '/teacher-attendance', label: 'Teacher attendance', icon: '🗓️' },
      { path: '/subjects',      label: 'Subjects',      icon: '📖' },
      { path: '/attendance',    label: 'Student attendance', icon: '📋' },
      { path: '/grades',        label: 'Grades',        icon: '📝' },
      { path: '/assignments',   label: 'Assignments',   icon: '📄' },
      { path: '/comments',      label: 'Comments',      icon: '💬' },
      { path: '/fee-structure',  label: 'Fee structure',   icon: '📋' },
      { path: '/fee-clearance',  label: 'Fee clearance',   icon: '✅' },
      { path: '/payments',       label: 'Payments',        icon: '💳' },
      { path: '/invoices',      label: 'Invoices',      icon: '📄' },
      { path: '/receipts',      label: 'Receipts',      icon: '🧾' },
      { path: '/reports',       label: 'Reports',       icon: '📈' },
      { path: '/report-cards',  label: 'Report cards',  icon: '🎓' },
      { path: '/activity-logs', label: 'Activity logs',  icon: '🛡️' },
      { path: '/security',      label: 'Security center', icon: '🔐' },
      { path: '/sync',          label: 'Sync status',     icon: '🔄' },
      { path: '/settings',      label: 'Settings',        icon: '⚙️' },
    ];

    const teacherItems = [
      { path: '/fee-structure', label: 'Fee structure', icon: '📋' },
      { path: '/attendance',     label: 'Student attendance', icon: '📋' },
      { path: '/grades',         label: 'Grades',         icon: '📝' },
      { path: '/assignments',    label: 'Assignments',    icon: '📄' },
      { path: '/comments',       label: 'Comments',       icon: '💬' },
    ];

    const financeItems = [
      { path: '/fee-structure', label: 'Fee structure', icon: '�' },
      { path: '/payments',      label: 'Payments',      icon: '💳' },
      { path: '/receipts',      label: 'Receipts',      icon: '🧾' },
      { path: '/reports',       label: 'Reports',       icon: '📊' },
    ];

    // Admin gets their own common items (without /helpdesk since they use /helpdesk-admin)
    const adminCommonItems = [
      { path: '/dashboard',       label: 'Dashboard',       icon: '📊' },
      { path: '/profile',         label: 'My profile',      icon: '👤' },
    ];

    if (role === 'admin')                              return [...adminCommonItems, ...adminItems];
    if (role === 'class-teacher')                      return [...commonItems, { path: '/fee-structure', label: 'Fee structure', icon: '📋' }, { path: '/students', label: 'My students', icon: '👨‍🎓' }, { path: '/attendance', label: 'Student attendance', icon: '📋' }, { path: '/comments', label: 'Comments', icon: '💬' }];
    if (role === 'subject-teacher')                    return [...commonItems, { path: '/fee-structure', label: 'Fee structure', icon: '📋' }, { path: '/students', label: 'My students', icon: '👨‍🎓' }, { path: '/grades', label: 'Grades', icon: '📝' }, { path: '/assignments', label: 'Assignments', icon: '📄' }];
    if (role === 'student')                            return [...commonItems, { path: '/fee-structure', label: 'Fee structure', icon: '📋' }, { path: '/my-grade-sheet', label: 'My grade sheet', icon: '📝' }, { path: '/my-attendance', label: 'My attendance', icon: '📋' }, { path: '/my-assignments', label: 'My assignments', icon: '📄' }, { path: '/my-financial-records', label: 'My finance', icon: '💳' }];
    if (role === 'parent')                             return [...commonItems, { path: '/parent-portal', label: 'My children', icon: '👨‍👩‍👧' }, { path: '/fee-structure', label: 'Fee structure', icon: '📋' }];
    if (role === 'vice-principal-instruction')         return [...commonItems, { path: '/divisions', label: 'Divisions', icon: '🏢' }, { path: '/classes', label: 'Classes', icon: '🏫' }, { path: '/subjects', label: 'Subjects', icon: '📚' }, { path: '/teachers', label: 'Teachers', icon: '👨‍🏫' }, { path: '/students', label: 'Students', icon: '👨‍🎓' }, { path: '/grades', label: 'Academic records', icon: '📝' }, { path: '/attendance', label: 'Student attendance', icon: '📋' }, { path: '/teacher-attendance', label: 'Teacher attendance', icon: '🗓️' }, { path: '/announcements', label: 'Announcements', icon: '📢' }];
    if (role === 'teacher')                            return [...commonItems, ...teacherItems];
    if (role === 'finance' || role === 'finance-staff') return [...commonItems, ...financeItems, { path: '/teacher-attendance', label: 'Teacher attendance', icon: '🗓️' }];
    if (role === 'principal' || role === 'proprietor' || role === 'proprietress') return [...commonItems, { path: '/divisions', label: 'Divisions', icon: '🏢' }, { path: '/classes', label: 'Classes', icon: '🏫' }, { path: '/subjects', label: 'Subjects', icon: '📚' }, { path: '/students', label: 'Students', icon: '👨‍🎓' }, { path: '/grades', label: 'Academic records', icon: '📝' }, { path: '/report-cards', label: 'Report cards', icon: '🎓' }, { path: '/attendance', label: 'Student attendance', icon: '📋' }, { path: '/teacher-attendance', label: 'Teacher attendance', icon: '🗓️' }, { path: '/salary-structures', label: 'Salary & payroll', icon: '💰' }, { path: '/fee-structure', label: 'Fee structure', icon: '📋' }, { path: '/reports', label: 'Reports', icon: '📈' }, ...(role === 'proprietor' || role === 'proprietress' ? [{ path: '/users', label: 'User accounts', icon: '👥' }, { path: '/announcements', label: 'Announcements', icon: '📢' }] : []) ];
    return commonItems;
  };

  const menuItems = getMenuItems();

  const allowedPaths: Record<string, string[]> = {
    admin:          [...menuItems.map((item) => item.path), '/settings', '/security', '/change-password', '/announcements', '/helpdesk', '/helpdesk-admin', '/users/account/student'],
    teacher:        ['/dashboard', '/profile', '/helpdesk', '/fee-structure', '/students', '/attendance', '/grades', '/assignments', '/comments'],
    'class-teacher':['/dashboard', '/profile', '/helpdesk', '/fee-structure', '/students', '/attendance', '/comments'],
    'subject-teacher':['/dashboard', '/profile', '/helpdesk', '/fee-structure', '/students', '/grades', '/assignments'],
    finance:        ['/dashboard', '/profile', '/helpdesk', '/fee-structure', '/payments', '/receipts', '/reports', '/teacher-attendance'],
    'finance-staff':['/dashboard', '/profile', '/helpdesk', '/fee-structure', '/payments', '/receipts', '/reports', '/teacher-attendance'],
    'vice-principal-instruction': ['/dashboard', '/profile', '/helpdesk', '/divisions', '/classes', '/subjects', '/teachers', '/students', '/grades', '/attendance', '/teacher-attendance', '/announcements'],
    principal:      ['/dashboard', '/profile', '/helpdesk', '/divisions', '/classes', '/subjects', '/fee-structure', '/grades', '/salary-structures', '/teacher-payroll', '/students', '/attendance', '/teacher-attendance', '/report-cards', '/reports', '/announcements'],
    proprietor:     ['/dashboard', '/profile', '/helpdesk', '/divisions', '/classes', '/subjects', '/fee-structure', '/grades', '/salary-structures', '/teacher-payroll', '/students', '/attendance', '/teacher-attendance', '/report-cards', '/reports', '/announcements', '/users', '/admin-staff'],
    proprietress:   ['/dashboard', '/profile', '/helpdesk', '/divisions', '/classes', '/subjects', '/fee-structure', '/grades', '/salary-structures', '/teacher-payroll', '/students', '/attendance', '/teacher-attendance', '/report-cards', '/reports', '/announcements', '/users', '/admin-staff'],
    student:        ['/dashboard', '/profile', '/helpdesk', '/student-profile', '/fee-structure', '/my-grade-sheet', '/my-report-card', '/my-attendance', '/my-assignments', '/my-financial-records'],
    parent:         ['/dashboard', '/profile', '/helpdesk', '/parent-portal', '/fee-structure'],
  };

  const role = user?.role?.slug || '';
  // Allow any path that starts with an allowed prefix, or exact match
  // Allow any path that starts with an allowed prefix, or exact match
  const baseAllowed = allowedPaths[role] || ['/dashboard', '/profile'];
  const alwaysAllowed = ['/dashboard', '/profile', '/change-password', '/helpdesk', '/student-profile', '/my-grade-sheet', '/my-report-card', '/my-attendance', '/my-assignments', '/my-financial-records'];
  const allAllowed = [...baseAllowed, ...alwaysAllowed];
  // Use startsWith to handle dynamic segments like /users/account/student/2
  const canAccess = allAllowed.some((p) =>
    location.pathname === p || location.pathname.startsWith(p + '/')
  );

  useEffect(() => { setIsMobileMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    // Do not make the user wait for a network request before leaving the app.
    // The local token is removed immediately; the server token is revoked in
    // the background when the request can be completed.
    void authService.logout().catch(() => undefined);
    logout();
    navigate('/login', { replace: true });
  };

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // ── Nav item renderer ─────────────────────────────────────────────────────
  const NavItem = ({ item }: { item: { path: string; label: string; icon: string } }) => (
    <li>
      <Link
        to={item.path}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
          isActive(item.path) ? activeItemCls : inactiveItemCls
        }`}
        style={isActive(item.path) && theme.sidebarStyle !== 'light' ? { backgroundColor: 'var(--accent)', color: '#fff' } : {}}
      >
        {theme.showIcons && <span className="w-5 shrink-0 text-center text-base">{item.icon}</span>}
        <span>{item.label}</span>
      </Link>
    </li>
  );

  // ── Sidebar content (shared desktop + mobile) ─────────────────────────────
  const SidebarContent = () => (
    <>
      <div className="relative flex flex-1 min-h-0">
        {/* Visible left track — always rendered, full sidebar height */}
        <div
          className="absolute left-[10px] top-0 bottom-0 w-[3px] rounded-full z-0"
          style={{
            background: theme.sidebarStyle === 'light'
              ? 'rgba(0,0,0,0.1)'
              : 'rgba(255,255,255,0.18)',
          }}
        />

        {/* Scrollable nav — offset to sit beside the track */}
        <nav className="flex-1 overflow-y-auto py-5 pr-3 pl-5 sidebar-nav">
          <p className={`px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] ${theme.sidebarStyle === 'light' ? 'text-slate-400' : 'text-white/30'}`}>
            {role === 'admin' ? 'Admin features' : ['teacher', 'class-teacher', 'subject-teacher'].includes(role) ? 'Teaching' : role === 'finance' || role === 'finance-staff' ? 'Finance' : role === 'parent' ? 'Parent portal' : 'My workspace'}
          </p>
          <ul className="space-y-0.5">{menuItems.map((item) => <NavItem key={item.path} item={item} />)}</ul>
        </nav>
      </div>
      <div className={`mx-3 mb-5 rounded-xl border p-3 text-xs ${theme.sidebarStyle === 'light' ? 'border-slate-200 text-slate-500' : 'border-white/10 bg-white/5 text-white/50'}`}>
        <p className={`font-semibold ${theme.sidebarStyle === 'light' ? 'text-slate-700' : 'text-white/80'}`}>{system.systemName}</p>
        <p className="mt-0.5 leading-4">Year {system.academicYear} · {system.country}</p>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        .sidebar-nav::-webkit-scrollbar {
          width: 8px;
        }
        .sidebar-nav::-webkit-scrollbar-track {
          background: ${theme.sidebarStyle === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)'};
          border-radius: 4px;
        }
        .sidebar-nav::-webkit-scrollbar-thumb {
          background: ${theme.sidebarStyle === 'light' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)'};
          border-radius: 4px;
          border: 2px solid ${theme.sidebarStyle === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)'};
        }
        .sidebar-nav::-webkit-scrollbar-thumb:hover {
          background: ${theme.sidebarStyle === 'light' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)'};
        }
        .sidebar-nav {
          scrollbar-width: thin;
          scrollbar-color: ${theme.sidebarStyle === 'light' ? 'rgba(0,0,0,0.3) rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.4) rgba(255,255,255,0.1)'};
        }
      `}</style>
      <OfflineBanner />
      <div className="flex min-h-screen">

        {/* ── Desktop sidebar ─────────────────────────────── */}
        <aside
          className={`hidden w-64 shrink-0 lg:flex lg:flex-col h-screen ${sidebarBg}`}
          style={sidebarColorStyle}
        >
          <div className={`flex items-center gap-3 border-b px-5 py-6 ${theme.sidebarStyle === 'light' ? 'border-slate-200' : 'border-white/10'}`}>
            {branding.logoUrl
              ? <img src={branding.logoUrl} alt="Logo" className="h-10 w-10 rounded-xl object-contain" />
              : <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-black" style={logoBadgeStyle}>S</div>
            }
            <div className="min-w-0">
              <h1 className={`truncate text-sm font-bold leading-tight ${logoTextCls}`}>{system.systemName}</h1>
              <p className={`truncate text-xs ${logoSubCls}`}>School management</p>
            </div>
          </div>
          <SidebarContent />
        </aside>

        {/* ── Mobile backdrop ─────────────────────────────── */}
        {isMobileMenuOpen && (
          <button
            aria-label="Close navigation menu"
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* ── Mobile drawer ───────────────────────────────── */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[min(86vw,20rem)] flex-col shadow-2xl transition-transform duration-300 lg:hidden h-screen ${sidebarBg} ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
          style={sidebarColorStyle}
        >
          <div className={`flex items-center justify-between border-b px-5 py-5 ${theme.sidebarStyle === 'light' ? 'border-slate-200' : 'border-white/10'}`}>
            <div className="flex items-center gap-3">
              {branding.logoUrl
                ? <img src={branding.logoUrl} alt="Logo" className="h-9 w-9 rounded-xl object-contain" />
                : <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base font-black" style={logoBadgeStyle}>S</div>
              }
              <div>
                <h1 className={`text-sm font-bold ${logoTextCls}`}>{system.systemName}</h1>
                <p className={`text-xs ${logoSubCls}`}>School management</p>
              </div>
            </div>
            <button
              aria-label="Close navigation menu"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xl ${theme.sidebarStyle === 'light' ? 'text-slate-500 hover:bg-slate-100' : 'text-white/60 hover:bg-white/10'}`}
            >×</button>
          </div>
          <SidebarContent />
        </aside>

        {/* ── Main content ────────────────────────────────── */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                <button
                  aria-label="Open navigation menu"
                  aria-expanded={isMobileMenuOpen}
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 lg:hidden"
                >
                  <span className="flex w-4 flex-col gap-[3px]">
                    <span className="h-0.5 w-full rounded bg-current" />
                    <span className="h-0.5 w-full rounded bg-current" />
                    <span className="h-0.5 w-full rounded bg-current" />
                  </span>
                </button>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest lg:hidden" style={{ color: 'var(--accent)' }}>{system.systemName}</p>
                  <h2 className="text-lg font-bold text-slate-900">
                    {menuItems.find((item) => isActive(item.path))?.label || 'Dashboard'}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold text-slate-900">{user?.first_name} {user?.last_name}</p>
                  <p className="text-xs capitalize text-slate-400">{user?.role?.name || 'User'}</p>
                </div>
                <NotificationBell />
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
                  style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent-dark)' }}
                >
                  {user?.first_name?.charAt(0) || 'U'}
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          <div className="flex-1 p-4 sm:p-5 md:p-7">
            {canAccess ? <Outlet /> : <Navigate to="/dashboard" replace />}
          </div>
        </main>
      </div>
    </div>
  );
}
