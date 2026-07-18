// Shipment status vocabulary for the org operator.
//
// Like matchStatus, the label answers "where is the parcel and who has the
// ball?" The tone encodes urgency, not the accent: amber = your work now,
// teal = moving / almost there, slate = waiting on the carrier, emerald =
// done, red = needs attention.

export function shipmentStatusLabel(status, t) {
  const s = typeof status === 'string' ? status : status?.status;
  return t(`shipStatus_${s}`) || s;
}

// Tone keys map to the small chip/tile palette used across the app.
const TONE = {
  awaiting_packing: 'amber',
  packed: 'teal',
  awaiting_pickup: 'slate',
  in_transit: 'teal',
  out_for_delivery: 'teal',
  delivered: 'emerald',
  exception: 'red',
  returned: 'red',
  cancelled: 'slate',
};

export function shipmentStatusTone(status) {
  const s = typeof status === 'string' ? status : status?.status;
  return TONE[s] || 'slate';
}

// The queue is grouped into four operational buckets, in order of urgency.
// A shipment the operator can't act on (in transit) is passive.
export const SHIPMENT_BUCKETS = {
  incidents: ['exception', 'returned'],
  packing: ['awaiting_packing'],
  packed: ['packed'],
  transit: ['awaiting_pickup', 'in_transit', 'out_for_delivery'],
};

export function bucketOf(status) {
  for (const [bucket, states] of Object.entries(SHIPMENT_BUCKETS)) {
    if (states.includes(status)) return bucket;
  }
  return null;
}
