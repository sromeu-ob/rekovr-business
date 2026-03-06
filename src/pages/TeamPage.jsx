import { useEffect, useState } from 'react';
import { Users, UserPlus, Mail, Clock, Shield, Wrench, Loader2 } from 'lucide-react';
import api from '../api';

const ROLE_CONFIG = {
  admin: { icon: Shield, label: 'Admin', style: 'bg-zinc-900 text-white' },
  operator: { icon: Wrench, label: 'Operator', style: 'bg-zinc-100 text-zinc-600' },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

export default function TeamPage({ auth }) {
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', name: '', role: 'operator' });
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);

  const isAdmin = auth?.org_role === 'admin';

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
      setInviteResult({ ok: false, message: err.response?.data?.detail || 'Failed to send invitation' });
    } finally {
      setInviting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 data-testid="team-heading" className="text-[20px] font-extrabold text-zinc-900">Team</h2>
          <p className="text-[13px] text-zinc-400 mt-1">
            {members.length} member{members.length !== 1 ? 's' : ''}
            {invites.length > 0 && ` · ${invites.length} pending`}
          </p>
        </div>
        {isAdmin && (
          <button
            data-testid="invite-member-btn"
            onClick={() => { setShowInvite(!showInvite); setInviteResult(null); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded-xl text-[13px] font-semibold hover:bg-zinc-800 transition"
          >
            <UserPlus size={15} />
            Invite member
          </button>
        )}
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="bg-white border border-zinc-100 rounded-2xl p-5 mb-6">
          <p className="text-[13px] font-bold text-zinc-900 mb-4">New invitation</p>
          <form onSubmit={handleInvite} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                data-testid="invite-name-input"
                type="text"
                placeholder="Name"
                value={inviteForm.name}
                onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-[13px] text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
              <input
                data-testid="invite-email-input"
                type="email"
                placeholder="Email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-[13px] text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                {['operator', 'admin'].map((r) => (
                  <button
                    key={r}
                    data-testid={`invite-role-${r}`}
                    type="button"
                    onClick={() => setInviteForm({ ...inviteForm, role: r })}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition ${
                      inviteForm.role === r
                        ? 'bg-zinc-900 text-white'
                        : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
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
                className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-[13px] font-semibold hover:bg-zinc-800 transition disabled:opacity-50"
              >
                {inviting ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                Send invitation
              </button>
            </div>
          </form>

          {inviteResult && (
            <div className={`mt-3 px-4 py-3 rounded-xl text-[12px] font-medium ${
              inviteResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
            }`}>
              {inviteResult.message}
              {inviteResult.token && (
                <span className="block mt-1 text-[11px] text-green-600 font-mono break-all">
                  Dev token: {inviteResult.token}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Members */}
          <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-zinc-100">
              <p className="text-[12px] font-semibold text-zinc-400 uppercase tracking-wider">Members</p>
            </div>
            <div className="divide-y divide-zinc-50">
              {members.map((m) => {
                const rc = ROLE_CONFIG[m.role] || ROLE_CONFIG.operator;
                const RoleIcon = rc.icon;
                return (
                  <div key={m.user_id} data-testid={`member-${m.user_id}`} className="flex items-center gap-4 px-5 py-4">
                    {m.picture ? (
                      <img src={m.picture} alt="" className="w-9 h-9 rounded-full object-cover bg-zinc-100" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center text-[13px] font-bold text-zinc-400">
                        {(m.name || m.email || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-zinc-800 truncate">{m.name}</p>
                      <p className="text-[12px] text-zinc-400 truncate">{m.email}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${rc.style}`}>
                      <RoleIcon size={11} />
                      {rc.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending invites */}
          {invites.length > 0 && (
            <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-zinc-100">
                <p className="text-[12px] font-semibold text-zinc-400 uppercase tracking-wider">Pending invitations</p>
              </div>
              <div className="divide-y divide-zinc-50">
                {invites.map((inv, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center">
                      <Clock size={14} className="text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-zinc-800 truncate">{inv.name}</p>
                      <p className="text-[12px] text-zinc-400 truncate">{inv.email}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-[11px] font-medium text-amber-600 capitalize">{inv.role}</span>
                      <p className="text-[10px] text-zinc-300 mt-0.5">{timeAgo(inv.created_at)}</p>
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
