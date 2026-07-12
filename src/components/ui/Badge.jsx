const VARIANTS = {
  neutral: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger:  'bg-red-50 text-red-700',
  info:    'bg-teal-50 text-teal-700',
  muted:   'bg-slate-100 text-slate-500',
};

const SIZES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

export default function Badge({
  variant = 'neutral',
  size = 'sm',
  icon: Icon,
  className = '',
  children,
  ...props
}) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-md font-medium',
        VARIANTS[variant] ?? VARIANTS.neutral,
        SIZES[size] ?? SIZES.sm,
        className,
      ].join(' ')}
      {...props}
    >
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}
