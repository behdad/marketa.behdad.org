# BUILD.md — `harfbuzzjs/` — HarfBuzz-in-WASM for the JS console + a Fraunces shaping font

This documents how the artifacts in `harfbuzzjs/` were produced. It is a companion to
`harfbuzzjs/README.md` (which carries the shas and license pointers). See the root
`BUILD.md` for the shared framing. Nothing here is recompiled — the wasm is an upstream
release blob — so "rebuild" means re-vendor + re-subset; fully **reconstructable** from
`harfbuzzjs/README.md`.

**What it is.** The runtime behind `rsvp.html`'s JS-console `shape()` command: HarfBuzz
compiled to WebAssembly, driven from plain JavaScript (mirrors the Python app's
`uharfbuzz`). Three verbatim files from an npm package plus one subset font.

**a) The three runtime files (verbatim upstream, pinned):**

- npm package **`harfbuzzjs@0.10.3`** — the last 0.x release before the 1.x TypeScript
  rewrite (staying on 0.10.x keeps `rsvp.html`'s `createHarfBuzz()` + `hbjs(module)`
  wiring unchanged; the 1.x API is incompatible).
  Tarball `https://registry.npmjs.org/harfbuzzjs/-/harfbuzzjs-0.10.3.tgz`,
  npm shasum `fcd53cc888548d16607f19e4cab8d1b55dceb939`.
  Upstream https://github.com/harfbuzz/harfbuzzjs.
- `hb.wasm` embeds HarfBuzz **14.0.0** (lines up with the ISO's `hb-shape` 14.2.1 and the
  `uharfbuzz` above). Only `hb.wasm`, `hb.js`, `hbjs.js` are vendored — the package also
  ships `hb-subset.wasm`, TS sources and examples, which aren't needed to shape.

```sh
npm pack harfbuzzjs@0.10.3
tar xf harfbuzzjs-0.10.3.tgz
cp package/hb.wasm package/hb.js package/hbjs.js /path/to/wedding/harfbuzzjs/
```

Shas to confirm after copying (from `harfbuzzjs/README.md`):
`hb.wasm` `ea319787a8efdf90599ade77e33d1f245d61da390380f6c8299ab3195ff00d6d`,
`hb.js` `6f99d6f8b7c544d3e3ce75a2450398a108dcc8c44d8b5913c850a4be6e95c7a8`,
`hbjs.js` `56f84ea44d70fb881d3fee642c7d4a5ec284e3d84aa2d8555741e4e3265b8ef2`.

**b) `fraunces.ttf` — the latin shaping font.** `hb.wasm` reads raw sfnt (TTF/OTF), and
JS has no brotli to decompress the page's woff2, so this dir ships its own uncompressed
TTF of the site's display face.

**GOTCHA — the old-Android User-Agent TTF trick.** Google Fonts' css2 API only emits a
`format('truetype')` static instance if the request looks like it comes from a browser
too old to understand woff2. Fetch the source TTF with an old-Android UA:

```sh
# css2 for Fraunces:opsz,wght@9..144,400 with an old-Android UA yields the URL below;
# the css2 API flattens the opsz axis to a static Regular @ weight 400.
curl -A 'Mozilla/5.0 (Linux; Android 4.4)' \
  'https://fonts.gstatic.com/s/fraunces/v38/6NUh8FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0K7iN7hzFUPJH58nib1603gg7S2nfgRYIctxujDvTUhUo.ttf' \
  -o src.ttf   # Fraunces v38, name-table Version 1.000

# subset with fontTools pyftsubset 4.60.1
pyftsubset src.ttf \
  --unicodes='U+0020-007F,U+00A0-00FF,U+0100-017F,U+2010-2027,U+2030-205E,U+20AC,U+2122,U+2192,U+221E' \
  --layout-features='*' --output-file=fraunces.ttf
```

Result: 390 glyphs / 339 cmap entries, GSUB + GPOS kept,
sha256 `aa8cd1d689c6209df11ae5f1d10d8a6029c0de9fc3f2e73bfc24d294a36d16fe`.
Fraunces is OFL 1.1, https://github.com/undercasetype/Fraunces.
