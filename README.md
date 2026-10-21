# Campus Dash

A mobile-first, original 3D college chase-runner set on a fictional Indian **college campus**. An Indian student races to class while a professor follows with an attendance register. All game art, poses, UI and sounds are generated in code. The engine uses actual WebGL geometry, perspective projection, sunlight, shadows and fog—not flat sprites.

## Run locally — no npm or build step

Requires Python 3 and a modern WebGL-capable browser. The project vendors the pinned **Three.js 0.160.0** module locally, so it does not need internet access after the project folder has been copied.

From the directory containing `campus-dash/`:

```sh
cd campus-dash
python -m http.server 8000 --bind 127.0.0.1
```

Windows alternative if `python` is unavailable:

```sh
py -m http.server 8000 --bind 127.0.0.1
```

On Windows, you can also double-click `run-local.bat` inside this folder.
It starts the server from the correct directory and prints the correct URL.

Open **http://localhost:8000/**. Stop the server with Ctrl+C. Do not double-click index.html: ES modules must be served over HTTP.

## Android on the same Wi-Fi

1. Put the computer and Android phone on the same trusted private Wi-Fi network. Avoid a guest network with client isolation.
2. In `campus-dash/`, start:

   ```sh
   python -m http.server 8000 --bind 0.0.0.0
   ```

3. On Windows run `ipconfig`. Find the **IPv4 Address** of the active Wi-Fi adapter, for example `192.168.1.25`.
4. Open **http://192.168.1.25:8000/** in the phone's browser, replacing the example with your actual address. `localhost` on the phone refers to the phone, not the computer.
5. If Windows Firewall prompts, allow Python only on your trusted **Private** network. Do not disable the firewall or expose/forward the server to the internet. The server exposes files in its working directory, so run it in the game directory only.
6. Keep the terminal running. The current project includes Three.js in `vendor/three.module.js`, so the phone does not need CDN access.

## Controls

- Swipe left/right: one adjacent lane per gesture.
- Swipe up or quick tap on the pathway: jump.
- Swipe down: slide.
- The home screen shows a four-arrow tutorial. Use the arrows or swipe gestures during play.
- Keyboard: arrows or WASD; Space jumps; P/Escape pauses; M toggles sound; F2 toggles debug.
- Swipes fire immediately at 24 CSS pixels. A stationary tap within 280 ms jumps. One gesture produces one action. Pointer capture, cancellation and primary-pointer checks prevent duplicate/stuck gestures.

## Gameplay

- Low book stacks, barriers and manholes: jump. Rising-chevron badges identify them.
- Overhead branch supports and projector gantries: slide. Horizontal-bar badges identify them, with a visibly open gap beneath.
- Bicycles, cleaning carts and coolers: change lane. Cross badges indicate lane-only hazards, even if their meshes are lower than a jump; this is an intentional gameplay rule.
- A whole lane remains clear in every generated obstacle row. Successive safe lanes change by at most one. Rows never overlap, and their time gap decreases gradually from 1.85 to 1.35 seconds.
- Coins form lines, vertical jump arcs and small lateral patterns. Missing a coin breaks the streak. Every five consecutive coins raises the coin score multiplier, capped at ×5.
- Close passes and cleared jump/slide hazards award a near-miss bonus once. Distance also earns score.
- Power-ups rotate along the safe lane every fourth row:
  - **Coffee**: 5-second smoothly accelerated rush with collision protection.
  - **Shield**: absorbs one collision, or expires after 14 seconds.
  - **Magnet**: pulls nearby medals toward the runner for 10 seconds.
  - **Multiplier**: doubles score for 12 seconds.
- Clean running/collections increase professor separation slightly, capped at 3.15 world meters to keep the chaser in view.
- Speed starts at 18 world units/sec, then every 250m adds 10% through a hidden smooth ramp. No speed-up announcement is shown on screen. Obstacle difficulty increases at each 500m milestone; after 1000m, some rows randomly occupy all three lanes with one shared jump/slide action, while other rows keep a safe lane.
- The home screen asks for one unique runner name. Once accepted, that name is locked to the browser's saved game data. After starting a run, a two-second arrow/swipe tutorial appears before movement begins. Scores are saved locally for immediate offline continuity, and the configured global board is shared by every copy of the same deployed link.
- A `COLLEGE CAMPUS` gateway appears at each 300m route marker. Motivation one-liners appear whenever the runner completes another 500m.
- An unprotected collision locks gameplay immediately, then plays a 1.35-second stumble/catch sequence. The result screen says **Caught by the Professor!**

## Global leaderboard setup

GitHub Pages only serves static files; browser `localStorage` is private to
each person's browser/device. That is why a score entered on a friend's
phone cannot appear in your local leaderboard. The project now includes an
optional Supabase-backed global board so every copy of the same GitHub Pages
link can read and submit to one shared table.

One-time setup:

