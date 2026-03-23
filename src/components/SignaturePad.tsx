import { useEffect, useRef, useState } from 'react';

type SignaturePadProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

const SignaturePad: React.FC<SignaturePadProps> = ({ label, value, onChange }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const lastLoadedValueRef = useRef<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  function setupCanvas(initialValue?: string) {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;

    if (!canvas || !wrapper) {
      return;
    }

    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const width = wrapper.clientWidth;
    const height = 180;

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.fillStyle = '#fff';
    context.fillRect(0, 0, width, height);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#2e1d18';
    context.lineWidth = 2.4;

    if (initialValue) {
      const image = new Image();
      image.onload = () => {
        context.drawImage(image, 0, 0, width, height);
        lastLoadedValueRef.current = initialValue;
      };
      image.src = initialValue;
      return;
    }

    lastLoadedValueRef.current = '';
  }

  useEffect(() => {
    setupCanvas(value);

    function handleResize() {
      setupCanvas(value || undefined);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (value === lastLoadedValueRef.current) {
      return;
    }

    setupCanvas(value || undefined);
  }, [value]);

  function getPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const point = getPoint(event);
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');

    if (!point || !canvas || !context) {
      return;
    }

    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(point.x, point.y);
    setIsDrawing(true);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing) {
      return;
    }

    const point = getPoint(event);
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');

    if (!point || !canvas || !context) {
      return;
    }

    event.preventDefault();
    context.lineTo(point.x, point.y);
    context.stroke();
  }

  function finishDrawing() {
    const canvas = canvasRef.current;
    if (!canvas) {
      setIsDrawing(false);
      return;
    }

    setIsDrawing(false);
    lastLoadedValueRef.current = canvas.toDataURL('image/png');
    onChange(lastLoadedValueRef.current);
  }

  function clearSignature() {
    onChange('');
  }

  return (
    <div className="signature-pad-block">
      <div className="signature-pad-head">
        <label className="form-label">{label}</label>
        <button type="button" className="signature-pad-clear" onClick={clearSignature}>
          Limpar
        </button>
      </div>
      <div ref={wrapperRef} className="signature-pad-surface">
        <canvas
          ref={canvasRef}
          className="signature-pad-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrawing}
          onPointerLeave={finishDrawing}
        />
      </div>
    </div>
  );
};

export default SignaturePad;
