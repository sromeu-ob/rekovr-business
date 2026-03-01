import { useEffect, useState } from 'react';
import { GitCompare } from 'lucide-react';
import api from '../api';

const STATUS_COLORS = {
  pending:   'bg-yellow-50 text-yellow-700',
  accepted:  'bg-blue-50 text-blue-700',
  paid:      'bg-purple-50 text-purple-700',
  recovered: 'bg-green-50 text-green-700',
  rejected:  'bg-red-50 text-red-600',
};

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/business/items/matches/list?limit=50')
      .then(res => { setMatches(res.data.matches); setTotal(res.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-[22px] font-extrabold text-zinc-900">Matches</h2>
        <p className="text-[13px] text-zinc-400 mt-1">{total} matches found by the AI</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
            <GitCompare size={20} className="text-zinc-400" />
          </div>
          <p className="text-[14px] font-semibold text-zinc-700">No matches yet</p>
          <p className="text-[12px] text-zinc-400 mt-1">Matches are created automatically when a lost item report fits one of your registered items.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Found item</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Lost item</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Score</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <tr key={match.match_id} className="border-b border-zinc-50 hover:bg-zinc-50 transition">
                  <td className="px-5 py-3.5">
                    <p className="text-[13px] font-medium text-zinc-900 line-clamp-1">
                      {match.found_item?.title || '—'}
                    </p>
                    <p className="text-[11px] text-zinc-400 capitalize">{match.found_item?.category || ''}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-[13px] text-zinc-700 line-clamp-1">
                      {match.lost_item?.title || '—'}
                    </p>
                    <p className="text-[11px] text-zinc-400 capitalize">{match.lost_item?.category || ''}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    {match.score != null ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-zinc-900 rounded-full"
                            style={{ width: `${match.score}%` }}
                          />
                        </div>
                        <span className="text-[12px] text-zinc-500">{match.score}%</span>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_COLORS[match.status] || 'bg-zinc-100 text-zinc-500'}`}>
                      {match.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-[12px] text-zinc-500">
                      {new Date(match.created_at).toLocaleDateString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
