import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package, IdCard, UserCheck, Search, X, Tag, Check, ChevronDown, Calendar } from 'lucide-react';
import api from '../api';
import { useI18n } from '../contexts/I18nContext';

const STATUS_COLORS = {
  active:    'bg-emerald-50 text-emerald-700',
  recovered: 'bg-slate-100 text-slate-600',
  returned:  'bg-slate-100 text-slate-600',
  expired:   'bg-slate-100 text-slate-500',
};

const CATEGORIES = [
  'electronics', 'documents', 'clothing', 'keys', 'bags',
  'jewelry', 'pets', 'sports', 'toys', 'accessories', 'other',
];

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
  const [identifiedOnly, setIdentifiedOnly] = useState(false);
  const [events, setEvents] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const catMenuRef = useRef(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [datePreset, setDatePreset] = useState('');
  const [dateMenuOpen, setDateMenuOpen] = useState(false);
  const dateMenuRef = useRef(null);

  const FILTERS = [
    { key: 'active', labelKey: 'filterActive', params: { status: 'active' } },
    { key: 'all',    labelKey: 'filterAll',    params: {} },
  ];

  const fetchItems = useCallback(async (filterKey, offset = 0, evtId = '', identified = false, q = '', categories = [], dFrom = '', dTo = '') => {
    const f = FILTERS.find(f => f.key === filterKey) || FILTERS[0];
    const params = { ...f.params, limit: PAGE_SIZE, offset };
    if (evtId) params.event_id = evtId;
    if (identified) params.identified_only = true;
    if (q) params.q = q;
    if (categories.length > 0) params.category = categories.join(',');
    // dFrom/dTo are YYYY-MM-DD (local). Convert to local-tz ISO bounds:
    // start of day for date_from, end of day for date_to.
    if (dFrom) params.date_from = new Date(`${dFrom}T00:00:00`).toISOString();
    if (dTo) params.date_to = new Date(`${dTo}T23:59:59.999`).toISOString();
    const res = await api.get('/business/items', { params });
    return res.data;
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/business/events', { params: { status: 'active' } }).catch(() => ({ data: { events: [] } })),
      fetchItems(filter, 0, eventFilter, identifiedOnly, search, selectedCategories, dateFrom, dateTo),
    ]).then(([eventsRes, itemsData]) => {
      setEvents(eventsRes.data.events || []);
      setItems(itemsData.items);
      setTotal(itemsData.total);
    }).catch(() => {}).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchItems(filter, 0, eventFilter, identifiedOnly, search, selectedCategories, dateFrom, dateTo)
      .then(data => { setItems(data.items); setTotal(data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter, eventFilter, identifiedOnly, search, selectedCategories, dateFrom, dateTo, fetchItems]);

  // Debounce search input → search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Close category menu on outside click
  useEffect(() => {
    if (!catMenuOpen) return;
    const onClick = (e) => {
      if (catMenuRef.current && !catMenuRef.current.contains(e.target)) {
        setCatMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [catMenuOpen]);

  // Close date menu on outside click
  useEffect(() => {
    if (!dateMenuOpen) return;
    const onClick = (e) => {
      if (dateMenuRef.current && !dateMenuRef.current.contains(e.target)) {
        setDateMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [dateMenuOpen]);

  const toggleCategory = (cat) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // dateFrom / dateTo are stored as YYYY-MM-DD (local) to avoid TZ drift.
  // Conversion to ISO happens only when calling the API (in fetchItems).
  const toLocalYMD = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const applyDatePreset = (preset) => {
    const now = new Date();
    let start = new Date(now);
    if (preset === '7d') start.setDate(start.getDate() - 6);
    else if (preset === '30d') start.setDate(start.getDate() - 29);
    else if (preset !== 'today') return;
    setDatePreset(preset);
    setDateFrom(toLocalYMD(start));
    setDateTo(toLocalYMD(now));
    setDateMenuOpen(false);
  };

  const applyCustomDates = (from, to) => {
    setDatePreset('custom');
    setDateFrom(from || '');
    setDateTo(to || '');
  };

  const clearDates = () => {
    setDatePreset('');
    setDateFrom('');
    setDateTo('');
    setDateMenuOpen(false);
  };

  const dateLabel = () => {
    if (datePreset === 'today') return t('dateToday');
    if (datePreset === '7d') return t('date7d');
    if (datePreset === '30d') return t('date30d');
    if (datePreset === 'custom' && (dateFrom || dateTo)) {
      const fmt = (ymd) => ymd ? new Date(`${ymd}T00:00:00`).toLocaleDateString() : '…';
      return `${fmt(dateFrom)} – ${fmt(dateTo)}`;
    }
    return t('filterDates');
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await fetchItems(filter, items.length, eventFilter, identifiedOnly, search, selectedCategories, dateFrom, dateTo);
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
          className="flex items-center gap-2 px-4 py-2 btn-brand text-white rounded-md text-sm font-medium transition-colors"
          onClick={() => navigate('/items/new')}
        >
          <Plus size={15} />
          {t('newItem')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            data-testid="items-search"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('searchItemsPlaceholder')}
            className="h-9 pl-8 pr-8 w-64 bg-white border border-slate-300 rounded-md text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
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
        <button
          data-testid="filter-identified"
          onClick={() => setIdentifiedOnly(v => !v)}
          className={`inline-flex items-center gap-1.5 h-9 px-3 text-sm font-medium rounded-md border transition-colors ${
            identifiedOnly
              ? 'bg-teal-50 border-teal-200 text-teal-700'
              : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'
          }`}
        >
          <IdCard size={14} />
          {t('filterIdentified')}
        </button>

        {/* Category multi-select */}
        <div className="relative" ref={catMenuRef}>
          <button
            data-testid="filter-category"
            type="button"
            onClick={() => setCatMenuOpen(o => !o)}
            className={`inline-flex items-center gap-1.5 h-9 px-3 text-sm font-medium rounded-md border transition-colors ${
              selectedCategories.length > 0
                ? 'bg-teal-50 border-teal-200 text-teal-700'
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'
            }`}
          >
            <Tag size={14} />
            {selectedCategories.length === 0
              ? t('filterCategory')
              : selectedCategories.length === 1
                ? t(`cat_${selectedCategories[0]}`)
                : `${t('filterCategory')} · ${selectedCategories.length}`}
            <ChevronDown size={13} className="opacity-60" />
          </button>
          {catMenuOpen && (
            <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-md shadow-lg z-10 py-1 max-h-80 overflow-auto">
              {selectedCategories.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedCategories([])}
                  className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 border-b border-slate-100"
                >
                  {t('clearAll')}
                </button>
              )}
              {CATEGORIES.map(cat => {
                const checked = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <span>{t(`cat_${cat}`)}</span>
                    {checked && <Check size={14} className="text-teal-600" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Date range */}
        <div className="relative" ref={dateMenuRef}>
          <button
            data-testid="filter-dates"
            type="button"
            onClick={() => setDateMenuOpen(o => !o)}
            className={`inline-flex items-center gap-1.5 h-9 px-3 text-sm font-medium rounded-md border transition-colors ${
              datePreset
                ? 'bg-teal-50 border-teal-200 text-teal-700'
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'
            }`}
          >
            <Calendar size={14} />
            {dateLabel()}
            <ChevronDown size={13} className="opacity-60" />
          </button>
          {dateMenuOpen && (
            <div className="absolute left-0 top-full mt-1 w-72 bg-white border border-slate-200 rounded-md shadow-lg z-10 p-2">
              <div className="flex gap-1 mb-2">
                {['today', '7d', '30d'].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => applyDatePreset(preset)}
                    className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                      datePreset === preset
                        ? 'bg-teal-50 border-teal-200 text-teal-700'
                        : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {t(preset === 'today' ? 'dateToday' : preset === '7d' ? 'date7d' : 'date30d')}
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-100 pt-2">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1.5 px-1">{t('dateCustom')}</p>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => applyCustomDates(e.target.value, dateTo)}
                    className="flex-1 h-8 px-2 bg-white border border-slate-300 rounded text-xs text-slate-700 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                  <span className="text-slate-400 text-xs">–</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => applyCustomDates(dateFrom, e.target.value)}
                    className="flex-1 h-8 px-2 bg-white border border-slate-300 rounded text-xs text-slate-700 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>
              {datePreset && (
                <button
                  type="button"
                  onClick={clearDates}
                  className="w-full mt-2 px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 rounded border border-slate-200"
                >
                  {t('clearAll')}
                </button>
              )}
            </div>
          )}
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
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-slate-900 line-clamp-1">{item.title}</p>
                            {item.identified_owner && (
                              <span
                                title={item.identified_owner.owner_name || ''}
                                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  item.identified_owner.matched_user_id
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-amber-50 text-amber-700'
                                }`}
                              >
                                {item.identified_owner.matched_user_id ? <UserCheck size={10} /> : <IdCard size={10} />}
                                {item.identified_owner.doc_number_masked || t('identifiedOwner')}
                              </span>
                            )}
                          </div>
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
