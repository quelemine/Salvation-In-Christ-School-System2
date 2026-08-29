import { useState, useEffect, useRef } from 'react';
import { financeService } from '../services/financeService';
import { studentService } from '../services/studentService';
import { FormModal } from '../components/FormModal';
import { formatCurrency, currencyOptions, type CurrencyCode } from '../utils/currency';
import { useSettingsStore } from '../store/settingsStore';
import type { Payment, Fee } from '../types';
import type { Student } from '../types';
import api from '../services/api';

type FormData = {
  student_id: string;
  fee_id: string;
  amount: string;
  currency: CurrencyCode;
  payment_date: string;
  payment_method: string;
  reference_number: string;
  mobile_number: string;
  transaction_id: string;
  notes: string;
  status: string;
};

const emptyForm = (defaultCurrency: CurrencyCode): FormData => ({
  student_id: '',
  fee_id: '',
  amount: '',
  currency: defaultCurrency,
  payment_date: new Date().toISOString().split('T')[0],
  payment_method: 'cash',
  reference_number: '',
  mobile_number: '',
  transaction_id: '',
  notes: '',
  status: 'completed',
});

const statusColors: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-800',
  pending:   'bg-amber-100 text-amber-800',
  cancelled: 'bg-rose-100 text-rose-700',
  refunded:  'bg-slate-100 text-slate-600',
};

const methodIcons: Record<string, string> = {
  cash: '💵',
  bank_transfer: '🏦',
  mobile_money: '📱',
  flutterwave: '🌊',
  other: '💳',
};

