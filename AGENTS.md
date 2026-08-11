# marketa.behdad.org

Save-the-date / wedding website for Markéta & Behdad. Weddings: **May 1, 2027, Edmonton**
(official wedding: ceremony, dinner, concert, dancing, afterparty — venue is industrial
loft on the same block as their loft home apartment) and **July 10, 2027, Prague**
(Markéta's parents' summerhouse) garden party. Message: come to one or both; all loved
ones welcome, small or big.

Pages have no build step or framework. `egg-hunt.html` remains self-contained and is the canonical
save-the-date/Egg Hunt source. `loft-day.html` is the canonical interactive game source, with only
its review-friendly English and Czech message dictionaries split into `loft-day.en.js` and
`loft-day.cs.js`. Keep that boundary narrow. The
save-the-date page *was* `index.html`; it was renamed 2026-07 for the frozen-archive drops model. A landing
`index.html` at the root — a hub linking every drop — is planned but not yet built; until it
exists, `.htaccess` `DirectoryIndex` serves the `save-the-dates.html` alias at `/`. New save-the-date
features go inside `egg-hunt.html` unless there's a strong reason not to. (`loft-day.html`
follows the same rule; its self-hosted runtimes live in `pyodide/` — CPython wasm + wheels — and
`linux/` — v86 + a repacked ISO carrying hb-shape/Fraunces/emoji; provenance in each
dir's README. Both are pinned deliverables, not build outputs: don't regenerate or
"upgrade" them casually, and keep runtime deps zero-CDN except for Google Fonts and
on-demand user imports from the version-pinned official Pyodide package repository —
both owner-confirmed.)

## Workflow (read this first)

- **Every delegated agent must work in its own git worktree and branch.** Never point
  multiple agents at the primary checkout or let agents share a writable worktree.
  Review and integrate each agent's finished commit explicitly into the primary branch;
  remove the temporary worktree only after integration.
- **Commit completed work before starting another feature.** Finish and validate each
  bounded change in its isolated branch, then commit it immediately. Never leave a
  completed feature uncommitted while beginning another one. Give the owner the
  isolated test URL and ask for confirmation after the commit; merge that commit into
  the primary branch and deploy it only after the owner confirms. Handle follow-up
  feedback directly or send it back to the same agent in its isolated worktree.
- **Keep commentary, docs, and tests proportional.** Code comments should explain only
  non-obvious current invariants—not narrate obsolete behavior or routine mechanics.
  Keep `docs/game-manual.md` and `docs/developer.md` concise and relevant to their
  audiences. Add focused tests for meaningful regression risks, not exhaustive coverage
  of every small copy or cosmetic adjustment.
- **Add a `Co-Authored-By` trailer to every commit** with the agent name and model
  family: `Co-Authored-By: Codex (GPT-5) <noreply@openai.com>`.
