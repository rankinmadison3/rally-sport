import { useEffect, useState } from "react";
import { Trophy, Target, Calendar, TrendingUp, Users, MessageSquare } from "lucide-react";

type Pair = {
  id: string;
  name: string;
  vibe: string;
  headingFamily: string;
  bodyFamily: string;
  googleHref: string;
};

const PAIRS: Pair[] = [
  {
    id: "athletic",
    name: "Athletic / Sports",
    vibe: "Bold, kinetic, broadcast energy",
    headingFamily: "'Oswald', sans-serif",
    bodyFamily: "'Inter', sans-serif",
    googleHref:
      "https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&display=swap",
  },
  {
    id: "modern-tech",
    name: "Modern Tech",
    vibe: "Precise, product-forward, Swiss",
    headingFamily: "'Space Grotesk', sans-serif",
    bodyFamily: "'DM Sans', sans-serif",
    googleHref:
      "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=DM+Sans:wght@400;500;600&display=swap",
  },
  {
    id: "creative-startup",
    name: "Creative Startup",
    vibe: "Playful confidence, distinct display",
    headingFamily: "'Syne', sans-serif",
    bodyFamily: "'Plus Jakarta Sans', sans-serif",
    googleHref:
      "https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap",
  },
  {
    id: "lifestyle",
    name: "Lifestyle Brand",
    vibe: "Editorial, warm, elevated",
    headingFamily: "'Instrument Serif', serif",
    bodyFamily: "'Work Sans', sans-serif",
    googleHref:
      "https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Work+Sans:wght@400;500;600&display=swap",
  },
];

function useGoogleFonts() {
  useEffect(() => {
    const links: HTMLLinkElement[] = [];
    PAIRS.forEach((p) => {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = p.googleHref;
      document.head.appendChild(l);
      links.push(l);
    });
    return () => links.forEach((l) => l.remove());
  }, []);
}

const DashboardMock = ({ heading, body }: { heading: string; body: string }) => (
  <div
    className="rounded-xl border bg-white overflow-hidden shadow-sm"
    style={{ fontFamily: body }}
  >
    {/* Top bar */}
    <div className="flex items-center justify-between px-5 py-3 border-b bg-neutral-50">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-primary" />
        <span style={{ fontFamily: heading, fontWeight: 700, letterSpacing: "-0.01em" }} className="text-sm">
          RALLY SPORT
        </span>
      </div>
      <div className="text-xs text-neutral-500">Coach · Varsity</div>
    </div>

    <div className="p-5 space-y-5">
      <div>
        <p className="text-xs uppercase tracking-widest text-neutral-500 mb-1">Season</p>
        <h1
          style={{ fontFamily: heading, fontWeight: 700, letterSpacing: "-0.02em" }}
          className="text-3xl leading-tight"
        >
          Welcome back, Coach.
        </h1>
        <p className="text-sm text-neutral-600 mt-1">
          The Wildcats are 8–2 heading into a defining stretch of the season.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Record", value: "8–2", icon: Trophy },
          { label: "Win Rate", value: "80%", icon: TrendingUp },
          { label: "Next Game", value: "Fri 7pm", icon: Calendar },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border p-3">
            <div className="flex items-center gap-1.5 text-neutral-500 text-xs">
              <s.icon className="w-3.5 h-3.5" />
              {s.label}
            </div>
            <div
              style={{ fontFamily: heading, fontWeight: 700 }}
              className="text-xl mt-1"
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ fontFamily: heading, fontWeight: 600 }} className="text-base">
            Today's Action Steps
          </h3>
          <span className="text-xs text-neutral-500">3 of 5</span>
        </div>
        <div className="space-y-2">
          {["Film review — 20 min", "Free throw routine", "Team lift @ 4pm"].map((t) => (
            <div key={t} className="flex items-center gap-2 text-sm">
              <Target className="w-3.5 h-3.5 text-primary" />
              {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const MobileMock = ({ heading, body }: { heading: string; body: string }) => (
  <div
    className="mx-auto rounded-[2rem] border-[10px] border-neutral-900 bg-white overflow-hidden shadow-lg"
    style={{ width: 240, height: 480, fontFamily: body }}
  >
    <div className="h-6 bg-neutral-900" />
    <div className="p-4 space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-neutral-500">Tuesday</p>
        <h2
          style={{ fontFamily: heading, fontWeight: 700, letterSpacing: "-0.02em" }}
          className="text-xl leading-tight"
        >
          Let's get to work.
        </h2>
      </div>

      <div className="rounded-xl bg-primary text-primary-foreground p-3">
        <div className="text-[10px] opacity-80 uppercase tracking-wider">Next up</div>
        <div
          style={{ fontFamily: heading, fontWeight: 700 }}
          className="text-lg leading-tight"
        >
          Practice · 4:00pm
        </div>
        <div className="text-xs opacity-90">Main gym · defensive sets</div>
      </div>

      <div className="space-y-2">
        {[
          { icon: Target, label: "Action Steps", meta: "3 open" },
          { icon: Users, label: "Team", meta: "18 players" },
          { icon: MessageSquare, label: "Chat", meta: "2 new" },
        ].map((r) => (
          <div key={r.label} className="flex items-center justify-between border rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <r.icon className="w-4 h-4 text-primary" />
              <span className="text-sm">{r.label}</span>
            </div>
            <span className="text-xs text-neutral-500">{r.meta}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function FontPreview() {
  useGoogleFonts();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-neutral-100 py-10 px-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-neutral-500">Design</p>
          <h1 className="text-3xl font-semibold tracking-tight">Font Pair Preview</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Live dashboard + mobile mockup rendered in each pair. Click a card to mark your pick, then tell me which one to apply globally.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {PAIRS.map((p) => {
            const isSel = selected === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={`text-left rounded-2xl p-6 border-2 transition-all bg-white ${
                  isSel ? "border-primary shadow-lg" : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <div className="flex items-baseline justify-between mb-1">
                  <h2
                    style={{ fontFamily: p.headingFamily, fontWeight: 700, letterSpacing: "-0.02em" }}
                    className="text-2xl"
                  >
                    {p.name}
                  </h2>
                  {isSel && (
                    <span className="text-[10px] uppercase tracking-widest text-primary font-semibold">
                      Selected
                    </span>
                  )}
                </div>
                <p style={{ fontFamily: p.bodyFamily }} className="text-sm text-neutral-600 mb-1">
                  {p.vibe}
                </p>
                <p className="text-[11px] text-neutral-400 mb-5 font-mono">
                  {p.headingFamily.split(",")[0].replace(/'/g, "")} · {p.bodyFamily.split(",")[0].replace(/'/g, "")}
                </p>

                <div className="grid grid-cols-[1fr_auto] gap-5 items-start">
                  <DashboardMock heading={p.headingFamily} body={p.bodyFamily} />
                  <MobileMock heading={p.headingFamily} body={p.bodyFamily} />
                </div>
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="mt-8 p-4 rounded-xl bg-primary text-primary-foreground text-sm">
            You picked <strong>{PAIRS.find((p) => p.id === selected)?.name}</strong>. Tell me
            "apply {PAIRS.find((p) => p.id === selected)?.name}" and I'll roll it out across the app.
          </div>
        )}
      </div>
    </div>
  );
}
