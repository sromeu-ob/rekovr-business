import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, MessageSquare, Package, Loader2, MapPin, ShieldQuestion, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import api, { photoUrl } from '../api';

const STATUS_STYLES = {
  pending_verification: { bg: 'bg-indigo-50', text: 'text-indigo-700', label: 'Verification' },
  pending_review:       { bg: 'bg-blue-50',   text: 'text-blue-700',   label: 'Under Review' },
  pending:   { bg: 'bg-amber-50',  text: 'text-amber-700',  label: 'Pending' },
  accepted:  { bg: 'bg-green-50',  text: 'text-green-700',  label: 'Accepted' },
  rejected:  { bg: 'bg-red-50',    text: 'text-red-600',    label: 'Rejected' },
  dismissed: { bg: 'bg-zinc-100',  text: 'text-zinc-500',   label: 'Dismissed' },
  paid:      { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Paid' },
  recovered: { bg: 'bg-green-50',  text: 'text-green-700',  label: 'Recovered' },
};

const PENDING_STATUSES = 'pending,pending_verification,pending_review';

const FILTERS = [
  { key: 'active', label: 'Active',  statuses: PENDING_STATUSES },
  { key: 'all',    label: 'All',     statuses: null },
];

const PAGE_SIZE = 20;

function ScoreBar({ score, label }) {
  if (score == null) return <span className="text-[12px] text-zinc-400">—</span>;
  const pct = score <= 1 ? Math.round(score * 100) : Math.round(score);
  const color = pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-[10px] text-zinc-400 font-medium">{label}</span>}
      <div className="w-20 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[12px] font-medium text-zinc-600">{pct}%</span>
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
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${style}`}>
      <Icon size={11} />
      {pct}%
    </span>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { bg: 'bg-zinc-100', text: 'text-zinc-500', label: status };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

function DistanceBadge({ km }) {
  if (km == null) return null;
  const label = km < 1 ? `${Math.round(km * 1000)} m` : `${km} km`;
  const color = km <= 1 ? 'text-green-600 bg-green-50' : km <= 5 ? 'text-amber-600 bg-amber-50' : 'text-zinc-500 bg-zinc-100';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${color}`}>
      <MapPin size={11} />
      {label}
    </span>
  );
}

