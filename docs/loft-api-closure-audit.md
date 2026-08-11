# Loft public API closure audit

Internal migration ledger. Apache blocks all Markdown files through `.htaccess`; this is not a
public document.

## Revision boundary

- Final integration base: `5b8c6dbf` (instrument art and weather graphics).
- Migration branch: `refactor/loft-public-api-closure`.
- Candidate range: `5b8c6dbf..HEAD`; record the exact reviewed tip in the independent-review report.
- No merge, push, or deployment has been performed.

## Contract and result

- `window.loft` is the only app-authored public Window root.
- Existing `window.__*` properties remain private integration and test plumbing.
- Bare console commands and compatibility aliases were removed; the console executes real
  JavaScript and all documented/discoverable calls use `loft.*`.
- Split dictionaries and Code manifests use `window.__loftMessages` and
  `window.__loftCodeSnippets`; the old public `T` and `LOFT_CODE_SNIPPETS` globals are absent.
- App-authored classic JavaScript is wrapped in a strict closure. Unreachable console-era private
  facades were removed rather than preserved under a new namespace.
- Lazy third-party loads own their capture, script, listeners, watchdog, and settlement per generation;
  every terminal path removes the temporary Window property and script idempotently. Focused runtime
  regressions exercise success, error/retry, hung reset/cancel, watchdog, stale late load, and repeated
  success across Turnstile, Pyodide, and v86; HarfBuzz remains privately compiled.

## Capability inventory

- Exact main baseline: 207 typed capabilities.
- Candidate: 231 typed capabilities.
- Additions (24):
  - `loft.calendar.birthday.cake/list/next/show`
  - `loft.calendar.date.reset/set/status`
  - `loft.calendar.moment`
  - `loft.calendar.time.reset/set/status`
  - `loft.environment.season.list/next/reset/set/status`
  - `loft.people.irene.pose`
  - `loft.poetry.hafez.read`
  - `loft.poetry.rumi.read`
  - `loft.share.card.open`
  - `loft.sky.aurora.details/intensity`
  - `loft.sky.eclipse.play`
  - `loft.weather.wildfires.intensity`
- Public raw helpers retained where genuinely generic:
  `loft.help`, `loft.util.sleep/random`, `loft.presentation.svg.show/clear`,
  `loft.typography.harfbuzz/font/hb`, and `loft.fonts.google/google.list/local`.
- Removed 21 unreachable private command facades (341 source lines): `album`, `audio`,
  `capabilities`, `clock`, `cocktail`, `dance`, `jukebox`, `lang`, `lanterns`, `mailto`, `music`,
  `pause`, `play`, `porsche`, `prince`, `reboot`, `room`, `snap`, `tetris`, and `weather`.

## Window and lexical audits

Before migration on final main:

- 533 forbidden runtime globals.
- 318 implicit classic-script globals.
- 146 documented globals.
- 74 test files contained 53 legacy direct-command uses.

Candidate repeated runtime result (two strict and two report runs):

- 0 forbidden globals.
- 1,670 private `__*` globals.
- 2,794 verified browser named-element globals.

`node tests/global-static-audit.js` is the durable zero-network AST gate. It uses Node's bundled
Acorn, resolves lexical Window and meta-operation aliases, and rejects public or unclassified
dynamic writes across ordinary, loop, destructuring, nested prototype, `.call`/`.apply`, Object,
and Reflect forms. Checked-in hostile fixtures reproduce every reviewed bypass. Dynamic names are
accepted only when lexical binding and direct-call propagation proves a finite private or temporary
vendor name; there is no filename/function-name exception. `tests/global-surface.js` separately
compares own and inherited runtime baseline descriptors/identities and proves authored DOM-valued
properties cannot claim the named-element exception or hide public state on `Window.prototype`.

## Validation completed

- Mandatory `tests/check.js` and `tests/state.js`: PASS after the latest source commit.
- Typed API, API gating/state/preview, private bootstrap, Python Loft API, Code/Python, console,
  autocomplete, help, birthday/calendar/season/weather, room/party/device/minigame/media,
  Enter/menu/laptop menu, and full `play.js` focused suites were exercised.
- Five focused failures (`sharecard`, `room-progress`, `party-lifecycle`, `device-audio`, `menu`)
  reproduced byte-for-byte on exact main `5b8c6dbf` and are inherited fixtures.
- All nine MJS suites were run once: eight passed; `album-render.mjs` failed with the same
  `HOOK/FIGURES MISSING after wait` failure on exact main.
- An initial concurrent sweep of all 339 JS tests produced 55 failures; serial reruns reduced
  these to 34. Of those, 32 reproduced on exact main. One stale API-closure expectation in
  `device-boot-audio.js` was corrected and now passes; `kid-occupancy.js` was a nondeterministic
  fixture and passed three subsequent candidate runs plus exact main.
- The final closure-specific run passed `private-bootstrap`, API expansion/gating/preview/state/v4,
  Python Code, Python Loft API, drop-down terminal, console, status API, and whole-file Code reset.
  The per-file Code-reset runner produced the exact same output bytes as exact main, including its
  one inherited EN/CS confirmation fixture mismatch.
- Final strict and report Window-surface runs passed: the report found exactly 0 forbidden,
  1,670 private `__*`, and 2,794 verified named-element globals.
- The durable AST audit and every hostile fixture pass with no public or unclassified dynamic
  Window write. Runtime hostile probes reject baseline replacement, an authored DOM-valued global,
  and inherited public surface while the ordinary page retains its zero-forbidden surface.
- Final `check.js`, `state.js`, source `node --check`, and `git diff --check` passed.

## Manual matrix completed

Trusted Chrome CDP input was used against a unique fresh local URL and profile:

- EN and CS desktop, 1280 by 800.
- EN and CS mobile landscape, 844 by 390.
- EN and CS mobile portrait, 390 by 844 (rotation gate visually inspected).

Desktop and landscape probes each found 231 capabilities, zero forbidden globals, typed help,
successful `loft.sky.aurora.details()`, `ReferenceError` for bare `birthday()` and `party()`, and no
uncaught exceptions. Screenshots and the JSON report live under `/dev/shm/loft-api-final-*` and
`/dev/shm/loft-manual-final-report.json`.

## Capability design review

Every newly registered capability is an intentional replacement for behavior that otherwise only
had a retired bare helper or an incomplete boolean facade:

- Birthday list/selection/cake operations share `calendar.birthday`; date and time ownership share
  `calendar.date` and `calendar.time`; `calendar.moment` is the combined pure query.
- Authored season discovery, status, cycling, explicit selection, and automatic reset form one
  symmetrical `environment.season` owner.
- The one share-card renderer is the finite `share.card.open` action.
- Hafez is a side-effect-free query; Rumi is a finite, scene-gated action under `poetry`.
- Wildfire and aurora intensity extend their existing typed environment owners rather than create
  parallel commands. Aurora details is the structured query that the old prose status lacked.
- Irene's named poses extend `people.irene` because the existing boolean `set` deliberately accepts
  only visitation state. Eclipse is a finite sky action and navigates to its Balcony-owned effect.

Arguments are typed and bounded, action/query kinds match side effects, finite lifecycle actions
settle after their visible effect, and unavailable scene behavior reports an exact reason. No new
capability exposes a private controller object or raw DOM state.

## Independent-review handoff

The closure revision must return to the same independent reviewer at its exact final HEAD. No merge,
push, or deployment should happen until that reassessment approves all five acceptance findings.
