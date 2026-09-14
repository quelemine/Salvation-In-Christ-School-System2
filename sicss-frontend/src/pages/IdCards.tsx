import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { idCardService } from '../services/idCardService';
import { Button, Card, CardContent } from '../components/ui';

export default function IdCards() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';
  const [cardType, setCardType] = useState<'student' | 'teacher'>('student');
  const [id, setId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [htmlContent, setHtmlContent] = useState<string>('');

  const handleGenerate = async () => {
    if (!id) {
      setError('Please enter an ID');
      return;
    }

    setLoading(true);
    setError('');
    setHtmlContent('');

    try {
      let html: string;
      if (cardType === 'student') {
        html = await idCardService.generateStudentIdCard(parseInt(id));
      } else {
        html = await idCardService.generateTeacherIdCard(parseInt(id));
      }
      setHtmlContent(html);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate ID card');
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
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">ID Card Generation</h1>
        <p className="mt-2 text-slate-600">Generate ID cards for students and teachers</p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Card Type</label>
              <select
                value={cardType}
                onChange={(e) => setCardType(e.target.value as 'student' | 'teacher')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="student">Student ID Card</option>
                <option value="teacher">Teacher ID Card</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                {cardType === 'student' ? 'Student ID' : 'Teacher ID'}
              </label>
              <input
                type="number"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Enter ${cardType === 'student' ? 'student' : 'teacher'} ID`}
              />
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || !id}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold"
          >
            {loading ? 'Generating...' : 'Generate ID Card'}
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
                  🖨 Print ID Card
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
