# BUILD.md — `doom/` (self-hosted DOOM runtime)

Companion to `doom/README.md` (provenance, shas, licenses of the shipped blobs) and to the
root `BUILD.md` index. Everything in `doom/` is **fetched verbatim** — nothing is compiled
or repacked here — so this file is mostly `curl` + `unzip`, not a toolchain. The engine
*could* be built from source (emsdk + SDL2 ports), but we deliberately pin the upstream
build instead, exactly like `linux/` pins v86 and `pyodide/` pins the core Pyodide files.

Reproducibility note: the shas below are the shipped artifacts' identity. The engine
artifacts have no upstream release/tag, so they're pinned by source **commit** + the
sha256 of the exact files we downloaded from the project's own live demo; the WAD is a
release asset whose zip sha matches the upstream `CHECKSUM` file.

`.htaccess` serves `doom/` `immutable` (in the `pyodide|linux|harfbuzzjs|doom` set), so a
future upgrade should ship under review rather than silently overwrite. `BUILD.md` is
blocked from public serving by the shared `<Files "BUILD.md">` rule; `COPYING` stays served.

---

## 1. Engine — Chocolate-Doom → WebAssembly (`doom.js`, `doom.wasm`, `default.cfg`)

**What it is.** `doom.js` (Emscripten glue) + `doom.wasm` (the module) are a WebAssembly
build of **Chocolate Doom** (SDL2) with WebSockets multiplayer support —
**cloudflare/doom-wasm**. Upstream ships **no release/tag and no prebuilt artifacts in the
repo**, so — same model as pinning v86's npm build — we take the compiled files verbatim
from the project's own live demo, which serves exactly the files its `src/index.html`
loads. License: **GNU GPL v2** (`COPYING`).

**Source / pins (verified from the shipped files):**

