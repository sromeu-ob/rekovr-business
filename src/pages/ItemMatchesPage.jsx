import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, MessageSquare, Package, Loader2, MapPin, Tag, Clock, ShieldQuestion, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import api, { photoUrl } from '../api';
import { useI18n } from '../contexts/I18nContext';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function MatchesMap({ foundItem, matches, hoveredMatchId, t }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const readyRef = useRef(false);

  // Build match_id → feature index mapping
  const matchIndexRef = useRef({});

  useEffect(() => {
    if (!containerRef.current) return;
    const foundCoords = foundItem?.location?.coordinates;
    if (!foundCoords) return;

    const features = matches
      .filter(m => m.lost_item?.location?.coordinates)
      .map((m, i) => {
        matchIndexRef.current[m.match_id] = i;
        return {
          type: 'Feature',
          id: i,
          properties: { match_id: m.match_id },
          geometry: { type: 'Point', coordinates: m.lost_item.location.coordinates },
        };
      });

    const allCoords = [foundCoords, ...features.map(f => f.geometry.coordinates)];

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: foundCoords,
      zoom: 13,
      interactive: true,
    });
    mapRef.current = map;

    new mapboxgl.Marker({ color: '#18181b' })
      .setLngLat(foundCoords)
      .addTo(map);

    map.on('load', () => {
      if (features.length > 0) {
        map.addSource('lost-items', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features },
          promoteId: 'match_id',
        });

        map.addLayer({
          id: 'lost-fill',
          type: 'circle',
          source: 'lost-items',
          paint: {
            'circle-color': '#3b82f6',
            'circle-opacity': [
              'case', ['boolean', ['feature-state', 'hovered'], false],
              0.35, 0.12,
            ],
            'circle-radius': [
              'interpolate', ['exponential', 2], ['zoom'],
              10, 4, 13, 22, 16, 90,
            ],
          },
        });

        map.addLayer({
          id: 'lost-stroke',
          type: 'circle',
          source: 'lost-items',
          paint: {
            'circle-color': 'transparent',
            'circle-radius': [
              'interpolate', ['exponential', 2], ['zoom'],
              10, 4, 13, 22, 16, 90,
            ],
            'circle-stroke-width': [
              'case', ['boolean', ['feature-state', 'hovered'], false],
              2.5, 1.5,
            ],
            'circle-stroke-color': '#3b82f6',
            'circle-stroke-opacity': [
              'case', ['boolean', ['feature-state', 'hovered'], false],
              0.9, 0.4,
            ],
          },
        });
      }

      if (allCoords.length > 1) {
        const bounds = allCoords.reduce(
          (b, c) => b.extend(c),
          new mapboxgl.LngLatBounds(allCoords[0], allCoords[0]),
        );
        map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
      }

      readyRef.current = true;
    });

    return () => {
      readyRef.current = false;
      mapRef.current = null;
      map.remove();
    };
  }, [foundItem, matches]);

  // React to hover changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    if (!map.getSource('lost-items')) return;

    // Clear all hovered states
    matches.forEach(m => {
      map.setFeatureState(
        { source: 'lost-items', id: m.match_id },
        { hovered: false },
      );
    });

    // Set hovered state on the active match
    if (hoveredMatchId) {
      map.setFeatureState(
        { source: 'lost-items', id: hoveredMatchId },
        { hovered: true },
      );

      // Pan to hovered match
      const match = matches.find(m => m.match_id === hoveredMatchId);
      const coords = match?.lost_item?.location?.coordinates;
      if (coords) {
        map.easeTo({ center: coords, duration: 300 });
      }
    }
  }, [hoveredMatchId, matches]);

  if (!foundItem?.location?.coordinates) return null;

  return (
    <div>
      <div ref={containerRef} className="w-full h-52 rounded-lg overflow-hidden" />
      <div className="flex items-center gap-4 mt-2 px-0.5">
        <span className="flex items-center gap-1.5 text-xs text-stone-500">
          <span className="w-2.5 h-2.5 rounded-full bg-stone-900 flex-shrink-0" />
          {t('mapLegendFoundItem')}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-stone-500">
          <span className="w-2.5 h-2.5 rounded-full border-2 border-stone-400 bg-stone-100 flex-shrink-0" />
          {t('mapLegendMatchZone')}
        </span>
      </div>
    </div>
  );
}

const getLocalizedReasoning = (match, lang) =>
  match?.[`reasoning_${lang}`] || match?.reasoning_en || match?.reasoning || '';

