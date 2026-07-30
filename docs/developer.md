# Developer guide

This guide describes the implementation that exists today, not a proposed rewrite. `rsvp.html`
changes frequently, so search terms are given instead of line numbers. Internal names beginning
with `__` are useful test and debugging seams, but are not a stable public API unless explicitly
noted.

## Repository shape

- `save-the-dates.html` is the invitation/save-the-date page.
- `rsvp.html` is the interactive loft game. Its HTML, CSS, inline SVG, localization dictionaries,
  state, controllers, apps, and scripting console live in one large file.
- `rsvp`/`loft-day` and their `.html` aliases point to `rsvp.html`;
  `save-the-dates`/`egg-hunt` and their `.html` aliases point to `save-the-dates.html`. These are
  public symlinks, not generated routes; keep every alias aligned if a current drop is renamed.
- There is no application framework, package build, or bundling step. Both pages are intended to
  remain directly loadable documents.
- `art/` contains the normal media assets. `pyodide/`, `linux/`, `doom/`, `duke/`, `q3/`,
  and `harfbuzzjs/` contain
  pinned, self-hosted browser runtimes and their provenance. Treat those directories as versioned
  deliverables, not generated build output; root `BUILD.md` indexes their rebuild records.
- `manifest.v2.webmanifest` is the installable Loft Day shell metadata. Its start URL is the
  extensionless `loft-day` alias and its standalone/landscape settings participate in entry-mode
  behavior.
- `chat.js` is the Cloudflare Worker behind `/chat`; `chat-knowledge.json` is the stable knowledge
  supplied to that Worker, and `wrangler.jsonc` owns its route, model selection, secrets contract,
  and edge rate-limit binding.
- `tests/` contains zero-dependency Node/headless-Chrome tests. `tests/lib.js` is the shared runner.
- Markdown, test files, Worker source/configuration, and local environment files are denied by
  `.htaccess`; the static host otherwise serves files from the Git working tree.

The single-file constraint is architectural. Prefer adding a small controller beside the subsystem
it coordinates over introducing a second runtime bundle or a new dependency. The frontend is plain
HTML, CSS, and vanilla JavaScript, with the room illustrations embedded as inline SVG. There is
nothing to compile: committed page artifacts are served directly from the live Git checkout.

In direct `#play`/`loft-day` mode, `:root:not(.revealed)` removes all outer game chrome and lets
the shell use the viewport width subject only to its 2:1 room-height fit. The game-only `main`
has no page padding; the thin shell chrome is the only inset around the room. Fresh CLICK ME adds `.intro-active`; checkpoint entry
uses `.recovery-active`. Both show `.game-langs` in the chrome and a localized `.loft-entry-brand`
inside the scene above CLICK ME or Welcome back, hide Back/Restart,
room navigation, dots, and media transport, retain Fullscreen plus the left utility links, and dock
the one `.watch-controls` node into the shell's bottom row. Fresh entry's `#click-me-overlay`
uses the same translucent scene veil as recovery and consumes its dismissing click, so that click
cannot activate an SVG object underneath. `.hunt-viewport` is an inline-size container; the shared
entry title, CLICK ME prompt, and gap use `cqi` units so their scale follows the rendered scene
rather than the browser viewport. The head script applies `.loft-entry-pending` before
the game shell's first paint in both full RSVP and game-only modes; the checkpoint initializer constructs the chosen gate synchronously
and `revealEntrySurface()` removes that concealment, preventing a kitchen/caption flash. Handing control to the player removes
the entry class, reparents watch controls to their document owner, and restores normal controls.
At `max-width:600px` in portrait, `#portrait-orientation-gate` is the game shell's only
visible child in both full RSVP and direct game modes. Its action enters the existing fullscreen
state owner and chains `screen.orientation.lock("landscape")` after a native fullscreen grant;
manual rotation clears the media query when that API is absent or denied.
`__holdFullscreenFill()` / `__releaseFullscreenFill()` bracket the blocking restart confirmation:
if Chrome revokes native fullscreen for the dialog, the installed/class fill remains active while
ordinary Escape and explicit fullscreen-button exits still clear it.
The prose device/browser detector and recommendation line were removed: their actions are now
direct Fullscreen, audio, and Known issues controls.

### Game chrome test matrix

Changes to the shell, entry screens, controls, fullscreen behavior, or surrounding page layout
must be checked in these four distinct presentations:

1. **Full RSVP page:** load `rsvp.html` without `#play`. The invitation remains the document owner
   around its embedded game. Check desktop and phone widths so game-only rules do not remove or
   overlap the invitation header, language controls, sections, or footer.
2. **Direct browser game:** load the `#play`, `#trailer`, or `#autoplay` entry, or the `loft-day`
   route. On desktop and landscape mobile, check fresh CLICK ME, saved Continue/Start over, and
   active play/presentation. These states share the edge-to-edge page fill but intentionally expose
   different controls and bottom rows.
3. **Installed/standalone app:** repeat direct-game checks with `(display-mode: standalone)` on
   desktop and mobile. Include the installed loading progress, first-interaction fullscreen,
   restart/reset fullscreen preservation, and return from browser-owned dialogs or tabs.
4. **Narrow portrait gate:** at `max-width:600px` in portrait, check both full RSVP and direct game,
   installed and uninstalled where practical. Only the localized Loft Day/orientation banner may
   remain in the shell; verify English and Czech fit, the action attempts landscape, and manual
   rotation reveals the appropriate entry or play state without stale chrome.

`tests/game-only-layout.js` covers the structural variants, `tests/recovery.js` owns the saved-session
transition, and `tests/url-entry.js` checks neutral, Trailer, and Autoplay URL launch behavior with
and without a checkpoint. Still inspect real desktop and approximately 390px mobile renders:
headless geometry does not prove that the chrome is visually balanced.

`setGameOnlyEntered()` adds `.loft-entered` after CLICK ME, Continue, Trailer, or Autoplay hands
over control; that uses a larger height fit without setting `.is-fullscreen`. Direct web play never
auto-enters true fullscreen; only an installed PWA may use its first interaction for that
transition. `enterFs()` timestamps that transition; the post-CLICK-ME caption-location guide reads
it within the same interaction window and uses eight seconds only then, versus four seconds for an
ordinary entry. The fullscreen button and `F` remain explicit. The synchronous mode bootstrap also
adds `.installed-app` from the display-mode/navigator standalone signals.
Immediately inside `<body>`, `#installed-load` uses that already-set class to paint a standalone-only
loading screen before the large game DOM parses. Its small inline controller localizes from the
saved language/full `navigator.languages` list, advances an ARIA progressbar, completes after
`DOMContentLoaded` with a minimum readable dwell, and removes the overlay. Browser mode removes the
node synchronously and sets test hooks without painting it.

The capture-phase room keyboard controller owns one phase-one `activateCurrentRoom()` transition
used by `Enter` and by an otherwise-unconsumed top-level `Escape`. The existing Backspace alias
dispatches a synthetic Escape, so it reaches the same transition even while browser fullscreen
consumes the physical Escape key. Once `__secondRound` is set, all three stop operating rooms:
Escape/Backspace remain dismiss/back gestures and Enter becomes inert. Window-level phone/monitor
closers and component menu/dialog handlers retain first refusal; typing fields never fall through
to a room action. CLICK ME is checked before
`activateCurrentRoom()`: Enter/Escape, including the synthetic Backspace alias, dismisses the
invitation and advances its caption handoff without touching the room underneath.
`dispatchEscape()` is also the single entry point for the top-left back control on every
layout. Restart is a distinct control below Fullscreen at top-right. Both are hidden
with the other navigation controls during recovery and cinematics.

## Self-hosted runtimes

The loft has several features that run real software entirely from this repository, without a CDN.
Each runtime has a `BUILD.md` recording its provenance and build process:

- [`pyodide/`](../pyodide/BUILD.md) contains CPython compiled to WebAssembly and the bundled wheels.
- [`linux/`](../linux/BUILD.md) contains the v86 runtime and a repacked Linux disk image.
- [`doom/`](../doom/BUILD.md) contains the WebAssembly build of Doom.
- [`duke/`](../duke/BUILD.md) contains emduke32 plus the unchanged official shareware archive.
- [`q3/`](../q3/BUILD.md) contains ioquake3 plus the reduced OpenArena arena payload.
- [`dos/`](../dos/BUILD.md) contains js-dos/DOSBox and the owner-supplied
  historical four-player Nibbles executable. The runtime’s corresponding source
  archives are pinned alongside it; no source or open-source claim is made for
  the game executable.
- [`harfbuzzjs/`](../harfbuzzjs/BUILD.md) contains HarfBuzz compiled for the browser.

These directories are pinned, versioned deliverables rather than generated build output. Do not
regenerate or upgrade them casually. Preserve their self-hosted, zero-CDN operation.

### Google Fonts integration

Google Fonts is the deliberate network exception to the self-hosted runtime policy. The page loads
Fraunces and Source Serif 4 for the main interface, Caveat and Climate Crisis for special game
surfaces, and a small Noto Serif IPA subset through normal Google Fonts stylesheets.
The loft's font-programming tools also expose the Google Fonts Developer API at runtime:

- The JavaScript and dropdown consoles provide `googlefonts(family, opts)`. It returns a
  `Uint8Array` containing raw TTF bytes suitable for `hb.Face()` or `hbFont()`. `opts.weight` and
  `opts.italic` select a variant, and `googlefonts.list(query)` lists or filters the catalog.
- The Python app injects `async googlefonts(family, weight=None, italic=False)`. It returns Python
  `bytes` suitable for `uharfbuzz.Face` or `fontTools.ttLib.TTFont`; its attached async
  `googlefonts.list(query)` helper exposes the same catalog.

Both helpers query `webfonts/v1` for a direct TTF URL rather than loading CSS or WOFF2. The browser
API key is necessarily present in client code and must remain HTTP-referrer restricted in Google
Cloud; it is an identifier for the public browser integration, not a server secret. These helpers
require network access even though Pyodide, HarfBuzz, fontTools, Brotli, and the other runtimes are
served locally.

### Code languages and Turtle

The Code is one UI with two execution paths. JavaScript preserves the original
`localStorage["deskScripts"]` map and executes through the Loft's async-IIFE
runner. Python uses `localStorage["deskPythonScripts"]` and hands the complete
buffer to the existing Python app through `__runPythonCode`. The recoverable
`deskCodeDraft` object includes its language. Explicit `.js` and `.py`
filenames select a runtime; an extensionless name retains the manually selected
one. The JS/PY pills open an existing same-basename sibling in the other store;
without one, they retain the text as an unnamed buffer and leave the named
source file untouched. Keep these stores outside checkpoint/reset state.

Python Code jobs queue while self-hosted Pyodide loads, then execute serially
through `runPythonAsync` in the Python console's persistent namespace. stdout,
stderr, results, and tracebacks therefore use the existing Python scrollback.
Closing the app preserves the interpreter and drawing; the Python app's Kill or
Restart path drops queued jobs, the interpreter, and the Turtle surface. Python
execution is still on the browser main thread: the DOM command cap limits
rendered output, but it is not a worker-level interrupt for arbitrary CPU loops.

JavaScript Code opens the existing Console and runs in the page's async-IIFE
environment. `display_svg(source)` sends complete SVG documents to the Console's
native graphics view; its conditional `gfx` control appears only while a
drawing exists and switches between the drawing and scrollback without clearing
either. The bundled `loft-type.js` example shapes
`LoftType` with harfbuzzjs and converts each glyph through
`font.glyphToPath()`. It shares the existing LoftType starter-seed key rather
than adding a separate migration.

The standard-library archive omits desktop `turtle`/Tkinter, so
`installPythonTurtle` writes a small compatibility module into Pyodide's virtual
filesystem before user code runs. That module sends sanitized commands through
`__loftTurtleCommand` to a native SVG surface. Do not replace the surface with a
canvas inside the scaled monitor `foreignObject`; WebKit can paint it blank.
Line, fill, mark, and cursor layers are separate, and retained drawing nodes are
capped at 6,000. The SVG surface owns click and double-click propagation just as
the console `foreignObject` does; otherwise monitor-level click/swap behavior
flickers through the drawing. The compatibility API intentionally covers common
teaching operations, not Tk windows or event bindings. Update
`PYTHON_CODE_INSTRUCTIONS` in `chat.js` whenever the supported Python/Turtle
surface changes.

