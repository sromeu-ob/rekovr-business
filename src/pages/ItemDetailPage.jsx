import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Clock, Tag, Package, Sparkles, ChevronRight,
  Pencil, HandshakeIcon, X, AlertTriangle, CheckCircle2, Loader2,
  Link, QrCode, Copy, Check,
} from 'lucide-react';
import QRCode from 'qrcode';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import ImageViewer from '../components/ImageViewer';
import SignaturePad from '../components/SignaturePad';
import api, { photoUrl } from '../api';
import { useI18n } from '../contexts/I18nContext';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function ItemMap({ lng, lat }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !lng || !lat) return;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: 14,
      interactive: false,
    });
    new mapboxgl.Marker({ color: '#18181b' })
      .setLngLat([lng, lat])
      .addTo(map);
    return () => map.remove();
  }, [lng, lat]);

  return <div ref={containerRef} className="w-full h-44 rounded-lg overflow-hidden" />;
}

const getLocalizedReasoning = (match, lang) =>
  match?.[`reasoning_${lang}`] || match?.reasoning_en || match?.reasoning || '';

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
                    className="w-full py-3 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
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

const MATCH_LIMIT = 10;
const ACTIVE_STATUSES = 'pending,pending_verification,pending_review';

const STATUS_STYLE = {
  active:    'bg-emerald-50 text-emerald-700',
  matched:   'bg-amber-50 text-amber-700',
  recovered: 'bg-slate-100 text-slate-600',
  returned:  'bg-slate-100 text-slate-600',
  archived:  'bg-slate-100 text-slate-400',
};

const MATCH_STATUS_STYLE = {
  pending_verification: 'bg-amber-50 text-amber-700',
  pending_review:       'bg-amber-50 text-amber-700',
  pending:   'bg-amber-50 text-amber-700',
  accepted:  'bg-slate-100 text-slate-600',
  rejected:  'bg-red-50 text-red-600',
  dismissed: 'bg-slate-100 text-slate-400',
  paid:      'bg-emerald-50 text-emerald-700',
  recovered: 'bg-emerald-50 text-emerald-700',
};

