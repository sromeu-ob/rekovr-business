import { useEffect, useState } from 'react';
import { Package, GitCompare, CheckCircle, TrendingUp } from 'lucide-react';
import api from '../api';

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[12px] font-medium text-zinc-400 uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center">
          <Icon size={15} className="text-zinc-400" />
        </div>
      </div>
      <p className="text-[32px] font-extrabold text-zinc-900 leading-none">{value ?? '—'}</p>
      {sub && <p className="text-[12px] text-zinc-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage({ auth }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [itemsRes, matchesRes] = await Promise.all([
          api.get('/business/items?limit=1'),
          api.get('/business/items/matches/list?limit=1'),
        ]);
        setStats({
          totalItems: itemsRes.data.total,
          totalMatches: matchesRes.data.total,
          activeItems: null,
          recovered: null,
        });
      } catch {
        setStats({ totalItems: 0, totalMatches: 0 });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-[22px] font-extrabold text-zinc-900">Dashboard</h2>
        <p className="text-[13px] text-zinc-400 mt-1">Overview of your organization's lost & found activity.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard icon={Package} label="Total items" value={stats?.totalItems} sub="registered found items" />
          <StatCard icon={GitCompare} label="Matches" value={stats?.totalMatches} sub="total matches found" />
          <StatCard icon={CheckCircle} label="Recovered" value="—" sub="coming soon" />
          <StatCard icon={TrendingUp} label="Recovery rate" value="—" sub="coming soon" />
        </div>
      )}

      <div className="mt-8 bg-white rounded-2xl border border-zinc-100 p-6">
        <p className="text-[13px] font-semibold text-zinc-900 mb-1">Getting started</p>
        <p className="text-[12px] text-zinc-500">
          Register found items using the <strong>Found Items</strong> section. The AI will automatically
          generate a title, description and category from a photo. Matches with lost item reports are
          created automatically in the background.
        </p>
      </div>
    </div>
  );
}