const PENDING_STATUSES = 'pending,pending_verification,pending_review';

const FILTERS = [
  { key: 'active', labelKey: 'filterActive', statuses: PENDING_STATUSES },
  { key: 'all',    labelKey: 'filterAll',    statuses: null },
];

const PAGE_SIZE = 20;

function ScoreBar({ score, label }) {
  if (score == null) return <span className="text-xs text-stone-400">—</span>;
  const pct = score <= 1 ? Math.round(score * 100) : Math.round(score);
  const color = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs text-stone-500 font-medium">{label}</span>}
      <div className="w-20 h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-stone-700">{pct}%</span>
    </div>
  );
}

function VerificationBadge({ score }) {
  if (score == null) return null;
  const pct = Math.round(score * 100);
  const style = pct >= 85
    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
    : pct >= 50
      ? 'bg-amber-50 text-amber-700 border-amber-100'
      : 'bg-red-50 text-red-600 border-red-100';
  const Icon = pct >= 85 ? ShieldCheck : ShieldQuestion;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${style}`}>
      <Icon size={11} />
      {pct}%
    </span>
  );
}

function StatusBadge({ status, statusStyles }) {
  const s = statusStyles[status] || { bg: 'bg-stone-100', text: 'text-stone-500', label: status };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

function DistanceBadge({ km }) {
  if (km == null) return null;
  const label = km < 1 ? `${Math.round(km * 1000)} m` : `${km} km`;
  const color = km <= 1 ? 'text-emerald-600 bg-emerald-50' : km <= 5 ? 'text-amber-600 bg-amber-50' : 'text-stone-500 bg-stone-100';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${color}`}>
      <MapPin size={11} />
      {label}
    </span>
  );
}

