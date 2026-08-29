import { useEffect, useMemo, useState } from 'react';
import { FormModal } from '../components/FormModal';
import { payrollService, teacherService, type SalaryStructure, type Teacher, type TeacherPayroll } from '../services/teacherService';
import { formatCurrency } from '../utils/currency';

type StructureForm = Omit<SalaryStructure, 'id'>;
const blankStructure: StructureForm = { name: '', employment_type: 'self_contained', role_title: '', monthly_salary: '', currency: 'LRD', is_active: true, notes: '' };
const currentMonth = new Date().toISOString().slice(0, 7);

export default function TeacherPayrollPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [payrolls, setPayrolls] = useState<TeacherPayroll[]>([]);
  const [month, setMonth] = useState(currentMonth);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [structureForm, setStructureForm] = useState<StructureForm>(blankStructure);
  const [editingStructure, setEditingStructure] = useState<number | null>(null);
  const [structureOpen, setStructureOpen] = useState(false);
  const [payrollOpen, setPayrollOpen] = useState(false);
  const [payrollForm, setPayrollForm] = useState({ teacher_id: '', salary_structure_id: '', amount: '', currency: 'LRD', role_title: '', employment_type: 'self_contained', notes: '' });

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [teacherResponse, structureData, payrollData] = await Promise.all([teacherService.getAll(), payrollService.structures(), payrollService.payrolls(month)]);
      setTeachers((teacherResponse as any).data || (teacherResponse as any));
      setStructures(structureData);
      setPayrolls(payrollData);
    } catch { setError('Unable to load payroll information.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [month]);

  const totalByCurrency = useMemo(() => payrolls.reduce<Record<string, number>>((totals, item) => {
    totals[item.currency] = (totals[item.currency] || 0) + Number(item.amount); return totals;
  }, {}), [payrolls]);

  const openStructure = (structure?: SalaryStructure) => {
    setEditingStructure(structure?.id ?? null);
    setStructureForm(structure ? { ...structure } : blankStructure);
    setStructureOpen(true);
  };
  const saveStructure = async () => {
    setSaving(true); setError('');
    try {
      const saved = editingStructure ? await payrollService.updateStructure(editingStructure, structureForm) : await payrollService.createStructure(structureForm);
      setStructures((items) => editingStructure ? items.map((item) => item.id === saved.id ? saved : item) : [...items, saved]);
      setStructureOpen(false);
    } catch { setError('Unable to save the salary structure.'); }
    finally { setSaving(false); }
  };

  const selectStructure = (id: string) => {
    const structure = structures.find((item) => item.id === Number(id));
    setPayrollForm((form) => structure ? { ...form, salary_structure_id: id, amount: String(structure.monthly_salary), currency: structure.currency, role_title: structure.role_title, employment_type: structure.employment_type } : { ...form, salary_structure_id: id });
  };
  const savePayroll = async () => {
    if (!payrollForm.teacher_id) { setError('Choose a teacher before creating payroll.'); return; }
    setSaving(true); setError('');
    try {
      const saved = await payrollService.createPayroll({ ...payrollForm, teacher_id: Number(payrollForm.teacher_id), payroll_month: month, salary_structure_id: payrollForm.salary_structure_id ? Number(payrollForm.salary_structure_id) : undefined, amount: Number(payrollForm.amount) });
      setPayrolls((items) => [saved, ...items.filter((item) => item.id !== saved.id)]);
      setPayrollOpen(false);
    } catch { setError('Unable to create payroll. Assign a salary structure or complete the salary fields.'); }
    finally { setSaving(false); }
  };
  const markPaid = async (id: number) => {
    setSaving(true); setError('');
    try { const saved = await payrollService.markPaid(id); setPayrolls((items) => items.map((item) => item.id === id ? saved : item)); }
    catch { setError('Unable to mark this payroll as paid.'); }
    finally { setSaving(false); }
  };

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Finance</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Teacher payroll</h1><p className="mt-2 text-sm text-slate-500">Set salary structures, create monthly payroll, and track payment status.</p></div>
      <div className="flex flex-wrap gap-2"><button onClick={() => openStructure()} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">+ Salary structure</button><button onClick={() => { setPayrollForm({ teacher_id: '', salary_structure_id: '', amount: '', currency: 'LRD', role_title: '', employment_type: 'self_contained', notes: '' }); setPayrollOpen(true); }} className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700">+ Create payroll</button></div>
    </div>
    {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
    <div className="grid gap-4 sm:grid-cols-3"><div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Payroll records</p><p className="mt-2 text-3xl font-bold text-slate-950">{payrolls.length}</p></div><div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Total for {month}</p><p className="mt-2 text-xl font-bold text-slate-950">{formatCurrency(totalByCurrency.LRD, 'LRD')}</p><p className="text-sm text-slate-400">{formatCurrency(totalByCurrency.USD, 'USD')}</p></div><div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Paid</p><p className="mt-2 text-3xl font-bold text-emerald-700">{payrolls.filter((item) => item.status === 'paid').length}</p></div></div>
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="font-bold text-slate-950">Monthly payroll</h2><input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="input-field w-auto" /></div>{loading ? <p className="p-10 text-center text-sm text-slate-500">Loading payroll…</p> : <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-100 text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500"><tr>{['Teacher', 'Role / type', 'Salary', 'Status', 'Action'].map((header) => <th key={header} className="px-5 py-3">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{payrolls.length ? payrolls.map((item) => <tr key={item.id}><td className="px-5 py-3 font-semibold text-slate-900">{item.teacher?.first_name} {item.teacher?.last_name}<p className="font-mono text-xs font-normal text-slate-400">{item.teacher?.employee_id}</p></td><td className="px-5 py-3 text-slate-600">{item.role_title}<p className="text-xs capitalize text-slate-400">{item.employment_type.replace('_', '-')}</p></td><td className="px-5 py-3 font-semibold text-slate-900">{formatCurrency(item.amount, item.currency)}</td><td className="px-5 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{item.status === 'paid' ? 'Paid' : 'Pending'}</span></td><td className="px-5 py-3">{item.status === 'pending' && <button disabled={saving} onClick={() => void markPaid(item.id)} className="text-xs font-semibold text-cyan-700 hover:underline">Mark paid</button>}</td></tr>) : <tr><td colSpan={5} className="p-10 text-center text-slate-400">No payroll has been created for this month.</td></tr>}</tbody></table></div>}</section>
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-bold text-slate-950">Salary structures</h2></div><div className="divide-y divide-slate-100">{structures.length ? structures.map((structure) => <div key={structure.id} className="flex items-center justify-between gap-4 px-5 py-4"><div><p className="font-semibold text-slate-900">{structure.name}</p><p className="text-sm text-slate-500">{structure.role_title} · {structure.employment_type.replace('_', '-')}</p></div><div className="text-right"><p className="font-semibold text-slate-900">{formatCurrency(structure.monthly_salary, structure.currency)} / month</p><button onClick={() => openStructure(structure)} className="text-xs font-semibold text-cyan-700 hover:underline">Edit</button></div></div>) : <p className="p-8 text-center text-sm text-slate-400">Create a salary structure to get started.</p>}</div></section>
    <FormModal isOpen={structureOpen} title={editingStructure ? 'Edit salary structure' : 'New salary structure'} onClose={() => setStructureOpen(false)} onSubmit={() => void saveStructure()} submitText="Save structure" isLoading={saving}><div className="grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2 text-sm font-medium text-slate-700">Structure name<input required className="input-field mt-1" value={structureForm.name} onChange={(e) => setStructureForm({ ...structureForm, name: e.target.value })} placeholder="Senior class teacher" /></label><label className="text-sm font-medium text-slate-700">Role title<input required className="input-field mt-1" value={structureForm.role_title} onChange={(e) => setStructureForm({ ...structureForm, role_title: e.target.value })} /></label><label className="text-sm font-medium text-slate-700">Employment type<select className="input-field mt-1" value={structureForm.employment_type} onChange={(e) => setStructureForm({ ...structureForm, employment_type: e.target.value as StructureForm['employment_type'] })}><option value="self_contained">Self-contained</option><option value="part_time">Part-time</option></select></label><label className="text-sm font-medium text-slate-700">Monthly salary<input required type="number" min="0" className="input-field mt-1" value={structureForm.monthly_salary} onChange={(e) => setStructureForm({ ...structureForm, monthly_salary: e.target.value })} /></label><label className="text-sm font-medium text-slate-700">Currency<select className="input-field mt-1" value={structureForm.currency} onChange={(e) => setStructureForm({ ...structureForm, currency: e.target.value as 'LRD' | 'USD' })}><option value="LRD">LRD</option><option value="USD">USD</option></select></label><label className="sm:col-span-2 text-sm font-medium text-slate-700">Notes<textarea className="input-field mt-1" value={structureForm.notes || ''} onChange={(e) => setStructureForm({ ...structureForm, notes: e.target.value })} /></label></div></FormModal>
    <FormModal isOpen={payrollOpen} title={`Create payroll — ${month}`} onClose={() => setPayrollOpen(false)} onSubmit={() => void savePayroll()} submitText="Create payroll" isLoading={saving}><div className="grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2 text-sm font-medium text-slate-700">Teacher<select required className="input-field mt-1" value={payrollForm.teacher_id} onChange={(e) => setPayrollForm({ ...payrollForm, teacher_id: e.target.value })}><option value="">Choose teacher</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.first_name} {teacher.last_name} — {teacher.employee_id}</option>)}</select></label><label className="sm:col-span-2 text-sm font-medium text-slate-700">Salary structure<select className="input-field mt-1" value={payrollForm.salary_structure_id} onChange={(e) => selectStructure(e.target.value)}><option value="">Custom salary details</option>{structures.filter((item) => item.is_active).map((item) => <option key={item.id} value={item.id}>{item.name} — {formatCurrency(item.monthly_salary, item.currency)}</option>)}</select></label><label className="text-sm font-medium text-slate-700">Monthly salary<input required type="number" min="0" className="input-field mt-1" value={payrollForm.amount} onChange={(e) => setPayrollForm({ ...payrollForm, amount: e.target.value })} /></label><label className="text-sm font-medium text-slate-700">Currency<select className="input-field mt-1" value={payrollForm.currency} onChange={(e) => setPayrollForm({ ...payrollForm, currency: e.target.value as 'LRD' | 'USD' })}><option value="LRD">LRD</option><option value="USD">USD</option></select></label><label className="text-sm font-medium text-slate-700">Role title<input required className="input-field mt-1" value={payrollForm.role_title} onChange={(e) => setPayrollForm({ ...payrollForm, role_title: e.target.value })} /></label><label className="text-sm font-medium text-slate-700">Employment type<select className="input-field mt-1" value={payrollForm.employment_type} onChange={(e) => setPayrollForm({ ...payrollForm, employment_type: e.target.value as 'self_contained' | 'part_time' })}><option value="self_contained">Self-contained</option><option value="part_time">Part-time</option></select></label><label className="sm:col-span-2 text-sm font-medium text-slate-700">Notes<textarea className="input-field mt-1" value={payrollForm.notes} onChange={(e) => setPayrollForm({ ...payrollForm, notes: e.target.value })} /></label></div></FormModal>
  </div>;
}
