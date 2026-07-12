const PADDING = {
  none: '',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
};

export default function Card({
  padding = 'md',
  shadow = false,
  className = '',
  children,
  ...props
}) {
  return (
    <div
      className={[
        'bg-white rounded-lg border border-slate-200',
        PADDING[padding] ?? PADDING.md,
        shadow ? 'shadow-sm' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}
