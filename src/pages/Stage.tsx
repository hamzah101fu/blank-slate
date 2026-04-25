import { useNavigate, useParams } from "react-router-dom";

const Stage = () => {
  const { stageId } = useParams();
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: "#FAF6F0" }}
    >
      <h1
        className="text-3xl font-bold tracking-tight"
        style={{ color: "#1E2D3D", fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        Stage
      </h1>
      <p className="mt-2 text-sm" style={{ color: "#1E2D3D", opacity: 0.5 }}>
        {stageId}
      </p>
      <p className="mt-6 text-base" style={{ color: "#1E2D3D", opacity: 0.4 }}>
        Lesson coming soon
      </p>
      <button
        onClick={() => navigate("/course-map")}
        className="mt-8 text-xs"
        style={{ color: "#1E2D3D", opacity: 0.35 }}
      >
        ← Back to Course Map
      </button>
    </div>
  );
};

export default Stage;