function MatchCard({ match, lost, canAct, isActioning, onAction }) {
  const [showVerification, setShowVerification] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  const [loadingVerification, setLoadingVerification] = useState(false);
  const hasVerification = match.verification_score != null;

  const fetchVerification = async () => {
    if (verificationData) { setShowVerification(v => !v); return; }
    setLoadingVerification(true);
    try {
      const res = await api.get(`/business/items/matches/${match.match_id}/verification`);
      setVerificationData(res.data);
      setShowVerification(true);
    } catch { setShowVerification(false); }
    setLoadingVerification(false);
  };

  return (
    <div className="bg-white border border-zinc-100 rounded-2xl p-5 space-y-4">
      {/* Top row: score + verification + distance + status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScoreBar score={match.score} label="Match" />
          {hasVerification && <VerificationBadge score={match.verification_score} />}
          <DistanceBadge km={match.distance_km} />
        </div>
        <StatusBadge status={match.status} />
      </div>

      {/* Lost item info */}
      <div className="flex gap-4">
        {lost?.photos?.length > 0 ? (
          <img
            src={photoUrl(lost.photos[0])}
            alt=""
            className="w-20 h-20 rounded-xl object-cover flex-shrink-0 bg-zinc-100"
          />
        ) : (
          <div className="w-20 h-20 rounded-xl bg-zinc-50 flex items-center justify-center flex-shrink-0">
            <Package size={24} className="text-zinc-200" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-zinc-900 truncate">{lost?.title || '—'}</p>
          {lost?.description && (
            <p className="text-[12px] text-zinc-500 mt-0.5 line-clamp-2">{lost.description}</p>
          )}
          <div className="flex gap-3 mt-1.5 text-[11px] text-zinc-400">
            <span className="capitalize">{lost?.category}</span>
            {lost?.address && <span className="truncate">{lost.address}</span>}
          </div>
        </div>
      </div>

      {/* AI reasoning */}
      {(match.reasoning_en || match.reasoning || match.ai_reasoning) && (
        <p className="text-[11px] text-zinc-400 italic bg-zinc-50 rounded-lg px-3 py-2">
          {match.reasoning_en || match.reasoning || match.ai_reasoning}
        </p>
      )}

      {/* Expandable verification details */}
      {hasVerification && (
        <div>
          <button
            onClick={fetchVerification}
            className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 transition"
          >
            {loadingVerification ? (
              <Loader2 size={12} className="animate-spin" />
            ) : showVerification ? (
              <ChevronUp size={12} />
            ) : (
              <ChevronDown size={12} />
            )}
            {showVerification ? 'Hide verification details' : 'View verification details'}
          </button>
          {showVerification && verificationData && (
            <div className="mt-3 border border-indigo-100 rounded-xl overflow-hidden divide-y divide-indigo-50">
              {(verificationData.questions || []).map((q, i) => {
                const ans = (verificationData.answers || []).find(a => a.question === q.question);
                const score = ans?.score;
                const scorePct = score != null ? Math.round(score * 100) : null;
                const scoreStyle = scorePct >= 85
                  ? 'text-emerald-700 bg-emerald-50'
                  : scorePct >= 50
                    ? 'text-amber-700 bg-amber-50'
                    : 'text-red-600 bg-red-50';
                return (
                  <div key={i} className="px-4 py-3">
                    <p className="text-[12px] font-semibold text-zinc-700">{q.question}</p>
                    {q.answer_hint && (
                      <p className="text-[10px] text-zinc-400 mt-0.5 italic">Expected: {q.answer_hint}</p>
                    )}
                    {ans && (
                      <div className="mt-2 flex items-start gap-2">
                        <p className="text-[11px] text-zinc-600 flex-1">{ans.answer || '—'}</p>
                        {scorePct != null && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${scoreStyle}`}>
                            {scorePct}%
                          </span>
                        )}
                      </div>
                    )}
                    {ans?.reasoning && (
                      <p className="text-[10px] text-zinc-400 italic mt-1">{ans.reasoning}</p>
                    )}
                  </div>
                );
              })}
              {verificationData.verification_reasoning && (
                <div className="px-4 py-3 bg-zinc-50">
                  <p className="text-[10px] text-zinc-500 italic">{verificationData.verification_reasoning}</p>
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
            onClick={() => onAction('accept')}
            disabled={isActioning}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-zinc-900 text-white rounded-xl text-[12px] font-semibold hover:bg-zinc-800 transition disabled:opacity-50"
          >
            {isActioning ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Accept
          </button>
          <button
            onClick={() => onAction('reject')}
            disabled={isActioning}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-zinc-100 text-zinc-700 rounded-xl text-[12px] font-medium hover:bg-zinc-200 transition disabled:opacity-50"
          >
            <X size={14} />
            Reject
          </button>
          {!match.info_requested && (
            <button
              onClick={() => onAction('request-info')}
              disabled={isActioning}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-zinc-100 text-zinc-700 rounded-xl text-[12px] font-medium hover:bg-zinc-200 transition disabled:opacity-50"
            >
              <MessageSquare size={14} />
              <span className="hidden sm:inline">More info</span>
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

  const [foundItem, setFoundItem] = useState(null);
  const [matches, setMatches] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState('active');
  const [actionLoading, setActionLoading] = useState(null);

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
        <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/matches')}
          className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition"
        >
          <ArrowLeft size={16} className="text-zinc-600" />
        </button>
        <div>
          <h2 className="text-[20px] font-extrabold text-zinc-900">Match candidates</h2>
          <p className="text-[12px] text-zinc-400">
            {total} candidate{total !== 1 ? 's' : ''} for this item{filter !== 'all' ? ` (${filter})` : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1 bg-zinc-50 rounded-lg p-0.5 w-fit mb-6">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => handleFilterChange(f.key)}
            className={`px-4 py-1.5 text-[12px] font-semibold rounded-md transition-colors ${
              filter === f.key
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT: Found item (org's item) — sticky on desktop */}
        <div className="w-full lg:w-[340px] flex-shrink-0">
          <div className="lg:sticky lg:top-8 bg-white border border-zinc-100 rounded-2xl p-5 space-y-4">
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">Your found item</p>

            {foundItem?.photos?.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {foundItem.photos.slice(0, 4).map((photo, i) => (
                  <img
                    key={i}
                    src={photoUrl(photo)}
                    alt=""
                    className="w-full aspect-square rounded-xl object-cover bg-zinc-100"
                  />
                ))}
              </div>
            )}

            <div>
              <p className="text-[15px] font-bold text-zinc-900">{foundItem?.title}</p>
              {foundItem?.description && (
                <p className="text-[12px] text-zinc-500 mt-1 line-clamp-3">{foundItem.description}</p>
              )}
            </div>

            <div className="flex gap-3 text-[11px] text-zinc-400">
              <span className="capitalize">{foundItem?.category}</span>
              {foundItem?.address && <span className="truncate">{foundItem.address}</span>}
            </div>
          </div>
        </div>

        {/* RIGHT: Candidate matches */}
        <div className="flex-1 space-y-3">
          {matches.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[14px] text-zinc-500">
                {filter === 'active' ? 'No pending matches for this item.' : 'No match candidates found.'}
              </p>
              {filter === 'active' && (
                <button
                  onClick={() => handleFilterChange('all')}
                  className="mt-2 text-[12px] font-semibold text-zinc-900 hover:underline"
                >
                  View all matches
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
                  />
                );
              })}

              {matches.length < total && (
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="w-full mt-2 py-2.5 text-[12px] font-semibold text-zinc-500 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition disabled:opacity-50"
                >
                  {loadingMore ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-zinc-300 border-t-transparent rounded-full animate-spin" />
                    </span>
                  ) : (
                    `Load more (${total - matches.length} remaining)`
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
