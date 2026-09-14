import { useState, useEffect } from 'react';
import { financeService } from '../services/financeService';
import { studentService } from '../services/studentService';
import { classService, type Class } from '../services/classService';
import { formatCurrency } from '../utils/currency';
import { useSettingsStore } from '../store/settingsStore';
import type { Student } from '../types';
import { Button, Input, Select, Badge } from '../components/ui';

type ReportType = 'daily' | 'monthly' | 'class' | 'outstanding' | 'student' | 'management';

export default function FinancialReports() {
  const { settings } = useSettingsStore();
  const currentYear = settings.system.academicYear;

  const [reportType, setReportType] = useState<ReportType>('daily');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<any>(null);

  // Filters
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [classId, setClassId] = useState('');
  const [academicYear, setAcademicYear] = useState(currentYear);
  const [studentId, setStudentId] = useState('');
  const [managementMonth, setManagementMonth] = useState(new Date().toISOString().slice(0, 7));

  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [sendingReport, setSendingReport] = useState(false);
  const [reportMsg, setReportMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    const loadFilters = async () => {
      const [cRes, sRes] = await Promise.all([classService.getAll(), studentService.getAll()]);
      setClasses(cRes as unknown as Class[]);
      setStudents(sRes.data || []);
    };
    loadFilters();
  }, []);

  const loadReport = async () => {
    setLoading(true);
    setError('');
    setData(null);
    try {
      let result;
      switch (reportType) {
        case 'daily':
          result = await financeService.getDailyReport({ date });
          break;
        case 'monthly':
          result = await financeService.getMonthlyReport({ month });
          break;
        case 'class':
          if (!classId) throw new Error('Class is required');
          result = await financeService.getClassReport({ class_id: Number(classId), academic_year: academicYear });
          break;
        case 'outstanding':
          result = await financeService.getOutstandingBalances({ academic_year: academicYear });
          break;
        case 'student':
          if (!studentId) throw new Error('Student is required');
          result = await financeService.getStudentFinancialHistory(Number(studentId));
          break;
        default:
          throw new Error('Invalid report type');
      }
      setData(result);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const sendManagementReport = async () => {
    setSendingReport(true);
    setReportMsg(null);
    try {
      const result = await financeService.sendManagementReport(managementMonth);
      setReportMsg({ ok: true, text: result.message || 'Report sent successfully' });
    } catch (err: any) {
      setReportMsg({ ok: false, text: err.response?.data?.message || 'Failed to send report' });
    } finally {
      setSendingReport(false);
    }
  };


  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Finance</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Financial Reports</h1>
          <p className="mt-2 text-sm text-slate-500">View and generate financial reports using real system data.</p>
        </div>
      </div>

      {reportMsg && (
        <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${reportMsg.ok ? 'border border-emerald-200 bg-emerald-50 text-emerald-800' : 'border border-rose-200 bg-rose-50 text-rose-700'}`}>
          {reportMsg.ok ? '✓' : '✕'} {reportMsg.text}
        </div>
      )}

      {/* Report Type Selection */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <Select
            label="Report Type"
            value={reportType}
            onChange={(e) => { setReportType(e.target.value as ReportType); setData(null); setError(''); }}
            options={[
              { value: 'daily', label: 'Daily Payments' },
              { value: 'monthly', label: 'Monthly Payments' },
              { value: 'class', label: 'Class Financial Report' },
              { value: 'outstanding', label: 'Outstanding Balances' },
              { value: 'student', label: 'Student Financial History' },
              { value: 'management', label: 'Send Management Report (Email)' },
            ]}
          />
        </div>

        {/* Filters */}
        <div className="border-b border-slate-200 px-5 py-4 space-y-4">
          {reportType === 'daily' && (
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          )}
          {reportType === 'monthly' && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Month</label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="input-field"
              />
            </div>
          )}
          {(reportType === 'class' || reportType === 'outstanding') && (
            <Input
              label="Academic Year"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
            />
          )}
          {reportType === 'class' && (
            <Select
              label="Class"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              options={[
                { value: '', label: 'Select class' },
                ...classes.map((c) => ({ value: String(c.id), label: `${c.name.replace(/\s[A-Z][a-z]*$/, '').trim()}` }))
              ]}
            />
          )}
          {reportType === 'student' && (
            <Select
              label="Student"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              options={[
                { value: '', label: 'Select student' },
                ...students.map((s) => ({ value: String(s.id), label: `${(s as any).user?.user_code || (s as any).student_id} - ${s.first_name} ${s.last_name}` }))
              ]}
            />
          )}
          {reportType === 'management' && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Month</label>
              <input
                type="month"
                value={managementMonth}
                onChange={(e) => setManagementMonth(e.target.value)}
                className="input-field"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 py-4 flex gap-3">
          {reportType !== 'management' ? (
            <Button onClick={loadReport} disabled={loading}>
              {loading ? 'Loading…' : 'Generate Report'}
            </Button>
          ) : (
            <Button onClick={sendManagementReport} disabled={sendingReport}>
              {sendingReport ? 'Sending…' : 'Send Report'}
            </Button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-center">
          <p className="text-sm text-rose-800 mb-4">{error}</p>
          <Button onClick={loadReport} variant="secondary">Try Again</Button>
        </div>
      )}

      {/* Report Results */}
      {data && !error && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Daily Report */}
          {reportType === 'daily' && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Daily Payments Report</h3>
                <Badge variant="info">{data.date}</Badge>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Amount</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(data.total_amount, 'LRD')}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment Count</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{data.payment_count}</p>
                </div>
              </div>
              {data.payments && data.payments.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-3 text-left">Student</th>
                        <th className="px-4 py-3 text-left">Fee</th>
                        <th className="px-4 py-3 text-left">Amount</th>
                        <th className="px-4 py-3 text-left">Method</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.payments.map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {p.student ? `${p.student.first_name} ${p.student.last_name}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{p.fee?.name || '—'}</td>
                          <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(p.amount, p.currency)}</td>
                          <td className="px-4 py-3 text-slate-600 capitalize">{p.payment_method?.replace(/_/g, ' ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Monthly Report */}
          {reportType === 'monthly' && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Monthly Payments Report</h3>
                <Badge variant="info">{data.month}</Badge>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Amount</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(data.total_amount, 'LRD')}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment Count</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{data.payment_count}</p>
                </div>
              </div>
              {data.payments && data.payments.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-3 text-left">Student</th>
                        <th className="px-4 py-3 text-left">Fee</th>
                        <th className="px-4 py-3 text-left">Amount</th>
                        <th className="px-4 py-3 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.payments.map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {p.student ? `${p.student.first_name} ${p.student.last_name}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{p.fee?.name || '—'}</td>
                          <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(p.amount, p.currency)}</td>
                          <td className="px-4 py-3 text-slate-600">{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Class Report */}
          {reportType === 'class' && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Class Financial Report</h3>
                <Badge variant="info">{data.academic_year}</Badge>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Fees</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(data.total_fees, 'LRD')}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Total Collected</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-700">{formatCurrency(data.total_collected, 'LRD')}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-rose-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Outstanding</p>
                  <p className="mt-2 text-2xl font-bold text-rose-700">{formatCurrency(data.total_outstanding, 'LRD')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Outstanding Balances */}
          {reportType === 'outstanding' && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Outstanding Balances</h3>
                <Badge variant="info">{data.academic_year}</Badge>
              </div>
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Total Outstanding</p>
                <p className="mt-2 text-3xl font-bold text-rose-700">{formatCurrency(data.total_outstanding, 'LRD')}</p>
              </div>
              {data.outstanding_fees && data.outstanding_fees.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-3 text-left">Fee</th>
                        <th className="px-4 py-3 text-left">Class</th>
                        <th className="px-4 py-3 text-left">Total Amount</th>
                        <th className="px-4 py-3 text-left">Collected</th>
                        <th className="px-4 py-3 text-left">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.outstanding_fees.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-semibold text-slate-900">{item.fee?.name || '—'}</td>
                          <td className="px-4 py-3 text-slate-600">{item.fee?.class?.name || '—'}</td>
                          <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(item.total_amount, 'LRD')}</td>
                          <td className="px-4 py-3 text-slate-600">{formatCurrency(item.collected, 'LRD')}</td>
                          <td className="px-4 py-3 font-bold text-rose-700">{formatCurrency(item.balance, 'LRD')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Student Financial History */}
          {reportType === 'student' && (
            <div className="p-5 space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Student Financial History</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Fees</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(data.total_fees, 'LRD')}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Total Paid</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-700">{formatCurrency(data.total_paid, 'LRD')}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-rose-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Balance</p>
                  <p className="mt-2 text-2xl font-bold text-rose-700">{formatCurrency(data.balance, 'LRD')}</p>
                </div>
              </div>
              {data.payments && data.payments.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Fee</th>
                        <th className="px-4 py-3 text-left">Amount</th>
                        <th className="px-4 py-3 text-left">Method</th>
                        <th className="px-4 py-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.payments.map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-600">{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '—'}</td>
                          <td className="px-4 py-3 text-slate-600">{p.fee?.name || '—'}</td>
                          <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(p.amount, p.currency)}</td>
                          <td className="px-4 py-3 text-slate-600 capitalize">{p.payment_method?.replace(/_/g, ' ')}</td>
                          <td className="px-4 py-3">
                            <Badge variant={p.status === 'completed' ? 'success' : p.status === 'pending' ? 'warning' : 'default'}>
                              {p.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!data && !error && !loading && (
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-14 text-center">
          <p className="text-3xl mb-2">📊</p>
          <p className="text-sm font-semibold text-slate-600">Select a report type and generate a report</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white py-12 text-center">
          <p className="text-sm text-slate-500">Loading report data…</p>
        </div>
      )}
    </div>
  );
}
