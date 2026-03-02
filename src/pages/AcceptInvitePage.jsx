import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import api from '../api';

export default function AcceptInvitePage({ onLogin }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [inviteInfo, setInviteInfo] = useState(null);
  const [checking, setChecking] = useState(true);
  const [checkError, setCheckError] = useState('');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    api.get(`/business/auth/check-invite?token=${token}`)
      .then(res => {
        setInviteInfo(res.data);
        setName(res.data.name || '');
      })
      .catch(err => setCheckError(err.response?.data?.detail || 'Invalid or expired invitation'))
      .finally(() => setChecking(false));
  }, [token, navigate]);

  const needsPassword = inviteInfo && !inviteInfo.has_password;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (needsPassword) {
      if (password !== confirm) { setError('Passwords do not match.'); return; }
      if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    }
    setLoading(true);
    setError('');
    try {
      const payload = { token };
      if (needsPassword) payload.password = password;
      if (name) payload.name = name;
      const res = await api.post('/business/auth/accept-invite', payload);
      onLogin(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to accept invitation.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (checkError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-5">
        <div className="w-full max-w-[340px] text-center">
          <h1 className="text-[28px] font-extrabold tracking-tight text-zinc-900 mb-2">Rekovr</h1>
          <p className="text-[13px] text-zinc-400 mb-8">Business</p>
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-[13px] text-red-600 font-medium">{checkError}</p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 text-[13px] font-medium text-zinc-500 hover:text-zinc-700 transition"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-5">
      <div className="w-full max-w-[340px]">
        <div className="mb-8">
          <h1 className="text-[28px] font-extrabold tracking-tight text-zinc-900">Rekovr</h1>
          <p className="text-[13px] text-zinc-400 mt-1">Business</p>
        </div>

        <div className="mb-6">
          <h2 className="text-[16px] font-bold text-zinc-900">
            {needsPassword ? 'Accept invitation' : 'Join organization'}
          </h2>
          <p className="text-[13px] text-zinc-500 mt-1">
            {needsPassword
              ? `Set your password to join ${inviteInfo.org_name}.`
              : `You're joining ${inviteInfo.org_name} as ${inviteInfo.role}.`
            }
          </p>
        </div>

        {/* Invite summary */}
        <div className="p-4 bg-zinc-50 rounded-xl mb-5 space-y-1.5">
          <div className="flex justify-between text-[12px]">
            <span className="text-zinc-400">Organization</span>
            <span className="font-medium text-zinc-700">{inviteInfo.org_name}</span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span className="text-zinc-400">Role</span>
            <span className="font-medium text-zinc-700 capitalize">{inviteInfo.role}</span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span className="text-zinc-400">Email</span>
            <span className="font-medium text-zinc-700">{inviteInfo.email}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {needsPassword && (
            <>
              {!inviteInfo.existing_user && (
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-[13px] outline-none focus:border-zinc-400 transition"
                />
              )}
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
            </>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-[12px] text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-zinc-900 text-white rounded-lg text-[13px] font-semibold hover:bg-zinc-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {needsPassword ? 'Create account & join' : `Join ${inviteInfo.org_name}`}
          </button>
        </form>
      </div>
    </div>
  );
}
