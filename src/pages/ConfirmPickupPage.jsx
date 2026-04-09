import { useState, useRef, useEffect } from 'react';
import { ScanLine, KeyRound, CheckCircle2, AlertTriangle, Package, User, Clock, ArrowLeft, Loader2 } from 'lucide-react';
import api, { photoUrl } from '../api';
import { useI18n } from '../contexts/I18nContext';

// Normalize to Crockford-ish alphabet (uppercase alphanumeric, strip separators)
function normalizeCode(raw) {
  return (raw || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
}

// Extract pickup token from a scanned URL like https://.../pickup/<token>
function extractToken(raw) {
  if (!raw) return null;
  const trimmed = raw.trim();
  const m = trimmed.match(/\/pickup\/([A-Za-z0-9_-]+)/);
  if (m) return m[1];
  // Already looks like a bare token
  if (/^[A-Za-z0-9_-]{20,}$/.test(trimmed)) return trimmed;
  return null;
}

export default function ConfirmPickupPage({ auth }) {
  const { t } = useI18n();

  const [mode, setMode] = useState('entry'); // 'entry' | 'preview' | 'done'
  const [codeInput, setCodeInput] = useState('');
  const [scanInput, setScanInput] = useState('');
  const [tab, setTab] = useState('code'); // 'code' | 'scan'
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [lastLookup, setLastLookup] = useState(null); // { token?, code? }
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
    if (!token) {
      setError(t('pickupInvalidScan'));
      return;
    }
    handleLookup({ token });
  }

  async function handleConfirm() {
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
        <div className="bg-white rounded-2xl border border-zinc-100 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" strokeWidth={1.75} />
          </div>
          <h2 className="text-xl font-semibold text-zinc-900 mb-2">{t('pickupConfirmedTitle')}</h2>
          <p className="text-sm text-zinc-500 mb-6">{t('pickupConfirmedSubtitle')}</p>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 transition-colors"
            data-testid="pickup-new"
          >
            {t('pickupConfirmAnother')}
          </button>
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
        <button
          onClick={reset}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 mb-4"
        >
          <ArrowLeft size={14} /> {t('pickupBack')}
        </button>

        <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden mb-4">
          {photo && (
            <div className="aspect-video bg-zinc-100 overflow-hidden">
              <img src={photo} alt={item.title} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 text-teal-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">{t('pickupItem')}</p>
                <h3 className="text-base font-semibold text-zinc-900" data-testid="pickup-item-title">{item.title}</h3>
                {item.category && <p className="text-[11px] text-zinc-400 mt-0.5">{item.category}</p>}
              </div>
            </div>

            <div className="border-t border-zinc-100 pt-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-zinc-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">{t('pickupClaimant')}</p>
                <p className="text-sm font-medium text-zinc-900" data-testid="pickup-claimant-name">{claimant.name || '—'}</p>
                {claimant.email_masked && (
                  <p className="text-xs text-zinc-500 font-mono">{claimant.email_masked}</p>
                )}
                {lost.title && (
                  <p className="text-xs text-zinc-500 mt-1">
                    <span className="text-zinc-400">{t('pickupClaimedFor')}: </span>{lost.title}
                  </p>
                )}
              </div>
            </div>

            {preview.expires_at && (
              <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center gap-1.5 text-xs text-zinc-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{t('pickupValidUntil')} {new Date(preview.expires_at).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3 mb-4">
          <p className="text-xs text-amber-900 leading-relaxed">
            <strong>{t('pickupVerifyLabel')}:</strong> {t('pickupVerifyInstructions')}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={reset}
            disabled={confirming}
            className="flex-1 py-3 rounded-xl border border-zinc-200 text-zinc-700 text-sm font-semibold hover:bg-zinc-50 transition-colors disabled:opacity-50"
            data-testid="pickup-cancel"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="flex-1 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            data-testid="pickup-confirm"
          >
            {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {t('pickupConfirmHandover')}
          </button>
        </div>
      </div>
    );
  }

  // ── ENTRY ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto" data-testid="pickup-entry">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mb-1">{t('pickupPageTitle')}</h1>
        <p className="text-sm text-zinc-500">{t('pickupPageSubtitle')}</p>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-zinc-100">
          <button
            onClick={() => { setTab('code'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors ${
              tab === 'code' ? 'text-zinc-900 border-b-2 border-zinc-900' : 'text-zinc-400 hover:text-zinc-700'
            }`}
            data-testid="tab-code"
          >
            <KeyRound size={16} /> {t('pickupTabCode')}
          </button>
          <button
            onClick={() => { setTab('scan'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors ${
              tab === 'scan' ? 'text-zinc-900 border-b-2 border-zinc-900' : 'text-zinc-400 hover:text-zinc-700'
            }`}
            data-testid="tab-scan"
          >
            <ScanLine size={16} /> {t('pickupTabScan')}
          </button>
        </div>

        <div className="p-6">
          {tab === 'code' && (
            <form onSubmit={submitCode}>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
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
                className="w-full px-4 py-4 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-zinc-900 focus:outline-none text-2xl font-mono tracking-[0.18em] text-center text-zinc-900 uppercase"
                data-testid="pickup-code-input"
              />
              <p className="mt-2 text-[11px] text-zinc-400 text-center">
                {normalized.length}/8 {t('pickupCodeChars')}
              </p>
              {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={!canLookupCode || loading}
                className="mt-5 w-full py-3 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                data-testid="pickup-lookup-btn"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {t('pickupLookup')}
              </button>
            </form>
          )}

          {tab === 'scan' && (
            <form onSubmit={submitScan}>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                {t('pickupScanLabel')}
              </label>
              <input
                ref={scanRef}
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder={t('pickupScanPlaceholder')}
                autoComplete="off"
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-zinc-900 focus:outline-none text-sm text-zinc-900 font-mono"
                data-testid="pickup-scan-input"
              />
              <p className="mt-2 text-[11px] text-zinc-400 leading-relaxed">
                {t('pickupScanHint')}
              </p>
              {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={!scanInput.trim() || loading}
                className="mt-5 w-full py-3 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
