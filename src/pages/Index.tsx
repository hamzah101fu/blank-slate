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

function GeometricBorder() {
  return (
    <svg
      width="100%"
      height="20"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <defs>
        <pattern
          id="geo-border-h"
          x="0"
          y="0"
          width="48"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <line
            x1="0" y1="10" x2="48" y2="10"
            stroke="#1E2D3D" strokeWidth="0.75" strokeOpacity="0.18"
          />
          <path
            d="M 24 5 L 29 10 L 24 15 L 19 10 Z"
            stroke="#1E2D3D" strokeWidth="0.75" strokeOpacity="0.18"
            fill="#FAF6F0"
          />
          <circle cx="0"  cy="10" r="1.5" fill="#1E2D3D" fillOpacity="0.18" />
          <circle cx="48" cy="10" r="1.5" fill="#1E2D3D" fillOpacity="0.18" />
        </pattern>
      </defs>
      <rect width="100%" height="20" fill="url(#geo-border-h)" />
    </svg>
  );
}

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
    <div className="min-h-screen" style={{ backgroundColor: "#FAF6F0" }}>

      {/* ── Top navigation bar ── */}
      <nav className="gf-nav">
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span className="gf-wordmark-script">گفتگو</span>
          <span className="gf-wordmark-latin">Guftugu</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {session ? (
            <>
              <span
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#1E2D3D",
                  opacity: 0.6,
                }}
              >
                {displayName}
              </span>
              <button
                onClick={() => supabase.auth.signOut()}
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid rgba(30,45,61,0.15)",
                  color: "#1E2D3D",
                  backgroundColor: "#FFFFFF",
                  cursor: "pointer",
                  transition: "background 150ms ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(30,45,61,0.04)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 13,
                fontWeight: 600,
                padding: "10px 20px",
                borderRadius: 8,
                backgroundColor: "#1E2D3D",
                color: "#FAF6F0",
                textDecoration: "none",
                transition: "opacity 150ms ease",
              }}
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>

      {/* ── Main content ── */}
      <div
        className="animate-page-entry flex flex-col items-center justify-center"
        style={{
          minHeight: "calc(100vh - 64px)",
          padding: "48px 24px 64px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 720 }}>

          {/* ── Hero ── */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p
              style={{
                fontFamily: "'Amiri', serif",
                fontSize: 64,
                fontWeight: 700,
                color: "#1E2D3D",
                lineHeight: 1.3,
                direction: "rtl",
                marginBottom: 16,
              }}
            >
              زبان سیکھیں
            </p>
            <h1
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 40,
                fontWeight: 700,
                color: "#1E2D3D",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
                marginBottom: 32,
              }}
            >
              Learn the language of your roots
            </h1>
            <GeometricBorder />
          </div>

          {/* ── Language selector label ── */}
          <p className="gf-label" style={{ textAlign: "center", marginBottom: 16 }}>
            Choose a language
          </p>

          {/* ── Language cards ── */}
          <div
            className="grid grid-cols-2 gap-4"
            style={{ marginBottom: 32 }}
          >
            {LANGUAGES.map((lang) => {
              const isSelected = selected === lang.id;
              return (
                <button
                  key={lang.id}
                  onClick={() => setSelected(lang.id)}
                  className={`gf-lang-card gf-focus-ring${isSelected ? " selected" : ""}`}
                >
                  <span
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: 26,
                      fontWeight: 700,
                      color: "#1E2D3D",
                      lineHeight: 1.2,
                    }}
                  >
                    {lang.name}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Amiri', serif",
                      fontSize: 36,
                      color: isSelected ? "#6BA3C8" : "#1E2D3D",
                      lineHeight: 1.6,
                      direction: "rtl",
                    }}
                  >
                    {lang.native}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Inter', system-ui, sans-serif",
                      fontSize: 12,
                      color: "#1E2D3D",
                      opacity: 0.5,
                      lineHeight: 1.5,
                    }}
                  >
                    {lang.tagline}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Inter', system-ui, sans-serif",
                      fontSize: 11,
                      fontWeight: 600,
                      color: isSelected ? "#6BA3C8" : "#1E2D3D",
                      opacity: isSelected ? 1 : 0.35,
                      letterSpacing: "0.04em",
                      marginTop: 2,
                    }}
                  >
                    {lang.speakers}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── CTA ── */}
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <button
              disabled={!selected}
              onClick={() => {
                if (!selected) return;
                const lang = LANGUAGES.find((l) => l.id === selected);
                if (lang) localStorage.setItem("guftugu_language", lang.name);
                navigate(session ? "/course-map" : "/auth");
              }}
              className="gf-btn-primary gf-focus-ring"
            >
              Start Learning
            </button>

            <p
              style={{
                textAlign: "center",
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 12,
                color: "#1E2D3D",
                opacity: 0.35,
                marginTop: 16,
              }}
            >
              Free · No account needed to start
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Index;
