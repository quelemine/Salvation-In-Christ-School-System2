import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await authService.forgotPassword({ email });
      setMessage(response.message || 'If this email exists, password reset instructions have been sent.');
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Unable to process your request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400 text-xl font-black text-slate-950">S</div>
          <h1 className="mt-5 text-2xl font-bold text-slate-950">Reset your password</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Enter your account email and we will send instructions to reset your password.</p>
        </div>

        {message && <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>}
        {error && <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="forgot-email" className="mb-2 block text-sm font-semibold text-slate-700">Email address</label>
            <input id="forgot-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="input-field" placeholder="admin@sicss.com" />
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50">{loading ? 'Sending...' : 'Send reset instructions'}</button>
        </form>
        <Link to="/login" className="mt-6 block text-center text-sm font-semibold text-cyan-700 hover:text-cyan-900">Back to sign in</Link>
      </div>
    </div>
  );
}
