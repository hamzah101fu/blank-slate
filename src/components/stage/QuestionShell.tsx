import { useState } from "react";
import type { FeedbackState } from "./questions/shared";
import { TraceLetter } from "./questions/TraceLetter";
import { FindLetter } from "./questions/FindLetter";
import { AudioPlay } from "./questions/AudioPlay";
import { Conversation } from "./questions/Conversation";
import { FillBlank } from "./questions/FillBlank";
import { BuildWord } from "./questions/BuildWord";
import { ImageMatch } from "./questions/ImageMatch";
import { Dialogue } from "./questions/Dialogue";
import { Reading } from "./questions/Reading";

interface Question {
  id: string;
  question_type: string;
  content: Record<string, any>;
}

interface QuestionShellProps {
  questions: Question[];
  currentIdx: number;
  onCorrect: () => void;
  onWrong: () => void;
  /** Called after a correct answer — advance to next question */
  onContinue: () => void;
  onQuit: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  trace_letter: "Aghaaz",
  find_letter: "Aghaaz",
  audio_play: "Suno",
  conversation: "Samjho",
  fill_blank: "Samjho",
  build_word: "Samjho",
  image_match: "Pehchano",
  dialogue: "Guftugu",
  reading: "Guftugu",
};

function QuestionRenderer({
  question,
  onAnswer,
  feedback,
}: {
  question: Question;
  onAnswer: (correct: boolean) => void;
  feedback: FeedbackState;
}) {
  const props = { content: question.content, onAnswer, feedback };
  switch (question.question_type) {
    case "trace_letter":
      return <TraceLetter {...props} />;
    case "find_letter":
      return <FindLetter {...props} />;
    case "audio_play":
      return <AudioPlay {...props} />;
    case "conversation":
      return <Conversation {...props} />;
    case "fill_blank":
      return <FillBlank {...props} />;
    case "build_word":
      return <BuildWord {...props} />;
    case "image_match":
      return <ImageMatch {...props} />;
    case "dialogue":
      return <Dialogue {...props} />;
    case "reading":
      return <Reading {...props} />;
    default:
      return (
        <div className="text-center" style={{ color: "#1E2D3D", opacity: 0.5 }}>
          Unknown question type: {question.question_type}
        </div>
      );
  }
}

export function QuestionShell({
  questions,
  currentIdx,
  onCorrect,
  onWrong,
  onContinue,
  onQuit,
}: QuestionShellProps) {
  const [feedback, setFeedback] = useState<FeedbackState>("idle");
  const [retryCount, setRetryCount] = useState(0);

  const question = questions[currentIdx];
  const progress = (currentIdx / questions.length) * 100;

  const handleAnswer = (correct: boolean) => {
    setFeedback(correct ? "correct" : "wrong");
    if (correct) onCorrect();
    else onWrong();
  };

  const handleContinue = () => {
    setFeedback("idle");
    onContinue(); // advance to next question
  };

  const handleRetry = () => {
    setFeedback("idle");
    setRetryCount((r) => r + 1); // forces question component remount via key
  };

  if (!question) return null;

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ backgroundColor: "#FAF6F0" }}
    >
      {/* Top bar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          backgroundColor: "#FAF6F0",
          borderBottom: "1px solid #E8E0D5",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* Quit button */}
        <button
          onClick={onQuit}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            color: "#1E2D3D",
            opacity: 0.5,
            flexShrink: 0,
          }}
          aria-label="Quit"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Progress bar */}
        <div
          style={{
            flex: 1,
            height: 8,
            backgroundColor: "#E8E0D5",
            borderRadius: 99,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              backgroundColor: "#D4A853",
              borderRadius: 99,
              transition: "width 0.4s ease",
            }}
          />
        </div>

        {/* Counter */}
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#1E2D3D",
            opacity: 0.5,
            flexShrink: 0,
            minWidth: 40,
            textAlign: "right",
          }}
        >
          {currentIdx + 1}/{questions.length}
        </span>
      </div>

      {/* Question content */}
      <div
        style={{
          flex: 1,
          padding: "24px 20px",
          maxWidth: 480,
          width: "100%",
          margin: "0 auto",
        }}
      >
        <QuestionRenderer
          key={`${question.id}-${retryCount}`}
          question={question}
          onAnswer={handleAnswer}
          feedback={feedback}
        />
      </div>

      {/* Feedback panel */}
      {feedback !== "idle" && (
        <div
          style={{
            position: "sticky",
            bottom: 0,
            backgroundColor: feedback === "correct" ? "#D4A853" : "#C17B4A",
            padding: "20px 20px 32px",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            maxWidth: "100%",
          }}
        >
          <div style={{ maxWidth: 480, margin: "0 auto", width: "100%" }}>
            <div className="flex items-center gap-3 mb-3">
              <span style={{ fontSize: 24 }}>
                {feedback === "correct" ? "✓" : "✗"}
              </span>
              <div>
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: 18,
                    color: "#FFFFFF",
                    lineHeight: 1.2,
                  }}
                >
                  {feedback === "correct" ? "Sahi! صحیح" : "Oops! غلط"}
                </p>
                {feedback === "wrong" && question.content.correct_letter && (
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 2 }}>
                    Correct: {question.content.correct_letter}
                  </p>
                )}
                {feedback === "wrong" && question.content.correct_word && (
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 2, fontFamily: "'Amiri', serif", direction: "rtl" }}>
                    Correct: {question.content.correct_word}
                  </p>
                )}
              </div>
            </div>

            {/* Continue / Try again button */}
            <button
              onClick={feedback === "correct" ? handleContinue : handleRetry}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 16,
                backgroundColor: "#FFFFFF",
                color: feedback === "correct" ? "#D4A853" : "#C17B4A",
                border: "none",
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              {feedback === "correct" ? "Continue →" : "Try Again"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
