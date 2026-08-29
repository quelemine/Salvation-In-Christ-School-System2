import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { settings } = useSettingsStore();
  const { branding, system } = settings;

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError('');
    setLoading(true);
    try {
      const response = await authService.login(data);
      if (response.user && response.token) {
        setAuth(response.user, response.token);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>

      {/* Left decorative panel — hidden on mobile */}
      <div
        className="hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0e7490 100%)' }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

        <div className="relative z-10 text-center max-w-xs">
          {branding.logoUrl
            ? <img src={branding.logoUrl} alt="School logo" className="h-28 w-28 rounded-2xl object-contain mx-auto mb-6 shadow-2xl" />
            : (
              <div className="h-28 w-28 rounded-2xl bg-cyan-400 flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <span className="text-5xl font-black text-slate-950">S</span>
              </div>
            )
          }
          <h1 className="text-3xl font-black text-white leading-tight">{branding.schoolName}</h1>
          {branding.schoolSubtitle && <p className="mt-2 text-sm text-white/60">{branding.schoolSubtitle}</p>}
          {branding.schoolMotto && (
            <p className="mt-4 text-sm italic text-cyan-300">"{branding.schoolMotto}"</p>
          )}
          {branding.schoolAddress && <p className="mt-3 text-xs text-white/40">{branding.schoolAddress}</p>}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 px-6 py-12 sm:px-12">
        <div className="w-full max-w-md">

          {/* Mobile logo — only shows on small screens */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            {branding.logoUrl
              ? <img src={branding.logoUrl} alt="School logo" className="h-16 w-16 rounded-xl object-contain mb-3 shadow-md" />
              : (
                <div className="h-16 w-16 rounded-xl bg-slate-950 flex items-center justify-center mb-3 shadow-md">
                  <span className="text-2xl font-black text-cyan-400">S</span>
                </div>
              )
            }
            <h1 className="text-xl font-black text-slate-950 text-center">{branding.schoolName}</h1>
            {branding.schoolSubtitle && <p className="text-xs text-slate-400 text-center mt-0.5">{branding.schoolSubtitle}</p>}
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-7">
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-700 mb-1">{system.systemName}</p>
              <h2 className="text-2xl font-bold text-slate-950">Welcome back</h2>
              <p className="mt-1 text-sm text-slate-500">Sign in to your account to continue</p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <span className="mt-0.5 shrink-0">⚠</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Email address
                </label>
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="input-field"
                  placeholder="you@example.com"
                />
                {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-cyan-700 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    {...register('password')}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="input-field pr-10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-base"
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full rounded-xl py-3 text-sm font-bold text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--accent, #0891b2)' }}
                onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.filter = '')}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in…
                  </span>
                ) : 'Sign in'}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="mt-5 text-center text-xs text-slate-400">
            {branding.schoolName} · {system.systemName} · {system.academicYear}
          </p>
        </div>
      </div>
    </div>
  );
}
