# Safari / WebKit bug tracker — rsvp.html

Owner-reported, reproduced with real WebKit (Playwright — see `DEBUGGING.md` §3).
**On iOS every browser is WebKit** (Apple mandate: Safari, Chrome-iOS, Firefox-iOS all share
the engine), so these hit *all* iPhone/iPad visitors — the "best in desktop Chrome" nudge only
helps desktop. Target: **not-broken on iOS**, not pixel-perfect.

Status legend: 🔴 open · 🟡 in progress · 🟢 fixed

**Confirmed WORKING on WebKit** (narrows the root causes — it's not "Safari is broken", it's
specific subsystems): the party scene renders fine. So core inline-SVG art + CSS/WAAPI scene
animations are OK. The failures cluster in: foreignObject (monitor apps), CSS `filter` effects,
`<canvas>`/WebGL (fractals), transform-relative particle spawns, and the Web Audio pipeline.

---

### 1. 🟢 Stray black rectangle in the opening scene — FIXED
**Actual cause (not a gradient/mask):** the office monitor's ~16 `<foreignObject>` app channels
(all at x=254 y=154 in `#office-monitor`) are `opacity:0` when idle, but WebKit (a) still PAINTS
opacity:0 foreignObjects and (b) lets foreignObject content ESCAPE the strip's `overflow:hidden`
clip — so the off-screen office leaked a black rect into whatever room was on screen. **Fix
(commit 24f864f, deployed):** `goToStage` toggles a `viewing-office` class on the strip;
`#loft-game-strip:not(.viewing-office) #office-monitor foreignObject{visibility:hidden}` (WebKit
honours `visibility`). Screenshot-verified gone in WebKit; office monitor still renders when viewed.

### 2. 🟢 Animated text particles fly away from their source — FIXED (device-confirmed)
Espresso power-on shine ✦, ukulele/radio notes ♪, piano notes ♪, hearts ♥ — all flew toward the
SVG origin on WebKit. **Actual cause:** WebKit ignores `transform-box: fill-box` specifically on
**`<text>`** elements (isolated tests: `<circle>` and `<g>` honor it fine; only `<text>` breaks)
— it resolves the scale/rotate pivot against the SVG viewport instead of the glyph's box. The
"add fill-box" fix was already present, which is why it looked mysterious. **Fix (commit d8f1859,
deployed):** pivot each text particle on its own `(x,y)` in view-box coords instead of the
mis-resolved fill-box center; exact for center-baselined glyphs. Verified WebKit + Chromium, and
confirmed by the owner on real Safari.

**Ashtray ash — PARKED (not a text/transform-box bug).** The ash are `<circle>`s with a pure
translate (transform-box-immune), and both the ash spawn AND the ashtray's fill-box spin measure
IDENTICAL in Playwright-WebKit vs Chromium (`{x:175,y:454,w:45,h:40}`). Could not reproduce
headless. Owner: "not a big deal, move on." Needs a real-device look if it resurfaces (Playwright-
WebKit ≈ Safari but not identical).

