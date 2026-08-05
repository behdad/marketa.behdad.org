# Developer guide

This guide maps the current implementation. `rsvp.html` moves often, so search for symbols rather
than line numbers. Names beginning with `__` are usually internal seams for tests or controller
coordination; only `window.loft` and `loft.api` are intended as public interfaces.

## Repository boundaries

- `save-the-dates.html` is the invitation page.
- `rsvp.html` is Loft Day: HTML, CSS, inline SVG, bilingual copy, controllers, apps, and console in
  one self-contained file.
- `loft-day`, `loft-day.html`, `rsvp`, and `rsvp.html` are tracked aliases for the game.
- `chat.js` is the Cloudflare Worker behind `/chat`; `chat-knowledge.json` contains verified stable
  facts and `wrangler.jsonc` owns deployment configuration.
- `tests/` contains zero-dependency Node and headless-Chrome checks. `tests/lib.js` is the shared
  scratch-page runner.
- `art/` holds ordinary media. Self-hosted runtime directories such as `pyodide/`, `linux/`, `dos/`,
  `doom/`, `duke/`, `q3/`, and `harfbuzzjs/` are pinned deliverables with their own provenance.

There is no frontend build, framework, package bundle, or CDN runtime. Google Fonts is the one
network exception. Keep game features inside `rsvp.html` unless they need a real deployment
boundary, such as the chat Worker.

Apache serves the Git checkout directly. `.htaccess` blocks internal source, tests, configuration,
and documentation; update its rules when adding another tracked private file.

## Entry and presentation

The ordinary page includes the surrounding invitation. `#play` and the game aliases select the
game-only shell. `#trailer` starts the curated trailer after entry or recovery settles. Search for
`urlEntryMode`, `__startGameEntryLoader`, `startCinematic`, and `stopCinematic`.

Fresh and recovered sessions share entry chrome but have different state effects. Game-only entry
paints CLICK ME or Continue/Start over before the single-file page finishes loading. The selected
action is held behind `#installed-load` until window-load readiness completes. The revealed
invitation bypasses that cover.

The trailer is an editorial timeline, not an autonomous player. `stopCinematic` is the single
cleanup path for completion, Take over, and hidden-tab abort.

Check these presentations independently:

1. full RSVP page;
2. direct `#play` or `#trailer` entry;
3. installed/standalone PWA entry;
4. narrow portrait orientation gate;
5. browser fullscreen versus `.loft-entered` game-only enlargement.

Start with `tests/game-entry-loader.js`, `tests/game-only-layout.js`, `tests/url-entry.js`,
`tests/recovery.js`, and `tests/monitor-fullscreen.js`.

## State and transition ownership

There is intentionally no central store. State lives in subsystem closures, DOM rendering state,
limited `window.__...` coordination hooks, and the typed `window.loft` facade.

Every shared transition needs one owner: usually a `set*` function or paired `start*` / `stop*`
functions. UI handlers, console commands, typed actions, checkpoints, reset, and trailer code must
call that owner instead of editing mirror classes or flags. Delayed work must be cancellable or
generation-guarded.

Controllers communicate through feature-detected hooks because source order matters. A new state
axis often needs to re-gate rooms, focus, visibility, audio, people, Messages, and devices. Keep
those notifications explicit.

Use `__registerTransientResetHook(id, reset)` for small closure-local controllers. Durable systems
should have an explicit reset owner and, when needed, a checkpoint adapter.

### Typed API

Search for `initLoftApi`, `register({ id:`, and `__loftStateChanged`. `loft.api` validates bounded
queries and actions and emits `loft:statechange` after semantic mutations. `stateVersion` advances
for meaningful room, environment, app, call, media, message, album, and minigame transitions—not
animation frames or score ticks.

Use `loft.api.capabilities()`, `query()`, `perform()`, and `subscribe()` for integrations. Internal
`__...State` functions are narrower diagnostic seams and may change with their controllers.

`ACTION_SPECS` in `chat.js` is the Worker-side validation boundary. Keep it aligned with the client
registry; never expose raw selectors, URLs, JavaScript, or private function names.

## Rooms, floors, and progression

The five main rooms are the `STAGES` array:

| Main stage | Lower panel | Lower identity |
| --- | --- | --- |
| `kitchen` | Bathroom | `bathroom` |
| `garden` | Prince dungeon | `dungeon` |
| `cuddly` | Cinema | `cinema` |
| `office` | Bedroom | `bedroom` |
| `balcony` | Entrance | `entrance` |

