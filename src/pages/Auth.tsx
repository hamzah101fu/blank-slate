import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "@/hooks/use-toast";

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate("/course-map", { replace: true });
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/course-map", { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: displayName },
          },
        });
        if (error) throw error;
        toast({ title: "Check your email", description: "Confirm your email to continue." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast({
        title: "Authentication failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast({
        title: "Google sign-in failed",
        description: result.error.message ?? "Try again",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16"
      style={{ backgroundColor: "#FAF6F0" }}
    >
      <div className="text-center mb-10">
        <p
          className="text-5xl mb-2 leading-none select-none"
          style={{ color: "#D4A853", fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          گفتگو
        </p>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#1E2D3D", fontFamily: "'Playfair Display', Georgia, serif" }}>
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm" style={{ color: "#1E2D3D", opacity: 0.55 }}>
          {mode === "signin" ? "Sign in to continue learning" : "Start your language journey"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-3">
        {mode === "signup" && (
          <input
            type="text"
            placeholder="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-2xl border-2 outline-none transition-colors"
            style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E0D5", color: "#1E2D3D" }}
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-2xl border-2 outline-none"
          style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E0D5", color: "#1E2D3D" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-4 py-3 rounded-2xl border-2 outline-none"
          style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E0D5", color: "#1E2D3D" }}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl font-bold text-base mt-2 transition-all"
          style={{
            backgroundColor: "#1E2D3D",
            color: "#FAF6F0",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.65 : 1,
          }}
        >
          {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>

        <div className="flex items-center gap-3 my-3">
          <div className="flex-1 h-px" style={{ backgroundColor: "#E8E0D5" }} />
          <span className="text-xs uppercase tracking-widest" style={{ color: "#1E2D3D", opacity: 0.4 }}>
            or
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: "#E8E0D5" }} />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="w-full py-3 rounded-2xl font-semibold text-base border-2 flex items-center justify-center gap-3 transition-all"
          style={{
            backgroundColor: "#FFFFFF",
            borderColor: "#E8E0D5",
            color: "#1E2D3D",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="text-center text-sm mt-4 underline-offset-4 hover:underline"
          style={{ color: "#1E2D3D", opacity: 0.6 }}
        >
          {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </form>
    </div>
  );
};

export default Auth;
