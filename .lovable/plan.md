## Concept

A 15-second kinetic sports sizzle — crimson, white, and ink black, with bold kinetic typography over real screenshots of the seeded demo app. Hero beats on **Dashboard** and **Season Calendar**, then a rapid montage of **Action Steps**, **Feedback**, and **Chat** with a final logo lock-up.

Vibe: Nike training-app energy — quick cuts, hard-edged type slamming in on the beat, screenshots framed inside angled device mocks, crimson accent strokes wiping between scenes.

## Direction

- **Palette**: `#B3122C` crimson (primary accent), `#0B0B0F` ink, `#F5F2EC` off-white, `#1A1A22` panel.
- **Type**: Space Grotesk 700 for hero/kinetic titles, Inter 500 for kickers/labels. (Matches Rally Sport identity in memory.)
- **Motion system**:
  - Default in: 12-frame `spring({ damping: 22, stiffness: 220 })` + 6-frame blur-to-sharp.
  - Accent in (hero titles): bigger spring overshoot + per-letter stagger of 2 frames.
  - Scene cuts: crimson `wipe({ direction: 'from-left' })` over 6 frames — feels like a stat overlay swipe.
- **Motifs**: diagonal crimson stroke wipes, tall stat counters (W-L record counts up), thin "REC •" timestamp tag in the corner, broadcast-style lower-third chips.

## Storyboard (15s @ 30fps = 450 frames)

```text
0:00 -> 0:02  [60f]  COLD OPEN — black, "RALLY SPORT" kinetic title slams in,
                     crimson stroke wipes through it. Tagline: "Run your team."
0:02 -> 0:05  [90f]  HERO 1 — Dashboard screenshot in tilted phone frame, slides
                     up from bottom; kinetic chips fly in: "TEAM PULSE", "9-3
                     SEASON", "MORALE 4.3". Parallax shift on the phone.
0:05 -> 0:08  [90f]  HERO 2 — Calendar screenshot full-bleed inside laptop
                     frame; W/L dots pop in stagger; lower-third reads
                     "SEASON CALENDAR — WINS, PRACTICES, EVENTS".
0:08 -> 0:13 [150f]  MONTAGE — three 50-frame beats with crimson wipes:
                       a) Action Steps list (chips: TECHNICAL/MENTAL/PHYSICAL/TEAMWORK)
                       b) Feedback (mood faces + rating bars animate up)
                       c) Chat (messages cascade in, pinned announcement glows)
0:13 -> 0:15  [60f]  END CARD — Rally Sport logo lock-up, "ONE APP. ONE TEAM."
                     Crimson underline draws across.
```

Total: 450 frames. Each transition overlaps ~6 frames, accounted for in `<TransitionSeries>`.

## Technical

### 1. Capture real screenshots from the seeded preview

Use `browser--view_preview` against the running preview (seeded demo data is already in place). Capture at the viewport that matches the device frame each shot uses:

| Shot | Route | Viewport | Saved to |
|---|---|---|---|
| Dashboard | `/dashboard` (or `/`) | 390×844 (phone) | `remotion/public/shots/dashboard.png` |
| Calendar | `/calendar` | 1440×900 (laptop) | `remotion/public/shots/calendar.png` |
| Action Steps | `/tasks` (action steps page) | 390×844 | `remotion/public/shots/tasks.png` |
| Feedback | `/feedback` | 390×844 | `remotion/public/shots/feedback.png` |
| Chat | `/chat` | 390×844 | `remotion/public/shots/chat.png` |

I'll first probe the actual route names from `src/App.tsx` before capturing, and re-seed via `/__demo-seed` if any screen is empty.

### 2. Scaffold Remotion project

- `mkdir -p remotion && cd remotion && bun init -y`
- Install: `remotion @remotion/cli @remotion/renderer @remotion/bundler @remotion/transitions @remotion/google-fonts @remotion/compositor-linux-x64-musl react react-dom typescript @types/react`
- Patch the gnu compositor binary with the musl one and symlink system `ffmpeg`/`ffprobe` (per video-creator skill — required on NixOS).
- `tsconfig.json` with `jsx: "react-jsx"`, `module: "Preserve"`.

### 3. File structure

```text
remotion/
  src/
    index.ts                     # registerRoot
    Root.tsx                     # <Composition id="main" 1920x1080 30fps 450f>
    MainVideo.tsx                # TransitionSeries + persistent grain/scanline layer
    components/
      PhoneFrame.tsx             # tilted iPhone mock
      LaptopFrame.tsx            # 16:10 laptop mock
      KineticTitle.tsx           # per-letter spring-in
      StatChip.tsx               # broadcast lower-third chip
      CrimsonWipe.tsx            # diagonal stroke wipe used between scenes
      GrainOverlay.tsx           # 4% opacity noise, persistent
    scenes/
      ColdOpen.tsx
      HeroDashboard.tsx
      HeroCalendar.tsx
      MontageTasks.tsx
      MontageFeedback.tsx
      MontageChat.tsx
      EndCard.tsx
  public/
    shots/                       # screenshots captured above
    logo.png                     # copied from src/assets/rally-sport-logo.png
  scripts/
    render-remotion.mjs          # programmatic render (chromeMode: chrome-for-testing, muted: true)
```

### 4. Render

`code--exec cd remotion && node scripts/render-remotion.mjs` → outputs `/mnt/documents/rally-sport-walkthrough.mp4` (1920×1080, H.264, muted, ~15s). Spot-check frames 30/120/240/360/440 with `bunx remotion still` before the full render.

## Out of scope

- No voiceover or music (video is muted; sandbox ffmpeg lacks AAC encoder).
- No app code changes — only the new `remotion/` directory is added.
- No animated UI re-creations — montage uses the captured screenshots, with kinetic type and frames as the motion layer on top.
