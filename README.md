# markéta & behdad

The personal wedding website for **Markéta & Behdad**, live at
[marketa.behdad.org](https://marketa.behdad.org).

Mostly, though, it's a playground. If you found your way to this repo, the fun part is
the interactive toys — poke around and play:

- **[`rsvp.html`](rsvp.html)** — an interactive point-and-click loft: an illustrated
  home you can wander room by room, poke at, and play with. There are little games
  tucked inside, a whole console DSL if you open the office monitor, and real
  self-hosted software running in a few corners (see below). It's the good stuff.
- **[`save-the-dates.html`](save-the-dates.html)** — the save-the-date page proper,
  with a scattering of little hidden things to find.

## How it's built

Each page is a single, self-contained HTML file — plain HTML, CSS, and vanilla
JavaScript, inline. The illustrations are inline SVG. There is no build step and
nothing to compile — deploying is just a `git pull` into the web root, so whatever is
committed is what's live.

The site grows in themed "drops" over time, and each drop is kept as a frozen archive
under its own name (e.g. `egg-hunt.html`, `loft-day.html`) so older versions never
disappear. `save-the-dates.html` and `rsvp.html` are always the current ones.

The two typefaces (Fraunces + Source Serif 4) come from Google Fonts; everything else
is served from this repo.

## Self-hosted runtimes

The loft has a few playful corners that run real software, entirely self-hosted (no
CDNs) so they keep working forever. Each lives in its own directory with a `BUILD.md`
that documents exactly how the bundle was produced and where it came from:

- [`pyodide/`](pyodide/BUILD.md) — CPython compiled to WebAssembly, plus a couple of
  wheels.
- [`linux/`](linux/BUILD.md) — a small in-browser Linux (v86) with a repacked disk image.
- [`doom/`](doom/BUILD.md) — a WebAssembly build of Doom.
- [`harfbuzzjs/`](harfbuzzjs/BUILD.md) — HarfBuzz (text shaping) compiled for the browser.

These are pinned deliverables, not build outputs — please don't regenerate or "upgrade"
them casually.

## Acknowledgments

With thanks to the people who helped shape this:

- **Markéta Jakešová** — co-design
- **Kasra Rahimi** & **Garret Rieger** — testing & feedback

## A note for visitors

This repo is public because the site is public and hobbyist-friendly — poke around if
you're curious how it's made. It's a personal project made with love, not a template or
a product. If you spot a bug or have an idea, the
[issue tracker](https://github.com/behdad/marketa.behdad.org/issues) is open. Thanks
for looking, and enjoy the loft. 💛