`loft.display_svg()` uses that same native graphics surface for complete SVG
documents, and `loft.clear_canvas()` clears it. Python and JavaScript share the
DOM parser sanitizer at the page boundary; user code must not insert raw markup
into either monitor surface.

## Game state model

There is no central store. State is distributed across:

- closure variables owned by inline-script IIFEs;
- DOM classes, attributes, and inline CSS variables, often as the rendering source of truth;
- a small set of cross-controller `window.__...` flags and functions;
- the public `window.loft` object and the typed `window.loft.api` facade.

Controllers communicate by calling feature-detected hooks such as
`if (window.__updateSomething) ...` and by re-gating themselves when a room, party, date, focus, or
visibility condition changes. This keeps declaration order loose, but it also means a new state axis
usually needs to notify several existing controllers.

Cross-controller state must have one named transition owner (`set*`, or a paired `begin*`/`stop*`).
UI, typed API, console, restore, reset, cinematic and autoplay paths call that owner instead of
assigning its `window.__...` mirror or rendering classes directly. Private animation counters and
closure-local timers remain local. When a transition schedules delayed work, its stop/reset path
must cancel the handles or invalidate callbacks with a generation token.
Small transient controllers whose state is entirely closure-local may register cleanup with
`__registerTransientResetHook(id, reset)`. Full resets run these hooks in registration order and
isolate exceptions so one failed cleanup cannot strand later controllers. Existing subsystem reset
owners remain explicit; the registry is an additive path, not a replacement for them.

`loft.api` has a registry of typed queries and actions. It validates argument shapes and enum values,
reports capability/availability information, and emits `loft:statechange` after a semantic state
transition. `stateVersion` advances for typed actions and for direct mutations owned by rooms,
daylight, party/BBQ, Messages, apps, calls, music/transport, projector, weather/forecasts, minigame
lifecycle, and Album storage. Composite typed actions coalesce their synchronous owner mutations
into one revision. Visual-only animation frames, minigame score ticks, and every incidental closure
field are deliberately not revisions.

Language is another shared state axis. User-facing copy lives in the `T.en` and `T.cs` dictionaries,
with static fallback text where needed. Any English copy change must be mirrored in Czech.

The checkpoint recovery gate is a modal state boundary. Its capture-phase key handler consumes all
keyboard events before gameplay handlers run, while handling arrow/Enter/Space itself and leaving
browser-default `Tab` focus traversal available. Normal shortcuts become active only after Continue
or Start over removes the gate. While it is present, the normal room instruction is replaced by the
localized saved-room/age summary in `#hunt-caption`; the modal references that caption with
`aria-describedby`, and removing the gate restores the live room caption. Trailer and Autoplay remain
available in the shell's bottom row while the gate hides room navigation, media transport, Back,
Restart, and the dots; the left utility links remain visible. Closing recovery reparents the watch
controls to their document owner. Recovery
Autoplay applies the checkpoint before starting its director, while recovery Trailer holds and
restores the unopened checkpoint around its deterministic reset. Start over clears the checkpoint
directly because the recovery gate is already an explicit destructive choice; the in-game
Restart button, `R` key, and contextual Start over action use `__confirmRestart()`. Recovery Start over passes `enterPageMode` to
`resetHunt()`: the fresh-load CLICK ME state remains unstarted and regains the shared entry chrome,
while `.loft-entered` immediately enlarges its scene. The extinguisher snapshots whether game-only
page mode was already entered before its delayed wipe, then passes the same option to `resetHunt()`;
`R`, contextual Start over, and the public `reset()` console/API command use that extinguisher path. Thus an in-game reset
re-arms CLICK ME without dropping the enlarged view. These contextual reset paths preserve active
`?date=` and `?time=` parameters; the explicit right-side chrome Restart and contextual Start over pass
`resetDateTime:true` and return to the real clock. Cinematic/fresh-load resets omit the option and
retain their own page-mode behavior.

Checkpoint payloads may carry a `systems` map populated by subsystem-owned adapters. Each adapter
validates its compact row and restores around the room transition (`beforeStage`, then `afterStage`
for geometry-dependent state). An absent map identifies a legacy/portable payload, so compatibility
fields remain authoritative until the post-restore save migrates it; a missing row inside a present
map means that subsystem's fresh default. Continue restores
durable intent and settled identity. Stable room utilities may resume once their normal room/focus
gates allow it. Live observations and derived rolls remain fresh; calls, cameras, dialogs, active
timers, spawned effects, runtimes, and live minigame loops stay stopped. Geometry owners capture only
validated settled state and restore it in `afterStage`, never transient drag motion or reactions.
Finite quantities are bounded, and in-flight actions normalize to a safe settled state before capture.
The recovery gate remains mounted as a paint cover through both restore phases, environment and
occasion settlement, and the final room change. `applyCheckpoint` then discards the preview snapshot
before removing the gate, so Continue reveals one settled frame instead of briefly exposing
fresh-page decor or restoring the preview over the checkpoint.
When a larger scene owner can establish presentation during recovery, its manual-state adapter also
settles in `afterStage`, after that owner, so the visitor's saved choice has final authority.
Conditionally rendered keepsakes carry their effective date and restore only after that same date
has rendered the matching scene again; a mismatch settles the scene's fresh default.
Device checkpoints store physical shell state rather than painted app activity; restored shells land
on a normal desktop or launcher so their next action always follows the ordinary fresh path.
Completing the phone's first-open lock immediately schedules a checkpoint, so Continue never asks
for that unlock again.
Separately owned compact app data uses fixed, bounded row allowlists; no additional foreground
drafts, focus, scroll, live media, runtime frames, or other transient state ride with the device shell.

### Trailer lifecycle

Search for `THE TRAILER`, `cinematicTimers`, `paintCineCaption`, and `stopCinematic`. Trailer is a
fixed 59–60 second editorial timeline, separate from Autoplay's director. Its content contract is
**texture, not solutions**: five room identities, small one-shot toys, the real guitar recording,
and one short garden-party swell; no solve chain, roster/spotlight, album capture, formal moment,
season preview, projector channel, monitor/phone workflow, forced aurora, or held balcony couple.
`tests/cine.js` samples those negative invariants throughout playback, because a post-teardown
snapshot alone cannot prove that a payoff was never shown.

Starting Trailer sets `window.__cinematic`, resets to a deterministic daylight kitchen, primes only
the deferred guitar recording inside the trusted click, and adds `.cinematic-running` to the frame.
That presentation class visibility-hides room navigation and Restart without changing layout;
fullscreen and audio controls remain usable. All authored pacing uses `cineBeat`/`runSteps`, while
scene input is capture-swallowed so only synthetic reel taps reach the SVG. `stopCinematic` is the
single cleanup path for natural completion, **Take over**, and hidden-tab abort: it clears timers,
cursor/ripples, party/UV, defensive legacy payoff state, the trailer-owned kitchen candle, caption
classes, and listeners. The reduced-motion branch uses the same room/editorial arc as held tableaux
and completes in about 18 seconds. `goToStage` suppresses `triggerBalconyFinale` while
`window.__cinematic` is true, preserving the one-time first-arrival payoff for actual play.

### Autoplay director

Autoplay is a persistent kiosk director, separate from the fixed Trailer timeline. Search for
`AUTOPLAY (attract mode)`, `AP_SEQUENCE_LIBRARY`, and `AP_MOOD_TRANSITIONS`. Its execution layer is
still one self-rescheduling `setTimeout`; `apBusy` and `apGen` prevent duplicate or stale drivers.
The planning layer has three explicit parts:

- `apState` owns the finite-state machine: `starting`, `overture`, `selecting`, `sequence`,
  `interrupt`, `resuming`, `paused`, `takeover`, and `stopped`. `AP_MACHINE_EDGES` makes illegal
  transitions countable rather than implicit.
- `AP_SEQUENCE_LIBRARY` holds 30 short authored stories across all rooms plus cross-room relays.
  The five showcase builders also serve as first-play solve walkers; solved-room alternatives cover
  apps, party moments, music, calls, toys, weather, photography, food, and the BBQ.
- `apPickSequence` is a constrained weighted Markov choice over eight narrative moods. A candidate's
  score combines its authored base weight, the prior-mood transition multiplier, room age, sequence
  age, and a frontier-solve boost. Exact stories are excluded for five selections, immediate room
  repeats are avoided when alternatives exist, and a room at the starvation boundary becomes a
  hard selection constraint. Randomness comes only from the director's seeded xorshift32 stream;
  never use `Math.random()` for a new autoplay choice.

Notifications suspend the current `{scene, beat, state}` on the one-deep stack, run an interrupt,
then cross the explicit `resuming` state before restoring the exact next beat. Hidden and merely
unfocused tabs enter `paused` without consuming a beat. Takeover and deliberate stop are distinct:
takeover retains the idle-return timer, while `autoplay(false)` clears it. `apOwned` remains the
cleanup inventory for autonomous effects that cannot be inherited safely; panels and the ghost
cursor are unconditionally removed at boundaries/stop.
`apWaitRecovery` keeps URL autoplay (`#autoplay`, plus the legacy `?autoplay` alias) behind the
checkpoint gate, then starts from the restored or reset state only after that modal decision has
completed. `#play` only selects the game shell; `#trailer` starts the fixed cinematic through its
checkpoint-preserving entry path.

For deterministic manual repros, `?keys=p3cm` starts directly in a fresh game with neither the
recovery prompt nor the `CLICK ME` introduction, then sends those ordinary unmodified key gestures
in order after entry settles. Characters are spaced by 180 ms and pass through the real keyboard
handlers; URL-encode punctuation when necessary. This clears only the gameplay checkpoint,
preserving `?date=`, `?time=`, scripts, and other durable apps.

Inspection and deterministic test hooks are `__autoplayMachine()`, `__autoplayModel()`,
`__autoplayCatalog()`, `__autoplaySeed(seed)`, `__autoplayPlan(seed, count)`, and
`__autoplayForceSequence(id)`. The plan preview saves and restores every live selector ledger, so it
must remain side-effect free. `tests/autoplay.js` asserts seeded reproducibility and divergence,
catalog breadth, score-factor visibility, anti-repetition, coverage bounds, FSM transitions,
interrupt resume, pause behavior, cleanup, reduced motion, and the long-running kiosk contract.

## Rooms, phases, and unlocking

The five rooms are `kitchen`, `garden`, `cuddly`, `office`, and `balcony`. Search for `STAGES` and
`goToStage`. They are adjacent groups in one SVG strip; navigation translates the 500%-wide strip by
20% per room.

At rest, room parking keeps only the current SVG stage paintable. During a slide it reveals every
traversed stage. Rapid navigation accumulates those revealed rooms across all in-flight retargets,
because the strip may still be painting over an earlier leg; the final `transitionend` or timeout
fallback parks everything except the latest destination.

The normal first phase is a linear solve:

1. Kitchen/bar espresso sequence.
2. Garden interaction.
3. Cuddly-puddly sequence.
4. Office call/computer/lighting sequence.
5. Balcony arrival and finale.

`stageIndex` tracks the current room and `maxUnlocked` the furthest unlocked room. Normal solve paths
use `__finishSolveAdvance(from, to)`: a delayed completion navigates only if the player is still in
the source room, while still unlocking the destination if the player moved elsewhere. This stale
timer guard is important for keyboard, double-click, and click-storm behavior. It is also the
phase boundary: once `__secondRound` is true it returns without unlocking or navigating. Every
`__*DoNext` solve walker and clue target has the same phase guard, and object-specific delayed
completions (including the cuddly blanket and office butterfly) route through this helper.

`goToStage(name)` is intentionally permissive for scripting and test use: it calls `unlockThrough`,
so directly going to a later room unlocks the intervening rooms. Normal UI arrows and dots remain
gated; a double-click on a locked room dot is an intentional shortcut.

