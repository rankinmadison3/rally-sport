import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("If an account exists, a reset link is on its way.");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>
        <div>
          <h1 className="text-3xl font-bold font-display">Reset password</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your email and we'll send you a link to set a new password.
          </p>
        </div>

        {sent ? (
          <div className="p-4 rounded-xl bg-card border border-border text-sm">
            Check your inbox for the reset link. It may take a minute to arrive.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                className="w-full px-4 py-3.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-lg font-bold text-sm text-primary-foreground bg-primary shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Send reset link
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
