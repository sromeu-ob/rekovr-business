// Objective evidence deltas between a lost claim and a found item.
// Tones map to the design-contract states: ok → teal, warn → amber, neutral → slate.

export function timeDelta(isoA, isoB) {
  if (!isoA || !isoB) return null;
  const ms = Math.abs(new Date(isoB) - new Date(isoA));
  if (Number.isNaN(ms)) return null;
  const mins = Math.round(ms / 60000);
  if (mins < 60) return { label: `Δ ${mins} min`, tone: 'ok' };
  const hours = Math.round(mins / 60);
  if (hours < 48) return { label: `Δ ${hours} h`, tone: hours <= 24 ? 'ok' : 'warn' };
  const days = Math.round(hours / 24);
  return { label: `Δ ${days} d`, tone: days <= 7 ? 'warn' : 'neutral' };
}

export function distanceDelta(km, language = 'en') {
  if (km == null) return null;
  if (km < 0.1) return { label: '<100 m', tone: 'ok' };
  if (km < 1) return { label: `${Math.round(km * 1000)} m`, tone: 'ok' };
  const label = `${km.toLocaleString(language, { maximumFractionDigits: 1 })} km`;
  return { label, tone: km < 10 ? 'warn' : 'neutral' };
}