`window.__gameStarted` means the opening/attract prompt has been dismissed. It does not mean phase
two. `window.__secondRound` latches when the garden party first starts. That transition unlocks all
rooms, reveals and synchronizes the party population/roster, releases phase-two-held occasion texts,
clears the remaining phase-one device/door nudges, and retires the entire linear puzzle mechanism.
Turning the party off does not return to phase one; only a full reset clears that session
progression. Explicit room navigation remains available in phase two through dots, arrows, room
number keys, and `goToStage`.

The first balcony arrival owns the one-time finale/Act Two transition. Subsequent solved-room visits
use exploration captions and rotating hints. `goToStage` is also the central room-change re-gate: it
collapses device zoom, tears down or pauses room-local effects, re-evaluates audio, people, weather,
particles, photographer state, and phone/monitor ownership.

### BBQ inventory and grillmaster

The smoker owns food inventory: each of its three persistent grate nodes yields
four servings, then keeps a `.depleted` visual state until the fire cycles off or
the normal smoker reset runs. Inventory reset also invalidates each node's pending
cook generation, preventing an old timeout from browning a newly replenished batch.
The first cooked batch and exhausted inventory trigger Hamid's two one-shot
Messages entries; the first also invokes the deck's bounded `.food-cheer` reaction
and chains two authored replies quoting Hamid's row.
Lighting the smoker latches the grillmaster projection for that complete fire
cycle. Room/focus gates may temporarily hide the projection, but ambient drift
cannot re-roll Hamid (and his nested serving plate) away while the smoker remains
lit; extinguishing or resetting the smoker clears the latch.
Every real serve calls `__balconyGuestTakePlate`: it attaches a short-lived,
opacity-only plate to a present figure's own `.bh-idle` coordinate space, caps
concurrent plates at three, and clears them on room exit.

### Across-street windows and Block Party

Search for `balconyBuildingTetris`, `#balcony-building-window-grid`, and
`__balconyTetrisState`. The controller generates 5×8 clickable physical
office windows, each containing a 2×2 set of square SVG cells. Normal mode applies
one `.lit` state to all four cells in a window. Its single self-rescheduling
ambient timer exists only while the balcony is visible and the document is
focused. It interleaves ordinary single-window changes with a bounded falling
tetromino attract cue; while the party is active it may instead reveal a
temporary silhouetted pair without changing the underlying apartment state.
Watcher probability and idle cadence derive from `__whoIsHere("balcony")`, so
either the main party or BBQ naturally draws more attention as the deck fills.
Room/focus/game transitions clear both effects synchronously. A manual click
toggles exactly one window and two nearby clicks within one second start the game.
`wireNearbyDoubleTap` provides the same screen-space tolerance for the garden chase.
`quickReversalGesture` recognizes the chair and bartender launch shuffles only after
two 18px direction changes within 1.1 seconds, leaving one-way drags and jitter inert.

The minigame owns a 10×16 board, seven-bag pieces, rotation/wall kicks,
line/level scoring (ten lines per level, with the classic NES 60 Hz `GRAVITY_FRAMES` curve), and
`localStorage["balconyTetrisHigh"]`. That personal best
is intentionally outside checkpoint/reset state, matching Invaders, Flair-Catch,
and Pac-Man. Starting snapshots the forty apartment states, pauses running
balcony animations, adds `.tetris-on`, installs the topmost click shield, and
uses a capture-phase keyboard handler so arrows, Space, and Escape cannot reach
global room/audio controls. Touch and primary-button mouse input share the same
axis-locking gesture path: a tap/click rotates, horizontal movement tracks crossed
columns live without replaying them on release, and a downward drag soft- or
hard-drops. Escape, blur, hidden-tab transition, reset, and
programmatic room leave cancel the sole rAF driver and restore the exact snapshot.
Game over performs the same restore, then exposes a bounded `.tetris-result`
state in which Enter or a tap/click can restart. `__balconyTetrisTest` is the narrow deterministic
board/line-clear hook used by `tests/balcony-tetris.js`; it is not a public API.

### Progression transitions

`setSecondRound` owns the phase-two latch, full-room unlock, roster availability and release of held
phase-two messages/cards. Checkpoint restore passes `releaseHeld:false` because it restores the saved
phone state separately. `setMaxUnlocked` owns the room frontier and navigation projection.
`setOfficeProgress` owns the Prague-call and PC-played milestones across play, Enter automation,
checkpoint restore and reset. `setMonitorShorted` owns both the wet-monitor flag and `.shorted`
rendering class; drying and reset call the same transition.
The released garden fairy's Cuddly cameo is projected by `syncRumiFairy`: it requires phase two,
night, a stopped party, and the couple's presence. Phase, party, room, and both manual and automatic
day/night transitions re-run that projection. Its two Rumi bubbles use one bounded rAF follower to
stay attached to the speakers' live head geometry; opening the reply cancels the prior follower, and
detachment stops the loop. `rumiOrder` is Fisher–Yates shuffled once at load; `rumiPick` advances a
wrapping cursor through that fixed deck instead of making per-exchange random draws. Each entry's
parallel `RUMI_GHAZAL` value drives its visible source label. The Hafez-owned `faal()` is a
side-effect-free random reading. The later `rumi()` global consumes the same deck and starts the
scene exchange only when its nighttime fairy is present; outside that projection it returns a
waiting status without advancing `rumiCursor`. Both helpers are mirrored in the console manifest
and `chat.js` scripting guidance. The exchange
holds the existing `behdad-awake` projection from Markéta's
verse through the end of Behdad's reply, then releases it through the normal wake owner; reset and
an interrupted reply clear the same hold.

### Party lifetime

`setGardenParty` is the party source of truth. A separate controller, searchable as
`PARTY LIFECYCLE`, counts attended seconds only while the document is visible, focused, and outside a
cinematic. Elapsed time never ends the party; it only paces later messages and explicit authored
finales. An accepted last-dance/last-song action or cake completion can schedule a graceful ending,
and `party.extend` cancels that pending finale. A later autonomous invitation may offer to restart a
stopped party, but it does not restart by itself.

The toast moment snapshots Ali and Farhang through the people manager before it
starts. A split-room toast follows those assignments instead of animating an
off-room garden figure.

The `setGardenParty(false)` branch is also the authoritative visual teardown boundary. It clears the
balcony switch, persistent UV intent and `.uv-mode` before stopping the disco stepper, camera flash,
photo moments, guest movement, and other party-only drivers. Callers may use `setPartyMode(false)` for
the graceful walk-out, but lower-level cinematic/reset/fallback paths must still leave no blacklight
or timer-owned party effect behind.

### Trip lifecycle

`beginTrip` and `stopTrip` own the active flag and public mirror, current variant, strip classes,
effect timers, creatures, molecule cards, bloom/slideshow loops and reset-time tolerance. Every
interactive trip entry calls `beginTrip`; `startTripVariant` remains the lower-level visual primitive
used by the trailer's deliberately non-gameplay bloom. `tripGeneration` invalidates stale end timers
and double-rAF class additions when a trip is interrupted or reset.

Trip and ambient chemistry captions use the shared temporary-caption owner above the scene.
`__flashCaptionKey` snapshots the current clue, renders a translated key briefly, and restores the
snapshot only if no room change or newer hint has reclaimed the line. Trip teardown and the
molecule-card reset clear only their own caption owner.

The magic box and keyboard shortcuts show molecule cards. Physical prop entries intentionally may
not: the kitchen cream whipper starts uncarded laughing gas after its hiss. The garden frog and
mushroom each use their first click only for their ordinary rasp/wobble and arm independently;
their second and later eligible clicks start their respective uncarded variants. Three lamp rubs
briefly expose the genie as a focusable control; activating it starts uncarded ketamine. Active
laughing gas also reveals the whipper's calendar-style Behdad apparition; its jaw and whole-figure
rise use separate wrappers so their transforms compose. The whipper owns its pending hiss-to-trip
timer and dispensing class through a transient reset hook, so a reset during the squeeze cannot
start laughing gas afterward.

Acid also borrows the ladybug's compound-eye overlay and applies its displacement filter to the
currently viewed room. `clearPriorTripEffects` releases that borrowed effect before replacement,
while acid's natural completion releases it directly; explicit stop/reset reaches the same cleanup.

The canonical direct-selection order is laughing gas, shrooms, acid, froggies, DMT, molly,
ketamine, then iboga (`Shift+1` through `Shift+8`). Keep that order aligned across the keyboard
handler, `trip()` scripting API, typed `trip.start` schema, Worker action schema, translated
shortcut copy, and lifecycle tests when adding or reordering a variant.

Ketamine schedules the roaming ghost four seconds into the trip. Its six-second
catch window is bounded both by `animationend` and a tracked `tripEffectTimers`
timeout, because reduced motion presents the ghost as a static target and emits
no animation event. Catching it removes the hit target before unlocking Pac-Man;
interruption/reset still clears it through `clearPriorTripEffects`.

### Media transitions

`setMusicPausedState` is the only writer of the shared transport-pause mirror and synchronizes its
play/pause UI and party dance-freeze projection. Individual song/projector/dance-bed controllers
still own their AudioNode suspension and call the state transition after changing it.

The Cuddly projector keeps its durable channel in the `projector` checkpoint row. Its cycle starts
coffee→fire in April–September and fire→coffee in October–March, then follows the stable remaining
program order. Coffee is a four-frame native SVG channel with a shared-context synth bed. One
room-, channel-, and visibility-gated timer rotates those frames every 15 seconds and is cleared
before every reschedule. Every projector score, including the night-sky piano, is room-gated to
Cuddly; restored explicit channel state outranks the seasonal fresh/reset default. Screen taps use
the full cycle, including `off`; media-next uses `__cuddlyProjector.next()`, skips `off` at the wrap,
and hands subsequent next actions to the current piano piece once it reaches `stars`.

The film ticket on a far-right Cuddly brick opens `#cinema-room`, an HTML lower
room whose art is native inline SVG. WebKit cannot composite a Vimeo iframe
inside SVG `foreignObject`, so the room remains a viewport sibling of the strip:
entry slides it up from `translateY(100%)` while the preserved Cuddly strip pans
to `translate(-40%,-100%)`. Close reverses both transforms, then applies
`hidden` after the 720 ms transition. The cinema and Prince basement classes
and the Bathroom / Toilets and Entrance lower rooms all suppress the roster and
transient message/call surfaces while they own the viewport.

Chooser cards carry `data-vimeo-id`, an empty `data-vimeo-hash` hook, and a
filled `data-poster` path for their tracked original artwork. A player iframe is
created on selection and removed on Choose another, close, reset, or
`goToStage`, which is the cross-origin playback teardown.
`__cinemaRoomState()` exposes the compact open/closing/playing/video test
surface. Exact background whitelists (`#cuddly-wall`/`#cuddly-ceiling`,
`#garden-wall`, and `#balcony-background`) own the desktop double-click and
touch double-tap shortcuts; interactive descendants are explicitly rejected.
The cinema's brick pattern intentionally repeats Cuddly's 60×32 running bond
and palette. A narrow `MutationObserver` on `#stage-cuddly` mirrors its `dusk`
class to `.cinema-night`, keeping the lower-room window synchronized with every
manual, automatic, restored, and simulated day/night path.
Cinema entry also clears the upstairs Cuddly child and visitor cameos and gates
their schedulers, Totoro audience, fairy, and game groups until the return pan.

`#bathroom-room` is the code-native SVG room below Kitchen / Bar. Its taupe
walls, varied slate floor, clawfoot tub and textiles, sink/mirror, stool, scale,
and separate pale-wood toilet nook are authored entirely in `rsvp.html`; the
rendering uses no raster assets. It uses the same 720 ms overlay lifecycle as
the cinema, with the Kitchen strip parked at `translate(0,-100%)`. Only an exact
`#kitchen-wall` background double-click or double-tap may open it; kitchen
objects cannot bubble into the entrance. `__bathroomRoomState()` exposes
open/closing/hidden state for focused tests.
The nine `[data-bath-action]` SVG controls share one delegated click/keydown
handler, translated labels/tooltips, and the existing shared SFX helpers. Tub,
curtain, and cabinet are local toggles; the other reactions are bounded
one-shots with fallback class cleanup. `closeBathroom()` always calls the same
state reset used by transient teardown, while `__bathroomInteractionState()`
exposes active classes and activation counts to `tests/bathroom-room.js`.

