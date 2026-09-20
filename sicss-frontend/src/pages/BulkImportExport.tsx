import { useState } from 'react';
import { bulkImportService, type ImportResult } from '../services/bulkImportService';
import { Button, Card, CardContent } from '../components/ui';

export default function BulkImportExport() {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [importType, setImportType] = useState<'students' | 'teachers'>('students');
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError('');
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file to import');
      return;
    }

    setImporting(true);
    setError('');
    try {
      let result: ImportResult;
      if (importType === 'students') {
        result = await bulkImportService.importStudents(file);
      } else {
        result = await bulkImportService.importTeachers(file);
      }
      setResult(result);
      setFile(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async (type: 'students' | 'teachers' | 'classes') => {
    setExporting(true);
    setError('');
    try {
      let blob: Blob;
      if (type === 'students') {
        blob = await bulkImportService.exportStudents();
      } else if (type === 'teachers') {
        blob = await bulkImportService.exportTeachers();
      } else {
        blob = await bulkImportService.exportClasses();
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_export.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const downloadTemplate = (type: 'students' | 'teachers') => {
    const headers = type === 'students'
      ? 'student_id,first_name,last_name,email,date_of_birth,gender,address,parent_guardian_name,parent_guardian_phone,parent_guardian_email'
      : 'employee_id,first_name,last_name,email,phone,date_of_birth,gender,address,qualification,subject_specialization';
    
    const csvContent = headers + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Bulk Import/Export</h1>
        <p className="mt-2 text-slate-600">Import and export data in CSV format</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          onClick={() => setActiveTab('import')}
          className={activeTab === 'import' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}
        >
          Import
        </Button>
        <Button
          onClick={() => setActiveTab('export')}
          className={activeTab === 'export' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}
        >
          Export
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {activeTab === 'import' ? (
        <Card className="shadow-sm">
          <CardContent className="p-6 space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Import Type</label>
              <select
                value={importType}
                onChange={(e) => setImportType(e.target.value as 'students' | 'teachers')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="students">Students</option>
                <option value="teachers">Teachers</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                CSV File
                <Button
                  onClick={() => downloadTemplate(importType)}
                  className="ml-4 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 text-xs"
                >
                  Download Template
                </Button>
              </label>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {file && (
                <p className="mt-2 text-sm text-slate-600">Selected: {file.name}</p>
              )}
            </div>

            <Button
              onClick={handleImport}
              disabled={!file || importing}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold"
            >
              {importing ? 'Importing...' : 'Import Data'}
            </Button>

            {result && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-900 mb-3">Import Results</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{result.imported}</p>
                    <p className="text-xs text-slate-600">Imported</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                    <p className="text-xs text-slate-600">Failed</p>
                  </div>
                </div>
                {result.errors.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-2">Errors:</p>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {result.errors.map((err, idx) => (
                        <div key={idx} className="bg-white rounded p-2 text-xs">
                          <p className="font-medium text-slate-700">Row: {JSON.stringify(err.row)}</p>
                          <p className="text-red-600">{err.errors.join(', ')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-6 space-y-4">
            <p className="text-sm text-slate-600 mb-4">Select data to export as CSV file:</p>
            
            <div className="space-y-3">
              <Button
                onClick={() => handleExport('students')}
                disabled={exporting}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold"
              >
                {exporting ? 'Exporting...' : 'Export Students'}
              </Button>
              <Button
                onClick={() => handleExport('teachers')}
                disabled={exporting}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold"
              >
                {exporting ? 'Exporting...' : 'Export Teachers'}
              </Button>
              <Button
                onClick={() => handleExport('classes')}
                disabled={exporting}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold"
              >
                {exporting ? 'Exporting...' : 'Export Classes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
