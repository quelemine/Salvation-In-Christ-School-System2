import { useEffect, useState } from 'react';
import api from '../services/api';

type View = 'attendance' | 'assignments' | 'financial-records';
const titles: Record<View, string> = { attendance: 'My attendance', assignments: 'My assignments', 'financial-records': 'My financial records' };

export default function StudentPortal({ view }: { view: View }) {
  const [data, setData] = useState<any>(null); const [error, setError] = useState('');
  useEffect(() => { api.get(`/student-portal/${view}`).then((r) => setData(r.data)).catch((e) => setError(e.response?.data?.message || 'Unable to load your records.')); }, [view]);
  if (error) return <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">{error}</div>;
  if (!data) return <p className="py-12 text-center text-sm text-slate-500">Loading…</p>;
  if (view === 'financial-records') return <div className="space-y-5"><div><p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Finance</p><h1 className="mt-1 text-3xl font-bold text-slate-950">{titles[view]}</h1></div><div className="grid grid-cols-3 gap-3"><Stat label="Total due" value={data.total_due} /><Stat label="Total paid" value={data.total_paid} /><Stat label="Balance" value={data.balance} /></div><Table headers={['Fee', 'Due date', 'Amount']} rows={data.fees.map((x: any) => [x.name, x.due_date || '—', `${x.currency} ${x.amount}`])} /><Table headers={['Payment date', 'Fee', 'Amount', 'Status']} rows={data.payments.map((x: any) => [x.payment_date, x.fee?.name || '—', `${x.currency} ${x.amount}`, x.status])} /></div>;
  const rows = view === 'attendance' ? data.map((x: any) => [x.date, x.status, x.remarks || '—']) : data.map((x: any) => [x.subject?.name || '—', x.title, x.due_date, x.teacher ? `${x.teacher.first_name} ${x.teacher.last_name}` : '—']);
  return <div className="space-y-5"><div><p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Student portal</p><h1 className="mt-1 text-3xl font-bold text-slate-950">{titles[view]}</h1></div><Table headers={view === 'attendance' ? ['Date', 'Status', 'Remarks'] : ['Subject', 'Assignment', 'Due date', 'Teacher']} rows={rows} /></div>;
}

function Stat({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-bold text-slate-950">{Number(value).toFixed(2)}</p></div>; }
function Table({ headers, rows }: { headers: string[]; rows: any[][] }) { return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{headers.map((h) => <th key={h} className="px-5 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.length ? rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j} className="px-5 py-3 text-slate-700">{v}</td>)}</tr>) : <tr><td colSpan={headers.length} className="px-5 py-10 text-center text-slate-400">No records available.</td></tr>}</tbody></table></div>; }