`#entrance-room` is the code-native Balcony lower room. Its inline 680×340 SVG
models the nighttime **The Lofts** facade without image or address assets.
Entry is whitelisted to `#balcony-background`, so objects already owning
double-click gestures remain untouched. The overlay pans up while the Balcony
strip moves to `translate(-80%,-100%)`; close waits 720 ms before applying
`hidden`. `__entranceRoomState()` is the focused lifecycle test surface. Its
capture guard owns Up/Escape/Backspace; horizontal navigation remains on the
lower floor, with Entrance forming its right edge.
Ten `.entrance-prop` SVG overlays give the five window bays, name stone, doors,
paired entry lamps, tree canopy, and sidewalk pointer/touch plus Enter/Space
responses without changing the facade paint order. `data-entrance-action`
selects a restrained shared-SFX/visual response; `closeEntrance()` clears every
in-flight class so no one-shot survives a room leave or reset.
Like the other full-viewport overlays, it refreshes the shared room-ambience
gate on both entry and return so the preserved Balcony cannot keep sounding
under the street scene.

The Office Bedroom follows the same viewport-sibling contract as `#cinema-room`
but is entirely native SVG. Entry pans the preserved Office strip to
`translate(-60%,-100%)`; `__openBedroomRoom()`, `__closeBedroomRoom()`, and
`__bedroomRoomState()` expose its compact lifecycle surface. Only the exact
background ids `#office-wall-bg`, `#office-plaster-bg`, and `#office-floor-bg`
own desktop double-click and touch double-tap entry, so monitor, laptop, room
toys, and other interactive descendants cannot accidentally descend. A narrow
observer mirrors `#stage-office.dusk` into `.bedroom-night`.
Every distinct foreground prop is an SVG `role="button"` with localized
`aria-label`/tooltip copy: stained glass, each wall lamp, wall rack, wardrobe,
bed, and each bedside drawer. The Bedroom's capture-phase key owner translates
Enter/Space on those focused groups into their click path before claiming the
remaining downstairs shortcuts. The interaction controller reuses shared SFX
and clears persistent and one-shot classes on room close, so a return always
starts from the authored composition. `__bedroomRoomState().props` is the
focused regression surface for that cleanup.

All five lower rooms claim the shared `"lower-room"` notification hold. This
reuses the action-game queue: incoming messages enter the thread immediately,
while their preview, unread badge, coach, and call ring stay suppressed. Release
happens only after the 720 ms return pan completes, then the existing 450 ms
queue drain surfaces the newest preview and full unread count upstairs.

The global room-key owner reserves plain `ArrowDown` for all five implemented
upstairs rooms and delegates to their public open hooks; each active lower-room
capture guard owns `ArrowUp` on the way back. `__navigateLowerRoom` maps
Left/Right, side controls, and room dots across the parallel lower-floor row.
It lets `goToStage` settle the destination's main-room state while paired WAAPI
transforms move the source and destination overlays laterally. This runs before
ordinary room shortcuts without changing `D` day/night or Shift+arrow calendar
stepping upstairs.

`goToStage` still closes Bathroom, Cinema, Bedroom, or Entrance and parks an
active basement for ordinary programmatic main-floor navigation.
`__navigateLowerRoom` deliberately performs that teardown inside the paired
lower-floor pan, then opens the destination overlay and reasserts the shared
notification hold after the source's delayed close. A dot bypasses its ordinary
lock gate only while any lower room owns the viewport and restores focus to the
selected dot; keyboard horizontal pans restore focus to `.hunt-viewport`.
Prince focus timers re-check `princeShouldRun()` so a parked iframe cannot steal
focus back after any of these transitions.

### Shared projections

Cross-subsystem scalar projections have one named writer. `setBBQDayPartyState`,
`setBBQPartySessionState`, and the balcony controller's `setBBQSplit` own the cookout flags;
`setPhoneCallFamily` owns the pocket-call family mirror; `setPartyMomentState` owns the keyed
wedding-moment flags. `tests/check.js` counts literal assignment sites for these, progression,
trip, and media projections so a reset or alternate entry path cannot quietly become a second
writer.
`setPartyDanceState` owns the active dance mirror, both SVG `data-dance` projections, formation,
tempo retuning, flare cleanup and bed crossfade. Rotation, explicit selection, party start and party
stop all use it.
Each registered synth dance also needs one `DANCE_BPM` entry, one `DANCE_MOOD` entry, localized
`np` labels, an `AudioTransport` source, volume reapplication, and the typed action/console
allowlists. `checkDanceParity` enforces the registry/BPM/mood portion. The Czech `furiant` bed
states its 2+2+2/3+3 hemiola in both audio and dancer motion; `bandari` is the rolling Persian
6/8 source.

## Rendering and performance lifecycle

The scene is inline SVG, with CSS animations, Web Animations API effects, SMIL where required for
WebKit, and JavaScript-created transient nodes. Treat all four mechanisms as lifecycle-managed
resources.

The Pride Day viewport wash uses one self-rescheduling timeout owned by
`__setPrideDayWashEnabled`. It starts only after `loft:gamestart`, pauses and clears on
blur/visibility loss, yields immediately to trip or molecule-card classes, and is destroyed on
season exit/reset. The office flag's third tap calls the same immediate paint path and never owns
a recurrence timer.

### Room parking

Search for `stage-far`, `stageAnimationParkingActive`, and `__stageParkingState`.

- Every non-current room receives `.stage-far`, which uses `visibility:hidden` to stop paint and to
  prevent WebKit foreign-object leakage.
- During a multi-room slide, every traversed room stays visible until the strip transition finishes;
  otherwise the pan crosses blank geometry.
- Infinite CSS animations in parked room subtrees are paused through WAAPI and resumed at their
  previous progress on entry. Finite one-shot animations are allowed to finish because their
  `animationend` handlers often remove transient classes.
- Animation starts in an already parked subtree are batched into a single document animation
  snapshot. Hidden garden subtrees have a separate pause/resume tracker because the garden can be
  the current room while individual guest/effect groups are not painted.
- Room-specific canvas/DOM loops expose `__sync...Loop` gates and should hold their current frame
  while their app or room is inactive.

### Visibility, focus, and transient effects

Autonomous work must normally pass both `!document.hidden` and `document.hasFocus()`. A visible but
unfocused browser can throttle animation frames while timers continue. This is called the
"crickets rule" in source comments.

Timer-spawned particles cannot rely only on `animation.onfinish` for cleanup: animations pause in a
backgrounded tab while timers may keep adding nodes. Use one of the established patterns:

- self-replenish from `onfinish` for a constant population;
- tag and cap the live nodes, dropping the oldest before spawning;
- hard-clear stale nodes before a bounded burst;
- stop and clear the subsystem on room leave, party off, visibility loss, and reset where relevant.

Search for `capParticles`, `.fw-particle`, `.garden-firefly`, `.dust-mote`, and `fishu-bubble` for
examples. Do not add an uncapped interval-driven SVG/WAAPI emitter.

### SVG/CSS invariants

- A CSS `transform` animation replaces an SVG element's `transform` attribute. Put static
  positioning on a wrapper group or bake it into coordinates.
- `getBBox()` returns local coordinates. Create an effect under the same transformed parent as its
  target unless coordinates are explicitly converted.
- One-shot animation rules on an ID-bearing element must beat any ID-specific infinite-state rule
  in both specificity and source order.
- SVG children do not reliably honor `touch-action`; delegated, non-passive `touchmove` prevention
  on the strip is the established drag pattern.
- Throwable drags request pointer capture and keep window-level move/up/cancel fallbacks for the
  life of the gesture. Capture loss, window blur, or pagehide must restore the object's transition
  and position without applying a drop-target hit.
- The garden magic-box date lock keeps wheel selection and answer submission separate. Its engraved
  date opens the shared in-place phone Calendar; only the full-width submit control compares the
  selected wheels and starts the unlock sequence.
- WebKit has additional `foreignObject`, replaced-element, text transform, filter, and opacity
  constraints documented in `CLAUDE.md` and `DEBUGGING.md`. Check those before changing monitor or
  phone composition.

## Audio architecture

[audio.md](audio.md) is the detailed authority. The core invariant is exactly one shared `AudioContext`,
created by `getAudioCtx()`. Safari has a low concurrent-context limit, so no feature may create and
own an independent context.

Consumers receive graph handles rather than lifecycle ownership of the context:

- ambient beds and room music use `audioBed` and per-bed output gains;
- synthesized one-shot effects use the persistent SFX bus returned by `getSfxCtx()`;
- recorded songs use a media-element processing graph with EQ, muffle/width controls, compression,
  panning, and analysis before the shared destination;
- speech synthesis is browser-owned and outside the Web Audio graph.

`audioBusProxy` makes a per-consumer handle look context-like while redirecting its destination to a
consumer output. A consumer may fade its output, disconnect nodes, and close its handle; it must not
suspend or close the shared context. `resumeSharedAudio()` resumes after a user gesture, and
`__updateSharedAudioIdle()` suspends shared processing when no attended bed/song requires it.

Room and party gates decide whether ambient beds should exist. Autonomous SFX must obey the
visibility-and-focus rule; user-initiated SFX can rely on the gesture/focus path. Songs are
deliberately allowed to continue while hidden or unfocused. Scene volume controls affect music/beds,
while the console volume command controls the master bus. Media captured by
`createMediaElementSource` must use an in-graph gain because WebKit can bypass the element's own
volume.
`__roomAmbienceCovered()` is the foreground-device gate: the pocket phone, zoomed laptop/monitor,
and open cinema stop room-tone beds through `__refreshRoomAmbience()`. The cinema additionally
fades Cuddly projector scores while its overlay is open; Vimeo playback ducks the party and
temporarily owns any already-playing loft song.

Stops should ramp a gain with the subsystem's `fadeSecs`, wait for the fade, then disconnect/close
the handle. Abruptly closing mid-ramp can pop. The recording pipeline has an owner kill switch and a
`?pipeline=` diagnostic override; preserve both when modifying it.

## People, attendance, and photography

The canonical cast/party definitions drive visual population, chat context, and the roster. Search
for `ROSTER`, `__peopleManager`, `__whoIsHere`, `__roomOccupants`, and `__rosterPresence`.

- `__peopleManager` is the inventory boundary. Its `occupants(room, opts)` composes hosts, crew,
  party guests, children, visitors, DJs, Aspen, and room-specific cameos according to what is
  actually painted. `inventory()` returns all rooms plus a canonical key-to-room index,
  `locate(key)` finds one person, and `audit()` reports cross-room duplicates.
- `__whoIsHere(room, opts)` is the compatibility alias for `__peopleManager.occupants`; album,
  roster, chat, and typed API consumers therefore share the same normalized records.
- The Who's Here UI is phase-two-only. It polls cheaply and mutates only when occupancy changes.
  Arrivals appear immediately; departures have a short hysteresis to avoid flicker during movement.
  The accessor itself remains instantaneous; display order follows geometry without gratuitously
  reordering existing rows.
- Opening the roster holds autonomous arrivals/departures. In the garden it also adds
  `.roster-freeze` to the stage, pausing the adult cast while the eight party children remain
  animated; the existing row spotlight temporarily exempts `.spotlighted`. Check
  `rosterHoldsOccupants` before adding another population timer.
- The garden trickle and revolving door deliberately continue while the page is hidden or
  unfocused. Attendance uses persistent classes only; hidden-tab arrival/departure paths settle
  immediately instead of stranding CSS walks. The open roster and the May 2 BBQ split remain
  explicit occupancy holds, and autonomous sound/particle systems retain their separate focus gates.
- Party entry/exit controllers move guests to and from the floor. CSS variables help balance crowd
  placement. Avoid rendering the same person in standing, dance, visitor, and kid-activity layers at
  the same time.
