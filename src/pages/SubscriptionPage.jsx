import { CreditCard } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

const STATUS_COLORS = {
  active:   'bg-emerald-50 text-emerald-700',
  trial:    'bg-amber-50 text-amber-700',
  inactive: 'bg-red-50 text-red-600',
};

export default function SubscriptionPage({ auth }) {
  const { t } = useI18n();
  const org = auth?.organization;

  const PLAN_LABELS = {
    basic: 'Basic',
    pro: 'Pro',
    enterprise: 'Enterprise',
  };

  return (
    <div>
      <div className="mb-8">
        <h1 data-testid="subscription-heading" className="text-2xl font-semibold text-stone-900">{t('subscription')}</h1>
        <p className="text-sm text-stone-500 mt-1">{t('currentPlanAndBilling')}</p>
      </div>

      <div className="bg-white rounded-lg border border-stone-200 p-6 max-w-md">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-md bg-stone-100 flex items-center justify-center">
            <CreditCard size={16} className="text-stone-600" />
          </div>
          <div>
            <p data-testid="subscription-plan" className="text-sm font-semibold text-stone-900">
              {PLAN_LABELS[org?.subscription_plan] || org?.subscription_plan || '—'} {t('plan')}
            </p>
            <span data-testid="subscription-status" className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium capitalize ${STATUS_COLORS[org?.subscription_status] || 'bg-stone-100 text-stone-500'}`}>
              {org?.subscription_status || '—'}
            </span>
          </div>
        </div>

        <div className="text-sm text-stone-500 bg-stone-50 rounded-md p-4">
          {t('billingManagement')}
        </div>
      </div>
    </div>
  );
}
