import { useState, useEffect } from 'react';
import {
  MapPin, ShieldCheck, ScanLine, Printer, Check, ExternalLink, Package,
} from 'lucide-react';
import api, { photoUrl } from '../api';
import { useI18n } from '../contexts/I18nContext';
import { Modal, Button } from './ui';

function fmtMoney(amount, currency = 'eur') {
  if (amount == null) return '';
  const cur = (currency || 'eur').toUpperCase();
  const n = Number(amount).toFixed(2);
  return cur === 'EUR' ? `${n} €` : `${n} ${cur}`;
}

function addressLine(dest) {
  if (!dest) return '';
  return [dest.address_line1, dest.address_line2, dest.postal_code, dest.city, dest.country]
    .filter(Boolean)
    .join(', ');
}

/**
 * The pack gesture: confirm the item + destination, optionally bind the Rekovr
 * Kit bag code, and book the carrier label. Two states — the form, then the
 * success panel with the tracking number and a label to print. Packing is
 * idempotent server-side, so reopening an already-booked shipment lands
 * straight on the success panel.
 */
export default function PackShipmentModal({ shipment, open, onClose, onPacked }) {
  const { t } = useI18n();
  const [bagCode, setBagCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Reset whenever a different shipment opens. An already-booked shipment
  // (tracking present) opens directly on the success panel.
  useEffect(() => {
    if (!open) return;
    setBagCode(shipment?.bag_code || '');
    setError(null);
    setResult(shipment?.tracking_number ? shipment : null);
    setBusy(false);
  }, [open, shipment]);

  if (!shipment) return null;

  const item = shipment.item || {};
  const dest = shipment.destination || {};
  const cur = shipment.currency || 'eur';

  const handlePack = async (e) => {
    e?.preventDefault?.();
    setBusy(true);
    setError(null);
    try {
      const body = {};
      const trimmed = bagCode.trim();
      if (trimmed) body.bag_code = trimmed;
      const res = await api.post(`/business/shipments/${shipment.shipment_id}/pack`, body);
      setResult(res.data);
      onPacked?.(res.data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError((typeof detail === 'string' && detail) || t('packFailed'));
    } finally {
      setBusy(false);
    }
  };

  const done = () => { onClose?.(); };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={result ? undefined : t('packTitle')}
    >
      {result ? (
        // ── Success ──────────────────────────────────────────────────────
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center text-center gap-1 pt-1">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-1">
              <Check size={22} className="text-emerald-600" />
            </div>
            <p className="text-base font-semibold text-slate-900">{t('packSuccessTitle')}</p>
            <p className="text-[13px] text-slate-500 max-w-xs">
              {result.bag_code
                ? t('packSuccessDesc').replace('{bag}', result.bag_code)
                : t('packSuccessDescNoBag')}
            </p>
          </div>

          {result.tracking_number && (
            <a
              href={result.tracking_url || '#'}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3.5 py-3 hover:border-slate-300 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{t('packTracking')}</p>
                <p className="font-mono text-[13px] text-slate-900 truncate">{result.tracking_number}</p>
              </div>
              {result.tracking_url && <ExternalLink size={15} className="text-slate-400 flex-shrink-0" />}
            </a>
          )}

          <div className="flex flex-col gap-2">
            {result.label_url && (
              <Button
                variant="accent"
                fullWidth
                leftIcon={Printer}
                onClick={() => window.open(result.label_url, '_blank', 'noopener')}
              >
                {t('packPrintLabel')}
              </Button>
            )}
            <Button variant="secondary" fullWidth onClick={done}>{t('packDone')}</Button>
          </div>
        </div>
      ) : (
        // ── Form ─────────────────────────────────────────────────────────
        <form onSubmit={handlePack} className="flex flex-col gap-3">
          {/* Item */}
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
            {item.photo ? (
              <img src={photoUrl(item.photo)} alt="" className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Package size={16} className="text-slate-300" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold text-slate-900 truncate">{item.title || '—'}</p>
              {item.category && <p className="text-[11.5px] text-slate-400 capitalize">{item.category}</p>}
            </div>
          </div>

          {/* Destination */}
          <div className="flex items-start gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
            <MapPin size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-slate-900 truncate">{dest.name || '—'}</p>
              <p className="text-[11.5px] text-slate-500 leading-snug">{addressLine(dest)}</p>
            </div>
          </div>

          {/* Coverage */}
          {shipment.coverage != null && (
            <div className="flex items-center gap-3 rounded-lg border border-teal-200 bg-teal-50/60 px-3 py-2.5">
              <ShieldCheck size={16} className="text-teal-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-teal-800">
                  {t('packCoverage').replace('{amount}', fmtMoney(shipment.coverage, cur))}
                </p>
                <p className="text-[11px] text-teal-700">{t('packCoverageDesc')}</p>
              </div>
            </div>
          )}

          {/* Bag code */}
          <div className="pt-1">
            <label className="flex items-center gap-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {t('packBagLabel')}
              <span className="normal-case tracking-normal font-medium text-slate-300">· {t('packBagOptional')}</span>
            </label>
            <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-teal-500 px-3 transition-colors">
              <ScanLine size={16} className="text-slate-400 flex-shrink-0" />
              <input
                autoFocus
                value={bagCode}
                onChange={(e) => setBagCode(e.target.value)}
                placeholder="RK-____"
                className="flex-1 bg-transparent py-2.5 font-mono text-[15px] text-slate-900 placeholder:text-slate-300 focus:outline-none"
                data-testid="bag-code-input"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">{t('packBagHelp')}</p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-100 px-3 py-2 text-[12.5px] text-red-700">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="accent"
            fullWidth
            loading={busy}
            leftIcon={Printer}
            data-testid="generate-label-btn"
          >
            {t('packGenerate')}
          </Button>
        </form>
      )}
    </Modal>
  );
}
