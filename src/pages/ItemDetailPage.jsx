import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Tag, Package, Sparkles, ChevronRight, Pencil } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import ImageViewer from '../components/ImageViewer';
import api, { photoUrl } from '../api';
import { useI18n } from '../contexts/I18nContext';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function ItemMap({ lng, lat }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !lng || !lat) return;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: 14,
      interactive: false,
    });
    new mapboxgl.Marker({ color: '#18181b' })
      .setLngLat([lng, lat])
      .addTo(map);
    return () => map.remove();
  }, [lng, lat]);

  return <div ref={containerRef} className="w-full h-44 rounded-lg overflow-hidden" />;
}

const getLocalizedReasoning = (match, lang) =>
  match?.[`reasoning_${lang}`] || match?.reasoning_en || match?.reasoning || '';

const MATCH_LIMIT = 10;
const ACTIVE_STATUSES = 'pending,pending_verification,pending_review';

const STATUS_STYLE = {
  active:    'bg-emerald-50 text-emerald-700',
  matched:   'bg-amber-50 text-amber-700',
  recovered: 'bg-zinc-100 text-zinc-600',
  returned:  'bg-zinc-100 text-zinc-600',
  archived:  'bg-zinc-100 text-zinc-400',
};

const MATCH_STATUS_STYLE = {
  pending_verification: 'bg-amber-50 text-amber-700',
  pending_review:       'bg-amber-50 text-amber-700',
  pending:   'bg-amber-50 text-amber-700',
  accepted:  'bg-zinc-100 text-zinc-600',
  rejected:  'bg-red-50 text-red-600',
  dismissed: 'bg-zinc-100 text-zinc-400',
  paid:      'bg-emerald-50 text-emerald-700',
  recovered: 'bg-emerald-50 text-emerald-700',
};