- `attendedGuestNames` records lifetime attendance for one party run, independently of the
  floor-only `.arrived` class. Adult rotation must not clear an attending child's `.arrived`;
  `assignPartyKids()` then gives every attending child exactly one persistent dance/Cuddly/sleep
  home. The ordinary Irene/Robin/Navid Cuddly cameo scheduler is party-off and daylight-only;
  `__updateCuddlyKidCameosForDay` is its day/night projection owner.
- Persistent bar, office, balcony, and grillmaster figures use presence classes with opacity plus
  delayed `visibility`, not `display`, so both arrival and departure can paint as fades.
- The BBQ controller's `bbqHostsOnBalcony` is the single paired-location state for Behdad and
  Markéta. Both balcony layout and the garden split consume it, keeping their two figures and
  garden exclusions atomic.
- One eight-child inventory drives standing dancers, Cuddly seats, chase sprites, and sleep.
  `assignPartyKids()` owns persistent assignments; chase borrows from them temporarily, while
  party Totoro explicitly overrides them with the shared Cuddly audience. Keep
  `PARTY_FLOOR_KIDS`, `KID_WHO`, runner SVG nodes, `ROSTER.runSel`, and the people manager in parity
  when adding a child.
- S'mores and seasonal balcony play use `__balconyBorrowedKids` as another temporary projection
  from the persistent assignment. `__balconyPlayKidsNow` publishes borrowed slots to the people
  manager; `__reconcileBalconyKidsPlay()` is the single projection from door, phase, sleep, date,
  temperature, and daylight state.
- Aspen has garden stations and a photographer presence that can be cloned into other rooms/deck
  contexts. `__roomHasPhotoSubjects(room)` excludes working crew and gates her visible clone,
  camera/flash, shutter, and Album write together; an empty room must not show her or create a
  keepsake. Population controllers, automatic rounds, and explicit `photo.take` all use that same
  occupancy truth.
- Named-guest ambient flares use one self-rescheduling visual-only driver. It runs only while the
  active garden party is visible, focused, and outside a major moment; it never owns sound.

When changing people data, verify all three representations: painted SVG figures, roster/chat
metadata, and photo composition.

## Phone and monitor applications

### Office monitor

The monitor is an SVG/`foreignObject` computer with a desktop, dock, rotating
Julia/Pipes/Flower Box screensavers, and apps. App state
is represented mainly by `show-*` classes on `#office-monitor`. Search for
`__openMonitorApp`, `__closeTopMonitorApp`, `resetMonitorAppState`, and `REAL_APPS`.

The native-SVG `m ∞ b` system menu delegates Reboot/Shut down to the physical PC
tower, so there is no second machine-power owner. Sleep is the separate
monitor-local `monitorSleeping` state: it stops monitor animation loops, unzooms, and covers the
display with a native-SVG dark layer without touching the active `show-*` app classes
or the physical PC. The first pointer press wakes and is consumed, preventing the same
gesture from activating the app below it. `clearBoot()` clears suspension during a
real shutdown or reboot.
CAPS LOCK is a monitor-local state: `monitorLocked` blocks monitor app entry points,
but never captures room or browser shortcuts. Lock initially leaves the Julia saver
visible; monitor activity calls `wakeMonitorLock()` to reveal the cap-matching layer,
and `monitorLockIdleTimer` returns it to the saver. The cap puzzle and an intentional
Caps Lock on/off cycle are equivalent unlock paths. Its small
`localStorage["loftMonitorCapsLock"]` record holds the randomized layout and partial
matches across Continue/reload. Normal monitor unzoom preserves it; the shared
`shutdownMonitorApps()` teardown and a full game reset clear it. The focused lifecycle
probe is `node tests/systemmenu.js`.

`LOFT_CREDITS` is the single structured source for the system-menu credits roll and the
console's bare `credits` command. Human names and package names remain language-neutral;
their roles and the surrounding labels come from `T`. Full third-party notices and
corresponding-source pointers remain in each runtime's public `COPYING` file.

Opening an app boots/pans the monitor if necessary, closes incompatible surfaces, and calls the app's
own render/sync hook. Back/Escape is routed through `__closeTopMonitorApp(stepBack)`: a nested app
view gets the first chance to step back, then the app closes to the desktop. A normal close can
retain app session state; the context-menu Kill path calls `resetMonitorAppState` and must clear it.
The desktop taskbar cell immediately right of its language picker owns the only
shared monitor fullscreen control. It drives the in-page `monitorContentFullscreen`
state without calling the browser Fullscreen API. Apps cover the taskbar, so
their existing Dismiss control returns to the shared enter/exit cell rather than
each app growing another fullscreen button. The desk zoom contains
`#monitor-zoom-box` without a scale cap and with
only a 0.8-unit horizontal safe margin
while `.monitor-content-fullscreen` hides every direct monitor child except the
background and clipped `#office-monitor-screen-content`; the host simultaneously
hides room chrome and becomes a fixed, viewport-filling black layer. The authored 124×42 display
therefore letterboxes without stretching; Escape or a surround tap returns to
the office, while **F** independently owns browser fullscreen. Code, consoles,
media, and embedded games share this lifecycle. Do not add iframe- or app-level
fullscreen buttons casually. Shoot is the sole intentional exception because
all three engines author a 4:3 viewport: its app-level Fullscreen control sits
between Back and Dismiss and requests true browser fullscreen directly on
`#monitor-shoot-host`. The host must remain in its original DOM position:
reparenting an iframe or its host can recreate the browsing context and restart
the active engine. Monitor-content fullscreen remains in place behind Shoot
fullscreen for the same reason, so native Escape returns to the prior monitor
focus without moving an iframe ancestor. The fullscreen host deliberately
exposes no exit control because native Escape owns exit.
Shoot does not retain an iframe across Dismiss: `closeDoom(false)` calls the
immediate, gag-free `destroyDoom()`, while Back returns to the chooser and the
context-menu Kill path alone runs `doomDeathFlash`.
The visible dock order lives in the monitor checkpoint row; drag swaps fixed slots, Continue
restores the order, and the adapter reset restores `DESKTOP_APPS` order.
The transient desktop finder ranks exact hits first and then alphabetizes every
prefix match by its displayed lowercase search name. Canonical ids and localized
labels participate; only Snake retains explicit `nibbles`/`dos` aliases. The
matched spelling is forwarded to an app's open callback so `dos` can select the
bare-shell mode while `snake` and `nibbles` select the game.
All matching tiled apps receive `.search-match`, while the native-SVG dropdown
also exposes search-only and toolbar results without a WebKit RenderLayer.
With an empty query, that same result surface becomes the complete alphabetized
app directory from `DESKTOP_APPS.concat(TOOLBAR_APPS)`. A catalog entry marked
`directoryAlias` remains searchable but does not duplicate its canonical app in
the empty directory. The multi-match state begins neutral: arrows select, while
Enter alone does nothing until a result is selected.
Julia and Pipes share one off-DOM Canvas 2D surface. Its baseline remains 4×
authored size; after three healthy frame windows either saver may rise in
quarter-step tiers as high as 6×. Flower Box owns one lazy
WebGL 1 canvas; its source-derived radial cube morph is updated on the CPU so the
WebGL path and Canvas 2D fallback share geometry, smooth normals, and a slow
24-second hue rotation across the six distinct face colours. Its framebuffer
uses the same adaptive 4×→6× policy. All three
blit into separate native SVG images, the WebKit-safe composition boundary. A
single `saverRaf` owns whichever saver is selected. Each fresh page load shuffles
the three-item order once, then idle cycles walk and wrap that stable order.
Screensaver and expensive canvas/DOM loops are gated while an app owns the screen.
The shared projector/Credits Doom-fire canvas similarly starts at 2× and may
rise to 3×. Every adaptive tier is capped per axis at half the visible
consumer's measured CSS size × `devicePixelRatio`; a non-healthy sample or lost
focus immediately restores the baseline.

Pac-Man is a `searchOnly` monitor app: search, Chat, and test hooks open it in the
office display, but it has no desktop tile and the ghost is not an access gate.
Catching the ketamine ghost instead calls `openPacmanRoomApp`, snapshots the
current room/focus owner, and reparents the same `#monitor-pacman-wrap` into the
HTML `#pacman-room-overlay`. The presentation remains inside `.hunt-viewport`,
so whole-loft fullscreen keeps it with the originating scene; its resize hook
scales the authored 124×42 board without changing monitor layout. Dismiss,
Escape, or Backspace reparents the board to its monitor `foreignObject`, parks
the loop, restores focus and the originating room if anything moved it. The
live board is checkpoint state; normal close parks and retains it, Kill/New
reset it, and the separate `localStorage["pacmanHigh"]` personal best survives
those resets.

PrinceJS is another `searchOnly` app and owns one lazy, same-origin iframe for
both presentations. `openPrinceApp` reparents that iframe into the monitor;
`openPrinceBasement` reparents it into the garden's `#prince-basement` overlay
and pans the room strip down. Ordinary Dismiss, Escape, or Backspace calls
`parkPrinceApp`, pauses the child through `prince-control`, and retains its
browsing context. Kill, Start over, and shutdown call `destroyPrinceApp`.
Fullscreen reparents the same live iframe through `#prince-focus-overlay`,
raises monitor-content fullscreen when required, and requests browser
fullscreen without reloading the level. Parent key routing must yield while
Prince is active but always preserve Ctrl/Cmd/Alt browser chords and the
drop-down console. Parking explicitly restores parent focus because Phaser
otherwise keeps browser shortcuts inside its hidden iframe. The garden overlay
hides the roster and repeats `art/prince-stone.svg`, whose colors are sampled
from the pinned dungeon atlas; narrow stone jambs distinguish the playable
16:10 opening without framing it as a separate screen. The vendored,
zero-CDN runtime and its Unlicense notice live in `princejs/`.

Calendar is also `searchOnly` on the monitor desktop. Its centered date/countdown
menu-bar control remains the primary pointer entry point; the phone launcher is a
separate catalog and is unchanged.

System Information is also a `searchOnly` `DESKTOP_APPS` entry. Its `show-system`
class participates in the same running-app registry and in-app context menu as
the tiled apps: ordinary close removes only the foreground class, while
`__killMonitorSystem` clears the registry and runs the diagnostic-receipt
send-off. The status value itself owns the browser-specific GitHub issue link.

Classics is one tiled app with three internal views on the existing `show-mines`
task class: chooser, Mines, and Solitaire. `openClassicsApp` and
`setClassicsView` own that view state; the search-only `mines` and `solitaire`
catalog aliases and their public console commands bypass the chooser without
creating separate running tasks. Back/Escape steps a game to the chooser, while
Dismiss closes the chooser. Kill dispatches by current view: the chooser
collapses into a deck, Mines keeps its chain reaction, and Solitaire deals the
52 Pickup scatter. `resetMonitorAppState("classics")` returns the combined app
to a fresh chooser.

Solitaire owns plain card records in `solStock`, `solWaste`, `solTableau`, and
`solFoundations`; `solitaireMove` is the shared legality/mutation path for click,
double-click, drag, and focused tests. Its actual-size DOM drag stack lives outside
the scaled SVG `foreignObject` while the in-pile source cards hide in place; a
non-passive touch-move fallback both keeps Android
from claiming the gesture and paints the live ghost when transformed pointer
movement is delayed. Drag completion listens at `window` scope so failed pointer
capture cannot lose the release. Mines suppresses Android's synthetic
`contextmenu` after its own hold-to-flag timer so one hold cannot toggle twice.
The page-wide touch context bridge turns a stationary one-finger hold into the
same `contextmenu` event used by mouse input. Movement cancels the hold before
any default is prevented, preserving scroll and drag; Mines cells and Messages
rows stay excluded because their own holds flag and open message actions. The
bridge suppresses only the compatibility mouse sequence after an existing
context-menu handler claims the synthesized event. All `.mon-ctx` builders mount
through `contextMenuHost()`; appending to `document.body` makes an otherwise-open
menu invisible while the game subtree owns browser fullscreen.
One `MutationObserver` augments every `.mon-ctx` and `.console-ctx` after its
owner builds it, appending the separated whole-loft **Start over** action as the
final item and reclamping the taller menu. App menus expose Kill, not a redundant
Restart; Start over confirms and routes through `__requestLoftReset()` and the
existing extinguisher wipe.
The individual app surfaces remain de-layered and gated by `visibility` plus
`pointer-events` for WebKit. Focused regressions are `node tests/classics.js`
and `node tests/classics-touch.mjs`.

