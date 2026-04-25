import { useNavigate } from "react-router-dom";
import {
  Flame,
  Star,
  Lock,
  Check,
  Play,
  Headphones,
  Lightbulb,
  Eye,
  RotateCcw,
  MessageCircle,
} from "lucide-react";

const STAGE_DEFS = [
  { name: "Aghaaz", Icon: Play },
  { name: "Suno", Icon: Headphones },
  { name: "Samjho", Icon: Lightbulb },
  { name: "Pehchano", Icon: Eye },
  { name: "Dohrao", Icon: RotateCcw },
  { name: "Guftugu", Icon: MessageCircle },
];

const UNITS = [
  { id: "u1", number: 1, name: "Haroof e Tahaji" },
  { id: "u2", number: 2, name: "Salaam Dua" },
  { id: "u3", number: 3, name: "Ginti" },
];

type StageState = "locked" | "available" | "completed";

function stageState(unitIdx: number, stageIdx: number): StageState {
  if (unitIdx === 0 && stageIdx === 0) return "available";
  return "locked";
}

const CourseMap = () => {
  const navigate = useNavigate();
  const language = localStorage.getItem("guftugu_language") || "Urdu";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAF6F0" }}>
      {/* Top bar */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
        style={{ backgroundColor: "#FAF6F0", borderBottom: "1.5px solid #E8E0D5" }}
      >
        <div className="flex items-baseline gap-2">
          <span
            style={{
              color: "#D4A853",
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            گفتگو
          </span>
          <span
            className="font-bold text-base"
            style={{ color: "#1E2D3D", fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Guftugu
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Flame size={16} style={{ color: "#C17B4A" }} />
            <span className="text-sm font-bold" style={{ color: "#1E2D3D" }}>7</span>
          </div>
          <div className="flex items-center gap-1">
            <Star size={16} style={{ color: "#D4A853" }} />
            <span className="text-sm font-bold" style={{ color: "#1E2D3D" }}>120 XP</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto px-4 py-6" style={{ maxWidth: 420 }}>
        {/* Language pill */}
        <div className="mb-6">
          <span
            className="text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full"
            style={{ backgroundColor: "#1E2D3D", color: "#FAF6F0" }}
          >
            {language}
          </span>
        </div>

        {/* Units */}
        <div className="flex flex-col gap-4">
          {UNITS.map((unit, unitIdx) => (
            <div
              key={unit.id}
              className="rounded-2xl p-5"
              style={{ backgroundColor: "#FFFFFF", border: "1.5px solid #E8E0D5" }}
            >
              {/* Unit header */}
              <div className="mb-5">
                <span
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "#6BA3C8" }}
                >
                  Unit {unit.number}
                </span>
                <h2
                  className="text-lg font-bold mt-0.5"
                  style={{
                    color: "#1E2D3D",
                    fontFamily: "'Playfair Display', Georgia, serif",
                  }}
                >
                  {unit.name}
                </h2>
              </div>

              {/* Stage icons */}
              <div className="flex justify-between">
                {STAGE_DEFS.map((stage, stageIdx) => {
                  const state = stageState(unitIdx, stageIdx);
                  const stageId = `${unit.id}-s${stageIdx + 1}`;

                  return (
                    <div key={stageIdx} className="flex flex-col items-center gap-1.5">
                      <button
                        onClick={() =>
                          state === "available" && navigate(`/stage/${stageId}`)
                        }
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor:
                            state === "completed"
                              ? "#D4A853"
                              : state === "available"
                              ? "#6BA3C8"
                              : "#EDEBE6",
                          cursor: state === "available" ? "pointer" : "default",
                          border: "none",
                          flexShrink: 0,
                        }}
                      >
                        {state === "completed" ? (
                          <Check size={16} color="white" strokeWidth={2.5} />
                        ) : state === "locked" ? (
                          <Lock size={13} color="#B0A99F" strokeWidth={2} />
                        ) : (
                          <stage.Icon size={15} color="white" strokeWidth={2} />
                        )}
                      </button>
                      <span
                        className="text-center leading-tight"
                        style={{
                          fontSize: 8,
                          color: state === "locked" ? "#B0A99F" : "#1E2D3D",
                          width: 40,
                          fontWeight: state === "available" ? 600 : 400,
                        }}
                      >
                        {stage.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CourseMap;
