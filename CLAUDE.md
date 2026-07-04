# marketa.behdad.org

Save-the-date / wedding website for Markéta & Behdad. Weddings: **May 1, 2027, Edmonton**
(official wedding: ceremony, dinner, concert, dancing, afterparty — venue is industrial
loft on the same block as their loft home apartment) and **July 10, 2027, Prague**
(Markéta's parents' summerhouse) garden party. Message: come to one or both; all loved
ones welcome, small or big.

Single file: `index.html`. No build step, no framework. Keep it that way — new features
go inside `index.html` unless there's a strong reason not to.

## Workflow (read this first)

- **Commit and deploy after every discrete change**, not in one big batch at the end.
  Push with `git puff` (an alias for `git push --force-with-lease`, already configured —
  just run it, don't second-guess it), then `ssh behdad "cd w && git pull"` to deploy.
  `w` on that host is the live web root itself — the git working tree *is* the served
  directory, so anything committed and pulled is instantly live, including files you
  didn't mean to expose (see the `.htaccess` note below).
- **Always mirror English copy edits into Czech in the same commit.** Never let `T.en`/
  `T.cs` (or a static HTML fallback) drift out of sync, even for a one-word tweak.
  Markéta (native Czech speaker) reviews all Czech copy at the end, so don't hold back
  on proposing/editing CS text — she'll correct anything off.
- **No test suite.** Verify changes by: extracting the inline `<script>` and running
  `node --check` on it (catches syntax errors); rendering with headless
  `google-chrome --headless --disable-gpu --window-size=W,H --screenshot=out.png` and
  reading the PNG back; for click/keyboard-triggered behavior, copy `index.html` to a
  scratch file, inject a small `<script>` before `</body>` that dispatches the event
  after a `setTimeout`, then screenshot or `--dump-dom` it. Clean up scratch files after.
  Always check both language versions and both the mobile (~390px) and desktop (≥760px)
  layouts before shipping copy or layout changes.
- **`CLAUDE.md` is blocked from public access via `.htaccess`** (this file was reachable
  at `/CLAUDE.md` on the live site until that was added — the git working tree = web
  root means anything not explicitly blocked is served). If you add other files that
  shouldn't be public (notes, drafts, source assets), block them the same way rather
  than assuming they're private by default.

## Design system

- Palette (CSS custom props in `:root`): cream `#f8f5ec`, paper `#fffdf8`, ink `#453a31`,
  muted `#716455`, soft `#7d6e5d`, pink `#d9a6a6` / `#c68e95` (his suit), blue `#7f9ec0` /
  `#4a6b94` (her suit), wine `#8e3a4a` (accent, links, `&`), rule `#e8dfcc`. muted/soft
  were darkened from lighter originals to clear WCAG AA 4.5:1 on cream/paper — keep any
  future tweak above that threshold, and keep muted darker than soft.
- Type: Fraunces (display, via Google Fonts — not self-hosted, decided against it) +
  Source Serif 4 (body). Names styled lowercase: "markéta & behdad", her name first, `&`
  in wine.
- Signature elements: ∞ section anchors alternating wine/blue, the crossed-caps motif
  (pink flat cap = Behdad, blue baker boy cap = Markéta), IPA pronunciations + pronouns
  under the names. Footer is just the markéta ∞ behdad cross-link (no credo line).
- Copy uses manual `<br>` hard breaks (not CSS `text-wrap`) at chosen clause boundaries —
  author's preference over browser wrap heuristics. `setLang()` sets `innerHTML` (not
  `textContent`) to support this. Some lines need *different* break points at mobile vs.
  desktop — use `<br class="brk-sm">` (shown only below 760px) and `<br class="brk-lg">`
  (shown only at/above 760px). A break clean at one width can orphan a single word at
  another, so always check both breakpoints (and both languages — CS strings are often
  longer and may need their own `brk-sm`) after editing hard-broken copy.
- Desktop (≥760px): the two party sections sit side by side (`.parties` flex row) with a
  thin `.divider` (vertical rule + small ∞, itself clickable — see easter eggs) between
  them; mobile stacks them and hides the divider.
- `art/og-image.png` (1200×630) and `art/apple-touch-icon.png` (180×180) are generated
  (small standalone HTML rendered via headless Chrome, not hand-drawn) — regenerate if
  the palette/names/tagline change materially.

## i18n

EN + CZ only. Dictionary `T` in the inline script; elements carry `data-i="key"` (text,
via `innerHTML`), `data-href-i="key"` (translated `href`), `data-aria-i="key"` (translated
`aria-label`), `data-title-i="key"` (translated `title` tooltip), or `data-note-key="key"`
(used by `.footnote-mark` elements — one shared click/keydown handler serves multiple
distinct dry-joke asides via this attribute, e.g. the welcome-line footnote vs. the
lang-toggle note). Language persists in localStorage; auto-detect checks the visitor's
*entire* `navigator.languages` list and switches to `cs` if Czech appears anywhere in it.

