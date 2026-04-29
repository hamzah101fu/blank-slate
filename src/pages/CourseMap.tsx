import { useEffect, useState } from "react";
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
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Unit {
  id: string;
  name: string;
  order_index: number;
}

interface Stage {
  id: string;
  name: string;
  stage_type: string;
  stage_number: number;
  order_index: number;
  unit_id: string;
}

type StageState = "locked" | "available" | "completed";

// ─── Stage icon map ───────────────────────────────────────────────────────────

const STAGE_ICONS: Record<string, React.ElementType> = {
  aghaaz: Play,
  suno: Headphones,
  samjho: Lightbulb,
  pehchano: Eye,
  dohrao: RotateCcw,
  guftugu: MessageCircle,
};

// ─── Fallback hardcoded data (used when no DB data exists yet) ─────────────────

const FALLBACK_UNITS = [
  { id: "fallback-u1", name: "Haroof e Tahaji", order_index: 0 },
  { id: "fallback-u2", name: "Salaam Dua", order_index: 1 },
  { id: "fallback-u3", name: "Ginti", order_index: 2 },
];

const FALLBACK_STAGE_DEFS = [
  { name: "Aghaaz", stage_type: "aghaaz", stage_number: 1, order_index: 0 },
  { name: "Suno", stage_type: "suno", stage_number: 2, order_index: 1 },
  { name: "Samjho", stage_type: "samjho", stage_number: 3, order_index: 2 },
  { name: "Pehchano", stage_type: "pehchano", stage_number: 4, order_index: 3 },
  { name: "Dohrao", stage_type: "dohrao", stage_number: 5, order_index: 4 },
  { name: "Guftugu", stage_type: "guftugu", stage_number: 6, order_index: 5 },
];

// ─── Component ────────────────────────────────────────────────────────────────

