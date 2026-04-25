import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "./admin/AdminSidebar";
import { QuestionEditor } from "./admin/QuestionEditor";
import type { StageType } from "./admin/adminTypes";
import { STAGE_LABELS } from "./admin/adminTypes";

export default function Admin() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [selectedStageType, setSelectedStageType] = useState<StageType | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/auth"); return; }
      if (!session.user.user_metadata?.is_admin) { navigate("/course-map"); return; }
      setAuthorized(true);
    });
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleSelectStage = (id: string, type: StageType) => {
    setSelectedStageId(id);
    setSelectedStageType(type);
  };

  if (!authorized) return null;

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: "#FAF6F0" }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-6 py-3 flex-shrink-0"
        style={{ backgroundColor: "#FAF6F0", borderBottom: "1.5px solid #E8E0D5", zIndex: 40 }}
      >
        <div className="flex items-baseline gap-2">
          <span
            style={{ color: "#D4A853", fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700 }}
          >
            گفتگو
          </span>
          <span
            className="font-bold text-base"
            style={{ color: "#1E2D3D", fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Guftugu Admin
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
          style={{ border: "1.5px solid #E8E0D5", color: "#1E2D3D", backgroundColor: "white", cursor: "pointer" }}
        >
          Log out
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AdminSidebar
          selectedStageId={selectedStageId}
          onSelectStage={handleSelectStage}
        />

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-8" style={{ backgroundColor: "#FAF6F0" }}>
          {selectedStageId && selectedStageType ? (
            <div>
              {/* Stage breadcrumb */}
              <p className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "#6BA3C8" }}>
                {STAGE_LABELS[selectedStageType]}
              </p>
              <QuestionEditor stageId={selectedStageId} stageType={selectedStageType} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p style={{ color: "#1E2D3D", opacity: 0.3, fontSize: 14 }}>
                Select a stage from the sidebar to edit its questions
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
