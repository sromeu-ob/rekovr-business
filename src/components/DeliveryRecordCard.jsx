import { useState } from 'react';
import { HandshakeIcon, Download, Loader2 } from 'lucide-react';
import api from '../api';

// Delivery record ("acta de lliurament"): canonical on the item detail page,
// shown contextually on the resolution view of the matches page.
// When itemId is provided, the header offers the PDF export (custody document).
export default function DeliveryRecordCard({ record, itemId }) {
  const [downloading, setDownloading] = useState(false);

  if (!record) return null;

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const res = await api.get(`/business/items/${itemId}/delivery-record/pdf`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `acta-lliurament-${itemId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {}
    setDownloading(false);
  };

  return (
    <div data-testid="delivery-record-panel" className="bg-white rounded-lg border border-slate-200">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
        <HandshakeIcon size={14} className="text-slate-400" strokeWidth={1.5} />
        <span className="text-xs font-semibold text-slate-600">Registre de lliurament</span>
        {itemId && (
          <button
            onClick={downloadPdf}
            disabled={downloading}
            data-testid="download-record-pdf-btn"
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 hover:text-teal-800 transition-colors disabled:opacity-50"
          >
            {downloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            Descarregar acta
          </button>
        )}
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
