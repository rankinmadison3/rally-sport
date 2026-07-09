import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.f2523576796643c0853666f9d43d3d2a",
  appName: "Rally Sport",
  webDir: "dist",
  // ─────────────────────────────────────────────────────────────────────
  // Hot-reload dev server. REMOVE (or comment out) the entire `server`
  // block before building for TestFlight / the App Store — otherwise the
  // released app will try to load the Lovable sandbox URL over the network
  // and Apple will reject the build.
  // ─────────────────────────────────────────────────────────────────────
  server: {
    url: "https://f2523576-7966-43c0-8536-66f9d43d3d2a.lovableproject.com?forceHideBadge=true",
    cleartext: true,
  },
};

export default config;
