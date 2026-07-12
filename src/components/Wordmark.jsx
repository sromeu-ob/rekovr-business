// Official wordmark: lowercase "rekovr." with the bicolor "k" (right half teal)
// and the trailing teal dot. Same construction as the main app's Layout.
export default function Wordmark({ className = '', dark = false }) {
  return (
    <span
      className={`tracking-tight ${dark ? 'text-white' : 'text-slate-900'} ${className}`}
      style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800 }}
    >
      re<span style={{ position: 'relative', display: 'inline-block' }}>
        <span style={{ display: 'inline-block', color: 'inherit', clipPath: 'inset(0 61% 0 0)' }}>k</span>
        <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, display: 'inline-block', color: '#0D9488', clipPath: 'inset(0 0 0 42%)' }}>k</span>
      </span>ovr<span style={{ color: '#14B8A6' }}>.</span>
    </span>
  );
}
