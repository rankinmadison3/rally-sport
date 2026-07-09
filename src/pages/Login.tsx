import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, Users, Trophy, Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/rally-sport-logo.png";
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
        toast.success("Account created! You can sign in now.");
        setIsSignUp(false);
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
    "w-full px-4 py-3.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all";
  const labelClass =
    "block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2";

  const features = [
    { icon: <Users className="w-5 h-5" />, title: "Role-based access", sub: "Coaches, players & managers" },
    { icon: <Trophy className="w-5 h-5" />, title: "Performance tracking", sub: "Stats, attendance & more" },
    { icon: <Activity className="w-5 h-5" />, title: "Live team updates", sub: "Stay in sync, always" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
      `}</style>

      <div className="font-body min-h-dvh flex flex-col lg:flex-row bg-background text-foreground antialiased">
        {/* ── LEFT: Brand panel (desktop) ── */}
        <div
          className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 relative overflow-hidden"
          style={{ background: "hsl(var(--primary))" }}
        >
          {/* Texture overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: 0.1,
              backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Logo + wordmark */}
          <div className="relative z-10 flex items-center gap-3">
            <img src={logo} alt="Rally Sport" className="h-14 w-auto object-contain" />
            <div>
              <span className="font-display font-bold text-white text-xl tracking-tight uppercase block leading-tight">
                Rally Sport
              </span>
              <p className="text-white/70 text-sm font-medium">Sports Team Management</p>
            </div>
          </div>

          {/* Hero copy + feature cards */}
          <div className="relative z-10">
            <h1
              className="font-display font-bold text-white leading-tight uppercase tracking-tighter max-w-md mb-12"
              style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)" }}
            >
              One platform for every team, every role, every game.
            </h1>

            <div className="space-y-4 max-w-sm">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/10 border border-white/10 backdrop-blur-md"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 text-white">
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{f.title}</p>
                    <p className="text-white/60 text-xs">{f.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 text-white/40 text-xs font-medium uppercase tracking-widest">
            © Rally Sport Systems
          </div>
        </div>

        {/* ── Mobile crimson header ── */}
        <div
          className="lg:hidden flex items-center justify-center gap-3 px-6 py-6"
          style={{ background: "hsl(var(--primary))" }}
        >
          <img src={logo} alt="Rally Sport" className="h-12 w-auto object-contain" />
          <div>
            <span className="font-display font-bold text-white text-base uppercase tracking-tight block leading-tight">
              Rally Sport
            </span>
            <p className="text-white/70 text-xs font-medium">Sports Team Management</p>
          </div>
        </div>

        {/* ── RIGHT: Form panel ── */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-16 bg-card">
          <div className="w-full max-w-[440px]">
            <div className="mb-8 lg:mb-10 text-center lg:text-left">
              <h2 className="font-display text-3xl lg:text-4xl font-bold tracking-tight text-card-foreground mb-2">
                {isSignUp ? "Create account" : "Welcome back"}
              </h2>
              <p className="text-muted-foreground font-medium text-sm">
                {isSignUp ? "Join your team on Rally Sport" : "Sign in to your Rally Sport account"}
              </p>
            </div>

            <div className="space-y-5">
              {isSignUp && (
                <>
                  <div className="space-y-2">
                    <label className={labelClass}>Full Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="John Doe"
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass}>I am a…</label>
                    <div className="flex gap-2">
                      {(["coach", "manager", "player"] as const).map((r) => {
                        const active = role === r;
                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setRole(r)}
                            className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                              active
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-transparent text-muted-foreground border-border hover:border-primary hover:text-foreground"
                            }`}
                          >
                            {r}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {(role === "player" || role === "manager") && (
                    <div className="space-y-2">
                      <label className={labelClass}>Team Code</label>
                      <input
                        type="text"
                        value={teamCode}
                        onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                        placeholder="A7K9Q2"
                        maxLength={6}
                        className={`${inputClass} tracking-widest font-mono`}
                      />
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2">
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={labelClass + " mb-0"}>Password</label>
                  {!isSignUp && (
                    <button
                      type="button"
                      className="text-xs font-semibold hover:underline"
                      style={{ color: "hsl(var(--primary))" }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="group w-full py-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 shadow-lg"
                style={{
                  background: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                  boxShadow: "0 10px 25px -5px hsl(var(--primary) / 0.35)",
                }}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isSignUp ? "Create Account" : "Sign In"}</span>
                {!loading && (
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                )}
              </button>
            </div>

            <div className="mt-10 pt-8 border-t border-border text-center space-y-3">
              <p className="text-muted-foreground font-medium text-sm">
                {isSignUp ? "Already have an account? " : "Don't have an account? "}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="font-bold hover:underline ml-1"
                  style={{ color: "hsl(var(--primary))" }}
                >
                  {isSignUp ? "Sign in" : "Sign up"}
                </button>
              </p>
              <p className="text-xs text-muted-foreground">
                By continuing you agree to our{" "}
                <a href="/terms" className="underline hover:text-foreground">Terms</a> and{" "}
                <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
