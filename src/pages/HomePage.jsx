import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox, ClipboardCheck, PackageCheck, IdCard, ArrowRight, Package, CheckCircle2 } from 'lucide-react';
import api from '../api';
import { useI18n } from '../contexts/I18nContext';

function timeAgo(dateStr, t) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('justNow');
  if (mins < 60) return `${mins}${t('minutesAgo')}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}${t('hoursAgo')}`;
  const days = Math.floor(hours / 24);
  return `${days}${t('daysAgo')}`;
}

function SectionCard({ icon: Icon, title, count, seeAllHref, emptyLabel, children, testId }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  return (
    <section data-testid={testId} className="bg-white rounded-lg border border-slate-200">
      <header className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <Icon size={15} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold tabular-nums">
            {count}
          </span>
        </div>
        {count > 0 && seeAllHref && (
          <button
            type="button"
            onClick={() => navigate(seeAllHref)}
            className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800"
          >
            {t('seeAll')}
            <ArrowRight size={12} />
          </button>
        )}
      </header>
      {count === 0 ? (
        <div className="px-5 py-8 flex items-center justify-center gap-2 text-sm text-slate-500">
          <CheckCircle2 size={14} className="text-emerald-500" />
          {emptyLabel}
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">{children}</ul>
      )}
    </section>
  );
}

function MatchRow({ m, onClick }) {
  const { t } = useI18n();
  return (
    <li
      onClick={onClick}
      className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
    >
      {m.found_photo ? (
        <img src={m.found_photo} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
          <Package size={14} className="text-slate-300" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 line-clamp-1">{m.found_title || '—'}</p>
        <p className="text-xs text-slate-500 line-clamp-1 capitalize">
          {m.found_category || '—'} · {timeAgo(m.created_at, t)}
        </p>
      </div>
      {typeof m.score === 'number' && (
        <span className="text-xs font-medium text-slate-500 tabular-nums">
          {Math.round(m.score * 100)}%
        </span>
      )}
    </li>
  );
}

function ItemRow({ item, onClick }) {
  const { t } = useI18n();
  const owner = item.identified_owner || {};
  return (
    <li
      onClick={onClick}
      className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
    >
      {item.photos?.[0] ? (
        <img src={item.photos[0]} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
          <Package size={14} className="text-slate-300" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 line-clamp-1">{item.title || '—'}</p>
        <p className="text-xs text-slate-500 line-clamp-1">
          {owner.owner_name || owner.doc_number_masked || '—'} · {timeAgo(item.created_at, t)}
        </p>
      </div>
      <IdCard size={14} className="text-amber-500" />
    </li>
  );
}

export default function HomePage({ auth }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/business/items/inbox')
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  const pr = data?.pending_review || { total: 0, matches: [] };
  const rd = data?.ready_to_deliver || { total: 0, matches: [] };
  const pc = data?.pending_contact || { total: 0, items: [] };
  const allClear = pr.total === 0 && rd.total === 0 && pc.total === 0;

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <Inbox size={20} className="text-slate-700" />
        <h1 data-testid="home-heading" className="text-2xl font-semibold text-slate-900">
          {t('homeTitle')}
        </h1>
      </div>
      <p className="text-sm text-slate-500 mb-8">
        {auth?.user?.name ? t('homeGreeting').replace('{name}', auth.user.name.split(' ')[0]) : t('homeSubtitle')}
      </p>

      {allClear && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-5 py-4 mb-6 flex items-center gap-3">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <p className="text-sm font-medium text-emerald-800">{t('homeAllClear')}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard
          testId="home-pending-review"
          icon={ClipboardCheck}
          title={t('homePendingReview')}
          count={pr.total}
          seeAllHref="/matches"
          emptyLabel={t('homePendingReviewEmpty')}
        >
          {pr.matches.map(m => (
            <MatchRow key={m.match_id} m={m} onClick={() => navigate(`/matches/${m.found_item_id}`)} />
          ))}
        </SectionCard>

        <SectionCard
          testId="home-ready-deliver"
          icon={PackageCheck}
          title={t('homeReadyDeliver')}
          count={rd.total}
          seeAllHref="/matches"
          emptyLabel={t('homeReadyDeliverEmpty')}
        >
          {rd.matches.map(m => (
            <MatchRow key={m.match_id} m={m} onClick={() => navigate(`/matches/${m.found_item_id}`)} />
          ))}
        </SectionCard>

        <SectionCard
          testId="home-pending-contact"
          icon={IdCard}
          title={t('homePendingContact')}
          count={pc.total}
          seeAllHref="/items"
          emptyLabel={t('homePendingContactEmpty')}
        >
          {pc.items.map(item => (
            <ItemRow key={item.item_id} item={item} onClick={() => navigate(`/items/${item.item_id}`)} />
          ))}
        </SectionCard>
      </div>
    </div>
  );
}