export default function ItemDetailPage() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { t, language } = useI18n();

  const MATCH_STATUS_LABEL = {
    pending_verification: t('statusVerification'),
    pending_review:       t('statusUnderReview'),
    pending:   t('statusPending'),
    accepted:  t('statusAccepted'),
    rejected:  t('statusRejected'),
    dismissed: t('statusDismissed'),
    paid:      t('statusPaid'),
    recovered: t('statusRecovered'),
  };

  const [item, setItem] = useState(null);
  const [matches, setMatches] = useState([]);
  const [matchTotal, setMatchTotal] = useState(0);
  const [matchFilter, setMatchFilter] = useState('active');
  const [matchOffset, setMatchOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewerIndex, setViewerIndex] = useState(null);
  const [showDirectDelivery, setShowDirectDelivery] = useState(false);
  const [deliveryRecord, setDeliveryRecord] = useState(null);

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

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft size={16} className="text-slate-600" />
        </button>
        <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
          {t('foundBadge')}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${STATUS_STYLE[item.status] || 'bg-slate-100 text-slate-400'}`}>
          {item.status}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {item.status === 'active' && (
            <button
              onClick={() => setShowDirectDelivery(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md text-sm font-medium transition-colors"
            >
              <HandshakeIcon size={13} />
              Entrega directa
            </button>
          )}
          <button
            onClick={() => navigate(`/items/${itemId}/edit`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-sm font-medium transition-colors"
          >
            <Pencil size={13} />
            {t('editItem')}
          </button>
        </div>
      </div>

      {/* Photos */}
      {item.photos?.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
          {item.photos.map((photo, i) => (
            <img
              key={i}
              src={photoUrl(photo)}
              alt=""
              className="w-28 h-28 rounded-lg object-cover flex-shrink-0 border border-slate-100 cursor-pointer hover:opacity-80 transition-opacity"
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
        <h1 className="text-xl font-semibold text-slate-900">
          {item.title}
        </h1>

        {/* Metadata row — badges */}
        <div className="flex flex-wrap items-center gap-2">
          {item.date_time && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">
              <Clock className="w-3 h-3 text-slate-500 flex-shrink-0" strokeWidth={1.5} />
              {new Date(item.date_time).toLocaleString()}
            </span>
          )}
          {item.category && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium capitalize">
              <Tag className="w-3 h-3 text-slate-500 flex-shrink-0" strokeWidth={1.5} />
              {item.category}
            </span>
          )}
        </div>

        {item.description && (
          <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
        )}

        {/* Map */}
        {item.location?.coordinates && (
          <div>
            <ItemMap
              lng={item.location.coordinates[0]}
              lat={item.location.coordinates[1]}
            />
            {item.address && (
              <p className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" strokeWidth={1.5} />
                {item.address}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Matches Section */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
            {t('navMatches')} {matchTotal > 0 && <span className="text-slate-400 normal-case tracking-normal">({matchTotal})</span>}
          </p>
          <div className="flex bg-slate-100 rounded-md p-0.5 gap-0.5">
            {['active', 'all'].map(f => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  matchFilter === f
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f === 'active' ? t('filterActive') : t('filterAll')}
              </button>
            ))}
          </div>
        </div>

        {loadingMatches ? (
          <div className="flex justify-center py-10">
            <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
          </div>
        ) : matches.length > 0 ? (
          <>
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
              {matches.map(match => {
                const otherItem = match.lost_item;
                return (
                  <button
                    key={match.match_id}
                    onClick={() => navigate(`/matches/${itemId}`)}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-slate-900 truncate">
                          {otherItem?.title || t('possibleMatch')}
                        </span>
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md flex-shrink-0 ${MATCH_STATUS_STYLE[match.status] || 'bg-slate-100 text-slate-400'}`}>
                          {MATCH_STATUS_LABEL[match.status] || match.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {t('matchScore')}: <span className="font-medium text-slate-900">{Math.round(match.score * 100)}%</span>
                      </p>
                      {getLocalizedReasoning(match, language) && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{getLocalizedReasoning(match, language)}</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-200 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
            {matches.length < matchTotal && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full mt-3 py-2.5 text-sm font-medium text-slate-500 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                  </span>
                ) : (
                  `${t('loadMore')} (${matchTotal - matches.length})`
                )}
              </button>
            )}
          </>
        ) : (
          <div className="text-center py-12 border border-slate-200 rounded-lg">
            <Package className="w-8 h-8 text-slate-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm font-medium text-slate-900">{t('noMatchesYet')}</p>
            <p className="text-sm text-slate-500 mt-1">{t('notifyWhenCandidate')}</p>
          </div>
        )}
      </div>

      {/* Delivery Record */}
      {deliveryRecord && (
        <div className="mt-10 rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 bg-slate-50">
            <HandshakeIcon size={15} className="text-teal-600" strokeWidth={1.5} />
            <div>
              <p className="text-xs font-semibold text-slate-800">Registre de lliurament</p>
              <p className="text-[11px] text-slate-400">Signatura i identificació del receptor capturades</p>
            </div>
          </div>
          <div className="bg-white p-5 grid grid-cols-2 gap-5">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-1">Receptor</p>
              <p className="text-sm font-semibold text-slate-900">{deliveryRecord.recipient_name}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-1">DNI / NIE</p>
              <p className="text-sm font-mono text-slate-700">{deliveryRecord.recipient_dni}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-1">Data i hora</p>
              <p className="text-xs text-slate-500">{deliveryRecord.signed_at ? new Date(deliveryRecord.signed_at).toLocaleString() : '—'}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-1">Tipus</p>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                deliveryRecord.delivery_type === 'direct' ? 'bg-violet-50 text-violet-700' : 'bg-teal-50 text-teal-700'
              }`}>{deliveryRecord.delivery_type === 'direct' ? 'Directa' : 'Match'}</span>
            </div>
            {deliveryRecord.signature_data_url && (
              <div className="col-span-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-2">Signatura</p>
                <img src={deliveryRecord.signature_data_url} alt="signatura"
                  className="h-16 max-w-[280px] object-contain bg-slate-50 rounded-lg border border-slate-200 p-2" />
              </div>
            )}
          </div>
        </div>
      )}

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
