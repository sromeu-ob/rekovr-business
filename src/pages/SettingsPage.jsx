import { useState, useEffect } from 'react';
import { Settings, QrCode, Save, RotateCcw, Loader2, CheckCircle, Shield, Eye, Zap } from 'lucide-react';
import api from '../api';

function Toggle({ enabled, onChange }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        enabled ? 'bg-teal-600' : 'bg-zinc-200'
      }`}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
        style={{ transform: enabled ? 'translateX(22px)' : 'translateX(0)' }}
      />
    </button>
  );
}

function SectionActions({ saving, saved, hasChanges, onSave, onReset, error }) {
  return (
    <>
      {error && (
        <div className="mx-5 mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-[12px] text-red-600">
          {error}
        </div>
      )}
      <div className="flex items-center gap-3 px-5 py-4 border-t border-zinc-100 bg-zinc-50/50">
        <button
          onClick={onSave}
          disabled={saving || !hasChanges}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 text-white text-[12px] font-semibold hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <CheckCircle className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
        <button
          onClick={onReset}
          disabled={!hasChanges}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 text-zinc-600 text-[12px] font-semibold hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>
    </>
  );
}

function useSettings(endpoint) {
  const [config, setConfig] = useState(null);
  const [original, setOriginal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(endpoint)
      .then(res => { setConfig(res.data); setOriginal(res.data); })
      .catch(() => setError('Failed to load settings'))
      .finally(() => setLoading(false));
  }, [endpoint]);

  async function save(updates) {
    if (!Object.keys(updates).length) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await api.put(endpoint, updates);
      setConfig(res.data);
      setOriginal(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(Array.isArray(detail) ? detail.join(', ') : detail || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setConfig({ ...original });
    setError(null);
  }

  return { config, setConfig, original, loading, saving, saved, error, save, reset };
}

// ── Pickup QR section ────────────────────────────────────────────────────────

function PickupSection({ s }) {
  const hasChanges = s.config && s.original && (
    s.config.pickup_qr_enabled !== s.original.pickup_qr_enabled ||
    s.config.pickup_qr_expiry_hours !== s.original.pickup_qr_expiry_hours ||
    s.config.pickup_instructions !== s.original.pickup_instructions
  );

  function handleSave() {
    const updates = {};
    if (s.config.pickup_qr_enabled !== s.original.pickup_qr_enabled) updates.pickup_qr_enabled = s.config.pickup_qr_enabled;
    if (s.config.pickup_qr_expiry_hours !== s.original.pickup_qr_expiry_hours) updates.pickup_qr_expiry_hours = s.config.pickup_qr_expiry_hours;
    if (s.config.pickup_instructions !== s.original.pickup_instructions) updates.pickup_instructions = s.config.pickup_instructions;
    s.save(updates);
  }

  if (s.loading) return null;

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="flex items-center gap-3 p-5 border-b border-zinc-100">
        <QrCode className="w-5 h-5 text-teal-600" />
        <div>
          <h2 className="text-[14px] font-bold text-zinc-900">Pickup QR Code</h2>
          <p className="text-[11px] text-zinc-400">Configure QR-based item handover for your venue</p>
        </div>
      </div>

      <div className="p-5 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-zinc-800">Enable QR pickup</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Generate QR codes for paid matches so customers can pick up items at your venue
            </p>
          </div>
          <span data-testid="pickup-qr-toggle">
            <Toggle
              enabled={s.config.pickup_qr_enabled}
              onChange={(v) => s.setConfig(c => ({ ...c, pickup_qr_enabled: v }))}
            />
          </span>
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-zinc-800 mb-1.5">QR code expiry (hours)</label>
          <p className="text-[11px] text-zinc-400 mb-2">How long the pickup QR code remains valid after payment</p>
          <input
            data-testid="pickup-qr-expiry"
            type="number"
            min={1}
            max={720}
            value={s.config.pickup_qr_expiry_hours}
            onChange={(e) => s.setConfig(c => ({ ...c, pickup_qr_expiry_hours: parseInt(e.target.value) || 1 }))}
            className="w-32 px-3 py-2 text-[13px] border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400"
          />
          <span className="ml-2 text-[11px] text-zinc-400">hours (1-720)</span>
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-zinc-800 mb-1.5">Pickup instructions</label>
          <p className="text-[11px] text-zinc-400 mb-2">
            Instructions shown to the customer when they arrive at your venue (visible on the QR pickup page)
          </p>
          <textarea
            data-testid="pickup-instructions"
            value={s.config.pickup_instructions}
            onChange={(e) => s.setConfig(c => ({ ...c, pickup_instructions: e.target.value }))}
            placeholder="e.g. Go to the front desk and show this QR code to our staff."
            maxLength={1000}
            rows={3}
            className="w-full px-3 py-2 text-[13px] border border-zinc-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 placeholder:text-zinc-300"
          />
          <p className="text-[10px] text-zinc-300 mt-1 text-right">{s.config.pickup_instructions.length}/1000</p>
        </div>
      </div>

      <SectionActions saving={s.saving} saved={s.saved} hasChanges={hasChanges} onSave={handleSave} onReset={s.reset} error={s.error} />
    </div>
  );
}

// ── Org settings section ─────────────────────────────────────────────────────

const VISIBILITY_OPTIONS = [
  {
    value: 'shared',
    label: 'Shared',
    desc: 'All operators see all items and matches. Best for venues with shared staff (theaters, airports, hotels).',
  },
  {
    value: 'individual',
    label: 'Individual',
    desc: 'Each operator only sees items they registered. Best for fleets or independent operators (taxis, couriers).',
  },
];

function OrgSection({ s }) {
  const hasChanges = s.config && s.original && (
    s.config.auto_accept_enabled !== s.original.auto_accept_enabled ||
    s.config.auto_accept_match_threshold !== s.original.auto_accept_match_threshold ||
    s.config.auto_accept_verification_threshold !== s.original.auto_accept_verification_threshold ||
    s.config.verification_enabled !== s.original.verification_enabled ||
    s.config.operator_visibility !== s.original.operator_visibility
  );

  function handleSave() {
    const updates = {};
    if (s.config.auto_accept_enabled !== s.original.auto_accept_enabled) updates.auto_accept_enabled = s.config.auto_accept_enabled;
    if (s.config.auto_accept_match_threshold !== s.original.auto_accept_match_threshold) updates.auto_accept_match_threshold = s.config.auto_accept_match_threshold;
    if (s.config.auto_accept_verification_threshold !== s.original.auto_accept_verification_threshold) updates.auto_accept_verification_threshold = s.config.auto_accept_verification_threshold;
    if (s.config.verification_enabled !== s.original.verification_enabled) updates.verification_enabled = s.config.verification_enabled;
    if (s.config.operator_visibility !== s.original.operator_visibility) updates.operator_visibility = s.config.operator_visibility;
    s.save(updates);
  }

  if (s.loading) return null;

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      {/* ── Operator Visibility ─────────────────────────────────── */}
      <div className="flex items-center gap-3 p-5 border-b border-zinc-100">
        <Eye className="w-5 h-5 text-indigo-600" />
        <div>
          <h2 className="text-[14px] font-bold text-zinc-900">Operator Visibility</h2>
          <p className="text-[11px] text-zinc-400">Control what operators can see in the dashboard</p>
        </div>
      </div>

      <div className="p-5 space-y-3">
        {VISIBILITY_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
              s.config.operator_visibility === opt.value
                ? 'border-indigo-300 bg-indigo-50/50'
                : 'border-zinc-100 hover:border-zinc-200'
            }`}
          >
            <input
              data-testid={`visibility-${opt.value}`}
              type="radio"
              name="operator_visibility"
              value={opt.value}
              checked={s.config.operator_visibility === opt.value}
              onChange={() => s.setConfig(c => ({ ...c, operator_visibility: opt.value }))}
              className="mt-0.5 accent-indigo-600"
            />
            <div>
              <p className="text-[13px] font-semibold text-zinc-800">{opt.label}</p>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">{opt.desc}</p>
            </div>
          </label>
        ))}
      </div>

      {/* ── Verification ───────────────────────────────────────── */}
      <div className="flex items-center gap-3 p-5 border-t border-b border-zinc-100">
        <Shield className="w-5 h-5 text-amber-600" />
        <div>
          <h2 className="text-[14px] font-bold text-zinc-900">Verification</h2>
          <p className="text-[11px] text-zinc-400">AI-based ownership verification for claimants</p>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-zinc-800">Enable verification</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Claimants must answer AI-generated questions before a match is accepted
            </p>
          </div>
          <span data-testid="verification-toggle">
            <Toggle
              enabled={s.config.verification_enabled}
              onChange={(v) => s.setConfig(c => ({ ...c, verification_enabled: v }))}
            />
          </span>
        </div>
      </div>

      {/* ── Auto-accept ────────────────────────────────────────── */}
      <div className="flex items-center gap-3 p-5 border-t border-b border-zinc-100">
        <Zap className="w-5 h-5 text-emerald-600" />
        <div>
          <h2 className="text-[14px] font-bold text-zinc-900">Auto-accept</h2>
          <p className="text-[11px] text-zinc-400">Automatically accept matches that pass both score thresholds</p>
        </div>
      </div>

      <div className="p-5 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-zinc-800">Enable auto-accept</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Matches exceeding both thresholds are accepted without manual review
            </p>
          </div>
          <span data-testid="auto-accept-toggle">
            <Toggle
              enabled={s.config.auto_accept_enabled}
              onChange={(v) => s.setConfig(c => ({ ...c, auto_accept_enabled: v }))}
            />
          </span>
        </div>

        {s.config.auto_accept_enabled && (
          <div className="space-y-4 pl-1">
            <div>
              <label className="block text-[13px] font-semibold text-zinc-800 mb-1.5">
                Match score threshold
              </label>
              <p className="text-[11px] text-zinc-400 mb-2">Minimum AI match score required (0–100%)</p>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(s.config.auto_accept_match_threshold * 100)}
                  onChange={(e) => s.setConfig(c => ({ ...c, auto_accept_match_threshold: parseInt(e.target.value) / 100 }))}
                  className="flex-1 accent-emerald-600 h-1.5"
                />
                <span className="text-[13px] font-semibold text-zinc-800 w-12 text-right tabular-nums">
                  {Math.round(s.config.auto_accept_match_threshold * 100)}%
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-zinc-800 mb-1.5">
                Verification score threshold
              </label>
              <p className="text-[11px] text-zinc-400 mb-2">Minimum verification score required (0–100%)</p>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(s.config.auto_accept_verification_threshold * 100)}
                  onChange={(e) => s.setConfig(c => ({ ...c, auto_accept_verification_threshold: parseInt(e.target.value) / 100 }))}
                  className="flex-1 accent-emerald-600 h-1.5"
                />
                <span className="text-[13px] font-semibold text-zinc-800 w-12 text-right tabular-nums">
                  {Math.round(s.config.auto_accept_verification_threshold * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <SectionActions saving={s.saving} saved={s.saved} hasChanges={hasChanges} onSave={handleSave} onReset={s.reset} error={s.error} />
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function SettingsPage({ auth }) {
  const pickup = useSettings('/business/items/settings/pickup');
  const org = useSettings('/business/items/settings/org');

  const loading = pickup.loading || org.loading;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 data-testid="settings-heading" className="text-xl font-extrabold text-zinc-900 tracking-tight">Settings</h1>
          <p className="text-[12px] text-zinc-400">Manage your organisation's configuration</p>
        </div>
      </div>

      <div className="space-y-6">
        <OrgSection s={org} />
        <PickupSection s={pickup} />
      </div>
    </div>
  );
}
