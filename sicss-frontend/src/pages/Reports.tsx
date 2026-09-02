import { useState } from 'react';
import { financeService } from '../services/financeService';
import { classService, type Class } from '../services/classService';
import { formatCurrency, type CurrencyCode } from '../utils/currency';
import { useEffect } from 'react';

type DailyReport = {
  date: string;
  total_amount: number;
  payment_count: number;
  payments: any[];
};

type MonthlyReport = {
  month: string;
  total_amount: number;
  payment_count: number;
  payments: any[];
};

type ClassReport = {
  class_id: number;
  academic_year: string;
  total_fees: number;
  total_collected: number;
  total_outstanding: number;
  fees: any[];
};

type Outstanding = {
  academic_year: string;
  total_outstanding: number;
  outstanding_fees: any[];
};

export default function Reports() {
  const [tab, setTab] = useState<'daily' | 'monthly' | 'class' | 'outstanding'>('daily');
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportStatus, setReportStatus] = useState('');

  // Daily
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);

  // Monthly
  const [monthYear, setMonthYear] = useState(new Date().toISOString().slice(0, 7));
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);

  // Class
  const [classId, setClassId] = useState('');
  const [classYear, setClassYear] = useState(new Date().getFullYear().toString());
  const [classReport, setClassReport] = useState<ClassReport | null>(null);

  // Outstanding
  const [outYear, setOutYear] = useState(new Date().getFullYear().toString());
  const [outstanding, setOutstanding] = useState<Outstanding | null>(null);

  useEffect(() => {
    classService.getAll().then((c) => setClasses((c as unknown as Class[]) || [])).catch(() => {});
  }, []);

  const runDaily = async () => {
    setLoading(true); setError('');
    try { setDailyReport(await financeService.getDailyReport({ date: dailyDate })); }
    catch { setError('Failed to load daily report.'); }
    finally { setLoading(false); }
  };

  const runMonthly = async () => {
    setLoading(true); setError('');
    try { setMonthlyReport(await financeService.getMonthlyReport({ month: monthYear })); }
    catch { setError('Failed to load monthly report.'); }
    finally { setLoading(false); }
  };

  const runClass = async () => {
    if (!classId) { setError('Please select a class.'); return; }
    setLoading(true); setError('');
    try { setClassReport(await financeService.getClassReport({ class_id: classId, academic_year: classYear })); }
    catch { setError('Failed to load class report.'); }
    finally { setLoading(false); }
  };

  const runOutstanding = async () => {
    setLoading(true); setError('');
    try { setOutstanding(await financeService.getOutstandingBalances({ academic_year: outYear })); }
    catch { setError('Failed to load outstanding balances.'); }
    finally { setLoading(false); }
  };

  const sendManagementReport = async () => {
    setLoading(true); setError(''); setReportStatus('');
    try {
      const result = await financeService.sendManagementReport(monthYear);
      setReportStatus(`${result.message} Recipients: ${(result.recipients || []).join(', ')}`);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Unable to send the financial management report.');
    } finally { setLoading(false); }
  };

  const tabs = [
    { key: 'daily', label: 'Daily' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'class', label: 'By class' },
    { key: 'outstanding', label: 'Outstanding' },
  ] as const;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Insights</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Financial reports</h1>
        <p className="mt-2 text-sm text-slate-500">Review payment collections, outstanding balances, and class-level finances.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button onClick={sendManagementReport} disabled={loading} className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50">
            {loading ? 'Sending…' : `Send ${monthYear} management report`}
          </button>
          <span className="text-xs text-slate-500">Sends completed income, payment status, and payment-method totals to Admin, Proprietor, and Proprietress.</span>
        </div>
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {reportStatus && <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{reportStatus}</p>}

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.key ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Daily report */}
      {tab === 'daily' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-slate-700">Select date</label>
              <input type="date" value={dailyDate} onChange={(e) => setDailyDate(e.target.value)} className="input-field" />
            </div>
            <button onClick={runDaily} disabled={loading} className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50">
              {loading ? 'Loading…' : 'Run report'}
            </button>
          </div>
          {dailyReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Total collected</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">{formatCurrency(Number(dailyReport.total_amount), 'LRD')}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Payments</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">{dailyReport.payment_count}</p>
                </div>
              </div>
              <PaymentTable payments={dailyReport.payments} />
            </div>
          )}
        </div>
      )}

      {/* Monthly report */}
      {tab === 'monthly' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-slate-700">Select month</label>
              <input type="month" value={monthYear} onChange={(e) => setMonthYear(e.target.value)} className="input-field" />
            </div>
            <button onClick={runMonthly} disabled={loading} className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50">
              {loading ? 'Loading…' : 'Run report'}
            </button>
          </div>
          {monthlyReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Total collected</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">{formatCurrency(Number(monthlyReport.total_amount), 'LRD')}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Payments</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">{monthlyReport.payment_count}</p>
                </div>
              </div>
              <PaymentTable payments={monthlyReport.payments} />
            </div>
          )}
        </div>
      )}

      {/* Class report */}
      {tab === 'class' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-slate-700">Class</label>
              <select value={classId} onChange={(e) => setClassId(e.target.value)} className="input-field">
                <option value="">Select class</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-slate-700">Academic year</label>
              <input value={classYear} onChange={(e) => setClassYear(e.target.value)} className="input-field" placeholder="2026" />
            </div>
            <button onClick={runClass} disabled={loading} className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50">
              {loading ? 'Loading…' : 'Run report'}
            </button>
          </div>
          {classReport && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { label: 'Total fees', value: formatCurrency(Number(classReport.total_fees), 'LRD') },
                { label: 'Collected', value: formatCurrency(Number(classReport.total_collected), 'LRD') },
                { label: 'Outstanding', value: formatCurrency(Number(classReport.total_outstanding), 'LRD') },
              ].map((card) => (
                <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{card.label}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">{card.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Outstanding balances */}
      {tab === 'outstanding' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-slate-700">Academic year</label>
              <input value={outYear} onChange={(e) => setOutYear(e.target.value)} className="input-field" placeholder="2026" />
            </div>
            <button onClick={runOutstanding} disabled={loading} className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50">
              {loading ? 'Loading…' : 'Run report'}
            </button>
          </div>
          {outstanding && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Total outstanding</p>
                <p className="mt-2 text-2xl font-bold text-rose-600">{formatCurrency(Number(outstanding.total_outstanding), 'LRD')}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      {['Fee name', 'Total amount', 'Collected', 'Balance'].map((h) => (
                        <th key={h} className="px-5 py-3 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {outstanding.outstanding_fees.length === 0 ? (
                      <tr><td colSpan={4} className="py-10 text-center text-slate-400">No outstanding balances.</td></tr>
                    ) : outstanding.outstanding_fees.map((item: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-semibold text-slate-900">{item.fee?.name || '—'}</td>
                        <td className="px-5 py-3 text-slate-600">{formatCurrency(Number(item.total_amount), (item.fee?.currency as CurrencyCode) || 'LRD')}</td>
                        <td className="px-5 py-3 text-emerald-700 font-semibold">{formatCurrency(Number(item.collected), (item.fee?.currency as CurrencyCode) || 'LRD')}</td>
                        <td className="px-5 py-3 text-rose-600 font-bold">{formatCurrency(Number(item.balance), (item.fee?.currency as CurrencyCode) || 'LRD')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PaymentTable({ payments }: { payments: any[] }) {
  if (!payments || payments.length === 0) {
    return <p className="rounded-xl border border-dashed border-slate-200 bg-white py-10 text-center text-sm text-slate-400">No payments in this period.</p>;
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <tr>
            {['Student', 'Fee', 'Amount', 'Method', 'Date'].map((h) => (
              <th key={h} className="px-5 py-3 text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {payments.map((p: any) => (
            <tr key={p.id} className="hover:bg-slate-50">
              <td className="px-5 py-3 font-semibold text-slate-900">
                {p.student ? `${p.student.first_name} ${p.student.last_name}` : '—'}
              </td>
              <td className="px-5 py-3 text-slate-600">{p.fee?.name || '—'}</td>
              <td className="px-5 py-3 font-semibold text-slate-900">{formatCurrency(Number(p.amount), (p.currency as CurrencyCode) || 'LRD')}</td>
              <td className="px-5 py-3 capitalize text-slate-600">{p.payment_method?.replace('_', ' ') || '—'}</td>
              <td className="px-5 py-3 text-slate-600">{p.payment_date || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
