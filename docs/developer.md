# Developer guide

This is an entry map for the implementation that exists today. `rsvp.html` moves often, so search
for the named symbols instead of relying on line numbers. Names beginning with `__` are usually
debug, test, or cross-controller seams; they are not a stable external API unless documented on
`window.loft` or `loft.api`.

## Repository boundaries

- `save-the-dates.html` is the invitation/save-the-date page.
- `rsvp.html` is Loft Day: one self-contained file containing its HTML, CSS, inline SVG, English
  and Czech copy, state, controllers, apps, and console.
- `loft-day`, `loft-day.html`, `rsvp`, and `rsvp.html` resolve to the game; the clean aliases are
  tracked symlinks, not generated routes.
- `chat.js` is the Cloudflare Worker behind `/chat`. `chat-knowledge.json` contains verified stable
  facts; `wrangler.jsonc` owns the route, model configuration, secrets contract, and rate limiter.
- `tests/` contains zero-dependency Node and headless-Chrome checks. `tests/lib.js` is the shared
  scratch-page runner.
- `art/` holds ordinary media. `pyodide/`, `linux/`, `dos/`, `doom/`, `duke/`, `q3/`, and
  `harfbuzzjs/` are pinned, self-hosted runtime deliverables with provenance in their `BUILD.md` or
  README files. Do not regenerate or upgrade them casually.

There is no frontend build, framework, package bundle, or CDN runtime. Google Fonts is the one
deliberate network exception. Keep new game code inside `rsvp.html` unless there is a strong reason
to create a separately deployed boundary such as the chat Worker.

Apache serves the Git working tree directly. `.htaccess` blocks Markdown, tests, Worker source and
configuration, agent instructions, and local secret files; check its rules before adding another
tracked internal file.

## Entry and presentation modes

The default `rsvp.html` load includes the surrounding invitation. `#play` and the `loft-day` aliases
select the game-only shell but start no activity. `#trailer` starts the curated one-minute game
trailer after normal entry or checkpoint recovery has settled. Search for `urlEntryMode`,
`startCinematic`, and `stopCinematic`.

Every game-only entry, including installed/standalone launch, uses the bilingual
`#installed-load` progress cover while the single-file game parses. The legacy
`__installedLoaderUsed` / `__installedLoaderComplete` probes describe that shared game-entry
loader; the revealed invitation removes it synchronously and never paints it. The cover retires
after `DOMContentLoaded`, by which point either CLICK ME or checkpoint recovery has established
the interactive entry surface.

The trailer is a fixed editorial timeline, not an autonomous player. It owns `window.__cinematic`,
its timers, cuts, overlay, score, previews, and teardown. `stopCinematic` must remain the single
cleanup path for completion, Take over, and hidden-tab abort. The removed autoplay director and
scripted `?keys=` URL entry are not compatibility surfaces; do not restore their code, tests, or
documentation.

Game chrome has four presentations worth checking independently:

1. full RSVP page;
2. direct `#play`/`#trailer` browser entry;
3. installed/standalone PWA entry;
4. the narrow portrait orientation gate.

The fresh CLICK ME overlay and saved-session recovery gate share entry chrome but have different
state effects. `.loft-entered` enlarges direct game mode without claiming browser fullscreen.
`.is-fullscreen` and native Fullscreen API ownership remain explicit. Start with
`tests/game-entry-loader.js`, `tests/game-only-layout.js`, `tests/url-entry.js`, `tests/recovery.js`, and
`tests/monitor-fullscreen.js` when changing this area.

## State ownership

There is intentionally no central store. State lives in four places:

- closure variables inside subsystem IIFEs;
- DOM classes, attributes, and CSS custom properties used as rendering truth;
- a limited set of cross-controller `window.__...` mirrors and hooks;
- the public `window.loft` status object and typed `window.loft.api` facade.

Every shared transition needs one owner: normally a `set*` function or a paired `start*`/`stop*`
function. UI handlers, console commands, typed actions, checkpoint restore, reset, and trailer code
must call that owner rather than editing its mirror classes or flags independently. Delayed work
must be cancellable or generation-guarded.

