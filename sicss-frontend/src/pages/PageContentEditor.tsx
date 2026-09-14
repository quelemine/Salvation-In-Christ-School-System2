import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { pageContentService, type PageContent } from '../services/pageContentService';
import { Button, Card, CardContent, Input, LoadingState } from '../components/ui';
import { FormModal } from '../components/FormModal';

interface PageSection {
  section_key: string;
  label: string;
  default_content: string;
  content_type: string;
}

const pageDefinitions: Record<string, PageSection[]> = {
  'students': [
    { section_key: 'title', label: 'Page Title', default_content: 'Students', content_type: 'text' },
    { section_key: 'description', label: 'Page Description', default_content: 'Manage student records and information', content_type: 'text' },
    { section_key: 'empty_state', label: 'Empty State Message', default_content: 'No students found', content_type: 'text' },
  ],
  'teachers': [
    { section_key: 'title', label: 'Page Title', default_content: 'Teachers', content_type: 'text' },
    { section_key: 'description', label: 'Page Description', default_content: 'Manage teacher records and information', content_type: 'text' },
    { section_key: 'empty_state', label: 'Empty State Message', default_content: 'No teachers found', content_type: 'text' },
  ],
  'classes': [
    { section_key: 'title', label: 'Page Title', default_content: 'Classes', content_type: 'text' },
    { section_key: 'description', label: 'Page Description', default_content: 'Manage classes and divisions', content_type: 'text' },
    { section_key: 'empty_state', label: 'Empty State Message', default_content: 'No classes found', content_type: 'text' },
  ],
  'subjects': [
    { section_key: 'title', label: 'Page Title', default_content: 'Subjects', content_type: 'text' },
    { section_key: 'description', label: 'Page Description', default_content: 'Manage subjects and curriculum', content_type: 'text' },
    { section_key: 'empty_state', label: 'Empty State Message', default_content: 'No subjects found', content_type: 'text' },
  ],
  'divisions': [
    { section_key: 'title', label: 'Page Title', default_content: 'Divisions', content_type: 'text' },
    { section_key: 'description', label: 'Page Description', default_content: 'Manage school divisions', content_type: 'text' },
    { section_key: 'empty_state', label: 'Empty State Message', default_content: 'No divisions found', content_type: 'text' },
  ],
  'grades': [
    { section_key: 'title', label: 'Page Title', default_content: 'Grades', content_type: 'text' },
    { section_key: 'description', label: 'Page Description', default_content: 'Manage student grades', content_type: 'text' },
  ],
  'attendance': [
    { section_key: 'title', label: 'Page Title', default_content: 'Attendance', content_type: 'text' },
    { section_key: 'description', label: 'Page Description', default_content: 'Track student attendance', content_type: 'text' },
  ],
  'assignments': [
    { section_key: 'title', label: 'Page Title', default_content: 'Assignments', content_type: 'text' },
    { section_key: 'description', label: 'Page Description', default_content: 'Manage assignments', content_type: 'text' },
  ],
  'fees': [
    { section_key: 'title', label: 'Page Title', default_content: 'Fees', content_type: 'text' },
    { section_key: 'description', label: 'Page Description', default_content: 'Manage fee structures', content_type: 'text' },
  ],
  'payments': [
    { section_key: 'title', label: 'Page Title', default_content: 'Payments', content_type: 'text' },
    { section_key: 'description', label: 'Page Description', default_content: 'Track payments', content_type: 'text' },
  ],
  'invoices': [
    { section_key: 'title', label: 'Page Title', default_content: 'Invoices', content_type: 'text' },
    { section_key: 'description', label: 'Page Description', default_content: 'Manage invoices', content_type: 'text' },
  ],
  'announcements': [
    { section_key: 'title', label: 'Page Title', default_content: 'Announcements', content_type: 'text' },
    { section_key: 'description', label: 'Page Description', default_content: 'School announcements', content_type: 'text' },
  ],
  'helpdesk': [
    { section_key: 'title', label: 'Page Title', default_content: 'Helpdesk', content_type: 'text' },
    { section_key: 'description', label: 'Page Description', default_content: 'Support tickets', content_type: 'text' },
  ],
  'users': [
    { section_key: 'title', label: 'Page Title', default_content: 'Users', content_type: 'text' },
    { section_key: 'description', label: 'Page Description', default_content: 'Manage system users', content_type: 'text' },
  ],
  'activity-logs': [
    { section_key: 'title', label: 'Page Title', default_content: 'Activity Logs', content_type: 'text' },
    { section_key: 'description', label: 'Page Description', default_content: 'System activity logs', content_type: 'text' },
  ],
  'report-cards': [
    { section_key: 'title', label: 'Page Title', default_content: 'Report Cards', content_type: 'text' },
    { section_key: 'description', label: 'Page Description', default_content: 'Generate report cards', content_type: 'text' },
  ],
  'receipts': [
    { section_key: 'title', label: 'Page Title', default_content: 'Receipts', content_type: 'text' },
    { section_key: 'description', label: 'Page Description', default_content: 'Payment receipts', content_type: 'text' },
  ],
};

