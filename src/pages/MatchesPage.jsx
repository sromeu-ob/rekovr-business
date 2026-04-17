import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitCompare, ChevronRight, Package } from 'lucide-react';
import api, { photoUrl } from '../api';
import { useI18n } from '../contexts/I18nContext';

export default function MatchesPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  const FILTERS = [
    { key: 'pending', labelKey: 'filterWithPending' },
    { key: 'all',     labelKey: 'filterAll' },
  ];

  useEffect(() => {
    api.get('/business/items/matches/summary')
      .then(res => setAllItems(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const items = filter === 'pending'
    ? allItems.filter(i => (i.match_pending || 0) > 0)
    : allItems;

  const totalPending = allItems.reduce((s, i) => s + (i.match_pending || 0), 0);

  return (
    <div>
      <div className="mb-8">
        <h1 data-testid="matches-heading" className="text-2xl font-semibold text-zinc-900">{t('navMatches')}</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {allItems.length} {t('itemsWithMatches')}{totalPending > 0 && ` · ${totalPending} ${t('pendingReviewCount')}`}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-1 bg-zinc-100 rounded-md p-0.5 w-fit mb-6">
        {FILTERS.map(f => (
          <button
            key={f.key}
            data-testid={`filter-${f.key}`}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === f.key
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div data-testid="matches-empty" className="flex flex-col items-center justify-center py-20 text-center">
          <GitCompare size={32} className="text-zinc-300 mb-3" />
          <p className="text-sm font-medium text-zinc-900">
            {filter === 'pending' ? t('noPendingMatches') : t('noMatchesYet')}
          </p>
          <p className="text-sm text-zinc-500 mt-1 max-w-xs">
            {filter === 'pending' ? t('noPendingMatchesDesc') : t('noMatchesYetDesc')}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.item_id}
              data-testid={`match-item-${item.item_id}`}
              onClick={() => navigate(`/matches/${item.item_id}`)}
              className="w-full flex items-center gap-4 p-4 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors text-left"
            >
              {item.photos?.length > 0 ? (
                <img
                  src={photoUrl(item.photos[0])}
                  alt=""
                  className="w-12 h-12 rounded-md object-cover flex-shrink-0 bg-zinc-100"
                />
              ) : (
                <div className="w-12 h-12 rounded-md bg-zinc-100 flex items-center justify-center flex-shrink-0">
                  <Package size={18} className="text-zinc-400" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">{item.title}</p>
                <p className="text-xs text-zinc-500 capitalize">{item.category}</p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {item.match_pending > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-md text-xs font-medium">
                    {item.match_pending} {t('pending')}
                  </span>
                )}
                {item.match_accepted > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-medium">
                    {item.match_accepted} {t('accepted')}
                  </span>
                )}
                {item.best_score != null && (
                  <span className="text-xs text-zinc-400 hidden sm:inline">
                    {t('best')}: {item.best_score <= 1 ? Math.round(item.best_score * 100) : Math.round(item.best_score)}%
                  </span>
                )}
                <span className="text-xs font-medium text-zinc-400">
                  {item.match_total}
                </span>
                <ChevronRight size={15} className="text-zinc-300" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
