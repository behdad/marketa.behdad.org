# Safari / WebKit bug tracker — rsvp.html

Owner-reported, reproduced with real WebKit (Playwright — see `DEBUGGING.md` §3).
**On iOS every browser is WebKit** (Apple mandate: Safari, Chrome-iOS, Firefox-iOS all share
the engine), so these hit *all* iPhone/iPad visitors — the "best in desktop Chrome" nudge only
helps desktop. Target: **not-broken on iOS**, not pixel-perfect.

Status legend: 🔴 open · 🟡 in progress · 🟢 fixed

---

### 1. 🔴 Stray black rectangle + white-gradient sheen in the opening scene
The kitchen (opening) scene shows a small black rectangle with a white/gradient sheen over the
countertop, roughly behind the CLICK ME word. Not present in Chrome. **Reproduced.**
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

### 4. 🔴 Monitor desktop + its apps don't render (foreignObject cluster)
On WebKit the office monitor is largely non-functional — the **desktop app icons** and
effectively **every app** fail to render. Confirmed dead so far: Console, Python (Pyodide),
Linux (v86), Doom, Game of Life, Minesweeper, Tattoo, Browser (tabs + content) (and the icons
themselves). Assume the WHOLE app surface is affected until proven otherwise.
(Tattoo also has a canvas — if the phone's DOM version also fails, that's a separate canvas bug, not foreignObject.)
These are all the monitor's HTML-in-SVG app surfaces, so this is almost certainly ONE root
cause: **foreignObject** content not painting on WebKit (foreignObject is historically buggy —
clipping/painting/positioning). Fixing the foreignObject path likely recovers the whole cluster.
(The zoom blur #3 and the missing icons may share the same monitor-rendering root — verify together.)

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
