export type FeedbackState = "idle" | "correct" | "wrong";

export interface QuestionProps {
  content: Record<string, any>;
  onAnswer: (correct: boolean) => void;
  feedback: FeedbackState;
}

// Shared option button used by most question types
export function OptionButton({
  label,
  isSelected,
  feedback,
  onClick,
  urdu = false,
  image,
}: {
  label?: string;
  isSelected: boolean;
  feedback: FeedbackState;
  onClick: () => void;
  urdu?: boolean;
  image?: string;
}) {
  const bgColor =
    isSelected && feedback === "correct"
      ? "#D4A853"
      : isSelected && feedback === "wrong"
      ? "#C17B4A"
      : "#FFFFFF";

  const borderColor =
    isSelected && feedback === "correct"
      ? "#D4A853"
      : isSelected && feedback === "wrong"
      ? "#C17B4A"
      : "#E8E0D5";

  const textColor =
    isSelected && feedback !== "idle" ? "#FFFFFF" : "#1E2D3D";

  const disabled = feedback !== "idle";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        backgroundColor: bgColor,
        border: `2px solid ${borderColor}`,
        borderRadius: 16,
        padding: image ? "10px" : "13px 16px",
        color: textColor,
        fontFamily: urdu ? "'Amiri', serif" : "inherit",
        fontSize: urdu ? 22 : 15,
        direction: urdu ? "rtl" : "ltr",
        width: "100%",
        textAlign: "center",
        cursor: disabled ? "default" : "pointer",
        transition: "background-color 0.15s, border-color 0.15s",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
      }}
    >
      {image && (
        <img
          src={image}
          alt=""
          style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 10 }}
        />
      )}
      {label && <span>{label}</span>}
    </button>
  );
}
