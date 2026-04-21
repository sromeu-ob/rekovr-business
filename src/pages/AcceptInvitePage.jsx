import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import api from '../api';
import { useI18n } from '../contexts/I18nContext';

export default function AcceptInvitePage({ onLogin }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useI18n();
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
      .catch(err => setCheckError(err.response?.data?.detail || t('invalidInvitation')))
      .finally(() => setChecking(false));
  }, [token, navigate]);

  const needsPassword = inviteInfo && !inviteInfo.has_password;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (needsPassword) {
      if (password !== confirm) { setError(t('passwordsDontMatch')); return; }
      if (password.length < 8) { setError(t('passwordTooShort')); return; }
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
      setError(err.response?.data?.detail || t('failedToAcceptInvitation'));
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (checkError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-5">
        <div className="w-full max-w-[340px] text-center">
          <h1 className="text-xl font-semibold text-slate-900 mb-1">Rekovr</h1>
          <p className="text-sm text-slate-400 mb-8">{t('business')}</p>
          <div className="p-4 bg-red-50 border border-red-100 rounded-md">
            <p className="text-sm text-red-600 font-medium">{checkError}</p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            {t('goToLogin')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-5">
      <div className="w-full max-w-[340px]">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-slate-900">Rekovr</h1>
          <p className="text-sm text-slate-400 mt-1">{t('business')}</p>
        </div>

        <div className="mb-6">
          <h2 className="text-base font-semibold text-slate-900">
            {needsPassword ? t('acceptInvitation') : t('joinOrganization')}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {needsPassword
              ? `${t('setPasswordToJoin')} ${inviteInfo.org_name}.`
              : `${t('youreJoining')} ${inviteInfo.org_name} ${t('as')} ${inviteInfo.role}.`
            }
          </p>
        </div>

        {/* Invite summary */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-md mb-5 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">{t('organization')}</span>
            <span className="font-medium text-slate-700">{inviteInfo.org_name}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">{t('role')}</span>
            <span className="font-medium text-slate-700 capitalize">{inviteInfo.role}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">{t('email')}</span>
            <span className="font-medium text-slate-700">{inviteInfo.email}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {needsPassword && (
            <>
              {!inviteInfo.existing_user && (
                <input
                  type="text"
                  placeholder={t('yourName')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                />
              )}
              <input
                type="password"
                placeholder={t('newPassword')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
              />
              <input
                type="password"
                placeholder={t('confirmPassword')}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
              />
            </>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-md">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 btn-brand text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {needsPassword ? t('createAccountAndJoin') : `${t('join')} ${inviteInfo.org_name}`}
          </button>
        </form>
      </div>
    </div>
  );
}
