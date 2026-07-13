# BUILD.md — rebuilding the three self-hosted runtimes

This site self-hosts three WebAssembly / emulated runtimes so `rsvp.html`'s consoles
have **zero third-party origin** in their load path (Google Fonts CSS is the site's one
allowed runtime CDN; none of these three use it). Every blob is pinned and content-
versioned — `.htaccess` serves `pyodide/`, `linux/` and `harfbuzzjs/` as
`immutable`, and a rebuild ships under a new path rather than overwriting in place.

This file documents how the **built** artifacts were produced, so they can be rebuilt.
It is a companion to the per-directory `README.md`s (which cover provenance, shas and
licenses of the *downloaded* blobs) — this file focuses on the pieces that were compiled
or repacked here, not fetched verbatim.

Reproducibility note: a matching sha256 below means "the shipped artifact was produced
from the recorded source/tree," **not** that a fresh rebuild is bit-identical — WASM and
cross-compiled toolchains rarely reproduce byte-for-byte. Treat the shas as the shipped
artifact's identity, and the version pins as the recipe.

Each section marks what is **verified** (from the on-disk build tree / pins / shas) vs.
**reconstructed** (the standard flow, with all versions confirmed, but not pulled from a
saved shell log).

---

## 1. `pyodide/` — the `uharfbuzz` cross-compiled wheel

**What it is.** `uharfbuzz-0.56.0b1-cp310-abi3-pyemscripten_2026_0_wasm32.whl` — a
Pyodide/WebAssembly cross-build of HarfBuzz's Python bindings (`import uharfbuzz as hb`),
the groom's own shaping engine, embedding HarfBuzz **14.2.1**. It is the *only* built
artifact in `pyodide/`; the five core Pyodide files and the micropip / fonttools / brotli
wheels are verbatim jsDelivr downloads — see `pyodide/README.md` for those, they are not
rebuilt here.

**Source / versions (verified from `~/uharfbuzz-pyodide-build`, outside the repo ~1.5 GB):**

- uharfbuzz **v0.56.0b1** (git tag `v0.56.0b1`, commit `c3dab76`),
  https://github.com/harfbuzz/uharfbuzz
  - HarfBuzz submodule pinned at **14.2.1** (commit `56feae4035bdd48f62ba2b8d8c16232d4d89b3a4`)