1. Create a Supabase project.
2. Open Supabase SQL Editor and run `supabase/schema.sql`. This migration preserves existing scores and removes the old policy before changing the name column.
   If you intentionally want to erase all scores and start over, run `supabase/reset-schema.sql` instead. That file is destructive.
3. In **Integrations → Data API**, make sure the `public.campus_scores` table and `public.submit_campus_score` function are exposed. New Supabase projects can require explicit exposure in addition to SQL grants.
4. Copy the project URL and browser-safe publishable/anon key.
5. Edit `js/supabase-config.js`:

   ```js
   export const SUPABASE_URL = 'https://your-project-ref.supabase.co';
   export const SUPABASE_PUBLISHABLE_KEY = 'your-publishable-or-anon-key';
   ```

6. Commit and push both `js/supabase-config.js` and `supabase/schema.sql`.
7. Reload the GitHub Pages link and open **Leaderboard**. The board displays only the top five names, with one highest-score row per name.

The browser uses the publishable/anon key with Row Level Security policies and
the `submit_campus_score` RPC; never put a secret/service-role key in this
repository. The RPC keeps one row per unique name and updates that row only
when the submitted score is higher. It is not an anti-cheat service: a
technically capable player can forge a browser request. For a competitive
leaderboard, replace the public RPC with an authenticated server/Edge Function
that validates the run.

The name field is checked against the global table before the first run. After
a browser accepts a name, the field is locked for that browser's saved game
data so the same browser profile cannot submit under a second name. Clearing
browser storage resets this local lock, so this is a casual-game identity rule,
not account-level authentication.

The REST request sends the key through the `apikey` header only. Do not add
the new publishable key as `Authorization: Bearer`; modern Supabase
publishable keys are not JWTs.

If `supabase-config.js` still contains placeholders, the UI deliberately
falls back to this device's saved scores and shows a configuration message.

## Project map

```text
campus-dash/
├── index.html
├── css/style.css
├── js/
│   ├── main.js        # Boot/error boundary
│   ├── game.js        # State machine, simulation, scoring, power-ups
│   ├── scene.js       # Procedural campus, instancing, lights, fog
│   ├── player.js      # Articulated student and physics
│   ├── professor.js   # Professor and visible catch sequence
│   ├── obstacles.js   # Pooled hazards and swept collision tests
│   ├── coins.js       # Pooled medals and power-ups
│   ├── controls.js    # Pointer/keyboard input
│   ├── camera.js      # Portrait-safe perspective framing
│   ├── ui.js          # Menus, HUD, status and debug overlay
│   ├── audio.js       # Procedural sound effects
│   ├── leaderboard.js  # Shared Supabase REST leaderboard
│   ├── supabase-config.js # Public project URL/key placeholders
│   └── utils.js       # Math, persistence, meshes, particles
├── assets/README.md
├── supabase/schema.sql
├── vendor/three.module.js
└── README.md
```

## Technical choices

- State machine: LOADING → MENU → PLAYING ↔ PAUSED → GAME_OVER. Intro and catching are timed phases within PLAYING, with input appropriately gated.
- Simulation uses 1/120-second fixed steps and a capped backlog. Rendering uses requestAnimationFrame. Pause/background handling resets the clock so returning to the tab cannot teleport the runner into hazards.
- Camera X is anchored directly to the smoothly moving player; height and FOV are damped. This is intentional: a lagging lateral camera was the source of off-screen lane changes.
- Camera is behind/above the player, with a modest speed-related FOV change. Professor offset/maximum distance are constrained rather than allowing him to fall behind the camera. Crash shake is small and only used during capture.
- Real directional shadows use one 1024×1024 map. DPR is capped at 1.5. Static campus meshes with shared geometry/material are instanced per recycled section. No heavy postprocessing is used; tone mapping provides the warm grade.
- Fixed pools: 64 obstacles, 80 medals, 8 power-ups, 80 particles. Objects and materials are reused. HUD refresh is limited to 10 Hz and changed values are cached.
- Best, lifetime coins, mute and debug settings use `campusDash.v3` in localStorage. Old best/coin keys are imported when accessible under the same origin. Moving from a file URL to localhost or changing hostname/port creates a different storage origin; old browser data is not automatically transferred.
- Storage denial does not stop play. Local progress saves every five seconds and at pause/home/pagehide/end. When Supabase is configured, completed scores are sent through `submit_campus_score`; the app sends only the entered name, score, distance and coins, and the database records the timestamp only when a new high score replaces the saved row.

## Debug and verification

Toggle **Debug** on the menu or press **F2**. The overlay shows estimated FPS, state, camera position and the most recent gesture. Green/coral wire boxes show player/hazard colliders. Debug is saved in settings; disable it for performance measurements.

