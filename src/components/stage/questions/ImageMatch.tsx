import { useState } from "react";
import { OptionButton, type QuestionProps } from "./shared";

export function ImageMatch({ content, onAnswer, feedback }: QuestionProps) {
  const [selected, setSelected] = useState<number | null>(null);

  // prompt: string — Urdu word/phrase to match
  // correct_index: number
  // options: Array<{ image_url: string; label?: string }>
  const { prompt, correct_index, options = [] } = content;

  const handlePick = (idx: number) => {
    if (feedback !== "idle") return;
    setSelected(idx);
    onAnswer(idx === correct_index);
  };

  return (
    <div className="flex flex-col gap-5">
      <p
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "#1E2D3D", opacity: 0.45 }}
      >
        Match the image
      </p>

      {/* Word prompt */}
      <div
        style={{
          textAlign: "center",
          fontFamily: "'Amiri', serif",
          fontSize: 36,
          fontWeight: 700,
          color: "#1E2D3D",
          direction: "rtl",
          lineHeight: 1.4,
        }}
      >
        {prompt}
      </div>

      {/* Image options — 2×2 grid */}
      <div className="grid grid-cols-2 gap-3">
        {options.map(
          (opt: { image_url: string; label?: string }, idx: number) => (
            <OptionButton
              key={idx}
              label={opt.label}
              image={opt.image_url}
              isSelected={selected === idx}
              feedback={selected === idx ? feedback : "idle"}
              onClick={() => handlePick(idx)}
            />
          )
        )}
      </div>
    </div>
  );
}
