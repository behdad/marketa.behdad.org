# Developer guide

This guide describes the implementation that exists today, not a proposed rewrite. `rsvp.html`
changes frequently, so search terms are given instead of line numbers. Internal names beginning
with `__` are useful test and debugging seams, but are not a stable public API unless explicitly
noted.

## Repository shape

- `save-the-dates.html` is the invitation/save-the-date page.
- `rsvp.html` is the interactive loft game. Its HTML, CSS, inline SVG, localization dictionaries,
  state, controllers, apps, and scripting console live in one large file.
- `egg-hunt.html` and `loft-day.html` are public symlinks to those two current drops. Keep the
  symlinks aligned if a current drop is renamed.
- There is no application framework, package build, or bundling step. Both pages are intended to
  remain directly loadable documents.
- `art/` contains the normal media assets. `pyodide/`, `linux/`, `doom/`, and `harfbuzzjs/` contain
  pinned, self-hosted browser runtimes and their provenance. Treat those directories as versioned
  deliverables, not generated build output.
- `chat.js` is the Cloudflare Worker behind `/chat`; `chat-knowledge.json` is the stable knowledge
  supplied to that Worker.
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
transition. The fullscreen button and `F` remain explicit. The synchronous mode bootstrap also
adds `.installed-app` from the display-mode/navigator standalone signals.
Immediately inside `<body>`, `#installed-load` uses that already-set class to paint a standalone-only
loading screen before the large game DOM parses. Its small inline controller localizes from the
saved language/full `navigator.languages` list, advances an ARIA progressbar, completes after
`DOMContentLoaded` with a minimum readable dwell, and removes the overlay. Browser mode removes the
node synchronously and sets test hooks without painting it.

The capture-phase room keyboard controller owns one `activateCurrentRoom()` transition used by
`Enter` and by an otherwise-unconsumed top-level `Escape`. The existing Backspace alias dispatches
a synthetic Escape, so it reaches the same transition even while browser fullscreen consumes the
physical Escape key. Window-level phone/monitor closers and component menu/dialog handlers retain
first refusal; typing fields never fall through to a room action. CLICK ME is checked before
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
- [`harfbuzzjs/`](../harfbuzzjs/BUILD.md) contains HarfBuzz compiled for the browser.

These directories are pinned, versioned deliverables rather than generated build output. Do not
regenerate or upgrade them casually. Preserve their self-hosted, zero-CDN operation.

### Google Fonts integration

Google Fonts is the deliberate network exception to the self-hosted runtime policy. The page loads
Fraunces, Source Serif 4, and a small Noto Serif subset through the normal Google Fonts stylesheets.
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
directly because the recovery gate is already an explicit destructive choice; only the in-game
Restart button/key uses `__confirmRestart()`. Recovery Start over passes `enterPageMode` to
`resetHunt()`: the fresh-load CLICK ME state remains unstarted and regains the shared entry chrome,
while `.loft-entered` immediately enlarges its scene. The extinguisher snapshots whether game-only
page mode was already entered before its delayed wipe, then passes the same option to `resetHunt()`;
`R` and the public `reset()` console/API command use that extinguisher path. Thus an in-game reset
re-arms CLICK ME without dropping the enlarged view. These contextual reset paths preserve active
`?date=` and `?time=` parameters; only the explicit right-side chrome Restart passes
`resetDateTime:true` and returns to the real clock. Cinematic/fresh-load resets omit the option and
retain their own page-mode behavior.

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
timer guard is important for keyboard, double-click, and click-storm behavior.

`goToStage(name)` is intentionally permissive for scripting and test use: it calls `unlockThrough`,
so directly going to a later room unlocks the intervening rooms. Normal UI arrows and dots remain
gated; a double-click on a locked room dot is an intentional shortcut.

`window.__gameStarted` means the opening/attract prompt has been dismissed. It does not mean phase
two. `window.__secondRound` latches when the garden party first starts. That transition unlocks all
rooms, reveals and synchronizes the party population/roster, releases phase-two-held occasion texts,
and makes solved rooms exploratory instead of linear puzzle gates. Turning the party off does not
return to phase one; only a full reset clears that session progression.

The first balcony arrival owns the one-time finale/Act Two transition. Subsequent solved-room visits
use exploration captions and rotating hints. `goToStage` is also the central room-change re-gate: it
collapses device zoom, tears down or pauses room-local effects, re-evaluates audio, people, weather,
particles, photographer state, and phone/monitor ownership.

### Progression transitions

