import { ChevronDown } from 'lucide-react';

export default function Select({
  error = false,
  className = '',
  children,
  ...props
}) {
  return (
    <div className="relative">
      <select
        className={[
          'w-full appearance-none px-3 py-2.5 pr-9 text-sm rounded-md bg-slate-50 focus:bg-white focus:outline-none transition-colors',
          error
            ? 'border border-red-300 text-red-700 focus:border-red-500'
            : 'border border-slate-200 focus:border-teal-500',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          className,
        ].join(' ')}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}
