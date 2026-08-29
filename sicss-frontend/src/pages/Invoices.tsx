import { useState, useEffect } from 'react';
import { financeService } from '../services/financeService';
import { studentService } from '../services/studentService';
import { formatCurrency, type CurrencyCode } from '../utils/currency';
import { useSettingsStore } from '../store/settingsStore';
import type { Fee } from '../types';
import type { Student } from '../types';

type InvoiceItem = { description: string; quantity: number; unitPrice: number; currency: CurrencyCode };

type Invoice = {
  id: string;
  number: string;
  student: Student | null;
  fee: Fee | null;
  items: InvoiceItem[];
  issueDate: string;
  dueDate: string;
  notes: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
};

function newInvoice(prefix: string, dueDays: number, defaultCurrency: CurrencyCode): Invoice {
  const now = new Date();
  const due = new Date(now);
  due.setDate(due.getDate() + dueDays);
  const num = `${prefix}-${now.getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  return {
    id: Date.now().toString(),
    number: num,
    student: null,
    fee: null,
    items: [{ description: '', quantity: 1, unitPrice: 0, currency: defaultCurrency }],
    issueDate: now.toISOString().split('T')[0],
    dueDate: due.toISOString().split('T')[0],
    notes: '',
    status: 'draft',
  };
}

const statusColors: Record<string, string> = {
  draft:   'bg-slate-100 text-slate-600',
  sent:    'bg-blue-100 text-blue-700',
  paid:    'bg-emerald-100 text-emerald-800',
  overdue: 'bg-rose-100 text-rose-700',
};

export default function Invoices() {
  const { settings } = useSettingsStore();
  const { branding, payment: payConfig, system } = settings;
  const defaultCurrency = system.currency as CurrencyCode;

  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [active, setActive] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([studentService.getAll(), financeService.getAllFees()])
      .then(([sRes, fRes]) => { setStudents(sRes.data || []); setFees(fRes.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const createNew = () => {
    const inv = newInvoice(payConfig.invoicePrefix, payConfig.invoiceDueDays, defaultCurrency);
    setInvoices((c) => [inv, ...c]);
    setActive(inv);
  };

  const update = (patch: Partial<Invoice>) => {
    if (!active) return;
    const updated = { ...active, ...patch };
    setActive(updated);
    setInvoices((c) => c.map((i) => (i.id === updated.id ? updated : i)));
  };

  const updateItem = (index: number, patch: Partial<InvoiceItem>) => {
    if (!active) return;
    const items = active.items.map((item, i) => i === index ? { ...item, ...patch } : item);
    update({ items });
  };

  const addItem = () => update({ items: [...(active?.items || []), { description: '', quantity: 1, unitPrice: 0, currency: defaultCurrency }] });
  const removeItem = (i: number) => update({ items: active!.items.filter((_, j) => j !== i) });

  const subtotal = active?.items.reduce((s, item) => s + item.quantity * item.unitPrice, 0) ?? 0;
  const taxAmount = payConfig.showInvoiceTax ? subtotal * (payConfig.taxRate / 100) : 0;
  const total = subtotal + taxAmount;
  const invCurrency = active?.items[0]?.currency || defaultCurrency;

  const deleteInvoice = (id: string) => {
    setInvoices((c) => c.filter((i) => i.id !== id));
    if (active?.id === id) setActive(null);
  };

  // When a fee is selected, auto-populate an item line
  const onFeeChange = (feeId: string) => {
    const fee = fees.find((f) => f.id === Number(feeId));
    if (!fee) { update({ fee: null }); return; }
    update({
      fee: fee as any,
      items: [{ description: fee.name, quantity: 1, unitPrice: Number(fee.amount), currency: (fee.currency as CurrencyCode) || defaultCurrency }],
    });
  };

  if (loading) return <p className="py-12 text-center text-sm text-slate-500">Loading…</p>;

  return (
    <div className="space-y-5">
      {/* Print sheet */}
      {active && (
        <div className="print-sheet" style={{ fontFamily: 'system-ui, sans-serif', fontSize: '12px', color: '#0f172a', background: '#fff', padding: '12mm' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, borderBottom: '2px solid #0f172a', paddingBottom: 12 }}>
            <div>
              {branding.logoUrl && <img src={branding.logoUrl} alt="Logo" style={{ height: 48, marginBottom: 6 }} />}
              <h2 style={{ margin: 0, fontSize: '1.1em', fontWeight: 700 }}>{branding.schoolName}</h2>
              <p style={{ margin: '2px 0', fontSize: '0.8em', color: '#64748b' }}>{branding.schoolAddress}</p>
              {branding.schoolPhone && <p style={{ margin: '1px 0', fontSize: '0.8em', color: '#64748b' }}>Tel: {branding.schoolPhone}</p>}
              {branding.schoolEmail && <p style={{ margin: '1px 0', fontSize: '0.8em', color: '#64748b' }}>{branding.schoolEmail}</p>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <h1 style={{ margin: 0, fontSize: '1.6em', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoice</h1>
              <p style={{ margin: '4px 0 2px', fontWeight: 700 }}>{active.number}</p>
              <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: '0.75em', fontWeight: 700, backgroundColor: active.status === 'paid' ? '#d1fae5' : active.status === 'overdue' ? '#fee2e2' : '#f1f5f9', color: active.status === 'paid' ? '#065f46' : active.status === 'overdue' ? '#991b1b' : '#475569' }}>
                {active.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Bill to / dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16, fontSize: '0.85em' }}>
            <div>
              <p style={{ fontWeight: 700, marginBottom: 4 }}>Bill to:</p>
              {active.student
                ? <><p style={{ margin: '1px 0', fontWeight: 600 }}>{active.student.first_name} {active.student.last_name}</p>
                    <p style={{ margin: '1px 0', color: '#64748b' }}>{(active.student as any).parent_guardian_name || ''}</p>
                    <p style={{ margin: '1px 0', color: '#64748b' }}>{(active.student as any).parent_guardian_phone || ''}</p></>
                : <p style={{ color: '#94a3b8' }}>Student not selected</p>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <p><b>Issue date:</b> {active.issueDate}</p>
              <p><b>Due date:</b> {active.dueDate}</p>
            </div>
          </div>

          {/* Line items */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
            <thead>
              <tr style={{ backgroundColor: '#0f172a', color: '#fff' }}>
                {['Description', 'Qty', 'Unit price', 'Total'].map((h) => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: h === 'Description' ? 'left' : 'right', fontSize: '0.8em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {active.items.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '5px 8px' }}>{item.description || '—'}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'right' }}>{item.quantity}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'right' }}>{formatCurrency(item.unitPrice, item.currency)}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.quantity * item.unitPrice, item.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <div style={{ minWidth: 220, fontSize: '0.85em' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                <span>Subtotal</span><span>{formatCurrency(subtotal, invCurrency)}</span>
              </div>
              {payConfig.showInvoiceTax && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span>{payConfig.taxLabel} ({payConfig.taxRate}%)</span><span>{formatCurrency(taxAmount, invCurrency)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderTop: '2px solid #0f172a', fontWeight: 700, fontSize: '1.05em' }}>
                <span>Total due</span><span>{formatCurrency(total, invCurrency)}</span>
              </div>
            </div>
          </div>

          {/* Payment instructions */}
          {(payConfig.cashEnabled || payConfig.mobileMoneyProviders.some((p) => p.enabled) || payConfig.bankAccounts.some((b) => b.enabled)) && (
            <div style={{ marginBottom: 12, padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: 8, fontSize: '0.82em', border: '1px solid #e2e8f0' }}>
              <p style={{ fontWeight: 700, marginBottom: 6 }}>Payment instructions</p>
              {payConfig.cashEnabled && <p style={{ margin: '2px 0' }}>💵 <b>Cash:</b> {payConfig.cashInstructions}</p>}
              {payConfig.mobileMoneyProviders.filter((p) => p.enabled && p.merchantNumber).map((p) => (
                <p key={p.id} style={{ margin: '2px 0' }}>📱 <b>{p.name}:</b> Send to {p.merchantNumber} ({p.merchantName})</p>
              ))}
              {payConfig.bankAccounts.filter((b) => b.enabled && b.accountNumber).map((b) => (
                <p key={b.id} style={{ margin: '2px 0' }}>🏦 <b>{b.bankName}:</b> Acc: {b.accountNumber} — {b.accountName}{b.branch ? ` · ${b.branch}` : ''}</p>
              ))}
            </div>
          )}

          {/* Terms + footer */}
          {payConfig.invoiceTerms && <p style={{ fontSize: '0.78em', color: '#64748b', marginBottom: 6 }}><b>Terms:</b> {payConfig.invoiceTerms}</p>}
          {active.notes && <p style={{ fontSize: '0.78em', color: '#64748b', marginBottom: 6 }}><b>Notes:</b> {active.notes}</p>}
          {payConfig.invoiceFooterNote && <p style={{ fontSize: '0.78em', color: '#94a3b8', textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: 8, marginTop: 8 }}>{payConfig.invoiceFooterNote}</p>}
        </div>
      )}

      {/* Screen UI */}
      <div className="screen-only space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Finance</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Invoices</h1>
          </div>
          <div className="flex gap-2">
            {active && (
              <button onClick={() => window.print()} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                🖨 Print invoice
              </button>
            )}
            <button onClick={createNew} className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700">
              + New invoice
            </button>
          </div>
        </div>

        <div className="flex gap-5 flex-col lg:flex-row">
          {/* Invoice list */}
          <div className="lg:w-72 shrink-0 space-y-2">
            {invoices.length === 0
              ? <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-400">No invoices yet.<br />Click + New invoice.</div>
              : invoices.map((inv) => (
                <button key={inv.id} onClick={() => setActive(inv)}
                  className={`w-full rounded-xl border p-4 text-left transition-all ${active?.id === inv.id ? 'border-slate-950 bg-slate-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900">{inv.number}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColors[inv.status]}`}>{inv.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{inv.student ? `${inv.student.first_name} ${inv.student.last_name}` : 'No student'}</p>
                  <p className="text-xs text-slate-400">Due {inv.dueDate}</p>
                </button>
              ))
            }
          </div>

          {/* Invoice editor */}
          {active ? (
            <div className="flex-1 space-y-4">
              {/* Top bar */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <div>
                  <p className="text-lg font-bold text-slate-950">{active.number}</p>
                  <p className="text-xs text-slate-400">Created {active.issueDate}</p>
                </div>
                <div className="flex items-center gap-3">
                  <select value={active.status} onChange={(e) => update({ status: e.target.value as any })}
                    className="input-field w-auto text-sm">
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                  <button onClick={() => deleteInvoice(active.id)} className="text-xs font-semibold text-rose-600 hover:underline">Delete</button>
                </div>
              </div>

              {/* Details */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="mb-4 text-sm font-bold text-slate-950">Invoice details</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Student</label>
                    <select value={active.student?.id || ''} onChange={(e) => update({ student: students.find((s) => s.id === Number(e.target.value)) || null })} className="input-field">
                      <option value="">Select student</option>
                      {students.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Linked fee (optional — auto-fills items)</label>
                    <select value={active.fee?.id || ''} onChange={(e) => onFeeChange(e.target.value)} className="input-field">
                      <option value="">Select fee</option>
                      {fees.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Issue date</label>
                    <input type="date" value={active.issueDate} onChange={(e) => update({ issueDate: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Due date</label>
                    <input type="date" value={active.dueDate} onChange={(e) => update({ dueDate: e.target.value })} className="input-field" />
                  </div>
                </div>
              </div>

              {/* Line items */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="mb-4 text-sm font-bold text-slate-950">Line items</p>
                <div className="space-y-2">
                  {active.items.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <input placeholder="Description" value={item.description}
                        onChange={(e) => updateItem(i, { description: e.target.value })}
                        className="input-field col-span-5" />
                      <input type="number" min="1" placeholder="Qty" value={item.quantity}
                        onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
                        className="input-field col-span-2" />
                      <input type="number" min="0" step="0.01" placeholder="Price" value={item.unitPrice}
                        onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) })}
                        className="input-field col-span-2" />
                      <select value={item.currency} onChange={(e) => updateItem(i, { currency: e.target.value as CurrencyCode })}
                        className="input-field col-span-2 text-xs">
                        <option value="LRD">LRD</option>
                        <option value="USD">USD</option>
                      </select>
                      <button onClick={() => removeItem(i)} disabled={active.items.length === 1}
                        className="col-span-1 text-rose-500 hover:text-rose-700 disabled:opacity-30 text-lg">×</button>
                    </div>
                  ))}
                </div>
                <button onClick={addItem} className="mt-3 rounded-lg border border-dashed border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-500 hover:border-cyan-400 hover:text-cyan-700">
                  + Add line
                </button>

                {/* Totals */}
                <div className="mt-5 flex justify-end">
                  <div className="min-w-[200px] space-y-1 text-sm">
                    <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatCurrency(subtotal, invCurrency)}</span></div>
                    {payConfig.showInvoiceTax && (
                      <div className="flex justify-between text-slate-600"><span>{payConfig.taxLabel} ({payConfig.taxRate}%)</span><span>{formatCurrency(taxAmount, invCurrency)}</span></div>
                    )}
                    <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-950 text-base">
                      <span>Total</span><span>{formatCurrency(total, invCurrency)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <label className="mb-2 block text-sm font-bold text-slate-950">Notes</label>
                <textarea value={active.notes} onChange={(e) => update({ notes: e.target.value })}
                  className="input-field" rows={2} placeholder="Additional notes for this invoice…" />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center rounded-xl border border-dashed border-slate-300 py-20 text-center text-slate-400">
              <div>
                <p className="text-3xl mb-3">📄</p>
                <p className="text-sm font-semibold">Select an invoice or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