- **Commit every discrete change immediately after validation; deploy it after owner
  confirmation**, not in one big batch at the end. Do not start the next feature before
  the completed one is committed. After confirmation, push with `git puff` (an alias for
  `git push --force-with-lease`, already configured — just run it, don't second-guess it),
  then `ssh behdad "cd w && git pull"` to deploy.
  `w` on that host is the live web root itself — the git working tree *is* the served
  directory, so anything committed and pulled is instantly live, including files you
  didn't mean to expose (see the `.htaccess` note below).
  A Cloudflare Cache Rule (2026-08) edge-caches the HTML pages (`*.html`, `/`, and the
  extensionless aliases) for 10 minutes, so the public URL can lag a deploy by up to that
  long — deliberate, no purge step. `Cache-Control` request headers won't bypass it; to
  verify a fresh deploy, append a throwaway query string (`?fresh=1` — distinct cache key)
  or wait out the TTL.
- **Always mirror English copy edits into Czech in the same commit.** Never let
  `window.__loftMessages["en"]` in `loft-day.en.js` / `window.__loftMessages["cs"]` in
  `loft-day.cs.js` (or a static HTML fallback) drift out of sync,
  even for a one-word tweak. Keep dictionary keys alphabetically sorted; `check.js` enforces
  recursive key parity and sorting while leaving array order authored.
  Markéta (native Czech speaker) reviews all Czech copy at the end, so don't hold back
  on proposing/editing CS text — she'll correct anything off.
- **Write printable Unicode characters directly as UTF-8.** Do not encode letters,
  diacritics, symbols, emoji, combining marks, or script-range endpoints as backslash-u
  escapes in authored source, tests, or pinned text tables. Non-printable protocol
  controls may use a hexadecimal byte escape instead.
- **Keep the maintained documentation synchronized with the implementation.** Update
  `docs/game-manual.md` when player-visible controls, rules, rooms, apps, or workflows change;
  update `docs/developer.md` when architecture, state ownership, testing, deployment, or subsystem
  entry points change; update `docs/audio.md` whenever the audio graph or lifecycle rules change.
  Keep the two public documentation links in `README.md` accurate. Documentation changes belong in
  the same discrete commit as the behavior they describe whenever practical.
- **Run `node tests/check.js` AND `node tests/state.js` before every commit that
  touches `egg-hunt.html`, `loft-day.html`, or either `loft-day.*.js` message dictionary.**
  Zero-dependency script — `node --check` on each page's authored scripts,
  EN/CS dictionary key parity, `EGG_TOTAL` vs. cheatsheet `<li data-egg>`
  count, `<g>`/`</g>` tag balance in loft-day.html's shared SVG strip, and the JavaScript
  console's `loft.*`-only help/autocomplete boundary (so legacy command tables or private
  controller shortcuts fail immediately). It's cheap
  insurance against exactly the bugs that have bitten this project before (a dropped
  `</g>` that silently broke every stage after the edited one, dictionary keys added to
  one language and not the other). Add more checks to it over time as new bug classes
  turn up — it's meant to grow, not stay frozen at today's coverage. `tests/` is blocked
  from public access via `.htaccess`, same treatment as `AGENTS.md` and its `CLAUDE.md` symlink.
- **Keep `node tests/play.js` for full regression rounds, not the default focused cycle.**
  The headless end-to-end playthrough solves the whole game kitchen→balcony, then click-storms
  every `.hunt-hit` (click + dblclick + Enter), failing on uncaught JS errors, a broken solve
  chain, or missing solve-path elements. Run it when changing that solve chain/shared interaction
  coverage or during the planned test-fixup round. It patches rAF to setTimeout and stubs
  window.open — see its header before changing test plumbing.
- **Run `node tests/enter.js` after changes touching the room `Enter` key behavior** — the
  capture-phase document handler and the per-room `__*DoNext` solve-walkers. It drives ONLY
  the document-level Enter (never per-element clicks): asserts Enter alone walks every room's
  solve to the balcony (kitchen espresso → garden → cuddly → office call/hang-up/monitor/
  dismiss/lamps/butterfly), and that a SOLVED room's Enter fires its toy toggle (kitchen
  day/night, garden party, cuddly projector, office monitor zoom). Same runner as play.js.
- **Run `node tests/menu.js` (and `node tests/laptopmenu.js`) after changes touching the
  right-click / context-menu system** — the shared `.mon-ctx` menus (monitor desktop-dock,
  console `.console-ctx`, the office laptop, the pocket phone app-icons, browser tabs, and
  the in-scene D-pad). They assert each surface shows the right items, suppresses the native
  menu where it should, dismisses on Esc/away, and (for the dock/phone) that a "Kill" resets
  the app. Both use the same one-shot headless runner as play.js.