### 3. 🟢 Zoomed-in monitor "very blurred" — RESOLVED (not actually blurry)
After the #4 monitor de-layering fix, the owner confirms the zoomed monitor renders SHARP on
Safari, not blurred. The earlier "very blurred" was the apps failing to render at all (#4), not a
raster-blur. No separate fix needed. (If a genuine SVG-scale raster blur ever shows on other
zoomed objects, that's the WebKit raster-at-base-res limit — re-raster hints re-trigger #23113, so
tread carefully.)

### 4. 🟢 Monitor desktop + its apps don't render — FIXED (device-confirmed "MUCH better")
**FIXED (merged, deployed).** Swept RenderLayer triggers out of the monitor foreignObject content
and re-anchored anything needing positioning via CSS **grid-stacking** (`display:grid` +
`grid-area:1/1` — NOT a RenderLayer). Now renders on WebKit: desktop icons/tiles + console, python,
linux, minesweeper, editor, browser, mail, calendar, weather, tehran, now-playing. Added
`html.is-webkit` to swap scrollable panes to `overflow:hidden` (WebKit mispaints scroll boxes under
the g-scale too). Also fixed the dock hover (any `transform` re-creates a layer → hovered tile
vanished; on WebKit use a non-layer box-shadow instead). **Remaining (hard WebKit limit, accepted):**
`<canvas>`/`<video>`/`<iframe>` are composited replaced elements WebKit can't paint under the
g-scale — so Doom, Life board, Video, Tattoo paint, and the photobooth camera stay blank, though
their surrounding UI renders. Owner confirmed "MUCH better."

<details><summary>Original diagnosis (kept for reference)</summary>
On WebKit the office monitor is largely non-functional — desktop app icons + effectively every
app (Console, Python/Pyodide, Linux/v86, Doom, Life, Minesweeper, Tattoo, Browser).

**ROOT CAUSE (confirmed — reproduced + fix verified in real WebKit):**
[WebKit bug #23113](https://bugs.webkit.org/show_bug.cgi?id=23113) — *"layer content inside HTML
in an SVG foreignObject renders in the wrong place"* when the SVG is **scaled**. `#office-monitor`
carries `scale(1.1025)` and the desk-zoom scales it much more. Any descendant of the monitor's
foreignObjects that gets its own **RenderLayer** — `position:relative/absolute`, `transform`,
`will-change`, `opacity<1`, `z-index`, `filter` — is painted at the WRONG position (off-screen /
outside the clip) → invisible. Plain text (no layer) paints in place → that's why only the LABELS
showed. Misleading detour: the `<use>` icon refs DO resolve (getBBox non-zero) and removing the
tile's `translateZ(0)`/`will-change` alone did NOT help — the real trigger was **`position:relative`
on `.dock-tile`**. Setting `.dock-tile{position:static}` in WebKit → **all 16 tiles + icons render
correctly, matching Chrome** (screenshot-verified).

**Isolated minimal-test proof (real WebKit):** a `position:relative` div inside `<foreignObject>`
under `<g transform="scale(10)">` renders TINY/broken; the SAME div as `position:static` under the
same g-scale renders LARGE and correct. Also tested: CSS `transform:scale` on the `<svg>` element
itself (direct-child foreignObject) renders FINE; **`viewBox` scaling does NOT scale foreignObject
content at all** in WebKit (so a viewBox-zoom rewrite is OUT). The specific trigger = **a RenderLayer
under an SVG `transform`-attribute scale on a `<g>` ancestor**, which is exactly `#office-monitor`
(`transform="…scale(1.1025)"`).

**Fix options (both avoid detach/reinject and viewBox):**
1. *Surgical:* remove the `scale(1.1025)` from `#office-monitor`'s transform attribute and bake that
   factor into the monitor's coordinates (or apply it via a non-transform path), so no layer content
   sits under an SVG-transform scale. Smallest blast radius IF the coordinate rebake is clean; one
   change likely recovers icons + all apps. Risk: repositioning/resizing the whole monitor art.
2. *Sweep:* strip RenderLayer-creating CSS (`position:relative/absolute`, `transform:translateZ(0)`,
   `will-change`, stray `opacity`/`z-index`) from elements inside the monitor foreignObjects. Confirmed
   working for `.dock-tile` (→ all 16 tiles+icons render). Downsides: touches many app rules and breaks
   overlays that need a positioning context (calendar day-number, photobooth cam) — those need
   re-anchoring. Broadest but most tedious.

Likely also explains the zoom-blur (#3). Owner reviewing which fix path to take (a core-feature change).
</details>

### 5. 🟢 Scene-wide CSS filter effects don't render (ketamine gray-out, alcohol blur) — FIXED
**Actual cause:** a CSS filter *function* (`filter:blur()/saturate()/…`) on an SVG container is a
WebKit no-op (computed style shows it, nothing renders); an SVG `<filter>` *reference* on the same
group DOES work. **Fix (commit 24f864f, deployed):** added `#ket-haze` + `#booze-blur` SVG
`<filter>`s and switched both rules to `filter:url(#…)` (ketamine's 18s ramp re-done as SMIL;
brightness/contrast folded into `feComponentTransfer`; `color-interpolation-filters=sRGB`). WebKit
edge-energy + saturation now match Chromium; both were no-ops before. Confirmed by owner on Safari.

### 5b. 🔴 Iboga trip filter (same class as #5, not yet fixed)
`#loft-game-strip.iboga{animation:iboga-trip … filter:saturate/brightness/contrast}` uses the same
CSS-filter-keyframe mechanism → same WebKit no-op. Left out of the #5 scope (it's on the root
`<svg>`, riskier). Fix the same way (SVG `<filter>` ref) in a future pass.

### 6. 🟢 Julia-set fractal screensaver doesn't render — FIXED
**Actual cause:** the canvas bitmap draws fine in WebKit (pixel readback == Chromium), but a
`<canvas>` inside a `<foreignObject>` NEVER composites on WebKit → blank even unscaled (so NOT the
#23113 zoom bug). **Fix (commit 24f864f, deployed):** render into an off-DOM canvas and blit it to
a native SVG `<image>` via `toDataURL()` each frame. SVG `<image>` paints on every engine and
scales under the zoom. Confirmed by owner. (Residual softness when the monitor is zoomed is the
separate zoom-raster issue, #3/#4.)

### 6b. 🔴 Other canvas-in-foreignObject surfaces (same class as #6, not yet fixed)
Same canvas-in-foreignObject limitation likely blanks the **mushroom-trip** bloom canvases
(`trip-bloom-fo`) and the **cuddly-flame** fire (`cuddly-flame-fo`) on WebKit. Out of #6's scope —
apply the same off-DOM-canvas → SVG `<image>` blit in a future pass.

### 10. 🟡 Safari has NO Web Audio output at all — 26 AudioContexts vs Safari's cap (IN PROGRESS)
THE real Safari audio bug (found after #7 below). On real desktop Safari there is **no Web Audio
sound whatsoever** — SFX (synth clicks) AND pipeline-captured songs are both silent; only direct
`<audio>` (i.e. `?pipeline=off` music) plays. The "tab shows audio playing but no sound" symptom is
the tell. **Root cause:** the page creates **~26 separate `AudioContext`s** (one per ambient bed /
channel / dance + SFX + pipeline). **Safari hard-caps concurrent AudioContexts** (~4, historically);
past the cap they go silent. Chrome/Firefox don't cap → only Safari dies. Likely also causes the
owner's Chrome-Linux audio glitches (hardware-stream contention). **Fix in progress (agent):**
consolidate to ONE shared AudioContext (per-source lifecycle → node ops, not context close/suspend;
ramp gains to avoid the "loud pop"; preserve the visibility/focus gating + kill switch). NOTE:
Playwright-WebKit does NOT reproduce Safari's cap (it has no limit), so this fix is correct-by-
construction + needs real-Safari confirmation. The #7 volume-GainNode fix below was REVERTED during
this debugging (it only added a gain node; it wasn't the silence cause) — re-apply after the
consolidation lands.

### 7. ⚪ Volume control / music blasts — fix REVERTED (see #10)
Was fixed (route captured-song volume through an in-graph GainNode, commit 7f4c167) and confirmed on
Chrome — but the confirmation was Chrome, not Safari. REVERTED (commit ce14495) while diagnosing the
real Safari-silence bug (#10). The GainNode approach is sound; re-apply once the shared-context
consolidation (#10) makes Safari output Web Audio at all. Original write-up:
**Actual cause:** on WebKit, `createMediaElementSource(el)` taps the element's RAW decoded stream
and **bypasses `el.volume`** (opposite of Chrome, which taps post-`.volume`). The app applied song
volume via `audio.volume`, so once a song was captured into the pipeline the control did nothing →
full blast. **Fix (commit 7f4c167, deployed):** each captured song carries its level on its own
in-graph GainNode (`_eqGain`, spliced `src→_eqGain→eqBassShelf`); `setSongLevel/songLevel` route
every write to the gain when captured, else to `.volume`. Browser-agnostic (no UA sniffing), Chrome
behaviorally unchanged, kill-switch + `?pipeline` preserved. Verified in real WebKit + Chromium
(gain 1.0→0.1→1.0 gives clean analyser drop/recover on both).
**iOS residual (untestable headless, verify on device):** (1) ~250ms before capture engages, a
song's first moment can play at full volume on iOS (iOS ignores `.volume` for native playback too);
(2) iOS mutes Web-Audio output when the hardware ringer switch is silent (WebKit bug 237322).

### 8. 🟢 Spatial sound-modeling "doesn't work" — was actually #7 — FIXED
Not a separate bug: the pipeline DOES engage on WebKit (capture succeeds; `createStereoPanner`
exists; `panDriftFrame` has no engine gate), so spatialization already worked — the "as if skipped"
symptom was the dead volume (#7) making everything sound wrong at full blast. Fixed with #7 (commit
7f4c167, deployed). No separate code change needed.

### 9. 🔴 Double-tap for right-click (context menu) doesn't work
The touch gesture that stands in for right-click — double-tap to open the `.mon-ctx` /
context menus (monitor dock, console, phone icons, D-pad, etc.) — does nothing on WebKit/touch.
_Suspect:_ WebKit's touch/gesture handling (double-tap is reserved for zoom; the synthetic
`contextmenu` or the dblclick→menu path differs), and/or `touchend` timing. Interaction bug,
separate from the render clusters.

---

## Firefox / Gecko (separate engine — its own bugs)

Playwright also bundles real Firefox (Gecko); `DEBUGGING.md` §3 covers it (`import { firefox }`,
same `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1`). Firefox is flagged non-ideal by the browser
notice too.

### F1. 🟢 Fullscreen: scene didn't zoom up + side-rails hung below it — FIXED
In real Firefox fullscreen the scene stayed small (un-zoomed) in a big empty frame, and the media
controls floated ~52px below the scene. **Two causes, both fixed (commits 5be9b4a + c7beb6c,
deployed):** (1) `sizeFullscreenFrame` set `frame.style.width` but the fullscreen `max-width:none`
override didn't take in Firefox (its selector list includes the unknown `:-webkit-full-screen`),
so the frame stayed capped at the base `max-width:1140px` → forced `max-width:none` INLINE; plus
added delayed re-fits (setTimeout 80/220/480ms) for Firefox's late fullscreen resize. (2) Firefox
computes the `width:500%;height:auto` strip aspect a hair differently, so the JS frame height
exceeded the rendered scene and the stretched rails hung below → snap the frame height to the
scene's actually-rendered height. Verified: frame fills 0.99 of the area, rails align, Chromium
unchanged.
