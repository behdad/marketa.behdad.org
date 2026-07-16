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

### 1. 🔴 Stray black rectangle + white-gradient sheen in the opening scene
The kitchen (opening) scene shows a small black rectangle with a white/gradient sheen over the
countertop, roughly behind the CLICK ME word. Not present in Chrome. **Reproduced.** It's a
persistent KITCHEN-ROOM element (fixed screen position): still there in the bar view (on the
middle bottle shelf) — so it's one kitchen element, not bar-specific. The rest of the bar
(bottles, bartender + ∞ shirt, menu, stools) renders fine.
_Suspect:_ an SVG gradient/filter/mask element WebKit paints opaque where Chrome hides or clips it.

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

### 3. 🔴 Zoomed-in objects are very blurred
The monitor (and other desk objects) look badly blurred when zoomed in. 
_Suspect:_ WebKit rasterises the SVG at pre-scale resolution then scales up (Chrome re-rasters).
May need a WebKit re-raster hint (`will-change`, higher backing resolution) or be accepted.

### 4. 🟡 Monitor desktop + its apps don't render — ROOT CAUSE FOUND (WebKit bug 23113)
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

### 5. 🔴 Scene-wide CSS filter effects don't render (ketamine gray-out, alcohol blur)
Full-scene filter effects don't appear on WebKit: the **ketamine** trip's gray-out and the
**alcohol** (drunk) blur both do nothing. 
_Suspect:_ a CSS `filter` applied to the SVG/strip (grayscale/blur) that WebKit won't apply to
that element type, or an overlay it handles differently. Likely one root for both.

### 6. 🔴 Julia-set fractal screensaver doesn't render
The Julia-set fractal projector/screensaver channel shows nothing on WebKit. 
_Suspect:_ canvas / WebGL / shader path unsupported or erroring on WebKit.

### 7. 🟢 Volume control does nothing — music blasts at full volume — FIXED
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
