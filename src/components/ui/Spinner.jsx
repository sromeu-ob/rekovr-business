const SIZES = {
  sm: 'w-4 h-4 border-2',
  md: 'w-5 h-5 border-2',
  lg: 'w-8 h-8 border-2',
};

export default function Spinner({
  size = 'md',
  className = '',
  ...props
}) {
  return (
    <div
      role="status"
      className={[
        'border-slate-200 border-t-slate-900 rounded-full animate-spin',
        SIZES[size] ?? SIZES.md,
        className,
      ].join(' ')}
      {...props}
    />
  );
}
