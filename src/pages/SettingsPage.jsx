import { useState, useEffect } from 'react';
import { Settings, QrCode, Save, RotateCcw, Loader2, CheckCircle } from 'lucide-react';
import api from '../api';

export default function SettingsPage({ auth }) {
  const [config, setConfig] = useState(null);
  const [original, setOriginal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const res = await api.get('/business/items/settings/pickup');
      setConfig(res.data);
      setOriginal(res.data);
    } catch (err) {
      setError('Failed to load pickup settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    const updates = {};
    if (config.pickup_qr_enabled !== original.pickup_qr_enabled) {
      updates.pickup_qr_enabled = config.pickup_qr_enabled;
    }
    if (config.pickup_qr_expiry_hours !== original.pickup_qr_expiry_hours) {
      updates.pickup_qr_expiry_hours = config.pickup_qr_expiry_hours;
    }
    if (config.pickup_instructions !== original.pickup_instructions) {
      updates.pickup_instructions = config.pickup_instructions;
    }

    if (Object.keys(updates).length === 0) {
      setSaving(false);
      return;
    }

    try {
      const res = await api.put('/business/items/settings/pickup', updates);
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

  function handleReset() {
    setConfig({ ...original });
    setError(null);
  }

  const hasChanges = config && original && (
    config.pickup_qr_enabled !== original.pickup_qr_enabled ||
    config.pickup_qr_expiry_hours !== original.pickup_qr_expiry_hours ||
    config.pickup_instructions !== original.pickup_instructions
  );

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
          <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight">Settings</h1>
          <p className="text-[12px] text-zinc-400">Manage your organisation's configuration</p>
        </div>
      </div>

      {/* Pickup QR Section */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="flex items-center gap-3 p-5 border-b border-zinc-100">
          <QrCode className="w-5 h-5 text-teal-600" />
          <div>
            <h2 className="text-[14px] font-bold text-zinc-900">Pickup QR Code</h2>
            <p className="text-[11px] text-zinc-400">Configure QR-based item handover for your venue</p>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* QR Enabled Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold text-zinc-800">Enable QR pickup</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Generate QR codes for paid matches so customers can pick up items at your venue
              </p>
            </div>
            <button
              onClick={() => setConfig(c => ({ ...c, pickup_qr_enabled: !c.pickup_qr_enabled }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                config.pickup_qr_enabled ? 'bg-teal-600' : 'bg-zinc-200'
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                config.pickup_qr_enabled ? 'translate-x-5.5 left-0.5' : 'left-0.5'
              }`}
              style={{ transform: config.pickup_qr_enabled ? 'translateX(22px)' : 'translateX(0)' }}
              />
            </button>
          </div>

          {/* Expiry Hours */}
          <div>
            <label className="block text-[13px] font-semibold text-zinc-800 mb-1.5">
              QR code expiry (hours)
            </label>
            <p className="text-[11px] text-zinc-400 mb-2">
              How long the pickup QR code remains valid after payment
            </p>
            <input
              type="number"
              min={1}
              max={720}
              value={config.pickup_qr_expiry_hours}
              onChange={(e) => setConfig(c => ({ ...c, pickup_qr_expiry_hours: parseInt(e.target.value) || 1 }))}
              className="w-32 px-3 py-2 text-[13px] border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400"
            />
            <span className="ml-2 text-[11px] text-zinc-400">hours (1-720)</span>
          </div>

          {/* Pickup Instructions */}
          <div>
            <label className="block text-[13px] font-semibold text-zinc-800 mb-1.5">
              Pickup instructions
            </label>
            <p className="text-[11px] text-zinc-400 mb-2">
              Instructions shown to the customer when they arrive at your venue (visible on the QR pickup page)
            </p>
            <textarea
              value={config.pickup_instructions}
              onChange={(e) => setConfig(c => ({ ...c, pickup_instructions: e.target.value }))}
              placeholder="e.g. Go to the front desk and show this QR code to our staff."
              maxLength={1000}
              rows={3}
              className="w-full px-3 py-2 text-[13px] border border-zinc-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 placeholder:text-zinc-300"
            />
            <p className="text-[10px] text-zinc-300 mt-1 text-right">
              {config.pickup_instructions.length}/1000
            </p>
          </div>
        </div>

        {/* Actions */}
        {error && (
          <div className="mx-5 mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-[12px] text-red-600">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 px-5 py-4 border-t border-zinc-100 bg-zinc-50/50">
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 text-white text-[12px] font-semibold hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <CheckCircle className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 text-zinc-600 text-[12px] font-semibold hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>
    </div>
  );
}
