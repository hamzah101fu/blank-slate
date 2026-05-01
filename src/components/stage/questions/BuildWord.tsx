import { useState } from "react";
import type { QuestionProps } from "./shared";

export function BuildWord({ content, onAnswer, feedback }: QuestionProps) {
  // scrambled_letters: string[] — shuffled letters of the word
  // word: string — the target word to build
  const { scrambled_letters = [], word: targetWord, hint } = content;

  const [slots, setSlots] = useState<(string | null)[]>(
    Array(targetWord?.length ?? scrambled_letters.length).fill(null)
  );
  const [available, setAvailable] = useState<boolean[]>(
    scrambled_letters.map(() => true)
  );

  const disabled = feedback !== "idle";

  const handleLetterClick = (srcIdx: number) => {
    if (disabled || !available[srcIdx]) return;
    const firstEmpty = slots.findIndex((s) => s === null);
    if (firstEmpty === -1) return;
    const newSlots = [...slots];
    newSlots[firstEmpty] = scrambled_letters[srcIdx];
    setSlots(newSlots);
    const newAvail = [...available];
    newAvail[srcIdx] = false;
    setAvailable(newAvail);
  };

  const handleSlotClick = (slotIdx: number) => {
    if (disabled || slots[slotIdx] === null) return;
    const letter = slots[slotIdx]!;
    // Return the letter to the first matching available=false source slot
    const srcIdx = scrambled_letters.findIndex(
      (l, i) => l === letter && !available[i]
    );
    const newSlots = [...slots];
    newSlots[slotIdx] = null;
    setSlots(newSlots);
    if (srcIdx !== -1) {
      const newAvail = [...available];
      newAvail[srcIdx] = true;
      setAvailable(newAvail);
    }
  };

  const handleCheck = () => {
    if (disabled) return;
    if (slots.some((s) => s === null)) return;
    const assembled = slots.join("");
    onAnswer(assembled === targetWord);
  };

  const allFilled = slots.every((s) => s !== null);

  return (
    <div className="flex flex-col items-center gap-6">
      <p
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "#1E2D3D", opacity: 0.45 }}
      >
        Build the word
      </p>

      {hint && (
        <p style={{ color: "#1E2D3D", opacity: 0.6, fontSize: 14 }}>{hint}</p>
      )}

      {/* Answer slots */}
      <div className="flex gap-2 flex-row-reverse flex-wrap justify-center">
        {slots.map((letter, i) => (
          <button
            key={i}
            onClick={() => handleSlotClick(i)}
            disabled={disabled}
            style={{
              width: 48,
              height: 56,
              borderRadius: 12,
              border: letter
                ? `2px solid ${feedback === "correct" ? "#D4A853" : feedback === "wrong" ? "#C17B4A" : "#D4A853"}`
                : "2px dashed #C8BDB0",
              backgroundColor: letter
                ? feedback === "correct"
                  ? "#D4A853"
                  : feedback === "wrong"
                  ? "#C17B4A"
                  : "#FFF8EC"
                : "transparent",
              color: feedback !== "idle" && letter ? "#FFFFFF" : "#1E2D3D",
              fontFamily: "'Amiri', serif",
              fontSize: 22,
              cursor: letter && !disabled ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
            }}
          >
            {letter}
          </button>
        ))}
      </div>

      {/* Available letters */}
      <div className="flex gap-2 flex-row-reverse flex-wrap justify-center">
        {scrambled_letters.map((letter: string, i: number) => (
          <button
            key={i}
            onClick={() => handleLetterClick(i)}
            disabled={disabled || !available[i]}
            style={{
              width: 48,
              height: 56,
              borderRadius: 12,
              border: "2px solid #E8E0D5",
              backgroundColor: available[i] ? "#FFFFFF" : "#F0EBE3",
              color: available[i] ? "#1E2D3D" : "transparent",
              fontFamily: "'Amiri', serif",
              fontSize: 22,
              cursor: available[i] && !disabled ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
            }}
          >
            {letter}
          </button>
        ))}
      </div>

      {/* Check button */}
      <button
        onClick={handleCheck}
        disabled={!allFilled || disabled}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: 16,
          backgroundColor: allFilled && !disabled ? "#1E2D3D" : "#E8E0D5",
          color: allFilled && !disabled ? "#FAF6F0" : "#1E2D3D",
          border: "none",
          fontWeight: 600,
          fontSize: 15,
          cursor: allFilled && !disabled ? "pointer" : "default",
          transition: "background-color 0.15s",
          opacity: allFilled ? 1 : 0.5,
        }}
      >
        Check
      </button>
    </div>
  );
}