`goToStage(name)` owns main-strip navigation and re-gates room-bound animation, audio, people,
devices, particles, and captions. The lower roots live in `#lower-room-track`;
`lowerRoomForStage()` defines their pairing and `__navigateLowerRoom(name)` owns horizontal lower-
floor movement. Individual lower controllers own vertical open and close.

During a pan, traversed stages remain paintable until transition completion; afterward `stage-far`
parks distant rooms. A lower-room transition changes the backing main stage and opens the target
lower panel as one queued operation. Checkpoints store a lower identity only when it matches the
saved main room.

Start navigation work with `tests/navigation.js`, `tests/upstairs-keyboard-navigation.js`,
`tests/delayed-pan.js`, `tests/rapid-navigation.js`, `tests/lower-shortcuts.js`, and the relevant
`tests/lower-room-*.js` files.

### Progression

The progression values have distinct roles:

- `stageIndex` / `currentStageName`: visible main stage or backing stage for a lower room;
- `maxUnlocked`: normal-navigation frontier;
- `solvedRooms`: independent room completion;
- `seenRooms`: player-visible settled destinations;
- `window.__secondRound`: latched Phase 2 state.

Each Phase 1 controller owns its clue sequence and `__*DoNext` walker. Completion calls
`__finishSolveAdvance(from, to)`, which records the source, unlocks the destination, and navigates
only if the player is still in the source room. Do not infer completion from unlock state.

`setSecondRound(true)` owns the Phase 2 transition. It unlocks and marks all main rooms solved,
releases held content, and changes Enter to each room's free-play activity. Only reset clears this
latch.

Keep progression coverage in `tests/play.js`, `tests/enter.js`, `tests/phase2-progression.js`, and
`tests/progression-transitions.js`.

After an authored party finale or 120 attended seconds, party teardown schedules the stable
`downstairs_entrance` message. Its legacy `lower:entrance` action navigates to the Balcony and opens
Entrance; it is not part of the random party cue pool.

## Entrance driving and Road Trip

Search for `porscheDrive`, `roadtripState`, `entranceRoadtrip`, and `__entranceDriveStep`. The
Entrance controller owns the Porsche, dashboard, drivetrain, road scene,
Road Trip, and their lifecycle. Road Trip reuses the driving step instead of starting another frame
loop.

### Driving model

Input must flow through the shared steering, transmission, throttle, brake, and dismiss owners.
The four-step `driveCoach` follows those same action owners. Its `?` control parks the drivetrain,
clears cruise, and starts again at ignition; checkpoint recovery does not replay it automatically.
Keyboard steering ramps from a gentle tap to full authority; touch steering and pedal pads provide
direct analog input. A standalone Control tap captures a forward speed floor at 10 km/h or above;
acceleration can exceed it, another tap retargets it, and braking, an invalid drivetrain state,
police capture, or the Camping approach releases it. AUTO and MANUAL share the same physical motion state but have
separate shift rules. The automatic R↔D interlock is valid only below 10 km/h in the opposite
direction.

The six-speed manual derives coupled RPM from road speed, with launch slip as the exception.
`spinPorscheOnBrake()` owns both hard-brake gestures. `driveState.odometerKm` records physical
distance, independent of the street scene's faster visual travel scale, and persists through engine
stops and checkpoints.

Useful deterministic seams are `__entranceDriveRpmForSpeed()`, `__entranceDriveAcceleration()`,
`__entranceDriveSetMotion()`, and `__entranceDriveStep()`.

### Road Trip presentation and route

The first-person world is native SVG inside `#entrance-drive-hud-svg`. Entering or leaving Road Trip
must remain an atomic presentation swap: HUD size, cockpit position, world visibility, and viewBox
cannot transition independently. Weather and time reuse Entrance state.

`drive.roadtrip.route` owns:

```text
calgary → turnoff → banff → lake-turnoff → abraham → camp
```

The route is part of the version-2 paused-run snapshot. Route changes clear live entities before
changing road geometry. Signs are projected beyond the current road edge by
`positionRoadtripExitSign()`; fixed road fractions fail on Calgary's wider divided highway.

