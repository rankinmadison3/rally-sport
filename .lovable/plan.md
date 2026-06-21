## Goal

Currently `src/pages/Reflections.tsx` shows the same player-style form to everyone. For coaches/managers, reframe it as a **team-perspective** reflection and add a **side-by-side comparison** with what players are reporting, so they can spot gaps between their read on the team and the players' read.

## Scope

- Only edit `src/pages/Reflections.tsx`.
- No DB schema changes — reuse existing `morale_checkins`, `suggestions`, `feedback_ratings`.
- Player view stays exactly as it is today.

## Coach / Manager view

Detect role from `useAuth()`. If `coach` or `manager`, render the new view; otherwise render the current player view unchanged.

### 1. Team mood read

- Prompt re-worded: **"How do you read the team's mood today?"** (same 5 emoji scale).
- Saves to `morale_checkins` with the coach's `user_id` (their own row, just like players do today). The coach's mood entries are tagged conceptually as a "coach read" simply by virtue of the submitter's role — no schema change needed; we filter by role when comparing.
- Below the submit button, show a **"Team vs. you" strip** for the last 7 days:
  - Players' average mood (mean of `mood` from `morale_checkins` joined to `user_roles` where role = `player`) rendered as the matching emoji + numeric average.
  - Coaches' average mood (role in `coach`,`manager`) rendered next to it.
  - A small delta label: e.g. "You're reading the team 0.8 higher than players report."
  - Count of player check-ins in window so coach knows the sample size.

### 2. Coach note (replaces "Anonymous reflection")

- Heading: **"Note to yourself / staff"**.
- Same textarea, same `suggestions` insert, but anonymous toggle is hidden and `is_anonymous` is forced to `false` (coach notes are attributed). Copy: "Private staff-side reflection on how the week is going."

### 3. Category ratings — coach perspective + comparison

Same three categories players rate (`Team Communication`, `Training Intensity`, `Coach Support`) so the data is comparable. Re-label the prompt: **"Rate the team on each — then compare to what players are saying."**

For each category render:
- The 1–10 button row (unchanged) for the coach to submit their rating.
- A **comparison bar** underneath showing:
  - Players' 30-day average for that category (mean `rating` from `feedback_ratings` joined to `user_roles` where role = `player`), with N responses.
  - Coach/manager 30-day average for the same category.
  - Visual: two thin horizontal bars stacked (players in muted, coach in primary) on a 1–10 track, with the numeric averages on the right.
- A one-line summary under the bars when both sides have ≥1 entry: "Gap: +1.2 (you rate higher)" or "Gap: -0.7 (players rate higher)". Hidden when either side is empty.

Coach's own submissions go to `feedback_ratings` exactly like player submissions; anonymous toggle hidden, `is_anonymous = false`.

### 4. Layout / copy

- Header eyebrow becomes **"Coach's View"** / **"Manager's View"** (matches Feedback.tsx pattern at lines 239-241).
- Title stays "Reflections".
- Subtitle: "Your read on the team — and how it compares to what players report."
- Order on page: Team mood (with comparison strip) → Category ratings (with comparison bars) → Coach note. This puts the comparison-rich sections first.

## Data fetching

On mount, when role is coach/manager, run in parallel:
1. `morale_checkins` last 7 days for `team_id`, plus `user_roles` for those `user_id`s, to split player vs coach/manager averages.
2. `feedback_ratings` last 30 days for `team_id`, same role split, grouped by `category`.

Show a small `Loader2` while the comparison data loads; comparison sections render placeholders ("No player data yet") when empty so the page is still usable in a fresh team.

After the coach submits any of mood / ratings, re-fetch the comparison data so the bars update immediately.

## Out of scope

- No new tables, columns, or RLS changes.
- No per-player drill-down (that already lives in Feedback / future analytics).
- No changes to player Reflections, Feedback page, or Dashboard.
- No charts library — bars are simple Tailwind divs.

## Technical notes

- `morale_checkins` and `feedback_ratings` already carry `team_id` and `user_id`; role split is done client-side via a single `user_roles` lookup keyed by the returned `user_id`s.
- `suggestions.is_anonymous` defaults to `false` in the coach path; nothing else changes about that table.
- Comparison queries are scoped to the coach's `teamId` from `useAuth()` so RLS keeps everything team-bounded.
