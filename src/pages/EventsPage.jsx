import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CalendarDays } from 'lucide-react';
import api from '../api';
import { useI18n } from '../contexts/I18nContext';

const STATUS_COLORS = {
  active:    'bg-emerald-50 text-emerald-700',
  completed: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-slate-100 text-slate-400',
};

const PAGE_SIZE = 30;

export default function EventsPage({ auth }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const isAdmin = auth?.org_role === 'admin';
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState('active');

  const FILTERS = [
    { key: 'active',    labelKey: 'filterActive',    params: { status: 'active' } },
    { key: 'completed', labelKey: 'evtFilterCompleted', params: { status: 'completed' } },
    { key: 'all',       labelKey: 'filterAll',       params: {} },
  ];

  const fetchEvents = useCallback(async (filterKey, offset = 0) => {
    const f = FILTERS.find(f => f.key === filterKey) || FILTERS[0];
    const res = await api.get('/business/events', {
      params: { ...f.params, limit: PAGE_SIZE, offset },
    });
    return res.data;
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchEvents(filter)
      .then(data => { setEvents(data.events); setTotal(data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter, fetchEvents]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await fetchEvents(filter, events.length);
      setEvents(prev => [...prev, ...data.events]);
    } catch {}
    setLoadingMore(false);
  };

  const formatDateRange = (start, end) => {
    try {
      const s = new Date(start);
      const e = new Date(end);
      const opts = { day: 'numeric', month: 'short', year: 'numeric' };
      return `${s.toLocaleDateString(undefined, opts)} — ${e.toLocaleDateString(undefined, opts)}`;
    } catch {
      return '—';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{t('navEvents')}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {total} {total === 1 ? t('evtEvent') : t('evtEvents')}{filter !== 'all' ? ` (${t(FILTERS.find(f => f.key === filter)?.labelKey || '')})` : ''}
          </p>
        </div>
        {isAdmin && (
          <button
            className="flex items-center gap-2 px-4 py-2 btn-brand text-white rounded-md text-sm font-medium transition-colors"
            onClick={() => navigate('/events/new')}
          >
            <Plus size={15} />
            {t('evtNewEvent')}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-1 bg-slate-100 rounded-md p-0.5 w-fit mb-6">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === f.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CalendarDays size={32} className="text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-900">
            {filter === 'active' ? t('evtNoActiveEvents') : t('evtNoEvents')}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {t('evtNoEventsDesc')}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{t('evtColName')}</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden sm:table-cell">{t('evtColDates')}</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">{t('evtColLocation')}</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{t('evtColItems')}</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{t('colStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr
                    key={event.event_id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/events/${event.event_id}`)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <CalendarDays size={13} className="text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-900 line-clamp-1">{event.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className="text-sm text-slate-500">{formatDateRange(event.start_date, event.end_date)}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-sm text-slate-500">{event.location || '—'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-slate-500">{event.item_count ?? 0}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLORS[event.status] || 'bg-slate-100 text-slate-500'}`}>
                        {event.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {events.length < total && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full mt-4 py-2.5 text-sm font-medium text-slate-500 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {loadingMore ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                </span>
              ) : (
                `${t('loadMore')} · ${total - events.length} ${t('remaining')}`
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
