import { useState, useEffect } from 'react';
import { financeService } from '../services/financeService';
import { studentService } from '../services/studentService';
import { FormModal } from '../components/FormModal';
import { formatCurrency, type CurrencyCode } from '../utils/currency';
import { useSettingsStore } from '../store/settingsStore';
import type { Receipt, Payment } from '../types';
import type { Student } from '../types';

type FormData = {
  payment_id: string;
  student_id: string;
  total_amount: string;
  currency: CurrencyCode;
  receipt_date: string;
  notes: string;
};

const emptyForm = (defaultCurrency: CurrencyCode): FormData => ({
  payment_id: '',
  student_id: '',
  total_amount: '',
  currency: defaultCurrency,
  receipt_date: new Date().toISOString().split('T')[0],
  notes: '',
});

export default function Receipts() {
  const { settings } = useSettingsStore();
  const { branding, payment: payConfig, system } = settings;
  const defaultCurrency = system.currency as CurrencyCode;

  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>(emptyForm(defaultCurrency));
  const [search, setSearch] = useState('');
  const [printReceipt, setPrintReceipt] = useState<Receipt | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [recRes, payRes, stuRes] = await Promise.all([
        financeService.getAllReceipts(),
        financeService.getAllPayments(),
        studentService.getAll(),
      ]);
      setReceipts(recRes.data || []);
      setPayments(payRes.data || []);
      setStudents(stuRes.data || []);
    } catch { setError('Failed to load receipt data.'); }
    finally { setLoading(false); }
  };

  const filtered = receipts.filter((r) => {
    const q = search.toLowerCase();
    const student = (r as any).student;
    return (
      ((r as any).receipt_number || '').toLowerCase().includes(q) ||
      (student ? `${student.first_name} ${student.last_name}`.toLowerCase().includes(q) : false)
    );
  });

  const onPaymentChange = (paymentId: string) => {
    const payment = payments.find((p) => p.id === Number(paymentId));
    setFormData({
      ...formData,
      payment_id: paymentId,
      total_amount: payment ? String(payment.amount) : '',
      student_id: payment ? String((payment as any).student_id) : formData.student_id,
      currency: (payment?.currency as CurrencyCode) || defaultCurrency,
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const created = await financeService.createReceipt({
        payment_id: Number(formData.payment_id),
        student_id: Number(formData.student_id),
        total_amount: Number(formData.total_amount),
        currency: formData.currency,
        receipt_date: formData.receipt_date,
        notes: formData.notes,
      });
      setReceipts((c) => [created as unknown as Receipt, ...c]);
      setIsModalOpen(false);
      setFormData(emptyForm(defaultCurrency));
    } catch { setError('Failed to generate receipt.'); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this receipt?')) return;
    try {
      await financeService.deleteReceipt(id);
      setReceipts((c) => c.filter((r) => r.id !== id));
    } catch { setError('Failed to delete receipt.'); }
  };

  const handlePrint = (r: Receipt) => {
    setPrintReceipt(r);
    setTimeout(() => window.print(), 350);
  };

  const field = (key: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setFormData({ ...formData, [key]: e.target.value });

  // Find the payment linked to the print receipt to show method details
  const linkedPayment = printReceipt ? payments.find((p) => p.id === (printReceipt as any).payment_id) : null;

  return (
    <div className="space-y-5">

      {/* ── Branded print receipt ────────────────────────────── */}
      {printReceipt && (
        <div className="print-sheet" style={{ fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#0f172a', background: '#fff', padding: '14mm', maxWidth: '140mm', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: 12, marginBottom: 14 }}>
            {branding.logoUrl && <img src={branding.logoUrl} alt="Logo" style={{ height: 52, margin: '0 auto 6px', display: 'block' }} />}
            <h2 style={{ margin: 0, fontSize: '1.1em', fontWeight: 700 }}>{branding.schoolName}</h2>
            <p style={{ margin: '2px 0', fontSize: '0.78em', color: '#64748b' }}>{branding.schoolSubtitle}</p>
            {branding.schoolAddress && <p style={{ margin: '1px 0', fontSize: '0.78em', color: '#64748b' }}>{branding.schoolAddress}</p>}
            {branding.schoolPhone && <p style={{ margin: '1px 0', fontSize: '0.78em', color: '#64748b' }}>Tel: {branding.schoolPhone}</p>}
            <h1 style={{ margin: '10px 0 0', fontSize: '1em', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 900 }}>Official Receipt</h1>
          </div>

          {/* Receipt meta */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14, fontSize: '0.85em', borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
            <div>
              <p style={{ margin: '2px 0' }}><b>Receipt No:</b> {(printReceipt as any).receipt_number || `${payConfig.receiptPrefix}-${printReceipt.id}`}</p>
              <p style={{ margin: '2px 0' }}><b>Date:</b> {(printReceipt as any).receipt_date}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '2px 0' }}><b>Student:</b></p>
              <p style={{ margin: '2px 0', fontWeight: 600 }}>
                {(printReceipt as any).student
                  ? `${(printReceipt as any).student.first_name} ${(printReceipt as any).student.last_name}`
                  : '—'}
              </p>
            </div>
          </div>

          {/* Payment details table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 14, fontSize: '0.85em' }}>
            <thead>
              <tr style={{ backgroundColor: '#0f172a', color: '#fff' }}>
                <th style={{ padding: '5px 8px', textAlign: 'left' }}>Description</th>
                <th style={{ padding: '5px 8px', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '5px 8px' }}>
                  {(linkedPayment as any)?.fee?.name || 'School fee'}
                  {linkedPayment && <div style={{ fontSize: '0.82em', color: '#64748b', marginTop: 2 }}>
                    Method: {((linkedPayment as any).payment_method || '').replace(/_/g, ' ')}
                    {(linkedPayment as any).transaction_id && ` · Ref: ${(linkedPayment as any).transaction_id}`}
                    {(linkedPayment as any).mobile_number && ` · Phone: ${(linkedPayment as any).mobile_number}`}
                  </div>}
                </td>
                <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700 }}>
                  {formatCurrency(Number(printReceipt.total_amount), (printReceipt.currency as CurrencyCode) || 'LRD')}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <td style={{ padding: '6px 8px', fontWeight: 700 }}>Total paid</td>
                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 900, fontSize: '1.05em' }}>
                  {formatCurrency(Number(printReceipt.total_amount), (printReceipt.currency as CurrencyCode) || 'LRD')}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Proof of payment indicator */}
          {(linkedPayment as any)?.payment_proof_url && (
            <div style={{ marginBottom: 12, padding: '6px 10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, fontSize: '0.78em', color: '#166534' }}>
              ✓ Proof of payment on file
            </div>
          )}

          {/* Notes */}
          {printReceipt.notes && <p style={{ fontSize: '0.8em', color: '#64748b', marginBottom: 10 }}><b>Notes:</b> {printReceipt.notes}</p>}

          {/* Signatures */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, textAlign: 'center', fontSize: '0.78em', marginTop: 28 }}>
            <p style={{ borderTop: '1px solid #94a3b8', paddingTop: 4 }}>Cashier signature</p>
            <p style={{ borderTop: '1px solid #94a3b8', paddingTop: 4 }}>Parent / Guardian</p>
          </div>

          {/* Footer */}
          {payConfig.receiptFooterNote && (
            <p style={{ marginTop: 14, textAlign: 'center', fontSize: '0.75em', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: 8 }}>
              {payConfig.receiptFooterNote}
            </p>
          )}
        </div>
      )}

      {/* ── Screen UI ───────────────────────────────────────── */}
      <div className="screen-only flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Finance</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Receipts</h1>
        </div>
        <button onClick={() => { setFormData(emptyForm(defaultCurrency)); setIsModalOpen(true); }}
          className="screen-only self-start rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 sm:self-auto">
          + Generate receipt
        </button>
      </div>

      {error && <p className="screen-only rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <div className="screen-only rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <input type="search" placeholder="Search by student or receipt number…"
            value={search} onChange={(e) => setSearch(e.target.value)} className="input-field max-w-xs" />
        </div>
        {loading ? (
          <p className="py-12 text-center text-sm text-slate-500">Loading receipts…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>{['Receipt No', 'Student', 'Amount', 'Method', 'Date', 'Proof', 'Notes', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0
                  ? <tr><td colSpan={8} className="py-10 text-center text-slate-400">No receipts found.</td></tr>
                  : filtered.map((r) => {
                  const student = (r as any).student;
                  const lp = payments.find((p) => p.id === (r as any).payment_id);
                  const proofUrl = (lp as any)?.payment_proof_url;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-cyan-700">
                        {(r as any).receipt_number || `${payConfig.receiptPrefix}-${r.id}`}
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-900">
                        {student ? `${student.first_name} ${student.last_name}` : '—'}
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-900">
                        {formatCurrency(Number(r.total_amount), (r.currency as CurrencyCode) || 'LRD')}
                      </td>
                      <td className="px-5 py-3 text-slate-600 capitalize">
                        {((lp as any)?.payment_method || '—').replace(/_/g, ' ')}
                      </td>
                      <td className="px-5 py-3 text-slate-600">{(r as any).receipt_date || '—'}</td>
                      <td className="px-5 py-3">
                        {proofUrl
                          ? <a href={proofUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-cyan-700 hover:underline">View proof</a>
                          : <span className="text-xs text-slate-300">None</span>}
                      </td>
                      <td className="px-5 py-3 text-slate-500 max-w-[140px] truncate">{r.notes || '—'}</td>
                      <td className="px-5 py-3">
                        <div className="flex gap-3">
                          <button onClick={() => handlePrint(r)} className="text-xs font-semibold text-cyan-700 hover:underline">Print</button>
                          <button onClick={() => handleDelete(r.id)} className="text-xs font-semibold text-rose-600 hover:underline">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
          {filtered.length} of {receipts.length} receipt{receipts.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Generate receipt modal */}
      <FormModal isOpen={isModalOpen} title="Generate receipt" onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit} submitText="Generate receipt" isLoading={isSubmitting}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Payment <span className="text-rose-500">*</span></label>
            <select required value={formData.payment_id} onChange={(e) => onPaymentChange(e.target.value)} className="input-field">
              <option value="">Select payment</option>
              {payments.map((p) => {
                const stu = (p as any).student;
                return (
                  <option key={p.id} value={p.id}>
                    {stu ? `${stu.first_name} ${stu.last_name}` : `Payment #${p.id}`} — {formatCurrency(Number(p.amount), (p.currency as CurrencyCode) || 'LRD')} · {((p as any).payment_method || '').replace(/_/g, ' ')}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Student <span className="text-rose-500">*</span></label>
            <select required value={formData.student_id} onChange={field('student_id')} className="input-field">
              <option value="">Select student</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Total amount <span className="text-rose-500">*</span></label>
            <input required type="number" min="0" step="0.01" value={formData.total_amount} onChange={field('total_amount')} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Currency</label>
            <select value={formData.currency} onChange={field('currency')} className="input-field">
              <option value="LRD">LRD — Liberian Dollar</option>
              <option value="USD">USD — US Dollar</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Receipt date <span className="text-rose-500">*</span></label>
            <input required type="date" value={formData.receipt_date} onChange={field('receipt_date')} className="input-field" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
            <textarea value={formData.notes} onChange={field('notes')} className="input-field" rows={2} />
          </div>
        </div>
      </FormModal>
    </div>
  );
}
