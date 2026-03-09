import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Tag, Package, Sparkles, ChevronRight } from 'lucide-react';
import ImageViewer from '../components/ImageViewer';
import api, { photoUrl } from '../api';

const MATCH_LIMIT = 10;
const ACTIVE_STATUSES = 'pending,pending_verification,pending_review';

const STATUS_STYLE = {
  active:    'bg-zinc-100 text-zinc-600',
  matched:   'bg-orange-50 text-orange-600',
  recovered: 'bg-green-50 text-green-600',
  returned:  'bg-green-50 text-green-600',
  archived:  'bg-zinc-50 text-zinc-400',
};

const MATCH_STATUS_STYLE = {
  pending_verification: 'bg-indigo-50 text-indigo-600',
  pending_review:       'bg-blue-50 text-blue-600',
  pending:   'bg-amber-50 text-amber-600',
  accepted:  'bg-zinc-100 text-zinc-600',
  rejected:  'bg-red-50 text-red-500',
  dismissed: 'bg-zinc-50 text-zinc-400',
  paid:      'bg-green-50 text-green-600',
  recovered: 'bg-green-50 text-green-600',
};

const MATCH_STATUS_LABEL = {
  pending_verification: 'Verification',
  pending_review:       'Under Review',
  pending:   'Pending',
  accepted:  'Accepted',
  rejected:  'Rejected',
  dismissed: 'Dismissed',
  paid:      'Paid',
  recovered: 'Recovered',
};

export default function ItemDetailPage() {
  const { itemId } = useParams();
  const navigate = useNavigate();

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
        <div className="w-5 h-5 border-2 border-zinc-300 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-20">
        <p className="text-[13px] text-zinc-400">Item not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition"
        >
          <ArrowLeft size={16} className="text-zinc-600" />
        </button>
        <span className="text-[10px] font-semibold px-2 py-1 rounded bg-teal-50 text-teal-600">
          Found
        </span>
        <span className={`text-[10px] font-semibold px-2 py-1 rounded ${STATUS_STYLE[item.status] || 'bg-zinc-50 text-zinc-400'}`}>
          {item.status}
        </span>
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
        <h1 className="text-[20px] font-extrabold text-zinc-900 tracking-tight">
          {item.title}
        </h1>

        <p className="text-[13px] text-zinc-500 leading-relaxed">
          {item.description}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="border border-zinc-100 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
              <span className="text-[9px] text-zinc-300 uppercase tracking-wider font-semibold">Location</span>
            </div>
            <p className="text-[12px] font-medium text-zinc-900">{item.address || 'On map'}</p>
          </div>
          <div className="border border-zinc-100 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
              <span className="text-[9px] text-zinc-300 uppercase tracking-wider font-semibold">Date & Time</span>
            </div>
            <p className="text-[12px] font-medium text-zinc-900">
              {item.date_time ? new Date(item.date_time).toLocaleString() : '-'}
            </p>
          </div>
          <div className="border border-zinc-100 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Tag className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
              <span className="text-[9px] text-zinc-300 uppercase tracking-wider font-semibold">Category</span>
            </div>
            <p className="text-[12px] font-medium text-zinc-900 capitalize">{item.category || '-'}</p>
          </div>
        </div>
      </div>

      {/* Matches Section */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-semibold text-zinc-300 uppercase tracking-[0.15em] flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-zinc-300" strokeWidth={1.5} />
            Matches {matchTotal > 0 && <span className="text-zinc-400">({matchTotal})</span>}
          </p>
          <div className="flex bg-zinc-50 rounded-lg p-0.5 gap-0.5">
            {['active', 'all'].map(f => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                  matchFilter === f
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                {f === 'active' ? 'Active' : 'All'}
              </button>
            ))}
          </div>
        </div>

        {loadingMatches ? (
          <div className="flex justify-center py-10">
            <div className="w-4 h-4 border-2 border-zinc-300 border-t-transparent rounded-full animate-spin" />
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
                        <span className="text-[13px] font-semibold text-zinc-900 truncate">
                          {otherItem?.title || 'Possible match'}
                        </span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${MATCH_STATUS_STYLE[match.status] || 'bg-zinc-50 text-zinc-400'}`}>
                          {MATCH_STATUS_LABEL[match.status] || match.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Match score: <span className="font-semibold text-zinc-900">{Math.round(match.score * 100)}%</span>
                      </p>
                      {(match.reasoning_en || match.reasoning) && (
                        <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">{match.reasoning_en || match.reasoning}</p>
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
                className="w-full mt-3 py-2.5 text-[12px] font-semibold text-zinc-500 bg-zinc-50 rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-zinc-300 border-t-transparent rounded-full animate-spin" />
                  </span>
                ) : (
                  `Load more (${matchTotal - matches.length})`
                )}
              </button>
            )}
          </>
        ) : (
          <div className="text-center py-12 border border-zinc-100 rounded-lg">
            <Package className="w-8 h-8 text-zinc-200 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[13px] text-zinc-400">No matches yet</p>
            <p className="text-[11px] text-zinc-300 mt-1">We'll notify you when a candidate appears</p>
          </div>
        )}
      </div>
    </div>
  );
}
