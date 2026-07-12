export default function PageHeader({
  title,
  subtitle,
  actions,
  className = '',
  children,
  ...props
}) {
  return (
    <div
      className={[
        'flex items-start justify-between gap-4 mb-8',
        className,
      ].join(' ')}
      {...props}
    >
      <div className="min-w-0">
        {title && (
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        )}
        {subtitle && (
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        )}
        {children}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
