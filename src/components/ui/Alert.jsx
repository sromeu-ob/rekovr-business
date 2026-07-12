import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

const VARIANTS = {
  error: {
    wrapper: 'bg-red-50 border-red-100',
    icon: AlertCircle,
    iconColor: 'text-red-600',
    text: 'text-red-700',
  },
  warning: {
    wrapper: 'bg-amber-50/60 border-amber-100',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
    text: 'text-amber-800',
  },
  success: {
    wrapper: 'bg-emerald-50 border-emerald-100',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
    text: 'text-emerald-700',
  },
  info: {
    wrapper: 'bg-slate-50 border-slate-200',
    icon: Info,
    iconColor: 'text-slate-500',
    text: 'text-slate-700',
  },
};

export default function Alert({
  variant = 'info',
  title,
  children,
  icon: CustomIcon,
  className = '',
  ...props
}) {
  const v = VARIANTS[variant] ?? VARIANTS.info;
  const Icon = CustomIcon ?? v.icon;
  return (
    <div
      className={[
        'p-3 rounded-md border flex items-start gap-2',
        v.wrapper,
        className,
      ].join(' ')}
      role={variant === 'error' ? 'alert' : undefined}
      {...props}
    >
      <Icon size={14} className={[v.iconColor, 'mt-0.5 flex-shrink-0'].join(' ')} />
      <div className="min-w-0">
        {title && (
          <p className={['text-sm font-medium', v.text].join(' ')}>{title}</p>
        )}
        {children && (
          <div className={['text-sm', v.text, title ? 'mt-0.5' : ''].join(' ')}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
