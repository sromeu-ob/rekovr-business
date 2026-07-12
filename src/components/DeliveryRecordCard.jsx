import { HandshakeIcon } from 'lucide-react';

// Delivery record ("acta de lliurament"): canonical on the item detail page,
// shown contextually on the resolution view of the matches page.
export default function DeliveryRecordCard({ record }) {
  if (!record) return null;
  return (
    <div data-testid="delivery-record-panel" className="bg-white rounded-lg border border-slate-200">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
        <HandshakeIcon size={14} className="text-slate-400" strokeWidth={1.5} />
        <span className="text-xs font-semibold text-slate-600">Registre de lliurament</span>
      </div>
      <div className="px-4 py-3.5 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-1">Receptor</p>
          <p className="text-sm font-semibold text-slate-900">{record.recipient_name}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-1">DNI / NIE</p>
          <p className="text-sm font-mono text-slate-700">{record.recipient_dni}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-1">Data i hora</p>
          <p className="text-xs text-slate-500">{record.signed_at ? new Date(record.signed_at).toLocaleString() : '—'}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-1">Tipus</p>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
            {record.delivery_type === 'direct' ? 'Directa' : 'Match'}
          </span>
        </div>
        {record.signature_data_url && (
          <div className="col-span-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-2">Signatura</p>
            <img src={record.signature_data_url} alt="signatura"
              className="h-16 max-w-[280px] object-contain bg-slate-50 rounded-lg border border-slate-200 p-2" />
          </div>
        )}
      </div>
    </div>
  );
}
