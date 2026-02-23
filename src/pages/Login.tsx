import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, ChevronRight } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");

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
        <h2 className="text-xl font-display font-bold text-card-foreground">Sign In</h2>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
            className="w-full px-4 py-3 rounded-lg bg-muted text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Date of Birth</label>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-muted text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-[10px] text-muted-foreground">Must be 13+ to create an account</p>
        </div>

        <button
          onClick={() => navigate("/")}
          className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          Continue
          <ChevronRight className="w-4 h-4" />
        </button>

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
};

export default Login;
