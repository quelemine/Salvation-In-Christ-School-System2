import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { pageLayoutService, type PageLayout } from '../services/pageLayoutService';
import { Button, Card, CardContent, LoadingState } from '../components/ui';

const pageList = ['students', 'teachers', 'classes', 'subjects', 'divisions', 'grades', 'attendance', 'assignments', 'fees', 'payments', 'invoices', 'announcements', 'helpdesk', 'users', 'activity-logs', 'report-cards', 'receipts'];

export default function PageLayoutEditor() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';
  const [selectedPage, setSelectedPage] = useState<string>('students');
  const [layout, setLayout] = useState<PageLayout | null>(null);
  const [primaryButtonColor, setPrimaryButtonColor] = useState<string>('#2563EB');
  const [secondaryButtonColor, setSecondaryButtonColor] = useState<string>('#64748B');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLayout();
  }, [selectedPage]);

  const loadLayout = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await pageLayoutService.getByPage(selectedPage);
      setLayout(data);
      setPrimaryButtonColor(data.primary_button_color || '#2563EB');
      setSecondaryButtonColor(data.secondary_button_color || '#64748B');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load page layout.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!layout) return;
    setSaving(true);
    setError('');
    try {
      if (layout.is_default) {
        await pageLayoutService.create({
          page_key: selectedPage,
          sections: layout.sections,
          layout_type: layout.layout_type,
          primary_button_color: primaryButtonColor,
          secondary_button_color: secondaryButtonColor,
        });
      } else {
        await pageLayoutService.update(layout.id, {
          sections: layout.sections,
          layout_type: layout.layout_type,
          primary_button_color: primaryButtonColor,
          secondary_button_color: secondaryButtonColor,
        });
      }
      await loadLayout();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save page layout.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    setError('');
    try {
      await pageLayoutService.reset(selectedPage);
      await loadLayout();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset page layout.');
    } finally {
      setSaving(false);
    }
  };

  const toggleSectionVisibility = (sectionId: string) => {
    if (!layout) return;
    setLayout({
      ...layout,
      sections: layout.sections.map(section =>
        section.id === sectionId ? { ...section, visible: !section.visible } : section
      ),
    });
  };

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    if (!layout) return;
    const sections = [...layout.sections];
    const index = sections.findIndex(s => s.id === sectionId);
    
    if (direction === 'up' && index > 0) {
      [sections[index], sections[index - 1]] = [sections[index - 1], sections[index]];
    } else if (direction === 'down' && index < sections.length - 1) {
      [sections[index], sections[index + 1]] = [sections[index + 1], sections[index]];
    }
    
    setLayout({ ...layout, sections });
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Page Layout Editor</h1>
        <p className="mt-2 text-slate-600">Customize page layouts and section visibility</p>
      </div>

      {/* Page Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Select Page</h3>
        <div className="flex flex-wrap gap-2">
          {pageList.map(page => (
            <Button
              key={page}
              onClick={() => setSelectedPage(page)}
              className={selectedPage === page 
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold shadow-md' 
                : 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold border border-slate-300'
              }
            >
              {page.charAt(0).toUpperCase() + page.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm">
          <p className="text-sm text-rose-800 mb-4">{error}</p>
          <Button onClick={loadLayout} className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold">Try Again</Button>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 shadow-sm">
          <LoadingState message="Loading page layout..." />
        </div>
      ) : layout && (
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {selectedPage.charAt(0).toUpperCase() + selectedPage.slice(1)} Page Layout
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Manage section visibility and ordering</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleReset} className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold border border-slate-300">
                    Reset to Default
                  </Button>
                  <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold shadow-md" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Layout'}
                  </Button>
                </div>
              </div>

              {layout.is_default && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">Using default layout. Save to create custom layout.</p>
                </div>
              )}

              {/* Button Color Customization */}
              <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Button Color Customization</h3>
                <div className="flex gap-6">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium text-slate-600">Primary Button Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={primaryButtonColor}
                        onChange={(e) => setPrimaryButtonColor(e.target.value)}
                        className="w-12 h-8 rounded cursor-pointer border border-slate-300"
                      />
                      <span className="text-xs text-slate-500">{primaryButtonColor}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium text-slate-600">Secondary Button Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={secondaryButtonColor}
                        onChange={(e) => setSecondaryButtonColor(e.target.value)}
                        className="w-12 h-8 rounded cursor-pointer border border-slate-300"
                      />
                      <span className="text-xs text-slate-500">{secondaryButtonColor}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {layout.sections.map((section, index) => (
                  <div
                    key={section.id}
                    className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-lg bg-white hover:border-blue-300 transition-all duration-200"
                  >
                    <div className="flex-1">
                      <span className="font-bold text-slate-900">{section.id}</span>
                      <span className="ml-2 text-sm text-slate-500">({section.type})</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => moveSection(section.id, 'up')}
                        className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold border border-slate-300 px-3 py-1"
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        onClick={() => moveSection(section.id, 'down')}
                        className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold border border-slate-300 px-3 py-1"
                        disabled={index === layout.sections.length - 1}
                      >
                        ↓
                      </Button>
                      <Button
                        onClick={() => toggleSectionVisibility(section.id)}
                        className={section.visible 
                          ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold shadow-md px-3 py-1' 
                          : 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold border border-slate-300 px-3 py-1'
                        }
                      >
                        {section.visible ? 'Visible' : 'Hidden'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