`setSecondRound` owns the phase-two latch, full-room unlock, roster availability and release of held
phase-two messages/cards. Checkpoint restore passes `releaseHeld:false` because it restores the saved
phone state separately. `setMaxUnlocked` owns the room frontier and navigation projection.
`setOfficeProgress` owns the Prague-call and PC-played milestones across play, Enter automation,
checkpoint restore and reset. `setMonitorShorted` owns both the wet-monitor flag and `.shorted`
rendering class; drying and reset call the same transition.

### Party lifetime

`setGardenParty` is the party source of truth. A separate controller, searchable as
`PARTY LIFECYCLE`, counts attended seconds only while the document is visible, focused, and outside a
cinematic. Elapsed time never ends the party; it only paces later messages and explicit authored
finales. An accepted last-dance/last-song action or cake completion can schedule a graceful ending,
and `party.extend` cancels that pending finale. A later autonomous invitation may offer to restart a
stopped party, but it does not restart by itself.

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

The magic box and keyboard shortcuts show molecule cards. Physical prop entries intentionally may
not: the kitchen cream whipper starts uncarded laughing gas after its hiss, while every frog or
mushroom tap deterministically starts its own uncarded variant. Active laughing gas also reveals
the whipper's calendar-style Behdad apparition; its jaw and whole-figure rise use separate wrappers
so their transforms compose.

The canonical direct-selection order is laughing gas, shrooms, acid, froggies, DMT, molly,
ketamine, then iboga (`Shift+1` through `Shift+8`). Keep that order aligned across the keyboard
handler, `trip()` scripting API, typed `trip.start` schema, Worker action schema, translated
shortcut copy, and lifecycle tests when adding or reordering a variant.

### Media transitions

`setMusicPausedState` is the only writer of the shared transport-pause mirror and synchronizes its
play/pause UI and party dance-freeze projection. Individual song/projector/dance-bed controllers
still own their AudioNode suspension and call the state transition after changing it.

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

## Rendering and performance lifecycle

The scene is inline SVG, with CSS animations, Web Animations API effects, SMIL where required for
WebKit, and JavaScript-created transient nodes. Treat all four mechanisms as lifecycle-managed
resources.

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
  The accessor itself remains instantaneous.
- Display order is based on current left-to-right geometry, while preserving existing order and
  inserting newcomers to reduce churn.
- Opening the roster holds autonomous arrivals/departures. In the garden it also adds
  `.roster-freeze` to the stage, pausing the adult cast while the eight party children remain
  animated; the existing row spotlight temporarily exempts `.spotlighted`. Check
  `rosterHoldsOccupants` before adding another population timer.
- Party entry/exit controllers move guests to and from the floor. CSS variables help balance crowd
  placement. Avoid rendering the same person in standing, dance, visitor, and kid-activity layers at
  the same time.
- `attendedGuestNames` records lifetime attendance for one party run, independently of the
  floor-only `.arrived` class. Adult rotation must not clear an attending child's `.arrived`;
  `assignPartyKids()` then gives every attending child exactly one persistent dance/Cuddly/sleep
  home. The ordinary Irene/Robin/Navid Cuddly cameo scheduler is party-off only.
- Persistent bar, office, balcony, and grillmaster figures use presence classes with opacity plus
  delayed `visibility`, not `display`, so both arrival and departure can paint as fades. The balcony
  layout preferentially retains eligible visible figures across a BBQ split change. Hamid's
  grillmaster paint owns `#loft-game-strip.hamid-wearing-jacket`, which fades both views of the
  shared hanging jacket while he is assigned to the BBQ.
- The BBQ controller's `bbqHostsOnBalcony` is the single paired-location state for Behdad and
  Markéta. Both `layoutBBQ()` and `applyBBQGardenSplit()` consume it. Each rotation and active-BBQ
  day/night change rerolls against a 0.75 daytime / 0.25 nighttime balcony probability, keeping
  their deck figures and garden exclusions atomic.
