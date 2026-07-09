# App Store Prep — Final In-App Work

I'll do everything I can from inside Lovable. A few items (Xcode signing, App Store Connect submission, buying a support domain) can only be done on your Mac after export — I'll leave you a short checklist for those.

## What I'll build

### 1. Forgot password flow
- New `/reset-password` page (enters email → `supabase.auth.resetPasswordForEmail`).
- New `/update-password` page (handles the recovery link → `supabase.auth.updateUser({ password })`).
- Wire the "Forgot password?" button on Login to `/reset-password`.

### 2. Age gate at signup (13+)
- Add a required "Date of birth" field on the signup form.
- Block signup client-side if age < 13, with a clear error message.
- Also enforce in the `signup_with_role` RPC (reject if DOB missing / under 13) as a server-side backstop.

### 3. Capacitor iOS setup (files only — you'll run `npx cap add ios` after export)
- Add `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/assets` to `package.json`.
- Create `capacitor.config.ts` with:
  - `appId: app.lovable.f2523576796643c0853666f9d43d3d2a`
  - `appName: Rally Sport`
  - Dev-only hot-reload `server.url` block, commented with instructions to remove for App Store builds.
- Add `resources/icon.png` (1024×1024) and `resources/splash.png` (2732×2732) generated with the image tool (crimson Rally Sport mark), ready for `npx capacitor-assets generate`.

### 4. iOS polish
- Add `NSPhotoLibraryUsageDescription` and `NSCameraUsageDescription` guidance to the post-export checklist (Info.plist lives in the iOS project, which doesn't exist until you run `npx cap add ios`).
- Add safe-area top inset to `DesktopHeader`/`MobileLayout` where a fixed top bar exists.

### 5. Support email
- Ask you for the real support email address (see question below) and drop it into `src/pages/Support.tsx` + Privacy policy contact line.

### 6. Metadata + favicon
- Generate a Rally Sport favicon from the existing logo, drop into `public/favicon.png`, remove `public/favicon.ico`, and update `index.html`.
- Add `apple-touch-icon` link.

### 7. Post-export checklist file
- Write `IOS_RELEASE.md` at project root with the exact commands and App Store Connect steps (Capacitor add/sync, icon generation, Xcode signing, TestFlight, privacy questionnaire answers matching what we collect).

## Out of scope (can only be done outside Lovable)
- Running `npx cap add ios`, `npx cap sync`, opening Xcode, signing, uploading to TestFlight.
- Apple Developer account, App Store Connect listing, screenshots.
- Configuring a real sender email domain to re-enable email verification (separate task if you want it).

## Question before I start
- **Support email address**: what real inbox should I put on the Support page and in the Privacy policy? (If you don't have one yet, I'll use `support@rallysport.app` as a clearly-labeled placeholder and flag it in `IOS_RELEASE.md` to change before submitting.)
