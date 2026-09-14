import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface StatCardProps {
  label: string;
  value: string | number | null;
  detail: string;
  icon: ReactNode;
  accent: 'blue' | 'purple' | 'gold' | 'emerald' | 'rose' | 'cyan' | 'amber';
  path?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

export function StatCard({ label, value, detail, icon, accent, path, change, changeType }: StatCardProps) {
  const accentLight = {
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
    gold: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
    cyan: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
  };

  const changeColors = {
    positive: 'text-emerald-600',
    negative: 'text-rose-600',
    neutral: 'text-slate-500',
  };

  const content = (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {value !== null ? value : '—'}
          </p>
          <p className="mt-1 text-sm text-slate-400">{detail}</p>
          {change && (
            <p className={`mt-2 text-xs font-medium ${changeColors[changeType || 'neutral']}`}>
              {change}
            </p>
          )}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${accentLight[accent]}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (path) {
    return <Link to={path}>{content}</Link>;
  }

  return content;
}
