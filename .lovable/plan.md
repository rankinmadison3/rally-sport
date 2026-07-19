# Deepen the design across Tasks, Calendar, Reflections, Profile, Chat

Bring the other core pages up to the Dashboard's fidelity level. Same visual DNA — crimson gradient hero card, layered SVG data viz, tile grids on a soft off-white surface — but each page gets its own motif so it doesn't feel copy-pasted.

## Shared design language (reused across all five pages)

- **Hero card:** rounded-3xl, `linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.82) 100%)`, subtle inner grid or radial glow overlay, primary-foreground text, uppercase tracked eyebrow + display headline + 1–2 line context strip.
- **Stat tiles:** white cards with `shadow-[var(--card-shadow)]`, small icon in tinted circle, big display number, muted label. Grid of 2–4.
- **Section headers:** `text-sm uppercase tracking-wider text-muted-foreground`, matching Dashboard.
- **SVG viz:** thin `stroke-primary-foreground/50` gridlines, filled area with `primary-foreground/20`, animated `pathLength` intro (framer-motion, one shot).
- No new color tokens — everything comes from existing semantic HSL vars.

## Per-page motifs

### 1. Tasks — "Progress board"
- Hero: gradient card with a **completion ring** (SVG donut, same technique as Dashboard's season ring) showing % of open tasks completed, plus counters for Open / Done / Overdue.
- Under the hero: 4 category tiles (Technical / Mental / Physical / Teamwork) with count + tiny bar of open vs done, each tinted with the existing CATEGORY_STYLES accent.
- Existing task list and dialog untouched functionally — just wrapped in the new frame with softer section headers and hover lift.

### 2. Team Calendar — "Season strip"
- Hero: gradient card headlining the **next upcoming event** (icon + date + label + countdown "in 3 days"), with a horizontal 14-day strip of dots along the bottom showing event density (game = red dot, practice = white dot, task = ring).
- Legend and month calendar move into a `card` container with the same shadow. Icons in cells stay as-is (bigger sizing you already have).
- Selected-day panel becomes a proper card with a colored top border matching the day's dominant event type.

### 3. Reflections — "Mood pulse"
- Hero: gradient card with a **7-day mood curve** SVG (area under curve, same viz style as Dashboard's morale hero) and three inline stats: Avg mood, Streak, Response rate.
- Coach/manager view: keeps trend charts, but wrapped in the new hero + comparison tiles (Coach vs Player) sitting in a 2-col bento.
- Player view: today's check-in card gets the elevated white-card treatment with a big emoji scale row.

### 4. Profile — "Identity banner"
- Hero: crimson gradient banner with the avatar overlapping the bottom edge (large, ring-4 ring-background), display name, role badge, and a subtle inline **team code chip** with copy button.
- Below: tabbed sections (Personal / Physical / Emergency) rendered as bento tiles with the shared card treatment. Edit affordances stay pencil-icon based.

### 5. Chat — "Signal room"
- List column header becomes a compact gradient strip with unread total pulse dot.
- Conversation rows: elevated cards with avatar, name, last-message preview, timestamp, and an unread badge tinted primary.
- Thread pane: sticky gradient header with the counterpart's name + status, message bubbles gain more air (larger radius, tighter typography scale).

## Technical notes

- All changes are presentation-only. No schema/RLS/service-layer edits.
- Files touched: `src/pages/Tasks.tsx`, `src/pages/TeamCalendar.tsx`, `src/pages/Reflections.tsx`, `src/pages/Profile.tsx`, `src/pages/Chat.tsx`.
- May extract a `HeroCard` + `StatTile` primitive into `src/components/ui/hero-card.tsx` if reused ≥3 times — otherwise inline for simplicity.
- Framer-motion is already a dep; use it for the single hero intro animation per page (fade + slide-up, ~400ms).
- Preserve all `data-tour` attributes so the orientation tutorial still anchors correctly.
- Mobile-first: hero card scales down cleanly, stat tiles reflow to 2-col on `<sm`.

## Rollout

Ship all five in one pass, in the order listed above (Tasks → Calendar → Reflections → Profile → Chat).
