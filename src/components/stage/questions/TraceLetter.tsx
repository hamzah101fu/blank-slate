import { useEffect, useRef, useState } from "react";
import type { QuestionProps } from "./shared";

const SIZE = 260;
const BRUSH_R = 10;
const COVERAGE_THRESHOLD = 0.65;

interface Point { x: number; y: number }

// DTW distance between two normalized stroke sequences
function dtwDistance(a: Point[], b: Point[]): number {
  if (a.length === 0 || b.length === 0) return Infinity;
  const n = a.length, m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(Infinity));
  dp[0][0] = 0;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = Math.hypot(a[i - 1].x - b[j - 1].x, a[i - 1].y - b[j - 1].y);
      dp[i][j] = cost + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[n][m] / Math.max(n, m);
}

// Map tolerance 1-5 to a DTW distance threshold
function toleranceToThreshold(tolerance: number): number {
  const map: Record<number, number> = { 1: 0.06, 2: 0.11, 3: 0.18, 4: 0.26, 5: 0.38 };
  return map[Math.round(Math.max(1, Math.min(5, tolerance)))] ?? 0.18;
}

// Downsample a point array to at most maxPts points
function downsample(pts: Point[], maxPts = 60): Point[] {
  if (pts.length <= maxPts) return pts;
  const step = pts.length / maxPts;
  return Array.from({ length: maxPts }, (_, i) => pts[Math.round(i * step)]);
}

export function TraceLetter({ content, onAnswer, feedback }: QuestionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offDataRef = useRef<Uint8ClampedArray | null>(null);
  const visitedRef = useRef<Uint8Array>(new Uint8Array(SIZE * SIZE));
  const totalPixels = useRef(0);
  const isDrawing = useRef(false);
  const currentStroke = useRef<Point[]>([]);
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);

  const disabled = feedback !== "idle";
  const hasReference = Array.isArray(content.reference_points) && (content.reference_points as Point[]).length > 1;
  const tolerance = (content.tolerance as number) ?? 3;

  useEffect(() => {
    setDone(false);
    setPct(0);
    visitedRef.current = new Uint8Array(SIZE * SIZE);
    currentStroke.current = [];
    initCanvas();
  }, [content.letter]);

  const initCanvas = async () => {
    try { await document.fonts.load(`180px "Amiri"`); } catch { /* already loaded */ }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.font = "180px Amiri";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(30, 45, 61, 0.08)";
    ctx.fillText(content.letter as string, SIZE / 2, SIZE / 2 + 10);

    // Offscreen for coverage-based fallback
    const off = document.createElement("canvas");
    off.width = SIZE; off.height = SIZE;
    const offCtx = off.getContext("2d")!;
    offCtx.font = "180px Amiri";
    offCtx.textAlign = "center";
    offCtx.textBaseline = "middle";
    offCtx.fillStyle = "black";
    offCtx.fillText(content.letter as string, SIZE / 2, SIZE / 2 + 10);
    const imageData = offCtx.getImageData(0, 0, SIZE, SIZE);
    offDataRef.current = imageData.data;

    let count = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] > 64) count++;
    }
    totalPixels.current = count;
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
        x: (t.clientX - rect.left) * sx,
        y: (t.clientY - rect.top) * sy,
      };
    }
    return {
      x: ((e as React.MouseEvent).clientX - rect.left) * sx,
      y: ((e as React.MouseEvent).clientY - rect.top) * sy,
    };
  };

  const paint = (x: number, y: number) => {
    if (disabled || done) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const offData = offDataRef.current;

    ctx.beginPath();
    ctx.arc(x, y, BRUSH_R * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = "#1E2D3D";
    ctx.fill();

    // Record normalized point for DTW
    currentStroke.current.push({ x: x / SIZE, y: y / SIZE });

    // Also track coverage for fallback
    if (offData) {
      for (let dx = -BRUSH_R; dx <= BRUSH_R; dx++) {
        for (let dy = -BRUSH_R; dy <= BRUSH_R; dy++) {
          if (dx * dx + dy * dy > BRUSH_R * BRUSH_R) continue;
          const px = Math.round(x) + dx, py = Math.round(y) + dy;
          if (px < 0 || px >= SIZE || py < 0 || py >= SIZE) continue;
          if (offData[(py * SIZE + px) * 4 + 3] > 64) {
            visitedRef.current[py * SIZE + px] = 1;
          }
        }
      }
    }
  };

  const check = () => {
    if (done) return;

    if (hasReference) {
      // DTW-based comparison
      const ref = downsample(content.reference_points as Point[], 60);
      const user = downsample(currentStroke.current, 60);
      if (user.length < 3) return;
      const dist = dtwDistance(user, ref);
      const threshold = toleranceToThreshold(tolerance);
      setPct(Math.max(0, 1 - dist / threshold));
      if (dist <= threshold) {
        setDone(true);
        onAnswer(true);
      }
    } else {
      // Fallback: coverage-based
      if (totalPixels.current === 0) return;
      let n = 0;
      for (let i = 0; i < visitedRef.current.length; i++) {
        if (visitedRef.current[i]) n++;
      }
      const cov = n / totalPixels.current;
      setPct(cov);
      if (cov >= COVERAGE_THRESHOLD) {
        setDone(true);
        onAnswer(true);
      }
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
        onMouseDown={(e) => {
          isDrawing.current = true;
          currentStroke.current = [];
          const p = getPos(e);
          if (p) paint(p.x, p.y);
        }}
        onMouseMove={(e) => {
          if (!isDrawing.current) return;
          const p = getPos(e);
          if (p) paint(p.x, p.y);
        }}
        onMouseUp={() => { isDrawing.current = false; check(); }}
        onMouseLeave={() => { isDrawing.current = false; check(); }}
        onTouchStart={(e) => {
          e.preventDefault();
          isDrawing.current = true;
          currentStroke.current = [];
          const p = getPos(e);
          if (p) paint(p.x, p.y);
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          if (!isDrawing.current) return;
          const p = getPos(e);
          if (p) paint(p.x, p.y);
        }}
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
