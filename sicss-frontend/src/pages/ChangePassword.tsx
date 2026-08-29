/**
 * ChangePassword page
 *
 * Non-admin users:  1 step — current + new password → done
 * Admin users:      3 steps:
 *   Step 1 — enter current + new passwords
 *   Step 2 — request 2FA code, enter the 6-digit code
 *   Step 3 — submit password change with verified_token
 */
import { useState, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

// ── Shared helpers ────────────────────────────────────────────────────────────
function StrengthBar({ pw }: { pw: string }) {
  if (!pw) return null;
  let s = 0;
  if (pw.length >= 8)          s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const colors = ['', 'bg-rose-400', 'bg-amber-400', 'bg-cyan-500', 'bg-emerald-500'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= s ? colors[s] : 'bg-slate-200'}`} />
        ))}
      </div>
      <p className="text-xs text-slate-500">
        Strength: <span className="font-semibold">{labels[s]}</span>
        &nbsp;· Mix uppercase, numbers and symbols.
      </p>
    </div>
  );
}

function EyeBtn({ show, toggle }: { show: boolean; toggle: () => void }) {
  return (
    <button type="button" tabIndex={-1} onClick={toggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-base">
      {show ? '🙈' : '👁'}
    </button>
  );
}

function StatusBox({ ok, msg }: { ok: boolean; msg: string }) {
  return (
    <div className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm font-medium ${
      ok ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
         : 'border border-rose-200 bg-rose-50 text-rose-700'
    }`}>
      <span className="mt-0.5 shrink-0">{ok ? '✓' : '✕'}</span>
      {msg}
    </div>
  );
}

