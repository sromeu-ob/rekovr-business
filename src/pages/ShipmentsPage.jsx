import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, Package, PackageCheck, AlertTriangle, Printer, MapPin,
  CheckCircle2, Loader2, ChevronRight,
} from 'lucide-react';
import api, { photoUrl } from '../api';
import { useI18n } from '../contexts/I18nContext';
import { Button, EmptyState, Modal } from '../components/ui';
import { timeAgo } from '../lib/timeAgo';
import {
  shipmentStatusLabel, shipmentStatusTone, bucketOf,
} from '../lib/shipmentStatus';
import PackShipmentModal from '../components/PackShipmentModal';

const DAY_MS = 24 * 60 * 60 * 1000;

function fmtMoney(amount, currency = 'eur') {
  if (amount == null) return '';
  const cur = (currency || 'eur').toUpperCase();
  const n = Number(amount).toFixed(2);
  return cur === 'EUR' ? `${n} €` : `${n} ${cur}`;
}

const CHIP_TONE = {
  amber:   'bg-amber-50 text-amber-700',
  teal:    'bg-teal-50 text-teal-700',
  slate:   'bg-slate-100 text-slate-600',
  emerald: 'bg-emerald-50 text-emerald-700',
  red:     'bg-red-50 text-red-700',
};

const COUNT_TONE = {
  amber: 'bg-amber-100 text-amber-700',
  teal:  'bg-teal-100 text-teal-700',
  slate: 'bg-slate-100 text-slate-600',
  red:   'bg-red-100 text-red-700',
};

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

function Thumb({ photo }) {
  return photo ? (
    <img src={photoUrl(photo)} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
  ) : (
    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
      <Package size={14} className="text-slate-300" />
    </div>
  );
}

