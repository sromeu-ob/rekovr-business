import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, PackageCheck, IdCard, ArrowRight, Package,
  CheckCircle2, Clock, Activity, ChevronRight, CreditCard, Truck, MapPin,
} from 'lucide-react';
import api from '../api';
import { useI18n } from '../contexts/I18nContext';
import { ScoreRing } from '../components/ui';
import { timeAgo } from '../lib/timeAgo';
import { matchStatusLabel, coverageSubtext, matchStatusHint } from '../lib/matchStatus';

const READY_PAGE_SIZE = 20;
const DAY_MS = 24 * 60 * 60 * 1000;

function AgeChip({ dateStr }) {
  const { t } = useI18n();
  if (!dateStr) return null;
  const stale = Date.now() - new Date(dateStr).getTime() > DAY_MS;
  return (
    <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${
      stale ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
    }`}>
      {timeAgo(dateStr, t)}
    </span>
  );
}

const COUNT_TONE = {
  hot:   'bg-orange-100 text-orange-700',
  teal:  'bg-teal-100 text-teal-700',
  slate: 'bg-slate-100 text-slate-600',
};

function QueueCard({ icon: Icon, title, count, tone = 'slate', seeAllHref, emptyLabel, children, footer, testId }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  return (
    <section data-testid={testId} className="bg-white rounded-lg border border-slate-200">
      <header className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100">
        <Icon size={14} className="text-slate-400" strokeWidth={1.8} />
        <h2 className="text-[13px] font-bold text-slate-900">{title}</h2>
        {count > 0 && (
          <span className={`inline-flex items-center justify-center min-w-[20px] h-[18px] px-1.5 rounded-full text-[10.5px] font-bold tabular-nums ${COUNT_TONE[tone]}`}>
            {count}
          </span>
        )}
        {count > 0 && seeAllHref && (
          <button
            type="button"
            onClick={() => navigate(seeAllHref)}
            className="ml-auto inline-flex items-center gap-1 text-[11.5px] font-semibold text-teal-700 hover:text-teal-800"
          >
            {t('seeAll')}
            <ArrowRight size={11} />
          </button>
        )}
      </header>
      {count === 0 ? (
        <div className="px-5 py-7 flex items-center justify-center gap-2 text-sm text-slate-500">
          <CheckCircle2 size={14} className="text-emerald-500" />
          {emptyLabel}
        </div>
      ) : (
        <>
          <div className="divide-y divide-slate-50">{children}</div>
          {footer}
        </>
      )}
    </section>
  );
}

function DecideRow({ m, onClick, t }) {
  const hasVerification = m.verification_score != null;
  const passed = hasVerification && m.status !== 'pending_review';
  const pct = hasVerification ? Math.round(m.verification_score * 100) : null;
  return (
    <button type="button" onClick={onClick} className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors">
      <ScoreRing score={m.score} size={38} />
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-slate-900 truncate">{m.found_title || '—'}</p>
        <p className="text-[11.5px] text-slate-400 truncate mt-px">
          {hasVerification ? (
            <>
              <span className={passed ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                {passed ? t('verificationPassed') : t('verificationBelowThreshold')} · {pct}%
              </span>
              {m.answers_total > 0 && (
                <> — {t('answersCorrectSummary').replace('{x}', m.answers_correct).replace('{y}', m.answers_total)}</>
              )}
            </>
          ) : (
            t('metaNoVerification')
          )}
        </p>
      </div>
      <AgeChip dateStr={m.created_at} />
      <ChevronRight size={15} className="text-slate-200 flex-shrink-0" />
    </button>
  );
}

function DeliverRow({ m, onClick, t }) {
  return (
    <button type="button" onClick={onClick} className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors">
      {m.found_photo ? (
        <img src={m.found_photo} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
          <Package size={14} className="text-slate-300" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-slate-900 truncate">{m.found_title || '—'}</p>
        <p className="text-[11.5px] text-slate-400 truncate mt-px" title={matchStatusHint(m, t)}>
          <span className="font-semibold text-slate-500">{matchStatusLabel(m, t)}</span>
          {coverageSubtext(m, t) && <> · {coverageSubtext(m, t)}</>}
        </p>
      </div>
      <AgeChip dateStr={m.created_at} />
      <ChevronRight size={15} className="text-slate-200 flex-shrink-0" />
    </button>
  );
}

function ShipRow({ s, onClick, t }) {
  const dest = [s.destination?.city, s.destination?.country].filter(Boolean).join(', ');
  return (
    <button type="button" onClick={onClick} className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors">
      {s.found_photo ? (
        <img src={s.found_photo} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
          <Package size={14} className="text-slate-300" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-slate-900 truncate">{s.found_title || '—'}</p>
        <p className="text-[11.5px] text-slate-400 truncate mt-px flex items-center gap-1">
          <MapPin size={10} className="flex-shrink-0" />
          {dest || t('homeToShipMeta')}
        </p>
      </div>
      <AgeChip dateStr={s.created_at} />
      <ChevronRight size={15} className="text-slate-200 flex-shrink-0" />
    </button>
  );
}

function ContactRow({ item, onClick, t }) {
  const owner = item.identified_owner || {};
  return (
    <button type="button" onClick={onClick} className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors">
      {item.photos?.[0] ? (
        <img src={item.photos[0]} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
          <Package size={14} className="text-slate-300" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-slate-900 truncate">
          {owner.owner_name || '—'}
          {owner.doc_number_masked && (
            <span className="ml-2 font-mono font-normal text-[11px] text-slate-400">{owner.doc_number_masked}</span>
          )}
        </p>
        <p className="text-[11.5px] text-slate-400 truncate mt-px">
          {item.title} · {t('contactMetaNoUser')}
        </p>
      </div>
      <AgeChip dateStr={item.created_at} />
      <ChevronRight size={15} className="text-slate-200 flex-shrink-0" />
    </button>
  );
}

function WaitGroup({ icon: Icon, label, bucket, onRowClick, t }) {
  if (!bucket || bucket.total === 0) return null;
  return (
    <div className="py-2 first:pt-0 last:pb-0">
      <div className="flex items-center gap-2 text-[11.5px] font-semibold text-slate-500">
        <Icon size={12} className="text-slate-300" strokeWidth={1.8} />
        <span className="flex-1">{label}</span>
        <span className="text-[10.5px] font-bold text-slate-400 tabular-nums">{bucket.total}</span>
      </div>
      {(bucket.matches || []).slice(0, 3).map(m => (
        <button
          key={m.match_id}
          type="button"
          onClick={() => onRowClick(m)}
          className="w-full flex items-baseline gap-2 pl-5 pr-0 pt-1.5 text-left group"
        >
          <span className="text-[12px] text-slate-600 truncate min-w-0 group-hover:text-slate-900 transition-colors">
            {m.found_title || '—'}
          </span>
          <span className="ml-auto text-[10.5px] text-slate-300 whitespace-nowrap">{timeAgo(m.created_at, t)}</span>
        </button>
      ))}
    </div>
  );
}

const ACT_DOT = {
  match_created:       'bg-slate-400',
  verification_scored: 'bg-teal-300',
  match_accepted:      'bg-teal-600',
  match_rejected:      'bg-rose-400',
  delivered:           'bg-teal-500',
};

function activityLabel(ev, t) {
  const pct = (s) => (s != null ? `${Math.round(s * 100)}%` : '—');
  switch (ev.type) {
    case 'match_created':
      return t('tlMatchCreated').replace('{score}', pct(ev.score));
    case 'verification_scored':
      return t('tlVerification').replace('{score}', pct(ev.verification_score));
    case 'match_accepted':
      return ev.actor_name ? t('tlAcceptedBy').replace('{name}', ev.actor_name) : t('tlAccepted');
    case 'match_rejected':
      return ev.actor_name ? t('tlRejectedBy').replace('{name}', ev.actor_name) : t('tlRejected');
    case 'delivered':
      return t('tlDelivered').replace('{name}', ev.recipient_name || '—');
    default:
      return ev.type;
  }
}

export default function HomePage({ auth }) {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const [data, setData] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/business/items/inbox', { params: { ready_limit: READY_PAGE_SIZE } }).catch(() => null),
      api.get('/business/items/activity', { params: { limit: 10 } }).catch(() => null),
    ])
      .then(([inboxRes, actRes]) => {
        setData(inboxRes?.data || null);
        setActivity(actRes?.data?.events || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const loadMoreReady = async () => {
    if (!data) return;
    setLoadingMore(true);
    try {
      const res = await api.get('/business/items/inbox', {
        params: {
          ready_offset: data.ready_to_deliver.matches.length,
          ready_limit: READY_PAGE_SIZE,
        },
      });
      setData(prev => ({
        ...prev,
        ready_to_deliver: {
          ...res.data.ready_to_deliver,
          matches: [...prev.ready_to_deliver.matches, ...res.data.ready_to_deliver.matches],
        },
      }));
    } catch {} finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  const td = data?.to_decide || { total: 0, matches: [] };
  const rd = data?.ready_to_deliver || { total: 0, matches: [] };
  const ts = data?.to_ship || { total: 0, shipments: [] };
  const pc = data?.pending_contact || { total: 0, items: [] };
  const wv = data?.waiting_verification || { total: 0, matches: [] };
  const wp = data?.waiting_payment || { total: 0, matches: [] };

  const actionable = td.total + rd.total + ts.total + pc.total;
  const waits = wv.total + wp.total;
  const allClear = actionable === 0;

  const firstName = auth?.user?.name?.split(' ')[0];
  const dateStr = new Date().toLocaleDateString(language, { weekday: 'long', day: 'numeric', month: 'long' });
  const subParts = [
    allClear
      ? t('inboxNothingPending')
      : actionable === 1
        ? t('inboxOnePendingAction')
        : t('inboxPendingActions').replace('{n}', actionable),
    waits > 0 ? t('inboxActiveWaits').replace('{n}', waits) : null,
    dateStr,
  ].filter(Boolean).join(' · ');

  const goToMatch = (m) => navigate(`/matches/${m.found_item_id}`);

  return (
    <div>
      <div className="mb-7">
        <h1 data-testid="home-heading" className="text-2xl font-semibold text-slate-900">
          {t('homeTitle')}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {firstName ? `${t('greetingHello').replace('{name}', firstName)} — ` : ''}{subParts}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">

        {/* MAIN — actionable queues by priority */}
        <div className="space-y-4">
          {allClear ? (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-5 py-4">
              <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
              <p className="text-sm font-medium text-emerald-800">{t('homeAllClear')}</p>
            </div>
          ) : (
            <>
              <QueueCard
                testId="home-pending-review"
                icon={ShieldCheck}
                title={t('qToDecide')}
                count={td.total}
                tone="hot"
                seeAllHref="/matches?bucket=pending_review"
                emptyLabel={t('qToDecideEmpty')}
              >
                {td.matches.map(m => (
                  <DecideRow key={m.match_id} m={m} onClick={() => goToMatch(m)} t={t} />
                ))}
              </QueueCard>

              <QueueCard
                testId="home-ready-deliver"
                icon={PackageCheck}
                title={t('homeReadyDeliver')}
                count={rd.total}
                tone="teal"
                emptyLabel={t('homeReadyDeliverEmpty')}
                footer={rd.matches.length < rd.total ? (
                  <div className="px-4 py-3 border-t border-slate-100">
                    <button
                      data-testid="home-ready-load-more"
                      type="button"
                      onClick={loadMoreReady}
                      disabled={loadingMore}
                      className="w-full py-2 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50"
                    >
                      {loadingMore ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
                        </span>
                      ) : (
                        `${t('loadMore')} · ${rd.total - rd.matches.length} ${t('remaining')}`
                      )}
                    </button>
                  </div>
                ) : null}
              >
                {rd.matches.map(m => (
                  <DeliverRow key={m.match_id} m={m} onClick={() => goToMatch(m)} t={t} />
                ))}
              </QueueCard>

              <QueueCard
                testId="home-to-ship"
                icon={Truck}
                title={t('homeToShip')}
                count={ts.total}
                tone="teal"
                seeAllHref="/shipments"
                emptyLabel={t('homeToShipEmpty')}
              >
                {ts.shipments.map(s => (
                  <ShipRow key={s.shipment_id} s={s} onClick={() => navigate('/shipments')} t={t} />
                ))}
              </QueueCard>

              <QueueCard
                testId="home-pending-contact"
                icon={IdCard}
                title={t('homePendingContact')}
                count={pc.total}
                tone="slate"
                seeAllHref="/items?pending_contact=true"
                emptyLabel={t('homePendingContactEmpty')}
              >
                {pc.items.map(item => (
                  <ContactRow key={item.item_id} item={item} onClick={() => navigate(`/items/${item.item_id}`)} t={t} />
                ))}
              </QueueCard>
            </>
          )}
        </div>

        {/* SIDE — waits + recent activity (always visible) */}
        <div className="space-y-4">
          {waits > 0 && (
            <div data-testid="home-waits" className="bg-white rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100">
                <Clock size={13} className="text-slate-400" strokeWidth={1.8} />
                <span className="text-xs font-bold text-slate-600">{t('waitTitle')}</span>
              </div>
              <div className="px-4 py-2.5 divide-y divide-slate-50">
                <WaitGroup icon={ShieldCheck} label={t('waitVerification')} bucket={wv} onRowClick={goToMatch} t={t} />
                <WaitGroup icon={CreditCard} label={t('waitPayment')} bucket={wp} onRowClick={goToMatch} t={t} />
              </div>
            </div>
          )}

          <div data-testid="home-activity" className="bg-white rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100">
              <Activity size={13} className="text-slate-400" strokeWidth={1.8} />
              <span className="text-xs font-bold text-slate-600">{t('activityTitle')}</span>
            </div>
            <div className="px-4 py-1">
              {activity.length === 0 ? (
                <p className="py-4 text-xs text-slate-400 text-center">{t('noActivity')}</p>
              ) : (
                activity.map((ev, i) => (
                  <div key={i} className={`flex gap-2.5 py-2 ${i > 0 ? 'border-t border-slate-50' : ''}`}>
                    <span className={`w-[7px] h-[7px] rounded-full mt-[5px] flex-shrink-0 ${ACT_DOT[ev.type] || 'bg-slate-300'}`} />
                    <div className="min-w-0">
                      <p className="text-xs text-slate-600 leading-snug">
                        {activityLabel(ev, t)}
                        {ev.item_title && <span className="text-slate-400"> — {ev.item_title}</span>}
                      </p>
                      <p className="text-[10.5px] text-slate-300 mt-0.5">{timeAgo(ev.at, t)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