// ── Step indicators ───────────────────────────────────────────────────────────
function Steps({ current }: { current: number }) {
  const steps = ['New password', '2FA code', 'Done'];
  return (
    <div className="flex items-center gap-0 mb-6">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done    = current > idx;
        const active  = current === idx;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold border-2 transition-all ${
                done   ? 'bg-emerald-500 border-emerald-500 text-white' :
                active ? 'bg-slate-950 border-slate-950 text-white' :
                         'bg-white border-slate-300 text-slate-400'
              }`}>
                {done ? '✓' : idx}
              </div>
              <span className={`text-[10px] font-semibold whitespace-nowrap ${active ? 'text-slate-950' : done ? 'text-emerald-600' : 'text-slate-400'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-2 mb-4 rounded-full transition-colors ${done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ChangePassword() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';

  // Step 1 — password fields
  const [currentPw, setCurrentPw]   = useState('');
  const [newPw,      setNewPw]       = useState('');
  const [confirmPw,  setConfirmPw]   = useState('');
  const [showCur,    setShowCur]     = useState(false);
  const [showNew,    setShowNew]     = useState(false);
  const [showConf,   setShowConf]    = useState(false);

  // Step 2 — 2FA
  const [twoFaCode,  setTwoFaCode]   = useState('');
  const [plainCode,  setPlainCode]   = useState('');   // shown to admin in this local system
  const [_verifiedToken, setVerifiedToken] = useState('');
  const [codeExpiry, setCodeExpiry]  = useState('');
  const [loadingCode, setLoadingCode] = useState(false);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Flow control
  const [step,    setStep]    = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [status,  setStatus]  = useState<{ ok: boolean; msg: string } | null>(null);

  const clearStatus = () => setStatus(null);

  // ── Step 1: validate passwords locally then either submit or request 2FA ───
  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault(); clearStatus();

    if (newPw !== confirmPw)      { setStatus({ ok: false, msg: 'New passwords do not match.' }); return; }
    if (newPw.length < 8)         { setStatus({ ok: false, msg: 'Password must be at least 8 characters.' }); return; }

    if (!isAdmin) {
      // Non-admin: submit directly
      setLoading(true);
      try {
        await api.post('/auth/change-password', {
          current_password:      currentPw,
          password:              newPw,
          password_confirmation: confirmPw,
        });
        setStatus({ ok: true, msg: 'Password changed successfully. Use your new password next time you sign in.' });
        setCurrentPw(''); setNewPw(''); setConfirmPw('');
      } catch (err: any) {
        const msg = err.response?.data?.errors?.current_password?.[0]
                  || err.response?.data?.message
                  || 'Failed to change password.';
        setStatus({ ok: false, msg });
      } finally { setLoading(false); }
      return;
    }

    // Admin: request 2FA code
    setLoadingCode(true); clearStatus();
    try {
      const res = await api.post('/auth/2fa/generate');
      setPlainCode(res.data.code ?? '');          // shown in this local system
      setCodeExpiry(res.data.expires_at ?? '');
      setStep(2);
      setTimeout(() => codeInputRef.current?.focus(), 100);
    } catch (err: any) {
      setStatus({ ok: false, msg: err.response?.data?.message || 'Failed to generate verification code.' });
    } finally { setLoadingCode(false); }
  };

  // ── Step 2: verify the 6-digit code ────────────────────────────────────────
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault(); clearStatus();
    if (twoFaCode.length !== 6) { setStatus({ ok: false, msg: 'Enter the full 6-digit code.' }); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/2fa/verify', { code: twoFaCode });
      setVerifiedToken(res.data.verified_token);
      // Now submit the password change with the verified token
      await api.post('/auth/change-password', {
        current_password:      currentPw,
        password:              newPw,
        password_confirmation: confirmPw,
        verified_token:        res.data.verified_token,
      });
      setStep(3);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Verification failed.';
      setStatus({ ok: false, msg });
    } finally { setLoading(false); }
  };

  // ── Resend code ─────────────────────────────────────────────────────────────
  const handleResend = async () => {
    setTwoFaCode(''); clearStatus(); setLoadingCode(true);
    try {
      const res = await api.post('/auth/2fa/generate');
      setPlainCode(res.data.code ?? '');
      setCodeExpiry(res.data.expires_at ?? '');
      setStatus({ ok: true, msg: 'A new code has been generated.' });
      setTimeout(() => codeInputRef.current?.focus(), 100);
    } catch { setStatus({ ok: false, msg: 'Failed to resend code.' }); }
    finally { setLoadingCode(false); }
  };

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Security</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Change password</h1>
        <p className="mt-2 text-sm text-slate-500">
          Signed in as <strong>{user?.email}</strong>.
          {isAdmin && <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">🔐 2FA required</span>}
        </p>
      </div>

      {/* Step indicators — admin only */}
      {isAdmin && <Steps current={step} />}

      {/* ── STEP 1 — Enter passwords ── */}
      {step === 1 && (
        <form onSubmit={handleStep1} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <p className="text-sm font-bold text-slate-950">
            {isAdmin ? 'Step 1 — Enter your new password' : 'Enter your new password'}
          </p>

          {status && <StatusBox ok={status.ok} msg={status.msg} />}

          {/* Current password */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Current password <span className="text-rose-500">*</span></label>
            <div className="relative">
              <input required type={showCur ? 'text' : 'password'} value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)} className="input-field pr-11"
                placeholder="Your current password" autoComplete="current-password" />
              <EyeBtn show={showCur} toggle={() => setShowCur((v) => !v)} />
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-400">New password</span></div>
          </div>

          {/* New password */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">New password <span className="text-rose-500">*</span></label>
            <div className="relative">
              <input required minLength={8} type={showNew ? 'text' : 'password'} value={newPw}
                onChange={(e) => setNewPw(e.target.value)} className="input-field pr-11"
                placeholder="At least 8 characters" autoComplete="new-password" />
              <EyeBtn show={showNew} toggle={() => setShowNew((v) => !v)} />
            </div>
            <StrengthBar pw={newPw} />
          </div>

          {/* Confirm */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Confirm new password <span className="text-rose-500">*</span></label>
            <div className="relative">
              <input required type={showConf ? 'text' : 'password'} value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className={`input-field pr-11 ${confirmPw && newPw !== confirmPw ? 'border-rose-400 bg-rose-50' : ''}`}
                placeholder="Re-enter new password" autoComplete="new-password" />
              <EyeBtn show={showConf} toggle={() => setShowConf((v) => !v)} />
            </div>
            {confirmPw && newPw !== confirmPw && (
              <p className="mt-1 text-xs text-rose-600">Passwords do not match.</p>
            )}
            {confirmPw && newPw === confirmPw && confirmPw.length >= 8 && (
              <p className="mt-1 text-xs text-emerald-600">✓ Passwords match.</p>
            )}
          </div>

          {/* Requirements checklist */}
          <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">Requirements</p>
            {[
              [newPw.length >= 8,              'At least 8 characters'],
              [/[A-Z]/.test(newPw),            'One uppercase letter'],
              [/[0-9]/.test(newPw),            'One number'],
              [/[^A-Za-z0-9]/.test(newPw),     'One symbol (recommended)'],
            ].map(([met, label], i) => (
              <p key={i} className={met ? 'text-emerald-600' : ''}>
                {met ? '✓' : '○'} {label as string}
              </p>
            ))}
          </div>

          {isAdmin && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              <span className="mt-0.5 text-base">🔐</span>
              <p>As an administrator, you must verify your identity with a 6-digit code before the password change is applied.</p>
            </div>
          )}

          <button type="submit" disabled={loading || loadingCode}
            className="w-full rounded-xl py-3 text-sm font-bold text-white bg-slate-950 hover:bg-cyan-700 disabled:opacity-50 transition-colors">
            {loadingCode ? 'Sending code…' : loading ? 'Changing…' : isAdmin ? 'Continue to verification →' : 'Change password'}
          </button>
        </form>
      )}

      {/* ── STEP 2 — 2FA code entry (admin only) ── */}
      {step === 2 && isAdmin && (
        <form onSubmit={handleVerifyCode} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-50 text-3xl">🔐</div>
            <p className="text-sm font-bold text-slate-950">Step 2 — 2FA Verification</p>
            <p className="mt-1 text-sm text-slate-500">Enter the 6-digit verification code to authorize this password change.</p>
          </div>

          {status && <StatusBox ok={status.ok} msg={status.msg} />}

          {/* Show the code prominently — in production this is sent by email */}
          {plainCode && (
            <div className="rounded-xl border-2 border-dashed border-cyan-300 bg-cyan-50 p-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-cyan-600 mb-2">
                🔐 Your verification code
              </p>
              <div className="flex items-center justify-center gap-2 mb-2">
                {plainCode.split('').map((digit, i) => (
                  <span key={i} className="flex h-11 w-9 items-center justify-center rounded-lg border-2 border-cyan-300 bg-white text-xl font-black text-slate-950 shadow-sm">
                    {digit}
                  </span>
                ))}
              </div>
              {codeExpiry && (
                <p className="text-xs text-slate-400">Expires at {new Date(codeExpiry).toLocaleTimeString()}</p>
              )}
              <p className="mt-2 text-[10px] text-cyan-600 font-medium">
                In production, this code would be sent to your registered email address.
              </p>
            </div>
          )}

          {/* Code input */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700 text-center">
              Enter the 6-digit code
            </label>
            <input
              ref={codeInputRef}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={twoFaCode}
              onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="input-field text-center text-2xl font-black tracking-[0.4em] py-3"
              placeholder="000000"
              autoComplete="one-time-code"
            />
            <p className="mt-1.5 text-center text-xs text-slate-400">
              {6 - twoFaCode.length} digit{6 - twoFaCode.length !== 1 ? 's' : ''} remaining
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button type="submit" disabled={loading || twoFaCode.length !== 6}
              className="w-full rounded-xl py-3 text-sm font-bold text-white bg-slate-950 hover:bg-cyan-700 disabled:opacity-50 transition-colors">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Verifying & changing password…
                </span>
              ) : '✓ Verify and change password'}
            </button>

            <div className="flex items-center justify-between text-xs">
              <button type="button" onClick={() => { setStep(1); setTwoFaCode(''); clearStatus(); }}
                className="font-semibold text-slate-500 hover:text-slate-800 hover:underline">
                ← Back to passwords
              </button>
              <button type="button" onClick={handleResend} disabled={loadingCode}
                className="font-semibold text-cyan-700 hover:underline disabled:opacity-50">
                {loadingCode ? 'Sending…' : '↻ Resend code'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── STEP 3 — Success ── */}
      {step === 3 && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-3xl text-white shadow-lg">
            ✓
          </div>
          <h2 className="text-xl font-bold text-emerald-900">Password changed successfully</h2>
          <p className="text-sm text-emerald-700">
            Your password has been updated
            {isAdmin ? ' and the change was verified with 2FA.' : '.'}
            {' '}Use your new password the next time you sign in.
          </p>
          <p className="text-xs text-emerald-600">This change has been recorded in the activity log.</p>
          <button onClick={() => { setStep(1); setCurrentPw(''); setNewPw(''); setConfirmPw(''); setTwoFaCode(''); setPlainCode(''); clearStatus(); }}
            className="mt-2 rounded-lg border border-emerald-300 px-5 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100">
            Change password again
          </button>
        </div>
      )}
    </div>
  );
}