Controllers are declared in source order but communicate through feature-detected hooks. A new
state axis commonly needs to re-gate room, focus, visibility, audio, people, messages, and device
controllers. Keep the notifications explicit; do not replace them with a polling loop.

`__registerTransientResetHook(id, reset)` is for small closure-local controllers. Durable systems
keep explicit reset owners and may also register a checkpoint adapter. Full reset isolates hook
failures so one subsystem cannot strand later cleanup.

### Public typed state

Search for `initLoftApi`, `register({ id:`, and `__loftStateChanged`. `loft.api` registers bounded
queries and actions, validates arguments and availability, and emits `loft:statechange` after a
semantic mutation. `stateVersion` advances for meaningful room, environment, app, call, media,
message, album, and minigame transitions—not animation frames, score ticks, or incidental counters.
Composite typed actions coalesce synchronous owner mutations into one revision.

Use `loft.api.capabilities()`, `query()`, `perform()`, and `subscribe()` for integrations. The many
`__...State` functions are narrower diagnostic seams and may change with their controller.

`ACTION_SPECS` in `chat.js` is a second validation boundary for model-proposed actions. Keep it
aligned with the client registry, but never pass raw selectors, URLs, JavaScript, or private
function names through the Worker.

## Rooms, floors, and progression

### Ten-room navigation

The five main rooms are the `STAGES` array:

| Main strip stage | Paired lower panel | Lower identity |
| --- | --- | --- |
| `kitchen` | Bathroom | `bathroom` |
| `garden` | Prince dungeon | `dungeon` |
| `cuddly` | Cinema | `cinema` |
| `office` | Bedroom | `bedroom` |
| `balcony` | Entrance/garage | `entrance` |

The main rooms are adjacent groups in `#loft-game-strip`; `goToStage(name)` translates the
500%-wide strip by 20% per stage and is the central room-change re-gate. It collapses office zoom,
closes ordinary lower-room ownership, parks distant room animation, and re-evaluates room-bound
media, audio, people, particles, devices, and captions.

The five lower roots live in `#lower-room-track`. `lowerRoomForStage()` is the pairing table and
`__navigateLowerRoom(name)` is the horizontal-floor owner. It changes the paired main stage and
opens the destination lower panel as one queued 720 ms transition, so arrows, dots, and `1`–`5`
stay on the lower row without exposing the main strip between rooms. Vertical open/close remains
owned by each lower controller. Checkpoint state stores a lower identity only when it matches the
saved main room.

Both floors settle one room at a time under held keyboard navigation. During a main-strip slide,
every traversed stage stays paintable until `transitionend` or its timeout fallback; then
`stage-far` parking leaves only the destination active. Preserve that lifecycle to avoid gaps,
tearing, off-room animation, or captions that disagree with the visible room.

Start navigation work with `tests/navigation.js`, `tests/upstairs-keyboard-navigation.js`,
`tests/delayed-pan.js`, `tests/rapid-navigation.js`, `tests/lower-shortcuts.js`,
`tests/lower-room-markers.js`, and `tests/lower-room-recovery.js`.

### Entrance driving and highway

Search for `entrancePorscheDrive`, `__entranceDriveStep`, and `entranceRoadtrip`. The Entrance
controller owns the ordinary car state and the nested `drive.roadtrip` record: unlock/practice,
current-run distance and scoring, the bounded entity pool, and lifecycle flags. The roadtrip reuses
the driving step instead of starting a second frame loop. `__entranceRoadtripStart()` and
`__entranceRoadtripSpawn(type, lane)` are narrow deterministic test seams; player input still goes
through the dashboard's existing steering, shift, throttle, brake, and dismiss owners.

The drivetrain uses the 2010 base Boxster's six manual ratios (`3.667`, `2.050`, `1.407`, `1.133`,
`.972`, `.841`), `3.875` final drive, and `235/50 R17` rear-tire circumference. Coupled RPM is derived
directly from road speed; first-gear launch slip is the only exception. The 7,500 rpm limiter,
350 ms shift interruption, torque curve, drag, 263 km/h power-limited top speed, and progressive
pedal ramp calibrate a correctly shifted 0–100 km/h run near the published 5.9 seconds. Keep
`__entranceDriveRpmForSpeed()`, `__entranceDriveAcceleration()`, and `__entranceDriveSetMotion()` as
deterministic focused-test seams when tuning this model.