- **Run `node tests/album-axis.mjs` after changes touching a room's album backdrop or the
  room-shot signature** (`albumPhotoSvg`'s per-room branches, `ALBUM_SKY_SIG`). It rasterises
  each room card in all 8 day/night × weather states and asserts the signature separates two
  states *exactly when* the frames differ materially — catching both duplicate keepsakes and
  suppressed ones. `check.js` cannot do this job: text can see that a branch reads `isNight`,
  not that it only shifts the wall one shade (which is how the bar came to file the same
  photograph twice, twice). It prints its own threshold margin — mind it if you retint a room.
- **The check script doesn't replace manual verification** for anything visual or
  interactive: rendering with headless
  `google-chrome --headless --disable-gpu --window-size=W,H --screenshot=out.png` and
  reading the PNG back; for click/keyboard-triggered behavior, copy the file to a
  scratch file, inject a small `<script>` before `</body>` that dispatches the event
  after a `setTimeout`, then screenshot or `--dump-dom` it. Clean up scratch files after.
  Always check both language versions and both the mobile (~390px) and desktop (≥760px)
  layouts before shipping copy or layout changes.
- **A visitor loading mid-`git pull` gets a TRUNCATED page.** The web root *is* the git working
  tree, so a pull rewrites `loft-day.html` (a multi-megabyte file) **in place** — a fetch landing during the
  write returns partial HTML: no CSS, so every scene stacks vertically and unstyled regions paint
  as black bands. It looks catastrophic and is nothing. **Before believing a "you broke it
  REALLY badly" report, `md5sum` local vs live and try to reproduce at the reporter's viewport** —
  a torn read is far likelier than a real break after a burst of deploys, and the symptom (whole-
  page loss of layout) rarely matches whatever change is suspected. Deploying several times in
  quick succession widens the window. NB the 10-minute edge cache (see the deploy bullet)
  cuts both ways here: an `md5sum`-vs-live mismatch may just be the cache still serving the
  pre-deploy page (compare with a `?fresh=1` cache-buster before concluding anything), and a
  torn read that lands in the edge cache self-heals within 10 minutes.
- **`AGENTS.md` and its `CLAUDE.md` compatibility symlink are blocked from public access via
  `.htaccess`** (the old file was once reachable at `/CLAUDE.md` — the git working tree = web
  root means anything not explicitly blocked is served). If you add other files that
  shouldn't be public (notes, drafts, source assets), block them the same way rather
  than assuming they're private by default.

### Testing / bug-fixing hackathon

- Maintain two explicit task lists: **todo** for incoming/unstarted issues and **fixed, awaiting
  confirmation** for completed issues the owner has not yet accepted. When the owner sends another
  issue while work is in progress, add it to todo without abandoning or mixing it into the active
  issue.
- Always take the smallest outstanding issue next. A genuinely trivial new issue (for example,
  a safe one-line correction) may briefly preempt the active issue when it can be finished
  immediately.
- For larger tasks, suggest delegation or assign bounded, independent work to subagents when that
  will help. The primary agent still owns the task lists, validation, owner confirmation, and
  one-issue-per-commit boundary.
- When a subagent's work returns, prioritize reviewing, validating, and committing it so completed
  work does not sit uncommitted. Preserve that issue's own isolated commit; integrate and deploy it
  only after owner confirmation.
- Handle one issue at a time and never combine unrelated issues in one commit.
- Finish and validate the issue, commit it immediately, report the commit and test URL to the owner,
  and move it to **fixed, awaiting confirmation**. A completed issue must never remain uncommitted
  while another feature begins. Once it is committed, do not idle while waiting for confirmation:
  begin the smallest issue still in todo.
- After the owner confirms a committed issue, integrate that isolated commit into `main`, push, and
  deploy it. Do not merge or deploy an unconfirmed feature.
- Keep each report scoped to the issue just completed so acceptance and commit history remain
  unambiguous.

## Recurring bug classes (each of these has bitten more than once)

- **One-shot animations lose the cascade to id-based state rules.** Infinite state
  animations like `#cuddly-behdad-head.grooving` (music playing) out-specify class-based
  one-shots like `.head-group.chopped`, silently swallowing the reaction. Any one-shot
  on an element that also has an id-based looping state must be id-qualified AND appear
  later in source than the state rule. Also clear sibling one-shot classes before adding
  one, and remove them on `animationend` (check.js verifies removal exists, but it can't
  see specificity conflicts — check computed `animationName` with both classes applied).
- **A CSS `transform` animation replaces the element's `transform` attribute** for its
  duration — an element positioned via `transform="translate(...)"` jumps to its
  unpositioned spot while animating. Bake position into path/rect coordinates, or hang
  the static transform on a wrapper `<g>` (inside or outside) distinct from the animated
  node. (Bit the mic, the lounger flip, the dustpan.)
- **JS-spawned effects break when a target's group gains a transform.** `getBBox()` is
  local coords; inserting the effect anywhere except the target's own parent group puts
  it in a different coordinate system (bit the window-pane gleam after the office window
  was scaled). Spawn effects into the same group as their target.
- **`touch-action` is ignored on SVG children** (no CSS layout box), so it can't stop
  mobile page-panning during object drags. Instead preventDefault a delegated non-passive
  `touchmove` on the strip for touches whose target is a draggable (touch events retarget
  every move to the touchstart element, so one listener covers all).
- **Timer-spawned WAAPI particles accumulate in a backgrounded/unfocused tab.** A
  `setTimeout`-driven ambient spawner (rain, smoke, butterflies, dust motes, shooting
  stars, fireflies, bubbles) keeps firing while the tab is hidden, but the particles'
  animations pause so their `onfinish` removal never runs — they pile up into a freeze
  on return. A `visibilityState !== "hidden"` gate on the spawner is not enough (a
  visible-but-unfocused window still throttles frames). Fixes that actually hold: make
  each particle **self-replenish on its own `onfinish`** (constant count, spawning
  naturally pauses with the frames — used for rain/smoke), or **cap/clear-stale before
  each spawn** (tag the particles with a class and drop the oldest / clear leftovers —
  used for shooting stars, butterflies, dust motes, fireflies, bubbles). Bit repeatedly.
- **A timer-driven one-shot SOUND leaks while the tab is visible-but-UNFOCUSED.** `getSfxCtx()`
  blocks audio while the tab is `hidden`, but it `resume()`s the context on every call, undoing
  the blur/visibility suspend — so any autonomous `setTimeout`/`setInterval` or CSS-`animationend`
  handler that reaches a `play*Sound` while merely unfocused (another window on top — common on
  X11, no occlusion signal) will still sound. The continuous beds all gate on `document.hidden`
  **AND `document.hasFocus()`** (the "crickets/crane rule"); autonomous one-shots must do the same
  (`if (document.hidden || !document.hasFocus()) return;`). Caught the phone-notify buzz and the
  solar-eclipse totality chime firing on their own timers with only a visibility gate. User-
  initiated one-shots are fine — a click implies focus, and getSfxCtx's hidden gate covers the rest.
  (Songs/media-`<audio>` deliberately keep playing while hidden/unfocused — owner's call.)
- **Headless-Chrome testing gotchas**: under `--virtual-time-budget`, `requestAnimationFrame`
  doesn't reliably tick (rAF-double class adds appear to never happen — monkeypatch
  `window.requestAnimationFrame = function (cb) { cb(); return 0; }` in the scratch copy
  before dispatching events), and WAAPI animations fast-forward (you can't screenshot one
  mid-flight). Media queries may also not match the emulated width — verify with
  `matchMedia` output, not assumptions, before trusting a mobile-layout screenshot. Also:
  once a WAAPI transform animation is actively fast-forwarding anywhere on the page,
  `--virtual-time-budget` can make geometry reads (`getBoundingClientRect`, `getScreenCTM`)
  on *any* element — even ones with no relation to the animating one — return stale values;
  confirmed via a raw control query with no app code involved. If a live-geometry read looks
  wrong only while a WAAPI animation is running under `--virtual-time-budget`, test that read
  in isolation (no animation in flight) before concluding the app logic is buggy — separately,
  `getScreenCTM()` on an element does not reliably reflect *that element's own* live CSS
  `translate`/`rotate`/`scale` property (as opposed to the legacy `transform` property) in at
  least one observed engine build, even outside any virtual-time interaction — prefer
  `getBoundingClientRect()` (confirmed reliable) mapped through a *different, static* ancestor's
  `getScreenCTM()` when you need a live-adjustable element's on-screen position (this is what
  `panForElId` and `officeDeskPerch` do). Also: a CSS *transition* triggered by a
  `setTimeout`-added class may never advance under `--virtual-time-budget` — computed
  opacity stays at the start value even though the rule matches (verified via
  `el.matches()` + stylesheet dump). Before concluding a cascade bug, re-probe with
  `transition:none !important` injected; if the value flips, it's this artifact.
  Also: under `--virtual-time-budget`, a group flipped `display:none` → `inline` after load
  (e.g. a season's `sn-*` decor) **never paints** — `--screenshot` shows nothing while
  `getBoundingClientRect`/`getComputedStyle`/`elementsFromPoint` all report it live and
  topmost. The geometry is telling the truth and the paint is lying, so a magenta-fill probe
  won't rescue you. **Screenshot anything season-gated in real CDP Chrome** (recipe 2 in
  `DEBUGGING.md`), which renders it instantly. NB `pkill -f 'remote-debugging-port=9222'`
  kills your own shell (its cmdline contains the pattern) — use a fresh port instead.
  And for a *timed* season test, drive `__applySeason` (the `s`-key/console path), not
  `__setSeason`: the air-quality fetch calls `__applySeasonDate` ~4s in and reverts the strip
  to the real date's decor, silently zeroing anything you were counting.
