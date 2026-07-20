## Plan: App-wide red-and-white aura background

### Goal
Introduce a full-bleed, gently pulsing red-and-white aura behind every page while keeping text and cards fully readable and preserving the existing crimson/white design language.

### What will change
1. **Global background layer**  
   Add a fixed `div` inside `src/components/AppLayout.tsx` that sits behind the sidebar and main content. It will render layered, oversized radial gradients in `hsl(var(--primary))` and white, softly bleeding into the off-white page background.

2. **Pulse animation**  
   Add a new keyframe to `tailwind.config.ts` and `src/index.css` that slowly scales and shifts opacity of the aura blobs (≈8–12s loop, ease-in-out, infinite). The motion will be subtle enough not to distract coaches/players using the app daily.

3. **Readability safeguards**  
   - Keep cards and sidebars on solid `bg-card` / `bg-sidebar-background` surfaces so content stays crisp.  
   - Use low-opacity primary tints (`hsl(var(--primary) / 0.08)` to `0.18`) so the aura is atmospheric, not dominant.  
   - Ensure `pointer-events-none` and `fixed inset-0` so it never blocks interaction.

4. **Dark-mode behavior**  
   The aura will auto-adapt because it consumes `hsl(var(--primary) / …)` and `hsl(var(--background))`. In dark mode the background is near-black, so the same low-opacity red blobs will read as a faint crimson glow rather than a white wash.

5. **Mobile / iOS safe-area handling**  
   The background layer will span the full viewport including safe-area insets (`min-h-[100dvh]`, `w-screen`, `left-0`, `top-0`) so the aura fills the screen on iPhones without clipping behind the notch or home indicator.

6. **Performance**  
   Use CSS-only animation (transform + opacity) with `will-change-transform` on the pseudo/layer elements. No JS animation loop, no canvas, no heavy blur filters beyond one static `blur-3xl`.

### Files to edit
- `src/components/AppLayout.tsx` — insert fixed aura layer behind routed content.
- `src/index.css` — add `.aura-bg` utility and pulse keyframe tokens.
- `tailwind.config.ts` — register the new `aura-pulse` animation class.

### Not in scope
- No changes to individual page content, cards, or typography.
- No login-only or hero-only variant; this is the global app shell.
- No user toggle to disable the aura in this pass.

### Verification
- Build/typecheck passes.
- Visual check in preview: aura visible behind Dashboard, Tasks, Calendar, Profile, and Chat; content remains readable; animation loops smoothly without jank.