- Build toolchain (a Python venv at `~/uharfbuzz-pyodide-build/venv`):
  - `pyodide-build==0.36.0`, `pyodide-cli==0.5.0`, `pyodide-lock==0.1.3`,
    `auditwheel_emscripten==0.2.5`, `build==1.5.1`
  - Pyodide **cross-build environment 314.0.2** (CPython 3.14, `emscripten_5_0_3_wasm32`),
    installed via `pyodide xbuildenv install 314.0.2`
  - **emsdk / Emscripten 5.0.3** — the exact version pinned by xbuildenv 314.0.2
    (`PYODIDE_EMSCRIPTEN_VERSION ?= 5.0.3` in the xbuildenv's `Makefile.envs`), with
    bundled Node 22.16.0. Checkout at `~/uharfbuzz-pyodide-build/emsdk`.
- Output wheel sha256 `90f34eff14b53132bda81b4c176488c278b17798d591543485d9d84f730550b3`
  — **verified identical** to the deployed `pyodide/uharfbuzz-…whl`, i.e. the tree above
  is the genuine source of the shipped wheel.

**Why the `cp310-abi3` tag.** `uharfbuzz`'s `setup.py` sets
`Py_LIMITED_API = 0x030A0000` (the CPython 3.10 stable ABI), so even though the build
runs against xbuildenv 314.0.2's CPython 3.14, the wheel is tagged `cp310-abi3` and loads
on any Pyodide with an abi3-compatible CPython ≥ 3.10.

**Rebuild — reconstructed** (all versions verified; the exact `pyodide build` invocation
is reconstructed from the build tree's `.pyodide_build/pywasmcross_symlinks/` and
`build/bdist.emscripten_5_0_3_wasm32/` artifacts, not from a saved shell log):

```sh
# 1. toolchain venv
python3 -m venv ~/uharfbuzz-pyodide-build/venv
~/uharfbuzz-pyodide-build/venv/bin/pip install \
    pyodide-build==0.36.0 auditwheel-emscripten==0.2.5
. ~/uharfbuzz-pyodide-build/venv/bin/activate

# 2. Pyodide cross-build env (downloads the 314.0.2 xbuildenv into
#    ~/.cache/pyodide-build/.pyodide-xbuildenv-*), and its pinned emsdk
pyodide xbuildenv install 314.0.2

git clone https://github.com/emscripten-core/emsdk ~/uharfbuzz-pyodide-build/emsdk
cd ~/uharfbuzz-pyodide-build/emsdk
./emsdk install 5.0.3 && ./emsdk activate 5.0.3
. ./emsdk_env.sh

# 3. uharfbuzz source (recursive — HarfBuzz is a submodule)
git clone --recursive --branch v0.56.0b1 \
    https://github.com/harfbuzz/uharfbuzz ~/uharfbuzz-pyodide-build/uharfbuzz
cd ~/uharfbuzz-pyodide-build/uharfbuzz
git -C harfbuzz checkout 56feae4035bdd48f62ba2b8d8c16232d4d89b3a4   # 14.2.1

# 4. cross-build the wheel → dist/uharfbuzz-0.56.0b1-cp310-abi3-pyemscripten_2026_0_wasm32.whl
pyodide build

# 5. copy the wheel into the site
cp dist/uharfbuzz-0.56.0b1-cp310-abi3-pyemscripten_2026_0_wasm32.whl \
   /path/to/wedding/pyodide/
```

**GOTCHA — install via emfs, not the Pyodide lock (verified in `rsvp.html`).** The wheel
is **not** listed in `pyodide/pyodide-lock.json` (grep: 0 hits) and is **not** installed
with `loadPackage`. `loadPackage`'s platform-tag check is stricter than micropip's and
rejects this `cp310-abi3-pyemscripten_2026_0_wasm32` wheel. Instead `rsvp.html` fetches
the wheel, writes it into Pyodide's in-memory FS, and installs it from there:

```js
py.FS.writeFile("/tmp/" + HBWHL, new Uint8Array(buf));
await py.runPythonAsync("await micropip.install('emfs:/tmp/" + HBWHL + "')\nimport uharfbuzz as hb\nhb.version_string()");
```

The `emfs:` URI scheme tells micropip to install from the emscripten filesystem, which
accepts the abi3 tag. If you rebuild under a new filename, update `HBWHL` in `rsvp.html`.

---

## 2. `harfbuzzjs/` — HarfBuzz-in-WASM for the JS console + a Fraunces shaping font

**What it is.** The runtime behind `rsvp.html`'s JS-console `shape()` command: HarfBuzz
compiled to WebAssembly, driven from plain JavaScript (mirrors the Python app's
`uharfbuzz`). Three verbatim files from an npm package plus one subset font. Nothing is
recompiled — the wasm is an upstream release blob — so "rebuild" here means re-vendor +
re-subset. Fully **reconstructable** from `harfbuzzjs/README.md` (which carries the shas).

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

---

## 3. `linux/` — v86 emulator + a repacked ISO with a native `hb-shape`

**What it is.** `rsvp.html`'s Linux app boots a tiny Linux in the browser via the v86
emulator and auto-demos the *real*, natively-compiled `hb-shape` CLI. Two moving parts:
verbatim v86 blobs, and a **repacked** boot ISO. Fully **reconstructable** from
`linux/README.md` (which also carries all shas and license pointers).

**GOTCHA — everything self-hosted because of a jsDelivr hang.** The whole reason this dir
exists (rather than loading v86 from a CDN) is that a visitor whose network route to the
CDN silently hung was stranded on "booting…" forever. Keep every boot-path blob local.

**a) v86 + BIOS (verbatim upstream, pinned) — just copy, no build:**

- `libv86.js`, `v86.wasm` from npm **`v86@0.5.424`**
  (`cdn.jsdelivr.net/npm/v86@0.5.424/build/`), BSD-2-Clause, https://github.com/copy/v86.
  sha256 `b80fba71dacb7977e5b46800b3ba194bba7fe13e52fa3d22f80cc060ff015a4e` (libv86.js),
  `aec2c16bb0a1618aa641bb44d9c0fe14681f8c1459fa08c32e3e0562020884e8` (v86.wasm).
- `seabios.bin`, `vgabios.bin` from the v86 repo @ `2f1346b0` `bios/` (SeaBIOS LGPLv3 /
  SeaVGABIOS). sha256 `73e3f359102e3a9982c35fce98eb7cd08f18303ac7f1ba6ebfbe6cdc1c244d98`
  (seabios), `a4bc0d80cc3ca028c73dafa8fee396b8d054ce87ebd8abfbd31b06b437607880` (vgabios).

**b) `linux.iso` — the repacked boot image.** Base is the v86 project's stock Buildroot
demo ISO — **Linux 2.6.34.14 + busybox, i686, serial console** — from
https://github.com/copy/images @ `db92d8fd` (GPLv2). The ext2 ramdisk inside it is grown
and injected with these additions:

