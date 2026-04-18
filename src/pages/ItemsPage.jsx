import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package } from 'lucide-react';
import api from '../api';
import { useI18n } from '../contexts/I18nContext';

const STATUS_COLORS = {
  active:    'bg-emerald-50 text-emerald-700',
  recovered: 'bg-slate-100 text-slate-600',
  returned:  'bg-slate-100 text-slate-600',
  expired:   'bg-slate-100 text-slate-500',
};

const PAGE_SIZE = 30;

export default function ItemsPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState('active');
  const [eventFilter, setEventFilter] = useState('');
  const [events, setEvents] = useState([]);

  const FILTERS = [
    { key: 'active', labelKey: 'filterActive', params: { status: 'active' } },
    { key: 'all',    labelKey: 'filterAll',    params: {} },
  ];

  const fetchItems = useCallback(async (filterKey, offset = 0, evtId = '') => {
    const f = FILTERS.find(f => f.key === filterKey) || FILTERS[0];
    const params = { ...f.params, limit: PAGE_SIZE, offset };
    if (evtId) params.event_id = evtId;
    const res = await api.get('/business/items', { params });
    return res.data;
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/business/events', { params: { status: 'active' } }).catch(() => ({ data: { events: [] } })),
      fetchItems(filter, 0, eventFilter),
    ]).then(([eventsRes, itemsData]) => {
      setEvents(eventsRes.data.events || []);
      setItems(itemsData.items);
      setTotal(itemsData.total);
    }).catch(() => {}).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchItems(filter, 0, eventFilter)
      .then(data => { setItems(data.items); setTotal(data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter, eventFilter, fetchItems]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await fetchItems(filter, items.length, eventFilter);
      setItems(prev => [...prev, ...data.items]);
    } catch {}
    setLoadingMore(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 data-testid="items-heading" className="text-2xl font-semibold text-slate-900">{t('navFoundItems')}</h1>
          <p data-testid="items-count" className="text-sm text-slate-500 mt-1">
            {total} items{filter !== 'all' ? ` (${filter})` : ''}
          </p>
        </div>
        <button
          data-testid="new-item-btn"
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 transition-colors"
          onClick={() => navigate('/items/new')}
        >
          <Plus size={15} />
          {t('newItem')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex gap-1 bg-slate-50 rounded-lg p-0.5 w-fit">
          {FILTERS.map(f => (
            <button
              key={f.key}
              data-testid={`filter-${f.key}`}
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
        {events.length > 0 && (
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="h-9 px-3 bg-white border border-slate-300 rounded-md text-sm text-slate-700 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
          >
            <option value="">{t('evtAllEvents')}</option>
            {events.map(evt => (
              <option key={evt.event_id} value={evt.event_id}>{evt.name}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div data-testid="items-empty" className="flex flex-col items-center justify-center py-20 text-center">
          <Package size={32} className="text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-900">
            {filter === 'active' ? t('noActiveItems') : t('noItemsYet')}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {filter === 'active' ? t('allItemsRecovered') : t('startRegistering')}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table data-testid="items-table" className="w-full">
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
                  <tr key={item.item_id} data-testid={`item-row-${item.item_id}`} className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate(`/items/${item.item_id}`)}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {item.photos?.[0] ? (
                          <img src={item.photos[0]} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <Package size={14} className="text-slate-300" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-900 line-clamp-1">{item.title}</p>
                          <p className="text-xs text-slate-500 line-clamp-1">{item.address || '—'}</p>
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
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLORS[item.status] || 'bg-slate-100 text-slate-500'}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {items.length < total && (
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
                `${t('loadMore')} · ${total - items.length} ${t('remaining')}`
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
