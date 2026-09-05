import { useState } from 'react';
import { Mail, AlertTriangle, Check, Package, Lock } from 'lucide-react';
import api, { photoUrl } from '../api';
import { useI18n } from '../contexts/I18nContext';
import { Modal, Button, Input, Label, Alert } from './ui';

/**
 * Turn the phone call into a claim.
 *
 * Somebody rang about something they lost, the operator found it in their own
 * list, and this sends that caller a link to prove it is theirs. It does not
 * hand over the item and it does not tell them what the item is: the match is
 * born needing verification, and the questions decide.
 *
 * The operator types the email and nothing else. Any description they wrote
 * would be contaminated — they are looking at the item while they type — and
 * would also shrink the questions, because the generator skips whatever the
 * claimant has already described.
 *
 * Mounted only while open (the page unmounts it on close), so every opening
 * starts from a clean slate without an effect to reset it.
 *
 * Two states. For an item rich enough to build questions from, this is one
 * field and a button. For one that is not, the server refuses with
 * `unverifiable_item` until the operator says out loud that the judgement is
 * theirs — because for "black umbrella, no photo" nothing else in the flow
 * will check anything, and that decision belongs to a person, on the record.
 */
export default function ClaimInviteModal({ item, open, onClose, onInvited }) {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [needsAck, setNeedsAck] = useState(false);
  const [result, setResult] = useState(null);

  const send = async (acknowledge) => {
    setBusy(true);
    setError(null);
    try {
      const res = await api.post(`/business/items/${item.item_id}/invite-claimant`, {
        email: email.trim(),
        acknowledge_unverifiable: acknowledge,
      });
      setResult(res.data);
      onInvited?.(res.data);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (detail === 'unverifiable_item') {
        // Not a failure — the operator has not been asked yet.
        setNeedsAck(true);
      } else {
        setError(detail || t('claimInviteGenericError'));
      }
    }
    setBusy(false);
  };

  const emailLooksValid = /\S+@\S+\.\S+/.test(email.trim());
  const photo = item?.photos?.[0];

  if (result) {
    return (
      <Modal open={open} onClose={onClose} title={t('claimInviteSentTitle')} size="md">
        <div className="flex flex-col items-center text-center py-4" data-testid="claim-invite-sent">
          <div className="w-11 h-11 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
            <Check size={20} className="text-emerald-600" />
          </div>
          <p className="text-sm font-semibold text-slate-900">
            {result.resent ? t('claimInviteResent') : t('claimInviteSent')}
          </p>
          <p className="text-xs text-slate-500 mt-1">{result.email}</p>
          <p className="text-xs text-slate-400 mt-3 max-w-sm leading-relaxed">
            {t('claimInviteSentNote')}
          </p>
          <Button variant="secondary" onClick={onClose} className="mt-5">
            {t('close')}
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('claimInviteModalTitle')}
      size="md"
      footer={
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t('cancel')}
          </Button>
          <Button
            // `destructive` is reserved for irreversible deletes (see the
            // ui/ README). Sending an invitation is neither, so the warning
            // is carried by the amber alert and the button just stops being
            // the happy-path accent.
            variant={needsAck ? 'primary' : 'accent'}
            onClick={() => send(needsAck)}
            loading={busy}
            disabled={!emailLooksValid || busy}
            leftIcon={Mail}
            data-testid="claim-invite-send-btn"
          >
            {needsAck ? t('claimInviteSendAnyway') : t('claimInviteSend')}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4" data-testid="claim-invite-modal">
        <p className="text-xs text-slate-500 leading-relaxed">
          {t('claimInviteModalIntro')}
        </p>

        <div>
          <Label variant="uppercase">{t('claimInviteItemLabel')}</Label>
          <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50">
            {photo ? (
              <img src={photoUrl(photo)} alt="" className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
            ) : (
              <span className="w-10 h-10 rounded-md bg-slate-200 flex items-center justify-center flex-shrink-0">
                <Package size={16} className="text-slate-400" />
              </span>
            )}
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-900 truncate">{item?.title}</span>
              <span className="block text-xs text-slate-400 mt-0.5 truncate">
                {[item?.address, item?.photos?.length ? t('claimInviteWithPhoto') : t('claimInviteNoPhoto')]
                  .filter(Boolean).join(' · ')}
              </span>
            </span>
          </div>
        </div>

        <div>
          <Label variant="uppercase" htmlFor="claim-invite-email">
            {t('claimInviteEmailLabel')}
          </Label>
          <Input
            id="claim-invite-email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setNeedsAck(false); }}
            placeholder="nom@exemple.com"
            autoFocus
            data-testid="claim-invite-email-input"
          />
        </div>

        {needsAck ? (
          <Alert variant="warning" title={t('claimInviteUnverifiableTitle')} icon={AlertTriangle}>
            <span data-testid="claim-invite-unverifiable">{t('claimInviteUnverifiableBody')}</span>
          </Alert>
        ) : (
          <div className="flex gap-2.5 p-3 rounded-lg bg-teal-50/60 border border-teal-100">
            <Lock size={14} className="text-teal-700 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-teal-800 leading-relaxed">{t('claimInviteVeilExplainer')}</p>
          </div>
        )}

        {error && <Alert variant="error">{error}</Alert>}
      </div>
    </Modal>
  );
}
