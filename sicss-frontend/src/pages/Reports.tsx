import { useState, useEffect, useRef } from 'react';
import { financeService } from '../services/financeService';
import { classService, type Class } from '../services/classService';
import { formatCurrency, type CurrencyCode } from '../utils/currency';
import { useAuthStore } from '../store/authStore';

type DailyReport   = { date: string; total_amount: number; payment_count: number; payments: any[] };
type MonthlyReport = { month: string; total_amount: number; payment_count: number; payments: any[] };
type ClassReport   = { class_id: number; academic_year: string; total_fees: number; total_collected: number; total_outstanding: number; fees: any[] };
type Outstanding   = { academic_year: string; total_outstanding: number; outstanding_fees: any[] };

// ── Print helper ──────────────────────────────────────────────────────────────
function usePrint() {
  const ref = useRef<HTMLDivElement>(null);
  const print = () => {
    if (!ref.current) return;
    const html = ref.current.outerHTML;
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head>
      <title>Financial Report</title>
      <style>
        body { font-family: system-ui, sans-serif; margin: 20px; color: #0f172a; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
        th { background: #f8fafc; font-weight: 600; }
        .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 12px; display: inline-block; min-width: 180px; margin-right: 12px; }
        .card p:first-child { font-size: 11px; text-transform: uppercase; color: #64748b; margin: 0 0 6px; }
        .card p:last-child { font-size: 22px; font-weight: 700; margin: 0; }
        @page { size: A4 landscape; margin: 10mm; }
        @media print { body { margin: 0; } }
      </style>
    </head><body>${html}</body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); w.close(); }, 400);
  };
  return { ref, print };
}