- cloudflare/doom-wasm @ commit `65e0d3ae2ffa604155eebd96ed40da6567bd08f4` (branch `main`,
  HEAD at fetch time), https://github.com/cloudflare/doom-wasm — Chocolate Doom
  (https://github.com/chocolate-doom/chocolate-doom) + a WebSockets net driver.
- Compiled artifacts fetched 2026-07-14 from `https://silentspacemarine.com/`:
  - `websockets-doom.js`  → `doom.js`   — sha256 `a2909044a9fbc5529f941c8dbf93cc2931927690e0341c737545cf0b9cff23fb`
  - `websockets-doom.wasm` → `doom.wasm` — sha256 `6366f83a58fe8596ce742a66dbf86871d315862c89c11e65b54935be03c7e6c4`
- `default.cfg` — the port's stock config, fetched from the repo at the pinned commit.
  sha256 `eacd68e8e254bd250bc559c1535ab88df437340d0460cae6085f5f29b49fb6e2`.

**Fetch (what was actually done):**

```sh
D=/path/to/wedding/doom
curl -L -o "$D/doom.js"   https://silentspacemarine.com/websockets-doom.js
curl -L -o "$D/doom.wasm" https://silentspacemarine.com/websockets-doom.wasm
curl -L -o "$D/default.cfg" \
  https://raw.githubusercontent.com/cloudflare/doom-wasm/65e0d3ae2ffa604155eebd96ed40da6567bd08f4/src/default.cfg
sha256sum "$D"/doom.js "$D"/doom.wasm "$D"/default.cfg   # compare to the pins above
```

**Rebuild from source instead (reconstructed — not how the shipped files were made).**
Per `cloudflare/doom-wasm`'s `README.md` / `scripts/build.sh`, with emsdk + SDL2 ports:

```sh
# needs Emscripten (emsdk), automake, and SDL2 / SDL2_mixer / SDL2_net ports
git clone https://github.com/cloudflare/doom-wasm && cd doom-wasm
git checkout 65e0d3ae2ffa604155eebd96ed40da6567bd08f4
./scripts/clean.sh && ./scripts/build.sh
# outputs src/websockets-doom.js + src/websockets-doom.wasm → rename to doom.js / doom.wasm
```
(A from-source rebuild won't be byte-identical — WASM toolchains rarely reproduce
exactly. The pins above are the shipped files' identity.)

**GOTCHAs (verified against the shipped glue):**

- **The canvas `id` must be `"canvas"`.** The SDL2 glue hardcodes
  `document.getElementById("canvas")` (glue ~line 1528) and registers its event handlers
  on it — a different id crashes at `SDL_CreateWindow` (`addEventListener` of null).
- **`callMain` is a global**, not `Module.callMain`, in this build — call
  `(Module.callMain || window.callMain)(args)` from `onRuntimeInitialized`.
- **`locateFile`** must map the glue's build name `websockets-doom.wasm` → `doom/doom.wasm`.
- **No `-servername`** → single-player, offline; `NET_Init` never dials out. There is no
  server URL in `doom.js` and a full local run makes zero external requests. Keep it that way.

## 2. WAD — FreeDM (`freedm.wad`)

**What it is.** **FreeDM**, the FreeDoom project's standalone **deathmatch IWAD** — a
copyright-clean, BSD-3-Clause replacement for id's WADs (never id's shareware WAD). Chosen
as the smallest clean IWAD that still boots to a recognizable DOOM (see "smaller?" below).
License: **BSD-3-Clause** (`COPYING`).

**Source / pins:**

- FreeDoom **0.13.0** release asset `freedm-0.13.0.zip` →`freedm.wad`, fetched 2026-07-14
  from https://github.com/freedoom/freedoom/releases/tag/v0.13.0
- `freedm.wad` — 22,218,796 bytes (22 MB), 3615 lumps, IWAD magic verified. sha256
  `d9adc4d792627e7fc47b09067b15486da724010c71dd12831e1cf8e0755b68ad`.
- The release publishes checksums per-zip, not per-WAD, so trust chains through the zip:
  `freedm-0.13.0.zip` sha256
  `b420f13508ef745d7b38e83d15e55e0fc0b09d9a503c96741cddd9773d43f7c9`, matching the
  release's `freedoom-0.13.0-CHECKSUM`.

**Fetch:**

```sh
D=/path/to/wedding/doom
curl -L -o /tmp/freedm.zip \
  https://github.com/freedoom/freedoom/releases/download/v0.13.0/freedm-0.13.0.zip
# verify the zip against the release CHECKSUM before trusting the WAD inside
curl -L https://github.com/freedoom/freedoom/releases/download/v0.13.0/freedoom-0.13.0-CHECKSUM \
  | grep freedm-0.13.0.zip
sha256sum /tmp/freedm.zip
unzip -j /tmp/freedm.zip freedm-0.13.0/freedm.wad -d "$D"
```

**Why FreeDM, and why not smaller (investigated).** The engine (`doom.wasm`, fixed at
~2.5 MB) I_Errors on any missing sprite, so a valid IWAD must carry the **whole** FreeDoom
sprite/graphic set — ~18 MB. That's the hard floor for a *recognizable* clean DOOM; the
~250 KB "miniwad"-style IWADs are either shareware-derived (not clean) or blank
missing-texture soup (not recognizable), so both were rejected. Among clean options:
`freedoom1.wad` = 28 MB, `freedm.wad` = 22 MB (chosen), and a `-nosound`-stripped freedm
= ~19.7 MB. The strip (remove `DS*`/`DP*` sound lumps — music `D_*` **cannot** go: the
engine resolves music lump names via `W_GetNumForName` even under `-nomusic` and crashes if
absent) was **rejected**: ~2.5 MB is a rounding error against an 18 MB floor, and it trades
away verbatim provenance plus the ability to ever enable audio (a sound-less WAD crashes the
moment `-nosound` is dropped). If a future maintainer *does* want the last 2.5 MB, the strip
recipe is a ~20-line WAD-directory rewrite that keeps only lumps outside the `*_START/_END`
namespaces whose names don't begin `DS`/`DP`; boot-test it before shipping.

If the WAD size changes materially, update the `doom_loading` copy (EN + CS) in `rsvp.html`
and the `~22 MB` figures in `README.md`.
