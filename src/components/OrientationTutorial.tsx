import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Trophy,
  User as UserIcon,
  Users as UsersIcon,
  X,
  Check,
  LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { desktopNavItems, NavItem } from "@/config/navItems";

type AppRole = "coach" | "player" | "manager";

interface Step {
  icon: LucideIcon;
  title: string;
  body: string;
  /** CSS selector for the element to spotlight. Omit for centered intro/outro. */
  target?: string;
  /** Route to navigate to before spotlighting this element. */
  route?: string;
}

const WELCOME: Record<AppRole, { title: string; body: string }> = {
  coach: {
    title: "Welcome, Coach",
    body: "Rally Sport is your command center. Build the roster, set the schedule, assign work, and keep a pulse on how your athletes feel — all in one place.",
  },
  player: {
    title: "Welcome to the team",
    body: "Rally Sport keeps you in sync with your coach and teammates. Check what's next, complete your action steps, and share how you're doing.",
  },
  manager: {
    title: "Welcome, Manager",
    body: "Rally Sport gives you the visibility you need to run the team day-to-day — schedules, comms, and progress tracking, all in one place.",
  },
};

const DESCRIPTIONS: Record<string, string> = {
  "/": "Your home base. See today's events, latest team activity, and quick links to everything you use most.",
  "/feedback": "Create mood check-ins, rating surveys, and anonymous suggestion boxes to hear from your team.",
  "/inbox": "Coach and manager-only space to read, review, and resolve player feedback and suggestions.",
  "/tasks": "Assign action steps, track progress, and keep the roster accountable across Technical, Mental, Physical, and Teamwork categories.",
  "/calendar": "Games, practices, and team events in one timeline. Tap any event for details, location, and results.",
  "/season": "Log wins and losses here. Your team's progress bar and stats update automatically.",
  "/chat": "Real-time team messaging. Direct messages with teammates or group channels for the whole team.",
  "/reflections": "Personal check-ins and notes. Staff can see aggregate trends; players keep a private journal.",
  "/profile": "Manage your photo, contact info, team code, and replay this tutorial anytime from here.",
};

const storageKey = (userId: string) => `rally.orientation.completed.${userId}`;

export const hasSeenOrientation = (userId: string) => {
  try { return localStorage.getItem(storageKey(userId)) === "1"; } catch { return false; }
};