- **`/bin/hb-shape` + `/usr/bin/hb-info`** — real HarfBuzz **14.2.1** CLIs, statically
  linked i686/musl (~1.0 MB / ~0.7 MB stripped). Built from
  https://github.com/harfbuzz/harfbuzz @ `9075798`, GLib (LGPL-2.1+) / PCRE2 (BSD-3) /
  zlib linked statically via meson subprojects. Cross toolchain: **musl.cc
  i686-linux-musl-cross (GCC 11.2.1)**. musl (not glibc) is what lets a 2026 binary run
  on a 2010 kernel — glibc ≥ 2.24 statics refuse anything older than Linux 3.2.

  ```sh
  # cross file sets c/cpp_link_args = ['-static','-no-pie']
  meson setup build --cross-file <i686-musl.cross> \
    -Dbuildtype=minsize -Ddefault_library=static \
    -Dglib=enabled -Dgobject=disabled -Dfreetype=disabled -Dcairo=disabled \
    -Dicu=disabled -Dgraphite2=disabled -Dchafa=disabled -Dtests=disabled \
    -Ddocs=disabled -Dutilities=enabled \
    --force-fallback-for=glib,pcre2,libffi,zlib
    # + glib subproject opts disabling nls/xattr/libmount/selinux/introspection/sysprof/tests
  ninja -C build util/hb-shape util/hb-info
  i686-linux-musl-strip build/util/hb-shape build/util/hb-info
  ```
  `hb-info` is deliberately built without cairo/chafa (no glyph previews — name/metrics/
  table/feature queries are the point).

- **`/root/test.ttf`** (hardlinked as `/root/fraunces.ttf`) — "Fraunces 72pt", a ~26 KB
  subset of Fraunces. Source: the variable TTF from https://github.com/google/fonts @
  `4024282` (`ofl/fraunces/`), OFL 1.1 (no RFN, so the subset keeps the Fraunces name).

  ```sh
  fonttools varLib.instancer 'Fraunces[SOFT,WONK,opsz,wght].ttf' \
    opsz=72 wght=400 SOFT=0 WONK=0 --update-name-table
  # then transplant a U+221E ∞ outline (Fraunces ships none) from the Liberation Sans
  # subset below, scaled 2048→2000 UPM, so `hb-shape /root/test.ttf 'markéta ∞ behdad'`
  # shapes clean, then:
  pyftsubset <instanced.ttf> \
    --unicodes=<ASCII, Czech diacritics both cases, ∞, en/em dash, curly quotes, ellipsis, nbsp> \
    --layout-features='*' --glyph-names
  ```

- **`/root/emoji.ttf`** — "Noto Color Emoji", a ~9 KB `hb-subset` (HarfBuzz **11.5.1**)
  cut of Noto Color Emoji COLRv1 (the groom's local build of
  https://github.com/googlefonts/noto-emoji, March 2025; OFL 1.1, no RFN). Kept so
  `hb-shape /root/emoji.ttf '👩‍❤️‍👨'` proves the ZWJ sequence composes to one cluster.

  ```sh
  hb-subset Noto-COLRv1.ttf \
    --unicodes=U+1F468,U+1F469,U+2764,U+FE0F,U+200D --layout-features='*'
  ```

- **`/root/sans.ttf`** — "Loft Sans", a ~28 KB fontTools subset of Liberation Sans
  Regular (ASCII + Czech lowercase diacritics + ∞, GPOS/GSUB kept), renamed because SIL
  OFL 1.1 reserves the "Liberation" name for unmodified builds. (Previously lived at
  `/root/test.ttf` before Fraunces took that slot; it's the ∞ donor above.)
- **`/root/OFL.txt`** — combined attribution + OFL 1.1 text for all three fonts.

**ISO repack recipe (from `linux/README.md`):**

```sh
# grow the ext2 ramdisk (currently ~1.3 MB free); grow ramdisk_size= to match if it fills
resize2fs <ramdisk.img> 6144   # 6144 1K-blocks

# inject files with debugfs -w  (rm / write); the fraunces.ttf hardlink is:
#   debugfs -w -R 'ln /root/test.ttf /root/fraunces.ttf' <img>
#   debugfs -w -R 'sif /root/fraunces.ttf links_count 2' <img>

# repack the ISO, adding ramdisk_size=6144 to the isolinux append line
# (the fs outgrew the kernel's 4 MB ramdisk default)
genisoimage -b isolinux/isolinux.bin -c isolinux/boot.cat \
  -no-emul-boot -boot-load-size 4 -boot-info-table <iso-root>
```

**GOTCHA — the ramdisk ships uncompressed.** A gzipped ramdisk would roughly halve the
ISO, but this kernel build oopses in `rd_load_image`'s decompressor, so it stays
uncompressed and `ramdisk_size=6144` is passed on the isolinux append line.

---

## Deploy note

There is **no build step for the site itself** — `save-the-dates.html` / `rsvp.html` are
hand-edited and served as-is. These three runtimes are the only compiled/packed
deliverables, and they are pinned: don't regenerate or "upgrade" them casually. When you
do rebuild one, ship it under a new content-versioned path and update the reference in
`rsvp.html` (and the size figures in its loading copy, EN + CS).
