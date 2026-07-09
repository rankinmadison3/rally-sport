# iOS Release Guide — Rally Sport

Everything the Lovable agent could ship inside the repo is already done.
This file covers the steps that must run on your Mac.

## 1. Export & install

```bash
# On your Mac, after "Export to GitHub" and cloning:
npm install
npm install --save @capacitor/core @capacitor/ios
npm install --save-dev @capacitor/cli @capacitor/assets
```

## 2. Generate iOS icons + splash

`resources/icon.png` (1024×1024) and `resources/splash.png` are already in the repo.

```bash
npx capacitor-assets generate --ios
```

## 3. Add & sync the iOS project

```bash
npm run build
npx cap add ios
npx cap sync ios
```

## 4. Remove the dev hot-reload URL before submitting

Open `capacitor.config.ts` and delete (or comment out) the entire `server: { ... }` block.
Then:

```bash
npm run build && npx cap sync ios
```

Leaving the `server.url` in place will make the App Store build load the Lovable
sandbox at runtime — Apple will reject it, and users would see a broken app.

## 5. Info.plist usage strings

Open `ios/App/App/Info.plist` in Xcode and add these keys (the app uploads avatar photos):

```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>Rally Sport needs access to your photos so you can set a profile picture.</string>
<key>NSCameraUsageDescription</key>
<string>Rally Sport uses the camera so you can take a profile picture.</string>
```

## 6. Xcode signing

```bash
npx cap open ios
```

In Xcode:
- Select the `App` target → Signing & Capabilities → your Apple Developer team.
- Set Bundle Identifier to `app.lovable.f2523576796643c0853666f9d43d3d2a`
  (or your own reverse-domain ID once registered in App Store Connect).
- Set Version `1.0.0`, Build `1`.
- Product → Archive → Distribute App → App Store Connect.

## 7. App Store Connect

Create the app in [App Store Connect](https://appstoreconnect.apple.com/).

### Required URLs
- **Privacy Policy URL**: `https://<your-published-domain>/privacy`
- **Support URL**: `https://<your-published-domain>/support`
- **Marketing URL** (optional): the app landing page.

### App Privacy questionnaire — what Rally Sport collects
Answer honestly; here's what applies:

| Category | Data | Used for | Linked to user | Tracking? |
|---|---|---|---|---|
| Contact Info | Email, Name, Phone | App Functionality | Yes | No |
| Health & Fitness | Height, Weight, DOB | App Functionality | Yes | No |
| User Content | Photos (avatars), Messages, Other user content (feedback, reflections) | App Functionality | Yes | No |
| Identifiers | User ID | App Functionality | Yes | No |
| Diagnostics | Crash / performance data (if you add Sentry etc.) | Analytics | No | No |

### Account deletion
The reviewer will ask where to delete an account. Point to:
**In-app: Profile → Delete account** (route `/delete-account`).

## 8. Before you tap "Submit for Review"

- [ ] `server.url` removed from `capacitor.config.ts` and rebuilt.
- [ ] Real support email set in `src/pages/Support.tsx` (currently `support@rallysport.app` — change this).
- [ ] TestFlight build installed on a real iPhone; you completed:
      signup (coach + player w/ team code) → login → chat → feedback →
      calendar → task → delete account.
- [ ] Screenshots captured for 6.7", 6.5", 5.5" (App Store Connect requirements).
- [ ] Age rating filled out (likely 4+ or 12+ depending on user-generated content).
- [ ] Privacy Policy + Terms + Support URLs publicly reachable.

## Optional next steps

- Sign in with Apple (only required if you add Google/Facebook auth).
- Push notifications via `@capacitor/push-notifications` + APNs certificate.
- Deep links / Universal Links for feedback assignment routes.
- Sentry or Crashlytics for crash reporting.
- Turn Supabase email verification back on once you configure a sender domain.