export const markOrientationSeen = (userId: string) => {
  try { localStorage.setItem(storageKey(userId), "1"); } catch { /* noop */ }
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Rect { top: number; left: number; width: number; height: number; }

const PADDING = 8;
const TOOLTIP_W = 340;
const TOOLTIP_GAP = 16;

const OrientationTutorial = ({ open, onOpenChange }: Props) => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const activeRole: AppRole = (role ?? "player") as AppRole;
  const welcome = WELCOME[activeRole];
  const isStaff = role === "coach" || role === "manager";

  const steps: Step[] = useMemo(() => {
    const navSteps: Step[] = desktopNavItems
      .filter((item) => !item.staffOnly || isStaff)
      .map((item: NavItem) => ({
        icon: item.icon,
        title: item.label,
        body: DESCRIPTIONS[item.path] ?? `Navigate to ${item.label}.`,
        target: `[data-tour="${item.path}"]`,
      }));

    // Spotlight the team code row inside the Profile page.
    navSteps.push({
      icon: UsersIcon,
      title: isStaff ? "Roster & Team Code" : "Profile",
      body: isStaff
        ? "Share your 6-character team code from Profile so players and managers can join your team."
        : DESCRIPTIONS["/profile"],
      target: `[data-tour="profile-team-code"]`,
      route: "/profile",
    });

    return [
      { icon: Trophy, title: welcome.title, body: welcome.body },
      ...navSteps,
      { icon: Check, title: "You're all set", body: "That's the tour. You can replay it anytime from your Profile page. Now go run your team." },
    ];
  }, [activeRole, isStaff, welcome.body, welcome.title]);

  useEffect(() => { if (open) setIndex(0); }, [open]);

  const step = steps[index];

  // Navigate to the step's route before spotlighting, if needed.
  useEffect(() => {
    if (!open || !step.route) return;
    if (location.pathname !== step.route) {
      navigate(step.route, { replace: true });
    }
  }, [open, step.route, location.pathname, navigate]);

  // Track the target element's rect (and re-measure on resize/scroll/route change)
  useLayoutEffect(() => {
    if (!open || !step.target) { setRect(null); return; }
    let raf = 0;
    let interval = 0;
    let timeout = 0;
    const measure = () => {
      const el = document.querySelector(step.target!) as HTMLElement | null;
      if (!el) { setRect(null); return; }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    const scrollAndMeasure = () => {
      const el = document.querySelector(step.target!) as HTMLElement | null;
      if (el) {
        try {
          el.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
        } catch {
          el.scrollIntoView();
        }
      }
      measure();
    };
    // Wait one frame for render, then retry so navigation/content has time to complete.
    raf = requestAnimationFrame(() => {
      scrollAndMeasure();
      setTimeout(scrollAndMeasure, 180);
      setTimeout(scrollAndMeasure, 450);
      // Keep polling for up to 3s in case data (e.g. team code) is still loading.
      interval = window.setInterval(measure, 150);
      timeout = window.setTimeout(() => window.clearInterval(interval), 3000);
    });
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(interval);
      window.clearTimeout(timeout);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, index, step.target, location.pathname]);

  if (!open) return null;

  const close = () => {
    if (user) markOrientationSeen(user.id);
    onOpenChange(false);
  };

  const Icon = step.icon;
  const isLast = index === steps.length - 1;
  const isFirst = index === 0;

  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const vh = typeof window !== "undefined" ? window.innerHeight : 768;

  let tooltipStyle: React.CSSProperties;
  let centered = false;

  if (rect) {
    const tooltipW = Math.min(TOOLTIP_W, vw - 32);
    const tooltipH = 260;
    const spaceRight = vw - (rect.left + rect.width);
    const placeRight = spaceRight >= tooltipW + TOOLTIP_GAP + 16 && vw >= 768;

    if (placeRight) {
      tooltipStyle = {
        position: "fixed",
        top: Math.max(16, Math.min(vh - tooltipH - 16, rect.top + rect.height / 2 - tooltipH / 2)),
        left: rect.left + rect.width + TOOLTIP_GAP,
        width: tooltipW,
      };
    } else {
      const spaceBelow = vh - (rect.top + rect.height);
      const placeBelow = spaceBelow >= tooltipH + TOOLTIP_GAP + 16;
      const top = placeBelow
        ? rect.top + rect.height + TOOLTIP_GAP
        : Math.max(16, rect.top - tooltipH - TOOLTIP_GAP);
      const left = Math.max(16, Math.min(vw - tooltipW - 16, rect.left + rect.width / 2 - tooltipW / 2));
      tooltipStyle = { position: "fixed", top, left, width: tooltipW };
    }
  } else {
    centered = true;
    tooltipStyle = {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: Math.min(TOOLTIP_W + 40, vw - 32),
    };
  }

  const dim = "rgba(15, 23, 42, 0.62)";

  return (
    <div className="fixed inset-0 z-[100]" aria-modal="true" role="dialog">
      {rect ? (
        <>
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: Math.max(0, rect.top - PADDING), background: dim }} onClick={close} />
          <div style={{ position: "fixed", top: rect.top + rect.height + PADDING, left: 0, right: 0, bottom: 0, background: dim }} onClick={close} />
          <div style={{ position: "fixed", top: Math.max(0, rect.top - PADDING), left: 0, width: Math.max(0, rect.left - PADDING), height: rect.height + PADDING * 2, background: dim }} onClick={close} />
          <div style={{ position: "fixed", top: Math.max(0, rect.top - PADDING), left: rect.left + rect.width + PADDING, right: 0, height: rect.height + PADDING * 2, background: dim }} onClick={close} />
          <div
            style={{
              position: "fixed",
              top: rect.top - PADDING,
              left: rect.left - PADDING,
              width: rect.width + PADDING * 2,
              height: rect.height + PADDING * 2,
              border: "2px solid hsl(var(--primary))",
              borderRadius: 14,
              boxShadow: "0 0 0 4px hsl(var(--primary) / 0.25), 0 12px 32px -8px rgba(0,0,0,0.35)",
              pointerEvents: "none",
              transition: "all 220ms cubic-bezier(0.2, 0.8, 0.2, 1)",
            }}
          />
        </>
      ) : (
        <div className="fixed inset-0" style={{ background: dim }} onClick={close} />
      )}

      <div
        style={tooltipStyle}
        className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <button
          onClick={close}
          className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors"
          aria-label="Close tutorial"
        >
          <X className="w-4 h-4" />
        </button>

        {centered ? (
          <div className="bg-primary text-primary-foreground px-6 pt-7 pb-8 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary-foreground/15 backdrop-blur flex items-center justify-center mb-2.5">
              <Icon className="w-7 h-7" />
            </div>
            <p className="text-[10px] uppercase tracking-widest opacity-80 font-semibold">
              Step {index + 1} of {steps.length}
            </p>
            <h2 className="text-xl font-bold font-display mt-1">{step.title}</h2>
          </div>
        ) : (
          <div className="px-5 pt-5 pb-3 flex items-start gap-3 border-b border-border">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 pr-6">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Step {index + 1} of {steps.length}
              </p>
              <h2 className="text-base font-bold font-display text-card-foreground leading-tight mt-0.5">
                {step.title}
              </h2>
            </div>
          </div>
        )}

        <div className="px-5 py-4 space-y-4">
          <p className={`text-sm text-card-foreground leading-relaxed ${centered ? "text-center" : ""}`}>
            {step.body}
          </p>

          <div className="flex justify-center gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Go to step ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-5 bg-primary" : "w-1.5 bg-muted hover:bg-muted-foreground/40"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={isFirst}
              className="gap-1 h-8"
            >
              Back
            </Button>
            {!isLast ? (
              <>
                <button onClick={close} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Skip tour
                </button>
                <Button size="sm" onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))} className="gap-1 h-8">
                  Next
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={close} className="gap-1 h-8">
                <Check className="w-4 h-4" /> Get started
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrientationTutorial;
