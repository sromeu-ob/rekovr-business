export default function ScoreRing({ score, size = 46, muted = false, className = '' }) {
  const pct = Math.round((score ?? 0) * 100);
  const r = 16;
  const c = 2 * Math.PI * r;
  const stroke = muted
    ? 'stroke-slate-300'
    : pct >= 75 ? 'stroke-teal-500' : pct >= 50 ? 'stroke-amber-400' : 'stroke-slate-300';
  const text = muted
    ? 'text-slate-400'
    : pct >= 75 ? 'text-teal-600' : pct >= 50 ? 'text-amber-600' : 'text-slate-400';

  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 40 40" width={size} height={size} className="-rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" strokeWidth="3" className="stroke-slate-100" />
        <circle
          cx="20" cy="20" r={r} fill="none" strokeWidth="3" strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * c} ${c}`}
          className={stroke}
        />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center font-bold tabular-nums ${text}`}
        style={{ fontSize: size >= 44 ? 12 : 10 }}
      >
        {pct}
      </span>
    </div>
  );
}
