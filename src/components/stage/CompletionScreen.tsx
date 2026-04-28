interface CompletionScreenProps {
  stageName: string;
  xpEarned: number;
  accuracy: number; // 0–1
  onContinue: () => void;
}

export function CompletionScreen({
  stageName,
  xpEarned,
  accuracy,
  onContinue,
}: CompletionScreenProps) {
  const stars = accuracy >= 0.9 ? 3 : accuracy >= 0.7 ? 2 : 1;

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen"
      style={{ backgroundColor: "#FAF6F0", padding: "32px 24px" }}
    >
      {/* Star rating */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <span
            key={s}
            style={{
              fontSize: 48,
              filter: s <= stars ? "none" : "grayscale(1) opacity(0.25)",
              transition: "all 0.3s",
            }}
          >
            ⭐
          </span>
        ))}
      </div>

      {/* Stage complete label */}
      <p
        className="text-xs font-semibold uppercase tracking-widest mb-2"
        style={{ color: "#1E2D3D", opacity: 0.45 }}
      >
        Stage Complete
      </p>

      <h1
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 32,
          fontWeight: 700,
          color: "#1E2D3D",
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        {stageName}
      </h1>

      {/* XP badge */}
      <div
        style={{
          backgroundColor: "#D4A853",
          color: "#FFFFFF",
          borderRadius: 99,
          padding: "10px 28px",
          fontWeight: 700,
          fontSize: 20,
          marginTop: 20,
          marginBottom: 8,
          boxShadow: "0 4px 16px rgba(212,168,83,0.35)",
        }}
      >
        +{xpEarned} XP
      </div>

      {/* Accuracy */}
      <p style={{ color: "#1E2D3D", opacity: 0.5, fontSize: 14, marginBottom: 40 }}>
        {Math.round(accuracy * 100)}% accuracy
      </p>

      {/* Divider */}
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          height: 1,
          backgroundColor: "#E8E0D5",
          marginBottom: 32,
        }}
      />

      {/* Continue button */}
      <button
        onClick={onContinue}
        style={{
          width: "100%",
          maxWidth: 360,
          padding: "16px",
          borderRadius: 16,
          backgroundColor: "#1E2D3D",
          color: "#FAF6F0",
          border: "none",
          fontWeight: 700,
          fontSize: 16,
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(30,45,61,0.2)",
        }}
      >
        Back to Course Map →
      </button>
    </div>
  );
}
