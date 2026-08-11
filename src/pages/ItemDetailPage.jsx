import { useState, useEffect, useRef, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Clock, Tag, Sparkles, ChevronRight, CalendarDays,
  Pencil, HandshakeIcon, X, AlertTriangle, CheckCircle2, Loader2,
  Link, QrCode, Copy, Check, IdCard, UserCheck, Eye, EyeOff, Phone, Package,
} from 'lucide-react';
import QRCode from 'qrcode';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import ImageViewer from '../components/ImageViewer';
import SignaturePad from '../components/SignaturePad';
import DeliveryRecordCard from '../components/DeliveryRecordCard';
import api, { photoUrl } from '../api';
import { useI18n } from '../contexts/I18nContext';
import { ScoreRing } from '../components/ui';
import { timeAgo } from '../lib/timeAgo';
import { matchStatusLabel, coverageSubtext, matchStatusHint } from '../lib/matchStatus';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function ItemMap({ lng, lat }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !lng || !lat) return;
    let map;
    try {
      map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [lng, lat],
        zoom: 14,
        interactive: false,
      });
    } catch (err) {
      // WebGL unavailable (headless browsers, VMs, old kiosks) — degrade to no map
      console.warn('Mapbox map unavailable:', err?.message);
      return;
    }
    new mapboxgl.Marker({ color: '#0f172a' })
      .setLngLat([lng, lat])
      .addTo(map);
    return () => map.remove();
  }, [lng, lat]);

  return <div ref={containerRef} className="w-full h-40 rounded-lg overflow-hidden border border-slate-100" />;
}

// ── Direct Delivery Modal ────────────────────────────────────────────────────

function QRDisplay({ url }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (canvasRef.current && url) {
      QRCode.toCanvas(canvasRef.current, url, { width: 220, margin: 2 });
    }
  }, [url]);
  return (
    <div className="flex flex-col items-center gap-2">
      <canvas ref={canvasRef} className="rounded-lg border border-slate-200" />
      <p className="text-xs text-slate-400 text-center">El receptor escaneja el QR amb el mòbil per signar</p>
    </div>
  );
}