- **Chrome serves a STALE `file://` page and your whole test run is fiction.** Two separate agents
  hit this: `Network.setCacheDisabled` does **not** defeat it, and reusing a headless Chrome on a
  fixed port can serve the pre-edit `loft-day.html` — producing a full page of confident, meaningless
  PASS/FAIL. Also `Page.navigate` to an identical URL is a *same-document* navigation and never
  reloads (this faked a "bug already present on load"). Fixes: a `?t=<timestamp>` cache-buster, a
  unique port **and profile** per run, and an **`assertFresh` gate** — evaluate something that
  proves the loaded page contains the code under test *before* trusting a single assertion.
- **Don't prove a feature against a value the app never produces.** Two separate agents "proved"
  the sun's rays hit opacity 0 by setting `--smoke:1` by hand — but `--smoke` is a random `.5–1`
  roll that *never reaches 1*, so on a real smoky day the rays sat at ~45% and the owner saw them
  plainly. Both proofs were true and worthless. When a feature is driven by a rolled/derived
  value, **drive it the way the app does** (`loft.environment.season.set("smoky")`, `?date=`) and read the value back
  before asserting on what it produces; only sweep the raw variable as a *supplement*, to show the
  curve's shape.
- **A synchronous `requestAnimationFrame` monkeypatch (`cb()` inline) blows the stack** on any
  rAF-driven *loop* — "Maximum call stack size exceeded" out of `loft.environment.season.set()`/`__goToStage()` is the
  patch recursing, not an app bug. The documented patch is for rAF-double *class adds*; for
  anything that reschedules itself, patch to `setTimeout(cb, 16)` the way `play.js` does.

