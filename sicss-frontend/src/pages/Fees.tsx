import { useState, useEffect } from 'react';
import { financeService } from '../services/financeService';
import type { Fee } from '../types';
import { syncManager } from '../sync/syncManager';
import { FormModal } from '../components/FormModal';
import { currencyOptions, formatCurrency, type CurrencyCode } from '../utils/currency';

export default function Fees() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', amount: '', currency: 'LRD' as CurrencyCode, academic_year: new Date().getFullYear().toString(), description: '' });

  useEffect(() => {
    loadFees();
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadFees = async () => {
    try {
      const response = await financeService.getAllFees();
      setFees(response.data || []);
    } catch (error) {
      console.error('Failed to load fees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    await syncManager.sync();
    loadFees();
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      const response = await financeService.createFee({ ...formData, amount: Number(formData.amount), slug: formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') });
      setFees((current) => [...current, response]);
      setIsModalOpen(false);
      setFormData({ name: '', amount: '', currency: 'LRD', academic_year: new Date().getFullYear().toString(), description: '' });
    } catch (error) {
      console.error('Failed to create fee:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading fees...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fees</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleSync}
            disabled={!isOnline}
            className="btn-primary disabled:opacity-50"
          >
            Sync
          </button>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary">Add Fee</button>
        </div>
      </div>

      <FormModal isOpen={isModalOpen} title="Add Fee" onClose={() => setIsModalOpen(false)} onSubmit={handleCreate} submitText="Create fee" isLoading={isSubmitting}>
        <div className="space-y-4"><div><label className="mb-1 block text-sm font-medium text-gray-700">Fee name</label><input required value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} className="input-field" placeholder="Tuition fee" /></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><div><label className="mb-1 block text-sm font-medium text-gray-700">Amount</label><input required min="0" step="0.01" type="number" value={formData.amount} onChange={(event) => setFormData({ ...formData, amount: event.target.value })} className="input-field" /></div><div><label className="mb-1 block text-sm font-medium text-gray-700">Currency</label><select value={formData.currency} onChange={(event) => setFormData({ ...formData, currency: event.target.value as CurrencyCode })} className="input-field">{currencyOptions.map((option) => <option key={option.code} value={option.code}>{option.code}</option>)}</select></div><div><label className="mb-1 block text-sm font-medium text-gray-700">Academic year</label><input required value={formData.academic_year} onChange={(event) => setFormData({ ...formData, academic_year: event.target.value })} className="input-field" /></div></div><div><label className="mb-1 block text-sm font-medium text-gray-700">Description</label><textarea value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} className="input-field" rows={3} /></div></div>
      </FormModal>

      <div className="card">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Class
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Academic Year
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {fees.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No fees found
                </td>
              </tr>
            ) : (
              fees.map((fee) => (
                <tr key={fee.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {fee.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(fee.amount, fee.currency || 'LRD')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {fee.class?.name || 'All Classes'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {fee.academic_year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      fee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {fee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                    <button className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
