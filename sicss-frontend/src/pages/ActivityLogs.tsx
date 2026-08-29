import { useEffect, useState } from 'react';
import { authService } from '../services/authService';

type Activity = {
  id: number;
  event: string;
  description: string;
  created_at: string;
  user_email?: string;
  ip_address?: string;
  device_type?: string;
  browser?: string;
  platform?: string;
  user?: { first_name: string; last_name: string; email: string };
};

export default function ActivityLogs() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadActivities = async () => {
    setLoading(true);
    setError('');
    try {
      setActivities(await authService.activityLogs());
    } catch {
      setError('Activity logs could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadActivities(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-cyan-700">Security and monitoring</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Activity logs</h1><p className="mt-2 text-sm text-slate-500">Review user activity, access times, devices, and connection details.</p></div><button onClick={loadActivities} disabled={loading} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:border-cyan-300 hover:text-cyan-700 disabled:opacity-50">{loading ? 'Loading...' : 'Refresh logs'}</button></div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">{error ? <p className="m-6 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : loading ? <p className="p-6 text-sm text-slate-500">Loading activity logs...</p> : activities.length === 0 ? <p className="p-6 text-sm text-slate-500">No activity has been recorded yet.</p> : <div className="overflow-x-auto"><table className="min-w-[900px] w-full text-left"><thead className="border-b border-slate-100 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">User</th><th className="px-5 py-3">Activity</th><th className="px-5 py-3">Device</th><th className="px-5 py-3">IP address</th><th className="px-5 py-3">Time</th></tr></thead><tbody className="divide-y divide-slate-100 text-sm">{activities.map((activity) => <tr key={activity.id} className="align-top"><td className="px-5 py-4"><p className="font-semibold text-slate-800">{activity.user ? `${activity.user.first_name} ${activity.user.last_name}` : activity.user_email || 'Unknown user'}</p><p className="mt-1 text-xs text-slate-400">{activity.user?.email || activity.user_email || 'No email recorded'}</p></td><td className="px-5 py-4"><span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold capitalize text-cyan-800">{activity.event.replaceAll('_', ' ')}</span><p className="mt-2 text-xs text-slate-500">{activity.description}</p></td><td className="px-5 py-4"><p className="font-medium text-slate-700">{activity.device_type || 'Unknown device'}</p><p className="mt-1 text-xs text-slate-400">{[activity.browser, activity.platform].filter(Boolean).join(' / ') || 'Unknown browser / OS'}</p></td><td className="px-5 py-4 font-mono text-xs text-slate-500">{activity.ip_address || 'Unknown'}</td><td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{new Date(activity.created_at).toLocaleString()}</td></tr>)}</tbody></table></div>}</div>
    </div>
  );
}
