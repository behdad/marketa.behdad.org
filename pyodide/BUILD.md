# BUILD.md — `pyodide/` — the `uharfbuzz` cross-compiled wheel

This documents how the **built** artifact in `pyodide/` was produced, so it can be
rebuilt. It is a companion to `pyodide/README.md` (which covers provenance, shas and
licenses of the *downloaded* blobs) — this file focuses on the piece that was compiled
here, not fetched verbatim. See the root `BUILD.md` for the shared framing (pinned
deliverables, reproducibility caveats, verified-vs-reconstructed convention).

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
