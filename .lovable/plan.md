## Goal
Refresh `src/pages/Login.tsx` to the selected "High-performance minimal" direction. Visual-only refactor; all auth behavior, signup fields (name, role pills, team code), forgot-password link, and mode switcher stay intact.

## Changes (src/pages/Login.tsx)

**Layout**
- Replace the current split-screen with a `flex` 2-column shell: left brand panel (`hidden lg:flex w-1/2`, crimson bg), right form panel (`w-full lg:w-1/2`, white bg, centered).
- Mobile: hide left panel entirely. Show a compact crimson header bar at the top with logo + "Sports Team Management" tagline, then the form on white background.

**Left brand panel (desktop)**
- Crimson background with subtle radial-dot texture overlay (8% opacity, 24px grid).
- Top: Rally Sport logo + uppercase wordmark + small tagline.
- Middle: uppercase Space Grotesk H1 — "One platform for every team, every role, every game." (tracking-tighter, max-w).
- Three feature cards (Users/Trophy/Activity) in vertical stack — translucent `bg-white/10 border-white/10 backdrop-blur-md rounded-xl`, icon square + title + sub-label.
- Bottom: small uppercase tracking-widest copyright "© Rally Sport Systems".

**Right form panel**
- Max-width 440px, left-aligned on desktop, centered on mobile.
- Heading: Space Grotesk bold "Welcome back" / "Create account" + muted subhead.
- Inputs: `bg-slate-50` style mapped to design tokens (`bg-muted`), border, rounded-lg, `focus:ring-2 focus:ring-primary` — keep current inputClass but switch to ring-primary and add taller py-3.5.
- Labels: uppercase, bold, tracking-widest, muted (matches current `labelClass`).
- Keep signup-only fields: Full Name, Role pills, Team Code.
- Sign-in: keep Forgot password? link, right-aligned, primary-colored.
- Submit button: crimson, full width, py-4, bold, with arrow icon that translates on hover; loading spinner preserved.
- Bottom: "Don't have an account? Sign up" / vice versa, separated by top border with `mt-10 pt-8`.

**Tokens & memory**
- Use semantic tokens (`hsl(var(--primary))`, `bg-card`, `text-muted-foreground`, etc.) — no hardcoded `#D1113E`.
- Keep Space Grotesk + Inter (matches project Visual Identity memory). Remove the unused Barlow Condensed / DM Sans `<style>` import.

**Out of scope**
- No changes to AuthContext, signUp/signIn logic, routes, or DB.
- No new functionality (forgot-password modal, OAuth buttons, etc.).
