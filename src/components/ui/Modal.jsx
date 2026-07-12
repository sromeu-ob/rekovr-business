import { useEffect } from 'react';
import { X } from 'lucide-react';

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export default function Modal({
  open,
  onClose,
  title,
  size = 'md',
  children,
  footer,
  closable = true,
  className = '',
}) {
  useEffect(() => {
    if (!open || !closable) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closable, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50"
        onClick={closable ? onClose : undefined}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={[
          'relative bg-white rounded-xl shadow-sm w-full flex flex-col max-h-[90vh]',
          SIZES[size] ?? SIZES.md,
          className,
        ].join(' ')}
      >
        {(title || closable) && (
          <div className="flex items-start justify-between px-6 pt-5 pb-3 border-b border-slate-100">
            {title && (
              <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            )}
            {closable && (
              <button
                onClick={onClose}
                aria-label="Close"
                className="ml-auto -mr-2 -mt-1 p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}
        <div className="px-6 py-4 overflow-y-auto">
          {children}
        </div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-slate-100 bg-slate-50 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
