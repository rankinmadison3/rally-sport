## Goal
On the Dashboard, move the **Your Team** card (team code + roster) to the very bottom, and promote **Season Progress** into a bigger, more visual hero at the top.

## Order change (`src/pages/Dashboard.tsx`)

Current: Header → Your Team → Tasks → Log Result → Season Progress → Team Morale → Active Feedback

New: Header → **Season Progress (visual hero)** → Tasks → Log Result → Team Morale → Active Feedback → **Your Team (bottom)**

No data-fetching, permissions, or state logic change — only presentation reorder + the Season card redesign.

## Season Progress redesign (top of page)

Keep it click-through to `/season` for coach/manager. Turn the current thin bar into a scoreboard-style hero card:

- Crimson gradient surface using existing tokens (`bg-primary` → `hsl(var(--primary)/0.85)`), rounded-2xl, larger shadow.
- Left side: giant `W–L` scoreline in Space Grotesk display weight, plus small "SEASON" eyebrow.
- Right side: a circular progress ring showing win % (SVG stroke-dasharray) with the percentage centered inside.
- Beneath the score: a **segmented bar** split into `total` cells — win cells filled solid, loss cells outlined — giving a visual, game-by-game read of the season instead of a single averaged bar. Falls back to a slim "No games logged yet" state when `total === 0`.
- Small footer row: `{total} games played · {winPct}% win rate · Next game …` (only include "Next game" line if we can pull it cheaply from `calendar_events` — otherwise omit; deciding while implementing based on cost).

Empty state (0 games): keep the hero, show a muted "Log your first result" CTA that routes to `/season` for staff, or plain copy for players.

## Your Team card (bottom)

Same component, just repositioned as the last block on the page. Still collapsible, still coach/manager only. No behavior change.

## Out of scope
- Not touching Tasks card, Log Result card, Morale graph, or Active Feedback list.
- Not changing routes, RLS, or data models.
- Not redesigning the Season Record page itself.
