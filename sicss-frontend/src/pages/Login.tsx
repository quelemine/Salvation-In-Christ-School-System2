import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import OtpModal from '../components/OtpModal';

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
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<number | null>(null);
  const [pendingEmail, setPendingEmail] = useState('');
  const [devMode, setDevMode] = useState(false);
  const [devOtpCode, setDevOtpCode] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError('');
    setLoading(true);
    try {
      const response = await authService.login(data);
      if (response.requires_otp && response.user_id && response.email) {
        // Show OTP modal
        setPendingUserId(response.user_id);
        setPendingEmail(response.email);
        setDevMode(response.dev_mode || false);
        setDevOtpCode(response.otp_code || '');
        setShowOtpModal(true);
        setError('');
      } else if (response.user && response.token) {
        // Direct login (no OTP required)
        setAuth(response.user, response.token);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSuccess = (user: any, token: string) => {
    setAuth(user, token);
    setShowOtpModal(false);
    navigate('/dashboard');
  };

  const handleOtpClose = () => {
    setShowOtpModal(false);
    setPendingUserId(null);
    setPendingEmail('');
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
        {/* Decorative circles */}
        <div className="absolute top-20 left-20 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-20 right-20 h-40 w-40 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="relative z-10 text-center max-w-sm">
          {branding.logoUrl
            ? <img src={branding.logoUrl} alt="School logo" className="h-32 w-32 rounded-2xl object-contain mx-auto mb-8 shadow-2xl ring-4 ring-white/20" />
            : (
              <div className="relative h-32 w-32 mx-auto mb-8">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 blur-xl opacity-50" />
                <div className="relative h-32 w-32 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-2xl ring-4 ring-white/30">
                  <span className="text-6xl font-black text-white">S</span>
                </div>
              </div>
            )
          }
          <h1 className="text-4xl font-black text-white leading-tight tracking-tight">{branding.schoolName}</h1>
          {branding.schoolSubtitle && <p className="mt-3 text-base font-medium text-white/70">{branding.schoolSubtitle}</p>}
          {branding.schoolMotto && (
            <p className="mt-6 text-sm italic text-cyan-300 leading-relaxed">"{branding.schoolMotto}"</p>
          )}
          {branding.schoolAddress && (
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-white/50">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {branding.schoolAddress}
            </div>
          )}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-6 py-12 sm:px-12">
        <div className="w-full max-w-md">

          {/* Mobile logo — only shows on small screens */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            {branding.logoUrl
              ? <img src={branding.logoUrl} alt="School logo" className="h-20 w-20 rounded-xl object-contain mb-4 shadow-lg" />
              : (
                <div className="relative h-20 w-20 mb-4">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 blur-lg opacity-50" />
                  <div className="relative h-20 w-20 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg">
                    <span className="text-3xl font-black text-white">S</span>
                  </div>
                </div>
              )
            }
            <h1 className="text-2xl font-black text-slate-950 text-center">{branding.schoolName}</h1>
            {branding.schoolSubtitle && <p className="text-sm text-slate-500 text-center mt-1">{branding.schoolSubtitle}</p>}
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm p-8 shadow-xl shadow-slate-200/50">
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">{system.systemName}</p>
              <h2 className="text-3xl font-bold text-slate-900">Welcome back</h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">Sign in to your account to continue</p>
            </div>

            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
                  Email address
                </label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    {...register('email')}
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-sm font-medium text-slate-700 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-slate-400"
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && <p className="mt-2 text-xs text-rose-600 font-medium">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    {...register('password')}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-12 text-sm font-medium text-slate-700 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-slate-400"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && <p className="mt-2 text-xs text-rose-600 font-medium">{errors.password.message}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-xl py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                style={{ backgroundColor: 'var(--accent, #0891b2)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in…
                  </span>
                ) : 'Sign in'}
              </button>
            </form>
          </div>

          {/* OTP Modal */}
          {pendingUserId && (
            <OtpModal
              isOpen={showOtpModal}
              onClose={handleOtpClose}
              onSuccess={handleOtpSuccess}
              userId={pendingUserId}
              email={pendingEmail}
              initialDevMode={devMode}
              initialOtpCode={devOtpCode}
              initialDeliveryMethod="email"
            />
          )}

          {/* Footer */}
          <div className="mt-8 flex flex-col items-center gap-2 text-center">
            <p className="text-xs text-slate-500 font-medium">
              {branding.schoolName} · {system.systemName} · {system.academicYear}
            </p>
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} All rights reserved
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
