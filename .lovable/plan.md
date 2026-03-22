

## Add Minimize/Collapse Toggle to Team Code Card

### What
Add a toggle button to the coach's "Your Team" card on the Dashboard so coaches can collapse/expand the team code section to save space.

### How
- **File**: `src/pages/Dashboard.tsx`
- Add a `collapsed` state (boolean, default `false`)
- Add a chevron toggle button (ChevronDown/ChevronUp from lucide-react) in the card header next to "Your Team"
- When collapsed, hide everything below the header row (team name, code, members list) — only show the header with team name summary and player count
- When expanded, show the full card as it currently is

