import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, GitCompare, CheckCircle, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';
import api, { photoUrl } from '../api';
import { useI18n } from '../contexts/I18nContext';

function StatCard({ icon: Icon, label, value, sub, accent, testId }) {
  return (
    <div data-testid={testId} className="bg-white rounded-2xl border border-zinc-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent || 'bg-zinc-50'}`}>
          <Icon size={15} className={accent ? 'text-white' : 'text-zinc-400'} />
        </div>
      </div>
      <p className="text-[28px] font-extrabold text-zinc-900 leading-none">{value ?? '—'}</p>
      {sub && <p className="text-[11px] text-zinc-400 mt-1.5">{sub}</p>}
    </div>
  );
}

const STATUS_DOT = {
  pending_verification: 'bg-indigo-400',
  pending_review: 'bg-blue-400',
  pending: 'bg-amber-400',
  accepted: 'bg-green-500',
  rejected: 'bg-red-400',
  dismissed: 'bg-zinc-300',
  recovered: 'bg-green-500',
  paid: 'bg-purple-500',
};

function timeAgo(dateStr, t) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}${t('minutesAgo')}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}${t('hoursAgo')}`;
  const days = Math.floor(hours / 24);
  return `${days}${t('daysAgo')}`;
}

export default function DashboardPage({ auth }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [eventFilter, setEventFilter] = useState('');

  useEffect(() => {
    api.get('/business/events', { params: { status: 'active' } })
      .then(res => setEvents(res.data.events || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = eventFilter ? { event_id: eventFilter } : {};
    api.get('/business/items/dashboard/stats', { params })
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const STATUS_LABEL = {
    pending_verification: t('statusVerification'),
    pending_review: t('statusUnderReview'),
    pending: t('statusPending'),
    accepted: t('statusAccepted'),
    rejected: t('statusRejected'),
    dismissed: t('statusDismissed'),
    recovered: t('statusRecovered'),
    paid: t('statusPaid'),
  };

  const orgName = auth?.organization?.name || 'Your organization';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 data-testid="dashboard-heading" className="text-[22px] font-extrabold text-zinc-900">{t('dashboard')}</h2>
          <p className="text-[13px] text-zinc-400 mt-1">{orgName} — {t('lostFoundOverview')}</p>
        </div>
        {events.length > 0 && (
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="h-9 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[12px] font-medium outline-none focus:border-zinc-400 transition"
          >
            <option value="">{t('evtAllEvents')}</option>
            {events.map(evt => (
              <option key={evt.event_id} value={evt.event_id}>{evt.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          icon={Package}
          label={t('foundItems')}
          value={data?.total_items ?? 0}
          sub={data?.items_this_week ? `+${data.items_this_week} ${t('thisWeek')}` : t('noNewItemsThisWeek')}
          accent="bg-zinc-900"
          testId="stat-found-items"
        />
        <StatCard
          icon={GitCompare}
          label={t('navMatches')}
          value={data?.total_matches ?? 0}
          sub={data?.pending_matches ? `${data.pending_matches} ${t('pendingReview')}` : t('noPendingMatches')}
          testId="stat-matches"
        />
        <StatCard
          icon={CheckCircle}
          label={t('recovered')}
          value={data?.recovered ?? 0}
          sub={data?.accepted_matches ? `${data.accepted_matches} ${t('accepted')}` : null}
          testId="stat-recovered"
        />
        <StatCard
          icon={TrendingUp}
          label={t('recoveryRate')}
          value={`${data?.recovery_rate ?? 0}%`}
          sub={data?.total_items ? `of ${data.total_items} items` : null}
          testId="stat-recovery-rate"
        />
      </div>

      {/* Two columns: recent items + recent matches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        {/* Recent items */}
        <div data-testid="recent-items" className="bg-white rounded-2xl border border-zinc-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] font-bold text-zinc-900">{t('recentItems')}</p>
            <button
              data-testid="view-all-items-btn"
              onClick={() => navigate('/items')}
              className="text-[11px] font-medium text-zinc-400 hover:text-zinc-600 flex items-center gap-1 transition"
            >
              {t('viewAll')} <ArrowRight size={12} />
            </button>
          </div>

          {!data?.recent_items?.length ? (
            <div className="text-center py-8">
              <Package size={20} className="text-zinc-200 mx-auto mb-2" />
              <p className="text-[12px] text-zinc-400">{t('noItemsRegistered')}</p>
              <button
                onClick={() => navigate('/items/new')}
                className="mt-3 text-[12px] font-semibold text-zinc-900 hover:underline"
              >
                {t('registerFirstItem')}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {data.recent_items.map((item) => (
                <div key={item.item_id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-50 transition">
                  {item.photos?.length > 0 ? (
                    <img src={photoUrl(item.photos[0])} alt="" className="w-9 h-9 rounded-lg object-cover bg-zinc-100 flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
                      <Package size={14} className="text-zinc-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-zinc-800 truncate">{item.title}</p>
                    <p className="text-[11px] text-zinc-400 capitalize">{item.category}</p>
                  </div>
                  <span className="text-[10px] text-zinc-300 flex-shrink-0">{timeAgo(item.created_at, t)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent matches */}
        <div data-testid="recent-matches" className="bg-white rounded-2xl border border-zinc-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] font-bold text-zinc-900">{t('recentMatches')}</p>
            <button
              data-testid="view-all-matches-btn"
              onClick={() => navigate('/matches')}
              className="text-[11px] font-medium text-zinc-400 hover:text-zinc-600 flex items-center gap-1 transition"
            >
              {t('viewAll')} <ArrowRight size={12} />
            </button>
          </div>

          {!data?.recent_matches?.length ? (
            <div className="text-center py-8">
              <Sparkles size={20} className="text-zinc-200 mx-auto mb-2" />
              <p className="text-[12px] text-zinc-400">{t('noMatchesFound')}</p>
              <p className="text-[11px] text-zinc-300 mt-1">{t('matchesAppearAutomatically')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.recent_matches.map((m) => (
                <button
                  key={m.match_id}
                  onClick={() => navigate(`/matches/${m.found_item_id}`)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-50 transition text-left"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[m.status] || 'bg-zinc-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-zinc-800 truncate">
                      {m.found_title} <span className="text-zinc-300 font-normal">↔</span> {m.lost_title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-zinc-400">{STATUS_LABEL[m.status] || m.status}</span>
                      {m.score != null && (
                        <span className="text-[11px] text-zinc-300">· {m.score <= 1 ? Math.round(m.score * 100) : Math.round(m.score)}{t('matchPct')}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-300 flex-shrink-0">{timeAgo(m.created_at, t)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick tip */}
      {data?.total_items === 0 && (
        <div className="mt-6 bg-zinc-50 rounded-2xl border border-zinc-100 p-5">
          <p className="text-[13px] font-semibold text-zinc-800 mb-1">{t('gettingStarted')}</p>
          <p className="text-[12px] text-zinc-500">{t('gettingStartedDescription')}</p>
        </div>
      )}
    </div>
  );
}
