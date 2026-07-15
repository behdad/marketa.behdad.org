# markéta & behdad

The save-the-date / wedding website for **Markéta & Behdad**, live at
[marketa.behdad.org](https://marketa.behdad.org).

We're getting married — twice, and you're invited to one or both:

- **May 1, 2027 — Edmonton.** The official wedding: ceremony, dinner, a concert,
  dancing, and an afterparty.
- **July 10, 2027 — Prague.** A garden party at the family summerhouse.

Come to one, come to both. All our loved ones are welcome, big celebration or small.

## The pages

Each page is a single, self-contained HTML file — no build step, no framework, no
bundler. Open one in a browser and it just runs.

- **[`save-the-dates.html`](save-the-dates.html)** — the save-the-date page: the
  dates, the two parties, and a scattering of little hidden things to find.
- **[`rsvp.html`](rsvp.html)** — an interactive point-and-click loft: a hand-drawn
  scene you can poke at, play with, and explore. It's the fun corner of the site.

The site grows in themed "drops" over time, and each drop is kept as a frozen archive
under its own name (e.g. `egg-hunt.html`, `loft-day.html`) so older versions never
disappear. `save-the-dates.html` and `rsvp.html` are always the current ones.

## How it's built

Plain HTML, CSS, and vanilla JavaScript, inline in each file. The illustrations are
hand-authored inline SVG. There is no build and nothing to compile — deploying is just
a `git pull` into the web root, so whatever is committed is what's live.

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

## A note for visitors

This repo is public because the site is public and hobbyist-friendly — poke around if
you're curious how it's made. It's a personal project made with love, not a template or
a product, so there's no issue tracker or contribution process. If you found your way
here from the site: thank you for looking, and we hope to see you in 2027. 💛