## Cross-browser gotchas (Safari/WebKit + Firefox)

Found the hard way during the 2026-07 cross-browser pass (tooling recipes in `DEBUGGING.md`).
On **iOS every browser is WebKit** (Apple mandate), so WebKit bugs hit all iPhone/iPad visitors —
the "best in desktop Chrome" nudge only helps desktop.

- **WebKit: layer content inside a foreignObject under an SVG `scale()` renders off-position →
  invisible** ([WebKit bug 23113](https://bugs.webkit.org/show_bug.cgi?id=23113)). Any descendant
  of a `<foreignObject>` (that sits under a `<g transform="scale()">` or a CSS-transform-scaled SVG
  ancestor — e.g. `#office-monitor scale(1.1025)` + the desk-zoom) which creates a **RenderLayer**
  (`position:relative/absolute`, `transform`, `will-change`, `opacity<1`, `z-index`, `filter`) is
  painted at the wrong place and vanishes; plain text / `position:static` blocks paint fine. Fix:
  **de-layer** — CSS grid-stacking (`display:grid` + `grid-area:1/1`) for overlays instead of
  `position:absolute`; no `transform`/`will-change`. (Silenced the whole monitor app surface + the
  dock hover.) `viewBox` scaling does NOT scale foreignObject content at all in WebKit — not a
  workaround. Also gate scrollable panes to `overflow:hidden` under the scale (`auto`/`scroll`
  mispaint once content overflows).
- **WebKit: `<canvas>`/`<video>`/`<iframe>` inside a foreignObject never composite** — blank even
  UNSCALED (they're replaced elements). Fix: render into an off-DOM canvas and blit into a native
  SVG `<image>` via `toDataURL()` each frame (set both `href` + `xlink:href`); SVG `<image>` paints
  everywhere and `mix-blend-mode:screen` still composites on it. (Julia saver, mushroom blooms,
  cuddly flame.) `<video>`/live-camera can't be blitted → accept blank under the monitor scale
  (Doom canvas, video app, photobooth).
- **WebKit ignores `transform-box: fill-box` on `<text>`** (only `<text>` — `<circle>`/`<g>` are
  fine): a scale/rotate pivots against the SVG viewport, not the glyph box, so animated text
  particles fly to the origin. Fix: pivot text particles on their own `(x,y)` in view-box coords.
- **WebKit: a CSS `filter` FUNCTION on an SVG container is a no-op** (`filter:blur()/grayscale()/
  saturate()` on a `<g>`/`<svg>` — computed style shows it, nothing renders). Fix: SVG `<filter>`
  reference (`filter:url(#id)`), animate its primitives via SMIL. (Ketamine/alcohol/iboga trips.)
- **WebKit paints `opacity:0` foreignObjects AND lets them escape the ancestor `overflow:hidden`
  clip** → idle/off-screen foreignObject content (inactive monitor channels in another room) leaks
  a black rectangle into the visible scene. Fix: `visibility:hidden` (WebKit honours it) when the
  owning region isn't shown.
- **Safari hard-caps concurrent `AudioContext`s (~4)** — a page that spins up many (one per bed /
  channel / SFX / pipeline) goes SILENT past the cap on Safari (Chrome/Firefox don't cap). Fix: ONE
  shared AudioContext, many nodes; per-source lifecycle acts on nodes (gain-gate / disconnect),
  never the shared context (see `docs/audio.md`). NB: `createMediaElementSource` on WebKit taps the RAW
  stream and BYPASSES `el.volume` — captured-song volume must ride an in-graph GainNode.
- **Firefox fullscreen:** (a) `width:500%;height:auto` SVG computes a hair-different aspect than the
  pure math, so a JS-sized frame can exceed the rendered scene and stretched side-rails hang below
  it → snap frame height to the actual rendered height; (b) a fullscreen CSS override in a selector
  list containing `:-webkit-full-screen` can be dropped wholesale by Firefox → force critical
  fullscreen props (e.g. `max-width:none`) INLINE; (c) Firefox's fullscreen viewport resize lands
  frames late (and may not fire `resize`) → re-fit on delayed timers, not just rAF.
- **Testing caveats:** WebKit `getScreenCTM()` ignores an ancestor's CSS transform (can't locate a
  CSS-zoomed element on-screen); Playwright-WebKit can't construct `TouchEvent`/`Touch` ("Illegal
  constructor") so multi-touch can't be exercised headless; under `file://`, Chrome/WebKit block
  media subresources (`art/*.opus`) so headless SONG playback is silent though synth SFX still play
  — a red herring vs the real https site.

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
- `art/og-egg-hunt.png` and `art/og-loft-day.png` (1200×630) are generated from
  `tests/social-card-render.html`; `art/apple-touch-icon.png` (180×180) is generated too.
  Regenerate them if the palette or game titles change materially.

## i18n

EN + CZ only. The split dictionaries populate private `window.__loftMessages`; elements carry `data-i="key"` (text,
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
- **Bilingual jokes**: all egg copy lives in the same message dictionary as regular content
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
brief here since the owners already know it: travel/stay pages, photos, RSVP form,
countdown(s), more scene variants, typeface-cocktail menu idea. An "our story"
(how-we-met) section was considered and rejected — not for public disclosure.

## Deploy

Static host; `marketa.behdad.org` self-hosted from a GitHub repo, pulled directly into
the web root (see Workflow above). No build.
