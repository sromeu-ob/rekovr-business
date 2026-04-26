import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package, IdCard, UserCheck, Search, X, SlidersHorizontal, Bell } from 'lucide-react';
import api from '../api';
import { useI18n } from '../contexts/I18nContext';

const STATUS_COLORS = {
  active:    'bg-emerald-50 text-emerald-700',
  recovered: 'bg-slate-100 text-slate-600',
  returned:  'bg-slate-100 text-slate-600',
  expired:   'bg-slate-100 text-slate-500',
};

const STATUSES = ['active', 'recovered', 'returned', 'expired'];

const CATEGORIES = [
  'electronics', 'documents', 'clothing', 'keys', 'bags',
  'jewelry', 'pets', 'sports', 'toys', 'accessories', 'other',
];

const PAGE_SIZE = 30;

const toLocalYMD = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function ItemsPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [events, setEvents] = useState([]);

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [identifiedOnly, setIdentifiedOnly] = useState(false);
  const [pendingMatchesOnly, setPendingMatchesOnly] = useState(false);
  const [eventFilter, setEventFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [datePreset, setDatePreset] = useState('');

  // UI
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef(null);

  const fetchItems = useCallback(async (offset = 0, opts) => {
    const { statuses, categories, identified, pending, evtId, q, dFrom, dTo } = opts;
    const params = { limit: PAGE_SIZE, offset };
    if (statuses.length > 0) params.status = statuses.join(',');
    if (categories.length > 0) params.category = categories.join(',');
    if (identified) params.identified_only = true;
    if (pending) params.has_pending_matches = true;
    if (evtId) params.event_id = evtId;
    if (q) params.q = q;
    if (dFrom) params.date_from = new Date(`${dFrom}T00:00:00`).toISOString();
    if (dTo) params.date_to = new Date(`${dTo}T23:59:59.999`).toISOString();
    const res = await api.get('/business/items', { params });
    return res.data;
  }, []);

  const filterOpts = useMemo(() => ({
    statuses: selectedStatuses,
    categories: selectedCategories,
    identified: identifiedOnly,
    pending: pendingMatchesOnly,
    evtId: eventFilter,
    q: search,
    dFrom: dateFrom,
    dTo: dateTo,
  }), [selectedStatuses, selectedCategories, identifiedOnly, pendingMatchesOnly, eventFilter, search, dateFrom, dateTo]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/business/events', { params: { status: 'active' } }).catch(() => ({ data: { events: [] } })),
      fetchItems(0, filterOpts),
    ]).then(([eventsRes, itemsData]) => {
      setEvents(eventsRes.data.events || []);
      setItems(itemsData.items);
      setTotal(itemsData.total);
    }).catch(() => {}).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchItems(0, filterOpts)
      .then(data => { setItems(data.items); setTotal(data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filterOpts, fetchItems]);

  // Debounce search input → search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Close filters popover on outside click
  useEffect(() => {
    if (!filtersOpen) return;
    const onClick = (e) => {
      if (filtersRef.current && !filtersRef.current.contains(e.target)) {
        setFiltersOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [filtersOpen]);

  const toggleInArray = (setter) => (val) => {
    setter(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };
  const toggleStatus = toggleInArray(setSelectedStatuses);
  const toggleCategory = toggleInArray(setSelectedCategories);

  const applyDatePreset = (preset) => {
    const now = new Date();
    let start = new Date(now);
    if (preset === '7d') start.setDate(start.getDate() - 6);
    else if (preset === '30d') start.setDate(start.getDate() - 29);
    else if (preset !== 'today') return;
    setDatePreset(preset);
    setDateFrom(toLocalYMD(start));
    setDateTo(toLocalYMD(now));
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
  };

  // Active filter count for the badge (search excluded — it has its own input)
  const activeCount = useMemo(() => {
    let n = 0;
    if (selectedStatuses.length > 0) n += 1;
    if (selectedCategories.length > 0) n += 1;
    if (identifiedOnly) n += 1;
    if (pendingMatchesOnly) n += 1;
    if (eventFilter) n += 1;
    if (datePreset) n += 1;
    return n;
  }, [selectedStatuses, selectedCategories, identifiedOnly, pendingMatchesOnly, eventFilter, datePreset]);

  const clearAll = () => {
    setSelectedStatuses([]);
    setSelectedCategories([]);
    setIdentifiedOnly(false);
    setPendingMatchesOnly(false);
    setEventFilter('');
    clearDates();
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await fetchItems(items.length, filterOpts);
      setItems(prev => [...prev, ...data.items]);
    } catch {}
    setLoadingMore(false);
  };

  // Active chips
  const chips = [];
  if (selectedStatuses.length > 0) {
    chips.push({
      key: 'status',
      label: selectedStatuses.length === 1
        ? `${t('chipStatus')}: ${t(`status_${selectedStatuses[0]}`)}`
        : `${t('chipStatus')} · ${selectedStatuses.length}`,
      onRemove: () => setSelectedStatuses([]),
    });
  }
  if (selectedCategories.length > 0) {
    chips.push({
      key: 'category',
      label: selectedCategories.length === 1
        ? `${t('chipCategory')}: ${t(`cat_${selectedCategories[0]}`)}`
        : `${t('chipCategory')} · ${selectedCategories.length}`,
      onRemove: () => setSelectedCategories([]),
    });
  }
  if (datePreset) {
    let label = t('chipDates');
    if (datePreset === 'today') label = t('dateToday');
    else if (datePreset === '7d') label = t('date7d');
    else if (datePreset === '30d') label = t('date30d');
    else if (datePreset === 'custom' && (dateFrom || dateTo)) {
      const fmt = (ymd) => ymd ? new Date(`${ymd}T00:00:00`).toLocaleDateString() : '…';
      label = `${fmt(dateFrom)} – ${fmt(dateTo)}`;
    }
    chips.push({ key: 'dates', label, onRemove: clearDates });
  }
  if (identifiedOnly) {
    chips.push({ key: 'identified', label: t('filterIdentified'), onRemove: () => setIdentifiedOnly(false) });
  }
  if (pendingMatchesOnly) {
    chips.push({ key: 'pending', label: t('chipPendingMatches'), onRemove: () => setPendingMatchesOnly(false) });
  }
  if (eventFilter) {
    const evt = events.find(e => e.event_id === eventFilter);
    chips.push({ key: 'event', label: evt ? evt.name : t('chipEvent'), onRemove: () => setEventFilter('') });
  }

  const isEmpty = items.length === 0;
  const noFiltersApplied = activeCount === 0 && !search;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 data-testid="items-heading" className="text-2xl font-semibold text-slate-900">{t('navFoundItems')}</h1>
          <p data-testid="items-count" className="text-sm text-slate-500 mt-1">
            {total} items
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

      {/* Primary bar: search + filters trigger */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            data-testid="items-search"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('searchItemsPlaceholder')}
            className="h-9 pl-8 pr-8 w-full bg-white border border-slate-300 rounded-md text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
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

        <div className="relative" ref={filtersRef}>
          <button
            data-testid="filters-btn"
            type="button"
            onClick={() => setFiltersOpen(o => !o)}
            className={`inline-flex items-center gap-1.5 h-9 px-3 text-sm font-medium rounded-md border transition-colors ${
              activeCount > 0
                ? 'bg-teal-50 border-teal-200 text-teal-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal size={14} />
            {t('filters')}
            {activeCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-teal-600 text-white text-[11px] font-semibold">
                {activeCount}
              </span>
            )}
          </button>

          {filtersOpen && (
            <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-[80vh] overflow-auto">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
                <span className="text-sm font-semibold text-slate-900">{t('filters')}</span>
                {activeCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-xs font-medium text-slate-500 hover:text-slate-700"
                  >
                    {t('clearAll')}
                  </button>
                )}
              </div>

              {/* Status */}
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-2">{t('chipStatus')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {STATUSES.map(s => {
                    const checked = selectedStatuses.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleStatus(s)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                          checked
                            ? 'bg-teal-50 border-teal-300 text-teal-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {t(`status_${s}`)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category */}
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-2">{t('chipCategory')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map(cat => {
                    const checked = selectedCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                          checked
                            ? 'bg-teal-50 border-teal-300 text-teal-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {t(`cat_${cat}`)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dates */}
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-2">{t('chipDates')}</p>
                <div className="flex gap-1.5 mb-2">
                  {['today', '7d', '30d'].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => applyDatePreset(preset)}
                      className={`flex-1 px-2 py-1 text-xs font-medium rounded-md border transition-colors ${
                        datePreset === preset
                          ? 'bg-teal-50 border-teal-300 text-teal-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t(preset === 'today' ? 'dateToday' : preset === '7d' ? 'date7d' : 'date30d')}
                    </button>
                  ))}
                </div>
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

              {/* Identified */}
              <div className="px-4 py-3 border-b border-slate-100">
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <IdCard size={14} className="text-slate-400" />
                    {t('filterIdentified')}
                  </span>
                  <input
                    type="checkbox"
                    checked={identifiedOnly}
                    onChange={(e) => setIdentifiedOnly(e.target.checked)}
                    className="w-4 h-4 accent-teal-600"
                  />
                </label>
              </div>

              {/* Pending matches */}
              <div className="px-4 py-3 border-b border-slate-100">
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <Bell size={14} className="text-slate-400" />
                    {t('filterPendingMatches')}
                  </span>
                  <input
                    type="checkbox"
                    checked={pendingMatchesOnly}
                    onChange={(e) => setPendingMatchesOnly(e.target.checked)}
                    className="w-4 h-4 accent-teal-600"
                  />
                </label>
              </div>

              {/* Event (only if any exists) */}
              {events.length > 0 && (
                <div className="px-4 py-3">
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-2">{t('chipEvent')}</p>
                  <select
                    value={eventFilter}
                    onChange={(e) => setEventFilter(e.target.value)}
                    className="w-full h-9 px-2 bg-white border border-slate-300 rounded-md text-sm text-slate-700 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                  >
                    <option value="">{t('evtAllEvents')}</option>
                    {events.map(evt => (
                      <option key={evt.event_id} value={evt.event_id}>{evt.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Active filter chips */}
      {chips.length > 0 && (
        <div className="flex items-center flex-wrap gap-1.5 mb-6">
          {chips.map(chip => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.onRemove}
              className="inline-flex items-center gap-1.5 h-7 pl-2.5 pr-2 text-xs font-medium rounded-md bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition-colors"
            >
              {chip.label}
              <X size={12} className="opacity-70" />
            </button>
          ))}
          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-medium text-slate-500 hover:text-slate-700 ml-1"
            >
              {t('clearAll')}
            </button>
          )}
        </div>
      )}
      {chips.length === 0 && <div className="mb-6" />}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
        </div>
      ) : isEmpty ? (
        <div data-testid="items-empty" className="flex flex-col items-center justify-center py-20 text-center">
          <Package size={32} className="text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-900">
            {noFiltersApplied ? t('noItemsYet') : t('noItemsMatching')}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {noFiltersApplied ? t('startRegistering') : t('tryAdjustFilters')}
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