The route chooser writes `routeChoice` through `setRoadtripStartingSegment()`. Shift-click is a
private test shortcut that begins three seconds before the chosen segment's exit. Its open state
and selected card are checkpointed; recovery reopens the chooser without launching the route.

Traffic, wildlife, collectibles, mirror uses, signs, and roadside objects use bounded pools. Keep
spawn plans deterministic from the run seed and never add timer-driven unbounded entities.
`roadtripCurvatureAt()`, `roadtripCurveOffset()`, `syncRoadtripShoulder()`, and
`paintRoadtripMirror()` are the central geometry owners.

### Camping

At the Abraham entrance, `syncRoadtripCampApproachSpeed()` slows the car independently of throttle
or momentum. Below 10 km/h, `arriveRoadtripCamp()` parks the drivetrain and activates the camp
overlay inside Entrance.

Camping publishes `entrance_roadtrip_camp_arrival` through `__setLowerRoomCaption()`. Its brief
`hint-blink` phase ends without releasing the keyed caption. The `camp` route is never resume-
pending, including after checkpoint restore, blur, or visibility changes; otherwise the generic
driving-pause rule hides the caption.

The capture-phase Entrance key owner consumes Camping navigation. Enter, Escape, and Backspace
dismiss camp before the backing Balcony stage can handle the key. Camp actions go through
`bindRoadtripCampAction()`. Animate untransformed inner wrappers, cap runtime SVG effects, and keep
effects in the target's coordinate space.

Run `tests/entrance-roadtrip-camp.js`, `tests/entrance-roadtrip-camp-caption.js`, and
`tests/entrance-roadtrip-camp-interactions.js` for this boundary.

### Scoring, police, and durable records

`awardRoadtripBonus()` owns combo-scored rewards; `awardRoadtripDistance()` owns physical-distance
points; `applyRoadtripPenalty()` owns deductions and combo reset. The checkpoint retains elapsed
time and the distance-point watermark so recovery cannot award distance twice.

`drive.roadtrip.police` owns warning, pursuit, capture, stop, arrest, cooldown, and end states.
Presentation advances from simulation state, not free-running timers. Escape cannot skip an arrest;
blur and hidden gates pause attended time. Use `__entranceRoadtripPolice*` seams and run
`tests/entrance-police.js` when changing enforcement.

Demerits live separately in `entranceRoadtripDemerits:v1`; alcohol is owned by the Balcony record
`balconyDrinkState:v1`. Road Trip reads those owners for its HUD and impairment. Checkpoint reset
must not rewind either record; full reset clears them through their existing owners.

The first forward practice wrap unlocks Road Trip. Unlock and best score survive sessions, while
invitation acceptance and active presentation do not. Checkpoint restore may retain a paused run,
but active highway presentation resumes only through Entrance and requires explicit driving input
unless the route is terminal Camping. The paused-run drive snapshot also owns cruise activation and
its held-speed target; unattended lifecycle cleanup releases momentary inputs without clearing it.

Primary coverage is `tests/entrance-driving.js`, `tests/entrance-lap-odometer.js`,
`tests/entrance-recovery.js`, `tests/entrance-coach.js`, `tests/entrance-cruise.js`, `tests/entrance-roadtrip.js`,
`tests/entrance-roadtrip-pause.js`, `tests/entrance-roadtrip-scoring.js`, `tests/entrance-windshield-cracks.js`,
`tests/entrance-demerits.js`, and `tests/entrance-police.js`.

## Apps and minigames

The monitor and phone are separate registry-backed shells:

- `DESKTOP_APPS` and `TOOLBAR_APPS` define monitor apps.
- `PHONE_APPS` defines phone labels, launchers, activities, and game metadata.
- `__chatMonitorApps()` and `__chatAppCatalog()` project those registries for chat.

Do not create a second hand-maintained app catalog. Update the owning record, any intentional
Worker allowlist, and focused contract tests.

Each game owns its loop, input capture, score, result state, and teardown. App games advertise a
`game` record; scene games exposed to chat live in `CHAT_SCENE_GAMES`. `PUBLIC_GAME_IDS` is only the
Worker sanitization allowlist.

Action games publish `minigame.change` through `__loftStateChanged`. Wire every start and stop path,
including Escape, room leave, blur/hidden state, reset, and game over. High scores normally use
their own localStorage keys and stay outside the gameplay checkpoint.

## Checkpoints and recovery

