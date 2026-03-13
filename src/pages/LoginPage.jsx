import { useState } from 'react';
import api from '../api';
import { useI18n } from '../contexts/I18nContext';

export default function LoginPage({ onLogin }) {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [orgList, setOrgList] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/business/auth/login', { email, password });

      if (res.data.requires_org_selection) {
        setOrgList({ email, password, orgs: res.data.organizations });
        return;
      }

      onLogin(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || t('loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleOrgSelect = async (orgId) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/business/auth/login', {
        email: orgList.email,
        password: orgList.password,
        organization_id: orgId,
      });
      onLogin(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || t('loginFailedShort'));
    } finally {
      setLoading(false);
    }
  };

  if (orgList) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-5">
        <div className="w-full max-w-[360px]">
          <div className="mb-8">
            <h1 className="text-[28px] font-extrabold tracking-tight text-zinc-900">Rekovr</h1>
            <p className="text-[13px] text-zinc-400 mt-1">{t('business')}</p>
          </div>
          <p className="text-[13px] font-medium text-zinc-700 mb-4">
            {t('selectOrganization')}
          </p>
          <div className="space-y-2">
            {orgList.orgs.map((org) => (
              <button
                key={org.organization_id}
                onClick={() => handleOrgSelect(org.organization_id)}
                disabled={loading}
                data-testid={`org-select-${org.organization_id}`}
                className="w-full flex items-center justify-between px-4 py-3 border border-zinc-200 rounded-xl hover:border-zinc-400 hover:bg-zinc-50 transition text-left disabled:opacity-50"
              >
                <div>
                  <p className="text-[13px] font-semibold text-zinc-900">{org.name}</p>
                  <p className="text-[11px] text-zinc-400 capitalize mt-0.5">{org.type}</p>
                </div>
                <span className="text-zinc-300">→</span>
              </button>
            ))}
          </div>
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-[12px] text-red-600">{error}</p>
            </div>
          )}
          <button
            onClick={() => setOrgList(null)}
            className="mt-4 text-[12px] text-zinc-400 hover:text-zinc-600 transition"
          >
            {t('backToLogin')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-5">
      <div className="w-full max-w-[320px]">
        <div className="mb-10">
          <h1 className="text-[32px] font-extrabold tracking-tight text-zinc-900">Rekovr</h1>
          <p className="text-[13px] text-zinc-400 mt-1">{t('business')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder={t('workEmail')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            data-testid="login-email-input"
            className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-[13px] outline-none focus:border-zinc-400 transition"
          />
          <input
            type="password"
            placeholder={t('password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            data-testid="login-password-input"
            className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-[13px] outline-none focus:border-zinc-400 transition"
          />

          {error && (
            <div data-testid="login-error" className="p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-[12px] text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            data-testid="login-submit-btn"
            className="w-full h-11 bg-zinc-900 text-white rounded-lg text-[13px] font-semibold hover:bg-zinc-800 transition disabled:opacity-50"
          >
            {loading ? t('signingIn') : t('signIn')}
          </button>
        </form>

        <p className="text-[11px] text-zinc-300 text-center mt-6">
          {t('invitationOnly')}
        </p>
      </div>
    </div>
  );
}