The maze uses a DOM/CSS grid because canvas does not composite reliably in the scaled WebKit
`foreignObject`. Its actors depend on grid source order and must not gain RenderLayer-producing
styles such as positioning, transforms, opacity, filters, or z-index. One bounded scheduler owns
the tile simulation; rAF only interpolates display. Input may update the buffered direction but
must never clear/re-arm that scheduler, or held input starves the simulation. The loop gates on
either presentation owner, focus, visibility, and Kill state.

Pac-Man's capture-phase handler must remain ahead of the page-wide transport handler so active-game
Space pauses Pac-Man rather than music. The room presentation's window-capture Escape owner must
also remain ahead of office zoom/global room Escape handlers; Backspace reaches it through the
shared synthetic-Escape path without exiting browser fullscreen. Pointer buttons and drag gestures
feed the same direction owner. `tests/pacman.js` owns both launch presentations, origin restoration,
simulation cadence, input, pause/resume, checkpoint, Kill, and reduced-motion coverage.

Life compares each computed generation with its source board. An empty board or a non-empty
fixed point pauses through the normal `lifePause` owner; period-two and longer oscillators keep
running. Every direct board mutation clears the diagnostic `lifeStationary` flag.

The tiled **shoot** app retains the existing `show-doom` ownership class and FATALITY
Kill hook, but its foreground state is `data-shoot-view="chooser|doom|duke|q3"`.
Keeping one show-class preserves desktop task registration, context menus, monitor
occlusion, and the established gag.

All three engines run in one disposable same-origin iframe created lazily inside
`#monitor-shoot-host`. Each `player.html` receives `shoot-control` messages and
gates its main loop and engine-owned audio contexts on foreground, room, document
visibility, and focus. A normal app close retains and pauses the current frame;
Back, chooser selection, Kill, and Restart remove it. The iframe boundary therefore
hard-stops each engine's heap, canvas, listeners, and document title without patching
third-party glue. Every player uses the same centered 4:3 contain contract.

The child reports pointer-lock acquisition to the parent. The parent shows the
localized `Esc releases mouse` coach for the entire active game session; it is
native SVG on the lower bezel, outside the clipped game screen, and never
intercepts input. Returning to the chooser removes it.

Quake III loads the OpenArena `oa_shine` arena and a local bot from the pinned
minimal pack. Its WebGL path explicitly selects the OpenGL2 GLES renderer while
disabling HDR, postprocessing, tonemapping, auto-exposure, and advanced material
mapping: those desktop-oriented paths do not render the OA lightmaps correctly in
this Emscripten/WebGL build. Like every
canvas/video/iframe inside the scaled monitor `foreignObject`, these game rasters
remain a known blank-compositing limitation on WebKit.

The `show-snake` app lazily creates one same-origin `dos/player.html` iframe,
with a `mode=dos|nibbles` query selected by the launcher.
The child owns js-dos and DOSBox; parent `snake-control` messages pause, resume,
or stop it. Normal close pauses and retains the frame, but marks the hidden
iframe inert, blurs its child focus, and focuses the non-interactive desktop
root so the desktop receives the very next key without a click. Reopen clears `inert`
before focusing the DOS canvas. Kill (and the internal
restart helper used by console commands) calls `player.stop()` and removes the
iframe, which releases the WASM machine and all child listeners. Child readiness
gates runtime Kill, and a normalized `snake-context` bridge reuses the monitor’s
ordinary Kill menu. The
pinned bundle carries the owner-supplied historical Nibbles build modified by
`bigbug` for four-player support. `player.html` overlays only
`.jsdos/dosbox.conf` at runtime: DOS mode mounts the bundle at a bare `C:\>`
prompt, while Nibbles mode runs the game once and exits DOSBox afterward. The
child's captured Esc reaches DOSBox, then sends `snake-exit`; the parent tears
down the completed game and returns to the monitor. Repacking, hashes, and
provenance live in `dos/BUILD.md`.

Weather and Clock are toolbar-only monitor apps rather than desktop tiles. The
Clock's `renderClock`/`__renderLoftClock` renderer is shared with the pocket phone;
surface-specific activity and close callbacks own interval lifetime and sunrise/
sunset navigation without duplicating the four-city time grid, countdown, or
time-travel logic. Its monitor range uses minute units while the pocket-phone
range uses half-hour units. Reset visibility is derived from an explicit
`?time=` override, not the synthetic day-lapse clock.

The in-app Kill overrides give Doom, Console, Python, Linux, Code, Life, Call, Music, Chat,
Video, Browser, System, and About their own staged gag before teardown. They all use
`__runMonitorDeathFlash` so
cancellation, caption ownership, reduced-motion behavior, and the final close share one lifecycle.
Video progress and volume drags use window-scoped pointer tracking for mouse/pen
and direct native touch tracking for Android; transformed-`foreignObject` pointer
capture is not assumed to succeed. A document-capture coordinate router additionally
owns Android touch pointers over the chooser and sliders because a transformed
`foreignObject` can paint those controls correctly while hit-testing the film beneath.
Call first clears every owned connect/goodbye timer and ambient source, then drops its signal bars
and waveform before the silent hang-up. Music cancels track fades/snippets, scratches and slows the
live media element while its SVG notes leave the staff, then pauses and rewinds every catalog track,
clears the current selection, and flattens the manual EQ. Chat freezes pending transport and
verification work, types its interrupted thought, collapses rendered rows into context tokens,
displays `[context cleared]`, then resets its history and closes.
Video captures its selected track before freeze/reset and gates one of three native-SVG overlays;
paused and ended films therefore keep their own send-off, while teardown clears the captured
variant and resets the playlist as before.

The shared frame-health sampler exposes `__frameHealthState()` and marks sustained
low delivery with `html.frame-rate-low`. It samples only while the document is
visible and focused, requires two 1.2-second windows at or below 40 FPS to enter slow
mode, and three windows at or above 50 FPS to recover. Those same three healthy
windows expose the `high` quality tier when the party is not active; one sample
below 50 FPS, blur, or hiding the page drops it immediately. The garden disco pools and
night constellations use that state: healthy delivery runs their continuous CSS
motion, while low-frame mode replaces it with roughly one-second discrete steps.
The garden's full-scene UV wash similarly becomes a slow four-step lighting cue; it
still breathes, but no longer requests a blended full-scene repaint on every frame.
Asymmetric thresholds plus consecutive sampling windows keep the cost change
itself from flapping the mode.

Desk zoom is unconditionally transition-free. Testing on current Chrome and
Chrome 138 showed that interpolating the whole scaled SVG could white-flash and
temporarily reduce frame delivery even when the pre-transition scene held 60 FPS;
reacting to the resulting dip cannot prevent that first bad transition. The zoom
controller therefore commits both directions with `transition:none`, then restores
the strip's transition for ordinary room pans. The garden mask's rapid-click
counter calls idempotent `__openDropTerm()` on its third click, giving touch-only
devices access to the console FPS meter without making a double-click alter party
state. `tests/performance.js` drives the sampler through `__frameHealthFeed(fps)` to
verify both hysteresis directions without relying on headless timing.

### Pocket phone

The phone is a lazily built HTML modal with launcher, app, and in-call screens. Search for
`openApp`, `navBack`, `phoneAppReturn`, and `setPhoneAppReturn`. Its first ordinary open can show the
math lock; explicit/cinematic deep links may skip it. The four shell surfaces share one grid cell
and a short opacity/translate handoff; reduced-motion mode keeps the same state changes without
motion. `setPhoneAppReturn` is the only owner of the
app-level return transition: launcher, close phone, or return to Messages.
Call portraits and local self-views reuse the office call-card helpers
(`__callFigLabel` and `__callHostLabel`) so their translated roles, relationships,
and fun facts stay aligned across the laptop, monitor, and pocket phone.

Back behavior depends on entry context:

- nested app detail views consume Back first;
- an app launched from a Messages action returns to Messages;
- a direct scene notification opens Messages as a deep link, so Back/Escape closes the phone rather
  than exposing the launcher;
- scene-level deep links use `__openPhoneAppHere(app, true)` for direct-close behavior: Aspen's
  post-shutter Album, the magic-box Calendar clue, and the date/time HUD pills;
- typed `app.open` actions are direct too, so they close the phone on Back/Escape; a Messages action
  replaces that target with an explicit return to its thread. Interactive `phone("app")` console
  commands retain ordinary app-to-launcher navigation;
- an ordinary app returns to the phone home screen;
- leaving the owning room closes the phone.

Some app data is session-sticky across close/reopen: drafts, filters, current cards, saved
photobooth output, and similar state. Kill, uninstall, or full reset must clear the app's documented
retained state. Adding an app therefore requires an open path, a teardown path, Back semantics,
context-menu behavior, and reset coverage.

Launcher badges are a projection of their owning stores, not a parallel notification ledger.
`phoneAppNotificationCount` derives Messages from `unreadCount()`, Mail from `mailRead`, and Album
from non-`shoot` record ids newer than the session-local `albumSeenMaxId`; zero counts stay hidden.
Store mutations call `updatePhoneHomeBadges` when the launcher may already be visible, while a fresh
`renderHome` recomputes every installed tile. Opening Album advances its seen watermark without
altering the Album records.

Album recap is a derived presentation, not another photo store: after phase 2, while the party is
off, it groups existing non-`shoot` records by semantic record kind. Seed photos remain in the full
roll only. `albumRecapOpen` is session UI state and must not leak into checkpoint records or
`album.list`; record ownership, caps, object-URL cleanup, and recovery remain with the ordinary
Album store.

The launcher owns touch gestures that begin on app icons because those icons use
`touch-action:none` for rearrangement. A quick vertical drag updates the launcher scroll position;
holding briefly before movement enters icon-reorder mode. Keep that distinction when changing the
grid so short phone screens do not leave only the gaps as usable scroll targets.

Madla's autonomous incoming call observes `__madlaAvailable()`: phase 2 must be latched and the
party must be off. Explicit discovery/scripting paths (`madla()` and the cuddly outlet) use
`__madlaRingForced()` and may bypass only that phase/party gate; busy calls and an open phone still
prevent a second call. The forced flag follows the ring into `__answerMadla(true)`, so an explicitly
requested call remains answerable if the party or phase has not changed.

## Dates, calendar, weather, and time

`window.__now()` is the canonical calendar-date source for date-driven presentation. `?date=` (and
the legacy hash form) overrides the calendar date at local noon to avoid DST edges. It drives
wedding/anniversary presentation, seasons, birthdays, Persian occasions, countdowns, moon/sun
geometry, calendar tiles, and special-day messages. It does not freeze the wall clock.

`?time=` selects an Edmonton wall-clock starting time that then advances at real speed. Search for
`timeOverrideMins`, `__ovClock`, and `__setLoftTime`. Day/night and twilight use computed solar
geometry for the selected date and Edmonton time. Automatic crossing changes start only after the
kitchen is solved and yield to explicit season/date previews, trips, cinematics, autoplay, and
party-forced night. Focus/visibility catch-up handles a crossing missed while away.

The shared calendar renderer serves monitor and phone views. Canonical wedding event definitions
also generate calendar downloads and external calendar links. Birthday/occasion definitions and
Persian dates are runtime code; avoid duplicating dates in another UI data source. Wedding event
cards update only the renderer's displayed month; grid days and search results own date activation
and special-day scene dispatch. Both surfaces retain their permanent Today control for returning
the browsed month and loft date to the real day. The room-level `.loft-datenav` instead owns the
override-only `#loft-datereset`: it calls `calResetToday()`, clears only `date` from the URL,
re-seeds an open calendar from the real month, and leaves a time override and unrelated loft state
intact. `__activatePolyamoryDay` explicitly ends party mode before the Cuddly-puddly pan so the
four-person couch scene is not hidden by party occupancy.