export default function PageContentEditor() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';
  const [selectedPage, setSelectedPage] = useState<string>('students');
  const [contents, setContents] = useState<PageContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<PageContent | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadContents();
  }, [selectedPage]);

  const loadContents = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await pageContentService.getByPage(selectedPage);
      setContents(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load page contents.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const sections = pageDefinitions[selectedPage] || [];
      const bulkContents = sections.map(section => {
        const existing = contents.find(c => c.section_key === section.section_key);
        return {
          page_key: selectedPage,
          section_key: section.section_key,
          content: existing?.content || section.default_content,
          content_type: section.content_type,
        };
      });
      
      await pageContentService.bulkUpdate(bulkContents);
      await loadContents();
      setIsOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save page contents.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateContent = async (content: string) => {
    if (!editingContent) return;
    setSaving(true);
    try {
      await pageContentService.update(editingContent.id, { content });
      await loadContents();
      setIsOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update content.');
    } finally {
      setSaving(false);
    }
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
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Page Content Editor</h1>
        <p className="mt-2 text-slate-600">Customize page text and labels across the system</p>
      </div>

      {/* Page Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Select Page</h3>
        <div className="flex flex-wrap gap-2">
          {Object.keys(pageDefinitions).map(page => (
            <Button
              key={page}
              onClick={() => setSelectedPage(page)}
              className={selectedPage === page 
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium transition-all duration-200 transform active:scale-95' 
                : 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-medium transition-all duration-200 transform active:scale-95'
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
          <Button onClick={loadContents} className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium transition-all duration-200 transform active:scale-95">Try Again</Button>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 shadow-sm">
          <LoadingState message="Loading page contents..." />
        </div>
      ) : (
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {selectedPage.charAt(0).toUpperCase() + selectedPage.slice(1)} Page Content
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Edit the text and labels for this page</p>
                </div>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium transition-all duration-200 transform active:scale-95" disabled={saving}>
                  {saving ? 'Saving...' : 'Save All Changes'}
                </Button>
              </div>

              <div className="space-y-6">
                {(pageDefinitions[selectedPage] || []).map(section => {
                  const content = contents.find(c => c.section_key === section.section_key);
                  return (
                    <div key={section.section_key} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        {section.label}
                      </label>
                      <Input
                        type="textarea"
                        value={content?.content || section.default_content}
                        onChange={(e) => {
                          const newContents = [...contents];
                          const existingIndex = newContents.findIndex(c => c.section_key === section.section_key);
                          if (existingIndex >= 0) {
                            newContents[existingIndex] = { ...newContents[existingIndex], content: e.target.value };
                          } else {
                            newContents.push({
                              id: 0,
                              page_key: selectedPage,
                              section_key: section.section_key,
                              content: e.target.value,
                              content_type: section.content_type,
                              created_at: '',
                              updated_at: '',
                            });
                          }
                          setContents(newContents);
                        }}
                        rows={3}
                        placeholder={section.default_content}
                        className="bg-white border-slate-300"
                      />
                      <div className="mt-3 flex gap-4">
                        <div className="flex-1">
                          <label className="mb-1 block text-xs font-medium text-slate-600">Text Color</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={content?.text_color || '#000000'}
                              onChange={(e) => {
                                const newContents = [...contents];
                                const existingIndex = newContents.findIndex(c => c.section_key === section.section_key);
                                if (existingIndex >= 0) {
                                  newContents[existingIndex] = { ...newContents[existingIndex], text_color: e.target.value };
                                } else {
                                  newContents.push({
                                    id: 0,
                                    page_key: selectedPage,
                                    section_key: section.section_key,
                                    content: content?.content || section.default_content,
                                    content_type: section.content_type,
                                    text_color: e.target.value,
                                    created_at: '',
                                    updated_at: '',
                                  });
                                }
                                setContents(newContents);
                              }}
                              className="w-12 h-8 rounded cursor-pointer border border-slate-300"
                            />
                            <span className="text-xs text-slate-500">{content?.text_color || '#000000'}</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <label className="mb-1 block text-xs font-medium text-slate-600">Background Color</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={content?.background_color || '#ffffff'}
                              onChange={(e) => {
                                const newContents = [...contents];
                                const existingIndex = newContents.findIndex(c => c.section_key === section.section_key);
                                if (existingIndex >= 0) {
                                  newContents[existingIndex] = { ...newContents[existingIndex], background_color: e.target.value };
                                } else {
                                  newContents.push({
                                    id: 0,
                                    page_key: selectedPage,
                                    section_key: section.section_key,
                                    content: content?.content || section.default_content,
                                    content_type: section.content_type,
                                    background_color: e.target.value,
                                    created_at: '',
                                    updated_at: '',
                                  });
                                }
                                setContents(newContents);
                              }}
                              className="w-12 h-8 rounded cursor-pointer border border-slate-300"
                            />
                            <span className="text-xs text-slate-500">{content?.background_color || '#ffffff'}</span>
                          </div>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">Default: {section.default_content}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <FormModal
        isOpen={isOpen}
        title="Edit Content"
        onClose={() => setIsOpen(false)}
        onSubmit={() => editingContent && handleUpdateContent(editingContent.content)}
        submitText="Save"
        isLoading={saving}
      >
        {editingContent && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Content</label>
            <Input
              type="textarea"
              value={editingContent.content}
              onChange={(e) => setEditingContent({ ...editingContent, content: e.target.value })}
              rows={5}
            />
          </div>
        )}
      </FormModal>
    </div>
  );
}