- One eight-child inventory drives standing dancers, Cuddly seats, chase sprites, and sleep.
  `assignPartyKids()` owns the persistent `off-at-games` / `off-asleep` assignment. A represented
  parent on the live floor raises that child's dance chance from 0.25 to 0.70; after the sleep
  message every Cuddly seat clears and the dance chance falls to 0.08. Chase handoffs remain a
  temporary `off-with-kids` projection of a child whose persistent home is `off-at-games`; dancers
  are excluded from the chase pool, and a full-pack roll can run all eight seated children. The
  Cuddly layout balances partial assignments across its two clusters and randomizes identities
  between sides instead of consuming the slot array left-to-right. `partyKidFormationTick()` keeps
  its 9–14 second off-room cadence but uses 30–45 seconds while Cuddly is watched. During party Totoro,
  `__totoroWatchActive` overrides eligibility/sleep and assigns all eight to the same persistent
  Cuddly layer; outside a party the original three cameo figures own the co-watch. Keep
  `PARTY_FLOOR_KIDS`, `KID_WHO`, runner SVG nodes, `ROSTER.runSel`, and the people manager in
  parity when adding a child.
- S'mores and seasonal balcony play use `__balconyBorrowedKids` as another temporary projection
  from the persistent Cuddly assignment. Identity-specific s'mores art selects eligible godkids;
  the seasonal two-slot art can represent any assigned children. `__balconyPlayKidsNow` publishes
  the generic slots to the people manager, and teardown clears the borrowing without rerolling
  unrelated dancers. `__reconcileBalconyKidsPlay()` deterministically derives the daytime activity
  from door, phase, sleep, date, and temperature state: freezing air gives the snowman; Apr 2–29
  gives blossom play; Jun 1–Aug 31 gives sprinkler play; and Sep 15–Oct 15 gives leaf-pile play.
  Date, weather, day/night, and either view of the physical balcony door all invoke that one owner.
- Aspen has garden stations and a photographer presence that can be cloned into other rooms/deck
  contexts. `__roomHasPhotoSubjects(room)` excludes working crew and gates her visible clone,
  camera/flash, shutter, and Album write together; an empty room must not show her or create a
  keepsake. Population controllers refresh photographer gates after assignment changes; the
  garden can be empty during an active party, and Aspen returns with the first subject. Automatic
  rounds and explicit `photo.take` use that same occupancy truth. The occasional dance freeze is
  about 4.2 seconds; ordinary automatic captures do not freeze the floor.
- Named-guest ambient flares use one self-rescheduling visual-only driver. It runs only while the
  active garden party is visible, focused, and outside a major moment; it never owns sound.

When changing people data, verify all three representations: painted SVG figures, roster/chat
metadata, and photo composition.

## Phone and monitor applications

### Office monitor

The monitor is an SVG/`foreignObject` computer with a desktop, dock, screensaver, and apps. App state
is represented mainly by `show-*` classes on `#office-monitor`. Search for
`__openMonitorApp`, `__closeTopMonitorApp`, `resetMonitorAppState`, and `REAL_APPS`.

Opening an app boots/pans the monitor if necessary, closes incompatible surfaces, and calls the app's
own render/sync hook. Back/Escape is routed through `__closeTopMonitorApp(stepBack)`: a nested app
view gets the first chance to step back, then the app closes to the desktop. A normal close can
retain app session state; the context-menu Kill path calls `resetMonitorAppState` and must clear it.
Screensaver and expensive canvas/DOM loops are gated while an app owns the screen.

The shared frame-health sampler exposes `__frameHealthState()` and marks sustained
low delivery with `html.frame-rate-low`. It samples only while the document is
visible and focused, requires two 1.2-second windows below 22 FPS to enter slow
mode, and three windows at or above 42 FPS to recover. The garden disco pools use
that state: healthy delivery runs their continuous CSS sweep, while low-frame mode
replaces it with the existing roughly one-second JS position stepper. Asymmetric
thresholds plus consecutive sampling windows keep the cost change itself from
flapping the mode.

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
math lock; explicit/cinematic deep links may skip it. `setPhoneAppReturn` is the only owner of the
app-level return transition: launcher, close phone, or return to Messages.

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

The launcher owns touch gestures that begin on app icons because those icons use
`touch-action:none` for rearrangement. A quick vertical drag updates the launcher scroll position;
holding briefly before movement enters icon-reorder mode. Keep that distinction when changing the
grid so short phone screens do not leave only the gaps as usable scroll targets.

Madla's incoming call has one availability boundary, `__madlaAvailable()`: phase 2 must be latched
and the party must be off. The random scheduler, cuddly outlet, console command, typed action, and
answer hook all route through `__madlaRing`/`__answerMadla`, so no entry point may reproduce or
bypass that condition.

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
and special-day scene dispatch.

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

The implementation also retrieves aviation observations, Edmonton air quality, and geomagnetic
forecast data for scene effects. Search for `api.open-meteo.com`, `archive-api.open-meteo.com`,
`__realWx`, `__weatherApprox`, `__realOutdoorC`, `__realPragueC`, and `__realDaily`. Missing or
failed network data falls back to the simulated scene model; UI and Charlie context must tolerate
`null`. Console temperature overrides intentionally separate the simulated outdoor model from live
or reconstructed readings until reset.

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