The first-person world is native SVG under `#entrance-drive-hud-svg`. `#entrance-room.roadtrip-active`
expands its viewBox and HUD while leaving `#entrance-room-art` and `#entrance-porsche` rendered so
spatial-audio geometry remains valid. The roadtrip weather layers follow the Entrance's existing
day/cloud/rain/snow/winter classes. Keep runtime traffic, wildlife, and tokens capped by the owned
pool; never let timer- or step-spawned entities accumulate without a bound.
The road uses four equal lanes around a dynamic double-yellow centre. Positive-lane traffic advances
in the two right-hand lanes; negative-lane traffic uses front/headlight art and a negative world
velocity so it closes faster from the opposite lanes. The Porsche's roadtrip lane is separate from
the side-view SVG lane offset and starts at `0.5`, the inner right-hand lane.
Traffic types are `car`, `pickup`, `truck` (semi), and `rv`; each owns rear and oncoming-front
templates, speed, scale, and mass treatment. Keep the natural spawn table varied, with RVs common
enough to read as Alberta highway traffic. `deer` and the compatibility-named `rabbit` render as a
mule deer and snowshoe hare.
`roadtripCurvatureAt()` defines alternating eased bends. `roadtripCurveOffset()` integrates the
upcoming curve into the sampled asphalt, shoulder, lane, furniture, sign, and entity projection,
while the current curvature adds a small unsteered outside drift. Curve-warning uses are separately
pooled and placed 54 road units before their matching bend. The player range extends beyond the four
lane centres into rumble and gravel zones; `syncRoadtripShoulder()` owns their view vibration, grip
reduction, speed bleed, classes, and exposed test state.
`porscheTireAudioMix()` is the deterministic speed/steering/surface projection for the continuous
road, tire, wind, corner-squeal, and shoulder textures. It shares the drivetrain bed but uses a
separate tire spatial output so a closed roof can muffle high frequencies without the engine's
lower cutoff erasing them.
The top-centre ornament is a live SVG mirror. A clean traffic pass keeps the pooled entity alive
briefly behind the player; `paintRoadtripMirror()` projects it into a separate six-use mirror pool,
swaps forward traffic to its front/headlight template, and releases it after 38 road units. The main
windshield hides passed entities below its lower edge, so a pooled vehicle is never painted in both
views at once.
Wildlife switches to a timed hop-and-verge escape inside 22 road units: a slow approach gives the
escape its required `0.48s`, while a fast same-lane arrival can reach the collision zone first.
Roadtrip event feedback is routed through the shared lower-room caption flash; do not place transient
score or coaching copy over the windshield.
Collectibles use pooled `heart`, `kiss`, and `inf` entities worth 100/250/500 before the multiplier;
the original `token` test-seam input remains a compatibility alias for `inf`.
`roadtripCollisionSeverity()` combines relative velocity with a per-object mass factor. It scales
speed loss, shake displacement, SFX gain/duration, and crack opacity. Forward traffic and wildlife
use the localized `.roadtrip-cracked` layer; same-lane oncoming traffic hard-stops/stalls the Porsche
and uses the full `.roadtrip-shattered` layer. Restart repairs either windshield state.

The third forward practice wrap unlocks the highway and reveals the owned SVG invitation; it does not
start the roadtrip. Acceptance persists as `drive.roadtrip.accepted`, while Later is transient and the
card returns on a later dashboard opening. Closing the Entrance parks an accepted run
and live entities; the first positive driving step after reopen resumes it. Escape/the close control
first exits an active highway to the street HUD and suppresses automatic re-entry until the car stops;
the next Escape dismisses the dashboard and clears the run while retaining unlock and best. Full reset also clears
unlock/practice, while the best score remains localStorage-owned. Checkpoints persist compact settled
roadtrip counters but not active presentation, spawn timing, or live entities. Run
`tests/entrance-driving.js`, `tests/entrance-lap-odometer.js`, `tests/entrance-recovery.js`, and
`tests/entrance-roadtrip.js` for this boundary.
Checkpoint restore marks the first-drive coach complete before the Entrance reopens; a fresh reset
still owns the four-step lesson, and the dashboard help control remains its explicit replay path.

