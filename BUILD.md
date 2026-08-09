# BUILD.md — rebuilding the self-hosted runtimes (index)

This site self-hosts several WebAssembly / emulated runtimes so `loft-day.html`'s consoles
have **zero third-party origin** in their load path (Google Fonts CSS is the site's one
allowed runtime CDN; none of these use it). Every blob is pinned and content-versioned —
`.htaccess` serves the runtime directories as `immutable`, and a rebuild
ships under a new path rather than overwriting in place. These runtimes are the only
compiled/packed deliverables; they are **pinned deliverables, not build outputs** — don't
regenerate or "upgrade" them casually. When you do rebuild one, ship it under a new
content-versioned path and update the reference in `loft-day.html` (and the size figures in
its loading copy, EN + CS).

These per-directory `BUILD.md` files document how the **built** artifacts were produced,
so they can be rebuilt. They are companions to the per-directory `README.md`s (which
cover provenance, shas and licenses of the *downloaded* blobs) — the BUILD files focus on
the pieces that were compiled or repacked here, not fetched verbatim.

Reproducibility note: a matching sha256 in a build file means "the shipped artifact was
produced from the recorded source/tree," **not** that a fresh rebuild is bit-identical —
WASM and cross-compiled toolchains rarely reproduce byte-for-byte. Treat the shas as the
shipped artifact's identity, and the version pins as the recipe. Each build file marks
what is **verified** (from the on-disk build tree / pins / shas) vs. **reconstructed**
(the standard flow, with all versions confirmed, but not pulled from a saved shell log).

## Per-directory build recipes

- [`pyodide/BUILD.md`](pyodide/BUILD.md) — the `uharfbuzz` cross-compiled Pyodide wheel
  (the only built artifact in `pyodide/`; the core Pyodide files + micropip/fonttools/
  brotli wheels are verbatim jsDelivr downloads).
- [`linux/BUILD.md`](linux/BUILD.md) — the v86 emulator blobs + the repacked boot ISO
  carrying a native i686/musl `hb-shape`/`hb-info` and the Fraunces/emoji/Loft Sans fonts.
- [`harfbuzzjs/BUILD.md`](harfbuzzjs/BUILD.md) — HarfBuzz-in-WASM for the JS console
  `shape()` command, plus a re-subset Fraunces shaping TTF.
- [`doom/BUILD.md`](doom/BUILD.md) — the DOOM runtime.
- [`duke/BUILD.md`](duke/BUILD.md) — the emduke32 runtime and exact official shareware archive.
- [`q3/BUILD.md`](q3/BUILD.md) — the ioquake3 runtime and reduced OpenArena arena packs.
- `princejs/` has no build step and is **untracked**: `./fetch-princejs.sh` (repo root) restores
  it from upstream at a pinned SHA and applies `princejs-shim.patch`; provenance and the prune
  list live in that script's header.

Each of these `BUILD.md` files is blocked from public access by `.htaccess`'s basename
`<Files "BUILD.md">` rule (build recipes are internal). The `COPYING` license files that
sit alongside them stay **publicly served** — license compliance travels with the binaries.