`__deliverAutonomousPhoneMessage` is the single deferral boundary for those sources, including
birthday and date/BBQ occasion producers. While the Who's Here roster is open, it queues autonomous
messages without adding thread rows; the scene preview, floating unread launcher, and balcony-phone
badge are also suppressed. Closing the roster resumes eligible queued messages at the normal paced
drain, while explicit `__deliverPhoneMessage` calls remain immediate but visually quiet behind the
roster.

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

An action returned in group-chat mode is a suggestion attached to the incoming message. It runs only
after the visitor taps it and the client re-validates it through `loft.api`.

## Charlie and the chat Worker

The office Chat app and Messages group replies share one serialized client queue and one `/chat`
Worker endpoint. Search for `askChat`, `__chatContext`, `group_chat`, and `CHAT_PROXY_URL`.

### Client context

`__chatContext()` assembles bounded, live state: language, current room/hint, phase and unlocked
rooms, party state and elapsed time, daylight/date/occasion, trip, weather and indoor temperature,
people/occupants, media/devices/apps, relevant instructions, and currently available typed actions.
Retrieval helpers add app-specific knowledge only when the message makes it relevant. Private Chat
retains at most 40 local rows once idle, and the Worker accepts at most 24 history items. Group-chat
mode sends no private history and instead sends sanitized cast, reply target, at most 12 recent
messages, people, and reactions.

The client lazy-loads Turnstile, obtains a token for the chat action, and prewarms/caches a recent
token. Requests use `AbortController` and a roughly 20-second browser timeout. The app renders
configuration, verification, rate-limit, timeout, and upstream failures as user-facing errors.
Failed private Chat turns have a visible Retry control that reuses the original turn and does not
append a duplicate user message.

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

Mandatory tests for HTML changes are documented in `CLAUDE.md`:

```sh
node tests/check.js
node tests/state.js
```

For `rsvp.html` game logic or interactions also run:

```sh
node tests/play.js
```

Run focused tests for the changed surface. Important examples:

- `tests/enter.js` for room-level Enter progression;
- `tests/menu.js` and `tests/laptopmenu.js` for context menus/Kill behavior;
- `tests/navigation.js` for room/device navigation;
- `tests/url-entry.js`, `tests/recovery.js`, `tests/cine.js`, and `tests/autoplay.js` for direct
  presentation entries and their recovery/lifecycle contracts;
- `tests/party-lifecycle.js` for attended party timing and finales;
- `tests/message-context.js`, `tests/message-launcher.js`, and
  `tests/message-resilience.js` for Messages behavior;
- `tests/chat.js`, `tests/chat-context.js`, `tests/chat-worker.mjs`,
  `tests/safe-actions.js`, and `tests/safe-actions-worker.mjs` for assistant/action boundaries;
- `tests/performance.js` and `tests/leak.js` for lifecycle regressions;
- `tests/bar-layout.js` for the calm-night patrons, occupied stools, and hands-on mixer paint order;
- `tests/album-axis.mjs`, `tests/album-render.mjs`, `tests/album-ui.js`, and
  `tests/photographer-occupancy.js` for photography;
- `tests/weather.js`, `tests/birthday.js`, and `tests/bbq-days.js` for date/weather gates.

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
  `__deferredPhoneMessages()`;
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
| Monitor desktop/apps | `REAL_APPS`, `__openMonitorApp`, `__closeTopMonitorApp` |
| Phone shell/apps | `function openApp`, `function navBack`, `messageAppReturn` |
| Chat context/client | `window.__chatContext`, `askChat`, `CHAT_PROXY_URL` |
| Typed game API | `initLoftApi`, `register({ id:`, `actions_available` |
| Messages catalog/schedulers | `var MESSAGES`, `CUE_POOL`, `scheduleDayDrip` |
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
| Autoplay/cinematic | `AP_SEQUENCE_LIBRARY`, `AP_MOOD_TRANSITIONS`, `__autoplayModel`, `apParam`, `window.__cinematic` |

Worker-side searches in `chat.js`: `ACTION_SPECS`, `cleanContext`, `cleanGroupChat`,
`verifyTurnstile`, `callOpenAI`, and `export default`. Stable assistant facts and policy live in
`chat-knowledge.json`; runtime facts should not be moved there.
