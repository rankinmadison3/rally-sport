## Add Rally Sport Logo to Top Header

### What
Add the uploaded Rally Sport logo as a top header bar shown above the content on every in-app page (medium size, ~56px tall). The Login page is excluded so it stays focused on auth.

### How

**1. Save the logo asset**
- Copy `user-uploads://Screenshot_2026-04-26_at_7.18.12_PM.png` to `src/assets/rally-sport-logo.png` so it can be imported as an ES6 module and bundled by Vite.

**2. Update `src/components/MobileLayout.tsx`**
- Import the logo: `import logo from "@/assets/rally-sport-logo.png";`
- Add a sticky top header inside the layout (above the scrollable content area), shown on every route except `/login`:
  - White/card background, bottom border, centered logo at `h-14` (~56px tall), `w-auto`, `object-contain`.
  - Header is `sticky top-0 z-40` so it stays visible while scrolling.
- Adjust the inner scroll container so the header doesn't get covered (it already has `pb-20` for the bottom nav; the sticky header handles its own space).

### Technical Details
- File touched: `src/components/MobileLayout.tsx` (one new `<header>` element + import).
- New asset: `src/assets/rally-sport-logo.png`.
- No changes needed to individual pages — the layout wraps all routes already.
- The existing Dashboard header (role label + Sign Out) stays as-is and will sit just below the new logo bar.

### Out of Scope
- Restyling the bottom tab bar.
- Adding the logo to the Login screen (per your selection).
- Cropping/recoloring the logo — used as provided.
