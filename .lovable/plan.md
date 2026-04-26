## Fix: App Not Loading (CSS Build Error)

### Problem
The app is stuck on a loading spinner because `src/index.css` has an invalid CSS import order. The Google Fonts `@import` is placed *after* the `@tailwind` directives, which violates the CSS spec — `@import` must come before all other statements. Vite is reporting:

```
[vite:css] @import must precede all other statements (besides @charset or empty @layer)
```

This breaks the stylesheet build and prevents the app from rendering past the initial spinner.

### Fix
**File: `src/index.css`** (lines 1–5)

Move the Google Fonts `@import` to the very top of the file, before the `@tailwind` directives:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;
```

That single reorder will resolve the build error and the app will load normally.