// ── Payment table ─────────────────────────────────────────────────────────────
function PaymentTable({ payments }: { payments: any[] }) {
  if (!payments?.length) {
    return <p className="rounded-xl border border-dashed border-slate-200 bg-white py-10 text-center text-sm text-slate-400">No payments in this period.</p>;
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <tr>{['Student', 'Fee', 'Amount', 'Method', 'Date'].map((h) => (
            <th key={h} className="px-5 py-3 text-left">{h}</th>
          ))}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {payments.map((p: any) => (
            <tr key={p.id} className="hover:bg-slate-50">
              <td className="px-5 py-3 font-semibold text-slate-900">{p.student ? `${p.student.first_name} ${p.student.last_name}` : '—'}</td>
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

// ── Summary cards ─────────────────────────────────────────────────────────────
function SummaryCards({ items }: { items: { label: string; value: string; color?: string }[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {items.map((c) => (
        <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{c.label}</p>
          <p className={`mt-2 text-2xl font-bold ${c.color ?? 'text-slate-950'}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Reports() {
  const { user } = useAuthStore();
  const role = user?.role?.slug || '';

  // Finance / admin can send reports and edit; principal/proprietor/proprietress are read-only viewers
  const canSend   = ['admin', 'finance', 'finance-staff'].includes(role);
  const isViewer  = ['principal', 'proprietor', 'proprietress'].includes(role);

  const [tab, setTab]         = useState<'daily' | 'monthly' | 'class' | 'outstanding'>('monthly');
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [reportStatus, setReportStatus] = useState('');

  const [dailyDate, setDailyDate]     = useState(new Date().toISOString().split('T')[0]);
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);

  const [monthYear, setMonthYear]         = useState(new Date().toISOString().slice(0, 7));
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);

  const [classId, setClassId]       = useState('');
  const [classYear, setClassYear]   = useState(new Date().getFullYear().toString());
  const [classReport, setClassReport] = useState<ClassReport | null>(null);

  const [outYear, setOutYear]         = useState(new Date().getFullYear().toString());
  const [outstanding, setOutstanding] = useState<Outstanding | null>(null);

  const { ref: printRef, print } = usePrint();

  useEffect(() => {
    classService.getAll().then((c) => setClasses((c as unknown as Class[]) || [])).catch(() => {});
  }, []);

  const run = async (fn: () => Promise<void>) => {
    setLoading(true); setError('');
    try { await fn(); } catch { setError('Failed to load report. Make sure you have the required permissions.'); }
    finally { setLoading(false); }
  };

  const sendManagementReport = async () => {
    setLoading(true); setError(''); setReportStatus('');
    try {
      const result = await financeService.sendManagementReport(monthYear);
      setReportStatus(`${result.message} Recipients: ${(result.recipients || []).join(', ')}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to send the financial management report.');
    } finally { setLoading(false); }
  };

  const tabs = [
    { key: 'daily',       label: 'Daily'       },
    { key: 'monthly',     label: 'Monthly'     },
    { key: 'class',       label: 'By class'    },
    { key: 'outstanding', label: 'Outstanding' },
  ] as const;

  // Which report is currently loaded (for print button)
  const hasReport = dailyReport || monthlyReport || classReport || outstanding;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Insights</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Financial reports</h1>
          <p className="mt-2 text-sm text-slate-500">
            {isViewer
              ? 'View, print, and download financial reports. You cannot send or modify reports.'
              : 'Review payment collections, outstanding balances, and class-level finances.'}
          </p>
        </div>

        {/* Action buttons — role-dependent */}
        <div className="flex flex-wrap items-start gap-2">
          {/* Print / Download — available to all */}
          {hasReport && (
            <button onClick={print}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm">
              🖨 Print / Download
            </button>
          )}

          {/* Send report — finance + admin only */}
          {canSend && (
            <div className="flex flex-col gap-1">
              <button onClick={sendManagementReport} disabled={loading}
                className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50 shadow-sm">
                {loading ? 'Sending…' : `📨 Send ${monthYear} report`}
              </button>
              <span className="text-[10px] text-slate-400">Sends to Principal, Proprietor &amp; Proprietress</span>
            </div>
          )}

          {/* Viewer notice */}
          {isViewer && (
            <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
              <span>📊</span>
              <span>View &amp; print only — sent by Finance</span>
            </div>
          )}
        </div>
      </div>

      {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {reportStatus && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">✓ {reportStatus}</p>}

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.key ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-100'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Printable report area */}
      <div ref={printRef}>

        {/* ── Daily ── */}
        {tab === 'daily' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-slate-700">Select date</label>
                <input type="date" value={dailyDate} onChange={(e) => setDailyDate(e.target.value)} className="input-field" />
              </div>
              <button onClick={() => run(async () => setDailyReport(await financeService.getDailyReport({ date: dailyDate })))}
                disabled={loading}
                className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50">
                {loading ? 'Loading…' : 'Run report'}
              </button>
            </div>
            {dailyReport && (
              <div className="space-y-4">
                <SummaryCards items={[
                  { label: 'Date',            value: dailyReport.date },
                  { label: 'Total collected', value: formatCurrency(Number(dailyReport.total_amount), 'LRD') },
                  { label: 'Payments',        value: String(dailyReport.payment_count) },
                ]} />
                <PaymentTable payments={dailyReport.payments} />
              </div>
            )}
          </div>
        )}

        {/* ── Monthly ── */}
        {tab === 'monthly' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-slate-700">Select month</label>
                <input type="month" value={monthYear} onChange={(e) => setMonthYear(e.target.value)} className="input-field" />
              </div>
              <button onClick={() => run(async () => setMonthlyReport(await financeService.getMonthlyReport({ month: monthYear })))}
                disabled={loading}
                className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50">
                {loading ? 'Loading…' : 'Run report'}
              </button>
            </div>
            {monthlyReport && (
              <div className="space-y-4">
                <SummaryCards items={[
                  { label: 'Month',           value: monthlyReport.month },
                  { label: 'Total collected', value: formatCurrency(Number(monthlyReport.total_amount), 'LRD') },
                  { label: 'Payments',        value: String(monthlyReport.payment_count) },
                ]} />
                <PaymentTable payments={monthlyReport.payments} />
              </div>
            )}
          </div>
        )}

        {/* ── By class ── */}
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
              <button onClick={() => { if (!classId) { setError('Please select a class.'); return; } run(async () => setClassReport(await financeService.getClassReport({ class_id: classId, academic_year: classYear }))); }}
                disabled={loading}
                className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50">
                {loading ? 'Loading…' : 'Run report'}
              </button>
            </div>
            {classReport && (
              <SummaryCards items={[
                { label: 'Total fees',      value: formatCurrency(Number(classReport.total_fees),      'LRD') },
                { label: 'Collected',       value: formatCurrency(Number(classReport.total_collected), 'LRD') },
                { label: 'Outstanding',     value: formatCurrency(Number(classReport.total_outstanding),'LRD'), color: 'text-rose-600' },
              ]} />
            )}
          </div>
        )}

        {/* ── Outstanding ── */}
        {tab === 'outstanding' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-slate-700">Academic year</label>
                <input value={outYear} onChange={(e) => setOutYear(e.target.value)} className="input-field" placeholder="2026" />
              </div>
              <button onClick={() => run(async () => setOutstanding(await financeService.getOutstandingBalances({ academic_year: outYear })))}
                disabled={loading}
                className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50">
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
                      <tr>{['Fee name', 'Total', 'Collected', 'Balance'].map((h) => (
                        <th key={h} className="px-5 py-3 text-left">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {outstanding.outstanding_fees.length === 0
                        ? <tr><td colSpan={4} className="py-10 text-center text-slate-400">No outstanding balances.</td></tr>
                        : outstanding.outstanding_fees.map((item: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-5 py-3 font-semibold text-slate-900">{item.fee?.name || '—'}</td>
                            <td className="px-5 py-3 text-slate-600">{formatCurrency(Number(item.total_amount), (item.fee?.currency as CurrencyCode) || 'LRD')}</td>
                            <td className="px-5 py-3 text-emerald-700 font-semibold">{formatCurrency(Number(item.collected), (item.fee?.currency as CurrencyCode) || 'LRD')}</td>
                            <td className="px-5 py-3 text-rose-600 font-bold">{formatCurrency(Number(item.balance), (item.fee?.currency as CurrencyCode) || 'LRD')}</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </div>{/* end printRef */}
    </div>
  );
}
