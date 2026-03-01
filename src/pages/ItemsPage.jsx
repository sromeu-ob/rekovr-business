import { useEffect, useState } from 'react';
import { Plus, Package } from 'lucide-react';
import api from '../api';

const STATUS_COLORS = {
  active:    'bg-green-50 text-green-700',
  recovered: 'bg-blue-50 text-blue-700',
  expired:   'bg-zinc-100 text-zinc-500',
};

export default function ItemsPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/business/items?limit=50')
      .then(res => { setItems(res.data.items); setTotal(res.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-[22px] font-extrabold text-zinc-900">Found Items</h2>
          <p className="text-[13px] text-zinc-400 mt-1">{total} items registered</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded-xl text-[13px] font-semibold hover:bg-zinc-800 transition"
          onClick={() => alert('New item form — coming in next sprint')}
        >
          <Plus size={15} />
          New item
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
            <Package size={20} className="text-zinc-400" />
          </div>
          <p className="text-[14px] font-semibold text-zinc-700">No items yet</p>
          <p className="text-[12px] text-zinc-400 mt-1">Start by registering your first found item.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Item</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Category</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.item_id} className="border-b border-zinc-50 hover:bg-zinc-50 transition">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {item.photos?.[0] ? (
                        <img src={item.photos[0]} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
                          <Package size={14} className="text-zinc-300" />
                        </div>
                      )}
                      <div>
                        <p className="text-[13px] font-medium text-zinc-900 line-clamp-1">{item.title}</p>
                        <p className="text-[11px] text-zinc-400 line-clamp-1">{item.address || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-[12px] text-zinc-500 capitalize">{item.category || '—'}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-[12px] text-zinc-500">
                      {item.date_time ? new Date(item.date_time).toLocaleDateString() : new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_COLORS[item.status] || 'bg-zinc-100 text-zinc-500'}`}>
                      {item.status}
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
