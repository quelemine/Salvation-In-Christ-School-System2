import { Link, useLocation } from 'react-router-dom';

const featureDetails: Record<string, { eyebrow: string; description: string }> = {
  '/classes': { eyebrow: 'Academic structure', description: 'Create and manage classes, sections, capacity, and academic assignments.' },
  '/teachers': { eyebrow: 'People management', description: 'Maintain teaching staff records and connect teachers to classes and subjects.' },
  '/subjects': { eyebrow: 'Academic structure', description: 'Organize the subjects offered by your school and keep course information current.' },
  '/grades': { eyebrow: 'Academic performance', description: 'Record, review, and report student grades across classes and subjects.' },
  '/assignments': { eyebrow: 'Teaching tools', description: 'Create assignments and keep track of classroom work.' },
  '/comments': { eyebrow: 'Student support', description: 'Capture private student comments and follow-up notes for staff.' },
  '/payments': { eyebrow: 'Finance', description: 'Record and review student payments from one central workspace.' },
  '/receipts': { eyebrow: 'Finance', description: 'Generate and manage payment receipts for your school.' },
  '/reports': { eyebrow: 'Insights', description: 'Review academic and financial reports as your school data grows.' },
  '/sync': { eyebrow: 'System tools', description: 'Monitor synchronization and keep your offline data up to date.' },
};

export default function FeaturePage() {
  const location = useLocation();
  const detail = featureDetails[location.pathname] ?? { eyebrow: 'SICSS workspace', description: 'This workspace is ready for your school data.' };
  const title = location.pathname.slice(1).replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">{detail.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{detail.description}</p>
        <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="text-sm font-semibold text-slate-700">No records to display yet</p>
          <p className="mt-1 text-xs text-slate-500">This feature is connected and ready for data.</p>
        </div>
      </section>
      <Link to="/dashboard" className="inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700">Back to dashboard</Link>
    </div>
  );
}
