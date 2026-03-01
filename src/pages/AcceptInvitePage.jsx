import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api';

export default function AcceptInvitePage({ onLogin }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) navigate('/login');
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/business/auth/accept-invite', { token, password, name });
      onLogin(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid or expired invitation link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-5">
      <div className="w-full max-w-[340px]">
        <div className="mb-8">
          <h1 className="text-[28px] font-extrabold tracking-tight text-zinc-900">Rekovr</h1>
          <p className="text-[13px] text-zinc-400 mt-1">Business</p>
        </div>

        <div className="mb-6">
          <h2 className="text-[16px] font-bold text-zinc-900">Accept invitation</h2>
          <p className="text-[13px] text-zinc-500 mt-1">Set your password to activate your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-[13px] outline-none focus:border-zinc-400 transition"
          />
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
            className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-[13px] outline-none focus:border-zinc-400 transition"
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-[13px] outline-none focus:border-zinc-400 transition"
          />

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-[12px] text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-zinc-900 text-white rounded-lg text-[13px] font-semibold hover:bg-zinc-800 transition disabled:opacity-50"
          >
            {loading ? 'Activating...' : 'Activate account'}
          </button>
        </form>
      </div>
    </div>
  );
}
