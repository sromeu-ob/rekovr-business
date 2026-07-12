import { Loader2 } from 'lucide-react';

const VARIANTS = {
  accent:      'btn-brand text-white disabled:opacity-40',
  primary:     'bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-300',
  secondary:   'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50',
  ghost:       'text-slate-600 hover:bg-slate-100 disabled:opacity-50',
  destructive: 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-40',
  confirm:     'bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-sm',
};

export default function Button({
  variant = 'secondary',
  size = 'md',
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  type = 'button',
  children,
  ...props
}) {
  const iconSize = size === 'lg' ? 18 : size === 'sm' ? 12 : 14;
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
        'disabled:cursor-not-allowed',
        VARIANTS[variant] || VARIANTS.secondary,
        SIZES[size] || SIZES.md,
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {loading
        ? <Loader2 size={iconSize} className="animate-spin" />
        : LeftIcon && <LeftIcon size={iconSize} />}
      {children}
      {!loading && RightIcon && <RightIcon size={iconSize} />}
    </button>
  );
}
