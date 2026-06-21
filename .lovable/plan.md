# Surface Game Result Logging

Today, wins/losses are entered by tapping a hidden Win/Loss toggle inside a calendar event. Make that flow discoverable from the Dashboard and add a dedicated page for managing season results.

## 1. Dashboard prompt: "Log Result"

In `src/pages/Dashboard.tsx`, just under the existing season record card (visible to coach/manager only):

- Query for **past regular-season games with no `game_result`** for this team (`event_type='game'`, `is_regular_season=true`, `event_date <= today`, `game_result IS NULL`), ordered by `event_date desc`, limit 3.
- If results exist, render an **"Unlogged games"** card listing each one with date, label, and two inline buttons: **Win** (green) and **Loss** (red).
- Clicking a button updates the event's `game_result`; the existing `recalc_season_record` trigger refreshes `teams.season_wins/losses`. Refresh the dashboard query so the W-L stat and progress bar update immediately.
- A small "Manage season →" link in that card's header navigates to the new Season Record page.
- Players never see this card.

## 2. New Season Record page

New route `/season` and file `src/pages/SeasonRecord.tsx` (coach/manager only — players are redirected to `/`):

- Header: team name, big W-L record, win %, and a count of unlogged games.
- **Three lists** (collapsible sections):
  - **Needs result** — past regular-season games with `game_result IS NULL`. Each row has inline Win/Loss buttons.
  - **Regular season** — all regular-season games with a result, grouped by month, each row showing date, opponent label, W/L badge, and a small "change" menu (Win / Loss / Clear).
  - **Other games** — non-regular-season games (scrimmages, preseason, playoffs) — shown for context with a note "Not counted toward season record."
- Same DB writes as the calendar: `update calendar_events set game_result = ...`. Trigger handles the tally.
- Empty state when no games exist: "No games scheduled yet. Add games from the Team Calendar."

## 3. Navigation

- Add **Season Record** to `desktopNavItems` in `src/config/navItems.ts` (icon: `Trophy`). Add to `pageTitles` map.
- Add a `data-tour="/season"` selector and a new step in the coach + manager flows of `OrientationTutorial.tsx`: "Season Record — Log wins and losses here. Updates your team's progress bar and stats automatically."
- Skip adding to the mobile bottom nav (already full at 4 items); reachable via Dashboard link.

## 4. Out of scope

- Score entry (we only track W/L today; no `home_score`/`away_score` columns).
- Per-player game stats.
- Auto-prompting players for post-game reflections (separate feature).
- Editing events themselves from this page — that still happens in Team Calendar.

## Files touched

- `src/pages/Dashboard.tsx` — add unlogged-games card with inline W/L buttons.
- `src/pages/SeasonRecord.tsx` — new page.
- `src/App.tsx` — register `/season` route under `ProtectedRoute`.
- `src/config/navItems.ts` — add Season Record entry + page title.
- `src/components/OrientationTutorial.tsx` — add Season Record step for coach + manager.

No DB changes required — schema and trigger already support this.
