import { useState } from "react";

const LANGUAGES = [
  {
    id: "urdu",
    name: "Urdu",
    native: "اردو",
    tagline: "National language of Pakistan",
    speakers: "70M+ speakers",
  },
  {
    id: "sindhi",
    name: "Sindhi",
    native: "سنڌي",
    tagline: "Language of the Indus Valley",
    speakers: "30M+ speakers",
  },
];

const Index = () => {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16"
      style={{ backgroundColor: "#FAF6F0" }}
    >
      {/* Brand */}
      <div className="text-center mb-14">
        <p
          className="text-6xl mb-3 leading-none select-none"
          style={{ color: "#D4A853", fontFamily: "Georgia, serif" }}
        >
          گفتگو
        </p>
        <h1
          className="text-4xl font-bold tracking-tight"
          style={{ color: "#1E2D3D" }}
        >
          Guftugu
        </h1>
        <p
          className="mt-3 text-base max-w-xs mx-auto leading-relaxed"
          style={{ color: "#1E2D3D", opacity: 0.55 }}
        >
          Learn Pakistani languages — one lesson at a time
        </p>
      </div>

      {/* Language selector */}
      <div className="w-full max-w-xs mb-8">
        <p
          className="text-xs font-semibold uppercase tracking-widest text-center mb-4"
          style={{ color: "#1E2D3D", opacity: 0.4 }}
        >
          Choose a language
        </p>

        <div className="flex flex-col gap-3">
          {LANGUAGES.map((lang) => {
            const isSelected = selected === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => setSelected(lang.id)}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all duration-200"
                style={{
                  backgroundColor: isSelected ? "#1E2D3D" : "#FFFFFF",
                  borderColor: isSelected ? "#1E2D3D" : "#E8E0D5",
                  color: isSelected ? "#FAF6F0" : "#1E2D3D",
                  boxShadow: isSelected
                    ? "0 4px 20px rgba(30,45,61,0.15)"
                    : "0 1px 4px rgba(30,45,61,0.06)",
                }}
              >
                <div className="flex-1">
                  <div className="font-semibold text-base">{lang.name}</div>
                  <div
                    className="text-xs mt-0.5"
                    style={{ opacity: 0.55 }}
                  >
                    {lang.tagline}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="text-2xl leading-none"
                    style={{
                      fontFamily: "Georgia, serif",
                      color: isSelected ? "#D4A853" : "#1E2D3D",
                    }}
                  >
                    {lang.native}
                  </div>
                  <div
                    className="text-xs mt-1"
                    style={{ opacity: 0.45 }}
                  >
                    {lang.speakers}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="w-full max-w-xs">
        <button
          disabled={!selected}
          className="w-full py-4 rounded-2xl font-bold text-base transition-all duration-200"
          style={{
            backgroundColor: selected ? "#D4A853" : "#E8E0D5",
            color: selected ? "#1E2D3D" : "#B0A698",
            cursor: selected ? "pointer" : "not-allowed",
            boxShadow: selected
              ? "0 4px 16px rgba(212,168,83,0.4)"
              : "none",
          }}
        >
          Start Learning →
        </button>

        <p
          className="text-center text-xs mt-4"
          style={{ color: "#1E2D3D", opacity: 0.35 }}
        >
          Free · No account needed to start
        </p>
      </div>
    </div>
  );
};

export default Index;
