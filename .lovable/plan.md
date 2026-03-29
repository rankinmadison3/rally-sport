

## Fix: Dashboard Role Label Flickering

### Problem
The "Coach's View" / "Player's View" label in the top-left corner flickers between states on page load. This happens because both `getSession()` and `onAuthStateChange` fire on mount, each triggering `fetchRoleAndTeam` independently. The role state gets set, potentially cleared, then set again — causing the visible switch.

### Root Cause
In `src/contexts/AuthContext.tsx`:
1. `onAuthStateChange` fires and calls `fetchRoleAndTeam` via `setTimeout(..., 0)`
2. `getSession()` also fires and calls `fetchRoleAndTeam` directly
3. Both race against each other, and between calls `role` may briefly be `null` (its initial state), causing the label to flash "Player's View" (the fallback) before settling on the correct role

### Fix — `src/contexts/AuthContext.tsx`
- Set up `onAuthStateChange` listener first, but **don't** also call `getSession` + `fetchRoleAndTeam` separately. The `onAuthStateChange` callback fires with the initial session on setup, so the duplicate `getSession` call is redundant and causes the race.
- Alternatively, use a flag to skip the `onAuthStateChange` callback if `getSession` already handled initialization, and ensure `role` is not rendered until `fetchRoleAndTeam` completes (keep `loading = true` until role is fetched).

**Chosen approach**: Remove the duplicate `getSession` block. Let `onAuthStateChange` handle initial session detection (it fires `INITIAL_SESSION` on mount). Remove the `setTimeout` wrapper so `fetchRoleAndTeam` is awaited properly before `setLoading(false)`.

### Changes
**File: `src/contexts/AuthContext.tsx`** (lines 67-89)
- In `onAuthStateChange`: `await fetchRoleAndTeam(...)` directly instead of wrapping in `setTimeout`, then set `loading = false` after
- Remove the separate `supabase.auth.getSession().then(...)` block entirely — `onAuthStateChange` already provides the initial session

This eliminates the race condition and the role label will only render once the role is known.

