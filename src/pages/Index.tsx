import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const displayName =
    (session?.user.user_metadata?.display_name as string | undefined) ??
    session?.user.email?.split("@")[0];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative"
      style={{ backgroundColor: "#FAF6F0" }}
    >
      {/* Auth corner */}
      <div className="absolute top-6 right-6">
        {session ? (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium" style={{ color: "#1E2D3D", opacity: 0.7 }}>
              {displayName}
            </span>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
              }}
              className="text-xs font-semibold px-3 py-2 rounded-full border-2 transition-colors"
              style={{ borderColor: "#E8E0D5", color: "#1E2D3D", backgroundColor: "#FFFFFF" }}
            >
              Sign out
            </button>
          </div>
        ) : (
          <Link
            to="/auth"
            className="text-xs font-semibold px-4 py-2 rounded-full transition-colors"
            style={{ backgroundColor: "#1E2D3D", color: "#FAF6F0" }}
          >
            Sign in
          </Link>
        )}
      </div>

      {/* Brand */}
      <div className="text-center mb-14">
        <p
          className="text-6xl mb-3 leading-none select-none"
          style={{ color: "#D4A853", fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          گفتگو
        </p>
        <h1
          className="text-4xl font-bold tracking-tight"
          style={{ color: "#1E2D3D", fontFamily: "'Playfair Display', Georgia, serif" }}
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
          onClick={() => {
            if (!selected) return;
            const lang = LANGUAGES.find((l) => l.id === selected);
            if (lang) localStorage.setItem("guftugu_language", lang.name);
            navigate(session ? "/course-map" : "/auth");
          }}
          className="w-full py-4 rounded-2xl font-bold text-base transition-all duration-200"
          style={{
            backgroundColor: selected ? "#D4A853" : "#E8E0D5",
            color: selected ? "#1E2D3D" : "#B0A698",
            cursor: selected ? "pointer" : "not-allowed",
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
