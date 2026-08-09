# DEBUGGING.md — headless rendering & cross-browser triage recipes

Internal notes (blocked from public via `.htaccess`, same as `CLAUDE.md`). How to render the
pages offline in Chrome and in **real WebKit** (Safari engine) for cross-browser debugging.

## 1. Chrome headless (offline screenshot)

```bash
google-chrome --headless --disable-gpu --no-sandbox \
  --window-size=1000,760 --virtual-time-budget=2500 \
  --screenshot=out.png "file:///home/behdad/wedding/loft-day.html#play"
```

- `#play` = game-only view; no hash = full page (hero + game); `#reveal` also full.
- To exercise click/keyboard behaviour: copy to a scratch file, inject a `<script>` before
  `</body>` that dispatches events after a `setTimeout`, then screenshot / `--dump-dom`.
- Gotchas (see CLAUDE.md "Headless-Chrome testing gotchas"): under `--virtual-time-budget`,
  `requestAnimationFrame` doesn't tick (monkeypatch `requestAnimationFrame = cb=>{cb();return 0}`);
  WAAPI animations fast-forward; media queries may not match the emulated width (check with
  `matchMedia`, don't assume). `--window-size` does NOT reliably set `innerWidth` (often stuck
  ~500) — use CDP device emulation (below) for real viewport widths.

## 2. Real mobile-width emulation (CDP over WebSocket, Node 22 native WebSocket)

`--window-size` is unreliable for `innerWidth`; drive real device metrics via CDP:

```bash
google-chrome --headless --disable-gpu --no-sandbox --remote-debugging-port=9222 \
  --hide-scrollbars "file:///home/behdad/wedding/loft-day.html#play" >/dev/null 2>&1 &
```

Then Node (v22 has a global `WebSocket` — no `ws` module needed):

```js
const http=require('http');
const get=p=>new Promise(r=>http.get('http://127.0.0.1:9222'+p,x=>{let d='';x.on('data',c=>d+=c);x.on('end',()=>r(JSON.parse(d)))}));
const t=(await get('/json')).find(x=>x.type==='page');
const ws=new WebSocket(t.webSocketDebuggerUrl); let id=0,p={};
const send=(m,pa)=>new Promise(r=>{const i=++id;p[i]=r;ws.send(JSON.stringify({id:i,method:m,params:pa||{}}))});
await new Promise(r=>ws.onopen=r); ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&p[m.id]){p[m.id](m.result);delete p[m.id]}};
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride',{width:360,height:720,deviceScaleFactor:2,mobile:true});
// ...then Runtime.evaluate to measure getBoundingClientRect, matchMedia, etc.
```

Used to verify the CLICK ME fits narrow phones (360/390/412px) after the size bump.

**Two CDP overrides you almost always need for a faithful screenshot of animated / focus-gated
scenes** (both bit repeatedly — a screenshot looked "broken" when the page was fine):

- **Reduced-motion:** headless Chrome reports `prefers-reduced-motion: reduce` by *default*, so
  every `@media (prefers-reduced-motion: reduce){…animation:none}` rule fires and the scene paints
  static (auroras flat, arrows not bobbing, particles absent). The Chrome flag alone doesn't fix
  it — force it over CDP **before navigating**:
  ```js
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  ```
- **Focus:** the audio beds + some autonomous timers gate on `document.hasFocus()` (the crickets
  rule), and a headless tab is unfocused, so focus-gated behaviour never runs. Override it in the
  page (via `Runtime.evaluate` or an injected `<script>`) before exercising anything focus-gated:
  ```js
  await send('Runtime.evaluate',{expression:'document.hasFocus=function(){return true;}'});
  ```

Also (recap from CLAUDE.md, worth having here): use `?t=<timestamp>` + a **unique port AND
`--user-data-dir` per run** (a reused headless Chrome serves a STALE `file://` page and the whole
run is fiction; `Network.setCacheDisabled` does NOT defeat it), and prove the loaded page contains
the code under test (`assertFresh`) before trusting any assertion. `/json/new?<url>` needs the
**PUT** verb, not GET.

## 3. Real WebKit (Safari engine) via Playwright — the Safari repro tool

Playwright bundles the **actual WebKit engine** (~Safari, not identical but catches most
engine-level bugs). Reports UA `AppleWebKit/605.1.15 … Safari/605.1.15`. No Mac needed.

### One-time setup (this Fedora box)

