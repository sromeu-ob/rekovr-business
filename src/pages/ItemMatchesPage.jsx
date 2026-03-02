import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, MessageSquare, Package, Loader2, MapPin } from 'lucide-react';
import api, { photoUrl } from '../api';

const STATUS_STYLES = {
  pending:   { bg: 'bg-amber-50',  text: 'text-amber-700',  label: 'Pending' },
  accepted:  { bg: 'bg-green-50',  text: 'text-green-700',  label: 'Accepted' },
  rejected:  { bg: 'bg-red-50',    text: 'text-red-600',    label: 'Rejected' },
  paid:      { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Paid' },
  recovered: { bg: 'bg-green-50',  text: 'text-green-700',  label: 'Recovered' },
};

function ScoreBar({ score }) {
  if (score == null) return <span className="text-[12px] text-zinc-400">—</span>;
  const color = score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[12px] font-medium text-zinc-600">{score}%</span>
    </div>
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

export default function ItemMatchesPage() {
  const { itemId } = useParams();
  const navigate = useNavigate();

  const [foundItem, setFoundItem] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // match_id being actioned

  useEffect(() => {
    Promise.all([
      api.get(`/business/items/${itemId}`),
      api.get(`/business/items/matches/list?found_item_id=${itemId}&limit=50`),
    ])
      .then(([itemRes, matchRes]) => {
        setFoundItem(itemRes.data);
        setMatches(matchRes.data.matches);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [itemId]);

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
            {matches.length} candidate{matches.length !== 1 ? 's' : ''} for this item
          </p>
        </div>
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
              <p className="text-[14px] text-zinc-500">No match candidates found.</p>
            </div>
          ) : (
            matches.map((match) => {
              const lost = match.lost_item;
              const isPending = match.status === 'pending';
              const isActioning = actionLoading === match.match_id;

              return (
                <div
                  key={match.match_id}
                  className="bg-white border border-zinc-100 rounded-2xl p-5 space-y-4"
                >
                  {/* Top row: score + distance + status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ScoreBar score={match.score} />
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

                  {/* AI reasoning (if available) — stored per language */}
                  {(match.reasoning_en || match.reasoning) && (
                    <p className="text-[11px] text-zinc-400 italic bg-zinc-50 rounded-lg px-3 py-2">
                      {match.reasoning_en || match.reasoning}
                    </p>
                  )}

                  {/* Actions */}
                  {isPending && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleAction(match.match_id, 'accept')}
                        disabled={isActioning}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-zinc-900 text-white rounded-xl text-[12px] font-semibold hover:bg-zinc-800 transition disabled:opacity-50"
                      >
                        {isActioning ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        Accept
                      </button>
                      <button
                        onClick={() => handleAction(match.match_id, 'reject')}
                        disabled={isActioning}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-zinc-100 text-zinc-700 rounded-xl text-[12px] font-medium hover:bg-zinc-200 transition disabled:opacity-50"
                      >
                        <X size={14} />
                        Reject
                      </button>
                      {!match.info_requested && (
                        <button
                          onClick={() => handleAction(match.match_id, 'request-info')}
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
            })
          )}
        </div>
      </div>
    </div>
  );
}
