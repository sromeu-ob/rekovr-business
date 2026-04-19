import { useRef, useState } from 'react';
import { PenLine, RotateCcw } from 'lucide-react';

export default function SignaturePad({ onChange }) {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * (canvas.width / rect.width),
      y: (src.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function startDraw(e) {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawingRef.current = true;
  }

  function draw(e) {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e, canvas);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    const dataUrl = canvas.toDataURL('image/png');
    setHasSignature(true);
    onChange?.(dataUrl);
  }

  function endDraw(e) {
    e.preventDefault();
    isDrawingRef.current = false;
  }

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange?.(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <PenLine size={13} className="text-stone-400" strokeWidth={1.5} />
          <span className="text-xs font-medium uppercase tracking-wide text-stone-500">Signatura</span>
        </div>
        {hasSignature && (
          <button type="button" onClick={clear}
            className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 transition-colors">
            <RotateCcw size={12} /> Esborrar
          </button>
        )}
      </div>
      <div className="rounded-md border border-dashed border-stone-200 bg-stone-50 overflow-hidden touch-none select-none">
        <canvas
          ref={canvasRef}
          width={600}
          height={180}
          className="w-full h-[110px] cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>
      {!hasSignature && (
        <p className="text-xs text-stone-400 text-center mt-1.5">Signa aquí amb el dit o el ratolí</p>
      )}
    </div>
  );
}