### Phase and solved-state model

The main progression values have separate jobs:

- `stageIndex` / `currentStageName` identify the visible paired room;
- `maxUnlocked` is the furthest main room available to normal navigation;
- `solvedRooms` records each room's completion independently;
- `window.__secondRound` is the latched phase-two state.

Phase one is the linear kitchen → garden → cuddly → office → balcony solve. Each room's controller
owns its clue sequence and `__*DoNext` walker. Completion calls
`__finishSolveAdvance(from, to)`, which marks `from` solved, unlocks `to`, and navigates only if the
player is still in the source room. The last condition prevents stale animation timers from pulling
the player away. Unsolved rooms restore their current instruction; solved rooms restore their
stable exploration caption. Do not infer solved state from the next room's unlock.

`setSecondRound(true)` is the phase-two transition owner. The first party start latches it, unlocks
and marks all rooms solved, releases phase-two-held content, and changes Enter into each room's
principal free-play activity. Turning the party off does not return to phase one; only reset clears
the latch. Phase-one solve walkers and captions must remain inert once it is set.

`goToStage()` is intentionally permissive for scripting and tests and unlocks through its target.
Visible arrows and dots apply their own frontier rules. Keep progression assertions in
`tests/play.js`, `tests/enter.js`, `tests/phase2-progression.js`, and
`tests/progression-transitions.js`.

The phase-two `actTwo` sequencer keeps completion, fallback pacing, and caption ownership separate.
`liveMs` advances fallbacks on attended whole-loft time, while `claimElapsed` advances only when the
beat's main room is actually visible. The `act_b2` party-switch hinge has no caption timeout: its
caption and switch pulse retire only when the visitor flips the switch and starts the party.

## Apps and minigames

The office monitor and pocket phone are separate shells with registry-backed catalogs:

- `DESKTOP_APPS` defines monitor desktop and search-only apps; `TOOLBAR_APPS` adds Weather and
  Clock. `__chatMonitorApps()` projects this catalog for Charlie. The running-task registry survives
  normal close or app switching; per-app Kill and shutdown paths own destructive reset.
- `PHONE_APPS` defines phone labels, tiles, launchers, activities, and game metadata. The phone owns
  installed slots, recents, Back/close return intent, shell lock, and bounded app state.
  `__chatAppCatalog()` combines phone and monitor projections.

Do not build a second hand-maintained app directory. Add metadata to the owning app record, then
update any intentional Worker allowlist (`PUBLIC_MONITOR_APPS`, `PUBLIC_PHONE_APPS`) and focused
contract tests.

There is no single runtime manager for all games. Each scene or app controller owns its loop,
input capture, score/high score, result screen, and teardown. App games advertise a `game` record on
their app definition. The four scene games currently exposed to Charlie outside app definitions
live in `CHAT_SCENE_GAMES`; `chatGamesKnowledge()` combines both sources. `PUBLIC_GAME_IDS` is the
Worker-side sanitization allowlist, not a gameplay registry.

Action games publish `minigame.change` through `__loftStateChanged`. Messages uses that event to
hold previews and badges while Alien Resources, Flair Catch, Block Party, or Hack-Man owns input.
When adding a comparable game, wire start and every stop path to the same event and tear down on
Escape, room leave, blur/hidden state, reset, and game over as appropriate. High scores normally
live in their own `localStorage` keys and are intentionally outside the gameplay checkpoint.

## Checkpoints and recovery

Search for `LOFT_CHECKPOINT_KEY`, `checkpointPayload`, `applyCheckpoint`, and
`__registerCheckpointAdapter`. The versioned `loftCheckpoint:v1` record expires after 90 days and
contains:

- progression: main room, unlock frontier, solved rooms, paired lower room, phase, party,
  daylight, and BBQ;
