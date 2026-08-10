# pyodide/

The self-hosted Python runtime behind Loft Day's Python app: Pyodide v314.0.2
(CPython 3.14.2 compiled to WebAssembly, wasm32/emscripten_5_0_3), trimmed to the
minimal file set this site uses (~15 MB total). Every file is byte-identical to
the official Pyodide release as served by jsDelivr; nothing is rebuilt or patched.

Source: `https://cdn.jsdelivr.net/pyodide/v314.0.2/full/<filename>` (jsDelivr's
mirror of the official Pyodide v314.0.2 release), fetched 2026-07-10.

Core runtime (what `loadPyodide({ indexURL: "pyodide/" })` fetches):

- `pyodide.js` — the loader/API bundle the page's `<script>` tag pulls in (19 KB)
- `pyodide.asm.mjs` — the Emscripten glue module the loader dynamically imports
  (1.25 MB)
- `pyodide.asm.wasm` — CPython 3.14 itself, compiled to WebAssembly (9.6 MB)
- `python_stdlib.zip` — the Python standard library (2.6 MB)
- `pyodide-lock.json` — the release's package index and exact wheel metadata (114 KB)

Wheels the app installs at startup (all three have no dependencies of their own
per pyodide-lock.json, so this is the complete closure):

- `micropip-0.11.1-py3-none-any.whl` — Pyodide's package installer (113 KB)
- `fonttools-4.62.1-py3-none-any.whl` — the groom's library, pre-imported in the
  REPL (1.1 MB)
- `brotli-1.2.0-cp314-cp314-pyemscripten_2026_0_wasm32.whl` — decompression for
  woff2, so TTFont can open the page's mounted webfonts (284 KB)

The core and those starter wheels remain local. Before each user REPL command or Code
script, `loadPackagesFromImports()` scans imports. A package present in the official
lock but absent from this trimmed directory is fetched on demand from the pinned
`https://cdn.jsdelivr.net/pyodide/v314.0.2/full/` repository; for example, a first
`import numpy` downloads the exact v314.0.2 NumPy build, while later imports reuse the
loaded package. This is the sole intentional runtime-CDN exception. `micropip` may also
install compatible pure-Python PyPI wheels when a script requests them explicitly.

Licenses: Pyodide (pyodide.js, pyodide.asm.mjs, pyodide.asm.wasm,
pyodide-lock.json) and micropip are MPL-2.0; python_stdlib.zip is the CPython
standard library, PSF-2.0; fonttools is MIT; Brotli is MIT. License texts ship
inside each wheel's `.dist-info/`, and upstream sources are
https://github.com/pyodide/pyodide, https://github.com/pyodide/micropip,
https://github.com/fonttools/fonttools and https://github.com/google/brotli.

To upgrade: bump the version in the URL above, re-download the five core files,
re-read `pyodide-lock.json` for the current wheel filenames of micropip, fonttools
and brotli (plus anything new in their `depends` lists), and update the filenames
here and the `~15 MB` figure in Loft Day's `py_loading` copy (EN + CS) if the
total moves materially.
