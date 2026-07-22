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
  corners — Python, a tiny Linux, Doom, a text shaper (see below). It's the good stuff.
- **Egg Hunt** — [`egg-hunt.html`](egg-hunt.html) — a quieter page with a scattering of
  little hidden things to find.

New drops land every so often; each is kept as a frozen archive under its own name so
older ones never disappear. `loft-day.html` and `egg-hunt.html` are just the current
`rsvp.html` and `save-the-dates.html`.

## How it's built

Each page is a single, self-contained HTML file — plain HTML, CSS, and vanilla
JavaScript, inline. The illustrations are inline SVG. There is no build step and
nothing to compile — deploying is just a `git pull` into the web root, so whatever is
committed is what's live.

The interface typefaces, Fraunces and Source Serif 4, are loaded from Google Fonts.

## Documentation

- **[Game manual](docs/game-manual.md)** — how to play, explore the rooms, use the apps,
  and discover the loft's optional systems.
- **[Developer guide](docs/developer.md)** — architecture, state, rendering, testing,
  deployment, and the main subsystem entry points.

## Acknowledgments

With thanks to the people who helped shape this:

- **Markéta** — co-design
- **Kasra**, **Garret**, **Mahzad**, & **Ali** — testing

## A note for visitors

This repo is public because the site is public and hobbyist-friendly — poke around if
you're curious how it's made. It's a personal project made with love, not a template or
a product. If you spot a bug or have an idea, the
[issue tracker](https://github.com/behdad/marketa.behdad.org/issues) is open. Thanks
for looking, and enjoy the loft. 💛
