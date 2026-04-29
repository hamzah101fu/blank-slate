import { useState } from "react";
import { Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TraceLetter } from "@/components/stage/questions/TraceLetter";
import { FindLetter } from "@/components/stage/questions/FindLetter";
import { AudioPlay } from "@/components/stage/questions/AudioPlay";
import { Conversation } from "@/components/stage/questions/Conversation";
import { FillBlank } from "@/components/stage/questions/FillBlank";
import { BuildWord } from "@/components/stage/questions/BuildWord";
import { ImageMatch } from "@/components/stage/questions/ImageMatch";
import { Dialogue } from "@/components/stage/questions/Dialogue";
import { Reading } from "@/components/stage/questions/Reading";
import type { AdminQuestion } from "./adminTypes";

interface Props {
  question: AdminQuestion;
}

export function QuestionPreviewModal({ question }: Props) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong">("idle");

  const handleOpen = (o: boolean) => {
    setOpen(o);
    if (o) setFeedback("idle");
  };

  const mockOnAnswer = (correct: boolean) => {
    setFeedback(correct ? "correct" : "wrong");
    setTimeout(() => setFeedback("idle"), 1500);
  };

  const props = { content: question.content as any, onAnswer: mockOnAnswer, feedback };

  const renderComponent = () => {
    switch (question.type) {
      case "trace_letter":  return <TraceLetter {...props} />;
      case "find_letter":   return <FindLetter {...props} />;
      case "audio_play":    return <AudioPlay {...props} />;
      case "conversation":  return <Conversation {...props} />;
      case "fill_blank":    return <FillBlank {...props} />;
      case "build_word":    return <BuildWord {...props} />;
      case "image_match":   return <ImageMatch {...props} />;
      case "dialogue":      return <Dialogue {...props} />;
      case "reading":       return <Reading {...props} />;
      default:              return <p style={{ color: "#1E2D3D", opacity: 0.5 }}>Unknown question type.</p>;
    }
  };

  return (
    <>
      <button
        type="button"
        title="Preview"
        onClick={() => setOpen(true)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#6BA3C8",
          opacity: 0.8,
          padding: 2,
          display: "flex",
          alignItems: "center",
        }}
      >
        <Eye size={14} />
      </button>
      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent
          style={{
            backgroundColor: "#FAF6F0",
            border: "1.5px solid #E8E0D5",
            maxWidth: 440,
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          <DialogHeader>
            <DialogTitle
              style={{
                color: "#1E2D3D",
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 16,
              }}
            >
              Preview — {question.type.replace(/_/g, " ")}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 flex flex-col items-center">
            {renderComponent()}
          </div>
          {feedback !== "idle" && (
            <div
              className="mt-4 text-center text-sm font-semibold py-2 rounded-xl"
              style={{
                backgroundColor: feedback === "correct" ? "#E8F5E9" : "#FBE9E7",
                color: feedback === "correct" ? "#2E7D32" : "#C17B4A",
              }}
            >
              {feedback === "correct" ? "✓ Correct!" : "✗ Incorrect"}
            </div>
          )}
          <p className="text-xs text-center mt-3" style={{ color: "#1E2D3D", opacity: 0.35 }}>
            This is a live preview — interactions are functional.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
