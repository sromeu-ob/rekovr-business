import { useState, useRef, useEffect } from 'react';
import {
  ScanLine, KeyRound, CheckCircle2, AlertTriangle, Package,
  User, Clock, ArrowLeft, Loader2, PenLine, Link, QrCode, Copy, Check,
} from 'lucide-react';
import QRCode from 'qrcode';
import api, { photoUrl } from '../api';
import { useI18n } from '../contexts/I18nContext';
import SignaturePad from '../components/SignaturePad';

function normalizeCode(raw) {
  return (raw || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
}

function extractToken(raw) {
  if (!raw) return null;
  const trimmed = raw.trim();
  const m = trimmed.match(/\/pickup\/([A-Za-z0-9_-]+)/);
  if (m) return m[1];
  if (/^[A-Za-z0-9_-]{20,}$/.test(trimmed)) return trimmed;
  return null;
}

// ── QR canvas display ────────────────────────────────────────────────────────

function QRDisplay({ url }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (canvasRef.current && url) {
      QRCode.toCanvas(canvasRef.current, url, { width: 240, margin: 2 });
    }
  }, [url]);
  return (
    <div className="flex flex-col items-center gap-3">
      <canvas ref={canvasRef} className="rounded-lg border border-slate-200" />
      <p className="text-xs text-slate-400 text-center">
        El receptor escaneja el QR amb el mòbil per signar
      </p>
    </div>
  );
}

// ── Signature mode selector ──────────────────────────────────────────────────

