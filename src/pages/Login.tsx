import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, ChevronRight, Loader2, Users, Trophy, Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"coach" | "player" | "manager">("player");
  const [teamCode, setTeamCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        if (!displayName) {
          toast.error("Please enter your name");
          setLoading(false);
          return;
        }
        if ((role === "player" || role === "manager") && !teamCode.trim()) {
          toast.error("Please enter your team code");
          setLoading(false);
          return;
        }
        await signUp(
          email,
          password,
          displayName,
          role,
          role === "player" || role === "manager" ? teamCode.trim().toUpperCase() : undefined,
        );
        toast.success("Account created! Check your email to verify.");
      } else {
        await signIn(email, password);
        toast.success("Welcome back!");
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-3.5 py-2.5 rounded-lg bg-muted text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground transition-colors";
  const labelClass = "block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5";

  return (
    <>
      {/* ── Font import ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        .tp-display { font-family: 'Barlow Condensed', sans-serif; }
        .tp-body    { font-family: 'DM Sans', sans-serif; }

        /* Smooth mode switch */
        .form-fade { animation: fadeUp 0.22s ease both; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Stat card shimmer on desktop */
        .stat-card {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.13);
          border-radius: 12px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .stat-icon {
          width: 36px; height: 36px;
          border-radius: 8px;
          background: rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        /* Role selector pill */
        .role-pill {
          flex: 1;
          padding: 8px 4px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          text-transform: capitalize;
          text-align: center;
          border: 1.5px solid transparent;
          transition: all 0.15s ease;
          cursor: pointer;
          background: transparent;
        }
        .role-pill.active {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border-color: hsl(var(--primary));
        }
        .role-pill.inactive {
          color: hsl(var(--muted-foreground));
          border-color: hsl(var(--border));
        }
        .role-pill.inactive:hover {
          border-color: hsl(var(--ring));
          color: hsl(var(--foreground));
        }
      `}</style>

      {/* ════════════════════════════════════════
          OUTER SHELL — mobile: dvh flex-col
                       desktop: 2-col grid
      ════════════════════════════════════════ */}
      <div
        className="tp-body min-h-dvh flex flex-col lg:grid lg:grid-cols-2"
        style={{ background: "hsl(var(--primary))" }}
      >
        {/* ── LEFT PANEL (brand) ── */}
        {/* Mobile: compact top bar  |  Desktop: full-height brand panel */}
        <div
          className="relative flex flex-col overflow-hidden
                        /* mobile */
                        flex-none px-6 pb-6 pt-10 items-center justify-end
                        /* desktop */
                        lg:min-h-screen lg:items-start lg:justify-between lg:px-14 lg:py-14"
        >
          {/* Background texture dots — desktop only */}
          <div
            className="hidden lg:block absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          {/* Logo + wordmark */}
          <div className="flex items-center gap-3 lg:flex-col lg:items-start lg:gap-4">
            <div
              className="w-11 h-11 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.18)", border: "1.5px solid rgba(255,255,255,0.25)" }}
            >
              <Shield className="w-5 h-5 lg:w-7 lg:h-7 text-white" />
            </div>
            <div>
              <h1
                className="tp-display text-white leading-none tracking-tight"
                style={{ fontSize: "clamp(1.6rem, 5vw, 3.2rem)", fontWeight: 800 }}
              >
                TeamPulse
              </h1>
              <p className="text-white/60 hidden lg:block mt-1" style={{ fontSize: "15px", fontWeight: 500 }}>
                Sports Team Management
              </p>
            </div>
          </div>

          {/* Desktop hero copy */}
          <div className="hidden lg:block">
            <p
              className="tp-display text-white leading-tight mb-10"
              style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 700, maxWidth: "420px" }}
            >
              One platform for every team, every role, every game.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "340px" }}>
              {[
                { icon: <Users size={16} />, title: "Role-based access", sub: "Coaches, players & managers" },
                { icon: <Trophy size={16} />, title: "Performance tracking", sub: "Stats, attendance & more" },
                { icon: <Activity size={16} />, title: "Live team updates", sub: "Stay in sync, always" },
              ].map((s) => (
                <div key={s.title} className="stat-card">
                  <div className="stat-icon" style={{ color: "rgba(255,255,255,0.85)" }}>
                    {s.icon}
                  </div>
                  <div>
                    <p style={{ color: "rgba(255,255,255,0.95)", fontSize: "13px", fontWeight: 600, margin: 0 }}>
                      {s.title}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", margin: 0 }}>{s.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: small tagline under logo */}
          <p className="text-white/50 text-xs mt-1.5 lg:hidden" style={{ fontWeight: 500 }}>
            Sports Team Management
          </p>
        </div>

        {/* ── RIGHT PANEL (form) ── */}
        {/* Mobile: rounded-top card that fills rest of screen
            Desktop: centered card on white/card bg         */}
        <div
          className="flex-1 flex flex-col
                     rounded-t-3xl
                     lg:flex-none lg:rounded-none lg:items-center lg:justify-center lg:py-16 lg:px-8"
          style={{ background: "hsl(var(--card))" }}
        >
          {/* Desktop: inner card */}
          <div
            className="w-full flex flex-col px-6 pt-7 pb-8
                       lg:max-w-md lg:rounded-2xl lg:border lg:px-10 lg:py-10 lg:shadow-sm"
            style={{ borderColor: "hsl(var(--border))" }}
          >
            {/* Heading */}
            <div className="mb-5 lg:mb-6">
              <h2
                className="tp-display text-card-foreground leading-tight"
                style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 700 }}
              >
                {isSignUp ? "Create account" : "Welcome back"}
              </h2>
              <p className="text-muted-foreground text-sm mt-0.5">
                {isSignUp ? "Join your team on TeamPulse" : "Sign in to your TeamPulse account"}
              </p>
            </div>

            {/* Form fields */}
            <div key={isSignUp ? "signup" : "signin"} className="form-fade flex flex-col gap-3.5 flex-1">
              {isSignUp && (
                <>
                  {/* Full Name */}
                  <div>
                    <label className={labelClass}>Full Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="John Doe"
                      className={inputClass}
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label className={labelClass}>I am a…</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {(["coach", "manager", "player"] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => setRole(r)}
                          className={`role-pill ${role === r ? "active" : "inactive"}`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Team Code */}
                  {(role === "player" || role === "manager") && (
                    <div>
                      <label className={labelClass}>Team Code</label>
                      <input
                        type="text"
                        value={teamCode}
                        onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                        placeholder="e.g. A7K9Q2"
                        maxLength={6}
                        className={inputClass + " tracking-widest font-mono"}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Email */}
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className={inputClass}
                />
              </div>

              {/* Password */}
              <div>
                <label className={labelClass}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
              </div>

              {/* Forgot password — sign-in only */}
              {!isSignUp && (
                <div className="flex justify-end -mt-1">
                  <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-50 mt-1"
                style={{
                  background: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                  transition: "opacity 0.15s ease, transform 0.1s ease",
                }}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSignUp ? "Create Account" : "Sign In"}
                {!loading && <ChevronRight className="w-4 h-4" />}
              </button>

              {/* Switch mode */}
              <p className="text-center text-xs text-muted-foreground pt-0.5">
                {isSignUp ? "Already have an account? " : "Don't have an account? "}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="font-semibold text-foreground hover:underline transition-colors"
                >
                  {isSignUp ? "Sign in" : "Sign up"}
                </button>
              </p>
            </div>
          </div>

          {/* Bottom safe-area spacer on mobile */}
          <div className="h-safe-area-inset-bottom lg:hidden" />
        </div>
      </div>
    </>
  );
};

export default Login;
