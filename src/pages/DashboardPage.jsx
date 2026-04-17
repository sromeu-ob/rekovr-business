import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, GitCompare, CheckCircle, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';
import api, { photoUrl } from '../api';
import { useI18n } from '../contexts/I18nContext';

function StatCard({ icon: Icon, label, value, sub, testId }) {
  return (
    <div data-testid={testId} className="bg-white rounded-lg border border-stone-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">{label}</span>
        <Icon size={15} className="text-stone-400" />
      </div>
      <p className="text-3xl font-semibold text-stone-900 leading-none tabular-nums">{value ?? '—'}</p>
      {sub && <p className="text-xs text-stone-500 mt-2">{sub}</p>}
    </div>
  );
}

const STATUS_DOT = {
  pending_verification: 'bg-amber-400',
  pending_review:       'bg-amber-400',
  pending:              'bg-amber-400',
  accepted:             'bg-emerald-500',
  recovered:            'bg-emerald-500',
  paid:                 'bg-emerald-500',
  rejected:             'bg-red-400',
  dismissed:            'bg-stone-300',
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
        <div className="w-5 h-5 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
      </div>
    );
  }

  const STATUS_LABEL = {
    pending_verification: t('statusVerification'),
    pending_review:       t('statusUnderReview'),
    pending:              t('statusPending'),
    accepted:             t('statusAccepted'),
    rejected:             t('statusRejected'),
    dismissed:            t('statusDismissed'),
    recovered:            t('statusRecovered'),
    paid:                 t('statusPaid'),
  };

  const orgName = auth?.organization?.name || 'Your organization';

  return (
    <div>

      {/* Page header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 data-testid="dashboard-heading" className="text-2xl font-semibold text-stone-900">
            {t('dashboard')}
          </h1>
          <p className="text-sm text-stone-500 mt-1">{orgName}</p>
        </div>
        {events.length > 0 && (
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="h-9 px-3 bg-white border border-stone-300 rounded-md text-sm text-stone-700 outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors flex-shrink-0"
          >
            <option value="">{t('evtAllEvents')}</option>
            {events.map(evt => (
              <option key={evt.event_id} value={evt.event_id}>{evt.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Package}
          label={t('foundItems')}
          value={data?.total_items ?? 0}
          sub={data?.items_this_week ? `+${data.items_this_week} ${t('thisWeek')}` : t('noNewItemsThisWeek')}
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
          sub={data?.total_items ? `${t('of')} ${data.total_items} ${t('items')}` : null}
          testId="stat-recovery-rate"
        />
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">

        {/* Recent items */}
        <div data-testid="recent-items" className="bg-white rounded-lg border border-stone-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
            <p className="text-sm font-medium text-stone-900">{t('recentItems')}</p>
            <button
              data-testid="view-all-items-btn"
              onClick={() => navigate('/items')}
              className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 transition-colors"
            >
              {t('viewAll')} <ArrowRight size={12} />
            </button>
          </div>

          {!data?.recent_items?.length ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <Package size={32} className="text-stone-300 mb-3" />
              <p className="text-sm font-medium text-stone-900">{t('noItemsRegistered')}</p>
              <p className="text-sm text-stone-500 mt-1 mb-4">{t('registerFirstItemDesc')}</p>
              <button
                onClick={() => navigate('/items/new')}
                className="px-4 py-2 rounded-md bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors"
              >
                {t('registerFirstItem')}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {data.recent_items.map((item) => (
                <div
                  key={item.item_id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-stone-50 transition-colors"
                >
                  {item.photos?.length > 0 ? (
                    <img
                      src={photoUrl(item.photos[0])}
                      alt=""
                      className="w-8 h-8 rounded-md object-cover bg-stone-100 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-md bg-stone-100 flex items-center justify-center flex-shrink-0">
                      <Package size={13} className="text-stone-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">{item.title}</p>
                    <p className="text-xs text-stone-500 capitalize">{item.category}</p>
                  </div>
                  <span className="text-xs text-stone-400 flex-shrink-0">{timeAgo(item.created_at, t)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent matches */}
        <div data-testid="recent-matches" className="bg-white rounded-lg border border-stone-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
            <p className="text-sm font-medium text-stone-900">{t('recentMatches')}</p>
            <button
              data-testid="view-all-matches-btn"
              onClick={() => navigate('/matches')}
              className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 transition-colors"
            >
              {t('viewAll')} <ArrowRight size={12} />
            </button>
          </div>

          {!data?.recent_matches?.length ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <Sparkles size={32} className="text-stone-300 mb-3" />
              <p className="text-sm font-medium text-stone-900">{t('noMatchesFound')}</p>
              <p className="text-sm text-stone-500 mt-1">{t('matchesAppearAutomatically')}</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {data.recent_matches.map((m) => (
                <button
                  key={m.match_id}
                  onClick={() => navigate(`/matches/${m.found_item_id}`)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-stone-50 transition-colors text-left"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${STATUS_DOT[m.status] || 'bg-stone-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">
                      {m.found_title}
                      <span className="text-stone-400 font-normal mx-1">·</span>
                      {m.lost_title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-stone-500">{STATUS_LABEL[m.status] || m.status}</span>
                      {m.score != null && (
                        <span className="text-xs text-stone-400">
                          · {m.score <= 1 ? Math.round(m.score * 100) : Math.round(m.score)}{t('matchPct')}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-stone-400 flex-shrink-0">{timeAgo(m.created_at, t)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Getting started */}
      {data?.total_items === 0 && (
        <div className="mt-6 bg-stone-50 rounded-lg px-6 py-5">
          <p className="text-sm font-medium text-stone-900 mb-1">{t('gettingStarted')}</p>
          <p className="text-sm text-stone-500">{t('gettingStartedDescription')}</p>
        </div>
      )}

    </div>
  );
}
