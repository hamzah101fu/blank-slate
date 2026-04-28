import { useState } from "react";
import { OptionButton, type QuestionProps } from "./shared";

export function FindLetter({ content, onAnswer, feedback }: QuestionProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const { roman, correct_letter, options = [] } = content;
  // options are wrong letters; add correct and shuffle
  const allOptions: string[] = shuffleOnce([correct_letter, ...options.slice(0, 3)]);

  function shuffleOnce(arr: string[]) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const handlePick = (letter: string) => {
    if (feedback !== "idle") return;
    setSelected(letter);
    onAnswer(letter === correct_letter);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#1E2D3D", opacity: 0.45 }}>
          Find the letter
        </p>
        <p className="text-4xl font-bold" style={{ color: "#1E2D3D", fontFamily: "'Playfair Display', Georgia, serif" }}>
          {roman}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {allOptions.map((letter) => (
          <OptionButton
            key={letter}
            label={letter}
            isSelected={selected === letter}
            feedback={selected === letter ? feedback : "idle"}
            onClick={() => handlePick(letter)}
            urdu
          />
        ))}
      </div>
    </div>
  );
}
