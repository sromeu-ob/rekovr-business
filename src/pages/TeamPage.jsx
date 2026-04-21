import { useEffect, useState } from 'react';
import { Users, UserPlus, Mail, Clock, Shield, Wrench, Loader2 } from 'lucide-react';
import api from '../api';
import { useI18n } from '../contexts/I18nContext';

const ROLE_CONFIG = {
  admin: { icon: Shield, style: 'bg-slate-900 text-white' },
  operator: { icon: Wrench, style: 'bg-slate-100 text-slate-600' },
};

function timeAgo(dateStr, t) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return t('today');
  if (days === 1) return t('yesterday');
  return `${days}${t('daysAgo')}`;
}

export default function TeamPage({ auth }) {
  const { t } = useI18n();
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', name: '', role: 'operator' });
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);

  const isAdmin = auth?.org_role === 'admin';

  const ROLE_LABELS = {
    admin: 'Admin',
    operator: 'Operator',
  };

  const fetchTeam = () => {
    api.get('/business/auth/team')
      .then(res => {
        setMembers(res.data.members || []);
        setInvites(res.data.pending_invites || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTeam(); }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    setInviteResult(null);
    try {
      const res = await api.post('/business/auth/invite', inviteForm);
      setInviteResult({ ok: true, message: res.data.message, token: res.data.invite_token });
      setInviteForm({ email: '', name: '', role: 'operator' });
      fetchTeam();
    } catch (err) {
      setInviteResult({ ok: false, message: err.response?.data?.detail || t('failedToSendInvitation') });
    } finally {
      setInviting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 data-testid="team-heading" className="text-2xl font-semibold text-slate-900">{t('team')}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {members.length} {members.length !== 1 ? t('members') : t('member')}
            {invites.length > 0 && ` · ${invites.length} ${t('pending')}`}
          </p>
        </div>
        {isAdmin && (
          <button
            data-testid="invite-member-btn"
            onClick={() => { setShowInvite(!showInvite); setInviteResult(null); }}
            className="flex items-center gap-2 px-4 py-2 btn-brand text-white rounded-md text-sm font-medium transition-colors"
          >
            <UserPlus size={15} />
            {t('inviteMember')}
          </button>
        )}
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
          <p className="text-sm font-medium text-slate-900 mb-4">{t('newInvitation')}</p>
          <form onSubmit={handleInvite} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                data-testid="invite-name-input"
                type="text"
                placeholder={t('namePlaceholder')}
                value={inviteForm.name}
                onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                required
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
              />
              <input
                data-testid="invite-email-input"
                type="email"
                placeholder={t('emailPlaceholder')}
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                required
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5 bg-slate-100 rounded-md p-0.5">
                {['operator', 'admin'].map((r) => (
                  <button
                    key={r}
                    data-testid={`invite-role-${r}`}
                    type="button"
                    onClick={() => setInviteForm({ ...inviteForm, role: r })}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      inviteForm.role === r
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
              <button
                data-testid="send-invite-btn"
                type="submit"
                disabled={inviting}
                className="ml-auto flex items-center gap-2 px-4 py-2 btn-brand text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
              >
                {inviting ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                {inviting ? t('sending') : t('sendInvitation')}
              </button>
            </div>
          </form>

          {inviteResult && (
            <div className={`mt-3 px-3 py-2.5 rounded-md text-sm ${
              inviteResult.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
            }`}>
              {inviteResult.message}
              {inviteResult.token && (
                <span className="block mt-1 text-xs text-emerald-600 font-mono break-all">
                  Dev token: {inviteResult.token}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Members */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{t('membersSection')}</p>
            </div>
            <div className="divide-y divide-slate-100">
              {members.map((m) => {
                const rc = ROLE_CONFIG[m.role] || ROLE_CONFIG.operator;
                const RoleIcon = rc.icon;
                return (
                  <div key={m.user_id} data-testid={`member-${m.user_id}`} className="flex items-center gap-4 px-5 py-3.5">
                    {m.picture ? (
                      <img src={m.picture} alt="" className="w-8 h-8 rounded-full object-cover bg-slate-100 flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-500 flex-shrink-0">
                        {(m.name || m.email || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{m.name}</p>
                      <p className="text-xs text-slate-500 truncate">{m.email}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${rc.style}`}>
                      <RoleIcon size={11} />
                      {ROLE_LABELS[m.role] || m.role}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending invites */}
          {invites.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{t('pendingInvitations')}</p>
              </div>
              <div className="divide-y divide-slate-100">
                {invites.map((inv, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <Clock size={13} className="text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{inv.name}</p>
                      <p className="text-xs text-slate-500 truncate">{inv.email}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-medium text-amber-600 capitalize">{inv.role}</span>
                      <p className="text-xs text-slate-400 mt-0.5">{timeAgo(inv.created_at, t)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