export default function ItemDetailPage() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { t, language } = useI18n();

  const MATCH_STATUS_LABEL = {
    pending_verification: t('statusVerification'),
    pending_review:       t('statusUnderReview'),
    pending:   t('statusPending'),
    accepted:  t('statusAccepted'),
    rejected:  t('statusRejected'),
    dismissed: t('statusDismissed'),
    paid:      t('statusPaid'),
    recovered: t('statusRecovered'),
  };

  const [item, setItem] = useState(null);
  const [matches, setMatches] = useState([]);
  const [matchTotal, setMatchTotal] = useState(0);
  const [matchFilter, setMatchFilter] = useState('active');
  const [matchOffset, setMatchOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewerIndex, setViewerIndex] = useState(null);

  const fetchMatches = async (filter, offset = 0, append = false) => {
    const params = { found_item_id: itemId, limit: MATCH_LIMIT, offset };
    if (filter === 'active') params.status = ACTIVE_STATUSES;
    const res = await api.get('/business/items/matches/list', { params });
    if (append) {
      setMatches(prev => [...prev, ...res.data.matches]);
    } else {
      setMatches(res.data.matches);
    }
    setMatchTotal(res.data.total);
    setMatchOffset(offset + res.data.matches.length);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemRes] = await Promise.all([
          api.get(`/business/items/${itemId}`),
          fetchMatches('active', 0),
        ]);
        setItem(itemRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [itemId]);

  const handleFilterChange = async (filter) => {
    setMatchFilter(filter);
    setLoadingMatches(true);
    try {
      await fetchMatches(filter, 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      await fetchMatches(matchFilter, matchOffset, true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-zinc-500">{t('itemNotFound')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-md bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition-colors"
        >
          <ArrowLeft size={16} className="text-zinc-600" />
        </button>
        <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600">
          {t('foundBadge')}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${STATUS_STYLE[item.status] || 'bg-zinc-100 text-zinc-400'}`}>
          {item.status}
        </span>
        <button
          onClick={() => navigate(`/items/${itemId}/edit`)}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md text-sm font-medium transition-colors"
        >
          <Pencil size={13} />
          {t('editItem')}
        </button>
      </div>

      {/* Photos */}
      {item.photos?.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
          {item.photos.map((photo, i) => (
            <img
              key={i}
              src={photoUrl(photo)}
              alt=""
              className="w-28 h-28 rounded-lg object-cover flex-shrink-0 border border-zinc-100 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setViewerIndex(i)}
            />
          ))}
        </div>
      )}

      {viewerIndex !== null && item.photos?.length > 0 && (
        <ImageViewer
          images={item.photos.map(p => photoUrl(p))}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}

      {/* Item Info */}
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-zinc-900">
          {item.title}
        </h1>

        {/* Metadata row — badges */}
        <div className="flex flex-wrap items-center gap-2">
          {item.date_time && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-md text-xs font-medium">
              <Clock className="w-3 h-3 text-zinc-500 flex-shrink-0" strokeWidth={1.5} />
              {new Date(item.date_time).toLocaleString()}
            </span>
          )}
          {item.category && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-md text-xs font-medium capitalize">
              <Tag className="w-3 h-3 text-zinc-500 flex-shrink-0" strokeWidth={1.5} />
              {item.category}
            </span>
          )}
        </div>

        {item.description && (
          <p className="text-sm text-zinc-500 leading-relaxed">{item.description}</p>
        )}

        {/* Map */}
        {item.location?.coordinates && (
          <div>
            <ItemMap
              lng={item.location.coordinates[0]}
              lat={item.location.coordinates[1]}
            />
            {item.address && (
              <p className="flex items-center gap-1.5 mt-2 text-xs text-zinc-500">
                <MapPin className="w-3 h-3 text-zinc-400 flex-shrink-0" strokeWidth={1.5} />
                {item.address}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Matches Section */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
            {t('navMatches')} {matchTotal > 0 && <span className="text-zinc-400 normal-case tracking-normal">({matchTotal})</span>}
          </p>
          <div className="flex bg-zinc-100 rounded-md p-0.5 gap-0.5">
            {['active', 'all'].map(f => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  matchFilter === f
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                {f === 'active' ? t('filterActive') : t('filterAll')}
              </button>
            ))}
          </div>
        </div>

        {loadingMatches ? (
          <div className="flex justify-center py-10">
            <div className="w-4 h-4 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
          </div>
        ) : matches.length > 0 ? (
          <>
            <div className="border border-zinc-200 rounded-lg divide-y divide-zinc-100 overflow-hidden">
              {matches.map(match => {
                const otherItem = match.lost_item;
                return (
                  <button
                    key={match.match_id}
                    onClick={() => navigate(`/matches/${itemId}`)}
                    className="w-full px-4 py-3 text-left hover:bg-zinc-50 transition-colors flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-zinc-900 truncate">
                          {otherItem?.title || t('possibleMatch')}
                        </span>
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md flex-shrink-0 ${MATCH_STATUS_STYLE[match.status] || 'bg-zinc-100 text-zinc-400'}`}>
                          {MATCH_STATUS_LABEL[match.status] || match.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500">
                        {t('matchScore')}: <span className="font-medium text-zinc-900">{Math.round(match.score * 100)}%</span>
                      </p>
                      {getLocalizedReasoning(match, language) && (
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{getLocalizedReasoning(match, language)}</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-200 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
            {matches.length < matchTotal && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full mt-3 py-2.5 text-sm font-medium text-zinc-500 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
                  </span>
                ) : (
                  `${t('loadMore')} (${matchTotal - matches.length})`
                )}
              </button>
            )}
          </>
        ) : (
          <div className="text-center py-12 border border-zinc-200 rounded-lg">
            <Package className="w-8 h-8 text-zinc-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm font-medium text-zinc-900">{t('noMatchesYet')}</p>
            <p className="text-sm text-zinc-500 mt-1">{t('notifyWhenCandidate')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
