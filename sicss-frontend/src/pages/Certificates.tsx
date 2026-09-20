import { useState } from 'react';
import { certificateService } from '../services/certificateService';
import { Button, Card, CardContent } from '../components/ui';

export default function Certificates() {
  const [certificateType, setCertificateType] = useState<'completion' | 'achievement'>('completion');
  const [studentId, setStudentId] = useState<string>('');
  const [academicYear, setAcademicYear] = useState<string>(new Date().getFullYear().toString());
  const [achievementType, setAchievementType] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [htmlContent, setHtmlContent] = useState<string>('');

  const handleGenerate = async () => {
    if (!studentId) {
      setError('Please enter a student ID');
      return;
    }

    if (certificateType === 'completion' && !academicYear) {
      setError('Please enter an academic year');
      return;
    }

    if (certificateType === 'achievement' && !achievementType) {
      setError('Please enter an achievement type');
      return;
    }

    setLoading(true);
    setError('');
    setHtmlContent('');

    try {
      let html: string;
      if (certificateType === 'completion') {
        html = await certificateService.generateCompletionCertificate(studentId, academicYear);
      } else {
        html = await certificateService.generateAchievementCertificate({
          student_id: studentId,
          achievement_type: achievementType,
          description: description || undefined,
          date,
        });
      }
      setHtmlContent(html);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate certificate');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!htmlContent) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Certificate Generation</h1>
        <p className="mt-2 text-slate-600">Generate completion and achievement certificates for students</p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6 space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Certificate Type</label>
            <select
              value={certificateType}
              onChange={(e) => setCertificateType(e.target.value as 'completion' | 'achievement')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="completion">Completion Certificate</option>
              <option value="achievement">Achievement Certificate</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Student ID</label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter student ID"
            />
          </div>

          {certificateType === 'completion' ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Academic Year</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 2024-2025"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Achievement Type</label>
                <input
                  type="text"
                  value={achievementType}
                  onChange={(e) => setAchievementType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Academic Excellence, Sports Champion"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Additional details about the achievement"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={loading || !studentId}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold"
          >
            {loading ? 'Generating...' : 'Generate Certificate'}
          </Button>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              {error}
            </div>
          )}

          {htmlContent && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  onClick={handlePrint}
                  className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold"
                >
                  🖨 Print Certificate
                </Button>
              </div>
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <p className="text-sm text-slate-600 mb-2">Preview:</p>
                <div 
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                  className="flex justify-center"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