- the compact phase-one puzzle record;
- separately owned phone, album, and Hack-Man data;
- a `systems` map captured by subsystem adapters.

Checkpoint creation is gated on `roomSolved("kitchen")`: tap-only and mid-Kitchen visits have no
recoverable record, and loading clears a current-format record without that solved marker. A
progressed legacy v1 record without `solvedRooms` remains compatible when its unlock frontier is
beyond the Kitchen. Writes are debounced through `__checkpointChanged`. A subsystem adapter provides
`capture()`, `restore(row, phase)`, and optionally `reset()`. Restore has two passes:
`beforeStage` for state that must precede room selection and `afterStage` for geometry or
presentation that depends on the settled destination. Validate every row and restore only bounded,
settled intent—not live timers, calls, cameras, dialogs, drag motion, particles, iframe frames, or
running minigame loops.

A payload with no `systems` property is an older/portable record; the compact compatibility fields
remain authoritative until the next save. In a modern payload, a missing adapter row means that
subsystem's fresh default.

The recovery gate is a modal state boundary and paint cover. It previews the saved main/lower room
without calling lower-room open hooks or starting audio/media. Its capture-phase keyboard handler
prevents gameplay shortcuts from mutating the unopened save. Continue restores puzzle and adapter
state around one real room transition, opens the saved lower room through its normal owner, then
removes the gate. Start over clears the checkpoint and returns to fresh CLICK ME state.

Device recovery stores physical shell state rather than arbitrary live app execution. The monitor
returns to its desktop with saved surface, power, zoom, and dock order. The phone restores whether
it was open, deliberately requires authentication again on page-load Continue, and preserves
Messages as the only foreground app eligible to resume; other apps return to the launcher. Calls,
cameras, media execution, and heavyweight runtimes do not resume.

`loftSessionExport()` / `loftSessionImport()` are deliberately smaller portable handoffs containing
only progress and puzzle state. Personal messages, photos, scripts, and bulky app stores stay in the
browser.

## Audio and lifecycle

All host-page sound uses one shared `AudioContext`; consumers own nodes and handles, never the
context. Continuous beds, one-shot SFX, captured songs, lower-floor acoustics, focus/visibility
gates, and Safari constraints are documented in [audio.md](audio.md). Read and update that document
for any graph or lifecycle change instead of duplicating it here.

At a high level, room changes re-gate every room-bound source, lower rooms share a filtered acoustic
boundary, autonomous sounds require both visibility and focus, and ordinary songs intentionally
may continue in the background. A user gesture is not a substitute for teardown: every timer,
rAF loop, media source, and spawned effect still needs an explicit stop path and bounded retained
collection.

## Rendering and browser constraints

The main strip is inline SVG with HTML `foreignObject` surfaces for the office monitor. WebKit
cannot reliably composite layered or replaced content inside a scaled `foreignObject`; keep those
surfaces de-layered and use native SVG `<image>` blits where the current implementation does. Read
the cross-browser notes in `AGENTS.md` and the practical recipes in `DEBUGGING.md` before changing
monitor composition, fullscreen geometry, touch drags, or season-gated paint.

Off-room work must be parked, not merely made transparent. Ambient loops should run only while
their owning room/state is visible and attended. Timer-spawned particles need self-replenishing or
capped collections because background tabs pause animation completion while timers may continue.

The calendar treats summer as June through September 21 and starts autumn on September 22. Keep
that boundary synchronized across `decorForDate`, both local `summerSeason` climate helpers, and
`autumnPlaySeason`; they respectively own whole-loft dressing, warm ambience/sprinkler play, and
the leaf-pile window.

SVG transforms have two recurring hazards: a CSS transform animation replaces an authored
`transform` attribute, and `getBBox()` returns local coordinates. Put static positioning on a
wrapper when animating a child, and spawn effects into the target's own coordinate-space parent.

## Localization and metadata-free UI

Visible copy is bilingual. Keep `T.en`, `T.cs`, and any static fallback synchronized in the same
commit. `setLang()` uses `innerHTML` for authored markup; never insert visitor or model text through
that path. Write printable Unicode directly as UTF-8.