Search for `LOFT_CHECKPOINT_KEY`, `checkpointPayload`, `applyCheckpoint`, and
`__registerCheckpointAdapter`. The 90-day `loftCheckpoint:v1` record contains progression, compact
puzzle state, selected phone/Album/game data, and a `systems` map from adapters.

Checkpointing begins after the Kitchen is solved or deliberately left. Writes are debounced through
`__checkpointChanged`. An adapter provides `capture()`, `restore(row, phase)`, and optionally
`reset()`. Restore uses `beforeStage` for state needed before navigation and `afterStage` for state
that depends on the settled room.

Persist only bounded, settled intent. Do not restore live timers, calls, cameras, dialogs, drags,
particles, iframe frames, media playback, or running game loops. A missing `systems` map is a legacy
record; a missing row in a modern map means that subsystem's fresh default.

The recovery gate previews saved presentation without opening lower controllers or starting media.
Continue performs one real room transition, restores adapters, opens the saved lower room through
its owner, then removes the gate. Start over clears the checkpoint.

`loftSessionExport()` / `loftSessionImport()` are smaller portable handoffs containing only progress
and puzzle state. Personal messages, photos, scripts, and app stores remain browser-local.

## Audio and lifecycle

All host-page sound uses one shared `AudioContext`. Consumers own nodes and handles, never the
context. The graph, lower-floor acoustics, focus gates, captured media, and Safari constraints live
in [audio.md](audio.md); update that file for audio changes.

Every timer, rAF loop, media source, and spawned effect needs a stop path and bounded retained
collection. Autonomous sounds require visibility and focus. Ordinary songs intentionally may keep
playing in the background.

## Rendering and browser constraints

The game uses inline SVG and HTML `foreignObject` surfaces. WebKit cannot reliably composite
layered or replaced content inside scaled foreignObjects; preserve the existing de-layered layouts
and native SVG image blits. Read `AGENTS.md` and `DEBUGGING.md` before changing monitor composition,
fullscreen geometry, touch drags, or season-gated paint.

Park off-room work instead of making it transparent. Cap timer-spawned particles because timers can
continue while animation completion pauses in background tabs.

CSS transform animation replaces an authored SVG `transform`, and `getBBox()` returns local
coordinates. Put static placement on a wrapper when animating its child, and spawn effects in the
target's coordinate-space parent.

## Localization and UI contract

Keep `T.en`, `T.cs`, and static fallbacks synchronized. `setLang()` uses `innerHTML` for authored
markup; never route visitor or model text through it. Write printable Unicode directly as UTF-8.

Loft Day intentionally carries no ARIA attributes, explicit roles, or native title tooltips.
Guidance is visible copy. Tests should use stable ids, classes, `data-*` state, and rendered behavior.
This contract is specific to `rsvp.html`, not `save-the-dates.html`.

## Chat boundary

Private Chat, Wedding crew replies, message rewriting, and Code assistance share one browser queue
and `/chat`, but use different prompts and output contracts. Search for `askChat`, `__chatContext`,
`group_chat`, `message_rewrite`, and `code_assist`.

The browser sends bounded live context from state and registries. The Worker reconstructs known
shapes, enforces origin/body/history limits, verifies Turnstile, applies rate limits, disables model
storage, normalizes output, and validates typed actions. Stable facts belong in
`chat-knowledge.json`; live state belongs in client context. Never place credentials or private
facts in either.

Keep registry projections, `PUBLIC_*` allowlists, `ACTION_SPECS`, and Code-assistant instructions
aligned. Chat tests do not require live model or Turnstile access.

## Local development and tests

Use `file://` for basic inspection and a local HTTP server for media, iframe runtimes, browser APIs,
and `/chat`. Never track local credentials.

For every change to either self-contained HTML page, run:

```sh
node tests/check.js
node tests/state.js
```

For `rsvp.html` logic or interaction changes, also run:

```sh
node tests/play.js
```

Add focused tests for the ownership boundary changed:

