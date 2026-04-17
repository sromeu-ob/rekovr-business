import { useState } from 'react';
import { Loader2, ArrowRight } from 'lucide-react';
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

  /* ── Org selection ─────────────────────────────────────────────────────── */
  if (orgList) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">

          {/* Brand */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 mb-1">
              <span className="text-xl font-semibold text-stone-900">Rekovr</span>
              <span className="text-xs font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                Business
              </span>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white border border-stone-200 rounded-lg shadow-sm px-6 py-7">
            <h2 className="text-base font-semibold text-stone-900 mb-1">
              {t('selectOrganization')}
            </h2>
            <p className="text-sm text-stone-500 mb-5">{t('selectOrganizationDesc')}</p>

            <div className="space-y-2">
              {orgList.orgs.map((org) => (
                <button
                  key={org.organization_id}
                  onClick={() => handleOrgSelect(org.organization_id)}
                  disabled={loading}
                  data-testid={`org-select-${org.organization_id}`}
                  className="w-full flex items-center justify-between px-4 py-3 border border-stone-200 rounded-md hover:border-stone-400 hover:bg-stone-50 transition-colors text-left disabled:opacity-50"
                >
                  <div>
                    <p className="text-sm font-medium text-stone-900">{org.name}</p>
                    <p className="text-xs text-stone-500 capitalize mt-0.5">{org.type}</p>
                  </div>
                  {loading
                    ? <Loader2 size={14} className="text-stone-400 animate-spin flex-shrink-0" />
                    : <ArrowRight size={14} className="text-stone-400 flex-shrink-0" />
                  }
                </button>
              ))}
            </div>

            {error && (
              <div className="mt-4 px-3 py-2.5 bg-red-50 rounded-md">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => setOrgList(null)}
              className="text-sm text-stone-400 hover:text-stone-700 transition-colors"
            >
              {t('backToLogin')}
            </button>
          </div>

        </div>
      </div>
    );
  }

  /* ── Login form ────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-xl font-semibold text-stone-900">Rekovr</span>
            <span className="text-xs font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
              Business
            </span>
          </div>
          <p className="text-sm text-stone-500">{t('loginTagline')}</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-stone-200 rounded-lg shadow-sm px-6 py-7">
          <h2 className="text-base font-semibold text-stone-900 mb-5">{t('signIn')}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                {t('workEmail')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                data-testid="login-email-input"
                placeholder="you@company.com"
                className="w-full h-10 px-3 bg-white border border-stone-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors placeholder:text-stone-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                {t('password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="login-password-input"
                placeholder="••••••••"
                className="w-full h-10 px-3 bg-white border border-stone-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors placeholder:text-stone-400"
              />
            </div>

            {error && (
              <div data-testid="login-error" className="px-3 py-2.5 bg-red-50 rounded-md">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              data-testid="login-submit-btn"
              className="w-full h-10 flex items-center justify-center gap-2 bg-stone-900 text-white rounded-md text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 mt-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? t('signingIn') : t('signIn')}
            </button>

          </form>
        </div>

        <p className="text-xs text-stone-400 text-center mt-5">
          {t('invitationOnly')}
        </p>

      </div>
    </div>
  );
}
