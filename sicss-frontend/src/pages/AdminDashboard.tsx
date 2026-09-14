import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Button, Card, CardContent, LoadingState } from '../components/ui';

interface DashboardItem {
  id: string;
  title: string;
  description: string;
  path: string;
  category: string;
}

const dashboardItems: DashboardItem[] = [
  // Academic Structure
  { id: 'divisions', title: 'Divisions', description: 'Manage school divisions', path: '/divisions', category: 'Academic Structure' },
  { id: 'classes', title: 'Classes', description: 'Manage classes and sections', path: '/classes', category: 'Academic Structure' },
  { id: 'subjects', title: 'Subjects', description: 'Manage subjects and curriculum', path: '/subjects', category: 'Academic Structure' },
  
  // People Management
  { id: 'students', title: 'Students', description: 'Manage student records', path: '/students', category: 'People Management' },
  { id: 'teachers', title: 'Teachers', description: 'Manage teacher records', path: '/teachers', category: 'People Management' },
  { id: 'users', title: 'Users', description: 'Manage system users', path: '/users', category: 'People Management' },
  
  // Academic Records
  { id: 'grades', title: 'Grades', description: 'Manage student grades', path: '/grades', category: 'Academic Records' },
  { id: 'attendance', title: 'Attendance', description: 'Track student attendance', path: '/attendance', category: 'Academic Records' },
  { id: 'assignments', title: 'Assignments', description: 'Manage assignments', path: '/assignments', category: 'Academic Records' },
  
  // Financial
  { id: 'fees', title: 'Fees', description: 'Manage fee structures', path: '/fees', category: 'Financial' },
  { id: 'payments', title: 'Payments', description: 'Track payments', path: '/payments', category: 'Financial' },
  { id: 'invoices', title: 'Invoices', description: 'Manage invoices', path: '/invoices', category: 'Financial' },
  
  // Communication
  { id: 'announcements', title: 'Announcements', description: 'School announcements', path: '/announcements', category: 'Communication' },
  { id: 'helpdesk', title: 'Helpdesk', description: 'Support tickets', path: '/helpdesk', category: 'Communication' },
  
  // Customization
  { id: 'page-content', title: 'Page Content', description: 'Customize page text and labels', path: '/admin/page-content', category: 'Customization' },
  { id: 'page-layouts', title: 'Page Layouts', description: 'Customize page layouts', path: '/admin/page-layouts', category: 'Customization' },
  { id: 'settings', title: 'Settings', description: 'System configuration', path: '/settings', category: 'Customization' },
];

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    setLoading(false);
  }, []);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
          <p className="text-slate-600 mt-2">This page is only accessible to administrators.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  const categories = ['All', ...Array.from(new Set(dashboardItems.map(item => item.category)))];
  const filteredItems = selectedCategory === 'All' 
    ? dashboardItems 
    : dashboardItems.filter(item => item.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
        <p className="mt-2 text-slate-600">Quick access to all system pages and customization tools</p>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Filter by Category</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <Button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={selectedCategory === category 
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold shadow-md' 
                : 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold border border-slate-300'
              }
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredItems.map(item => (
          <a
            key={item.id}
            href={item.path}
            className="block"
          >
            <Card className="h-full transition-all duration-200 hover:shadow-xl hover:scale-105 cursor-pointer border-2 border-slate-200 hover:border-blue-400">
              <CardContent className="p-6">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                  <p className="mt-3 text-xs font-semibold text-blue-600 bg-blue-50 inline-block px-2 py-1 rounded">{item.category}</p>
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
