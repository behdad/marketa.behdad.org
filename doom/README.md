# doom/

Everything rsvp.html's DOOM app runs from — self-hosted, so the app has no third-party
origin in its path (same rule as `pyodide/` and `linux/`). A real GPL Chocolate-Doom
compiled to WebAssembly, playing FreeDoom Phase 1, rendered into an HTML `<canvas>` in the
office monitor. ~30 MB total, dominated by the WAD. Pinned deliverables, not build
outputs — don't regenerate casually.

## Engine (Chocolate-Doom → WebAssembly)

- `doom.js` (270 KB) + `doom.wasm` (2.2 MB) — the Emscripten glue + module for
  **cloudflare/doom-wasm**, a WebSockets/multiplayer port of **Chocolate Doom** to WASM
  (SDL2). These are the compiled build artifacts (upstream ships no releases/tags), taken
  verbatim from the project's own live demo at `https://silentspacemarine.com/` — the same
  files its `src/index.html` loads (`websockets-doom.js` → `doom.js`,
  `websockets-doom.wasm` → `doom.wasm`), fetched 2026-07-14.
  - Corresponding source: https://github.com/cloudflare/doom-wasm @ commit
    `65e0d3ae2ffa604155eebd96ed40da6567bd08f4` (branch `main`, HEAD as of the fetch date),
    which is Chocolate Doom (https://github.com/chocolate-doom/chocolate-doom) plus the
    WebSockets net driver. License: **GNU GPL v2** (see the repo's `COPYING.md`).
  - sha256 `a2909044a9fbc5529f941c8dbf93cc2931927690e0341c737545cf0b9cff23fb` (doom.js),
    `6366f83a58fe8596ce742a66dbf86871d315862c89c11e65b54935be03c7e6c4` (doom.wasm).
  - This is the multiplayer build, but it starts single-player and offline: no
    `-servername` is passed, so `NET_Init` never dials out. Verified there is **no**
    `wss://`/`http(s)://` server URL in `doom.js`, and a full local run makes **zero**
    external network requests. Nothing to neutralize — but don't add a `-servername` arg.

- `default.cfg` (1.6 KB) — the port's stock config, from
  `cloudflare/doom-wasm/src/default.cfg` at the same commit. Preloaded into the Emscripten
  FS and passed as `-config default.cfg`. sha256
  `eacd68e8e254bd250bc559c1535ab88df437340d0460cae6085f5f29b49fb6e2`.

## WAD (game data)

- `freedoom1.wad` (28 MB) — **FreeDoom: Phase 1 (Ultimate-Doom-compatible IWAD)**, a
  copyright-clean, BSD-licensed replacement for id's `doom1.wad` (we ship FreeDoom, **not**
  id's shareware WAD). From the **FreeDoom 0.13.0** release:
  `https://github.com/freedoom/freedoom/releases/download/v0.13.0/freedoom-0.13.0.zip`
  (`freedoom-0.13.0/freedoom1.wad` inside), fetched 2026-07-14. IWAD magic verified
  (`IWAD`, 3163 lumps). License: **BSD-3-Clause** (the zip's `COPYING.txt`; art/sound/music
  credits in `CREDITS*.txt`). sha256
  `7323bcc168c5a45ff10749b339960e98314740a734c30d4b9f3337001f9e703d`.

## How it's wired (rsvp.html)

The DOOM dock app lazy-loads `doom/doom.js` on first open; its Emscripten `Module` uses
`locateFile` to find `doom/doom.wasm`, `preRun` to `createPreloadedFile` the WAD + cfg, and
`canvas` = the foreignObject `<canvas id="canvas">` (the id is **mandatory** — the SDL2
glue hardcodes `getElementById("canvas")`). Args:
`-iwad freedoom1.wad -window -nogui -nosound -nomusic -config default.cfg`. `-nosound`
means no audio device is opened (muted by design; add sound later by dropping that arg).
The run loop pauses via `pauseMainLoop()`/`resumeMainLoop()` whenever the app isn't the
live foreground (closed, tab hidden, or the office off-screen).

## Re-fetch / update

```
# engine (from the upstream live demo — no release artifacts exist)
curl -L -o doom.js   https://silentspacemarine.com/websockets-doom.js
curl -L -o doom.wasm https://silentspacemarine.com/websockets-doom.wasm
curl -L -o default.cfg https://raw.githubusercontent.com/cloudflare/doom-wasm/65e0d3ae2ffa604155eebd96ed40da6567bd08f4/src/default.cfg

# WAD (from the FreeDoom release zip)
curl -L -o freedoom.zip https://github.com/freedoom/freedoom/releases/download/v0.13.0/freedoom-0.13.0.zip
unzip -j freedoom.zip freedoom-0.13.0/freedoom1.wad
```

To build the engine from source instead (heavy — needs emsdk + SDL2 ports), see
`cloudflare/doom-wasm`'s `README.md` / `scripts/build.sh`; the output `websockets-doom.js`
and `websockets-doom.wasm` are what get renamed to `doom.js` / `doom.wasm` here. If the WAD
size changes materially, update the `doom_loading` copy (EN + CS) in rsvp.html and the
`~30 MB` figures here.