The Loft Day game DOM intentionally has no ARIA attributes, explicit `role` metadata, or native
`title` tooltips. Its player guidance is visible copy: captions, cards, labels, and explicitly
authored coaches. Do not add invisible accessibility/tooltip message keys, and do not restore
metadata to satisfy a stale test. Focused tests should use stable ids, classes, `data-*` state, and
rendered behavior rather than translated metadata selectors. This stance is specific to the game;
do not infer it for `save-the-dates.html`.

## Chat boundary

Private Chat, Wedding crew replies, authored-message rewriting, and Code assistance share one
serialized browser queue and the `/chat` Worker, but have different prompts and output contracts.
Search the client for `askChat`, `__chatContext`, `group_chat`, `message_rewrite`, and
`code_assist`.

The browser sends bounded live context assembled from the current state and the app/game
registries. The Worker reconstructs known shapes, enforces origin, body and history limits, verifies
Turnstile, applies the edge rate limit, disables model storage, normalizes strict output, and
validates optional typed actions. Stable facts belong in `chat-knowledge.json`; live state belongs
in client context. Never put credentials, private facts, or operational access details in either.

Keep the client registry projections, `PUBLIC_*` Worker allowlists, `ACTION_SPECS`, and Code
assistant instructions aligned when adding an app, public game, typed action, or scripting feature.
Run the chat/Worker tests without requiring live model or Turnstile access.

## Local development and tests

Basic inspection works over `file://`, but use a local HTTP server for media, iframe runtimes,
browser APIs, and `/chat` integration. Never add local credentials to tracked files.

For every change to either self-contained HTML page, run:

```sh
node tests/check.js
node tests/state.js
```

For `rsvp.html` game logic or interaction changes, also run:

```sh
node tests/play.js
```

Add the focused runner for the ownership boundary you changed:

| Area | Focused tests |
| --- | --- |
| Room solve and Enter ownership | `enter.js`, `phase2-progression.js`, `progression-transitions.js` |
| Main/lower navigation | `navigation.js`, `upstairs-keyboard-navigation.js`, `delayed-pan.js`, `rapid-navigation.js`, `lower-shortcuts.js`, `lower-room-*.js` |
| Entry, recovery, reset, trailer | `game-entry-loader.js`, `game-only-layout.js`, `url-entry.js`, `recovery.js`, `checkpoint-*.js`, `reset-hooks.js`, `cine.js` |
| Monitor/phone shells and menus | `menu.js`, `laptopmenu.js`, `systemmenu.js`, `monitor-*.js`, `phone-*.js` |
| Room-specific interactions | the corresponding `kitchen`/`garden`/`cuddly`/`office`/`balcony` or lower-room focused file; Entrance driving also runs `entrance-driving.js` and `entrance-roadtrip.js` |
| Apps and games | the named app/game test plus `minigame-vocabulary.js`; include touch tests for shared D-pads or drag controls |
| Messages and Charlie | `message-*.js`, `chat.js`, `chat-context.js`, `chat-worker.mjs`, `assistant-behavior.mjs`, `safe-actions*.js` |
| Audio/media lifecycle | `media-transitions.js`, `device-audio.js`, `lower-audio.js`, `piano-message.js`, `performance.js`, `leak.js` |
| Album render signatures | `album-axis.mjs`, `album-render.mjs`, `album-ui.js` |
| Date/weather/occasion gates | `weather.js` and the corresponding occasion/day test |

`tests/check.js` performs static/syntax contracts: inline script parsing, dictionary parity, SVG
group balance, unique ids, console command/help parity, shared-audio construction, and other
recurring structural checks. Add a static check only for a meaningful repeat bug class.

`tests/state.js` runs independent stateful invariant pages. `tests/play.js` is the end-to-end phase
one solve and interaction storm. `tests/enter.js` drives only the document-level Enter path.
`tests/menu.js` and `tests/laptopmenu.js` own context-menu contracts. `tests/album-axis.mjs` uses a
real CDP Chrome raster comparison because source inspection cannot prove two room photographs look
different.

