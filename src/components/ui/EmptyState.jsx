export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
  ...props
}) {
  return (
    <div
      className={['flex flex-col items-center text-center py-12 px-6', className].join(' ')}
      {...props}
    >
      {Icon && (
        <Icon
          size={32}
          strokeWidth={1.5}
          className="text-slate-300 mb-3"
        />
      )}
      {title && (
        <p className="text-sm font-medium text-slate-900">{title}</p>
      )}
      {description && (
        <p className="text-sm text-slate-500 mt-1 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