```bash
SCRATCH=<scratchpad>/pw
mkdir -p "$SCRATCH" && cd "$SCRATCH"
npm init -y && npm i playwright
npx playwright install webkit    # downloads the ubuntu24.04 fallback build under ~/.cache/ms-playwright
```

**Fedora gotcha — `libjpeg.so.8`.** The Ubuntu WebKit build needs `libjpeg.so.8` (SONAME
version `LIBJPEG_8.0`); Fedora only ships `libjpeg.so.62` (6.2 ABI — a bare symlink does NOT
work, it lacks the versioned symbols). Drop a **real** `libjpeg.so.8` into the bundle's own
lib dir (that's where its wrapper's `LD_LIBRARY_PATH` points):

```bash
# a genuine libjpeg.so.8.2.2 exists on this box in the Plex flatpak:
cp /var/lib/flatpak/app/tv.plex.PlexDesktop/*/*/*/files/lib/libjpeg.so.8.2.2 \
   ~/.cache/ms-playwright/webkit-2311/minibrowser-wpe/lib/libjpeg.so.8
```

Then always run with host-validation skipped (Fedora isn't "officially supported", the check
is over-conservative):

```bash
PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 node render.mjs
```

### Render script (`pw/render2.mjs`)

```js
import { webkit, chromium } from 'playwright';
const engine = process.argv[2] === 'chromium' ? chromium : webkit;
const url = 'file:///home/behdad/wedding/loft-day.html#play';
const b = await engine.launch();
const p = await b.newPage({ viewport: { width: 1000, height: 760 } });
p.on('pageerror', e => console.log('PAGEERROR:', e.message));
p.on('console', m => { if (m.type()==='error') console.log('CONSOLE:', m.text()); });
await p.goto(url, { waitUntil: 'load' });
await p.waitForTimeout(2500);
await p.screenshot({ path: process.argv[3] });
await b.close();
```

Run against the REAL `/home/behdad/wedding/loft-day.html` (not a copy) so `art/` assets load.
Benign `Not allowed to load local resource` console lines for audio/manifest are expected
under `file://`. Use `page.evaluate` to drive game hooks (`window.__startCinematic`,
`goToStage`, `blacklight`, etc.) and reproduce interactive states.

## 4. Safari / WebKit bug list (triage — owner-reported, reproduced here)

Status: WebKit engine renders via the tool above; use it to repro + verify each fix. On iOS
EVERY browser is WebKit (Apple mandate), so these hit all iPhone/iPad visitors — the "use
Chrome" nudge only helps desktop. Target: not-broken on iOS, not pixel-perfect.

1. **Opening scene: stray black rect + white-gradient sheen** over the counter (mid-scene,
   behind CLICK ME). REPRODUCED. Suspect: an SVG gradient/filter/mask element WebKit renders
   opaque where Chrome hides/clips it.
2. **Particles fly away** instead of staying at their source — the espresso-LED power-on
   shine, and the notes from the ukulele. This is the `transform-box: fill-box` class (see
   CLAUDE.md): a WAAPI/CSS transform without `transform-box:fill-box` is relative to the SVG
   viewport, not the element's own bbox. check.js guards `.animate()` calls; the escapees are
   likely CSS-class-driven particles or a spot the check misses. WebKit is stricter than Chrome
   about the default.
3. **Zoomed-in objects (monitor & co.) very blurred** — WebKit rasterises SVG at pre-scale
   resolution then scales up. Suspect the desk-zoom transform; may need a WebKit-specific
   re-raster hint (will-change / higher backing res) or accept.
4. **Monitor desktop app icons don't render at all** — likely foreignObject or nested-SVG /
   CSS-drawn icons WebKit fails on. (foreignObject is historically buggy in WebKit.)
5. **Ketamine-trip scene graying doesn't render** — a CSS filter (grayscale?) / overlay WebKit
   handles differently.
6. **Volume button doesn't work; music blasts at full volume** — iOS/WebKit ignores
   programmatic `HTMLMediaElement.volume`. Only Web-Audio-GainNode volume works on iOS →
   points at the audio pipeline (see #7).
7. **Spatial sound-modeling doesn't work either — "as if the pipeline is skipped for
   playback"** — the Web Audio pipeline (MediaElementSource→Gain/pan graph) appears not to
   engage on WebKit, which would explain BOTH #6 (no gain control) and #7 (no spatialization).
   Prime suspect: a feature-detect / context path that silently falls back to raw
   `<audio>` playback on WebKit. See memory `project_audio_pipeline_kill_switch`.
