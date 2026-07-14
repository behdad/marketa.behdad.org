# doom/

Everything rsvp.html's DOOM app runs from — self-hosted, so the app has no third-party
origin in its path (same rule as `pyodide/` and `linux/`). A real GPL Chocolate-Doom
compiled to WebAssembly, playing FreeDM (FreeDoom's deathmatch IWAD), rendered into an HTML
`<canvas>` in the office monitor. ~22 MB total, dominated by the WAD. Pinned deliverables,
not build outputs — don't regenerate casually. Full fetch/rebuild recipe in `BUILD.md`;
license texts + attribution in `COPYING`.

## Engine (Chocolate-Doom → WebAssembly)

- `doom.js` (270 KB) + `doom.wasm` (2.2 MB) — the Emscripten glue + module for
  **cloudflare/doom-wasm**, a WebSockets port of **Chocolate Doom** to WASM (SDL2). Taken
  verbatim from the project's own live demo `https://silentspacemarine.com/`
  (`websockets-doom.js` → `doom.js`, `websockets-doom.wasm` → `doom.wasm`), fetched
  2026-07-14. Corresponding source: https://github.com/cloudflare/doom-wasm @ commit
  `65e0d3ae2ffa604155eebd96ed40da6567bd08f4`. License: **GNU GPL v2**.
  - sha256 `a2909044a9fbc5529f941c8dbf93cc2931927690e0341c737545cf0b9cff23fb` (doom.js),
    `6366f83a58fe8596ce742a66dbf86871d315862c89c11e65b54935be03c7e6c4` (doom.wasm).
  - Single-player + offline: no `-servername` is passed, so `NET_Init` never dials out.
    No server URL exists in `doom.js`; a full local run makes **zero** external requests.
    Don't add a `-servername` arg.

- `default.cfg` (1.6 KB) — the port's stock config, from `cloudflare/doom-wasm/src/`
  @ the same commit. sha256
  `eacd68e8e254bd250bc559c1535ab88df437340d0460cae6085f5f29b49fb6e2`.

## WAD (game data)

- `freedm.wad` (22 MB) — **FreeDM**, FreeDoom's standalone **deathmatch IWAD**: a
  copyright-clean, BSD-licensed replacement for id's WADs (we ship FreeDoom, **not** id's
  shareware WAD). Chosen as the smallest clean IWAD that still boots to a real, recognizable
  DOOM: FreeDM's deathmatch arenas reuse the full FreeDoom asset set (~18 MB of sprites is
  the immovable floor — the engine I_Errors on any missing sprite), so it's ~6 MB smaller
  than `freedoom1.wad` (28 MB) without giving up recognizable levels.
  - From the **FreeDoom 0.13.0** release, `freedm-0.13.0.zip` → `freedm.wad`, fetched
    2026-07-14. IWAD magic verified (`IWAD`, 3615 lumps). License: **BSD-3-Clause** (the
    zip's `COPYING.txt`; art/music credits in `CREDITS*.txt` — reproduced in `COPYING`).
  - sha256 `d9adc4d792627e7fc47b09067b15486da724010c71dd12831e1cf8e0755b68ad`. The release
    publishes checksums per-zip, not per-WAD, so trust chains through the zip:
    `freedm-0.13.0.zip` sha256
    `b420f13508ef745d7b38e83d15e55e0fc0b09d9a503c96741cddd9773d43f7c9`, which matches the
    release's `freedoom-0.13.0-CHECKSUM` file. This is the **verbatim** upstream WAD (not
    stripped/repacked). A sound/music-stripped variant boots ~2.5 MB smaller under
    `-nosound`, but was rejected: it foregoes verbatim provenance and forecloses ever
    enabling audio (the engine crashes on the first missing sound lump). See `BUILD.md`.

## How it's wired (rsvp.html)

The DOOM dock app lazy-loads `doom/doom.js` on first open; its Emscripten `Module` uses
`locateFile` → `doom/doom.wasm`, `preRun` → `createPreloadedFile` the WAD + cfg, and
`canvas` = the foreignObject `<canvas id="canvas">` (the id is **mandatory** — the SDL2
glue hardcodes `getElementById("canvas")`). Args:
`-iwad freedm.wad -window -nogui -nosound -nomusic -config default.cfg`. `-nosound` means
no audio device is opened (muted by design; FreeDM keeps its sound lumps, so audio can be
re-enabled by dropping the arg). The run loop pauses via `pauseMainLoop()`/`resumeMainLoop()`
whenever the app isn't the live foreground (closed, tab hidden, or the office off-screen).

## Serving / caching

`.htaccess` serves `doom/` with a 1-year immutable Cache-Control (it's in the
`pyodide|linux|harfbuzzjs|doom` set) and `.wasm` as `application/wasm`. `BUILD.md` is
blocked from public access by the shared `<Files "BUILD.md">` rule; `COPYING` stays served.
