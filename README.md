# markéta & behdad

The personal wedding website for **Markéta & Behdad**, live at
[marketa.behdad.org](https://marketa.behdad.org).

Mostly, though, it's a playground of interactive "drops" — each a self-contained little
world you can poke at and explore. If you found your way to this repo, these are the fun
part:

- **Loft Day** — [`loft-day.html`](loft-day.html) — an interactive point-and-click loft:
  an illustrated home you wander room by room. Little games are tucked inside (catch the
  garnishes at the bar, clear the invaders from the office chair…), there's a whole
  console DSL if you open the office monitor, and real self-hosted software runs in a few
  corners — Python, a tiny Linux, classic shooters, a text shaper. It's the good stuff.
- **Egg Hunt** — [`egg-hunt.html`](egg-hunt.html) — a quieter page with a scattering of
  little hidden things to find.

New drops land every so often; each is kept as a frozen archive under its own name so
older ones never disappear. `loft-day.html` and `egg-hunt.html` are just the current
`rsvp.html` and `save-the-dates.html`.

## Documentation

- **[Game manual](docs/game-manual.md)** — how to play, explore the rooms, use the apps,
  and discover the loft's optional systems.
- **[Developer guide](docs/developer.md)** — architecture, state, rendering, testing,
  deployment, and the main subsystem entry points.

## Vibe coded

This whole repository is vibe coded. Humans direct, review, and play-test it, but never
touch the code: AI agents author and maintain the implementation. They own it.

## A note for visitors

This repo is public because the site is public and hobbyist-friendly — poke around if
you're curious how it's made. It's a personal project made with love, not a template or
a product. If you spot a bug or have an idea, the
[issue tracker](https://github.com/behdad/marketa.behdad.org/issues) is open. Thanks
for looking, and enjoy the loft. 💛

## License

- **Code — MIT** ([COPYING](COPYING)): all HTML/CSS/JS authored for this site — the
  pages' inline code, `tests/`, and the tooling and worker scripts. The MIT grant
  covers the authored code only, not the artwork, media, or bundled software below.
- **Original artwork — CC BY-NC 4.0**: the couple's vector illustrations (inline in
  the pages, standalone in `art/`) and the images generated from them. Declaration
  and per-file inventory in [art/COPYING](art/COPYING).
- **All rights reserved**: the two guest artists' live concert recordings (Dan Bern,
  Orit Shimoni — included with permission) and all personal photos, video, and voice
  recordings, listed file by file in [art/COPYING](art/COPYING).
- **Bundled third-party software** (`pyodide/`, `linux/`, `doom/`, `duke/`, `q3/`,
  `dos/`, `harfbuzzjs/`) keeps its own licenses — each directory carries its own
  COPYING / license docs, as does any `princejs/` checkout fetched at deploy time.
