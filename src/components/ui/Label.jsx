const STYLES = {
  uppercase: 'block text-xs font-medium uppercase tracking-wide text-slate-500 mb-1.5',
  sentence:  'block text-sm font-medium text-slate-700 mb-1.5',
};

export default function Label({
  variant = 'uppercase',
  required = false,
  htmlFor,
  className = '',
  children,
  ...props
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={[STYLES[variant] ?? STYLES.uppercase, className].join(' ')}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}