Birthday adornments are nested inside each rendered figure so they inherit its authored transforms.
Birthday cake eligibility is derived from matching `.g-<who>` figures on the dance floor; station-
and call-only people retain their authored venue without a parallel eligibility roster.
Chase-runner adornments have an additional outer-runner gate: a parked or reduced-motion-suppressed
runner must hide its child hat, while `.chasing` reveals the hat with the moving figure. Keep that
selector scoped to the direct `#stage-garden` runner children; their `garden-kid-*-body` descendants
never carry `.chasing`.

Weather is fetched client-side for Edmonton and Prague, with current conditions and multi-day data.
When `?date=` or `?time=` selects another Edmonton moment, the current Edmonton reading is replaced
by Open-Meteo archive data. Past dates use their exact archive day; current or future dates use the
median temperature and modal weather family from the five most recent matching calendar dates.
The UI marks these reconstructed Edmonton readings with `≈`, and the approximation metadata is
included in Charlie's context. Hour changes reuse cached hourly archive rows.

The garden mini-split's indoor reading combines the weather-derived/furnace baseline, blind and AC,
storm leakage, a lagged one-degree-per-three-person occupancy gain, and a small random walk. Trips
are thermally neutral except Molly: `mollyGain` rises one degree per 1.2-second thermal tick to a
five-degree ceiling, then sheds half a degree per tick after Molly ends. The exposed
`__indoorTempState()` includes both occupancy and Molly contributions.
Indoor and outdoor models remain Celsius internally; their independent C/F display preferences
affect only the mini-split LCD, wall readout, and outdoor control.

The implementation also retrieves aviation observations, Edmonton air quality, and geomagnetic
forecast data for scene effects. Search for `api.open-meteo.com`, `archive-api.open-meteo.com`,
`__realWx`, `__weatherApprox`, `__realOutdoorC`, `__realPragueC`, and `__realDaily`. Missing or
failed network data falls back to the simulated scene model; UI and Charlie context must tolerate
`null`. Console temperature overrides intentionally separate the simulated outdoor model from live
or reconstructed readings until reset.

Wildfire haze combines Edmonton PM2.5 with the Jul 16–Aug 31 seasonal ramp in `smokeLevelFor`.
The stronger raw input wins, then a `0.5` presentation gain keeps the orange-sun/haze beat from
dominating the rooms; console overrides pass through that same visual gain.

## Messages

Messages is a chronological, session-local wedding group chat. Search for `var MESSAGES`,
`messagesThread`, `CUE_POOL`, and `DAY_POOL`.

### Authored and autonomous delivery

`MESSAGES` is the authored catalog. Entries may have localized sender/body keys, randomized pools,
images, reply targets, chained follow-ups, arrival side effects, and a typed app/scene action. Direct
story beats call `__deliverPhoneMessage(id)` and bypass moment deferral once phase-two eligibility and
deduplication checks pass.

Autonomous sources include party cue drips, daytime drips, visitors, occasion/birthday events,
Charlie discovery, party lifecycle prompts, and chained authored follow-ups. Their schedulers:

- re-check phase, party/day/time, focus, visibility, cinematic, autoplay, and attended-player gates
  when a timer fires;
- deduplicate authored IDs per session;
- slow down when unread pressure grows and stop adding normal autonomous messages at the unread cap;
- hold one-shot occasion messages requested during phase one, while recurring drips simply retry in
  their valid phase-two context;
- still add an unread row when appropriate, but buzz/show a scene notification only for an attended
  player.

Autonomous deliveries remember the preceding autonomous authored row. A small delivery-time roll
either quotes that row or adds a quiet emoji reaction to it; authored `replyTo` chains always take
priority. The runtime-only links clear on reset and are flattened into checkpoint rows when saved.

Once an autonomous authored ID clears those gates, `deliverAutonomousRewritten` freezes any pooled
sender/body choice. A 25% roll keeps the authored wording; otherwise it sends the resolved
English original and that sender's bounded `groupChatCast()` bio through the shared Chat queue
in `message_rewrite` mode. The Worker uses a dedicated no-actions prompt for visibly different,
cheerful, playful, lightly mischievous phrasing while preserving the authored facts, intent,
concrete details, certainty, and point of view. The bio may color voice but cannot contribute new
message facts. Emoji are stylistic and may be added, removed, or swapped when meaning is unchanged.
The Worker requires the exact `{en}` response shape. A valid
English rewrite is stored on the authored message; Czech always remains the existing reviewed
dictionary translation. A Turnstile, transport,
timeout, upstream, parsing, or shape failure
falls through to the original dictionary copy. Pending IDs count as received for scheduler
deduplication, do not enter the thread until the request settles, and are generation-cancelled by
phone/game reset. Checkpoint rows retain a completed English rewrite, while in-flight work remains
session-only.

`AUTHORED_REWRITE_BLOCKLIST` bypasses Chat unconditionally for wording that must remain verbatim.
It currently contains Pouria's `pouria_farhang` line and both halves of Hamid's Persian verse
(`hamid_verse`, `hamid_verse2`).

The `Tab` context-message shortcut uses the same rewrite trip when the interface language is
English, including cloned repeats after a catalog ID has already arrived. In Czech it deliberately
uses direct authored delivery, so the reviewed Czech dictionary text is immediate and never sent
to Chat.

`__deliverAutonomousPhoneMessage` is the single deferral boundary for those sources, including
birthday and date/BBQ occasion producers. While the Who's Here roster is open, it queues autonomous
messages without adding thread rows; the scene preview, floating unread launcher, and balcony-phone
badge are also suppressed. Closing the roster resumes eligible queued messages at the normal paced
drain, while explicit `__deliverPhoneMessage` calls remain immediate but visually quiet behind the
roster.

Incoming authored rows may gain bounded crew reactions after delivery.
`messageReactionPlan` hashes the message id rather than consuming gameplay randomness;
an entry's `arrivalReactions` overrides that plan for intentional beats. Reaction arrival
re-renders an open thread but does not alter unread state or raise a notification.

Wedding-moment messages are routed through the same boundary and remain ineligible until 45 seconds
of attended party time from `__partyLifecycleState()`. While first dance,
slow dance, toasts, group photo, sparklers, cake, bouquet toss, or chair lift owns attention, incoming
autonomous texts queue instead of interrupting. The queue re-checks the gates and drains one item at
a time, approximately 4.2 seconds apart, after the moment ends. Explicit/story delivery remains
outside this deferral queue, but still passes the shared phase and deduplication boundary.

### Thread behavior

- Read state, reactions, action state, arrival timestamps, filters, draft, and reply target are
  session/checkpoint state.
- Opening a notification scrolls to its exact row but does not run that message's action. Opening or
  selecting the row marks it read; the separate action affordance performs the action.
- The bulk read action clears unread pressure while preserving the chronological thread.
- `messageActionState` records one-shot completion or expiry. `setGardenParty` retires actions whose
  context has permanently passed, marks those rows read, and removes their action affordance without
  deleting the historical text. `unreadCount()` and `__latestUnreadMessage()` re-run the same expiry
  pass so stale rows cannot hold the autonomous unread-pressure cap.
- Reactions are lightweight per-message state and are included in group-chat context.
- Replies carry a stable target/quote and support jumping back to the quoted row.
- Visitor input is inserted immediately as a local outgoing row. The generated crew reply is queued
  through the shared Chat request pipeline in silent `group_chat` mode.
- A failed group reply remains attached to the outgoing row with Retry. Retrying reuses the original
  request/context without duplicating the visitor row or inserting a fake response.
- The thread is capped at 40 rows. Trimming removes the oldest authored rows first. If the thread is
  entirely generated conversation, it removes the oldest complete visitor/reply pair rather than
  orphaning one side. Generated `MESSAGES` records are deleted with their rows.
- Only the 12 most recent rows are assembled as group-chat context, even though more rows may remain
  visible locally.
- Invaders, Flair-Catch, Block Party, and Pac-Man publish `minigame.change` state. While any is
  active, Messages still records incoming rows and unread state but suppresses previews and badges;
  one current preview is released after the last game exits. This is presentation hold, not message
  deferral. Keep new action games on the same state-event boundary.

An action returned in group-chat mode is a suggestion attached to the incoming message. It runs only
after the visitor taps it and the client re-validates it through `loft.api`.

## Charlie and the chat Worker

Private Chat, Messages replies, Code assistance, and authored-message rewriting share one serialized
client queue and one `/chat` Worker endpoint. Their modes deliberately have different prompts,
context envelopes, output schemas, and execution policy; do not merge them into one permissive
conversation path. Search for `askChat`, `__chatContext`, `group_chat`, `code_assist`,
`message_rewrite`, and `CHAT_PROXY_URL`.

### Client context

`__chatContext()` assembles bounded, live state: language, current room/hint, phase and unlocked
rooms, party state and elapsed time, daylight/date/occasion, trip, weather and indoor temperature,
people/occupants, media/devices/apps, relevant instructions, and currently available typed actions.
Retrieval helpers add app-specific knowledge only when the message makes it relevant. Private Chat
retains at most 40 local rows once idle, and the Worker accepts at most 24 history items. Group-chat
mode sends no private history and instead sends sanitized cast, reply target, at most 12 recent
messages, people, and reactions.

Game, activity, music, film, and scripting answers are registry-backed. App games and their
activities come from the monitor/phone app definitions; the four scene-only hidden games retain a
small physical-opening guide, while high scores are read from their live controller snapshots.
Song and film titles come from the player playlists. `__chatApiManifest()` derives JavaScript
commands from `CONSOLE_CMDS` + `CONSOLE_HELP` and typed calls from `loft.api`; Charlie receives it
only for scripting questions, while every JavaScript Code-assistant request receives the same
manifest with its async-function calling context. Keep the Worker sanitizers and prompt rules in
sync when adding a new public context field.

The client lazy-loads Turnstile, obtains a token for the chat action, and prewarms/caches a recent
token. Requests use `AbortController` and a roughly 20-second browser timeout. The app renders
configuration, verification, rate-limit, timeout, and upstream failures as user-facing errors.
Failed private Chat turns have a visible Retry control that reuses the original turn and does not
append a duplicate user message. Silent modes surface failure to their caller instead: group replies
retain Retry state, and authored rewrites fall back to the original English copy.

### Worker boundary

`chat.js` accepts only `POST /chat` (plus CORS preflight) from the production origin and explicit
local-development origins. It requires JSON, caps body/message/history/group-context sizes, trims
all strings, and reconstructs a known context shape rather than forwarding arbitrary client data.

Before model access it:

1. applies a configured edge rate limit keyed by client address (currently 12 requests per minute);
2. verifies a Turnstile token server-side, including the expected hostname and action, with a
   10-second verification timeout;
3. supplies stable `chat-knowledge.json` plus the sanitized current context as data;
4. calls the configured Responses model with storage disabled and a hashed safety identifier;
5. parses and normalizes strict JSON output, then applies deterministic intent handling for a small
   set of direct invocations.

The model upstream timeout is 35 seconds. Invalid client requests return 4xx responses; missing
server configuration or unavailable verification returns 503; rate limiting returns 429; model
timeouts return 504; other upstream failures return 502. Responses use no-store and constrained
CORS headers. The browser timeout is shorter than the Worker timeout, so a browser may abandon a
request before the Worker finishes it.

### Typed actions

`ACTION_SPECS` in the Worker and the registry in `initLoftApi` are the two enforcement boundaries.
Both allow only known action IDs and exact boolean/enum argument shapes. The model may return at most
one action, only from `context.actions_available`; no raw JavaScript, selector, URL, or function name
is accepted.

The private Chat app automatically calls the validated action and reports the result. Messages never
auto-executes a returned action: it stores a suggestion and waits for a tap. Keep this behavioral
difference when sharing queue, renderer, or retry code.

Monitor film playback is exposed as `media.video` in `media.status`; `video.pause` is advertised only
while the film is actually playing. Its direct controls and typed action share one semantic state
transition, so assistants cannot truthfully report a pause without invoking the registered action.