## Illustrations

All scenes are inline SVG (also standalone in `art/`), 680×920 viewBox, flat
watercolor-ish vector style. The couple figure group is IDENTICAL across scenes (same
coordinates, x≈214–475, feet ≈y855) — only backgrounds differ. To make a new scene: keep
the paper rect + figure block, redraw everything between. Behdad: pink suit, burgundy bow
tie + brogues, flat cap, beard, glasses. Markéta: blue suit, blue hair, baker boy cap,
patterned blue shoes, glasses. Scenes: `loft-scene` (Edmonton), `garden-scene` (Prague),
`prague-scene` (Charles Bridge — unused, candidate for a future Prague travel page),
`caps` (hero motif, also favicon).

Each person's head (skin, hair, glasses, cap) is wrapped in its own `<g id="{scene}-
{person}-head">` for the head-tap easter egg — if you redraw a scene, preserve that
grouping. Interactive/decorative scene details (guitar, plant, tofu box, clapperboard,
book, camera) are each their own `<g id="...">` too; keep new scene details as separate
groups rather than inline paths, even non-interactive ones, in case they need to become
interactive (or trackable) later.

## Easter eggs

The site has 20 hidden things, of which 12 are trackable and 8 are quiet/untracked bonus
finds. Press `?` on the live site to see the current list (it also shows which of the 12
you've found, if any — a live checklist, not a static spoiler).

- **Shared infra**: `eggBubble(anchor, html)` shows a floating tooltip anchored to an
  element (auto-flips above the anchor if there's no room below — it clamps to the
  viewport both axes, learn from the bug where it only clamped horizontally). `eggToast
  (text)` shows a fixed bottom-center toast. `markFound(id)` records a distinct find in
  `localStorage["foundEggs"]` (idempotent — safe to call repeatedly for the same id) and
  fires an `eggToast` counting down remaining finds out of `EGG_TOTAL` (12), or a
  celebration message at 0 remaining.
- **The 12 trackable ids**: `caps`, `head`, `guitar`, `book`, `clapper`, `amp`, `inf`,
  `footnote`, `langnote`, `ipa`, `harfbuzz`, `print`. The `?` cheatsheet's `<li data-egg=
  "...">` attributes must match these exactly, and the count must stay at 12 (view-source
  and console-opening are real bonus finds but aren't reliably trackable in JS, so they're
  deliberately *not* listed in the cheatsheet — keeps "N found" honest).
- **Bilingual jokes**: all egg copy lives in the same `T` dict as regular content
  (`inf_jokes` array, `footnote_text`, `lang_note_text`, `ipa_secret`, `clapper_text`,
  `book_text`, `egg_more`/`egg_done`). Mirror EN/CS same as any other copy. `book_text`
  lists Markéta's three *real* published translations (fetched from her translator
  profile, not invented) — if she publishes more, this is genuinely worth updating rather
  than leaving stale.
- **No more clickable objects in the scene illustrations** — explicit owner call. The
  loft scene in particular is already dense (guitar, plant, tofu box, clapperboard). New
  hobby nods etc. should be static/non-interactive (like the garden camera) unless
  explicitly asked otherwise.
- Skipped by request, don't re-add without asking: a `#cocktails` hidden menu, Konami
  code, keyboard font-feature toggle, and an "achievement tracker" beyond the simple
  progress toast (deemed "too niche" once, then partially walked back into the current
  toast+checklist form — that's the ceiling, don't extend it further unprompted).

## Current placeholders / known state

- Contact: marketa@behdad.org (live). RSVP absent (plan: email or Google Form later).
- "Add to calendar" links removed for now — re-add once times/venues are confirmed.
- Guitar-click audio (`art/tumbala.{opus,mp3}`) is a real recording (Tumbalalaika,
  extracted from `tumbala.mp4` by Behdad directly), not a placeholder. A synthesized
  Web Audio pluck (`playGuitarPluck()`) remains wired as an error fallback only.
- A Google Maps "places we've been together" list was floated as a future feature —
  deferred, no plan yet. See memory (`project_places_map_idea`) if picking this back up.

## v2 backlog

Owners' words: "populated over time with new bells & whistles, fun stuff mostly." Kept
brief here since the owners already know it: our-story section, travel/stay pages,
photos, RSVP form, countdown(s), more scene variants, typeface-cocktail menu idea.

## Deploy

Static host; `marketa.behdad.org` self-hosted from a GitHub repo, pulled directly into
the web root (see Workflow above). No build.