| Area | Focused tests |
| --- | --- |
| Solve and Enter ownership | `enter.js`, `phase2-progression.js`, `progression-transitions.js` |
| Main/lower navigation | `navigation.js`, `upstairs-keyboard-navigation.js`, `delayed-pan.js`, `rapid-navigation.js`, `lower-shortcuts.js`, `lower-room-*.js` |
| Entry, recovery, reset, trailer | `game-entry-loader.js`, `game-only-layout.js`, `url-entry.js`, `recovery.js`, `checkpoint-*.js`, `reset-hooks.js`, `cine.js` |
| Monitor, phone, menus | `menu.js`, `laptopmenu.js`, `systemmenu.js`, `monitor-*.js`, `phone-*.js` |
| Room interactions | the corresponding room or lower-room test; Entrance also uses its driving and Road Trip suites |
| Apps and games | the named test plus `minigame-vocabulary.js`; include touch coverage for shared controls |
| Messages and chat | `message-*.js`, `chat.js`, `chat-context.js`, `chat-worker.mjs`, `assistant-behavior.mjs`, `safe-actions*.js` |
| Audio/media | `media-transitions.js`, `device-audio.js`, `lower-audio.js`, `performance.js`, `leak.js` |
| Album signatures | `album-axis.mjs`, `album-render.mjs`, `album-ui.js` |
| Date/weather | `weather.js` and the relevant occasion/day test |

`tests/check.js` owns static and syntax contracts. `tests/state.js` runs independent invariant
pages. `tests/play.js` solves Phase 1 and click-storms interactions. Add new static assertions only
for meaningful recurring bug classes.

`tests/lib.js` creates a unique scratch page and Chrome profile, captures errors, blocks navigation,
and cleans up. Manual CDP runs also need a unique profile and port, a cache-busted URL, and an
`assertFresh` probe. Use real CDP Chrome for visual timing and geometry; virtual-time screenshots
distort rAF, transitions, WAAPI, media, and some season-gated paint. Check English/Czech and
desktop/mobile layouts for visible changes.

## Commit and deploy workflow

1. Give every delegated task its own branch and worktree.
2. Keep one discrete issue per commit and preserve unrelated changes.
3. Run mandatory and focused tests.
4. Commit with `Co-Authored-By: Codex (GPT-5) <noreply@openai.com>`.
5. Integrate confirmed work into `main` and remove temporary worktrees.
6. Push with `git puff` and deploy with `ssh behdad "cd w && git pull"`.

The live web root is the remote Git checkout. A pull rewrites `rsvp.html` in place, so a request can
briefly receive a truncated page. If the whole site appears unstyled or vertically stacked after a
deploy, compare local and live hashes before diagnosing the latest feature.

The Worker is deployed separately; pulling the frontend does not deploy `chat.js`.

## Search map

| Area | Search terms |
| --- | --- |
| Localization | `var T =`, `function setLang` |
| Navigation | `var STAGES`, `goToStage`, `lowerRoomForStage`, `__navigateLowerRoom` |
| Progression | `solvedRooms`, `__finishSolveAdvance`, `setSecondRound` |
| Entrance | `porscheDrive`, `roadtripState`, `entranceRoadtrip`, `__entranceDriveStep` |
| Checkpoints | `LOFT_CHECKPOINT_KEY`, `checkpointPayload`, `applyCheckpoint`, `__registerCheckpointAdapter` |
| Reset | `resetHunt`, `__registerTransientResetHook` |
| Typed API | `initLoftApi`, `register({ id:`, `__loftStateChanged` |
| Monitor apps | `DESKTOP_APPS`, `TOOLBAR_APPS`, `resetMonitorAppState` |
| Phone apps | `PHONE_APPS`, `openApp`, `phoneAppReturn`, `__chatAppCatalog` |
| Games | `CHAT_SCENE_GAMES`, `chatGamesKnowledge`, `minigame.change` |
| Messages | `var MESSAGES`, `__deliverAutonomousPhoneMessage`, `trimMessageThread` |
| Chat | `__chatContext`, `askChat`, `ACTION_SPECS`, `cleanContext` |
| Audio | `getAudioCtx`, `audioBusProxy`, `__updateSharedAudioIdle` |
| People | `ROSTER`, `__whoIsHere`, `__rosterPresence` |
| Date/weather | `__now`, `__weddingOccasion`, `__realWx`, `refreshWeatherText` |
| Album | `albumPhotoSvg`, `ALBUM_SKY_SIG`, `__albumList` |
| Console | `CONSOLE_HELP`, `CONSOLE_CMDS`, `window.loft` |
| Trailer | `startCinematic`, `stopCinematic`, `urlEntryMode` |

Debug from the subsystem's state hook and transition owner, then inspect its DOM projection and
outstanding work. Deleting mirror classes rarely repairs the underlying state.
