import { Mail, LifeBuoy, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

const SUPPORT_EMAIL = "support@rallysport.app";

const Support = () => (
  <div className="max-w-2xl mx-auto p-6 pb-24 space-y-6 text-foreground">
    <div>
      <h1 className="text-3xl font-bold font-display">Support</h1>
      <p className="text-muted-foreground text-sm mt-1">
        We're here to help. Most questions get a response within one business day.
      </p>
    </div>

    <a
      href={`mailto:${SUPPORT_EMAIL}`}
      className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary transition-colors"
    >
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        <Mail className="w-5 h-5" />
      </div>
      <div>
        <p className="font-semibold text-sm">Email support</p>
        <p className="text-xs text-muted-foreground">{SUPPORT_EMAIL}</p>
      </div>
    </a>

    <div className="p-4 rounded-xl bg-card border border-border space-y-2">
      <div className="flex items-center gap-2">
        <LifeBuoy className="w-4 h-4 text-primary" />
        <p className="font-semibold text-sm">Common questions</p>
      </div>
      <ul className="text-sm text-muted-foreground list-disc pl-6 space-y-1">
        <li>Forgot your team code? Ask your coach — they can find it on their dashboard.</li>
        <li>Can't sign in? Try resetting your password from the login screen.</li>
        <li>Want to leave a team? Email us and we'll remove you.</li>
      </ul>
    </div>

    <Link
      to="/delete-account"
      className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-destructive transition-colors"
    >
      <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
        <Trash2 className="w-5 h-5" />
      </div>
      <div>
        <p className="font-semibold text-sm">Delete your account</p>
        <p className="text-xs text-muted-foreground">Permanently remove your Rally Sport account and personal data.</p>
      </div>
    </Link>

    <div className="text-xs text-muted-foreground pt-4">
      See also our <Link to="/privacy" className="text-primary underline">Privacy Policy</Link> and{" "}
      <Link to="/terms" className="text-primary underline">Terms of Use</Link>.
    </div>
  </div>
);

export default Support;
