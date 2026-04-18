import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Package, GitCompare, CheckCircle, TrendingUp, Pencil } from 'lucide-react';
import api, { photoUrl } from '../api';
import { useI18n } from '../contexts/I18nContext';

const STATUS_COLORS = {
  active:    'bg-emerald-50 text-emerald-700',
  completed: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-slate-100 text-slate-400',
};

const ITEM_STATUS_COLORS = {
  active:    'bg-emerald-50 text-emerald-700',
  recovered: 'bg-slate-100 text-slate-600',
  returned:  'bg-slate-100 text-slate-600',
  expired:   'bg-slate-100 text-slate-400',
};

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
        <Icon size={15} className="text-slate-400" />
      </div>
      <p className="text-3xl font-semibold text-slate-900 leading-none tabular-nums">{value ?? '—'}</p>
      {sub && <p className="text-xs text-slate-400 mt-1.5">{sub}</p>}
    </div>
  );
}

export default function EventDetailPage({ auth }) {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const isAdmin = auth?.org_role === 'admin';

  const [event, setEvent] = useState(null);
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/business/events/${eventId}`),
      api.get(`/business/events/${eventId}/stats`),
      api.get('/business/items', { params: { event_id: eventId, limit: 50 } }),
    ])
      .then(([evtRes, statsRes, itemsRes]) => {
        setEvent(evtRes.data);
        setStats(statsRes.data);
        setItems(itemsRes.data.items || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm font-medium text-slate-700">{t('evtNotFound')}</p>
        <button onClick={() => navigate('/events')} className="mt-3 text-xs font-medium text-slate-900 hover:underline">
          {t('evtBackToEvents')}
        </button>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return '—';
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/events')}
            className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft size={15} className="text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-semibold text-slate-900">{event.name}</h2>
              <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLORS[event.status] || 'bg-slate-100 text-slate-500'}`}>
                {event.status}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              {formatDate(event.start_date)} — {formatDate(event.end_date)}
              {event.location && <span> · {event.location}</span>}
            </p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => navigate(`/events/${eventId}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            <Pencil size={14} />
            {t('evtEditEvent')}
          </button>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={Package}
          label={t('foundItems')}
          value={stats?.total_items ?? 0}
        />
        <StatCard
          icon={GitCompare}
          label={t('navMatches')}
          value={stats?.total_matches ?? 0}
          sub={stats?.pending_matches ? `${stats.pending_matches} ${t('pendingReview')}` : null}
        />
        <StatCard
          icon={CheckCircle}
          label={t('recovered')}
          value={stats?.recovered ?? 0}
        />
        <StatCard
          icon={TrendingUp}
          label={t('recoveryRate')}
          value={`${stats?.recovery_rate ?? 0}%`}
        />
      </div>

      {/* Items table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100">
          <p className="text-sm font-medium text-slate-900">{t('evtEventItems')}</p>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package size={20} className="text-slate-300 mb-2" />
            <p className="text-xs text-slate-400">{t('evtNoItemsInEvent')}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{t('colItem')}</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{t('colCategory')}</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{t('colDate')}</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{t('colStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.item_id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/items/${item.item_id}`)}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {item.photos?.[0] ? (
                        <img src={photoUrl(item.photos[0])} alt="" className="w-9 h-9 rounded-md object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <Package size={14} className="text-slate-300" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-900 line-clamp-1">{item.title}</p>
                        <p className="text-xs text-slate-400 line-clamp-1">{item.address || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-slate-500 capitalize">{item.category || '—'}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-slate-500">
                      {item.date_time ? new Date(item.date_time).toLocaleDateString() : new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${ITEM_STATUS_COLORS[item.status] || 'bg-slate-100 text-slate-500'}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