### Runner isolation

`tests/lib.js` copies the page to a unique scratch file, injects a narrow harness before
`</body>`, starts a fresh Chrome profile, captures errors and unhandled rejections, blocks external
navigation, and removes the scratch/profile afterward. `runPageSync()` serves one-shot tests;
`runPage()` lets independent pages run concurrently. `WEDDING_TEST_ROOT` can point the same harness
at another checkout.

Each manual CDP run also needs a unique profile and port, a cache-busted URL, and an `assertFresh`
probe that proves the loaded page contains the code under test. Headless virtual time distorts rAF,
CSS transitions, WAAPI geometry, media clocks, and some season-gated paint. Test settled semantic
state there; use real CDP Chrome and screenshots for visual timing and geometry. Always inspect
English/Czech and desktop/mobile layouts for visible copy or layout work.

## Commit and deploy workflow

1. Put every delegated task in its own branch and Git worktree. Never share a writable checkout.
2. Keep one discrete issue per commit and preserve unrelated working-tree changes.
3. Run the mandatory and focused tests for the files and ownership boundary touched.
4. Commit with the required trailer:

   ```text
   Co-Authored-By: Codex (GPT-5) <noreply@openai.com>
   ```

5. Review and integrate the isolated commit into `main`, then remove the temporary worktree.
6. Push with `git puff` and deploy with `ssh behdad "cd w && git pull"`.

The live web root is the remote Git checkout. A pull rewrites the multi-megabyte `rsvp.html` in
place, so a request during that write can receive a truncated page. If a post-deploy report shows
the entire page unstyled or vertically stacked, compare local/live hashes and reload at the reported
viewport before diagnosing the latest small change.

The Worker is a separate Cloudflare deployment. A frontend Git pull does not deploy `chat.js`.

## Search map

| Area | Search terms |
| --- | --- |
| Localization | `var T =`, `function setLang` |
| Main/lower navigation | `var STAGES`, `goToStage`, `lowerRoomForStage`, `__navigateLowerRoom` |
| Progression | `solvedRooms`, `__finishSolveAdvance`, `setSecondRound` |
| Entrance highway | `entrancePorscheDrive`, `entranceRoadtrip`, `__entranceDriveStep` |
| Checkpoints | `LOFT_CHECKPOINT_KEY`, `checkpointPayload`, `applyCheckpoint`, `__registerCheckpointAdapter` |
| Reset | `resetHunt`, `__registerTransientResetHook` |
| Typed API | `initLoftApi`, `register({ id:`, `__loftStateChanged` |
| Monitor apps | `DESKTOP_APPS`, `TOOLBAR_APPS`, `resetMonitorAppState` |
| Phone apps | `PHONE_APPS`, `openApp`, `phoneAppReturn`, `__chatAppCatalog` |
| Games catalog | `CHAT_SCENE_GAMES`, `chatGamesKnowledge`, `minigame.change` |
| Messages | `var MESSAGES`, `__deliverAutonomousPhoneMessage`, `trimMessageThread` |
| Chat client | `__chatContext`, `askChat`, `CHAT_PROXY_URL` |
| Chat Worker | `ACTION_SPECS`, `cleanContext`, `verifyTurnstile`, `callOpenAI` |
| Shared audio | `getAudioCtx`, `audioBusProxy`, `__updateSharedAudioIdle` |
| People and roster | `ROSTER`, `__whoIsHere`, `__rosterPresence` |
| Date/weather | `__now`, `__weddingOccasion`, `__realWx`, `refreshWeatherText` |
| Album | `albumPhotoSvg`, `ALBUM_SKY_SIG`, `__albumList` |
| Console | `CONSOLE_HELP`, `CONSOLE_CMDS`, `window.loft` |
| Trailer | `THE TRAILER`, `startCinematic`, `stopCinematic`, `urlEntryMode` |

Most debugging should begin with the subsystem's state hook and transition owner, then inspect its
DOM projection and outstanding timers. Avoid repairing state by deleting classes manually; that
usually leaves audio nodes, callbacks, retained app state, or paired room ownership behind.
