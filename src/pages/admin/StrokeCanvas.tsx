import { useEffect, useRef, useState } from "react";

const SIZE = 260;

interface Point { x: number; y: number }

interface Props {
  value: Point[];
  onChange: (points: Point[]) => void;
  readonly?: boolean;
}

export function StrokeCanvas({ value, onChange, readonly = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const currentStroke = useRef<Point[]>([]);
  const [hasStroke, setHasStroke] = useState(value.length > 0);

  // Redraw canvas whenever value changes externally
  useEffect(() => {
    setHasStroke(value.length > 0);
    redrawFromPoints(value);
  }, [value]);

  const redrawFromPoints = (points: Point[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, SIZE, SIZE);
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = "#1E2D3D";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(points[0].x * SIZE, points[0].y * SIZE);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x * SIZE, points[i].y * SIZE);
    }
    ctx.stroke();
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const sx = SIZE / rect.width;
    const sy = SIZE / rect.height;
    if ("touches" in e) {
      const t = e.touches[0] || (e as React.TouchEvent).changedTouches[0];
      return {
        x: Math.max(0, Math.min(1, (t.clientX - rect.left) * sx / SIZE)),
        y: Math.max(0, Math.min(1, (t.clientY - rect.top) * sy / SIZE)),
      };
    }
    return {
      x: Math.max(0, Math.min(1, ((e as React.MouseEvent).clientX - rect.left) * sx / SIZE)),
      y: Math.max(0, Math.min(1, ((e as React.MouseEvent).clientY - rect.top) * sy / SIZE)),
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (readonly) return;
    e.preventDefault();
    isDrawing.current = true;
    currentStroke.current = [];
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.beginPath();
    ctx.strokeStyle = "#1E2D3D";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const p = getPos(e);
    if (p) {
      ctx.moveTo(p.x * SIZE, p.y * SIZE);
      currentStroke.current.push(p);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || readonly) return;
    e.preventDefault();
    const p = getPos(e);
    if (!p) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.lineTo(p.x * SIZE, p.y * SIZE);
    ctx.stroke();
    currentStroke.current.push(p);
  };

  const endDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || readonly) return;
    e.preventDefault();
    isDrawing.current = false;
    // Downsample: keep every 3rd point for efficiency
    const sampled = currentStroke.current.filter((_, i) => i % 3 === 0);
    if (sampled.length < 2) return;
    setHasStroke(true);
    onChange(sampled);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, SIZE, SIZE);
    currentStroke.current = [];
    setHasStroke(false);
    onChange([]);
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        style={{
          border: "1.5px solid #E8E0D5",
          borderRadius: 12,
          cursor: readonly ? "default" : "crosshair",
          touchAction: "none",
          width: SIZE,
          height: SIZE,
          backgroundColor: "#FAFAF8",
          display: "block",
        }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      <div className="flex items-center gap-3">
        {!readonly && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#C17B4A",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px 0",
              opacity: hasStroke ? 1 : 0.35,
            }}
            disabled={!hasStroke}
          >
            Clear stroke
          </button>
        )}
        <span style={{ fontSize: 11, color: "#1E2D3D", opacity: 0.45 }}>
          {hasStroke ? `${value.length} points recorded` : readonly ? "No reference stroke set" : "Draw the stroke once to set it as reference"}
        </span>
      </div>
    </div>
  );
}
