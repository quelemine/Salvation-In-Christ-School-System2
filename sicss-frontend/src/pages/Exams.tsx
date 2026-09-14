import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { examService, type Exam } from '../services/examService';
import { Button, Card, CardContent, LoadingState } from '../components/ui';
import { FormModal } from '../components/FormModal';

export default function Exams() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [formData, setFormData] = useState<Partial<Exam>>({});
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [academicYear, setAcademicYear] = useState<string>('2024-2025');

  useEffect(() => {
    loadExams();
  }, [filterType, academicYear]);

  const loadExams = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = { academic_year: academicYear };
      if (filterType !== 'all') {
        params.type = filterType;
      }
      const data = await examService.getAll(params);
      setExams(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load exams.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const examData = {
        name: formData.name || '',
        description: formData.description || '',
        type: formData.type || 'quiz',
        exam_date: formData.exam_date || '',
        start_time: formData.start_time || '',
        end_time: formData.end_time || '',
        duration_minutes: Number(formData.duration_minutes) || 60,
        total_marks: Number(formData.total_marks) || 100,
        passing_marks: Number(formData.passing_marks) || 40,
        is_published: Boolean(formData.is_published),
        academic_year: formData.academic_year || academicYear,
        subject_id: formData.subject_id ? Number(formData.subject_id) : undefined,
        class_id: formData.class_id ? Number(formData.class_id) : undefined,
        division_id: formData.division_id ? Number(formData.division_id) : undefined,
      };
      
      if (editingExam?.id) {
        await examService.update(editingExam.id, examData);
      } else {
        await examService.create(examData);
      }
      await loadExams();
      setIsOpen(false);
      setEditingExam(null);
      setFormData({});
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save exam.');
    }
  };

  const handleEdit = (exam: Exam) => {
    setEditingExam(exam);
    setFormData(exam);
    setIsOpen(true);
  };

  const handleAdd = () => {
    setEditingExam(null);
    setFormData({
      name: '',
      description: '',
      type: 'quiz',
      exam_date: '',
      start_time: '',
      end_time: '',
      duration_minutes: 60,
      total_marks: 100,
      passing_marks: 40,
      is_published: false,
      academic_year: academicYear,
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this exam?')) return;
    try {
      await examService.delete(id);
      await loadExams();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete exam.');
    }
  };

  const handlePublish = async (id: number) => {
    try {
      await examService.publish(id);
      await loadExams();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to publish exam.');
    }
  };

  const handleUnpublish = async (id: number) => {
    try {
      await examService.unpublish(id);
      await loadExams();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to unpublish exam.');
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      midterm: 'bg-blue-100 text-blue-800 border-blue-200',
      final: 'bg-red-100 text-red-800 border-red-200',
      quiz: 'bg-green-100 text-green-800 border-green-200',
      assignment: 'bg-purple-100 text-purple-800 border-purple-200',
      practical: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Exams & Assessments</h1>
        <p className="mt-2 text-slate-600">Manage exams, quizzes, and assessments</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-sm font-medium text-slate-700">Academic Year</label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="2024-2025">2024-2025</option>
              <option value="2025-2026">2025-2026</option>
              <option value="2026-2027">2026-2027</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-sm font-medium text-slate-700">Filter by Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="midterm">Midterm</option>
              <option value="final">Final</option>
              <option value="quiz">Quiz</option>
              <option value="assignment">Assignment</option>
              <option value="practical">Practical</option>
            </select>
          </div>
          {isAdmin && (
            <div className="flex items-end">
              <Button
                onClick={handleAdd}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold shadow-md"
              >
                + Add Exam
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm">
          <p className="text-sm text-rose-800 mb-4">{error}</p>
          <Button onClick={loadExams} className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold">
            Try Again
          </Button>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 shadow-sm">
          <LoadingState message="Loading exams..." />
        </div>
      ) : (
        <div className="space-y-4">
          {exams.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">No exams found for the selected criteria.</p>
              </CardContent>
            </Card>
          ) : (
            exams.map((exam) => (
              <Card key={exam.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getTypeColor(exam.type)}`}>
                          {exam.type.charAt(0).toUpperCase() + exam.type.slice(1)}
                        </span>
                        {!exam.is_published && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300">
                            Draft
                          </span>
                        )}
                        {exam.is_published && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
                            Published
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-1">{exam.name}</h3>
                      {exam.description && (
                        <p className="text-slate-600 mb-3">{exam.description}</p>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          📅 {new Date(exam.exam_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          ⏰ {new Date(exam.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(exam.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="flex items-center gap-1">
                          ⏱️ {exam.duration_minutes} mins
                        </span>
                        <span className="flex items-center gap-1">
                          📊 {exam.total_marks} marks ({exam.passing_marks} to pass)
                        </span>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex flex-col gap-2 ml-4">
                        {exam.is_published ? (
                          <Button
                            onClick={() => exam.id && handleUnpublish(exam.id)}
                            className="bg-yellow-100 hover:bg-yellow-200 active:bg-yellow-300 text-yellow-700 font-semibold border border-yellow-300 px-3 py-1"
                          >
                            Unpublish
                          </Button>
                        ) : (
                          <Button
                            onClick={() => exam.id && handlePublish(exam.id)}
                            className="bg-green-100 hover:bg-green-200 active:bg-green-300 text-green-700 font-semibold border border-green-300 px-3 py-1"
                          >
                            Publish
                          </Button>
                        )}
                        <Button
                          onClick={() => handleEdit(exam)}
                          className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold border border-slate-300 px-3 py-1"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => exam.id && handleDelete(exam.id)}
                          className="bg-red-100 hover:bg-red-200 active:bg-red-300 text-red-700 font-semibold border border-red-300 px-3 py-1"
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      <FormModal
        isOpen={isOpen}
        title={editingExam?.id ? 'Edit Exam' : 'Add Exam'}
        onClose={() => {
          setIsOpen(false);
          setEditingExam(null);
          setFormData({});
        }}
        onSubmit={handleSave}
        submitText={editingExam?.id ? 'Update' : 'Create'}
        isLoading={false}
      >
        <ExamForm exam={formData} academicYear={academicYear} onChange={setFormData} />
      </FormModal>
    </div>
  );
}

function ExamForm({ exam, academicYear, onChange }: any) {
  const handleChange = (field: string, value: any) => {
    onChange({ ...exam, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Exam Name</label>
        <input
          type="text"
          value={exam.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
        <textarea
          value={exam.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
        <select
          value={exam.type || 'quiz'}
          onChange={(e) => handleChange('type', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="midterm">Midterm</option>
          <option value="final">Final</option>
          <option value="quiz">Quiz</option>
          <option value="assignment">Assignment</option>
          <option value="practical">Practical</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Exam Date</label>
          <input
            type="date"
            value={exam.exam_date || ''}
            onChange={(e) => handleChange('exam_date', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Duration (minutes)</label>
          <input
            type="number"
            value={exam.duration_minutes || 60}
            onChange={(e) => handleChange('duration_minutes', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Start Time</label>
          <input
            type="time"
            value={exam.start_time || ''}
            onChange={(e) => handleChange('start_time', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">End Time</label>
          <input
            type="time"
            value={exam.end_time || ''}
            onChange={(e) => handleChange('end_time', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Total Marks</label>
          <input
            type="number"
            value={exam.total_marks || 100}
            onChange={(e) => handleChange('total_marks', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Passing Marks</label>
          <input
            type="number"
            value={exam.passing_marks || 40}
            onChange={(e) => handleChange('passing_marks', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Academic Year</label>
        <input
          type="text"
          value={exam.academic_year || academicYear}
          onChange={(e) => handleChange('academic_year', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_published"
          checked={exam.is_published || false}
          onChange={(e) => handleChange('is_published', e.target.checked)}
          className="rounded border-slate-300"
        />
        <label htmlFor="is_published" className="text-sm font-medium text-slate-700">Publish Immediately</label>
      </div>
    </div>
  );
}
