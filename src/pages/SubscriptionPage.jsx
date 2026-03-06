import { CreditCard } from 'lucide-react';

const PLAN_LABELS = { basic: 'Basic', pro: 'Pro', enterprise: 'Enterprise' };
const STATUS_COLORS = {
  active:   'bg-green-50 text-green-700',
  trial:    'bg-blue-50 text-blue-700',
  inactive: 'bg-red-50 text-red-600',
};

export default function SubscriptionPage({ auth }) {
  const org = auth?.organization;

  return (
    <div>
      <div className="mb-8">
        <h2 data-testid="subscription-heading" className="text-[22px] font-extrabold text-zinc-900">Subscription</h2>
        <p className="text-[13px] text-zinc-400 mt-1">Your current plan and billing details.</p>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-100 p-6 max-w-md">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center">
            <CreditCard size={16} className="text-white" />
          </div>
          <div>
            <p data-testid="subscription-plan" className="text-[14px] font-bold text-zinc-900">
              {PLAN_LABELS[org?.subscription_plan] || org?.subscription_plan || '—'} Plan
            </p>
            <span data-testid="subscription-status" className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${STATUS_COLORS[org?.subscription_status] || 'bg-zinc-100 text-zinc-500'}`}>
              {org?.subscription_status || '—'}
            </span>
          </div>
        </div>

        <div className="text-[12px] text-zinc-500 bg-zinc-50 rounded-xl p-4">
          Billing management and plan upgrades will be available soon. Contact <strong>support@rekovr.ai</strong> for changes to your subscription.
        </div>
      </div>
    </div>
  );
}
