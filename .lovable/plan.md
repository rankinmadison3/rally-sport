## Cause

`action_steps` RLS only lets **coaches** insert rows:

```
Coaches can manage all steps   ALL     has_role(auth.uid(), 'coach')
Players can update own steps   UPDATE  auth.uid() = user_id
Players can view own steps     SELECT  auth.uid() = user_id
```

The `/__demo-seed` page tries to insert tasks for whatever user is signed in. When that user is the **manager** (or player) demo account, no INSERT policy applies → `new row violates row-level security policy for table "action_steps"`.

The other four demo inserts (calendar_events, suggestions, feedback_ratings, morale_checkins) succeed because their policies allow the current user.

## Fix

Make the demo seeder work for any staff role, without weakening real RLS.

### 1. Migration — extend `action_steps` policies

Add a manager-equivalent of the coach policy, plus let players insert their own self-assigned steps (matches how the rest of the app treats player ownership of their own rows). Keep the existing coach policy.

```sql
CREATE POLICY "Managers can manage all steps"
  ON public.action_steps
  FOR ALL
  USING (public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Players can insert own steps"
  ON public.action_steps
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

No data changes; existing rows and policies are untouched.

### 2. Small hardening in `src/pages/Demo.tsx`

- Detect and surface the underlying error message (currently only the first failure is shown — the others get swallowed). Change the post-insert aggregation to:
  - count successes vs. failures across all five inserts,
  - show a list of which sections failed (e.g. "Tasks failed: …, Calendar succeeded") so future RLS issues are obvious instead of looking like a single generic error.
- Gate the seed/clear buttons on `role` being `coach` or `manager`; if a player lands on the hidden URL, show an info card explaining they need to be staff. (Player-targeted demo data isn't meaningful from a player session anyway.)

### Out of scope

- No changes to the other tables' RLS.
- No UI redesign of the demo page beyond the role gate and clearer error reporting.
- No change to who can normally create tasks in the app (coaches still own that; managers gaining task-management access matches the existing pattern where managers mirror coach abilities for team-ops tables).