function MatchCard({ match, lost, canAct, isActioning, onAction, onHover, t, statusStyles, language }) {
  const [showVerification, setShowVerification] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  const [loadingVerification, setLoadingVerification] = useState(false);
  const hasVerification = match.verification_score != null;

  const fetchVerification = async () => {
    if (verificationData) { setShowVerification(v => !v); return; }
    setLoadingVerification(true);
    try {
      const res = await api.get(`/business/items/matches/${match.match_id}/verification`, {
        params: { lang: language },
      });
      setVerificationData(res.data);
      setShowVerification(true);
    } catch { setShowVerification(false); }
    setLoadingVerification(false);
  };

  return (
    <div
      data-testid={`match-card-${match.match_id}`}
      className="bg-white border border-stone-200 rounded-lg p-5 space-y-4 transition-colors"
      onMouseEnter={() => onHover?.(match.match_id)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Top row: score + verification + distance + status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScoreBar score={match.score} label={t('match')} />
          {hasVerification && <VerificationBadge score={match.verification_score} />}
          <DistanceBadge km={match.distance_km} />
        </div>
        <StatusBadge status={match.status} statusStyles={statusStyles} />
      </div>

      {/* Lost item info */}
      <div className="flex gap-4">
        {lost?.photos?.length > 0 ? (
          <img
            src={photoUrl(lost.photos[0])}
            alt=""
            className="w-16 h-16 rounded-md object-cover flex-shrink-0 bg-stone-100"
          />
        ) : (
          <div className="w-16 h-16 rounded-md bg-stone-100 flex items-center justify-center flex-shrink-0">
            <Package size={20} className="text-stone-400" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-stone-900 truncate">{lost?.title || '—'}</p>
          {lost?.description && (
            <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">{lost.description}</p>
          )}
          {lost?.category && (
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 text-stone-700 rounded-md text-xs font-medium capitalize">
                <Tag className="w-3 h-3 text-stone-500 flex-shrink-0" strokeWidth={1.5} />
                {lost.category}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* AI reasoning */}
      {getLocalizedReasoning(match, language) && (
        <p className="text-xs text-stone-500 italic bg-stone-50 rounded-md px-3 py-2">
          {getLocalizedReasoning(match, language)}
        </p>
      )}

      {/* Expandable verification details */}
      {hasVerification && (
        <div>
          <button
            onClick={fetchVerification}
            className="flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors"
          >
            {loadingVerification ? (
              <Loader2 size={12} className="animate-spin" />
            ) : showVerification ? (
              <ChevronUp size={12} />
            ) : (
              <ChevronDown size={12} />
            )}
            {showVerification ? t('hideVerificationDetails') : t('viewVerificationDetails')}
          </button>
          {showVerification && verificationData && (
            <div className="mt-3 border border-stone-200 rounded-lg overflow-hidden divide-y divide-stone-100">
              {(verificationData.questions || []).map((q, i) => {
                const ans = (verificationData.answers || [])[i];
                const score = ans?.score;
                const scorePct = score != null ? Math.round(score * 100) : null;
                const scoreStyle = scorePct >= 85
                  ? 'text-emerald-700 bg-emerald-50'
                  : scorePct >= 50
                    ? 'text-amber-700 bg-amber-50'
                    : 'text-red-600 bg-red-50';
                return (
                  <div key={i} className="px-4 py-3">
                    <p className="text-sm font-medium text-stone-800">{q.question}</p>
                    {q.answer_hint && (
                      <p className="text-xs text-stone-400 mt-0.5 italic">{t('expected')}: {q.answer_hint}</p>
                    )}
                    {ans && (
                      <div className="mt-2 flex items-start gap-2">
                        <p className="text-xs text-stone-600 flex-1">{ans.answer || '—'}</p>
                        {scorePct != null && (
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md flex-shrink-0 ${scoreStyle}`}>
                            {scorePct}%
                          </span>
                        )}
                      </div>
                    )}
                    {ans?.reasoning && (
                      <p className="text-xs text-stone-400 italic mt-1">{ans.reasoning}</p>
                    )}
                  </div>
                );
              })}
              {verificationData.verification_reasoning && (
                <div className="px-4 py-3 bg-stone-50">
                  <p className="text-xs text-stone-500 italic">{verificationData.verification_reasoning}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {canAct && (
        <div className="flex gap-2 pt-1">
          <button
            data-testid={`accept-btn-${match.match_id}`}
            onClick={() => onAction('accept')}
            disabled={isActioning}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-stone-900 text-white rounded-md text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
          >
            {isActioning ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {t('accept')}
          </button>
          <button
            data-testid={`reject-btn-${match.match_id}`}
            onClick={() => onAction('reject')}
            disabled={isActioning}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-stone-100 text-stone-700 rounded-md text-sm font-medium hover:bg-stone-200 transition-colors disabled:opacity-50"
          >
            <X size={14} />
            {t('reject')}
          </button>
          {!match.info_requested && (
            <button
              data-testid={`request-info-btn-${match.match_id}`}
              onClick={() => onAction('request-info')}
              disabled={isActioning}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-stone-100 text-stone-700 rounded-md text-sm font-medium hover:bg-stone-200 transition-colors disabled:opacity-50"
            >
              <MessageSquare size={14} />
              <span className="hidden sm:inline">{t('moreInfo')}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ItemMatchesPage() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { t, language } = useI18n();

  const STATUS_STYLES = {
    pending_verification: { bg: 'bg-amber-50',   text: 'text-amber-700',   label: t('statusVerification') },
    pending_review:       { bg: 'bg-amber-50',   text: 'text-amber-700',   label: t('statusUnderReview') },
    pending:   { bg: 'bg-amber-50',   text: 'text-amber-700',   label: t('statusPending') },
    accepted:  { bg: 'bg-emerald-50', text: 'text-emerald-700', label: t('statusAccepted') },
    rejected:  { bg: 'bg-red-50',     text: 'text-red-600',     label: t('statusRejected') },
    dismissed: { bg: 'bg-stone-100',   text: 'text-stone-500',    label: t('statusDismissed') },
    paid:      { bg: 'bg-emerald-50', text: 'text-emerald-700', label: t('statusPaid') },
    recovered: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: t('statusRecovered') },
  };

  const [foundItem, setFoundItem] = useState(null);
  const [matches, setMatches] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState('active');
  const [actionLoading, setActionLoading] = useState(null);
  const [hoveredMatchId, setHoveredMatchId] = useState(null);

  const fetchMatches = useCallback(async (filterKey, offset = 0) => {
    const f = FILTERS.find(f => f.key === filterKey) || FILTERS[0];
    const params = { found_item_id: itemId, limit: PAGE_SIZE, offset };
    if (f.statuses) params.status = f.statuses;
    const res = await api.get('/business/items/matches/list', { params });
    return res.data;
  }, [itemId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/business/items/${itemId}`),
      fetchMatches(filter),
    ])
      .then(([itemRes, matchRes]) => {
        setFoundItem(itemRes.data);
        setMatches(matchRes.matches);
        setTotal(matchRes.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [itemId, filter, fetchMatches]);

  const handleFilterChange = (key) => {
    setFilter(key);
    setMatches([]);
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await fetchMatches(filter, matches.length);
      setMatches(prev => [...prev, ...data.matches]);
    } catch {}
    setLoadingMore(false);
  };

  const handleAction = async (matchId, action) => {
    setActionLoading(matchId);
    try {
      await api.post(`/business/items/matches/${matchId}/${action}`);
      setMatches((prev) =>
        prev.map((m) => {
          if (m.match_id !== matchId) return m;
          if (action === 'accept') return { ...m, status: 'accepted' };
          if (action === 'reject') return { ...m, status: 'rejected' };
          if (action === 'request-info') return { ...m, info_requested: true };
          return m;
        })
      );
    } catch (err) {
      console.error(`Action ${action} failed:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/matches')}
          className="w-8 h-8 rounded-md bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors"
        >
          <ArrowLeft size={16} className="text-stone-600" />
        </button>
        <div>
          <h1 data-testid="item-matches-heading" className="text-2xl font-semibold text-stone-900">{t('matchCandidates')}</h1>
          <p className="text-sm text-stone-500">
            {total} {total !== 1 ? t('candidates') : t('candidate')} {t('forThisItem')}{filter !== 'all' ? ` (${filter})` : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1 bg-stone-100 rounded-md p-0.5 w-fit mb-6">
        {FILTERS.map(f => (
          <button
            key={f.key}
            data-testid={`filter-${f.key}`}
            onClick={() => handleFilterChange(f.key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === f.key
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT: Found item (org's item) — sticky on desktop */}
        <div className="w-full lg:w-[340px] flex-shrink-0">
          <div data-testid="found-item-detail" className="lg:sticky lg:top-8 bg-white border border-stone-200 rounded-lg p-5 space-y-4">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">{t('yourFoundItem')}</p>

            {foundItem?.photos?.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {foundItem.photos.slice(0, 4).map((photo, i) => (
                  <img
                    key={i}
                    src={photoUrl(photo)}
                    alt=""
                    className="w-full aspect-square rounded-md object-cover bg-stone-100"
                  />
                ))}
              </div>
            )}

            <div>
              <p className="text-sm font-semibold text-stone-900">{foundItem?.title}</p>
              {foundItem?.description && (
                <p className="text-xs text-stone-500 mt-1 line-clamp-3">{foundItem.description}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {foundItem?.date_time && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 text-stone-700 rounded-md text-xs font-medium">
                  <Clock className="w-3 h-3 text-stone-500 flex-shrink-0" strokeWidth={1.5} />
                  {new Date(foundItem.date_time).toLocaleString()}
                </span>
              )}
              {foundItem?.category && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 text-stone-700 rounded-md text-xs font-medium capitalize">
                  <Tag className="w-3 h-3 text-stone-500 flex-shrink-0" strokeWidth={1.5} />
                  {foundItem.category}
                </span>
              )}
            </div>

            <MatchesMap foundItem={foundItem} matches={matches} hoveredMatchId={hoveredMatchId} t={t} />
          </div>
        </div>

        {/* RIGHT: Candidate matches */}
        <div className="flex-1 space-y-3">
          {matches.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm font-medium text-stone-900">
                {filter === 'active' ? t('noPendingMatchesForItem') : t('noMatchCandidates')}
              </p>
              {filter === 'active' && (
                <button
                  onClick={() => handleFilterChange('all')}
                  className="mt-2 text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors"
                >
                  {t('viewAllMatches')}
                </button>
              )}
            </div>
          ) : (
            <>
              {matches.map((match) => {
                const lost = match.lost_item;
                const canAct = match.status === 'pending' || match.status === 'pending_review';
                const isActioning = actionLoading === match.match_id;

                return (
                  <MatchCard
                    key={match.match_id}
                    match={match}
                    lost={lost}
                    canAct={canAct}
                    isActioning={isActioning}
                    onAction={(action) => handleAction(match.match_id, action)}
                    onHover={setHoveredMatchId}
                    t={t}
                    statusStyles={STATUS_STYLES}
                    language={language}
                  />
                );
              })}

              {matches.length < total && (
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="w-full mt-2 py-2.5 text-sm font-medium text-stone-500 bg-white border border-stone-200 rounded-md hover:bg-stone-50 transition-colors disabled:opacity-50"
                >
                  {loadingMore ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
                    </span>
                  ) : (
                    `${t('loadMore')} (${total - matches.length} ${t('remaining')})`
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
