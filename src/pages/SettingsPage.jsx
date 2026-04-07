import { useState, useEffect } from 'react';
import { Settings, QrCode, Save, RotateCcw, Loader2, CheckCircle, Globe, Euro } from 'lucide-react';
import api from '../api';
import { useI18n } from '../contexts/I18nContext';

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

function SectionActions({ saving, saved, hasChanges, onSave, onReset, error, t }) {
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
          {saving ? t('saving') : saved ? t('saved') : t('saveChanges')}
        </button>
        <button
          onClick={onReset}
          disabled={!hasChanges}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 text-zinc-600 text-[12px] font-semibold hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> {t('reset')}
        </button>
      </div>
    </>
  );
}

export default function SettingsPage({ auth }) {
  const { t, language, changeLanguage } = useI18n();
  const [config, setConfig] = useState(null);
  const [original, setOriginal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  // Org-level settings (fee policy etc.)
  const [orgConfig, setOrgConfig] = useState(null);
  const [orgOriginal, setOrgOriginal] = useState(null);
  const [orgSaving, setOrgSaving] = useState(false);
  const [orgSaved, setOrgSaved] = useState(false);
  const [orgError, setOrgError] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/business/items/settings/pickup'),
      api.get('/business/items/settings/org'),
    ])
      .then(([pickupRes, orgRes]) => {
        setConfig(pickupRes.data);
        setOriginal(pickupRes.data);
        setOrgConfig(orgRes.data);
        setOrgOriginal(orgRes.data);
      })
      .catch(() => setError(t('failedToLoadSettings')))
      .finally(() => setLoading(false));
  }, []);

  const hasChanges = config && original && (
    config.pickup_qr_enabled !== original.pickup_qr_enabled ||
    config.pickup_qr_expiry_hours !== original.pickup_qr_expiry_hours ||
    config.pickup_instructions !== original.pickup_instructions
  );

  const hasOrgChanges = orgConfig && orgOriginal && (
    orgConfig.charge_users_for_recovery !== orgOriginal.charge_users_for_recovery
  );

  async function handleSave() {
    const updates = {};
    if (config.pickup_qr_enabled !== original.pickup_qr_enabled) updates.pickup_qr_enabled = config.pickup_qr_enabled;
    if (config.pickup_qr_expiry_hours !== original.pickup_qr_expiry_hours) updates.pickup_qr_expiry_hours = config.pickup_qr_expiry_hours;
    if (config.pickup_instructions !== original.pickup_instructions) updates.pickup_instructions = config.pickup_instructions;
    if (!Object.keys(updates).length) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await api.put('/business/items/settings/pickup', updates);
      setConfig(res.data);
      setOriginal(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(Array.isArray(detail) ? detail.join(', ') : detail || t('failedToSave'));
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setConfig({ ...original });
    setError(null);
  }

  async function handleOrgSave() {
    const updates = {};
    if (orgConfig.charge_users_for_recovery !== orgOriginal.charge_users_for_recovery) {
      updates.charge_users_for_recovery = orgConfig.charge_users_for_recovery;
    }
    if (!Object.keys(updates).length) return;
    setOrgSaving(true);
    setOrgError(null);
    setOrgSaved(false);
    try {
      const res = await api.put('/business/items/settings/org', updates);
      setOrgConfig(res.data);
      setOrgOriginal(res.data);
      setOrgSaved(true);
      setTimeout(() => setOrgSaved(false), 3000);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setOrgError(Array.isArray(detail) ? detail.join(', ') : detail || t('failedToSave'));
    } finally {
      setOrgSaving(false);
    }
  }

  function handleOrgReset() {
    setOrgConfig({ ...orgOriginal });
    setOrgError(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  const LANGUAGES = [
    { code: 'en', label: t('english') },
    { code: 'es', label: t('spanish') },
    { code: 'ca', label: t('catalan') },
  ];

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 data-testid="settings-heading" className="text-xl font-extrabold text-zinc-900 tracking-tight">{t('settings')}</h1>
          <p className="text-[12px] text-zinc-400">{t('manageConfiguration')}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Language */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-zinc-100">
            <Globe className="w-5 h-5 text-zinc-500" />
            <div>
              <h2 className="text-[14px] font-bold text-zinc-900">{t('language')}</h2>
              <p className="text-[11px] text-zinc-400">{t('languageDesc')}</p>
            </div>
          </div>
          <div className="p-5">
            <div className="flex gap-2">
              {LANGUAGES.map(({ code, label }) => (
                <button
                  key={code}
                  data-testid={`lang-${code}`}
                  onClick={() => changeLanguage(code)}
                  className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                    language === code
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Fee Policy */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-zinc-100">
            <Euro className="w-5 h-5 text-teal-600" />
            <div>
              <h2 className="text-[14px] font-bold text-zinc-900">{t('feePolicy')}</h2>
              <p className="text-[11px] text-zinc-400">{t('feePolicyDesc')}</p>
            </div>
          </div>

          {orgConfig && (
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1 pr-4">
                  <p className="text-[13px] font-semibold text-zinc-800">{t('chargeUsersForRecovery')}</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    {t('chargeUsersForRecoveryDesc')}
                  </p>
                </div>
                <span data-testid="charge-users-toggle">
                  <Toggle
                    enabled={!!orgConfig.charge_users_for_recovery}
                    onChange={(v) => setOrgConfig(c => ({ ...c, charge_users_for_recovery: v }))}
                  />
                </span>
              </div>
            </div>
          )}

          <SectionActions
            saving={orgSaving}
            saved={orgSaved}
            hasChanges={hasOrgChanges}
            onSave={handleOrgSave}
            onReset={handleOrgReset}
            error={orgError}
            t={t}
          />
        </div>

        {/* Pickup QR */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-zinc-100">
            <QrCode className="w-5 h-5 text-teal-600" />
            <div>
              <h2 className="text-[14px] font-bold text-zinc-900">{t('pickupQrCode')}</h2>
              <p className="text-[11px] text-zinc-400">{t('configureQrHandover')}</p>
            </div>
          </div>

          {config && (
            <div className="p-5 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-zinc-800">{t('enableQrPickup')}</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {t('generateQrCodes')}
                  </p>
                </div>
                <span data-testid="pickup-qr-toggle">
                  <Toggle
                    enabled={config.pickup_qr_enabled}
                    onChange={(v) => setConfig(c => ({ ...c, pickup_qr_enabled: v }))}
                  />
                </span>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-zinc-800 mb-1.5">{t('qrExpiryHours')}</label>
                <p className="text-[11px] text-zinc-400 mb-2">{t('qrExpiryDesc')}</p>
                <input
                  data-testid="pickup-qr-expiry"
                  type="number"
                  min={1}
                  max={720}
                  value={config.pickup_qr_expiry_hours}
                  onChange={(e) => setConfig(c => ({ ...c, pickup_qr_expiry_hours: parseInt(e.target.value) || 1 }))}
                  className="w-32 px-3 py-2 text-[13px] border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400"
                />
                <span className="ml-2 text-[11px] text-zinc-400">{t('hoursRange')}</span>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-zinc-800 mb-1.5">{t('pickupInstructions')}</label>
                <p className="text-[11px] text-zinc-400 mb-2">
                  {t('pickupInstructionsDesc')}
                </p>
                <textarea
                  data-testid="pickup-instructions"
                  value={config.pickup_instructions}
                  onChange={(e) => setConfig(c => ({ ...c, pickup_instructions: e.target.value }))}
                  placeholder={t('pickupInstructionsPlaceholder')}
                  maxLength={1000}
                  rows={3}
                  className="w-full px-3 py-2 text-[13px] border border-zinc-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 placeholder:text-zinc-300"
                />
                <p className="text-[10px] text-zinc-300 mt-1 text-right">{config.pickup_instructions.length}/1000</p>
              </div>
            </div>
          )}

          <SectionActions saving={saving} saved={saved} hasChanges={hasChanges} onSave={handleSave} onReset={handleReset} error={error} t={t} />
        </div>
      </div>
    </div>
  );
}