function SignaturePanel({ lastLookup, onSigned, onSkip, requireSignature }) {
  const [signMode, setSignMode] = useState('B'); // 'B' | 'A' | 'C'
  const [name, setName] = useState('');
  const [dni, setDni] = useState('');
  const [sigDataUrl, setSigDataUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // For Modes A & C
  const [sessionUrl, setSessionUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);

  const canConfirmB = name.trim() && dni.trim() && sigDataUrl;

  async function handleConfirmB() {
    setError(null);
    setSubmitting(true);
    try {
      await api.post('/business/pickups/confirm', {
        ...lastLookup,
        recipient_name: name.trim(),
        recipient_dni: dni.trim(),
        signature_data_url: sigDataUrl,
      });
      onSigned();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(detail || 'Error en confirmar. Torna-ho a intentar.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateSession() {
    setError(null);
    setCreatingSession(true);
    try {
      const res = await api.post('/business/pickups/signature-session', lastLookup);
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
    { id: 'B', icon: PenLine, label: 'Signar aquí', desc: 'El receptor signa al teu dispositiu' },
    { id: 'A', icon: Link,    label: 'Enviar link',  desc: 'Envia un link per SMS o email' },
    { id: 'C', icon: QrCode,  label: 'Mostrar QR',   desc: 'El receptor escaneja el QR' },
  ];

  return (
    <div className="space-y-5">
      {/* Mode selector */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-2">Mode de signatura</p>
        <div className="grid grid-cols-3 gap-2">
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => { setSignMode(m.id); setSessionUrl(null); setError(null); }}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-colors ${
                signMode === m.id
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <m.icon size={16} className={signMode === m.id ? 'text-slate-900' : 'text-slate-400'} strokeWidth={1.5} />
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

      {/* Mode B — inline */}
      {signMode === 'B' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 mb-1.5">Nom complet</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Joan García"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 mb-1.5">DNI / NIE</label>
              <input
                value={dni}
                onChange={e => setDni(e.target.value)}
                placeholder="12345678A"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>
          <SignaturePad onChange={setSigDataUrl} />
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-100 flex items-start gap-2">
              <AlertTriangle size={14} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          <div className="flex gap-2">
            {!requireSignature && (
              <button onClick={onSkip} disabled={submitting}
                className="flex-1 py-3 rounded-md border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50">
                Sense signatura
              </button>
            )}
            <button
              onClick={handleConfirmB}
              disabled={!canConfirmB || submitting}
              className="flex-1 py-3 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              Confirmar lliurament
            </button>
          </div>
        </div>
      )}

      {/* Modes A & C — session-based */}
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
              <div className="flex gap-2">
                {!requireSignature && (
                  <button onClick={onSkip} disabled={creatingSession}
                    className="flex-1 py-3 rounded-md border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50">
                    Sense signatura
                  </button>
                )}
                <button
                  onClick={handleCreateSession}
                  disabled={creatingSession}
                  className="flex-1 py-3 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {creatingSession ? <Loader2 size={15} className="animate-spin" /> : (
                    signMode === 'A' ? <Link size={15} /> : <QrCode size={15} />
                  )}
                  {signMode === 'A' ? 'Generar link' : 'Generar QR'}
                </button>
              </div>
            </>
          ) : (
            <>
              {signMode === 'C' && <QRDisplay url={sessionUrl} />}
              {signMode === 'A' && (
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-2">Link de signatura</p>
                  <p className="text-xs font-mono text-slate-700 break-all leading-relaxed">{sessionUrl}</p>
                  <button
                    onClick={copyUrl}
                    className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    {copied ? 'Copiat!' : 'Copiar link'}
                  </button>
                </div>
              )}
              <div className="bg-amber-50/60 border border-amber-100 rounded-md p-3">
                <p className="text-xs text-amber-900 leading-relaxed">
                  <strong>Vàlid 15 minuts.</strong> Un cop el receptor hagi signat, el lliurament es confirmarà automàticament.
                </p>
              </div>
              <button
                onClick={onSkip}
                className="w-full py-3 rounded-md border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors">
                Tancar
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function ConfirmPickupPage({ auth }) {
  const { t } = useI18n();
  const requireSignature = auth?.organization?.require_delivery_signature ?? false;

  const [mode, setMode] = useState('entry'); // 'entry' | 'preview' | 'signature' | 'done'
  const [codeInput, setCodeInput] = useState('');
  const [scanInput, setScanInput] = useState('');
  const [tab, setTab] = useState('code');
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [lastLookup, setLastLookup] = useState(null);
  const scanRef = useRef(null);

  useEffect(() => {
    if (tab === 'scan' && scanRef.current) scanRef.current.focus();
  }, [tab]);

  const normalized = normalizeCode(codeInput);
  const canLookupCode = normalized.length === 8;

  function reset() {
    setMode('entry');
    setCodeInput('');
    setScanInput('');
    setError(null);
    setPreview(null);
    setLastLookup(null);
  }

  async function handleLookup({ token, code }) {
    setError(null);
    setLoading(true);
    try {
      const body = token ? { token } : { code };
      const res = await api.post('/business/pickups/lookup', body);
      setPreview(res.data);
      setLastLookup(body);
      setMode('preview');
    } catch (err) {
      const s = err?.response?.status;
      const detail = err?.response?.data?.detail;
      if (s === 404) setError(t('pickupNotFound'));
      else if (s === 410) setError(t('pickupExpired'));
      else if (s === 409) setError(t('pickupAlreadyConfirmed'));
      else if (s === 429) setError(t('pickupRateLimited'));
      else setError(detail || t('pickupLookupFailed'));
    } finally {
      setLoading(false);
    }
  }

  function submitCode(e) {
    e?.preventDefault?.();
    if (!canLookupCode) return;
    handleLookup({ code: normalized });
  }

  function submitScan(e) {
    e?.preventDefault?.();
    const token = extractToken(scanInput);
    if (!token) { setError(t('pickupInvalidScan')); return; }
    handleLookup({ token });
  }

  async function handleSimpleConfirm() {
    if (!lastLookup) return;
    setError(null);
    setConfirming(true);
    try {
      await api.post('/business/pickups/confirm', lastLookup);
      setMode('done');
    } catch (err) {
      const s = err?.response?.status;
      const detail = err?.response?.data?.detail;
      if (s === 409) setError(t('pickupAlreadyConfirmed'));
      else if (s === 410) setError(t('pickupExpired'));
      else if (s === 429) setError(t('pickupRateLimited'));
      else setError(detail || t('pickupConfirmFailed'));
    } finally {
      setConfirming(false);
    }
  }

  // ── DONE ────────────────────────────────────────────────────────────────────
  if (mode === 'done') {
    return (
      <div className="max-w-lg mx-auto" data-testid="pickup-done">
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" strokeWidth={1.75} />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">{t('pickupConfirmedTitle')}</h2>
          <p className="text-sm text-slate-500 mb-6">{t('pickupConfirmedSubtitle')}</p>
          <button onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
            data-testid="pickup-new">
            {t('pickupConfirmAnother')}
          </button>
        </div>
      </div>
    );
  }

  // ── SIGNATURE ───────────────────────────────────────────────────────────────
  if (mode === 'signature') {
    return (
      <div className="max-w-lg mx-auto">
        <button onClick={() => setMode('preview')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-4">
          <ArrowLeft size={14} /> Tornar
        </button>
        <div className="bg-white rounded-lg border border-slate-200 p-5 mb-4">
          <h2 className="text-base font-semibold text-slate-900 mb-1">Signatura del receptor</h2>
          <p className="text-xs text-slate-400 mb-5">Tria com vols capturar la signatura</p>
          <SignaturePanel
            lastLookup={lastLookup}
            requireSignature={requireSignature}
            onSigned={() => setMode('done')}
            onSkip={() => { handleSimpleConfirm(); }}
          />
        </div>
      </div>
    );
  }

  // ── PREVIEW ─────────────────────────────────────────────────────────────────
  if (mode === 'preview' && preview) {
    const item = preview.found_item || {};
    const lost = preview.lost_item || {};
    const claimant = preview.claimant || {};
    const photo = item.photo ? photoUrl(item.photo) : null;

    return (
      <div className="max-w-lg mx-auto" data-testid="pickup-preview">
        <button onClick={reset}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-4">
          <ArrowLeft size={14} /> {t('pickupBack')}
        </button>

        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-4">
          {photo && (
            <div className="aspect-video bg-slate-100 overflow-hidden">
              <img src={photo} alt={item.title} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 text-slate-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-0.5">{t('pickupItem')}</p>
                <h3 className="text-base font-semibold text-slate-900" data-testid="pickup-item-title">{item.title}</h3>
                {item.category && <p className="text-xs text-slate-400 mt-0.5">{item.category}</p>}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-slate-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-0.5">{t('pickupClaimant')}</p>
                <p className="text-sm font-medium text-slate-900" data-testid="pickup-claimant-name">{claimant.name || '—'}</p>
                {claimant.email_masked && <p className="text-xs text-slate-500 font-mono">{claimant.email_masked}</p>}
                {lost.title && (
                  <p className="text-xs text-slate-500 mt-1">
                    <span className="text-slate-400">{t('pickupClaimedFor')}: </span>{lost.title}
                  </p>
                )}
              </div>
            </div>

            {preview.expires_at && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{t('pickupValidUntil')} {new Date(preview.expires_at).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-100 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {requireSignature && (
          <div className="bg-amber-50/60 border border-amber-100 rounded-md p-3 mb-4">
            <p className="text-xs text-amber-900 leading-relaxed">
              <strong>Signatura obligatòria.</strong> {t('pickupVerifyInstructions')}
            </p>
          </div>
        )}

        {!requireSignature && (
          <div className="bg-amber-50/60 border border-amber-100 rounded-md p-3 mb-4">
            <p className="text-xs text-amber-900 leading-relaxed">
              <strong>{t('pickupVerifyLabel')}:</strong> {t('pickupVerifyInstructions')}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={reset} disabled={confirming}
            className="flex-1 py-3 rounded-md border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
            data-testid="pickup-cancel">
            {t('cancel')}
          </button>
          {requireSignature ? (
            <button
              onClick={() => setMode('signature')}
              className="flex-1 py-3 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              data-testid="pickup-confirm"
            >
              <PenLine className="w-4 h-4" />
              Capturar signatura
            </button>
          ) : (
            <>
              <button
                onClick={() => setMode('signature')}
                className="flex-1 py-3 rounded-md border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <PenLine className="w-4 h-4" />
                Amb signatura
              </button>
              <button
                onClick={handleSimpleConfirm}
                disabled={confirming}
                className="flex-1 py-3 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="pickup-confirm"
              >
                {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {t('pickupConfirmHandover')}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── ENTRY ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto" data-testid="pickup-entry">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 mb-1">{t('pickupPageTitle')}</h1>
        <p className="text-sm text-slate-500">{t('pickupPageSubtitle')}</p>
        {requireSignature && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-100 text-xs text-amber-700 font-medium">
            <PenLine size={12} strokeWidth={1.5} />
            Signatura obligatòria activada
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => { setTab('code'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${
              tab === 'code' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-700'
            }`}
            data-testid="tab-code"
          >
            <KeyRound size={16} /> {t('pickupTabCode')}
          </button>
          <button
            onClick={() => { setTab('scan'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${
              tab === 'scan' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-700'
            }`}
            data-testid="tab-scan"
          >
            <ScanLine size={16} /> {t('pickupTabScan')}
          </button>
        </div>

        <div className="p-6">
          {tab === 'code' && (
            <form onSubmit={submitCode}>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 mb-2">
                {t('pickupCodeLabel')}
              </label>
              <input
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="XXXX-XXXX"
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                className="w-full px-4 py-4 rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 focus:outline-none text-2xl font-mono tracking-[0.18em] text-center text-slate-900 uppercase"
                data-testid="pickup-code-input"
              />
              <p className="mt-2 text-xs text-slate-400 text-center">
                {normalized.length}/8 {t('pickupCodeChars')}
              </p>
              {error && (
                <div className="mt-4 p-3 rounded-md bg-red-50 border border-red-100 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={!canLookupCode || loading}
                className="mt-5 w-full py-3 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                data-testid="pickup-lookup-btn"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {t('pickupLookup')}
              </button>
            </form>
          )}

          {tab === 'scan' && (
            <form onSubmit={submitScan}>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 mb-2">
                {t('pickupScanLabel')}
              </label>
              <input
                ref={scanRef}
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder={t('pickupScanPlaceholder')}
                autoComplete="off"
                className="w-full px-4 py-3 rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 focus:outline-none text-sm text-slate-900 font-mono"
                data-testid="pickup-scan-input"
              />
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                {t('pickupScanHint')}
              </p>
              {error && (
                <div className="mt-4 p-3 rounded-md bg-red-50 border border-red-100 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={!scanInput.trim() || loading}
                className="mt-5 w-full py-3 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                data-testid="pickup-scan-btn"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {t('pickupLookup')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