const CourseMap = () => {
  const navigate = useNavigate();
  const language = localStorage.getItem("guftugu_language") || "Urdu";

  const [units, setUnits] = useState<Unit[]>([]);
  const [stagesByUnit, setStagesByUnit] = useState<Record<string, Stage[]>>({});
  const [completedStageIds, setCompletedStageIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [totalXp, setTotalXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  // ── Load session ──────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/auth"); return; }
      setUserId(session.user.id);
    });
  }, [navigate]);

  // ── Load data when userId is set ──────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    loadAll(userId);
  }, [userId]);

  const loadAll = async (uid: string) => {
    setLoading(true);

    // Fetch language record (match stored language name)
    const { data: langData } = await supabase
      .from("languages")
      .select("id")
      .ilike("name", language)
      .single();

    if (!langData) {
      // No language data yet — use fallback UI
      setUsingFallback(true);
      setLoading(false);
      return;
    }

    // Fetch courses for language (published only)
    const { data: courseData } = await supabase
      .from("courses")
      .select("id")
      .eq("language_id", langData.id)
      .order("order_index")
      .limit(1)
      // .eq("status", "published")  // Uncomment after running the SQL migration

    if (!courseData || courseData.length === 0) {
      setUsingFallback(true);
      setLoading(false);
      return;
    }

    const courseId = courseData[0].id;

    // Fetch units (published only — uncomment after running the SQL migration)
    const { data: unitData } = await supabase
      .from("units")
      .select("id, name, order_index")
      .eq("course_id", courseId)
      // .eq("status", "published")
      .order("order_index");

    if (!unitData || unitData.length === 0) {
      setUsingFallback(true);
      setLoading(false);
      return;
    }

    const unitIds = unitData.map((u) => u.id);

    // Fetch all stages for these units (published only — uncomment after running the SQL migration)
    const { data: stageData } = await supabase
      .from("stages")
      .select("id, name, stage_type, stage_number, order_index, unit_id")
      .in("unit_id", unitIds)
      // .eq("status", "published")
      .order("order_index");

    // Group stages by unit
    const grouped: Record<string, Stage[]> = {};
    for (const unit of unitData) {
      grouped[unit.id] = (stageData ?? [])
        .filter((s) => s.unit_id === unit.id)
        .sort((a, b) => a.order_index - b.order_index) as Stage[];
    }

    // Fetch user progress (completed stage IDs)
    const { data: progressData } = await supabase
      .from("user_progress")
      .select("stage_id")
      .eq("user_id", uid)
      .eq("completed", true);

    const completed = new Set((progressData ?? []).map((p) => p.stage_id));

    // Fetch XP
    const { data: xpData } = await supabase
      .from("user_xp")
      .select("total_xp")
      .eq("user_id", uid)
      .single();

    // Fetch streak
    const { data: streakData } = await supabase
      .from("user_streaks")
      .select("current_streak")
      .eq("user_id", uid)
      .single();

    setUnits(unitData as Unit[]);
    setStagesByUnit(grouped);
    setCompletedStageIds(completed);
    setTotalXp((xpData as any)?.total_xp ?? 0);
    setStreak((streakData as any)?.current_streak ?? 0);
    setLoading(false);
  };

  // ── Unlock logic ──────────────────────────────────────────────────────────
  // A stage is available if:
  //  - It's the very first stage of the first unit (always available), OR
  //  - The previous stage (within the unit or last stage of prior unit) is completed.
  const getStageState = (
    unitIdx: number,
    stageIdx: number,
    unitId: string,
    stageId: string
  ): StageState => {
    if (completedStageIds.has(stageId)) return "completed";

    if (unitIdx === 0 && stageIdx === 0) return "available";

    // Previous stage
    if (stageIdx > 0) {
      const prevStage = stagesByUnit[unitId]?.[stageIdx - 1];
      if (prevStage && completedStageIds.has(prevStage.id)) return "available";
      return "locked";
    }

    // First stage of a later unit — check last stage of previous unit
    const prevUnit = units[unitIdx - 1];
    if (prevUnit) {
      const prevUnitStages = stagesByUnit[prevUnit.id] ?? [];
      const lastStage = prevUnitStages[prevUnitStages.length - 1];
      if (lastStage && completedStageIds.has(lastStage.id)) return "available";
    }

    return "locked";
  };

  // ── Fallback unlock logic (no DB data) ───────────────────────────────────
  const getFallbackState = (unitIdx: number, stageIdx: number): StageState => {
    if (unitIdx === 0 && stageIdx === 0) return "available";
    return "locked";
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // ─── Render ────────────────────────────────────────────────────────────────
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
            <span className="text-sm font-bold" style={{ color: "#1E2D3D" }}>{streak}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star size={16} style={{ color: "#D4A853" }} />
            <span className="text-sm font-bold" style={{ color: "#1E2D3D" }}>{totalXp} XP</span>
          </div>
          <button
            onClick={handleLogout}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#1E2D3D", opacity: 0.45, padding: 4 }}
            aria-label="Logout"
          >
            <LogOut size={16} />
          </button>
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

        {loading ? (
          <div className="flex justify-center py-20">
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div
              style={{
                width: 36,
                height: 36,
                border: "3px solid #E8E0D5",
                borderTop: "3px solid #D4A853",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
          </div>
        ) : usingFallback ? (
          // Fallback: hardcoded units with only stage 1 of unit 1 unlocked
          <div className="flex flex-col gap-4">
            {FALLBACK_UNITS.map((unit, unitIdx) => (
              <FallbackUnitCard
                key={unit.id}
                unit={unit}
                unitIdx={unitIdx}
                getState={getFallbackState}
                onStageClick={() => {}} // no real IDs yet
              />
            ))}
          </div>
        ) : (
          // Real data
          <div className="flex flex-col gap-4">
            {units.map((unit, unitIdx) => {
              const stages = stagesByUnit[unit.id] ?? [];
              return (
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
                      Unit {unitIdx + 1}
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
                    {stages.map((stage, stageIdx) => {
                      const state = getStageState(unitIdx, stageIdx, unit.id, stage.id);
                      const Icon = STAGE_ICONS[stage.stage_type] ?? Play;

                      return (
                        <div key={stage.id} className="flex flex-col items-center gap-1.5">
                          <button
                            onClick={() =>
                              state !== "locked" && navigate(`/stage/${stage.id}`)
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
                              cursor: state !== "locked" ? "pointer" : "default",
                              border: "none",
                              flexShrink: 0,
                            }}
                          >
                            {state === "completed" ? (
                              <Check size={16} color="white" strokeWidth={2.5} />
                            ) : state === "locked" ? (
                              <Lock size={13} color="#B0A99F" strokeWidth={2} />
                            ) : (
                              <Icon size={15} color="white" strokeWidth={2} />
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Fallback unit card (no real DB IDs) ──────────────────────────────────────

function FallbackUnitCard({
  unit,
  unitIdx,
  getState,
  onStageClick,
}: {
  unit: { id: string; name: string; order_index: number };
  unitIdx: number;
  getState: (unitIdx: number, stageIdx: number) => StageState;
  onStageClick: (stageId: string) => void;
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ backgroundColor: "#FFFFFF", border: "1.5px solid #E8E0D5" }}
    >
      <div className="mb-5">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#6BA3C8" }}>
          Unit {unitIdx + 1}
        </span>
        <h2
          className="text-lg font-bold mt-0.5"
          style={{ color: "#1E2D3D", fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {unit.name}
        </h2>
      </div>
      <div className="flex justify-between">
        {FALLBACK_STAGE_DEFS.map((stageDef, stageIdx) => {
          const state = getState(unitIdx, stageIdx);
          const Icon = STAGE_ICONS[stageDef.stage_type] ?? Play;
          return (
            <div key={stageIdx} className="flex flex-col items-center gap-1.5">
              <button
                onClick={() => state !== "locked" && onStageClick(`${unit.id}-s${stageIdx + 1}`)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor:
                    state === "completed" ? "#D4A853" : state === "available" ? "#6BA3C8" : "#EDEBE6",
                  cursor: state !== "locked" ? "pointer" : "default",
                  border: "none",
                  flexShrink: 0,
                }}
              >
                {state === "completed" ? (
                  <Check size={16} color="white" strokeWidth={2.5} />
                ) : state === "locked" ? (
                  <Lock size={13} color="#B0A99F" strokeWidth={2} />
                ) : (
                  <Icon size={15} color="white" strokeWidth={2} />
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
                {stageDef.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CourseMap;
