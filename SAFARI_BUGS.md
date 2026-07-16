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

### 2. 🔴 Animated particles fly away from their source
WAAPI/CSS particles don't stay near the element that spawns them — they shoot off toward the
SVG origin. Confirmed on: the espresso machine's power-on LED shine, the notes rising from the
**ukulele**, and the **piano** notes (these "fly in" from off-target). 
_Cause:_ the `transform-box: fill-box` class (documented in CLAUDE.md). A transform without
`transform-box:fill-box` is resolved against the SVG viewport, not the element's own bbox;
WebKit is stricter than Chrome about the default. check.js guards `.animate()` calls, so the
escapees are likely CSS-class-driven particles or spots the check doesn't cover.

Related transform-coordinate variant: the **rotating ashtray's ash drops from the wrong
place**. That's the sibling bug class (CLAUDE.md "JS-spawned effects break when a target's
group gains a transform" — `getBBox`/CTM local-vs-viewport coords): the ash is spawned relative
to a rotated group and WebKit resolves the coordinate system differently than Chrome. Fix by
spawning the effect into the target's OWN group / reading position via a static ancestor's CTM.

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

### 7. 🔴 Volume control does nothing — music blasts at full volume
The volume button has no effect; songs play at max volume. 
_Cause:_ iOS/WebKit ignores programmatic `HTMLMediaElement.volume` — only a Web-Audio GainNode
can attenuate on iOS. Ties to #8.

### 8. 🔴 Spatial sound-modeling doesn't work — pipeline seems skipped on playback
No spatialization; "as if the pipeline is skipped for playback." The Web Audio graph
(MediaElementSource → gain/pan) appears not to engage on WebKit, which would explain BOTH the
dead volume control (#7) and the missing spatialization. 
_Prime suspect:_ a feature-detect / context path that silently falls back to raw `<audio>`
playback on WebKit. See memory `project_audio_pipeline_kill_switch`.

### 9. 🔴 Double-tap for right-click (context menu) doesn't work
The touch gesture that stands in for right-click — double-tap to open the `.mon-ctx` /
context menus (monitor dock, console, phone icons, D-pad, etc.) — does nothing on WebKit/touch.
_Suspect:_ WebKit's touch/gesture handling (double-tap is reserved for zoom; the synthetic
`contextmenu` or the dblclick→menu path differs), and/or `touchend` timing. Interaction bug,
separate from the render clusters.