function Tile({ id, label, count, tone = 'slate' }) {
  const toneCls = tone === 'amber'
    ? 'text-amber-700'
    : tone === 'red'
      ? 'text-red-600'
      : tone === 'dim'
        ? 'text-slate-300'
        : 'text-slate-900';
  const border = tone === 'red' && count > 0 ? 'border-red-200 bg-red-50/60' : 'border-slate-200 bg-white';
  const scrollTo = () => {
    if (count > 0 && id) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <button
      type="button"
      onClick={scrollTo}
      className={`text-left rounded-lg border px-4 py-3 transition-colors ${border} ${count > 0 && id ? 'hover:border-slate-300' : 'cursor-default'}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`text-2xl font-bold tabular-nums leading-tight mt-0.5 ${toneCls}`}>{count}</p>
    </button>
  );
}

function SectionCard({ id, icon: Icon, title, count, tone = 'slate', danger, headerRight, children }) {
  return (
    <section id={id} className={`bg-white rounded-lg border ${danger ? 'border-red-200' : 'border-slate-200'}`}>
      <header className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100">
        <Icon size={14} className={danger ? 'text-red-500' : 'text-slate-400'} strokeWidth={1.8} />
        <h2 className="text-[13px] font-bold text-slate-900">{title}</h2>
        <span className={`inline-flex items-center justify-center min-w-[20px] h-[18px] px-1.5 rounded-full text-[10.5px] font-bold tabular-nums ${COUNT_TONE[tone]}`}>
          {count}
        </span>
        {headerRight && <div className="ml-auto flex items-center gap-2">{headerRight}</div>}
      </header>
      <div className="divide-y divide-slate-50">{children}</div>
    </section>
  );
}

export default function ShipmentsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const goDetail = (id) => navigate(`/shipments/${id}`);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [packTarget, setPackTarget] = useState(null);
  const [pickupOpen, setPickupOpen] = useState(false);
  const [pickupBusy, setPickupBusy] = useState(false);
  const [pickupError, setPickupError] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/business/shipments');
      setShipments(res.data?.shipments || []);
    } catch {
      setShipments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const groups = { incidents: [], packing: [], packed: [], transit: [] };
  for (const s of shipments) {
    const b = bucketOf(s.status);
    if (b) groups[b].push(s);
  }

  const packedIds = groups.packed.map(s => s.shipment_id);

  const requestPickup = async () => {
    setPickupBusy(true);
    setPickupError(null);
    try {
      await api.post('/business/shipments/pickup', { shipment_ids: packedIds });
      setPickupOpen(false);
      await load();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setPickupError((typeof detail === 'string' && detail) || t('shipPickupFailed'));
    } finally {
      setPickupBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  const isEmpty = shipments.length === 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-slate-900">{t('shipmentsTitle')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('shipmentsSubtitle')}</p>
        </div>
        {packedIds.length > 0 && (
          <Button
            variant="accent"
            leftIcon={Truck}
            onClick={() => { setPickupError(null); setPickupOpen(true); }}
            className="flex-shrink-0"
            data-testid="request-pickup-btn"
          >
            {t('shipRequestPickup')} · {packedIds.length}
          </Button>
        )}
      </div>

      {isEmpty ? (
        <div className="bg-white rounded-lg border border-slate-200">
          <EmptyState icon={Truck} title={t('shipEmptyTitle')} description={t('shipEmptyDesc')} />
        </div>
      ) : (
        <>
          {/* Tiles — the pulse of the pipeline */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <Tile id="sec-packing" label={t('shipTilePacking')} count={groups.packing.length} tone="amber" />
            <Tile id="sec-packed" label={t('shipTilePacked')} count={groups.packed.length} tone="default" />
            <Tile id="sec-transit" label={t('shipTileTransit')} count={groups.transit.length} tone="dim" />
            <Tile id="sec-incidents" label={t('shipTileIncidents')} count={groups.incidents.length} tone="red" />
          </div>

          <div className="space-y-4">
            {/* Incidents — always first, never silenced */}
            {groups.incidents.length > 0 && (
              <SectionCard id="sec-incidents" icon={AlertTriangle} title={t('shipSecIncidents')} count={groups.incidents.length} tone="red" danger>
                {groups.incidents.map(s => (
                  <button key={s.shipment_id} type="button" onClick={() => goDetail(s.shipment_id)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors">
                    <Thumb photo={s.item?.photo} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-semibold text-slate-900 truncate">{s.item?.title || '—'}</p>
                      <p className="text-[11.5px] text-slate-400 truncate mt-px">
                        {[s.destination?.city, s.destination?.country].filter(Boolean).join(', ')}
                      </p>
                    </div>
                    <span className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full ${CHIP_TONE.red}`}>
                      {shipmentStatusLabel(s.status, t)}
                    </span>
                    <ChevronRight size={15} className="text-slate-200 flex-shrink-0" />
                  </button>
                ))}
              </SectionCard>
            )}

            {/* To pack */}
            {groups.packing.length > 0 && (
              <SectionCard id="sec-packing" icon={Package} title={t('shipSecPacking')} count={groups.packing.length} tone="amber">
                {groups.packing.map(s => (
                  <div key={s.shipment_id} className="flex items-center gap-3 px-4 py-3">
                    <button type="button" onClick={() => goDetail(s.shipment_id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                      <Thumb photo={s.item?.photo} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13.5px] font-semibold text-slate-900 truncate">{s.item?.title || '—'}</p>
                        <p className="text-[11.5px] text-slate-400 truncate mt-px flex items-center gap-1">
                          <MapPin size={10} className="flex-shrink-0" />
                          {[s.destination?.city, s.destination?.country].filter(Boolean).join(', ')}
                          {s.shipping_total != null && (
                            <span className="text-slate-500 font-medium">
                              · {t('shipDeliveryPaid').replace('{amount}', fmtMoney(s.shipping_total, s.currency))}
                            </span>
                          )}
                        </p>
                      </div>
                    </button>
                    <AgeChip dateStr={s.created_at} />
                    <Button variant="primary" size="sm" leftIcon={Package} onClick={() => setPackTarget(s)} data-testid="pack-btn">
                      {t('shipPack')}
                    </Button>
                  </div>
                ))}
              </SectionCard>
            )}

            {/* Packed — ready for pickup */}
            {groups.packed.length > 0 && (
              <SectionCard
                id="sec-packed"
                icon={PackageCheck}
                title={t('shipSecPacked')}
                count={groups.packed.length}
                tone="teal"
                headerRight={<span className="text-[11.5px] font-medium text-slate-400">{t('shipPackedHint')}</span>}
              >
                {groups.packed.map(s => (
                  <div key={s.shipment_id} className="flex items-center gap-3 px-4 py-3">
                    <button type="button" onClick={() => goDetail(s.shipment_id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                      <Thumb photo={s.item?.photo} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13.5px] font-semibold text-slate-900 truncate">{s.item?.title || '—'}</p>
                        <p className="text-[11.5px] text-slate-400 truncate mt-px">
                          {t('shipPackedAgo').replace('{time}', timeAgo(s.packed_at || s.created_at, t))}
                        </p>
                      </div>
                    </button>
                    {s.bag_code && (
                      <span className="font-mono text-[11px] text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md whitespace-nowrap">
                        {s.bag_code}
                      </span>
                    )}
                    {s.label_url && (
                      <Button variant="secondary" size="sm" leftIcon={Printer} onClick={() => window.open(s.label_url, '_blank', 'noopener')}>
                        {t('shipLabel')}
                      </Button>
                    )}
                  </div>
                ))}
              </SectionCard>
            )}

            {/* On the way — passive */}
            {groups.transit.length > 0 && (
              <SectionCard id="sec-transit" icon={Truck} title={t('shipSecTransit')} count={groups.transit.length} tone="slate">
                {groups.transit.map(s => (
                  <button key={s.shipment_id} type="button" onClick={() => goDetail(s.shipment_id)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors">
                    <Thumb photo={s.item?.photo} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-semibold text-slate-900 truncate">{s.item?.title || '—'}</p>
                      <p className="text-[11.5px] text-slate-400 truncate mt-px">
                        {s.tracking_number
                          ? <span className="font-mono">{s.tracking_number}</span>
                          : [s.destination?.city, s.destination?.country].filter(Boolean).join(', ')}
                      </p>
                    </div>
                    <span className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full ${CHIP_TONE[shipmentStatusTone(s.status)]}`}>
                      {shipmentStatusLabel(s.status, t)}
                    </span>
                    <ChevronRight size={15} className="text-slate-200 flex-shrink-0" />
                  </button>
                ))}
                <div className="px-4 py-2.5 text-[11.5px] text-slate-400 bg-slate-50/60">
                  {t('shipDeliveredHint')}
                </div>
              </SectionCard>
            )}
          </div>
        </>
      )}

      {/* Pack modal */}
      <PackShipmentModal
        shipment={packTarget}
        open={!!packTarget}
        onClose={() => { setPackTarget(null); load(); }}
        onPacked={() => {}}
      />

      {/* Batch pickup confirmation */}
      <Modal
        open={pickupOpen}
        onClose={() => !pickupBusy && setPickupOpen(false)}
        title={t('shipPickupModalTitle')}
        size="sm"
      >
        <div className="flex flex-col gap-3">
          <p className="text-[13.5px] text-slate-600">
            {packedIds.length === 1
              ? t('shipPickupModalDescOne')
              : t('shipPickupModalDesc').replace('{n}', packedIds.length)}
          </p>
          <div className="flex items-start gap-2.5 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5">
            <Truck size={15} className="text-slate-400 flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-slate-500 leading-snug">{t('shipPickupNote')}</p>
          </div>
          {pickupError && (
            <div className="rounded-md bg-red-50 border border-red-100 px-3 py-2 text-[12.5px] text-red-700">
              {pickupError}
            </div>
          )}
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setPickupOpen(false)} disabled={pickupBusy}>{t('cancel')}</Button>
            <Button variant="accent" leftIcon={pickupBusy ? undefined : Truck} loading={pickupBusy} onClick={requestPickup} data-testid="confirm-pickup-btn">
              {t('shipPickupConfirm')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
