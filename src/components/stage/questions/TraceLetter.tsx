import { useEffect, useRef, useState } from "react";
import type { QuestionProps } from "./shared";

const SIZE = 260;
const BRUSH_R = 10;
const COVERAGE_THRESHOLD = 0.65;

export function TraceLetter({ content, onAnswer, feedback }: QuestionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offDataRef = useRef<Uint8ClampedArray | null>(null);
  const visitedRef = useRef<Uint8Array>(new Uint8Array(SIZE * SIZE));
  const totalPixels = useRef(0);
  const isDrawing = useRef(false);
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);

  const disabled = feedback !== "idle";

  useEffect(() => {
    setDone(false);
    setPct(0);
    visitedRef.current = new Uint8Array(SIZE * SIZE);
    initCanvas();
  }, [content.letter]);

  const initCanvas = async () => {
    try {
      await document.fonts.load(`180px "Amiri"`);
    } catch {
      // Font might already be loaded
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.font = "180px Amiri";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(30, 45, 61, 0.08)";
    ctx.fillText(content.letter, SIZE / 2, SIZE / 2 + 10);

    // Offscreen for pixel map
    const off = document.createElement("canvas");
    off.width = SIZE;
    off.height = SIZE;
    const offCtx = off.getContext("2d")!;
    offCtx.font = "180px Amiri";
    offCtx.textAlign = "center";
    offCtx.textBaseline = "middle";
    offCtx.fillStyle = "black";
    offCtx.fillText(content.letter, SIZE / 2, SIZE / 2 + 10);
    const imageData = offCtx.getImageData(0, 0, SIZE, SIZE);
    offDataRef.current = imageData.data;

    let count = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] > 64) count++;
    }
    totalPixels.current = count;
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const sx = SIZE / rect.width;
    const sy = SIZE / rect.height;
    if ("touches" in e) {
      const t = e.touches[0] || (e as React.TouchEvent).changedTouches[0];
      return { x: Math.round((t.clientX - rect.left) * sx), y: Math.round((t.clientY - rect.top) * sy) };
    }
    return { x: Math.round(((e as React.MouseEvent).clientX - rect.left) * sx), y: Math.round(((e as React.MouseEvent).clientY - rect.top) * sy) };
  };

  const paint = (x: number, y: number) => {
    if (disabled || done) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const offData = offDataRef.current;
    if (!offData) return;

    ctx.beginPath();
    ctx.arc(x, y, BRUSH_R * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = "#1E2D3D";
    ctx.fill();

    for (let dx = -BRUSH_R; dx <= BRUSH_R; dx++) {
      for (let dy = -BRUSH_R; dy <= BRUSH_R; dy++) {
        if (dx * dx + dy * dy > BRUSH_R * BRUSH_R) continue;
        const px = x + dx;
        const py = y + dy;
        if (px < 0 || px >= SIZE || py < 0 || py >= SIZE) continue;
        if (offData[(py * SIZE + px) * 4 + 3] > 64) {
          visitedRef.current[py * SIZE + px] = 1;
        }
      }
    }
  };

  const check = () => {
    if (totalPixels.current === 0) return;
    let n = 0;
    for (let i = 0; i < visitedRef.current.length; i++) {
      if (visitedRef.current[i]) n++;
    }
    const cov = n / totalPixels.current;
    setPct(cov);
    if (cov >= COVERAGE_THRESHOLD && !done) {
      setDone(true);
      onAnswer(true);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#1E2D3D", opacity: 0.45 }}>
        Trace the letter
      </p>
      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        style={{
          border: "2px solid #E8E0D5",
          borderRadius: 16,
          cursor: disabled || done ? "default" : "crosshair",
          touchAction: "none",
          width: Math.min(SIZE, 300),
          height: Math.min(SIZE, 300),
          backgroundColor: "white",
        }}
        onMouseDown={(e) => { isDrawing.current = true; const p = getPos(e); if (p) paint(p.x, p.y); }}
        onMouseMove={(e) => { if (!isDrawing.current) return; const p = getPos(e); if (p) paint(p.x, p.y); }}
        onMouseUp={() => { isDrawing.current = false; check(); }}
        onMouseLeave={() => { isDrawing.current = false; check(); }}
        onTouchStart={(e) => { e.preventDefault(); isDrawing.current = true; const p = getPos(e); if (p) paint(p.x, p.y); }}
        onTouchMove={(e) => { e.preventDefault(); if (!isDrawing.current) return; const p = getPos(e); if (p) paint(p.x, p.y); }}
        onTouchEnd={(e) => { e.preventDefault(); isDrawing.current = false; check(); }}
      />
      <p className="text-xs" style={{ color: "#1E2D3D", opacity: 0.4 }}>
        {done
          ? "✓ Letter traced!"
          : pct > 0
          ? `${Math.round(pct * 100)}% — keep going!`
          : "Trace the letter with your finger or mouse"}
      </p>
    </div>
  );
}
