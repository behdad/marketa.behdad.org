# harfbuzzjs/

The self-hosted HarfBuzz-in-WebAssembly runtime behind rsvp.html's JS console
`shape()` command — it lets a visitor shape text with HarfBuzz *from JavaScript*,
mirroring the python app's `uharfbuzz`. All files are self-hosted so the command has
no third-party origin in its load path (same zero-CDN rule as `pyodide/` and `linux/`;
Google Fonts CSS is the site's only allowed runtime CDN, and this dir doesn't use it —
it ships its own shaping font because `hb.wasm` reads raw sfnt, not the page's woff2).

## harfbuzzjs runtime (verbatim upstream copies, pinned)

harfbuzzjs **0.10.3**, the last release of the 0.x line before the 1.x TypeScript
rewrite. Loading is `createHarfBuzz({ locateFile })` → an Emscripten module → `hbjs(module)`
→ `{ createBlob, createFace, createFont, createBuffer, shape }`, and `buffer.json()`
yields `[{ g, cl, ax, ay, dx, dy }]`. Its `hb.wasm` embeds HarfBuzz **14.0.0**, lining
up with the `hb-shape` CLI in `linux/linux.iso` (14.2.1) and the `uharfbuzz` in
`pyodide/`. Nothing is rebuilt or patched.

Source: the npm package `harfbuzzjs@0.10.3`
(`https://registry.npmjs.org/harfbuzzjs/-/harfbuzzjs-0.10.3.tgz`, npm shasum
`fcd53cc888548d16607f19e4cab8d1b55dceb939`), extracted 2026-07-12. Upstream is
https://github.com/harfbuzz/harfbuzzjs. harfbuzzjs is MIT (Copyright © 2019 Ebrahim
Byagowi; the bundled Zephyr libc bits are Apache-2.0 and Emscripten's emmalloc is MIT —
full text in the package's `LICENSE`); the compiled HarfBuzz is under the Old MIT
license, https://github.com/harfbuzz/harfbuzz.

- `hb.wasm` — HarfBuzz 14.0.0 compiled to WebAssembly (388 KB)
  sha256 `ea319787a8efdf90599ade77e33d1f245d61da390380f6c8299ab3195ff00d6d`
- `hb.js` — the Emscripten loader module (`window.createHarfBuzz`, resolves `hb.wasm`
  via `locateFile`) (24 KB)
  sha256 `6f99d6f8b7c544d3e3ce75a2450398a108dcc8c44d8b5913c850a4be6e95c7a8`
- `hbjs.js` — the hand-written high-level wrapper (`window.hbjs`) (53 KB)
  sha256 `56f84ea44d70fb881d3fee642c7d4a5ec284e3d84aa2d8555741e4e3265b8ef2`

(The package also ships `hb-subset.wasm`, TypeScript sources and examples; only the
three files above are needed to shape, so only those are vendored here.)

## fraunces.ttf — the shaping font

A latin subset of Fraunces Regular, the site's display face — bundled because
`hb.wasm` reads raw sfnt (TTF/OTF) and JS has no brotli to decompress the page's woff2.

Source: Google Fonts' css2 API for `Fraunces:opsz,wght@9..144,400`, requested with an
old-Android User-Agent so Google emits a `format('truetype')` static instance instead
of woff2 —
`https://fonts.gstatic.com/s/fraunces/v38/6NUh8FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0K7iN7hzFUPJH58nib1603gg7S2nfgRYIctxujDvTUhUo.ttf`
(Fraunces v38, name-table Version 1.000; the css2 API flattens the opsz axis to a
static Regular at weight 400), fetched 2026-07-12. Fraunces is under the SIL Open Font
License 1.1, https://github.com/undercasetype/Fraunces.

Subset with fontTools `pyftsubset` 4.60.1:

    pyftsubset src.ttf \
      --unicodes='U+0020-007F,U+00A0-00FF,U+0100-017F,U+2010-2027,U+2030-205E,U+20AC,U+2122,U+2192,U+221E' \
      --layout-features='*' --output-file=fraunces.ttf

- `fraunces.ttf` — raw TTF (magic `00 01 00 00`), 390 glyphs / 339 cmap entries, GSUB +
  GPOS kept (45 KB)
  sha256 `aa8cd1d689c6209df11ae5f1d10d8a6029c0de9fc3f2e73bfc24d294a36d16fe`

## To upgrade

Re-`npm pack harfbuzzjs@<version>` (note: the 1.x line rewrote the API to an Emscripten
class module and dropped this `createHarfBuzz` + `hbjs(module)` wrapper — staying on the 0.10.x line
keeps rsvp.html's `window.shape` wiring unchanged), re-copy `hb.wasm`/`hb.js`/`hbjs.js`,
re-subset Fraunces if the display face changes, and refresh the versions + sha256s here.
