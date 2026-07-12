export default function Tabs({
  tabs,
  value,
  onChange,
  className = '',
  ...props
}) {
  return (
    <div
      role="tablist"
      className={[
        'flex gap-1 bg-slate-100 rounded-md p-0.5 w-fit',
        className,
      ].join(' ')}
      {...props}
    >
      {tabs.map(({ key, label, icon: Icon, count }) => {
        const active = value === key;
        return (
          <button
            key={key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(key)}
            className={[
              'inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-md transition-colors',
              active
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            {Icon && <Icon size={14} />}
            {label}
            {count != null && (
              <span
                className={[
                  'ml-1 rounded px-1 py-0 text-xs',
                  active ? 'text-slate-500' : 'text-slate-400',
                ].join(' ')}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