function DirectDeliveryModal({ itemId, onClose, onDelivered }) {
  const [signMode, setSignMode] = useState('B');
  const [name, setName] = useState('');
  const [dni, setDni] = useState('');
  const [sigDataUrl, setSigDataUrl] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [sessionUrl, setSessionUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);

  const canConfirmB = name.trim() && dni.trim() && sigDataUrl;

  async function handleDirectDeliver() {
    setError(null);
    setSubmitting(true);
    try {
      await api.post(`/business/items/${itemId}/direct-deliver`, {
        recipient_name: name.trim(),
        recipient_dni: dni.trim(),
        signature_data_url: sigDataUrl,
        notes: notes.trim() || null,
      });
      onDelivered();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Error en confirmar el lliurament.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateSession() {
    setError(null);
    setCreatingSession(true);
    try {
      const res = await api.post(`/business/items/${itemId}/direct-deliver-session`);
      setSessionUrl(res.data.signing_url);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Error en crear la sessió.');
    } finally {
      setCreatingSession(false);
    }
  }

  function copyUrl() {
    navigator.clipboard?.writeText(sessionUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const MODES = [
    { id: 'B', icon: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>, label: 'Signar aquí', desc: 'El receptor signa al teu dispositiu' },
    { id: 'A', icon: () => <Link size={16} strokeWidth={1.5} />, label: 'Enviar link', desc: 'Envia un link per SMS o email' },
    { id: 'C', icon: () => <QrCode size={16} strokeWidth={1.5} />, label: 'Mostrar QR', desc: 'El receptor escaneja el QR' },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Entrega directa</h3>
            <p className="text-xs text-slate-400 mt-0.5">Sense match ni pagament previ</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Mode selector */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-2">Mode de signatura</p>
            <div className="grid grid-cols-3 gap-2">
              {MODES.map(m => (
                <button key={m.id} onClick={() => { setSignMode(m.id); setSessionUrl(null); setError(null); }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-colors ${
                    signMode === m.id ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                  <span className={signMode === m.id ? 'text-slate-900' : 'text-slate-400'}><m.icon /></span>
                  <span className={`text-[11px] font-semibold leading-tight ${signMode === m.id ? 'text-slate-900' : 'text-slate-500'}`}>
                    {m.label}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-1.5 text-center">
              {MODES.find(m => m.id === signMode)?.desc}
            </p>
          </div>

          {/* Mode B */}
          {signMode === 'B' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 mb-1.5">Nom complet</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Joan García"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:border-teal-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 mb-1.5">DNI / NIE</label>
                  <input value={dni} onChange={e => setDni(e.target.value)} placeholder="12345678A"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:border-teal-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 mb-1.5">Notes (opcional)</label>
                <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Identificació verificada presencialment"
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:border-teal-500 focus:outline-none" />
              </div>
              <SignaturePad onChange={setSigDataUrl} />
              {error && (
                <div className="p-3 rounded-md bg-red-50 border border-red-100 flex items-start gap-2">
                  <AlertTriangle size={14} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              <button onClick={handleDirectDeliver} disabled={!canConfirmB || submitting}
                className="w-full py-3 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                Confirmar entrega
              </button>
            </div>
          )}

          {/* Modes A & C */}
          {(signMode === 'A' || signMode === 'C') && (
            <div className="space-y-4">
              {!sessionUrl ? (
                <>
                  {error && (
                    <div className="p-3 rounded-md bg-red-50 border border-red-100 flex items-start gap-2">
                      <AlertTriangle size={14} className="text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}
                  <button onClick={handleCreateSession} disabled={creatingSession}
                    className="w-full py-3 rounded-md btn-brand text-white text-sm font-medium transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                    {creatingSession ? <Loader2 size={15} className="animate-spin" /> : (
                      signMode === 'A' ? <Link size={15} /> : <QrCode size={15} />
                    )}
                    {signMode === 'A' ? 'Generar link' : 'Generar QR'}
                  </button>
                </>
              ) : (
                <>
                  {signMode === 'C' && <QRDisplay url={sessionUrl} />}
                  {signMode === 'A' && (
                    <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-2">Link de signatura</p>
                      <p className="text-xs font-mono text-slate-700 break-all leading-relaxed">{sessionUrl}</p>
                      <button onClick={copyUrl}
                        className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors">
                        {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        {copied ? 'Copiat!' : 'Copiar link'}
                      </button>
                    </div>
                  )}
                  <div className="bg-amber-50/60 border border-amber-100 rounded-md p-3">
                    <p className="text-xs text-amber-900 leading-relaxed">
                      <strong>Vàlid 15 minuts.</strong> Un cop el receptor hagi signat, l'objecte es marcarà com a lliurat automàticament.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page building blocks ─────────────────────────────────────────────────────

const MATCH_LIMIT = 5;
const ACTIVE_STATUSES = 'pending,pending_verification,pending_review';

const STATUS_DOT = {
  active:    'bg-emerald-500',
  matched:   'bg-amber-400',
  recovered: 'bg-slate-400',
  returned:  'bg-slate-400',
  expired:   'bg-slate-300',
};

const TL_DOT = {
  registered:          'bg-slate-300',
  match_created:       'bg-slate-400',
  verification_scored: 'bg-teal-300',
  info_requested:      'bg-amber-400',
  match_accepted:      'bg-teal-500',
  match_rejected:      'bg-rose-400',
  delivered:           'bg-teal-500',
};

function timelineLabel(ev, t) {
  const pct = (s) => (s != null ? `${Math.round(s * 100)}%` : '—');
  switch (ev.type) {
    case 'registered':
      return ev.actor_name
        ? t('tlRegisteredBy').replace('{name}', ev.actor_name)
        : t('tlRegistered');
    case 'match_created':
      return t('tlMatchCreated').replace('{score}', pct(ev.score));
    case 'verification_scored':
      return t('tlVerification').replace('{score}', pct(ev.verification_score));
    case 'info_requested':
      return ev.actor_name
        ? t('tlInfoRequestedBy').replace('{name}', ev.actor_name)
        : t('tlInfoRequested');
    case 'match_accepted':
      return ev.actor_name
        ? t('tlAcceptedBy').replace('{name}', ev.actor_name)
        : t('tlAccepted');
    case 'match_rejected':
      return ev.actor_name
        ? t('tlRejectedBy').replace('{name}', ev.actor_name)
        : t('tlRejected');
    case 'delivered':
      return t('tlDelivered').replace('{name}', ev.recipient_name || '—');
    default:
      return ev.type;
  }
}

function FactRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Icon size={15} className="text-slate-300 flex-shrink-0" strokeWidth={1.5} />
      <span className="text-[13px] text-slate-400 flex-1">{label}</span>
      <span className="text-[13px] font-medium text-slate-900 text-right">{value}</span>
    </div>
  );
}

function JourneyRail({ step, muted, t }) {
  const labels = [t('railRegistered'), t('railMatch'), t('railDelivered')];
  return (
    <div className="mt-6">
      <div className="flex items-center">
        {[0, 1, 2].map(i => (
          <Fragment key={i}>
            {i > 0 && (
              <div className={`flex-1 h-[2px] rounded-full mx-1.5 ${!muted && i <= step ? 'bg-teal-500' : 'bg-slate-100'}`} />
            )}
            <span
              className={`rounded-full flex-shrink-0 transition-all ${
                muted
                  ? 'w-2 h-2 bg-slate-200'
                  : i < step
                    ? 'w-2.5 h-2.5 bg-teal-500'
                    : i === step
                      ? 'w-2.5 h-2.5 bg-teal-500 ring-4 ring-teal-100'
                      : 'w-2 h-2 bg-slate-200'
              }`}
            />
          </Fragment>
        ))}
      </div>
      <div className="flex justify-between mt-2">
        {labels.map((label, i) => (
          <span
            key={i}
            className={`text-[10px] font-semibold uppercase tracking-wider ${
              i === 1 ? 'text-center' : i === 2 ? 'text-right' : ''
            } ${!muted && i <= step ? 'text-slate-900' : 'text-slate-300'}`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function PanelCard({ icon: Icon, title, chip, children, testId }) {
  return (
    <div data-testid={testId} className="bg-white rounded-lg border border-slate-200">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
        <Icon size={14} className="text-slate-400" strokeWidth={1.5} />
        <span className="text-xs font-semibold text-slate-600">{title}</span>
        {chip && <span className="ml-auto">{chip}</span>}
      </div>
      <div className="px-4 py-3.5">{children}</div>
    </div>
  );
}

export default function ItemDetailPage() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();

  const [item, setItem] = useState(null);
  const [matches, setMatches] = useState([]);
  const [matchTotal, setMatchTotal] = useState(0);
  const [committedTotal, setCommittedTotal] = useState(0);
  const [discardedTotal, setDiscardedTotal] = useState(0);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewerIndex, setViewerIndex] = useState(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [eventName, setEventName] = useState(null);
  const [showDirectDelivery, setShowDirectDelivery] = useState(false);
  const [deliveryRecord, setDeliveryRecord] = useState(null);
  const [revealedDocNumber, setRevealedDocNumber] = useState(null);
  const [revealing, setRevealing] = useState(false);
  const [revealError, setRevealError] = useState(null);
  const [contactedBusy, setContactedBusy] = useState(false);
  const [contactedNotes, setContactedNotes] = useState('');
  const [showContactedForm, setShowContactedForm] = useState(false);

  const handleRevealDocNumber = async () => {
    if (revealedDocNumber) { setRevealedDocNumber(null); return; }
    setRevealing(true); setRevealError(null);
    try {
      const res = await api.post(`/business/items/${itemId}/reveal-document`);
      setRevealedDocNumber(res.data.doc_number);
    } catch (err) {
      setRevealError(err?.response?.data?.detail || t('revealDocError'));
    } finally {
      setRevealing(false);
    }
  };

  const handleMarkContacted = async () => {
    setContactedBusy(true);
    try {
      const res = await api.post(`/business/items/${itemId}/mark-externally-contacted`, {
        notes: contactedNotes.trim() || null,
      });
      setItem(prev => ({ ...prev, identified_owner: { ...prev.identified_owner, ...res.data } }));
      setShowContactedForm(false);
      setContactedNotes('');
    } catch {} finally {
      setContactedBusy(false);
    }
  };

  const handleUnmarkContacted = async () => {
    setContactedBusy(true);
    try {
      await api.delete(`/business/items/${itemId}/mark-externally-contacted`);
      setItem(prev => {
        const next = { ...prev.identified_owner };
        delete next.externally_contacted_at;
        delete next.externally_contacted_by;
        delete next.externally_contacted_notes;
        return { ...prev, identified_owner: next };
      });
    } catch {} finally {
      setContactedBusy(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const itemRes = await api.get(`/business/items/${itemId}`);
        setItem(itemRes.data);
        api.get(`/business/items/${itemId}/timeline`)
          .then(r => setTimeline(r.data?.events || []))
          .catch(() => {});
        if (['returned', 'recovered'].includes(itemRes.data?.status)) {
          // Delivered → the panel shows the resolution, not an open queue
          const [winRes, discRes] = await Promise.all([
            api.get('/business/items/matches/list', {
              params: { found_item_id: itemId, limit: MATCH_LIMIT, status: 'accepted,paid,recovered' },
            }),
            api.get('/business/items/matches/list', {
              params: { found_item_id: itemId, limit: 1, status: 'dismissed,rejected' },
            }),
          ]);
          setMatches(winRes.data.matches);
          setMatchTotal(winRes.data.total);
          setDiscardedTotal(discRes.data.total);
        } else {
          // Open item — a committed match (accepted/paid) is a resolution in
          // course and always surfaces first, above remaining candidates.
          const [commRes, actRes] = await Promise.all([
            api.get('/business/items/matches/list', {
              params: { found_item_id: itemId, limit: MATCH_LIMIT, status: 'accepted,paid' },
            }),
            api.get('/business/items/matches/list', {
              params: { found_item_id: itemId, limit: MATCH_LIMIT, status: ACTIVE_STATUSES },
            }),
          ]);
          setMatches([...commRes.data.matches, ...actRes.data.matches].slice(0, MATCH_LIMIT));
          setMatchTotal(actRes.data.total);
          setCommittedTotal(commRes.data.total);
        }
        if (itemRes.data?.event_id) {
          api.get(`/business/events/${itemRes.data.event_id}`)
            .then(r => setEventName(r.data?.name || null))
            .catch(() => {});
        }
        if (['returned', 'recovered'].includes(itemRes.data?.status)) {
          api.get(`/business/items/${itemId}/delivery-record`)
            .then(r => setDeliveryRecord(r.data))
            .catch(() => {});
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [itemId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-slate-500">{t('itemNotFound')}</p>
      </div>
    );
  }

  const hasPhotos = item.photos?.length > 0;
  const delivered = ['returned', 'recovered'].includes(item.status);
  const expired = item.status === 'expired';
  const journeyStep = delivered ? 2 : (matchTotal > 0 || committedTotal > 0) ? 1 : 0;

  return (
    <div className="max-w-6xl mx-auto">

      {/* Top bar: back + breadcrumb + status · actions */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={15} />
        </button>
        <p className="text-xs text-slate-400 min-w-0 truncate">
          {t('navFoundItems')} / <span className="font-semibold text-slate-900">{item.title}</span>
        </p>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-semibold text-slate-900 flex-shrink-0">
          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[item.status] || 'bg-slate-300'}`} />
          <span className="capitalize">{item.status}</span>
          {item.created_at && <span className="text-slate-400 font-medium">· {timeAgo(item.created_at, t)}</span>}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {item.status === 'active' && (
            <button
              onClick={() => setShowDirectDelivery(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              <HandshakeIcon size={13} />
              Entrega directa
            </button>
          )}
          <button
            onClick={() => navigate(`/items/${itemId}/edit`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md text-sm font-medium transition-colors"
          >
            <Pencil size={13} />
            {t('editItem')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8 items-start">

        {/* LEFT — evidence */}
        <div>
          {hasPhotos && (
            <div className="mb-6">
              <div
                className="relative rounded-xl overflow-hidden bg-slate-100 aspect-[16/9] cursor-pointer"
                onClick={() => setViewerIndex(heroIndex)}
              >
                <img
                  src={photoUrl(item.photos[heroIndex])}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {item.photos.length > 1 && (
                  <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-slate-900/55 text-[10px] font-semibold text-white tabular-nums">
                    {heroIndex + 1} / {item.photos.length}
                  </div>
                )}
              </div>
              {item.photos.length > 1 && (
                <div className="flex gap-2 mt-2.5 overflow-x-auto pb-1">
                  {item.photos.map((photo, i) => (
                    <button
                      key={i}
                      onClick={() => setHeroIndex(i)}
                      className={`w-[52px] h-[52px] rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                        i === heroIndex ? 'ring-2 ring-slate-900 ring-offset-2' : 'opacity-55 hover:opacity-100'
                      }`}
                    >
                      <img src={photoUrl(photo)} alt="" loading="lazy" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {viewerIndex !== null && hasPhotos && (
            <ImageViewer
              images={item.photos.map(p => photoUrl(p))}
              initialIndex={viewerIndex}
              onClose={() => setViewerIndex(null)}
            />
          )}

          <h1 data-testid="item-detail-title" className="text-2xl font-semibold text-slate-900 tracking-tight">
            {item.title}
          </h1>
          {item.description && (
            <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-prose">{item.description}</p>
          )}

          {/* Facts */}
          <div className="mt-6 divide-y divide-slate-100 border-y border-slate-100">
            {item.date_time && (
              <FactRow icon={Clock} label={t('dateTimeLabel')} value={new Date(item.date_time).toLocaleString()} />
            )}
            {item.category && (
              <FactRow icon={Tag} label={t('categoryLabel')} value={<span className="capitalize">{item.category}</span>} />
            )}
            {eventName && (
              <FactRow icon={CalendarDays} label={t('eventLabel')} value={eventName} />
            )}
            {item.address && (
              <FactRow icon={MapPin} label={t('locationLabel')} value={item.address} />
            )}
          </div>

          {item.location?.coordinates && (
            <div className="mt-4">
              <ItemMap
                lng={item.location.coordinates[0]}
                lat={item.location.coordinates[1]}
              />
            </div>
          )}

          <JourneyRail step={journeyStep} muted={expired} t={t} />

          {/* Audit trail — who did what and when */}
          {timeline.length > 1 && (
            <div className="mt-10" data-testid="item-timeline">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                {t('timelineTitle')}
              </p>
              <div>
                {timeline.map((ev, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${TL_DOT[ev.type] || 'bg-slate-300'}`} />
                      {i < timeline.length - 1 && <span className="w-px flex-1 bg-slate-100 my-1" />}
                    </div>
                    <div className="pb-4 min-w-0">
                      <p className="text-[13px] text-slate-700 leading-snug">{timelineLabel(ev, t)}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(ev.at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — operations panel */}
        <div className="space-y-4 lg:sticky lg:top-8">

          {/* Identified owner */}
          {item.identified_owner && (
            <PanelCard
              icon={IdCard}
              title={t('identifiedOwner')}
              testId="identified-owner-preview"
              chip={item.identified_owner.matched_user_id && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
                  <UserCheck size={10} />
                  {t('identifiedOwnerMatched')}
                </span>
              )}
            >
              <p className="text-sm font-semibold text-slate-900">{item.identified_owner.owner_name}</p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
                <span>
                  {item.identified_owner.doc_type_label || t(
                    item.identified_owner.doc_type === 'id_card' ? 'docTypeIdCard'
                    : item.identified_owner.doc_type === 'passport' ? 'docTypePassport'
                    : item.identified_owner.doc_type === 'driving_license' ? 'docTypeDrivingLicense'
                    : 'docTypeOther'
                  )}
                </span>
                {item.identified_owner.doc_number_masked && (
                  <span className="font-mono">
                    {revealedDocNumber || item.identified_owner.doc_number_masked}
                  </span>
                )}
              </div>
              {item.identified_owner.notes && (
                <p className="mt-1.5 text-xs text-slate-500 italic">{item.identified_owner.notes}</p>
              )}

              {/* Sensitive actions */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={handleRevealDocNumber}
                  disabled={revealing}
                  data-testid="reveal-doc-btn"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-white border border-teal-200 text-teal-700 hover:bg-teal-50 transition-colors disabled:opacity-50"
                >
                  {revealing ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : revealedDocNumber ? (
                    <EyeOff size={12} />
                  ) : (
                    <Eye size={12} />
                  )}
                  {revealedDocNumber ? t('revealDocHide') : t('revealDocShow')}
                </button>

                {!item.identified_owner.externally_contacted_at ? (
                  <button
                    onClick={() => setShowContactedForm(v => !v)}
                    data-testid="mark-contacted-btn"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Phone size={12} />
                    {t('markContacted')}
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 border border-emerald-200 text-emerald-700">
                    <Check size={12} />
                    {t('contactedOn')} {new Date(item.identified_owner.externally_contacted_at).toLocaleDateString()}
                    <button
                      onClick={handleUnmarkContacted}
                      disabled={contactedBusy}
                      className="ml-1 text-emerald-600 hover:text-emerald-800 disabled:opacity-50"
                      aria-label={t('undoContacted')}
                    >
                      <X size={11} />
                    </button>
                  </span>
                )}
              </div>

              {revealError && (
                <p className="mt-2 text-xs text-red-600">{revealError}</p>
              )}

              {item.identified_owner.externally_contacted_notes && !showContactedForm && (
                <p className="mt-2 text-xs text-slate-500 italic">
                  {t('contactedNotes')}: {item.identified_owner.externally_contacted_notes}
                </p>
              )}

              {showContactedForm && !item.identified_owner.externally_contacted_at && (
                <div className="mt-3 flex flex-col gap-2 p-2.5 bg-white border border-slate-200 rounded-md">
                  <input
                    type="text"
                    value={contactedNotes}
                    onChange={(e) => setContactedNotes(e.target.value)}
                    placeholder={t('contactedNotesPlaceholder')}
                    className="px-2.5 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-teal-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleMarkContacted}
                      disabled={contactedBusy}
                      className="flex-1 px-2.5 py-1.5 rounded text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {contactedBusy ? <Loader2 size={11} className="animate-spin inline" /> : t('confirm')}
                    </button>
                    <button
                      onClick={() => { setShowContactedForm(false); setContactedNotes(''); }}
                      className="px-2.5 py-1.5 rounded text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </div>
              )}
            </PanelCard>
          )}

          {/* Matches — state-aware: open queue vs delivered resolution */}
          <PanelCard
            icon={Sparkles}
            title={t('navMatches')}
            testId="item-matches-panel"
            chip={!delivered && matchTotal > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700">
                {matchTotal} {t('pending')}
              </span>
            )}
          >
            {matches.length === 0 ? (
              delivered ? (
                <p className="text-xs text-slate-500 leading-relaxed" data-testid="closed-without-match">
                  {t('deliveredWithoutMatch')}
                </p>
              ) : (
                <div className="py-4 text-center">
                  <Package size={22} className="text-slate-200 mx-auto mb-2" strokeWidth={1.5} />
                  <p className="text-xs font-medium text-slate-600">{t('noMatchesYet')}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{t('notifyWhenCandidate')}</p>
                </div>
              )
            ) : (
              <>
                <div className="divide-y divide-slate-100 -my-1">
                  {matches.map(match => (
                    <button
                      key={match.match_id}
                      onClick={() => navigate(`/matches/${itemId}`)}
                      data-testid={`match-row-${match.match_id}`}
                      className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-slate-50 transition-colors -mx-1 px-1 rounded-md"
                    >
                      <ScoreRing score={match.score} size={34} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-slate-900 truncate">
                          {match.lost_item?.title || t('possibleMatch')}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate" title={matchStatusHint(match, t)}>
                          {matchStatusLabel(match, t)}
                          {coverageSubtext(match, t) && ` · ${coverageSubtext(match, t)}`}
                          {match.verification_score != null && ` · ${t('statusVerification')} ${Math.round(match.verification_score * 100)}%`}
                        </p>
                      </div>
                      <ChevronRight size={14} className="text-slate-200 flex-shrink-0" />
                    </button>
                  ))}
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <button
                    onClick={() => navigate(`/matches/${itemId}`)}
                    data-testid="review-candidates-btn"
                    className="text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors"
                  >
                    {delivered ? t('viewResolution') : t('reviewCandidates')} →
                  </button>
                  {delivered && discardedTotal > 0 && (
                    <span className="text-[11px] text-slate-400">
                      {t('discardedCountLabel').replace('{n}', discardedTotal)}
                    </span>
                  )}
                </div>
              </>
            )}
          </PanelCard>

          {/* Delivery record */}
          <DeliveryRecordCard record={deliveryRecord} itemId={itemId} />

        </div>
      </div>

      {showDirectDelivery && (
        <DirectDeliveryModal
          itemId={itemId}
          onClose={() => setShowDirectDelivery(false)}
          onDelivered={() => {
            setShowDirectDelivery(false);
            setItem(prev => ({ ...prev, status: 'returned' }));
          }}
        />
      )}
    </div>
  );
}
