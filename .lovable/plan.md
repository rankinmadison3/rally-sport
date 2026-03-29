

## Make Dashboard Feedback Forms Clickable

### What
The "Active Feedback Forms" section on the Dashboard currently shows cards with response counts, but they aren't interactive. We'll make each card clickable so it navigates to the feedback form page.

### How

**File: `src/pages/Dashboard.tsx`**
- Import `useNavigate` from `react-router-dom`
- Wrap each feedback form card in a clickable element that navigates to `/feedback-form?form=<form-name>` (or `/feedback` depending on the role)
- For **players**: navigate to `/feedback-form` to fill out the form
- For **coaches/managers**: navigate to `/feedback` to view responses
- Add a subtle hover state and cursor pointer for affordance

### Technical Details
- Add `useNavigate()` hook
- On card click: `navigate("/feedback-form")` for players, `navigate("/feedback")` for coaches/managers
- Add `cursor-pointer hover:bg-accent/50 transition-colors` to the card className

