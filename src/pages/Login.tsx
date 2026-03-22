import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, ChevronRight, Loader2 } from "lucide-react";
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
        if (role === "player" && !teamCode.trim()) {
          toast.error("Please enter your team code");
          setLoading(false);
          return;
        }
        await signUp(email, password, displayName, role, role === "player" ? teamCode.trim().toUpperCase() : undefined);
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

  return (
    <div className="min-h-screen flex flex-col bg-primary">
      {/* Top Branding */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-16 h-16 rounded-2xl bg-primary-foreground/20 flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold font-display text-primary-foreground">TeamPulse</h1>
        <p className="text-primary-foreground/70 text-sm mt-1">Sports Team Management</p>
      </div>

      {/* Login Form */}
      <div className="bg-card rounded-t-3xl px-6 pt-8 pb-10 space-y-5">
        <h2 className="text-xl font-display font-bold text-card-foreground">
          {isSignUp ? "Create Account" : "Sign In"}
        </h2>

        {isSignUp && (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Full Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 rounded-lg bg-muted text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">I am a...</label>
              <div className="flex gap-2">
              {(["coach", "manager", "player"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-colors ${
                      role === r
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {role === "player" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Team Code</label>
                <input
                  type="text"
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A7K9Q2"
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-lg bg-muted text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground tracking-widest font-mono"
                />
              </div>
            )}
          </>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full px-4 py-3 rounded-lg bg-muted text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-lg bg-muted text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isSignUp ? "Create Account" : "Continue"}
          {!loading && <ChevronRight className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
};

export default Login;
