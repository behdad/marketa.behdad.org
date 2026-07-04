# marketa.behdad.org

Save-the-date / wedding website for Markéta & Behdad. Weddings: **May 1, 2027, Edmonton**
(official wedding: ceremony, dinner, concert, dancing, afterparty — venue is industrial
loft on the same block as their loft home apartment)
and **July 10, 2027, Prague** (Markéta's parents' summerhouse) garden party: dinner, music,
dancing, afterparty). Message: come to one or both; all loved ones welcome, small or big.

## Philosophy

Hand-rolled, single-file, no build step, no framework — matching behdad.org and
marketajakesova.ca (minimal typographic personal sites). Keep it that way. New features
should be added inside `index.html` unless there's a strong reason not to. Probably
worth splitting a style.css, but otherwise inline javascript if absolutely necessary.
Take inspiration from their individual websites.

## Design system

- Palette (CSS custom props in `:root`): cream `#f8f5ec`, paper `#fffdf8`, ink `#453a31`,
  muted `#8a7a68`, soft `#9a8a78`, pink `#d9a6a6` / `#c68e95` (his suit), blue `#7f9ec0` /
  `#4a6b94` (her suit), wine `#8e3a4a` (accent, links, `&`), rule `#e8dfcc`.
- Type: Fraunces (display, via Google Fonts) + Source Serif 4 (body). Names are styled
  lowercase: "markéta & behdad", her name first, `&` in wine.
- Signature elements: ∞ section anchors alternating wine/blue (borrowed from their personal
  sites), the crossed-caps motif (pink flat cap = Behdad, blue baker boy cap = Markéta),
  IPA pronunciations + pronouns under the names, pink/blue footer strip.
- Footer credo: "hand-rolled HTML · home-made illustrations".

## i18n

EN + CZ only (Persian explicitly dropped). Dictionary `T` in the inline script; elements
carry `data-i="key"`. Language persists in localStorage, auto-selects `cs` for Czech
browsers. When adding content, add EN + CS strings together. Markéta is a native Czech
speaker — flag any new Czech copy for her review.

## Illustrations

All scenes are inline SVG (also standalone in `art/`), 680×920 viewBox, flat watercolor-ish
vector style. The couple figure group is IDENTICAL across scenes (same coordinates,
x≈214–475, feet ≈y855) — only backgrounds differ. To make a new scene: keep the paper rect
+ figure block, redraw everything between. Behdad: pink suit, burgundy bow tie + brogues,
flat cap, beard, glasses. Markéta: blue suit, blue hair, baker boy cap, patterned blue
shoes, glasses. Scenes: `loft-scene` (Edmonton — brick, factory window, string lights,
fiddle-leaf fig, her guitar), `garden-scene` (Prague), `prague-scene` (Charles Bridge —
currently unused, candidate for a Prague travel page), `caps` (hero motif, also favicon
as data URI).

## Current placeholders / known state

- Contact: marketa@behdad.org (live).
- RSVP: deliberately absent in v1; plan is email or a Google Form later.
- "Add to calendar" links are data-URI .ics files (all-day events) — update if times/venues land.

## v2 backlog (owners' words: "populated over time with new bells & whistles, fun stuff mostly")

- Our story section; travel & stay pages per city; photos.
- Google Form RSVP slot (replace/augment the contact line).
- Countdown(s); venue details in the loft scene once shareable.
- Ideas floated: typeface-named cocktails menu (they co-created drinks at a font-themed
  bar in Lisbon), more scene variants.

## Deploy

Static host; `marketa.behdad.org` self-hosted from a github repo. No build.
