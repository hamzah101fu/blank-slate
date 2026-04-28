import { useState } from "react";
import { OptionButton, type QuestionProps } from "./shared";

export function Reading({ content, onAnswer, feedback }: QuestionProps) {
  const [selected, setSelected] = useState<number | null>(null);

  // passage: string — Urdu reading passage
  // question: string — comprehension question
  // correct_index: number
  // options: string[]
  const { passage, question, correct_index, options = [] } = content;

  const handlePick = (idx: number) => {
    if (feedback !== "idle") return;
    setSelected(idx);
    onAnswer(idx === correct_index);
  };

  return (
    <div className="flex flex-col gap-4">
      <p
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "#1E2D3D", opacity: 0.45 }}
      >
        Read and answer
      </p>

      {/* Passage */}
      <div
        style={{
          backgroundColor: "#FAF6F0",
          border: "2px solid #E8E0D5",
          borderRadius: 16,
          padding: "18px 20px",
          fontFamily: "'Amiri', serif",
          fontSize: 20,
          direction: "rtl",
          textAlign: "right",
          color: "#1E2D3D",
          lineHeight: 2,
        }}
      >
        {passage}
      </div>

      {/* Question */}
      <p
        style={{
          fontFamily: "'Amiri', serif",
          fontSize: 20,
          color: "#1E2D3D",
          direction: "rtl",
          textAlign: "right",
          lineHeight: 1.6,
          fontWeight: 700,
        }}
      >
        {question}
      </p>

      {/* Options */}
      <div className="flex flex-col gap-3">
        {options.map((opt: string, idx: number) => (
          <OptionButton
            key={idx}
            label={opt}
            isSelected={selected === idx}
            feedback={selected === idx ? feedback : "idle"}
            onClick={() => handlePick(idx)}
            urdu
          />
        ))}
      </div>
    </div>
  );
}
