import { useState, useEffect } from 'react';
import api from '../services/api';
import { syncManager } from '../sync/syncManager';

type SyncLog = {
  id: number;
  entity_type: string;
  entity_id: string;
  operation: string;
  status: string;
  error_message: string | null;
  synced_at: string | null;
  created_at: string;
};

const statusColors: Record<string, string> = {
  synced: 'bg-emerald-100 text-emerald-800',
  pending: 'bg-amber-100 text-amber-800',
  failed: 'bg-rose-100 text-rose-700',
};

const opColors: Record<string, string> = {
  create: 'bg-blue-100 text-blue-800',
  update: 'bg-cyan-100 text-cyan-800',
  delete: 'bg-rose-100 text-rose-700',
};

export default function SyncStatus() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    load();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sync/logs');
      const data = res.data;
      setLogs(data.data || data || []);
      const latest = (data.data || data || []).find((l: SyncLog) => l.synced_at);
      if (latest) setLastSync(latest.synced_at);
    } catch {
      // sync logs endpoint may not exist in all versions — show empty state
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError('');
    try {
      await syncManager.sync();
      setLastSync(new Date().toISOString());
      await load();
    } catch { setError('Sync failed. Check your connection.'); }
    finally { setSyncing(false); }
  };

  const filtered = filterStatus ? logs.filter((l) => l.status === filterStatus) : logs;

  const counts = {
    synced: logs.filter((l) => l.status === 'synced').length,
    pending: logs.filter((l) => l.status === 'pending').length,
    failed: logs.filter((l) => l.status === 'failed').length,
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">System tools</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Sync status</h1>
          <p className="mt-2 text-sm text-slate-500">Monitor offline data sync and keep your records up to date.</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing || !isOnline}
          className="self-start rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50 sm:self-auto"
        >
          {syncing ? 'Syncing…' : '↑ Sync now'}
        </button>
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {/* Status banner */}
      <div className={`flex items-center gap-3 rounded-xl border px-5 py-4 ${isOnline ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
        <span className={`inline-block h-3 w-3 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-400'}`} />
        <div>
          <p className={`text-sm font-semibold ${isOnline ? 'text-emerald-800' : 'text-amber-800'}`}>
            {isOnline ? 'Connected — online' : 'Offline — changes will sync when back online'}
          </p>
          {lastSync && <p className="text-xs text-slate-500">Last synced: {new Date(lastSync).toLocaleString()}</p>}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Synced', count: counts.synced, color: 'text-emerald-700' },
          { label: 'Pending', count: counts.pending, color: 'text-amber-600' },
          { label: 'Failed', count: counts.failed, color: 'text-rose-600' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{card.label}</p>
            <p className={`mt-2 text-3xl font-bold ${card.color}`}>{card.count}</p>
          </div>
        ))}
      </div>

      {/* Log table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <p className="text-sm font-semibold text-slate-900">Sync log</p>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field w-auto text-xs">
            <option value="">All statuses</option>
            <option value="synced">Synced</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        {loading ? (
          <p className="py-12 text-center text-sm text-slate-500">Loading sync logs…</p>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-2xl">🔄</p>
            <p className="mt-3 text-sm font-semibold text-slate-700">No sync activity yet</p>
            <p className="mt-1 text-xs text-slate-500">Click Sync now while online to push any offline changes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  {['Entity', 'Operation', 'Status', 'Error', 'Synced at', 'Created'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-semibold text-slate-900 capitalize">{l.entity_type?.replace(/_/g, ' ')} #{l.entity_id}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${opColors[l.operation] || 'bg-slate-100 text-slate-600'}`}>
                        {l.operation}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[l.status] || 'bg-slate-100 text-slate-600'}`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-rose-600 text-xs max-w-[200px] truncate">{l.error_message || '—'}</td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{l.synced_at ? new Date(l.synced_at).toLocaleString() : '—'}</td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{new Date(l.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
          {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