Automated local checks performed during implementation used the real pinned Three.js math/scene code with stubbed DOM/WebGL rendering. They checked module parsing, state transitions, jump/slide physics, ground/airborne player and professor camera bounds at 360×780, 390×844, 430×932 and 844×390, collision semantics, all power types, storage, capture, restart, bounded pools and local HTTP serving. These are **not** GPU rendering, real touch, audio-output or Android FPS tests.

**60 FPS is a target, not a measured guarantee.** Real-device screenshot review, long-run performance profiling and gameplay tuning are still required before treating this as a production release. Geometry is intentionally lightweight stylized 3D with realistic lighting/proportions—not photoreal scanned art.

### Manual test checklist

- [ ] Load at 360–430 px portrait; name field, Play, leaderboard, sound and saved stats are readable.
- [ ] Start; verify the exact intro and visible professor. See the entire student, including at jump apex and outer lanes.
- [ ] Swipe all four directions, tap the path, cancel a gesture, and try two-finger touches. No scrolling, zoom or double action.
- [ ] Jump a barrier/manhole; slide under a branch/gantry; lane-change around tall hazards. Inspect debug boxes for fairness.
- [ ] Collect lines and arcs. Miss a medal to reset combo; pass close to a hazard to earn a single bonus.
- [ ] Collect all four powers; verify timers, shield consumption, protected coffee rush, magnet pull and doubled score.
- [ ] Crash; verify stumble, professor catch, effects, then accurate final score. Restart at least ten times without duplicate input or growing object counts.
- [ ] Pause/resume, Home, sound toggle, tab switch, app backgrounding, and rotation while paused/playing.
- [ ] Reload the same origin and check best, total coins and settings. Check muted mode before and after reload.
- [ ] Leave a 10-minute run on a mid-range Android device, note FPS/temperature/battery, and inspect console errors.

## Troubleshooting

- **Loading/error screen:** check that `vendor/three.module.js` exists and that the browser supports WebGL and ES modules. No external art downloads are expected.
- **PowerShell says `Cannot bind parameter 'Headers'`:** Windows PowerShell treats `curl` as an alias for `Invoke-WebRequest`, so Unix-style `curl -H ...` syntax does not work. Use `curl.exe` explicitly, or use the PowerShell command below.
- **Supabase says `cannot alter type of a column used in a policy definition`:** run the updated `supabase/schema.sql` again. It now removes the old policies before changing `name` to case-insensitive `citext`. Use `supabase/reset-schema.sql` only if you intentionally want to delete every existing score.
- **404:** serve from `campus-dash/`, not from an unrelated directory.
- **Phone cannot connect:** check the PC IPv4 address, same network, private firewall allowance and port 8000. Guest/client-isolated Wi-Fi may block LAN connections.
- **No sound:** tap Play or Sound to unlock audio; check device volume and site permissions. Gameplay remains usable without Web Audio.
- **Low FPS:** disable Debug, lower the DPR cap in `scene.js` to 1, or disable shadows for a lower-quality mode. Measure actual device FPS before adding effects.
- **WebGL unavailable/context lost:** enable hardware acceleration, close GPU-heavy tabs and reload. A visible error screen avoids silently hanging gameplay.
- **Progress seems reset:** verify the same browser profile, hostname and port; private browsing/site-data clearing may remove progress.

### Windows PowerShell leaderboard test

Use `curl.exe`, not `curl`:

```powershell
curl.exe -H "apikey: YOUR_PUBLISHABLE_OR_ANON_KEY" "https://YOUR_PROJECT_REF.supabase.co/rest/v1/campus_scores?select=name,score,distance,coins,created_at&order=score.desc,created_at.asc"
```

Or use native PowerShell:

```powershell
$url = "https://YOUR_PROJECT_REF.supabase.co/rest/v1/campus_scores?select=name,score,distance,coins,created_at&order=score.desc,created_at.asc"
$headers = @{
  apikey = "YOUR_PUBLISHABLE_OR_ANON_KEY"
  Accept = "application/json"
}
Invoke-RestMethod -Method Get -Uri $url -Headers $headers
```

Replace both placeholders with your real Supabase project URL and browser-safe publishable/anon key. Do not paste a `service_role`, secret key, database password, or any private credential into a command you plan to share or commit.

## Vendored dependency

`vendor/three.module.js` is already included and is the local Three.js 0.160.0 ES-module build. It is loaded by the import map in `index.html`; do not delete or rename it. Retain the MIT license and copyright notice from the Three.js distribution if you redistribute the project.

## Original future improvements

1. Procedural paving/brick atlases and subtle material roughness variation.
2. A fuller custom two-bone foot-placement solver and expressive face blend shapes.
3. Original campus activities in the distance, pooled and disabled at low quality.
4. Device quality presets selected through measured frame-time budgets.
5. Authored fictional-campus routes, accessible contrast modes and an optional slower practice mode.

The previous standalone `campus-dash.html` is intentionally left unchanged outside this project directory.
