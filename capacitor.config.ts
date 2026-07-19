import { CapacitorConfig } from "@capacitor/cli";

// ─────────────────────────────────────────────────────────────────────────────
// Rally Sport — Capacitor config
//
// For App Store / TestFlight builds, set CAPACITOR_RELEASE=1 in your shell
// before running `npm run build && npx cap sync ios`. That removes the
// Lovable sandbox `server.url` (Apple rejects builds that load remote code
// as the primary web view).
// ─────────────────────────────────────────────────────────────────────────────

const isRelease = process.env.CAPACITOR_RELEASE === "1";

const config: CapacitorConfig = {
  appId: "app.lovable.f2523576796643c0853666f9d43d3d2a",
  appName: "Rally Sport",
  webDir: "dist",
  ios: {
    contentInset: "always",
    limitsNavigationsToAppBoundDomains: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#ffffff",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      splashImmersive: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#ffffff",
    },
  },
  ...(isRelease
    ? {}
    : {
        server: {
          url: "https://f2523576-7966-43c0-8536-66f9d43d3d2a.lovableproject.com?forceHideBadge=true",
          cleartext: true,
        },
      }),
};

export default config;
