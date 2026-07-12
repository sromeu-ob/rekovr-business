export default function Textarea({
  error = false,
  className = '',
  rows = 4,
  ...props
}) {
  return (
    <textarea
      rows={rows}
      className={[
        'w-full px-3 py-2.5 text-sm rounded-md bg-slate-50 focus:bg-white focus:outline-none transition-colors resize-y',
        error
          ? 'border border-red-300 text-red-700 focus:border-red-500'
          : 'border border-slate-200 focus:border-teal-500',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        className,
      ].join(' ')}
      {...props}
    />
  );
}