`chat-knowledge.json` should contain verified, stable facts and explicit unknowns. Live state belongs
in client context. Its `loft.rooms` entries are Charlie's stable room/object guide: they distinguish
recognizable objects, phase-specific additions, main guided interactions, and special controls
without forwarding the SVG DOM. Exact birthdays and other private facts are deliberately excluded
from model context. Do not add secrets, credentials, operational access details, or unverified
logistics to the knowledge file.

## Console and public scripting

The drop-down console and office monitor console share an interpreter. Explicit `/chat` and
`/message` routes use the assistant/group-chat flows; otherwise the console can evaluate JavaScript
and exposes many intentional global commands. Search for `CONSOLE_HELP`, `CONSOLE_CMDS`, and the
`window.<name> = function` block near the end of `rsvp.html`.

Useful public controls include room navigation, party/daylight/season/weather/time, media and volume,
projector, trips, dances and wedding moments, phone/monitor apps, calls, roster/guests, photography,
and reset/autoplay helpers. `CONSOLE_HELP` is the user-facing description and `CONSOLE_CMDS` is the
completion roster; tests require them to stay in sync.

For programmatic integrations, prefer:

- `window.loft` read-only status getters for couple/site/countdown/media/weather facts;
- `loft.api.capabilities()` to discover typed commands;
- `loft.api.query(id, args)` for snapshots such as `game.snapshot`, `room.current`,
  `room.occupants`, `people.locations`, `party.status`, `audio.status`, `calendar.events`,
  `weather.cities`, `album.list`, and `trip.status`;
- `loft.api.perform(id, args)` for validated actions;
- `loft.api.subscribe(fn)` or the `loft:statechange` event for semantic state changes from typed
  actions, direct UI/console use, and tracked autonomous transitions.

The many `window.__...State`, `__...Now`, `__advance...`, and `__reset...` functions are targeted
debug/test hooks. They are often the fastest way to inspect a controller, but callers outside this
repository should not depend on them.

## Local development and tests

The static pages can be opened directly for basic inspection. A local HTTP server is preferable for
media, browser APIs, and `/chat` integration because browsers restrict some `file://` subresources.
The Worker is developed separately with Wrangler and platform-provided local bindings/secrets; do
not place credentials in tracked files.

Mandatory tests for HTML changes are documented in `AGENTS.md` (`CLAUDE.md` is its compatibility
symlink):

```sh
node tests/check.js
node tests/state.js
```

For `rsvp.html` game logic or interactions also run:

```sh
node tests/play.js
```

Run focused tests for the changed ownership boundary. The main routes are:

- `tests/enter.js`, `tests/navigation.js`, `tests/delayed-pan.js`,
  `tests/rapid-navigation.js`, `tests/phase2-progression.js`, and
  `tests/progression-transitions.js` for room progression and navigation ownership;
- `tests/menu.js`, `tests/laptopmenu.js`, `tests/systemmenu.js`, `tests/monitor-search.js`,
  `tests/phone-direct-launch.js`, `tests/phone-lock.js`, `tests/phone-recents.js`, and
  `tests/phone-badges.js` for
  monitor/phone shell, context-menu, launch, and teardown behavior;
- `tests/url-entry.js`, `tests/recovery.js`, `tests/cine.js`, and `tests/autoplay.js` for direct
  presentation entries and their recovery/lifecycle contracts;
- `tests/projector-coffee.js`, `tests/media-transitions.js`, `tests/piano-message.js`,
  `tests/cinema-room.js`, `tests/bathroom-room.js`, `tests/bedroom-room.js`, and
  `tests/entrance-room.js` for projector
  ordering, retained channel state, shared beds, transport, play-along transitions, Vimeo
  teardown, lower-room pan/UI restoration, and guarded mouse/touch navigation for Kitchen,
  Cuddly, Garden, Office, and Balcony;
- `tests/video-playlist.js` and `tests/video-kill-variants.js` for film selection, retained
  playheads, track-specific Kill visuals, and teardown reset;
- `tests/party-lifecycle.js` for attended party timing and finales;
- `tests/balcony-tetris.js`, `tests/pacman.js`, `tests/doom-title.js`,
  `tests/monitor-savers.js`, and
  `tests/minigame-vocabulary.js` for action-game lifecycle, keyboard/title ownership,
  notification holds, persistence, and shared terminology;
- `tests/message-context.js`, `tests/message-launcher.js`, and
  `tests/message-resilience.js`, `tests/message-rewrite.js`, `tests/message-longpress.js`, and
  `tests/message-typed-actions.js` for Messages behavior;
- `tests/chat.js`, `tests/chat-context.js`, `tests/chat-worker.mjs`,
  `tests/assistant-behavior.mjs`, `tests/chat-code-protocol.mjs`, `tests/safe-actions.js`, and
  `tests/safe-actions-worker.mjs` for assistant modes and action boundaries;
- `tests/performance.js` and `tests/leak.js` for lifecycle regressions;
- `tests/bar-layout.js` for the calm-night patrons, occupied stools, and hands-on mixer paint order;
- `tests/album-axis.mjs`, `tests/album-render.mjs`, `tests/album-ui.js`, and
  `tests/photographer-occupancy.js` for photography;
- `tests/weather.js`, `tests/birthday.js`, `tests/bbq-days.js`, and `tests/polyamory-day.js` for
  date/weather gates and special-day room dispatch.

`tests/lib.js` starts a fresh headless Chrome profile, loads a scratch page, injects narrow setup and
assertion hooks, captures page errors/rejections, and provides deterministic motion/focus/random
controls. New behavior tests should use `runPage`/`runPageSync`, assert visible/state behavior rather
than source text, and expose the narrowest practical test hook. Add a static invariant to
`tests/check.js` only when it protects a recurring structural bug class.

Headless virtual time has known rAF, transition, WAAPI geometry, and display-paint artifacts. Use a
cache-busted URL and freshness assertion. For visual work, inspect real Chrome screenshots at mobile
and desktop widths in both languages; use the CDP recipes in `DEBUGGING.md` when virtual-time paint is
suspect.

## Deployment model

The frontend is served directly from a Git checkout behind Apache. HTML and the PWA manifest are
configured to revalidate; large pinned runtimes and media have longer cache policies. Internal
Markdown, tests, Worker source/configuration, and local secret files are explicitly blocked.
Clean extensionless entry points are symlinks, and Apache does not infer the target HTML MIME type
through them. The extensionless-file rule in `.htaccess` therefore forces `text/html`, compression,
and revalidation for current and future clean routes; keep it when adding another drop alias.

The chat backend is a separately deployed Cloudflare Worker routed only to `/chat`, with its model
credential, Turnstile server secret, and rate-limit binding supplied by the platform. The frontend
contains only the public widget configuration needed to request a Turnstile token.

Because deployment updates the live checkout in place, a request arriving while a very large HTML
file is being replaced can receive a truncated document. A report that the entire layout suddenly
stacked or lost CSS should first be checked for a torn read and compared against the local artifact,
not immediately attributed to the most recent small UI edit.

This guide intentionally omits host access, credential values, and exact deployment commands.

## Pitfalls and invariants

- Keep `rsvp.html` and `save-the-dates.html` self-contained; do not add a frontend build dependency
  casually.
- Keep `T.en`, `T.cs`, and any static fallback copy synchronized.
- Maintain exactly one `AudioContext`; consumers own nodes/handles, never the shared context.
- Re-gate an autonomous loop on room, state, visibility, and focus at fire time, not only when it is
  scheduled.
- Bound every timer-created node collection and explicitly tear it down.
- Let finite one-shot animations finish; park only ambient infinite timelines.
- Keep traversed rooms visible through a strip slide.
- Do not use a CSS transform animation on the same SVG node that owns static transform positioning.
- Keep people identity and occupancy consistent across SVG, roster/chat context, and album output.
- Preserve normal-close versus Kill/reset semantics for apps.
- Keep Worker and client typed action definitions aligned and deny arbitrary execution at both
  boundaries.
- Keep private Chat auto-actions distinct from Messages tap-to-run suggestions.
- Do not advance `loft.api.stateVersion` for animation frames or incidental counters; wire new
  durable query state through its central owner and emit one semantic revision.
- Do not expose a new tracked internal file without checking `.htaccess` coverage.

## Debug entry points

Start with the subsystem's state hook, then inspect its DOM classes and owning timers:

- rooms: `currentStageName`, `__maxUnlocked()`, `__stageParkingState()`;
- game: `loft.api.query("game.snapshot")`, `__secondRound`, `__gameStarted`;
- party: `loft.api.query("party.status")`, `__partyLifecycleState()`;
- audio: `loft.api.query("audio.status")`, `__updateSharedAudioIdle()`;
- people: `__whoIsHere(room)`, `__rosterPresence()`, `loft.api.query("people.locations")`;
- messages: `__phoneMessageThread()`, `__latestUnreadMessage()`,
  `__deferredPhoneMessages()`, `__messageRewritePending()`,
  `__messageNotificationsHeld()`;
- date/time: `__now()`, `__ovClock()`, `__weddingOccasion()`;
- weather: `loft.api.query("weather.cities")`, `__realWx`, `__realDaily`;
- assistant context: `__chatContext()` and `loft.api.capabilities()`.

Most reset functions are named `reset...` or `__reset...`. Prefer the subsystem reset or the public
full reset over manually deleting classes; manual deletion usually misses timers, audio nodes,
retained app state, or paired population layers.

## Code map

Use these search terms in `rsvp.html` rather than relying on line numbers:

| Area | Search terms |
| --- | --- |
| Localization | `var T =`, `function setLang` |
| Date and occasion source | `window.__now`, `__weddingOccasion`, `persianOcc` |
| Shared audio | `function getAudioCtx`, `audioBusProxy`, `__updateSharedAudioIdle` |
| Monitor desktop/apps | `REAL_APPS`, `__openMonitorApp`, `__closeTopMonitorApp`, `PAC_MAZE` |
| Phone shell/apps | `function openApp`, `function navBack`, `phoneAppReturn`, `setPhoneAppReturn` |
| Chat context/client | `window.__chatContext`, `askChat`, `CHAT_PROXY_URL`, `message_rewrite` |
| Typed game API | `initLoftApi`, `register({ id:`, `actions_available` |
| Messages catalog/schedulers | `var MESSAGES`, `CUE_POOL`, `scheduleDayDrip`, `deliverAutonomousRewritten` |
| Message deferral/retention | `__deliverAutonomousPhoneMessage`, `MSG_CAP`, `trimMessageThread` |
| Party lifetime | `PARTY LIFECYCLE`, `__partyLifecycleState` |
| Room navigation | `var STAGES`, `function goToStage`, `__finishSolveAdvance` |
| Room performance | `stage-far`, `stageAnimationParkingActive`, `capParticles` |
| Party source of truth | `function setGardenParty`, `__setPartyMode` |
| Population/roster | `ROSTER`, `__whoIsHere`, `__rosterPresence` |
| Kids | `kids_asleep`, `kids_loose`, `__setKidsAsleep`, `chaseKidsAllowed` |
| Photographer/album | `__updateGardenPhotographer`, `albumPhotoSvg`, `__photoMomentNow` |
| Weather | `api.open-meteo.com`, `__realOutdoorC`, `refreshWeatherText` |
| Public console | `CONSOLE_HELP`, `CONSOLE_CMDS`, `window.volume` |
| Code/Python Turtle | `CODE_STORE_KEYS`, `codeSetLanguage`, `__runPythonCode`, `PY_TURTLE_MODULE` |
| Autoplay/cinematic | `AP_SEQUENCE_LIBRARY`, `AP_MOOD_TRANSITIONS`, `__autoplayModel`, `apParam`, `window.__cinematic` |

Worker-side searches in `chat.js`: `ACTION_SPECS`, `cleanContext`, `cleanGroupChat`,
`verifyTurnstile`, `callOpenAI`, and `export default`. Stable assistant facts and policy live in
`chat-knowledge.json`; runtime facts should not be moved there.
