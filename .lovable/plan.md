

## Add Team Code Display and Team Management for Coaches

### Problem
When a coach signs up, a team is automatically created with a 6-character invite code, but there's no way for the coach to **see** that code or share it with players. Players need this code to join the team during signup.

### What will be added

**1. Team Code Card on Coach Dashboard**
- A new card visible only to coaches, displayed prominently near the top of the Dashboard
- Shows the team name and the 6-character invite code in large, copyable text
- Includes a "Copy" button so coaches can easily share the code with players
- Shows the number of players currently on the team

**2. Team Members List**
- Below the team code, show a list of players who have joined using the code
- Each entry shows the player's display name and when they joined

### Technical Details

**File changes:**

- `src/pages/Dashboard.tsx` -- Add a "Your Team" card (coach-only) that:
  - Fetches the team's `code` and `name` from the `teams` table using the existing `teamId`
  - Fetches team members from `team_members` joined with `profiles` for display names
  - Renders the code in a large monospace font with a copy-to-clipboard button
  - Shows member count and member names
  - Only renders when `role === "coach"`

No database changes needed -- the `teams.code` column and all required RLS policies already exist.