export default function Payments() {
  const { settings } = useSettingsStore();
  const { payment: payConfig, system } = settings;
  const defaultCurrency = system.currency as CurrencyCode;

  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>(emptyForm(defaultCurrency));
  const [search, setSearch] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [viewProof, setViewProof] = useState<string | null>(null);
  const proofInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [payRes, stuRes, feeRes] = await Promise.all([
        financeService.getAllPayments(),
        studentService.getAll(),
        financeService.getAllFees(),
      ]);
      setPayments(payRes.data || []);
      setStudents(stuRes.data || []);
      setFees(feeRes.data || []);
    } catch { setError('Failed to load payment data.'); }
    finally { setLoading(false); }
  };

  // Build enabled method options from settings
  const methodOptions = [
    ...(payConfig.cashEnabled ? [{ value: 'cash', label: 'Cash', icon: '💵' }] : []),
    ...(payConfig.flutterwaveEnabled ? [{ value: 'flutterwave', label: 'Flutterwave', icon: '🌊' }] : []),
    ...payConfig.mobileMoneyProviders
      .filter((p) => p.enabled)
      .map((p) => ({ value: `mobile_${p.id}`, label: `${p.name} (${p.network})`, icon: '📱' })),
    ...payConfig.bankAccounts
      .filter((b) => b.enabled)
      .map((b) => ({ value: `bank_${b.id}`, label: `Bank Transfer — ${b.bankName || 'Bank'}`, icon: '🏦' })),
    { value: 'other', label: 'Other', icon: '💳' },
  ];

  // Resolve actual payment_method value sent to backend
  const resolveMethod = (v: string): string => {
    if (v.startsWith('mobile_')) return 'mobile_money';
    if (v.startsWith('bank_')) return 'bank_transfer';
    return v;
  };

  // Selected mobile provider or bank from form value
  const selectedProvider = formData.payment_method.startsWith('mobile_')
    ? payConfig.mobileMoneyProviders.find((p) => `mobile_${p.id}` === formData.payment_method)
    : null;
  const selectedBank = formData.payment_method.startsWith('bank_')
    ? payConfig.bankAccounts.find((b) => `bank_${b.id}` === formData.payment_method)
    : null;

  const filtered = payments.filter((p) => {
    const q = search.toLowerCase();
    const student = (p as any).student;
    return (
      (p.reference_number || '').toLowerCase().includes(q) ||
      ((p as any).transaction_id || '').toLowerCase().includes(q) ||
      (student ? `${student.first_name} ${student.last_name}`.toLowerCase().includes(q) : false)
    );
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const form = new FormData();
      form.append('student_id', formData.student_id);
      form.append('fee_id', formData.fee_id);
      form.append('amount', formData.amount);
      form.append('currency', formData.currency);
      form.append('payment_date', formData.payment_date);
      form.append('payment_method', resolveMethod(formData.payment_method));
      form.append('reference_number', formData.reference_number);
      form.append('mobile_number', formData.mobile_number);
      form.append('transaction_id', formData.transaction_id);
      form.append('notes', formData.notes);
      form.append('status', formData.status);
      if (proofFile) form.append('proof', proofFile);

      const res = await api.post('/payments', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPayments((c) => [res.data, ...c]);
      setIsModalOpen(false);
      setFormData(emptyForm(defaultCurrency));
      setProofFile(null);
    } catch { setError('Failed to save payment.'); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this payment record?')) return;
    try {
      await financeService.deletePayment(id);
      setPayments((c) => c.filter((p) => p.id !== id));
    } catch { setError('Failed to delete payment.'); }
  };

  const field = (key: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setFormData({ ...formData, [key]: e.target.value });

  const totalLRD = payments.filter((p) => p.currency === 'LRD' && (p as any).status === 'completed').reduce((s, p) => s + Number(p.amount), 0);
  const totalUSD = payments.filter((p) => p.currency === 'USD' && (p as any).status === 'completed').reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-5">
      {/* Proof viewer overlay */}
      {viewProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setViewProof(null)}>
          <div className="relative max-h-[90vh] max-w-3xl overflow-auto rounded-xl bg-white p-2 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewProof(null)} className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white text-lg">×</button>
            {viewProof.match(/\.pdf$/i)
              ? <iframe src={viewProof} className="h-[80vh] w-[70vw]" title="Proof" />
              : <img src={viewProof} alt="Proof of payment" className="max-h-[80vh] max-w-full rounded-lg" />
            }
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Finance</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Payments</h1>
        </div>
        <button onClick={() => { setFormData(emptyForm(defaultCurrency)); setProofFile(null); setIsModalOpen(true); }}
          className="self-start rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 sm:self-auto">
          + Record payment
        </button>
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[{ label: 'Total collected (LRD)', value: formatCurrency(totalLRD, 'LRD') },
          { label: 'Total collected (USD)', value: formatCurrency(totalUSD, 'USD') }].map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{c.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <input type="search" placeholder="Search by student, reference or transaction ID…"
            value={search} onChange={(e) => setSearch(e.target.value)} className="input-field max-w-sm" />
        </div>
        {loading ? <p className="py-12 text-center text-sm text-slate-500">Loading payments…</p> : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>{['Reference', 'Student', 'Fee', 'Amount', 'Method', 'Date', 'Status', 'Proof', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0
                  ? <tr><td colSpan={9} className="py-10 text-center text-slate-400">No payments found.</td></tr>
                  : filtered.map((p) => {
                  const student = (p as any).student;
                  const fee = (p as any).fee;
                  const proofUrl = (p as any).payment_proof_url;
                  const method = (p as any).payment_method || '';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.reference_number || (p as any).transaction_id || '—'}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{student ? `${student.first_name} ${student.last_name}` : '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{fee?.name || '—'}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{formatCurrency(Number(p.amount), (p.currency as CurrencyCode) || 'LRD')}</td>
                      <td className="px-4 py-3 text-slate-600">
                        <span className="flex items-center gap-1">
                          <span>{methodIcons[method] || '💳'}</span>
                          <span className="capitalize">{method.replace(/_/g, ' ')}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{(p as any).payment_date || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[(p as any).status] || 'bg-slate-100 text-slate-600'}`}>
                          {(p as any).status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {proofUrl
                          ? <button onClick={() => setViewProof(proofUrl)} className="text-xs font-semibold text-cyan-700 hover:underline">View</button>
                          : <span className="text-xs text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDelete(p.id)} className="text-xs font-semibold text-rose-600 hover:underline">Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
          {filtered.length} of {payments.length} payment{payments.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Record payment modal */}
      <FormModal isOpen={isModalOpen} title="Record payment" onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit} submitText="Record payment" isLoading={isSubmitting}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Student */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Student <span className="text-rose-500">*</span></label>
            <select required value={formData.student_id} onChange={field('student_id')} className="input-field">
              <option value="">Select student</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
            </select>
          </div>
          {/* Fee */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Fee <span className="text-rose-500">*</span></label>
            <select required value={formData.fee_id} onChange={(e) => {
              const fee = fees.find((f) => f.id === Number(e.target.value));
              setFormData({ ...formData, fee_id: e.target.value, amount: fee ? String(fee.amount) : formData.amount, currency: (fee?.currency as CurrencyCode) || defaultCurrency });
            }} className="input-field">
              <option value="">Select fee</option>
              {fees.map((f) => <option key={f.id} value={f.id}>{f.name} ({formatCurrency(Number(f.amount), (f.currency as CurrencyCode) || 'LRD')})</option>)}
            </select>
          </div>
          {/* Amount */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Amount <span className="text-rose-500">*</span></label>
            <input required type="number" min="0" step="0.01" value={formData.amount} onChange={field('amount')} className="input-field" />
          </div>
          {/* Currency */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Currency</label>
            <select value={formData.currency} onChange={field('currency')} className="input-field">
              {currencyOptions.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
            </select>
          </div>
          {/* Date */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Payment date <span className="text-rose-500">*</span></label>
            <input required type="date" value={formData.payment_date} onChange={field('payment_date')} className="input-field" />
          </div>
          {/* Method */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Payment method</label>
            <select value={formData.payment_method} onChange={field('payment_method')} className="input-field">
              {methodOptions.map((m) => <option key={m.value} value={m.value}>{m.icon} {m.label}</option>)}
            </select>
          </div>

          {/* Mobile money — show provider info + phone field */}
          {selectedProvider && (
            <div className="col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-white text-xs font-bold ${selectedProvider.id === 'orange' ? 'bg-orange-500' : 'bg-yellow-500'}`}>
                  {selectedProvider.id === 'orange' ? 'OM' : 'MT'}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{selectedProvider.name}</p>
                  {selectedProvider.merchantNumber && <p className="text-xs text-slate-500">Send to: <span className="font-semibold text-slate-800">{selectedProvider.merchantNumber}</span> — {selectedProvider.merchantName}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Sender phone number</label>
                  <input value={formData.mobile_number} onChange={field('mobile_number')} className="input-field" placeholder="077 xxx xxxx" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Transaction ID</label>
                  <input value={formData.transaction_id} onChange={field('transaction_id')} className="input-field" placeholder="From confirmation SMS" />
                </div>
              </div>
            </div>
          )}

          {/* Bank transfer — show account details */}
          {selectedBank && (
            <div className="col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">BK</div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{selectedBank.bankName}</p>
                  {selectedBank.accountNumber && (
                    <p className="text-xs text-slate-500">
                      Account: <span className="font-semibold text-slate-800">{selectedBank.accountNumber}</span>
                      {selectedBank.accountName && ` — ${selectedBank.accountName}`}
                      {selectedBank.branch && ` · ${selectedBank.branch}`}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Bank transaction / reference ID</label>
                <input value={formData.transaction_id} onChange={field('transaction_id')} className="input-field" placeholder="Bank receipt number" />
              </div>
            </div>
          )}

          {/* Flutterwave transaction ID */}
          {formData.payment_method === 'flutterwave' && (
            <div className="col-span-2 rounded-xl border border-slate-200 bg-orange-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded bg-orange-500 text-white text-xs font-black">Fw</div>
                <p className="text-sm font-bold text-slate-900">Flutterwave</p>
                {payConfig.flutterwaveTestMode && <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-800">Test mode</span>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Flutterwave transaction ID</label>
                <input value={formData.transaction_id} onChange={field('transaction_id')} className="input-field" placeholder="FLW-XXXXX" />
              </div>
            </div>
          )}

          {/* Reference number */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Reference number</label>
            <input value={formData.reference_number} onChange={field('reference_number')} className="input-field" placeholder="REC-0001" />
          </div>
          {/* Status */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
            <select value={formData.status} onChange={field('status')} className="input-field">
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          {/* Proof of payment upload */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Proof of payment {payConfig.requirePaymentProof && <span className="text-rose-500">*</span>}
            </label>
            <p className="mb-2 text-xs text-slate-400">Upload a screenshot, photo, or PDF of the payment confirmation. Max 5 MB.</p>
            <input ref={proofInputRef} type="file" accept="image/*,.pdf" className="hidden"
              onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => proofInputRef.current?.click()}
                className="rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-500 hover:border-cyan-400 hover:text-cyan-700">
                {proofFile ? '✓ ' + proofFile.name : 'Choose file'}
              </button>
              {proofFile && (
                <button type="button" onClick={() => { setProofFile(null); if (proofInputRef.current) proofInputRef.current.value = ''; }}
                  className="text-xs text-rose-500 hover:underline">Remove</button>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
            <textarea value={formData.notes} onChange={field('notes')} className="input-field" rows={2} />
          </div>
        </div>
      </FormModal>
    </div>
  );
}
