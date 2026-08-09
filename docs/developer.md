# Loft game developer guide

This guide is the architectural map for `rsvp.html`, the interactive Loft game. It explains where
state lives, which functions own transitions, how the major game modes fit together, and how to
change the file without reviving recurring bugs. It intentionally does not duplicate the player
instructions in [the game manual](game-manual.md), the signal graph in [the audio guide](audio.md),
or the full workflow and browser incident log in [`AGENTS.md`](../AGENTS.md).

## Contents

- [Repository and serving model](#repository-and-serving-model)
- [Runtime architecture](#runtime-architecture)
- [State and transition ownership](#state-and-transition-ownership)
- [Navigation and progression](#navigation-and-progression)
- [Input and feedback routing](#input-and-feedback-routing)
- [Apps, automation, and chat](#apps-automation-and-chat)
- [Checkpoints, recovery, and reset](#checkpoints-recovery-and-reset)
- [Lifecycle, audio, and rendering](#lifecycle-audio-and-rendering)
- [Localization and UI contracts](#localization-and-ui-contracts)
- [Development and validation](#development-and-validation)
- [Commit and deploy safety](#commit-and-deploy-safety)
- [Source search map](#source-search-map)

## Repository and serving model

The site deliberately has no application build step or framework. Its two maintained pages are
self-contained HTML files:

- `save-the-dates.html` is the invitation/save-the-date drop.
- `rsvp.html` is the game. The `loft-day`, `loft-day.html`, and `rsvp` aliases are symlinks to it.

The root `index.html` hub is planned but does not yet exist. Until then, `.htaccess` serves
`save-the-dates.html` for `/`. Keep a new invitation feature in `save-the-dates.html` and a new game
feature in `rsvp.html` unless there is a strong architectural reason to create another public file.

Supporting boundaries are:

- `chat.js`, `chat-knowledge.json`, and `wrangler.jsonc`: the Cloudflare chat Worker and its stable
  knowledge. This is deployed separately from the static site.
- `docs/game-manual.md`: player-facing concepts and controls.
- `docs/audio.md`: authoritative audio ownership, graph, attenuation, and teardown rules.
- `tests/`: zero-build Node/Chrome checks. It is not public.
- `DEBUGGING.md`: practical Chrome DevTools Protocol, WebKit, and visual-test recipes.
- `pyodide/`, `linux/`, `harfbuzzjs/`, `dos/`, `doom/`, `duke/`, and `q3/`: pinned runtime
  deliverables. Treat each as vendored product data, not generated output or an upgrade target.
- `princejs/`: the same kind of pinned runtime, but untracked — `./fetch-princejs.sh` restores it
  from upstream at a pinned SHA and applies `princejs-shim.patch` (provenance in the script
  header). `rsvp.html` probes for it and falls back to the upstream GitHub Pages build when the
  directory is absent.

The web server exposes the git working tree directly. `.htaccess` is therefore a security boundary,
not just routing configuration: it blocks developer documents, tests, Worker source/configuration,
and secret files. When adding a local note, fixture, source asset, or tool output, either keep it out
of the web root or add an explicit denial rule. Never assume an unlinked file is private.

## Runtime architecture

`rsvp.html` contains the markup, SVG strip, styles, translations, and JavaScript for the whole game.
Most logic lives in the final large inline script as a sequence of closures. Those closures expose a
small number of coordination hooks on `window`; there is intentionally no module bundler and no
single central store.

This makes source order part of the architecture:

1. SVG and HTML elements establish the scene and app surfaces.
2. Early closures may publish deferred registration hooks.
3. Later owners install navigation, captions, checkpoints, and public APIs.
4. Initialization projects restored state into the already-created subsystems.

Do not casually move a closure earlier or later. A subsystem that is authored before the checkpoint
registry must use `__deferCheckpointAdapter`, for example; code that assumes the final registry is
already present can silently skip restore registration.

There are three useful interface layers:

- **Owner functions** are the canonical in-file mutation paths, such as `goToStage`,
  `setGardenParty`, `setSecondRound`, and the Road Trip/Camping controller functions. Product code
  should use them.
- **Internal `window.__…` hooks** coordinate closures and support diagnostics. They are convenient
  search entry points, but they are not a stable external API.
- **`window.loft.api`** is the versioned automation/integration boundary. External tooling should
  prefer it over internal flags and DOM classes.

The DOM is both presentation and a projection of state. Classes and attributes often mirror a
closure-owned value so CSS and independent closures can observe it. A mirror is not a second owner:
changing a class directly does not complete the transition, persist it, stop timers, update captions,
or notify integrations.

## State and transition ownership

The game uses several focused state machines rather than one giant object. That is workable only if
each transition has one owner.

### The transition rule

Before changing a value, identify the function that already owns the event. Call or extend that
function instead of editing its effects from another closure. A complete transition may need to:

- update closure state and DOM mirrors;
- cancel or schedule delayed work;
- change captions, coaches, focus, and input ownership;
- checkpoint settled intent;
- start, attenuate, or stop ambience;
- emit `loft:statechange` through `__loftStateChanged`.

This is especially important for Party, projector, phone, navigation, Road Trip, Camping, and
checkpoint restore. Directly toggling `__gardenPartyOn`, a `body` class, the active room dot, or an
SVG group's visibility creates a plausible-looking but internally split state.

Delayed work must also belong to the transition. Use an existing timer registry or a generation
token and re-check current ownership before a callback mutates the scene. `__finishSolveAdvance` is
the model: it commits progression once, then guards its delayed pan so a later manual navigation
cannot be overwritten.

For a small self-contained transient system, register cleanup through
`__registerTransientResetHook(id, reset)`. A reset hook is not a substitute for a checkpoint adapter;
it removes timers, overlays, particles, or in-flight interaction that should never survive restore.

### Durable state versus projections

The main progression axes are intentionally distinct:

| State | Meaning | Do not confuse it with |
| --- | --- | --- |
| `stageIndex` / `currentStageName` | The visible upper room and backing strip position | What has been solved or visited |
| `maxUnlocked` | Furthest upper-room navigation frontier | Current room |
| `solvedRooms` | First-run room puzzles completed | A replayed toy action |
| `seenRooms` | Unique upper and lower rooms visited | Puzzle completion |
| `__secondRound` | Party/free-exploration story latch | Whether Party music is currently on |

The Road Trip, Camping, phone, apps, projector, and room toys add their own closure state. Checkpoint
adapters serialize only the settled parts that matter after a reload. DOM classes, open dialogs,
animation progress, and pending timers are reconstructed or discarded.

Use `window.loft.api.capabilities()` and a named `query(id, args)`, or owner-provided diagnostics,
when inspecting a running game. Reading one class or legacy flag is not enough to establish the
state of a multi-step transition.

## Navigation and progression

### Room graph

`STAGES` defines the five upper rooms and `goToStage(name, opts)` owns upper-room navigation:

| Upper room | Paired lower room |
| --- | --- |
| Kitchen / Bar | Bathroom |
| Garden / Party | Dungeon |
| Cuddly-puddly | Cinema |
| Office | Bedroom |
| Balcony | Entrance |

The lower floor is the horizontally translated `#lower-room-track`. `lowerRoomForStage()` maps the
current upper room to its pair, and `__navigateLowerRoom` owns entering and leaving that layer. The
dollhouse, number keys, arrows, and direct scene controls must converge on these owners rather than
inventing parallel navigation.

Opening the dollhouse can pause or cover a live subsystem. Returning to a room must restore the same
settled room or paused drive state, not initialize a second instance. Lower-room navigation should
return to the paired upper room only when the user explicitly asks to go up; Back/Escape first
dismisses the active game, projector, or overlay owned by that lower room.

### Morning routine and free exploration

The first run follows the upper rooms in `STAGES` order. Each room-specific `__…DoNext` walker owns
its puzzle sequence; `activateCurrentRoom()` routes the global Enter action to the appropriate
walker. Pointer/touch interaction with the depicted objects remains the primary play path.

On the first solve, `__finishSolveAdvance(from, to, navigationDelay)` records completion, unlocks the
next room, checkpoints, and optionally pans. Replaying an already-solved room may run its toy or
repeatable activity, but it must not auto-advance. Preserve that distinction when adding a shortcut
or reusing a first-run handler.

Starting Party in the Garden routes through `setGardenParty`, which calls `setSecondRound` on the
first start. That latch opens free exploration and remains set even after Party is stopped; it is
cleared only by a real reset. Do not use the music, lighting, guest population, or
`__gardenPartyOn` alone as a proxy for story progress.

The progression bridge uses `seenRooms`, not message-reading or solved-state guesses. Road Trip
exploration is complete only after Party/free exploration has begun and all ten rooms have been
visited. If the player reaches the Entrance while Party is still active, the canonical handoff winds
it down before authorizing the trip. Keep that lenient path: eligibility should not depend on noticing
or obeying one phone message.

### Road Trip and Camping

Road Trip and Camping are modes of the Entrance controller, not separate rooms in `STAGES`. The main
entry points are easiest to find through `porscheDrive`, `roadtripState`, `entranceRoadtrip`, and
`__entranceDriveStep`.

Keep these ownership boundaries intact:

- Entrance practice laps and the highway share presentation but have different progress/state.
- `roadtripExplorationComplete()` answers whether the story prerequisites are met;
  `roadtripAuthorized()` additionally requires Party to be stopped.
- `roadtripState` owns route selection, saved run, accepted trip, pause, and Camping availability.
- Driving input belongs to the HUD/controller only while `__entranceDriveKeyboardOwnership` says it
  does. A CSS class or visible dashboard is not sufficient keyboard authority.
- Starting Road Trip calls `__setPartyForegroundSuspended(true, "roadtrip")`; leaving it releases
  that suspension. This parks Party foreground work without pretending the story latch was reset.

Camping is a checkpointed sequence owned inside the same controller. Its settled progression is
split across `campFireState`, `campStewState`, `campStargazingState`, and `campSleepState`. The order
is fire, stew, stargazing, sleep/finale. Restore and replay must project the appropriate scene before
it becomes visible, so an old finale or unfinished road frame never flashes on entry.

Do not duplicate route geometry, traffic constants, finale timing, or the Camping audio graph in
this guide. Work from the controller itself, add a focused regression test for the behavior being
changed, and use [the audio guide](audio.md) for `__updateRoadtripCampAudio` and cabin exposure.

## Input and feedback routing

### Input priority

The capture-phase document keyboard router is the final arbiter for global shortcuts. Its ordering
is deliberate:

1. Typing targets and browser-reserved key combinations keep their native behavior; explicit
   developer shortcuts are handled separately.
2. Open dialogs, coaches, apps, media, minigames, and lower-room controllers get first refusal.
3. The active driving controller may claim steering/action keys.
4. Global room navigation and `activateCurrentRoom()` run only if nothing closer owns the key.

Preserve the `activeControlFocused` checks and the capture-phase ordering around Enter. Do not add an
independent bubble-phase key listener for a room action; it will eventually race a phone field,
projector, lower-room game, or car HUD.

Escape and Backspace are dismissal/back actions. Backspace is normalized through the Escape path,
except while a search input owns the key: it edits the query and remains inert at the empty boundary.
Only Escape leaves a search surface. Neither key may solve a first-run room puzzle. Within a lower
room they dismiss its currently playing activity or overlay; they do not substitute for the explicit
up-room navigation.

Pointer and touch are first-class controls. If a keyboard shortcut changes gameplay, the depicted
object or visible control still needs an equivalent click/tap path. Mobile drag prevention belongs
on a delegated non-passive `touchmove` listener on the SVG strip; `touch-action` on SVG children is
not reliable.

### Captions and coaches

`captionArbiter` is the only writer of `#hunt-caption`; `tests/check.js` enforces that boundary. It
keeps the latest persistent base for the active viewport and one transient slot whose kind is overlay
or exclusive. Producers declare an owner, room/lower-room scope, priority, duration, attended- or
wall-time clock, and optional escaped replacements. Across owners a claim must strictly beat the
visible transient; lower or equal claims are rejected rather than queued, and preempted transients
are consumed so they cannot resurface. Same-owner chatter coalesces in place. Base state may update
under a transient, while scope exit cancels scoped transient ownership.

Use `__captionBase`, `__captionOverlay`, `__captionExclusive`, and
`__cancelCaption(tokenOrOwner)`. `setCaption` and `__setLowerRoomCaption` remain stable-base helpers;
`__captureCaptionPublisher()` is the canonical delayed-base helper because it captures both viewport
scope and the room-visit generation. Keyed claims rerender on language changes; the `caption()`
console toy is literal-only, including when legacy callers pass `{html:true}`. Intro, recovery, and
Trailer are exclusive; Road Trip story beats outrank score/collision feedback; police and Camping
terminal state reject incidental copy. Checkpoint restoration batches caption derivation and paints
the resulting semantic base once.

Caption expiry and producer handoffs use the shared attention scheduler (`__scheduleAttended`, with
`__cancelAttention` for owner/token cleanup). Attended jobs park completely while hidden or
unfocused—there is no polling ticker—and resume with their exact remainder. Use that scheduler for
actionable timed results and story reveals; wall time is reserved for effects whose time must elapse
off-screen. Focused coverage is in `tests/caption-arbiter.js`, `tests/caption-delayed-producers.js`,
and `tests/caption-roadtrip-arbitration.js`.

Coaches are persistent instructional overlays, not captions. Their own controller decides when they
appear, whether navigation may continue behind them, and which action dismisses them. A coach that
points at a moving room control must be hidden during the pan and placed only after the destination
settles. Keep coach focus/tab behavior consistent with the global input contract; decorative SVG
groups should never become accidental tab stops.

## Apps, automation, and chat

### App registries

`DESKTOP_APPS`, `TOOLBAR_APPS`, and `PHONE_APPS` are the source registries for app identity and
launch behavior. Context menus, the phone shell, chat capabilities, and checkpoint adapters derive
from or mirror them. When adding or renaming an app, update the registry and every deliberately
public catalogue, including `__chatMonitorApps` or `__chatAppCatalog`, rather than special-casing one
launcher.

App focus is constrained on touch devices. Follow `appTouchConstrained` and
`appAutoFocusTextControl`: opening an app on mobile must not automatically summon the software
keyboard unless the user explicitly chose a text control.

App and minigame state follows the same durable/transient rule as rooms. Preserve a meaningful
selection or score only when a checkpoint adapter says so; close cameras, calls, dialogs, media,
intervals, and one-shot games during reset or restore.

### Typed API and console

`initLoftApi()` installs API version 3 at `window.loft.api`. Its public surface is:

- `capabilities(options)` for the discoverable action/query catalogue;
- `describe(id, args)` for one capability's validated shape and current availability;
- `query(id, args)` for structured reads;
- `perform(id, args, options)` for validated actions;
- `subscribe(listener)` for state notifications.

Successful owner transitions call `__loftStateChanged`, which increments `stateVersion` and emits
`loft:statechange`. If an API action changes the game but subscribers do not hear about it, fix the
owner transition; do not make the API mutate a DOM projection directly.

The in-game JavaScript console is a separate human-facing interface. Its command roster
`CONSOLE_CMDS` and help table `CONSOLE_HELP` must remain in parity. Internal `__…` hooks may change as
the implementation changes; do not document them as a compatibility promise to external clients.

### Chat Worker boundary

The browser builds bounded live context in `__chatContext` and sends it through `askChat` to
`/chat`. `chat.js` validates requested actions with `ACTION_SPECS`, cleans client context, calls the
model, and normalizes the result. Stable world facts belong in `chat-knowledge.json`; live room,
weather, app, and progression state belongs in the client context.

Keep `PUBLIC_MONITOR_APPS`, `PUBLIC_PHONE_APPS`, and `PUBLIC_GAME_IDS` aligned with the browser's
actual registries and typed capabilities. The Worker must never accept a free-form command and pass
it into the page. A new chat action needs a bounded schema, an allowlisted client action, and a test
on both sides of the boundary.

## Checkpoints, recovery, and reset

The durable game checkpoint is `localStorage["loftCheckpoint:v1"]`; schema version and maximum age
are defined beside `LOFT_CHECKPOINT_VERSION` and the checkpoint owner. Writes begin only after the
Kitchen is solved or deliberately left, then flow through debounced `__checkpointChanged` calls.

`checkpointPayload()` creates the record and `applyCheckpoint()` restores it. Subsystems register
settled state with `__registerCheckpointAdapter(id, adapter)`; closures created before that registry
use `__deferCheckpointAdapter`. Adapters can restore in `beforeStage` or `afterStage` phases so state
that affects initial rendering lands before the room is exposed.

An adapter should persist **intent**, not runtime mechanics:

- Persist a chosen projector channel, room visitation, Party story latch, completed Camping beat,
  or paused Road Trip run.
- Do not persist an open modal, active pointer drag, pending call, camera stream, raw timeout,
  animation frame, autonomous particle, or currently ringing sound.

For a modern checkpoint, a missing row in the `systems` map means that subsystem starts from its
fresh default. A record with no `systems` property is an older compact checkpoint and follows the
legacy restore path. Keep that distinction when adding an adapter; otherwise a new subsystem may
inherit stale DOM state or accidentally reset an existing save.

The entry recovery gate previews a checkpoint before applying it. `urlEntryMode`,
`__startGameEntryLoader`, `startCinematic`, and `stopCinematic` own page/game/trailer entry. Continue
applies the saved state; starting fresh must reset transient systems before the initial room paints.

`loftSessionExport` and `loftSessionImport` are deliberately narrower than a full checkpoint: they
move progress and puzzle state without exporting bulky or personal app data. Do not broaden that
contract incidentally while adding a checkpoint field.

## Lifecycle, audio, and rendering

### Attention and autonomous work

`__roomAutonomyAllowed(room)` is the basic attended-room predicate: the room must own the visible,
focused, uncovered foreground. `__roomAmbienceCovered` and `__foregroundAmbienceCovered` account for
larger overlays, while `__partyForegroundSuspended` parks Party work during Road Trip.

Use those owners for ambient loops, autonomous sound, timer-spawned effects, and room-only reactions.
`document.hidden` alone is insufficient: a visible but unfocused window can keep timers alive while
animation frames are throttled. Autonomous one-shot sounds must also require
`document.hasFocus()`; direct user-triggered sounds may rely on the triggering interaction.

Particle systems must have bounded cardinality. Prefer a fixed population that replenishes itself
from each particle's animation completion, or cap and remove stale nodes before spawning. An
unbounded timer plus animation-finish cleanup will accumulate nodes while the tab is throttled and
can crash after hours.

All Web Audio uses one shared `AudioContext`. Never suspend or close that context from a feature;
gate or disconnect that feature's nodes. Read [the audio guide](audio.md) before touching beds,
weather, Party, cabin exposure, media capture, or route/Camping sound. It is the authoritative graph
and lifecycle reference.

### Rendering and browser constraints

The scene is a large SVG strip with embedded HTML app surfaces. Two rules prevent many rendering
regressions:

- A CSS `transform` animation replaces an SVG element's `transform` attribute for its duration.
  Put static placement on a wrapper group or bake it into coordinates.
- `getBBox()` returns local coordinates. Spawn an effect in the target's own parent coordinate
  system, or map it deliberately through a stable ancestor.

WebKit has additional `foreignObject` limitations: layered descendants under a scaled SVG ancestor
can paint off-position, and replaced content such as canvas/video/iframe may not composite at all.
Prefer de-layered grid stacking and native SVG `<image>` blits where the existing subsystem already
uses them. Mirror state onto stable scope classes through `syncScopeMirrors`; avoid introducing a
top-anchored `:has()` dependency for a large scene.

The maintained incident patterns and verified workarounds live in [`AGENTS.md`](../AGENTS.md); test
recipes live in [`DEBUGGING.md`](../DEBUGGING.md). Consult both before "fixing" behavior seen only
under headless virtual time.

## Localization and UI contracts

Player-visible English and Czech copy lives in `T.en` and `T.cs`. Add both keys in the same change;
`tests/check.js` enforces parity. Write printable Unicode directly as UTF-8. `setLang()` assigns
authored translation HTML, so preserve intentional markup and use the established `brk-sm` /
`brk-lg` breaks when the two viewport classes need different wrapping.

After changing copy or layout, inspect both languages at mobile and desktop widths. Czech strings
are often longer, and a clean English coach or caption can overlap its target in Czech.

The game intentionally avoids browser focus rings on decorative scene objects and global room
surfaces. Only controls that participate in native keyboard focus should be tab targets. Room-global
Enter, number keys, and arrows are routed by the document controller; adding `tabindex="0"` to make
an SVG object "keyboard accessible" can steal that routing and expose an unexplained focus border.
Use the established pointer action plus global keyboard path rather than inventing a second focus
model. The game also deliberately has no piecemeal ARIA/role layer; `tests/check.js` enforces that
contract. A future accessibility model should be a coherent, tested pass—not isolated metadata on
one scene object.

## Development and validation

Serve the repository over HTTP for interactive work; media, modules, caching, and browser security
behave differently under `file://`. A simple local server is sufficient. Reuse neither a production
port nor another developer's server process.

### Testing strategy

[`AGENTS.md`](../AGENTS.md) is the authoritative test matrix. The useful layers are:

| Layer | Purpose | Main entry points |
| --- | --- | --- |
| Structural/static | Inline-script syntax, translation parity, SVG balance, console roster, source invariants | `node tests/check.js`, `node tests/state.js` |
| Full solve | End-to-end first-run solve and interaction storm | `node tests/play.js` |
| Input contracts | Document-level Enter, menus, mobile/double gestures, lower-room ownership | `tests/enter.js`, `tests/menu.js`, `tests/laptopmenu.js`, focused tests |
| State systems | Checkpoint restore, replay, Party/Road Trip/Camping, apps, audio lifecycle | focused `tests/*.js` runners |
| Rendering | Album signatures and manual EN/CS mobile/desktop inspection | `tests/album-axis.mjs`, screenshots or real CDP Chrome |

Any change to either maintained HTML file requires `check.js` and `state.js` before commit. Game
logic changes also require `play.js`; Enter and menu changes have their named mandatory runners.
Then run the focused tests closest to the ownership boundary you changed. Do not run an enormous
suite instead of adding one regression for a newly discovered bug class.

Most browser runners share helpers in `tests/lib.js`. Read a test's header before changing its
timing model or browser plumbing. A passing source assertion is not a visual proof, and a screenshot
is not an interaction proof.

### Debugging and visual verification

Headless Chrome can serve a stale `file://` document even with its network cache disabled. Use a
unique port and profile, append a unique query string, and assert that the loaded source contains
the code under test before trusting results. Navigating to the identical URL may be a same-document
navigation rather than a reload.

Virtual-time Chrome also distorts requestAnimationFrame loops, WAAPI geometry, CSS transitions, and
display-none-to-visible SVG paint. Reproduce live-geometry and season-gated rendering in a real CDP
Chrome session before changing product code. [`DEBUGGING.md`](../DEBUGGING.md) contains the current
recipes and the `assertFresh` pattern.

For every visual or interaction change, verify the relevant settled states manually in both
languages and at roughly 390 px and at least 760 px. For animated systems, inspect entry, active,
covered/paused, exit, reload, and return-to-room states—not only the attractive middle frame.

## Commit and deploy safety

Every delegated change uses its own branch and worktree. Make one bounded change, run the required
checks, commit it with the required co-author trailer, and give the owner an isolated test URL. Do
not mix another completed feature into that commit. Integration, push, and deployment happen only
after owner confirmation.

The normal confirmed path is:

1. Integrate the isolated commit into the primary branch.
2. Push with `git puff` (the configured force-with-lease alias).
3. Deploy with `ssh behdad "cd w && git pull"`.
4. Once per web root (first setup, or if `princejs/` was removed): run `./fetch-princejs.sh` there.
   The directory is untracked, so `git pull` never creates or updates it; until it exists the
   Prince app serves from the upstream GitHub Pages fallback.

The live web root is the git checkout. A visitor can fetch `rsvp.html` while `git pull` is rewriting
the multi-megabyte file and briefly receive truncated HTML. If a post-deploy report shows the entire
page stacked or unstyled, compare local/live hashes and reproduce at the reported viewport before
attributing it to the latest feature.

Cloudflare edge-caches HTML, `/`, and extensionless aliases for ten minutes. Request cache headers do
not bypass that rule. Verify a fresh deploy with a new throwaway query string or wait for the TTL;
avoid repeated pulls, which increase the torn-read window. The chat Worker has a separate deployment
path—pulling the static checkout does not publish `chat.js`.

## Source search map

Search symbols rather than relying on line numbers; `rsvp.html` changes too quickly for stable line
references.

| Concern | Search terms |
| --- | --- |
| Upper/lower navigation | `STAGES`, `goToStage`, `lowerRoomForStage`, `__navigateLowerRoom` |
| First-run solves and replay | `__finishSolveAdvance`, `__kitchenDoNext`, `__gardenDoNext`, `__cuddlyDoNext`, `__officeDoNext` |
| Party/free exploration | `setGardenParty`, `setSecondRound`, `__secondRound`, `seenRooms` |
| Entrance and Road Trip | `porscheDrive`, `roadtripState`, `roadtripAuthorized`, `__entranceDriveStep` |
| Camping | `campFireState`, `campStewState`, `campStargazingState`, `campSleepState` |
| Keyboard routing | `activeControlFocused`, `activateCurrentRoom`, `__entranceDriveKeyboardOwnership` |
| Captions | `captionArbiter`, `__captureCaptionPublisher`, `__captionOverlay`, `__setLowerRoomCaption`, `refreshHuntCaption` |
| Checkpoints | `checkpointPayload`, `applyCheckpoint`, `__registerCheckpointAdapter`, `__deferCheckpointAdapter` |
| Lifecycle | `__roomAutonomyAllowed`, `__foregroundAmbienceCovered`, `__setPartyForegroundSuspended` |
| Apps | `DESKTOP_APPS`, `TOOLBAR_APPS`, `PHONE_APPS`, `appTouchConstrained` |
| Typed API | `initLoftApi`, `window.loft.api`, `__loftStateChanged` |
| Chat | `__chatContext`, `askChat`, `ACTION_SPECS`, `PUBLIC_MONITOR_APPS` |
| Entry/recovery | `urlEntryMode`, `__startGameEntryLoader`, `startCinematic`, `stopCinematic` |
| Scope mirrors | `syncScopeMirrors` |
