import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Package, Printer, ExternalLink, AlertTriangle, MapPin,
} from 'lucide-react';
import api, { photoUrl } from '../api';
import { useI18n } from '../contexts/I18nContext';
import { EmptyState } from '../components/ui';
import { shipmentStatusLabel, shipmentStatusTone } from '../lib/shipmentStatus';

const CHIP_TONE = {
  amber:   'bg-amber-50 text-amber-700',
  teal:    'bg-teal-50 text-teal-700',
  slate:   'bg-slate-100 text-slate-600',
  emerald: 'bg-emerald-50 text-emerald-700',
  red:     'bg-red-50 text-red-700',
};

const INCIDENT_STATES = new Set(['exception', 'returned']);

function fmtMoney(amount, currency = 'eur') {
  if (amount == null) return '—';
  const cur = (currency || 'eur').toUpperCase();
  const n = Number(amount).toFixed(2);
  return cur === 'EUR' ? `${n} €` : `${n} ${cur}`;
}

function Fact({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-2.5 border-b border-slate-50 last:border-b-0 text-[12.5px]">
      <span className="text-slate-400 flex-shrink-0">{label}</span>
      <span className="text-slate-900 font-medium text-right">{children}</span>
    </div>
  );
}

export default function ShipmentDetailPage() {
  const { shipmentId } = useParams();
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/business/shipments/${shipmentId}`);
        if (!cancelled) setShipment(res.data);
      } catch (err) {
        if (!cancelled) setNotFound(err.response?.status === 404);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [shipmentId]);

  const fmtEventTime = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString(language, {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      });
    } catch { return iso; }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !shipment) {
    return (
      <div>
        <button onClick={() => navigate('/shipments')} className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 mb-4">
          <ChevronLeft size={13} /> {t('shipDetailBack')}
        </button>
        <div className="bg-white rounded-lg border border-slate-200">
          <EmptyState icon={Package} title={t('shipDetailNotFound')} />
        </div>
      </div>
    );
  }

  const item = shipment.item || {};
  const dest = shipment.destination || {};
  const events = [...(shipment.events || [])].reverse();
  const isIncident = INCIDENT_STATES.has(shipment.status);

  // The carrier's reason lives in the newest incident-status event.
  const incidentEvent = events.find(e => INCIDENT_STATES.has(e.status));
  const incidentReason = incidentEvent?.description || t('shipIncidentDefault');

  const destLines = [
    dest.address_line1,
    dest.address_line2,
    [dest.postal_code, dest.city].filter(Boolean).join(' '),
    dest.country,
  ].filter(Boolean);

  return (
    <div>
      {/* Breadcrumb */}
      <button onClick={() => navigate('/shipments')} className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 mb-3">
        <ChevronLeft size={13} /> {t('shipDetailBack')}
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          {item.photo ? (
            <img src={photoUrl(item.photo)} alt="" className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Package size={17} className="text-slate-300" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-slate-900 truncate">{item.title || '—'}</h1>
            <p className="text-[12px] text-slate-400 font-mono mt-0.5">{shipment.shipment_id}</p>
          </div>
        </div>
        <span className={`text-[11.5px] font-bold px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${CHIP_TONE[shipmentStatusTone(shipment.status)]}`}>
          {shipmentStatusLabel(shipment.status, t)}
        </span>
      </div>

      {/* Incident banner */}
      {isIncident && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 mb-5">
          <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-red-700">{t('shipIncidentTitle')}</p>
            <p className="text-[12px] text-red-600 leading-snug mt-0.5">{incidentReason}</p>
          </div>
        </div>
      )}

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-5 items-start">

        {/* Timeline */}
        <section className="bg-white rounded-lg border border-slate-200">
          <header className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-[13px] font-bold text-slate-900">{t('shipTimeline')}</h2>
          </header>
          {events.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">{t('shipNoTimeline')}</p>
          ) : (
            <ol className="px-4 py-3">
              {events.map((e, i) => {
                const active = i === 0;
                return (
                  <li key={i} className="flex gap-3 relative pb-4 last:pb-0">
                    {i < events.length - 1 && (
                      <span className="absolute left-[5px] top-4 bottom-0 w-px bg-slate-100" aria-hidden="true" />
                    )}
                    <span className={`mt-1 w-[11px] h-[11px] rounded-full border-[3px] bg-white flex-shrink-0 relative z-10 ${active ? 'border-teal-500' : 'border-slate-300'}`} />
                    <div className="min-w-0 -mt-0.5">
                      <p className="text-[13px] font-semibold text-slate-900">
                        {e.description || shipmentStatusLabel(e.status, t)}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {fmtEventTime(e.timestamp)}
                        {e.location ? ` · ${e.location}` : ''}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {/* Facts + actions */}
        <div className="space-y-4">
          <section className="bg-white rounded-lg border border-slate-200">
            <header className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
              <MapPin size={13} className="text-slate-400" strokeWidth={1.8} />
              <h2 className="text-[13px] font-bold text-slate-900">{t('shipRecipient')}</h2>
            </header>
            <div className="px-4 py-3">
              <p className="text-[13px] font-semibold text-slate-900">{dest.name || '—'}</p>
              <p className="text-[12px] text-slate-500 leading-relaxed mt-0.5">{destLines.join(', ')}</p>
            </div>
          </section>

          <section className="bg-white rounded-lg border border-slate-200">
            <header className="px-4 py-3 border-b border-slate-100">
              <h2 className="text-[13px] font-bold text-slate-900">{t('shipTransport')}</h2>
            </header>
            {shipment.tracking_number && (
              <Fact label={t('shipFactTracking')}>
                {shipment.tracking_url ? (
                  <a href={shipment.tracking_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-teal-700 font-mono">
                    {shipment.tracking_number} <ExternalLink size={11} />
                  </a>
                ) : (
                  <span className="font-mono">{shipment.tracking_number}</span>
                )}
              </Fact>
            )}
            {shipment.bag_code && <Fact label={t('shipFactBag')}><span className="font-mono">{shipment.bag_code}</span></Fact>}
            {shipment.coverage != null && <Fact label={t('shipFactCoverage')}>{fmtMoney(shipment.coverage, shipment.currency)}</Fact>}
            {shipment.shipping_total != null && <Fact label={t('shipFactShippingPaid')}>{fmtMoney(shipment.shipping_total, shipment.currency)}</Fact>}
          </section>

          {shipment.label_url && (
            <button
              onClick={() => window.open(shipment.label_url, '_blank', 'noopener')}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Printer size={14} /> {t('shipReprintLabel')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
