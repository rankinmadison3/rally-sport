import { useEffect, useState } from "react";
import {
  LayoutDashboard, MessageCircle, Calendar, MessageSquare,
  ClipboardCheck, Sparkles, User as UserIcon, Users, Trophy,
  ChevronLeft, ChevronRight, X, Check, LucideIcon,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

type AppRole = "coach" | "player" | "manager";

interface Step {
  icon: LucideIcon;
  title: string;
  body: string;
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

const SHARED_STEPS: Step[] = [
  { icon: LayoutDashboard, title: "Dashboard", body: "Your home base. See today's events, latest team activity, and quick links to everything you use most." },
  { icon: Calendar, title: "Team Calendar", body: "Games, practices, and team events in one timeline. Tap any event for details, location, and game results." },
  { icon: MessageSquare, title: "Chat", body: "Real-time team messaging. Use direct messages with teammates or group channels for the whole team, with pinned announcements at the top." },
  { icon: UserIcon, title: "Profile", body: "Manage your photo, contact info, and personal details. You can replay this tutorial anytime from here." },
];

const ROLE_STEPS: Record<AppRole, Step[]> = {
  coach: [
    { icon: ClipboardCheck, title: "Tasks & Action Steps", body: "Assign technical, mental, physical, and teamwork drills to individual players or the whole roster. Track who's done what." },
    { icon: MessageCircle, title: "Feedback", body: "Build surveys, mood check-ins, and rating forms. Anonymous suggestions help you hear what players really think." },
    { icon: Sparkles, title: "Reflections", body: "Read player reflections after games and practices to spot trends, fatigue, or breakthroughs early." },
    { icon: Users, title: "Roster & Team Code", body: "Share your 6-character team code from Profile so players and managers can join your team." },
  ],
  player: [
    { icon: ClipboardCheck, title: "Your Tasks", body: "See action steps your coach has assigned across Technical, Mental, Physical, and Teamwork. Mark them done as you go." },
    { icon: MessageCircle, title: "Feedback", body: "Fill out quick mood and rating surveys, or send anonymous suggestions to your coach." },
    { icon: Sparkles, title: "Reflections", body: "A private space for personal check-ins. Notice patterns in your performance and mindset over time." },
    { icon: Trophy, title: "Your Player Profile", body: "Add your jersey number, position, height, weight, and emergency contact so your coach has what they need." },
  ],
  manager: [
    { icon: ClipboardCheck, title: "Tasks", body: "Monitor assigned action steps across the roster and help keep players accountable." },
    { icon: MessageCircle, title: "Feedback", body: "Review team feedback trends and survey results to help the coach make decisions." },
    { icon: Sparkles, title: "Reflections", body: "See aggregate signals from player reflections to support team well-being and morale." },
    { icon: Users, title: "Team Coordination", body: "Use chat and calendar to coordinate logistics, share updates, and keep the team aligned." },
  ],
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

const OrientationTutorial = ({ open, onOpenChange }: Props) => {
  const { user, role } = useAuth();
  const [index, setIndex] = useState(0);

  const activeRole: AppRole = (role ?? "player") as AppRole;
  const welcome = WELCOME[activeRole];
  const steps: Step[] = [
    { icon: Trophy, title: welcome.title, body: welcome.body },
    ...SHARED_STEPS,
    ...ROLE_STEPS[activeRole],
    { icon: Check, title: "You're all set", body: "That's the tour. You can replay it anytime from your Profile page. Now go run your team." },
  ];

  useEffect(() => { if (open) setIndex(0); }, [open]);

  const close = () => {
    if (user) markOrientationSeen(user.id);
    onOpenChange(false);
  };

  const step = steps[index];
  const Icon = step.icon;
  const isLast = index === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); else onOpenChange(true); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0 bg-card border-border">
        <button
          onClick={close}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors"
          aria-label="Close tutorial"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="bg-primary text-primary-foreground px-6 pt-8 pb-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-foreground/15 backdrop-blur flex items-center justify-center mb-3">
            <Icon className="w-8 h-8" />
          </div>
          <p className="text-[11px] uppercase tracking-widest opacity-80 font-semibold">
            Step {index + 1} of {steps.length}
          </p>
          <h2 className="text-2xl font-bold font-display mt-1">{step.title}</h2>
        </div>

        <div className="px-6 py-6 space-y-5">
          <p className="text-sm text-card-foreground leading-relaxed text-center">
            {step.body}
          </p>

          <div className="flex justify-center gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Go to step ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-primary" : "w-1.5 bg-muted hover:bg-muted-foreground/40"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
            {!isLast ? (
              <>
                <button onClick={close} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Skip tour
                </button>
                <Button size="sm" onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))} className="gap-1">
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={close} className="gap-1">
                <Check className="w-4 h-4" /> Get started
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrientationTutorial;
