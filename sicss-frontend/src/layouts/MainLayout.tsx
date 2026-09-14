import { useEffect, useState } from 'react';
import { Outlet, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import OfflineBanner from '../components/OfflineBanner';
import NotificationBell from '../components/NotificationBell';
import { authService } from '../services/authService';

interface MenuItem {
  path: string;
  label: string;
  icon: string;
}

interface MenuCategory {
  name: string;
  items: MenuItem[];
}

export default function MainLayout() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { settings } = useSettingsStore();
  const { branding, theme, system } = settings;

  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Main']));

  const isActive = (path: string) => location.pathname === path;

  // Generate breadcrumb from current path
  const getBreadcrumb = () => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const breadcrumbItems = [{ label: 'Dashboard', path: '/dashboard' }];
    
    let currentPath = '';
    for (const part of pathParts) {
      currentPath += `/${part}`;
      const menuItem = allMenuItems.find((item) => item.path === currentPath);
      if (menuItem && menuItem.label !== 'Dashboard') {
        breadcrumbItems.push({ label: menuItem.label, path: currentPath });
      }
    }
    
    return breadcrumbItems;
  };

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  // ── Sidebar colour scheme - SICSS navy as per design requirements ─────────────
  const sidebarBg = 'bg-sicss-navy text-white';
  const sidebarColorStyle = { backgroundColor: '#0D2747' };
  const activeItemCls = 'bg-sicss-primary text-white font-semibold';
  const inactiveItemCls = 'text-slate-300 hover:bg-white/10 hover:text-white transition-colors';
  const logoBadgeStyle = { backgroundColor: '#2563EB', color: '#fff' };

  // ── Menu items by role ────────────────────────────────────────────────────
  const getMenuCategories = (): MenuCategory[] => {
    const role = user?.role?.slug || '';

    const commonItems: MenuItem[] = [
      { path: '/dashboard', label: 'Dashboard', icon: '📊' },
      { path: '/profile', label: 'My Profile', icon: '👤' },
    ];

    const peopleItems: MenuItem[] = [
      { path: '/students', label: 'Students', icon: '👨‍🎓' },
      { path: '/application', label: 'Unified Application', icon: '📋' },
      { path: '/teachers', label: 'Teachers', icon: '👨‍🏫' },
      { path: '/admin-staff', label: 'Staff', icon: '👥' },
      { path: '/users', label: 'Users', icon: '👤' },
      { path: '/roles', label: 'Roles', icon: '🔑' },
    ];

    const schoolItems: MenuItem[] = [
      { path: '/divisions', label: 'Divisions', icon: '🏢' },
      { path: '/classes', label: 'Classes', icon: '🏫' },
      { path: '/subjects', label: 'Subjects', icon: '📚' },
    ];

    const academicsItems: MenuItem[] = [
      { path: '/grades', label: 'Academic Records', icon: '📝' },
      { path: '/assignments', label: 'Assignments', icon: '📄' },
      { path: '/comments', label: 'Comments', icon: '💬' },
      { path: '/report-cards', label: 'Report Cards', icon: '🎓' },
      { path: '/academic-calendar', label: 'Academic Calendar', icon: '📅' },
      { path: '/exams', label: 'Exams', icon: '📋' },
      { path: '/timetable', label: 'Timetable', icon: '🗓️' },
      { path: '/discipline-records', label: 'Discipline', icon: '⚖️' },
    ];

    const libraryItems: MenuItem[] = [
      { path: '/library', label: 'Library', icon: '📚' },
    ];

    const transportationItems: MenuItem[] = [
      { path: '/transportation', label: 'Transportation', icon: '🚌' },
    ];

    const hostelItems: MenuItem[] = [
      { path: '/hostel', label: 'Hostel', icon: '🏠' },
    ];

    const inventoryItems: MenuItem[] = [
      { path: '/inventory', label: 'Inventory', icon: '📦' },
    ];

    const sportsItems: MenuItem[] = [
      { path: '/sports-activities', label: 'Sports & Activities', icon: '⚽' },
    ];

    const communicationItems: MenuItem[] = [
      { path: '/notifications', label: 'Notifications', icon: '🔔' },
      { path: '/announcements', label: 'Announcements', icon: '📢' },
      { path: '/helpdesk', label: 'Help Desk', icon: '🎫' },
    ];

    const administrationItems: MenuItem[] = [
      { path: '/bulk-import-export', label: 'Import/Export', icon: '📥' },
      { path: '/documents', label: 'Documents', icon: '📄' },
      { path: '/medical-records', label: 'Medical Records', icon: '🏥' },
      { path: '/id-cards', label: 'ID Cards', icon: '🪪' },
      { path: '/certificates', label: 'Certificates', icon: '🎓' },
      { path: '/alumni', label: 'Alumni', icon: '👨‍🎓' },
      { path: '/admin-dashboard', label: 'Admin Dashboard', icon: '🎛️' },
      { path: '/admin/page-content', label: 'Page Content', icon: '✏️' },
      { path: '/admin/page-layouts', label: 'Page Layouts', icon: '📐' },
      { path: '/admin/page-columns', label: 'Table Columns', icon: '📊' },
      { path: '/settings', label: 'Settings', icon: '⚙️' },
      { path: '/activity-logs', label: 'Activity Logs', icon: '🛡️' },
      { path: '/security', label: 'Security Center', icon: '🔐' },
      { path: '/sync', label: 'Sync Status', icon: '🔄' },
    ];

    const attendanceItems: MenuItem[] = [
      { path: '/attendance', label: 'Student Attendance', icon: '📋' },
      { path: '/teacher-attendance', label: 'Teacher Attendance', icon: '🗓️' },
    ];

    const financeItems: MenuItem[] = [
      { path: '/fee-structure', label: 'Fee Structure', icon: '💰' },
      { path: '/fee-clearance', label: 'Fee Clearance', icon: '✅' },
      { path: '/payments', label: 'Payments', icon: '💵' },
      { path: '/invoices', label: 'Invoices', icon: '📄' },
      { path: '/receipts', label: 'Receipts', icon: '🧾' },
      { path: '/salary-structures', label: 'Salary & Payroll', icon: '💳' },
    ];

    const reportsItems: MenuItem[] = [
      { path: '/reports', label: 'Reports', icon: '📊' },
    ];

    const helpItems: MenuItem[] = [
      { path: '/helpdesk', label: 'Help desk', icon: '🎫' },
    ];

    const studentPersonalItems: MenuItem[] = [
      { path: '/my-grade-sheet', label: 'My grade sheet', icon: '📝' },
      { path: '/my-attendance', label: 'My attendance', icon: '📋' },
      { path: '/my-assignments', label: 'My assignments', icon: '📄' },
      { path: '/my-financial-records', label: 'My finance', icon: '💰' },
    ];

    const parentItems: MenuItem[] = [
      { path: '/parent-portal', label: 'My children', icon: '👨‍👩‍👧' },
    ];

    const teacherSpecificItems: MenuItem[] = [
      { path: '/class-sponsor-portal', label: 'Mark sheet', icon: '📊' },
      { path: '/subject-marks', label: 'Submit marks', icon: '✏️' },
    ];

    // Build categories based on role
    if (role === 'admin') {
      return [
        { name: 'Main', items: commonItems },
        { name: 'People', items: peopleItems },
        { name: 'School', items: schoolItems },
        { name: 'Academics', items: academicsItems },
        { name: 'Library', items: libraryItems },
        { name: 'Transportation', items: transportationItems },
        { name: 'Hostel', items: hostelItems },
        { name: 'Inventory', items: inventoryItems },
        { name: 'Sports', items: sportsItems },
        { name: 'Attendance', items: attendanceItems },
        { name: 'Finance', items: financeItems },
        { name: 'Communication', items: communicationItems },
        { name: 'Reports', items: reportsItems },
        { name: 'Administration', items: administrationItems },
      ];
    }

    if (role === 'principal' || role === 'proprietor' || role === 'proprietress') {
      const categories: MenuCategory[] = [
        { name: 'Main', items: commonItems },
        { name: 'People', items: peopleItems },
        { name: 'School', items: schoolItems },
        { name: 'Academics', items: academicsItems },
        { name: 'Attendance', items: attendanceItems },
        { name: 'Finance', items: financeItems },
        { name: 'Communication', items: communicationItems },
        { name: 'Reports', items: reportsItems },
      ];
      
      if (role === 'proprietor' || role === 'proprietress') {
        categories.push({ name: 'Administration', items: [{ path: '/users', label: 'User accounts', icon: '👥' }, { path: '/settings', label: 'Settings', icon: '⚙️' }] });
      }
      
      return categories;
    }

    if (role === 'vice-principal-instruction') {
      return [
        { name: 'Main', items: commonItems },
        { name: 'People', items: [{ path: '/students', label: 'Students', icon: '👨‍🎓' }, { path: '/teachers', label: 'Teachers', icon: '👨‍🏫' }] },
        { name: 'School', items: schoolItems },
        { name: 'Academics', items: academicsItems },
        { name: 'Attendance', items: attendanceItems },
        { name: 'Communication', items: communicationItems },
      ];
    }

    if (role === 'class-teacher' || role === 'class-sponsor') {
      return [
        { name: 'Main', items: commonItems },
        { name: 'My Students', items: [{ path: '/students', label: 'My students', icon: '👨‍🎓' }] },
        { name: 'Attendance', items: [{ path: '/attendance', label: 'Student attendance', icon: '📋' }] },
        { name: 'Academics', items: [{ path: '/comments', label: 'Comments', icon: '💬' }, { path: '/report-cards', label: 'Report cards', icon: '🎓' }] },
        { name: 'Teaching', items: teacherSpecificItems },
        { name: 'Finance', items: [{ path: '/fee-structure', label: 'Fee structure', icon: '📋' }] },
        { name: 'Help', items: helpItems },
      ];
    }

    if (role === 'subject-teacher') {
      return [
        { name: 'Main', items: commonItems },
        { name: 'My Students', items: [{ path: '/students', label: 'My students', icon: '👨‍🎓' }] },
        { name: 'Academics', items: [{ path: '/grades', label: 'Grades', icon: '📝' }, { path: '/assignments', label: 'Assignments', icon: '📄' }] },
        { name: 'Teaching', items: teacherSpecificItems },
        { name: 'Finance', items: [{ path: '/fee-structure', label: 'Fee structure', icon: '📋' }] },
        { name: 'Help', items: helpItems },
      ];
    }

    if (role === 'student') {
      return [
        { name: 'Main', items: commonItems },
        { name: 'My Records', items: studentPersonalItems },
        { name: 'Finance', items: [{ path: '/fee-structure', label: 'Fee structure', icon: '📋' }] },
        { name: 'Help', items: helpItems },
      ];
    }

    if (role === 'parent') {
      return [
        { name: 'Main', items: commonItems },
        { name: 'My Children', items: parentItems },
        { name: 'Finance', items: [{ path: '/fee-structure', label: 'Fee structure', icon: '📋' }] },
        { name: 'Help', items: helpItems },
      ];
    }

    if (role === 'finance' || role === 'finance-staff') {
      return [
        { name: 'Main', items: commonItems },
        { name: 'People', items: [{ path: '/students', label: 'Students', icon: '👨‍🎓' }] },
        { name: 'Finance', items: financeItems },
        { name: 'Attendance', items: [{ path: '/teacher-attendance', label: 'Teacher attendance', icon: '🗓️' }] },
        { name: 'Reports', items: reportsItems },
        { name: 'Help', items: helpItems },
      ];
    }

    if (role === 'teacher') {
      return [
        { name: 'Main', items: commonItems },
        { name: 'People', items: [{ path: '/students', label: 'Students', icon: '👨‍🎓' }] },
        { name: 'Attendance', items: [{ path: '/attendance', label: 'Student attendance', icon: '📋' }] },
        { name: 'Academics', items: academicsItems },
        { name: 'Finance', items: [{ path: '/fee-structure', label: 'Fee structure', icon: '📋' }] },
        { name: 'Help', items: helpItems },
      ];
    }

    return [
      { name: 'Main', items: commonItems },
      { name: 'Help', items: helpItems },
    ];
  };

  const menuCategories = getMenuCategories();
  const allMenuItems = menuCategories.flatMap(cat => cat.items);

  const allowedPaths: Record<string, string[]> = {
    admin:          [...allMenuItems.map((item) => item.path), '/settings', '/security', '/change-password', '/announcements', '/helpdesk', '/helpdesk-admin', '/users/account/student', '/teacher-application', '/application'],
    teacher:        ['/dashboard', '/profile', '/helpdesk', '/fee-structure', '/students', '/attendance', '/grades', '/assignments', '/comments'],
    'class-teacher':['/dashboard', '/profile', '/helpdesk', '/fee-structure', '/students', '/attendance', '/comments', '/class-sponsor-portal', '/report-cards'],
    'class-sponsor':['/dashboard', '/profile', '/helpdesk', '/fee-structure', '/students', '/attendance', '/comments', '/class-sponsor-portal', '/report-cards'],
    'subject-teacher':['/dashboard', '/profile', '/helpdesk', '/fee-structure', '/students', '/grades', '/assignments', '/subject-marks'],
    finance:        ['/dashboard', '/profile', '/helpdesk', '/fee-structure', '/payments', '/receipts', '/reports', '/teacher-attendance'],
    'finance-staff':['/dashboard', '/profile', '/helpdesk', '/fee-structure', '/payments', '/receipts', '/reports', '/teacher-attendance'],
    'vice-principal-instruction': ['/dashboard', '/profile', '/helpdesk', '/report-cards', '/divisions', '/classes', '/subjects', '/teachers', '/students', '/grades', '/attendance', '/teacher-attendance', '/announcements'],
    principal:      ['/dashboard', '/profile', '/helpdesk', '/divisions', '/classes', '/subjects', '/fee-structure', '/grades', '/salary-structures', '/teacher-payroll', '/students', '/attendance', '/teacher-attendance', '/report-cards', '/reports', '/announcements', '/teacher-application', '/application'],
    proprietor:     ['/dashboard', '/profile', '/helpdesk', '/divisions', '/classes', '/subjects', '/fee-structure', '/grades', '/salary-structures', '/teacher-payroll', '/students', '/attendance', '/teacher-attendance', '/report-cards', '/reports', '/announcements', '/users', '/admin-staff', '/teacher-application', '/application'],
    proprietress:   ['/dashboard', '/profile', '/helpdesk', '/divisions', '/classes', '/subjects', '/fee-structure', '/grades', '/salary-structures', '/teacher-payroll', '/students', '/attendance', '/teacher-attendance', '/report-cards', '/reports', '/announcements', '/users', '/admin-staff', '/teacher-application', '/application'],
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
  const NavItem = ({ item }: { item: MenuItem }) => (
    <li>
      <Link
        to={item.path}
        className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition-all ${
          isActive(item.path) ? activeItemCls : inactiveItemCls
        }`}
      >
        <span className="w-5 shrink-0 text-center text-base">{item.icon}</span>
        {!isSidebarCollapsed && <span>{item.label}</span>}
      </Link>
    </li>
  );

  // ── Category renderer ─────────────────────────────────────────────────────
  const MenuCategory = ({ category }: { category: MenuCategory }) => {
    const isExpanded = expandedCategories.has(category.name);
    
    return (
      <div className="mb-4">
        {!isSidebarCollapsed ? (
          <>
            <button
              onClick={() => toggleCategory(category.name)}
              className="flex w-full items-center justify-between px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors group"
            >
              <span className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-sm border border-slate-500 flex items-center justify-center text-[10px] transition-colors ${isExpanded ? 'bg-blue-500 border-blue-500 text-white' : 'group-hover:border-white'}`}>
                  {isExpanded ? '−' : '+'}
                </span>
                {category.name}
              </span>
            </button>
            {isExpanded && (
              <ul className="mt-1 space-y-0.5 pl-10">
                {category.items.map((item) => (
                  <NavItem key={item.path} item={item} />
                ))}
              </ul>
            )}
          </>
        ) : (
          <ul className="space-y-0.5">
            {category.items.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </ul>
        )}
      </div>
    );
  };

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

        {/* Scrollable nav */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 sidebar-nav">
          {menuCategories.map((category) => (
            <MenuCategory key={category.name} category={category} />
          ))}
        </nav>
      </div>
      {!isSidebarCollapsed && (
        <div className="mx-4 mb-5 rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/70 shadow-lg">
          <p className="font-semibold text-white/90">{system.systemName}</p>
          <p className="mt-0.5 leading-4">Year {system.academicYear} · {system.country}</p>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-sicss-page">
      <OfflineBanner />
      <div className="flex min-h-screen">

        {/* ── Desktop sidebar - dark navy ─────────────────────── */}
        <aside
          className={`hidden shrink-0 lg:flex lg:flex-col h-full bg-sicss-navy text-white transition-all duration-300 shadow-xl ${isSidebarCollapsed ? 'w-16' : 'w-[250px]'}`}
          style={sidebarColorStyle}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-6">
            <div className="flex items-center gap-3">
              {branding.logoUrl
                ? <img src={branding.logoUrl} alt="Logo" className="h-10 w-10 rounded-xl object-contain shadow-lg" />
                : <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-black shadow-lg" style={logoBadgeStyle}>S</div>
              }
              {!isSidebarCollapsed && (
                <div className="min-w-0">
                  <h1 className="truncate text-sm font-bold leading-tight text-white">SICSS</h1>
                  <p className="truncate text-xs text-slate-400">Salvation In Christ School System</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-all"
            >
              {isSidebarCollapsed ? '→' : '←'}
            </button>
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
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <div className="flex items-center gap-3">
              {branding.logoUrl
                ? <img src={branding.logoUrl} alt="Logo" className="h-9 w-9 rounded-xl object-contain shadow-lg" />
                : <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base font-black shadow-lg" style={logoBadgeStyle}>S</div>
              }
              <div>
                <h1 className="text-sm font-bold text-white">SICSS</h1>
                <p className="text-xs text-slate-400">Salvation In Christ School System</p>
              </div>
            </div>
            <button
              aria-label="Close navigation menu"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-xl text-white/60 hover:bg-white/10 transition-colors"
            >×</button>
          </div>
          <SidebarContent />
        </aside>

        {/* ── Main content ────────────────────────────────── */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                <button
                  aria-label="Toggle sidebar"
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="hidden lg:flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-blue-500 hover:bg-slate-50 transition-colors"
                >
                  {isSidebarCollapsed ? '→' : '←'}
                </button>
                <button
                  aria-label="Open navigation menu"
                  aria-expanded={isMobileMenuOpen}
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-blue-500 hover:bg-slate-50 transition-colors lg:hidden"
                >
                  <span className="flex w-4 flex-col gap-[3px]">
                    <span className="h-0.5 w-full rounded bg-current" />
                    <span className="h-0.5 w-full rounded bg-current" />
                    <span className="h-0.5 w-full rounded bg-current" />
                  </span>
                </button>
                <nav className="flex items-center gap-2 text-sm">
                  {getBreadcrumb().map((item, index) => (
                    <span key={item.path} className="flex items-center gap-2">
                      {index > 0 && <span className="text-slate-400">/</span>}
                      {index === getBreadcrumb().length - 1 ? (
                        <span className="font-semibold text-slate-900">{item.label}</span>
                      ) : (
                        <Link to={item.path} className="text-slate-600 hover:text-blue-600 transition-colors">
                          {item.label}
                        </Link>
                      )}
                    </span>
                  ))}
                </nav>
              </div>
              <div className="flex items-center gap-4">
                <NotificationBell />
                <div className="hidden sm:flex sm:items-center sm:gap-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/25">
                    {user?.first_name?.charAt(0) || 'U'}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{user?.first_name} {user?.last_name}</p>
                    <p className="text-xs capitalize text-slate-500">{user?.role?.name || 'User'}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
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
