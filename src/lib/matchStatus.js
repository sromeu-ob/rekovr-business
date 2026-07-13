// Match status vocabulary for the org operator.
//
// A status must answer "where are we and what should I expect now?" — so the
// primary label is action-oriented. "Who covered the fee" is a payment
// attribute, not a state, and lives in a secondary subtext / tooltip.

// Primary, action-oriented label. `paid` is always "pending handover" for the
// operator, regardless of who paid.
export function matchStatusLabel(match, t) {
  const status = typeof match === 'string' ? match : match?.status;
  if (status === 'paid') return t('mstPaid');
  return {
    pending_verification: t('statusVerification'),
    pending_review:       t('statusUnderReview'),
    pending:              t('statusPending'),
    accepted:             t('statusAccepted'),
    rejected:             t('statusRejected'),
    dismissed:            t('statusDismissed'),
    recovered:            t('statusRecovered'),
  }[status] || status;
}

// Secondary line: how the recovery fee was settled (only for `paid`).
// Returns null when there's nothing worth adding (regular Stripe payment).
export function coverageSubtext(match, t) {
  if (match?.status !== 'paid') return null;
  if (match.payment_covered_reason === 'org_covered') return t('coverageOrg');
  if (match.payment_covered_reason === 'beta_free') return t('coverageBeta');
  return t('coverageUser');
}

// Hover description — "what should I expect now?" — for the whole vocabulary.
export function matchStatusHint(match, t) {
  const status = typeof match === 'string' ? match : match?.status;
  if (status === 'paid') {
    if (match?.payment_covered_reason === 'org_covered') return t('mshPaidCovered');
    if (match?.payment_covered_reason === 'beta_free') return t('mshPaidBeta');
    return t('mshPaidUser');
  }
  return {
    pending_verification: t('mshVerification'),
    pending_review:       t('mshUnderReview'),
    pending:              t('mshPending'),
    accepted:             t('mshAccepted'),
    rejected:             t('mshRejected'),
    dismissed:            t('mshDismissed'),
    recovered:            t('mshRecovered'),
  }[status] || '';
}
