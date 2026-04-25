import { useState, useEffect } from 'react';
import { QrCode, Save, RotateCcw, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../api';
import { useI18n } from '../contexts/I18nContext';

function Toggle({ enabled, onChange, testId }) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={() => onChange(!enabled)}
      className={`relative flex-shrink-0 w-11 h-6 rounded-full overflow-hidden transition-colors ${
        enabled ? 'btn-brand' : 'bg-slate-200'
      }`}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"
        style={{ transform: enabled ? 'translateX(22px)' : 'translateX(0)' }}
      />
    </button>
  );
}

function CardHeader({ title, description }) {
  return (
    <div className="px-6 py-5 border-b border-slate-100">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-500 mt-0.5">{description}</p>
    </div>
  );
}

function SectionActions({ saving, saved, hasChanges, onSave, onReset, error, t }) {
  return (
    <>
      {error && (
        <div className="mx-6 mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-xs text-red-600">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/60">
        <button
          onClick={onReset}
          disabled={!hasChanges}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {t('reset')}
        </button>
        <button
          onClick={onSave}
          disabled={saving || !hasChanges}
          className="flex items-center gap-2 px-4 py-2 rounded-md btn-brand text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : saved
            ? <CheckCircle className="w-3.5 h-3.5" />
            : <Save className="w-3.5 h-3.5" />
          }
          {saving ? t('saving') : saved ? t('saved') : t('saveChanges')}
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
    orgConfig.charge_users_for_recovery !== orgOriginal.charge_users_for_recovery ||
    orgConfig.verification_enabled !== orgOriginal.verification_enabled ||
    orgConfig.auto_accept_enabled !== orgOriginal.auto_accept_enabled ||
    orgConfig.auto_accept_match_threshold !== orgOriginal.auto_accept_match_threshold ||
    orgConfig.auto_accept_verification_threshold !== orgOriginal.auto_accept_verification_threshold
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
    if (orgConfig.charge_users_for_recovery !== orgOriginal.charge_users_for_recovery)
      updates.charge_users_for_recovery = orgConfig.charge_users_for_recovery;
    if (orgConfig.verification_enabled !== orgOriginal.verification_enabled)
      updates.verification_enabled = orgConfig.verification_enabled;
    if (orgConfig.auto_accept_enabled !== orgOriginal.auto_accept_enabled)
      updates.auto_accept_enabled = orgConfig.auto_accept_enabled;
    if (orgConfig.auto_accept_match_threshold !== orgOriginal.auto_accept_match_threshold)
      updates.auto_accept_match_threshold = orgConfig.auto_accept_match_threshold;
    if (orgConfig.auto_accept_verification_threshold !== orgOriginal.auto_accept_verification_threshold)
      updates.auto_accept_verification_threshold = orgConfig.auto_accept_verification_threshold;
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
        <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
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

      {/* Page header */}
      <div className="mb-8">
        <h1 data-testid="settings-heading" className="text-2xl font-semibold text-slate-900">
          {t('settings')}
        </h1>
        <p className="text-sm text-slate-500 mt-1">{t('manageConfiguration')}</p>
      </div>

      <div className="space-y-6">

        {/* Language */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <CardHeader
            title={t('language')}
            description={t('languageDesc')}
          />
          <div className="px-6 py-5">
            <div className="flex gap-2">
              {LANGUAGES.map(({ code, label }) => (
                <button
                  key={code}
                  data-testid={`lang-${code}`}
                  onClick={() => changeLanguage(code)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    language === code
                      ? 'btn-brand text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Fee Policy */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <CardHeader
            title={t('feePolicy')}
            description={t('feePolicyDesc')}
          />

          {orgConfig && (
            <div className="px-6 py-5">
              <div className="flex items-center justify-between gap-6">
                <div>
                  <p className="text-sm font-medium text-slate-900">{t('chargeUsersForRecovery')}</p>
                  <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">
                    {t('chargeUsersForRecoveryDesc')}
                  </p>
                </div>
                <Toggle
                  testId="charge-users-toggle"
                  enabled={!!orgConfig.charge_users_for_recovery}
                  onChange={(v) => setOrgConfig(c => ({ ...c, charge_users_for_recovery: v }))}
                />
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

        {/* Matching Behaviour */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <CardHeader
            title={t('matchingBehaviour')}
            description={t('matchingBehaviourDesc')}
          />

          {orgConfig && (
            <div className="px-6 py-5 space-y-6">

              {/* Verification enabled */}
              <div className="flex items-center justify-between gap-6">
                <div>
                  <p className="text-sm font-medium text-slate-900">{t('verificationEnabled')}</p>
                  <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{t('verificationEnabledDesc')}</p>
                </div>
                <Toggle
                  enabled={!!orgConfig.verification_enabled}
                  onChange={(v) => setOrgConfig(c => ({ ...c, verification_enabled: v }))}
                />
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100" />

              {/* Auto-accept enabled */}
              <div className="flex items-center justify-between gap-6">
                <div>
                  <p className="text-sm font-medium text-slate-900">{t('autoAcceptEnabled')}</p>
                  <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{t('autoAcceptEnabledDesc')}</p>
                </div>
                <Toggle
                  enabled={!!orgConfig.auto_accept_enabled}
                  onChange={(v) => setOrgConfig(c => ({ ...c, auto_accept_enabled: v }))}
                />
              </div>

              {/* Thresholds — only shown when auto-accept is on */}
              {orgConfig.auto_accept_enabled && (
                <div className="space-y-5 pl-4 border-l-2 border-teal-100">

                  {/* Match threshold */}
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-0.5">
                      {t('autoAcceptMatchThreshold')}
                    </label>
                    <p className="text-sm text-slate-500 mb-2">{t('autoAcceptMatchThresholdDesc')}</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round((orgConfig.auto_accept_match_threshold ?? 0.90) * 100)}
                        onChange={(e) => setOrgConfig(c => ({ ...c, auto_accept_match_threshold: parseInt(e.target.value) / 100 }))}
                        className="flex-1 accent-teal-600 h-1.5"
                      />
                      <span className="text-sm font-semibold text-slate-800 w-12 text-right tabular-nums">
                        {Math.round((orgConfig.auto_accept_match_threshold ?? 0.90) * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Verification threshold */}
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-0.5">
                      {t('autoAcceptVerificationThreshold')}
                    </label>
                    <p className="text-sm text-slate-500 mb-2">{t('autoAcceptVerificationThresholdDesc')}</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round((orgConfig.auto_accept_verification_threshold ?? 0.85) * 100)}
                        onChange={(e) => setOrgConfig(c => ({ ...c, auto_accept_verification_threshold: parseInt(e.target.value) / 100 }))}
                        className="flex-1 accent-teal-600 h-1.5"
                      />
                      <span className="text-sm font-semibold text-slate-800 w-12 text-right tabular-nums">
                        {Math.round((orgConfig.auto_accept_verification_threshold ?? 0.85) * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Warning when thresholds are low */}
                  {(orgConfig.auto_accept_match_threshold < 0.6 || orgConfig.auto_accept_verification_threshold < 0.6) && (
                    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 leading-relaxed">{t('autoAcceptWarning')}</p>
                    </div>
                  )}
                </div>
              )}
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
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
              <QrCode className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">{t('pickupQrCode')}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{t('configureQrHandover')}</p>
            </div>
          </div>

          {config && (
            <div className="px-6 py-5 space-y-6">

              {/* Enable toggle */}
              <div className="flex items-center justify-between gap-6">
                <div>
                  <p className="text-sm font-medium text-slate-900">{t('enableQrPickup')}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{t('generateQrCodes')}</p>
                </div>
                <Toggle
                  testId="pickup-qr-toggle"
                  enabled={config.pickup_qr_enabled}
                  onChange={(v) => setConfig(c => ({ ...c, pickup_qr_enabled: v }))}
                />
              </div>

              {/* Expiry hours */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  {t('qrExpiryHours')}
                </label>
                <p className="text-sm text-slate-500 mb-3">{t('qrExpiryDesc')}</p>
                <div className="flex items-center gap-3">
                  <input
                    data-testid="pickup-qr-expiry"
                    type="number"
                    min={1}
                    max={720}
                    value={config.pickup_qr_expiry_hours}
                    onChange={(e) => setConfig(c => ({ ...c, pickup_qr_expiry_hours: parseInt(e.target.value) || 1 }))}
                    className="w-28 h-9 px-3 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                  />
                  <span className="text-sm text-slate-500">{t('hoursRange')}</span>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  {t('pickupInstructions')}
                </label>
                <p className="text-sm text-slate-500 mb-3">{t('pickupInstructionsDesc')}</p>
                <textarea
                  data-testid="pickup-instructions"
                  value={config.pickup_instructions}
                  onChange={(e) => setConfig(c => ({ ...c, pickup_instructions: e.target.value }))}
                  placeholder={t('pickupInstructionsPlaceholder')}
                  maxLength={1000}
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 placeholder:text-slate-400 transition-colors"
                />
                <p className="text-xs text-slate-400 mt-1.5 text-right">
                  {config.pickup_instructions.length}/1000
                </p>
              </div>
            </div>
          )}

          <SectionActions
            saving={saving}
            saved={saved}
            hasChanges={hasChanges}
            onSave={handleSave}
            onReset={handleReset}
            error={error}
            t={t}
          />
        </div>

      </div>
    </div>
  );
}
