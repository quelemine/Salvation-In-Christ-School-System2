/**
 * ParentPortal
 *
 * Gives parents read-only access to all their children's academic records:
 *   - Report card
 *   - Attendance
 *   - Assignments
 *   - Financial records & fee structure
 *
 * If the parent has multiple children (linked via parent_guardian_email)
 * they can switch between them using the child selector at the top.
 */
import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { formatCurrency, type CurrencyCode } from '../utils/currency';
import ReportCardSheet from '../components/ReportCardSheet';
import type { SubjectMarks } from '../services/reportCardService';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Child {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
  status: string;
  class?: { id: number; name: string; section?: string };
}

type Tab = 'report-card' | 'attendance' | 'assignments' | 'financial-records' | 'fee-structure';

// ── Helpers ───────────────────────────────────────────────────────────────────
function Section({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950">{title}</h1>
      </div>
      {children}
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <p className="rounded-xl border border-dashed border-slate-200 bg-white py-10 text-center text-sm text-slate-400">{msg}</p>;
}

function DataTable({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
  if (!rows.length) return <Empty msg="No records found." />;
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <tr>{headers.map((h) => <th key={h} className="px-5 py-3 text-left">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-slate-50">
              {row.map((cell, j) => (
                <td key={j} className="px-5 py-3 text-slate-700">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ParentPortal() {
  const { user } = useAuthStore();
  const { settings } = useSettingsStore();

  const [children, setChildren]       = useState<Child[]>([]);
  const [activeChildId, setActiveChildId] = useState<number | null>(null);
  const [tab, setTab]                 = useState<Tab>('report-card');
  const [data, setData]               = useState<any>(null);
  const [loading, setLoading]         = useState(false);
  const [childLoading, setChildLoading] = useState(true);
  const [error, setError]             = useState('');
  const [academicYear, setAcademicYear] = useState(settings.system.academicYear || new Date().getFullYear().toString());

  // ── Load children list on mount ──────────────────────────────────────────
  useEffect(() => {
    api.get('/student-portal/children')
      .then((res) => {
        const list: Child[] = res.data || [];
        setChildren(list);
        if (list.length > 0) setActiveChildId(list[0].id);
      })
      .catch(() => setError('Unable to load your children\'s records. Make sure your account email matches the parent email on their registration.'))
      .finally(() => setChildLoading(false));
  }, []);

  // ── Load tab data when child or tab changes ──────────────────────────────
  useEffect(() => {
    if (!activeChildId) return;
    setData(null); setError(''); setLoading(true);

    const params: Record<string, string> = { student_id: String(activeChildId) };
    if (tab === 'report-card') params.academic_year = academicYear;

    const endpoint = tab === 'fee-structure'
      ? '/student-portal/financial-records'   // fee-structure data lives here
      : `/student-portal/${tab}`;

    api.get(endpoint, { params })
      .then((res) => setData(res.data))
      .catch((e) => setError(e.response?.data?.message || `Unable to load ${tab} data.`))
      .finally(() => setLoading(false));
  }, [activeChildId, tab, academicYear]);

  const activeChild = children.find((c) => c.id === activeChildId);

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'report-card',       label: 'Report card',      icon: '🎓' },
    { key: 'attendance',        label: 'Attendance',        icon: '📋' },
    { key: 'assignments',       label: 'Assignments',       icon: '📄' },
    { key: 'financial-records', label: 'Payments',          icon: '💳' },
    { key: 'fee-structure',     label: 'Fee structure',     icon: '📊' },
  ];

  // ── Report card print ───────────────────────────────────────────────────
  const printReportCard = () => {
    const el = document.getElementById('parent-report-card');
    if (!el) return;
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Report Card</title>
      <style>body{margin:0;background:white;}@page{size:A4 landscape;margin:8mm;}</style>
    </head><body>${el.outerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); w.close(); }, 400);
  };

  if (childLoading) return <p className="py-12 text-center text-sm text-slate-500">Loading your children's records…</p>;

  if (!childLoading && children.length === 0) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Parent portal</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">Children's records</h1>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center space-y-2">
          <p className="text-2xl">👨‍👩‍👧</p>
          <p className="font-semibold text-amber-900">No children linked to your account</p>
          <p className="text-sm text-amber-700">
            Your account email (<strong>{user?.email}</strong>) does not match any student's parent email in the system.
            Please contact the school administration to link your account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Parent portal</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Children's records</h1>
        <p className="mt-1 text-sm text-slate-500">View your child's academic progress, attendance, and financial records.</p>
      </div>

      {/* Child selector — shown when parent has multiple children */}
      {children.length > 1 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-slate-700">Select child</p>
          <div className="flex flex-wrap gap-3">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => { setActiveChildId(child.id); setData(null); }}
                className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                  activeChildId === child.id
                    ? 'border-slate-950 bg-slate-950 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                {child.photo_url
                  ? <img src={child.photo_url} alt={child.first_name} className="h-8 w-8 rounded-full object-cover" />
                  : <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                      {child.first_name.charAt(0)}{child.last_name.charAt(0)}
                    </div>
                }
                <div className="text-left">
                  <p>{child.first_name} {child.last_name}</p>
                  <p className={`text-[10px] ${activeChildId === child.id ? 'text-white/70' : 'text-slate-400'}`}>
                    {child.class?.name || child.student_id}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active child summary banner */}
      {activeChild && (
        <div className="flex items-center gap-4 rounded-xl border border-cyan-200 bg-cyan-50 px-5 py-4">
          {activeChild.photo_url
            ? <img src={activeChild.photo_url} alt={activeChild.first_name} className="h-12 w-12 rounded-full object-cover border-2 border-white shadow" />
            : <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-700 text-lg font-black text-white shadow">
                {activeChild.first_name.charAt(0)}{activeChild.last_name.charAt(0)}
              </div>
          }
          <div>
            <p className="font-bold text-slate-950">{activeChild.first_name} {activeChild.last_name}</p>
            <p className="text-xs text-slate-500">
              {activeChild.class ? `${activeChild.class.name}${activeChild.class.section ? ` - ${activeChild.class.section}` : ''}` : ''}
              {' · '}{activeChild.student_id}
            </p>
          </div>
          <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
            activeChild.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
          }`}>{activeChild.status}</span>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm ${
              tab === t.key ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'
            }`}>
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {loading && <p className="py-10 text-center text-sm text-slate-500">Loading…</p>}

      {/* ── Report Card ─────────────────────────────────────────────────── */}
      {!loading && tab === 'report-card' && (
        <Section title="Report card" eyebrow="Academic">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-slate-700">Academic year:</label>
              <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="input-field w-auto text-sm">
                {Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i)).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            {data && !data.message && (
              <button onClick={printReportCard}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm">
                🖨 Print / Download
              </button>
            )}
          </div>

          {!data ? null : data.message ? (
            <Empty msg={`No report card available for ${academicYear}. Please contact the school.`} />
          ) : (
            <div id="parent-report-card">
              <ReportCardSheet
                studentName={activeChild ? `${activeChild.first_name} ${activeChild.last_name}` : ''}
                studentId={activeChild?.student_id}
                className={activeChild?.class ? `${activeChild.class.name}${activeChild.class.section ? ` - ${activeChild.class.section}` : ''}` : ''}
                teacherName={data.teacher ? `${data.teacher.first_name} ${data.teacher.last_name}` : ''}
                academicYear={data.academic_year}
                marks={(data.subject_marks || {}) as SubjectMarks}
                aggregate={data.aggregate}
                average={data.average}
                rank={data.rank}
                totalInClass={data.total_in_class}
                conduct={data.conduct}
                promotedTo={data.promoted_to}
                conditionalSubjects={data.conditional_subjects}
                classSponsor={data.class_sponsor}
                principal={data.principal}
                closingDate={data.closing_date}
                editable={false}
              />
            </div>
          )}
        </Section>
      )}

      {/* ── Attendance ───────────────────────────────────────────────────── */}
      {!loading && tab === 'attendance' && (
        <Section title="Attendance" eyebrow="Academic">
          {!data ? null : (() => {
            const records: any[] = Array.isArray(data) ? data : data.attendance || [];
            const present  = records.filter((r) => r.status === 'present').length;
            const absent   = records.filter((r) => r.status === 'absent').length;
            const late     = records.filter((r) => r.status === 'late').length;
            const rate     = records.length ? Math.round((present / records.length) * 100) : 0;
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatCard label="Present" value={String(present)} />
                  <StatCard label="Absent"  value={String(absent)}  />
                  <StatCard label="Late"    value={String(late)}    />
                  <StatCard label="Rate"    value={`${rate}%`}     />
                </div>
                <DataTable
                  headers={['Date', 'Status', 'Remarks']}
                  rows={records.map((r) => [
                    r.date,
                    <span key={r.id} className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                      r.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                      r.status === 'absent'  ? 'bg-rose-100 text-rose-700' :
                      r.status === 'late'    ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-600'
                    }`}>{r.status}</span>,
                    r.remarks || '—',
                  ])}
                />
              </div>
            );
          })()}
        </Section>
      )}

      {/* ── Assignments ──────────────────────────────────────────────────── */}
      {!loading && tab === 'assignments' && (
        <Section title="Assignments" eyebrow="Academic">
          {!data ? null : (() => {
            const assignments: any[] = Array.isArray(data) ? data : data.assignments || [];
            return (
              <DataTable
                headers={['Subject', 'Assignment', 'Due date', 'Teacher']}
                rows={assignments.map((a) => [
                  a.subject?.name || '—',
                  <div key={a.id}>
                    <p className="font-semibold text-slate-900">{a.title}</p>
                    {a.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{a.description}</p>}
                  </div>,
                  a.due_date || '—',
                  a.teacher ? `${a.teacher.first_name} ${a.teacher.last_name}` : '—',
                ])}
              />
            );
          })()}
        </Section>
      )}

      {/* ── Financial records (payments) ─────────────────────────────────── */}
      {!loading && tab === 'financial-records' && (
        <Section title="Payment records" eyebrow="Finance">
          {!data ? null : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatCard label="Total fees due"  value={formatCurrency(Number(data.total_due  || 0), 'LRD')} />
                <StatCard label="Total paid"      value={formatCurrency(Number(data.total_paid || 0), 'LRD')} />
                <StatCard label="Balance"         value={formatCurrency(Number(data.balance    || 0), 'LRD')}
                  sub={Number(data.balance || 0) > 0 ? 'Outstanding balance' : 'Fully paid ✓'} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 pt-2">Payment history</h3>
              <DataTable
                headers={['Date', 'Fee', 'Amount', 'Method', 'Status']}
                rows={(data.payments || []).map((p: any) => [
                  p.payment_date || '—',
                  p.fee?.name || '—',
                  formatCurrency(Number(p.amount), (p.currency as CurrencyCode) || 'LRD'),
                  (p.payment_method || '').replace(/_/g, ' '),
                  <span key={p.id} className="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 capitalize">{p.status}</span>,
                ])}
              />
            </div>
          )}
        </Section>
      )}

      {/* ── Fee structure (what fees are owed) ───────────────────────────── */}
      {!loading && tab === 'fee-structure' && (
        <Section title="Fee structure" eyebrow="Finance">
          {!data ? null : (
            <div className="space-y-4">
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                📋 These are the school fees applicable to your child's class for the current academic year.
              </div>
              <DataTable
                headers={['Fee name', 'Amount', 'Currency', 'Due date', 'Status']}
                rows={(data.fees || []).map((f: any) => [
                  <div key={f.id}>
                    <p className="font-semibold text-slate-900">{f.name}</p>
                    {f.description && <p className="text-xs text-slate-400">{f.description}</p>}
                  </div>,
                  formatCurrency(Number(f.amount), (f.currency as CurrencyCode) || 'LRD'),
                  f.currency || 'LRD',
                  f.due_date || '—',
                  <span key={f.id + '-s'} className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                    f.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>{f.status || 'active'}</span>,
                ])}
              />
            </div>
          )}
        </Section>
      )}
    </div>
  );
}
