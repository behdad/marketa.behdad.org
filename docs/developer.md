# Loft game developer guide

This guide is the architectural map for `loft-day.html`, the interactive Loft game. It explains where
state lives, which functions own transitions, how the major game modes fit together, and how to
change the file without splitting ownership. It intentionally does not duplicate the player
instructions in [the game manual](game-manual.md), the signal graph in [the audio guide](audio.md),
or workflow and browser-specific guidance in [`AGENTS.md`](../AGENTS.md).

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

The site deliberately has no application build step or framework. Its two maintained experiences
remain page-owned:

- `egg-hunt.html` is the canonical invitation/Egg Hunt source. The `egg-hunt`,
  `save-the-dates`, and `save-the-dates.html` names are symlinks to it; only a
  save-the-dates-named URL or the directory root reveals the surrounding invitation.
- `loft-day.html` is the canonical game source. Its narrow external authored runtime files are the
  review-friendly `loft-day.en.js` and `loft-day.cs.js` message dictionaries plus the public
  `code-snippets/` samples used by the in-game IDE. The `loft-day`,
  `rsvp`, and `rsvp.html` names are symlinks to it; only an RSVP-named URL reveals the surrounding
  invitation content.

The root `index.html` hub is planned but does not yet exist. Until then, `.htaccess` serves the
`save-the-dates.html` alias for `/`. Keep a new invitation feature in `egg-hunt.html` and a new game
feature in `loft-day.html` unless there is a strong architectural reason to create another public file.

Supporting boundaries are:

- `chat.js`, `chat-knowledge.json`, and `wrangler.jsonc`: the Cloudflare chat Worker and its stable
  knowledge. This is deployed separately from the static site.
- `docs/game-manual.md`: player-facing concepts and controls.
- `docs/audio.md`: authoritative audio ownership, graph, attenuation, and teardown rules.
- `tests/`: zero-build Node/Chrome checks. It is not public.
- `DEBUGGING.md`: practical Chrome DevTools Protocol, WebKit, and visual-test recipes.
- `pyodide/`, `linux/`, `harfbuzzjs/`, `dos/`, `doom/`, `duke/`, and `q3/`: pinned runtime
  deliverables. Treat each as vendored product data, not generated output or an upgrade target.
  Pyodide's core and starter wheels are local; other supported imports use its version-pinned
  official package repository.
- `princejs/`: the same kind of pinned runtime, but untracked — `./fetch-princejs.sh` restores it
  from the source and patch recorded in the script header. The app falls back to the pinned upstream
  build when the directory is absent. That cross-origin fallback keeps iframe scrolling disabled:
  upstream’s full-height root has a fractional top margin that otherwise creates scroll chrome,
  while the local shim owns its overflow and intrinsic aspect directly.

The web server exposes the git working tree directly. `.htaccess` is therefore a security boundary,
not just routing configuration: it blocks developer documents, tests, Worker source/configuration,
and secret files. When adding a local note, fixture, source asset, or tool output, either keep it out
of the web root or add an explicit denial rule. Never assume an unlinked file is private.

## Runtime architecture

`loft-day.html` contains the markup, SVG strip, styles, and JavaScript for the whole game. English and
Czech messages live beside it in `loft-day.en.js` and `loft-day.cs.js`; `code-snippets/` likewise
keeps reviewable Code examples and the authored Trailer timeline outside the large game source. Most logic
lives in the final large inline script as a sequence of closures. Those closures expose a small
number of coordination hooks on `window`; there is intentionally no module bundler and no single
central store.

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
- **`window.loft`** is the sole public app root; its `loft.api` transport is the versioned
  automation/integration boundary. External tooling should prefer the typed namespaces over
  internal flags and DOM classes.

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

The combined opening landmarks coach blocks scene input while leaving the explicit whole-loft Reset
available. Its two arrows share one card and point to the top navigation and bottom instruction plate.

Opening the dollhouse can pause a live subsystem such as Road Trip. Returning to a room must restore the same
settled room or paused drive state, not initialize a second instance. Lower-room navigation should
return to the paired upper room only when the user explicitly asks to go up; Back/Escape first
dismisses the active game, projector, or overlay owned by that lower room.

The dollhouse is a retained static compositor, not ten live room clones. It serializes one canonical
room tree per idle slice into a bounded WebP capture; the detached capture shell clears both horizontal
stage transforms and the viewport's vertical floor-pan translate, so captures are independent of the
floor currently being viewed. The map displays only those images, so opening it
does not wake parked room timelines. **CLICK ME** warms fresh day/night defaults, while **Continue**
warms the checkpoint's saved lighting and Party shell. Day/night variants are reusable. Each Party
ignition invalidates and recaptures only the five upper rooms after Party population settles, freezing
the current occupants without retaining their animation trees; stopping Party and changing day/night
likewise invalidate the newly selected state once. The exploration coach waits for that event-driven
capture set to finish. Each deliberate raster capture discards only its partial frame-health sample
(the independent FPS display remains honest), so encoding work cannot demote an otherwise healthy
Party. Opening the picker and elapsed time never initiate another scan. UV is deliberately excluded. Never
reintroduce live `<use>` cards: they multiply style/layout/animation work and let WebKit shadow content
escape its room. Retain the compressed captures for immediate reopen. The picker itself is never
withheld: cold cards expose a per-card progress indicator, while a missing lighting or Party variant
keeps showing its last capture until the replacement lands. Each capture records a semantic key
(lighting/Party variant plus that room's occupant assignment), so only explicit Party/lighting
transitions schedule work. Animation phase and the
Garden card's fixed four-pool composition never invalidate the cache. Dungeon remains the direct
static vector card because it has no authored state variation.

The Office monitor retains app DOM and runtime state across zoom and room changes. At room scale,
HTML stays in its canonical `foreignObject`; zoom promotes the foreground root itself, not a clone,
into the ordinary-DOM `#monitor-html-overlay`, then restores it before the SVG moves. Native SVG apps
stay in the SVG path. This identity-preserving promotion is the default for HTML monitor apps and is
the WebKit-safe boundary for focused interaction. The viewport’s shared `device-zoomed` state hides
all three roster surfaces (chip, panel, and modal backdrop), preserving their state so they return
when either device releases the view. Iframe-owned game canvases must be sized from the
physical screen box rather than through ancestor CSS zoom. Establish that host before creating a
runtime iframe, and reconcile an active surface by root/owner identity: state-only mutations refit in
place and must never reparent a live browsing context. While ordinary DOM owns paint, park the
canonical `foreignObject`; mixed surfaces keep opaque SVG backing below HTML and promote only later
controls. Replaced media gets the final physical screen box. Video's card chooser stays on the
ordinary logical overlay; entering its player refits the same root to the physical screen before the
media source loads, and its HTML playback chrome multiplies authored sizes by the live scale. The
SVG Back, Fullscreen, and Dismiss controls mirror the player's idle class so all chrome hides as one.
A shared
native-SVG Kill farewell temporarily parks the promoted live root back in that
same `foreignObject` before its `death-*` class is applied, keeps promotion suppressed through the
app's close/reset, then returns directly to the dock. The Shoot iframe is the exception: reparenting
would reload Doom, Duke, or Quake, so its frozen browsing context stays mounted while the same native
farewell is promoted into a separately scaled SVG above it; teardown happens only after the gag.
Kill gags that animate the live app itself
(Chat, Classics, and Pac-Man) retain promotion instead. Keep overlay fitting, stacking, Calendar
paint, runtime identity, the clipped Kill raster, and the mobile zoom handoff covered by the focused
monitor tests. The click completing a zoom gesture may be re-hit-tested onto the newly promoted
overlay, so its one-shot guard belongs at Window capture rather than on the pre-zoom SVG device. A
monitor summoned from another upper or lower room must finish the lower-floor return, when present, and then
the upper-room pan before zoom takes ownership of the strip transform and promotes HTML;
`--floor-pan`'s transition end followed by `__afterRoomPan` is the serialization boundary.

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

The Garden wall switch remains the day/night owner in both phases. The Balcony switch routes ON
through the ordinary Party path and OFF advances to daylight through the calendar owner. Phase two's
disco ball is the time-neutral Garden Party toggle. The first exploration and Messages coaches are
serialized, and the first Party's messages remain held behind that authored reveal; reset re-arms it.
Party's neutral disco-ball rendering lives outside the UV-filtered strip, but its SVG owns the same
five-room coordinate track and pan transform; keep overlay art room-local so it travels with Garden.
The bounded Party confetti pool reuses its SVG nodes. Its fall timeline owns the random delay with
backwards fill so each piece stays hidden and offstage instead of briefly painting at SVG origin.
Every authored Party beat routes its boolean through `setPartyMomentState`. Its first active moment
suppresses the physical UV class and snapshots its prior state; only the final overlapping end
restores that snapshot. Keep new staged moments on this owner so interruption and party teardown
cannot relight or strand the blacklight.

Exact-day birthday messages, the birthday ribbon, cake, and postcard all route through the shared
birthday ceremony owner. The registry's exact month/day also gates every hat, crown, call prop, and
current-date postcard classification; there are no birthday buffer ranges. Keep delivery serialized
and cancel its transient work on Party teardown; checkpoint restore may re-enter an interrupted
ceremony. A shortcut must enqueue that owner rather than create a second cake or postcard lifecycle.

The progression bridge uses `seenRooms`, not message-reading or solved-state guesses. Road Trip
exploration is complete only after Party/free exploration has begun and all ten rooms have been
visited. If the player reaches the Entrance while Party is still active, the canonical handoff winds
it down before authorizing the trip. Keep that lenient path: eligibility should not depend on noticing
or obeying one phone message. The tenth visit also derives a checkpointed `roadtrip-departure`
caption base and arms a delayed, checkpointed completion coach. The coach waits behind existing
modal/cinematic attention; its action opens Entrance while dismissal leaves exploration available.
Neither path rewrites the caption. The caption’s story priority rejects ordinary room/feedback
rotation while allowing stronger modal and cinematic claims; opening Entrance acknowledges it and
restores the car’s caption.

Phase 2 also derives each portal prop's two-second discovery wobble independently from `seenRooms`.
Unlocking lower-floor navigation does not consume any cue: each paired lower-room visit clears only
its own prop. Phase 1, reduced motion, lost attention, cinematics, and low frame health clear all five.

### Road Trip and Camping

Road Trip and Camping are modes of the Entrance controller, not separate rooms in `STAGES`. The main
entry points are easiest to find through `porscheDrive`, `roadtripState`, `entranceRoadtrip`, and
`__entranceDriveStep`.

Keep these ownership boundaries intact:

- Entrance practice laps and the highway share presentation but have different progress/state.
- `roadtripExplorationComplete()` answers whether the story prerequisites are met;
  `roadtripAuthorized()` additionally requires Party to be stopped.
- `roadtripState` owns route selection, saved run, accepted trip, pause, Camping availability, and
  route-ribbon progress.
- The Entrance checkpoint records highway presentation intent separately from its paused-run data:
  reload reopens a previously visible highway with transport paused, while a deliberately parked run
  stays behind the **Continue** choice.
- Transmission preference survives room changes and Continue; Fresh Game resets it.
- Driving input belongs to the HUD/controller only while `__entranceDriveKeyboardOwnership` says it
  does. A CSS class or visible dashboard is not sufficient keyboard authority.
- While the undismissed AUTO coach is active, `porscheDriveCoachAllows` gives only the current
  semantic action mutation authority. Keep every keyboard, pointer, touch, and direct SVG path
  behind that shared gate.
- Starting Road Trip calls `__setPartyForegroundSuspended(true, "roadtrip")`; leaving it releases
  that suspension. This parks Party foreground work without pretending the story latch was reset.
- While Road Trip owns the viewport, `mir-roadtrip-active` removes the covered five-room SVG from
layout and pins the viewport to its established 2:1 ratio. Keep those rules paired: `display:none`
avoids laying out the hidden loft on every highway frame, while the explicit ratio prevents the
overlay-only viewport from collapsing. The Dollhouse uses retained images, so opening it does not
restore or lay out the covered strip.

Camping is a checkpointed sequence owned inside the same controller. Its settled progression is
split across `campFireState`, `campStewState`, `campStargazingState`, and `campSleepState`. The order
is fire, stew, stargazing, sleep/finale. Restore and replay must project the appropriate scene before
it becomes visible, so an old finale or unfinished road frame never flashes on entry.

The stew’s elapsed cooking time is checkpointed, but the notebook modal is not. Its clock advances
only while Camping is attended and the notebook is closed; closing the notebook resumes the same
batch.

Route geometry, traffic tuning, and finale pacing belong in the controller. The Camping audio graph
belongs in [the audio guide](audio.md).

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
keeps the persistent instruction for the active viewport separate from transient feedback. Producers
declare ownership, scope, priority, and whether expiry follows attended or wall time. Higher-priority
claims consume displaced feedback instead of letting stale copy resurface; scope exit cancels the
corresponding claim.

Use `__captionBase`, `__captionOverlay`, `__captionExclusive`, and
`__cancelCaption(tokenOrOwner)`. `setCaption` and `__setLowerRoomCaption` remain stable-base helpers;
`__captureCaptionPublisher()` is the canonical delayed-base helper because it captures both viewport
scope and the room-visit generation. Keyed claims rerender on language changes;
`loft.caption.show()` is literal-only. Intro, recovery, and Trailer are exclusive; terminal story
state must not yield to incidental feedback. Checkpoint restoration derives and paints one settled
base.

Caption expiry and producer handoffs use the shared attention scheduler (`__scheduleAttended`, with
`__cancelAttention` for owner/token cleanup). Attended jobs park completely while hidden or
unfocused and resume with their remainder. Use that scheduler for actionable results and story
reveals; reserve wall time for effects that must elapse off-screen.

Coaches are persistent instructional overlays, not captions. Their own controller decides when they
appear, whether navigation may continue behind them, and which action dismisses them. A coach that
points at a moving room control must be hidden during the pan and placed only after the destination
settles. Keep coach focus/tab behavior consistent with the global input contract; decorative SVG
groups should never become accidental tab stops.

Shared `.hunt-coach-overlay` cards use `bindHuntCoachBodyDismiss`: after the capture-phase one-second
pointer grace, the card body and × dismiss, while nested buttons and links retain their own actions.
Target islands remain live, and modal scrims/backgrounds keep blocking without becoming dismissal
surfaces.

The opening coach and three Party onboarding coaches are modal. Their highlighted target remains live
and performs its normal action; unrelated input stays blocked until the lesson is acknowledged. The
Party controller owns onboarding order and the notification/call hold across its lessons. Compact
coaches keep their narrower sequencing inside their feature controller.

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

Phone Mines reuses the monitor's board node. Mounting may size an untouched deal for the phone, but
must not reshape a started game; unmounting restores monitor ownership. Keep this shared-node
lifecycle covered in `tests/phone-mines-layout.js`.

The Python app lazy-loads the local Pyodide core. Both REPL input and Code's Python runner pass
source through `loadPackagesFromImports()` before evaluation, so ordinary imports can fetch an
unbundled official wheel from the version-pinned package repository. Keep `indexURL` local, keep
`packageBaseUrl` version-pinned, and do not point automatic import loading at unversioned PyPI;
explicit `micropip` remains the separate path for compatible pure-Python PyPI packages.
The typed `loft.app.python.status()` query reports runtime readiness; app-open is not equivalent to
an initialized interpreter. A load-generation guard prevents reset or Kill during initialization
from resurrecting a discarded runtime.

App and minigame state follows the same durable/transient rule as rooms. Preserve a meaningful
selection or score only when a checkpoint adapter says so; close cameras, calls, dialogs, media,
intervals, and one-shot games during reset or restore.

### Typed API and console

`initLoftApi()` installs the typed API at `window.loft.api`. Its public surface is:

- `capabilities(options)` for the discoverable, alphabetically keyed action/query catalogue;
- `groups()` for the stable, alphabetically sorted capability groups;
- `describe(id, args)` for one capability's validated shape and current availability;
- `query(id, args)` for structured reads;
- `perform(id, args, options)` for validated actions;
- `subscribe(listener)` for state notifications.

The capability registry is the single catalogue for rooms, controllers, apps, environment, media,
and games. It mechanically creates the JavaScript namespaces, typed help, and Python bridge. Keep
canonical ids in results; aliases such as Bar/Kitchen and Party/Garden must not create duplicate
capabilities. Use the fixed registry comparator so discovery remains identical across locales and
runtimes.

Every manifest row defines its stable id, kind, arguments, aliases, result envelope, completion
mode, and current availability. Discovery is side-effect-free. An unavailable result includes a
reason and may include a one-step typed remedy only when that action genuinely clears the gate.
Python exposes the same availability object through `LoftError`.

Typed availability describes runtime safety, not ordinary UI progression. Explicit scripts may
reach rooms before the clue trail does, but physical actions still route through the canonical room
or controller owner and respect active-session, finite-action, media, preview, and exclusivity gates.
Never implement an API action by forging DOM classes or checkpoint fields.

Instant setters apply synchronously even though `perform()` returns a uniform Promise envelope;
finite navigation and lifecycles are awaitable. Automatic environment owners accept `null` to
release an override; ordinary boolean controls accept only booleans. Room-independent changes leave
the current view in place, while explicit room-bound actions navigate through `runInRoom()` and
recheck their real gate at dispatch.

Successful owner transitions call `__loftStateChanged`, which increments `stateVersion` and emits
`loft:statechange`. If an API action changes the game but subscribers do not hear about it, fix the
owner transition; do not make the API mutate a DOM projection directly.

The in-game consoles evaluate ordinary JavaScript over the public `loft.*` tree. Help and completion
derive from that live object rather than a parallel command table; console lifecycle controls remain
separate. Controller diagnostics log only to the browser developer console. `window.loft` is the
sole app-authored public Window root.

### Window ownership constraints

Treat these as source-authoring rules, not properties to infer from whether a test happens to pass:

- Add public behavior beneath `window.loft`; never introduce another public Window root.
- Use lexical closure state for implementation. A descriptive `window.__…` hook is allowed only for
  cross-closure integration or diagnostics; it is private, unstable, and must never become a user API.
- Do not declare application `var`, `let`, `const`, `function`, or `class` bindings at classic-script
  Program scope. `var`/function declarations become Window properties, while top-level lexical
  declarations create bare globals that a Window-key inventory cannot see. Put authored code inside
  a closure and do not mutate the browser global through an alias.
- Do not add, replace, or delete properties on Window, browser/shared prototypes, or a prototype
  reachable through `loft`. Authored child objects and their own prototypes remain ordinary private
  implementation state.
- Never replace or remove a browser baseline property such as `window.open`, even temporarily. Never
  publish a public-looking property and delete it before the final inventory. A transient global is
  still a contract violation.
- Computed Window keys are allowed only when analysis proves a finite set of `__…` private names or
  a specifically owned temporary vendor name. Prefer explicit literal private properties.
- DOM ids may create browser named properties. Code must use DOM lookup APIs rather than bare named
  globals; the runtime gate recognizes a named property only when delete/reveal and descriptor checks
  prove the browser owns it. An authored DOM-valued property is not exempt.

`tests/global-surface.js` compares own and inherited baseline descriptors, verifies named properties,
and inventories the final Window. `tests/global-static-audit.js` is a conservative zero-network Acorn
check for transient and lexical violations that runtime inventory cannot observe. Review changes
against the rules above; do not weaken the analyzer merely to accommodate avoidable syntax.

Lazy Pyodide, v86, and Turnstile scripts are armed behind a configurable accessor immediately before
injection. The generation owner must release the temporary global and script resources idempotently
on every settlement path without disturbing a successor. HarfBuzz's pinned factories instead compile
inside a private function scope. Runtime consumers use these captured lexical owners rather than
reading vendor globals from Window.

`__chatApiManifest()` is the compact machine boundary for JavaScript Code assistance: typed
capability rows plus a short primitives/signatures list. Do not add a parallel human command index
to that payload. Code's model treats the manifest as authoritative; its examples and generated
drafts use the `loft.*` namespaces and completion metadata.

Code's canonical virtual-file descriptors live in `code-snippets/manifest.js`. They pair the
visitor-facing filename with one same-origin, content-versioned source. Physical JavaScript and
Python samples use handler-safe text transport names because the host treats raw `.py` paths as CGI;
`tests/check.js` enforces this manifest boundary.

Canonical files, local overrides, visitor-created files, and the unsaved draft have distinct storage
ownership. An exact canonical filename edits that canonical file rather than creating a collision.
Resetting one built-in removes only its override; **Reset files…** clears Code-owned files, drafts,
pending work, and errors, but must not reset runtimes, packages, Linux, or game/browser state.

The editor's native textarea remains the sole focus, selection, and scroll owner. Its line-number
gutter is noninteractive and must stay out of positioned or transformed layers beneath the scaled
monitor `foreignObject`.

The Pyodide console installs an embedded `loft.py` module that builds its namespaces from
`window.loft.api.capabilities()`; there is no second Python capability roster. Queries return
ordinary Python values, finite actions are awaitable, `None` maps to JavaScript `null`, and failed
results raise `loft.LoftError`. The bridge calls only discovered typed ids and never exposes private
hooks or arbitrary JavaScript evaluation. Loft-aware help stays narrow enough that normal Python
`help()` keeps its native behavior.

Keep the Python Code-assistant prompt compact and let the runtime manifest supply discovery. Console
chrome and runtime messages are deliberately English-only and live beside their implementations,
not in the bilingual game dictionaries.

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
that affects initial rendering lands before the room is exposed. The `afterStage` phase must also
rearm runtime derived from restored intent—such as idle countdowns or a bounded particle interval—
even when Continue lands in another room; the runtime's normal room gate keeps parked rendering and
audio dormant.

An adapter should persist **intent**, not runtime mechanics:

- Persist a chosen projector channel, room visitation, Party story latch, completed Camping beat,
  or paused Road Trip run.
- Do not persist an open modal, active pointer drag, pending call, camera stream, raw timeout,
  animation frame, autonomous particle, or currently ringing sound.

The monitor adapter treats tower power and the selected desk surface as authoritative intent.
Illumination is derived from them during recovery, so an interrupted checkpoint cannot restore a
powered, visible monitor with a dark screen and no remaining boot transition.

For a modern checkpoint, a missing row in the `systems` map means that subsystem starts from its
fresh default. A record with no `systems` property is an older compact checkpoint and follows the
legacy restore path. Keep that distinction when adding an adapter; otherwise a new subsystem may
inherit stale DOM state or accidentally reset an existing save.

The entry recovery gate previews a checkpoint before applying it. `urlEntryMode`,
`__startGameEntryLoader`, `startCinematic`, and `stopCinematic` own page/game/trailer entry. Continue
applies the saved state; starting fresh must reset transient systems before the initial room paints.
The executable and Code-editable Trailer timeline has one canonical source in
`code-snippets/trailer-js.txt`. It calls public typed `loft.*` capabilities and runs through Code's
ordinary async source runner; do not mirror its sequence in HTML or add filename-specific IDE logic.
Entry-owned overlay DOM, geometry, audio priming, and teardown stay private. Public presentation
helpers expose semantic actions, not selectors or duplicate renderers.

`session.preview` is the general reversible boundary for scripted presentations. `begin()` captures
the semantic checkpoint, raw checkpoint, and browser store. Its restore, fresh, and entry
dispositions all restore the pre-preview store and recovery bytes before projecting the requested
surface. Preview mode suppresses checkpoint, reward, Album, notification, and external/destructive
writes; hide, pagehide, error, and abort paths tear down generation-owned work and restore safely.
Preview helpers activate the real room, game, Road Trip, Camping, and score owners rather than
duplicating their presentation or audio.

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

Particle systems must have bounded cardinality. For a continuously visible ambient effect, prefer
retained nodes with looping timelines and clear the pool when its room loses attended ownership;
recreating SVG and WAAPI objects every cycle can build substantial native-browser garbage even
when the live node count stays fixed. One-shot particles may replenish from animation completion or
cap and remove stale nodes before spawning. An unbounded timer plus animation-finish cleanup will
accumulate nodes while the tab is throttled and can crash after hours.

Frame health uses 1.2-second delivered-frame windows with asymmetric thresholds. Two windows at or
below 40 fps enter the reduced tier; three windows at or above 48 fps recover ordinarily. During
Party, recovery waits for six healthy windows and never enables the high-resolution canvas tier.
This longer retry prevents a reveal-time hitch from pinning Party to stepped effects forever while
still giving genuinely constrained devices a fast two-window route back to the reduced tier.

A full-fat Party additionally runs the GC pacer (`startPartyGcPacer`): the floor's ~150 infinite
main-thread SVG animations shed megabytes per second of Blink-side style/paint garbage that only V8
*major* collections sweep, and V8 never schedules one on its own because it watches the small JS
heap while the Oilpan heap balloons (multi-gigabyte renderers on long parties). The pacer earns
those majors with a rolling hold of plain-array ballast, tenured past the nursery at a measured
rate (about 4 MB per tick in current pointer-compressed Chrome); the rate and hold length are
load-bearing (see the block comment, which also records the
measured dead ends: brief animation holds, `playbackRate:0`, `will-change` promotion, ArrayBuffer
ballast, and weaker rates). It is gated to Chromium-family Blink/V8 browsers; iOS Chrome/Edge/Opera
are WebKit and deliberately excluded with Safari and Firefox. The exact query switch
`?pacemaker=off` disables this workaround for comparisons without changing Party effects. Keep
`tests/check.js`'s wiring check green when touching the Party lifecycle.

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
The zoomed Office monitor avoids that path through its ordinary-DOM promotion; keep the de-layered
and native SVG `<image>` fallbacks because room-scale and Dollhouse rendering still use the canonical
SVG tree. Mirror state onto stable scope classes through `syncScopeMirrors`; avoid introducing a
top-anchored `:has()` dependency for a large scene.

Maintained cross-browser constraints live in [`AGENTS.md`](../AGENTS.md); test recipes live in
[`DEBUGGING.md`](../DEBUGGING.md). Consult both before changing behavior seen only under headless
virtual time.

## Localization and UI contracts

Player-visible English and Czech copy lives in `loft-day.en.js` and `loft-day.cs.js` under the
private integration global `window.__loftMessages`. Keys are alphabetically ordered, including nested message objects; arrays retain
their authored order. Add both keys in the same change. `tests/check.js` enforces canonical sorting,
syntax, and recursive parity. Write printable Unicode directly as UTF-8. `setLang()` assigns authored
translation HTML, so preserve intentional markup and use the established `brk-sm` / `brk-lg` breaks
when the two viewport classes need different wrapping.

Each dictionary `<script>` URL carries a content token derived from that dictionary's bytes.
`tests/check.js` reports the exact replacement when a token is stale; update only the changed
dictionary's tag.

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
| Structural/static | Inline-script syntax, translation parity, SVG balance, typed autocomplete, source invariants | `node tests/check.js`, `node tests/state.js` |
| Full solve | End-to-end first-run solve and interaction storm | `node tests/play.js` |
| Input contracts | Document-level Enter, menus, mobile/double gestures, lower-room ownership | `tests/enter.js`, `tests/menu.js`, `tests/laptopmenu.js`, `tests/monitor-zoom-touch.mjs`, focused tests |
| State systems | Checkpoint restore, replay, Party/Road Trip/Camping, apps, audio lifecycle | focused `tests/*.js` runners |
| Typed API | Catalogue shape, public Window ownership, Phase 1 access, active-surface and lifecycle gates | `tests/api-v4.js`, `tests/global-surface.js`, `tests/api-gating.js` |
| Rendering | Album signatures, monitor HTML/SVG alignment, overlay ownership, and manual EN/CS mobile/desktop inspection | `tests/album-axis.mjs`, `tests/party-disco-pan.js`, `tests/monitor-html-overlay.js`, `tests/monitor-overlay-compat.js`, `tests/monitor-calendar.mjs`, `tests/monitor-kill-paint.mjs`, `tests/monitor-cross-room-summon.mjs`, screenshots or real CDP Chrome |

Any change to either maintained HTML file requires `check.js` and `state.js` before commit. Run the
focused tests closest to the ownership boundary you changed; Enter and menu changes have their named
mandatory runners. Reserve `play.js` for solve-chain/shared-interaction changes and full regression
rounds. Prefer a focused regression for the behavior being changed over an unrelated broad suite.

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

The live web root is the git checkout. A visitor can fetch `loft-day.html` while `git pull` is rewriting
the multi-megabyte file and briefly receive truncated HTML. If a post-deploy report shows the entire
page stacked or unstyled, compare local/live hashes and reproduce at the reported viewport before
attributing it to the latest feature.

Cloudflare edge-caches HTML, `/`, and extensionless aliases. Request cache headers do not bypass that
rule. Verify a fresh deploy with a new throwaway query string or wait for the configured TTL; avoid
repeated pulls, which increase the torn-read window. The chat Worker has a separate deployment
path—pulling the static checkout does not publish `chat.js`.

## Source search map

Search symbols rather than relying on line numbers; `loft-day.html` changes too quickly for stable line
references.

| Concern | Search terms |
| --- | --- |
| Upper/lower navigation | `STAGES`, `goToStage`, `lowerRoomForStage`, `__navigateLowerRoom` |
| First-run solves and replay | `__finishSolveAdvance`, room `__…DoNext` walkers |
| Party/free exploration | `setGardenParty`, `setPartyMomentState`, `setSecondRound`, `seenRooms` |
| Entrance and Road Trip | `porscheDrive`, `roadtripState`, `roadtripAuthorized`, `__entranceDriveStep` |
| Camping | `campFireState`, `campStewState`, `campStargazingState`, `campSleepState` |
| Keyboard routing | `activeControlFocused`, `activateCurrentRoom`, `__entranceDriveKeyboardOwnership` |
| Captions | `captionArbiter`, `__captureCaptionPublisher`, `__captionOverlay` |
| Checkpoints | `checkpointPayload`, `applyCheckpoint`, `__registerCheckpointAdapter`, `__deferCheckpointAdapter` |
| Lifecycle | `__roomAutonomyAllowed`, `__foregroundAmbienceCovered`, `__setPartyForegroundSuspended` |
| Apps | `DESKTOP_APPS`, `TOOLBAR_APPS`, `PHONE_APPS`, `appTouchConstrained` |
| Code files/editor | `CODE_BUILTINS`, `deskCodeBuiltinOverrides`, `codeSetBuffer`, `__resetMonitorCodeFiles` |
| Typed API | `initLoftApi`, `window.loft.api`, `__loftStateChanged` |
| Chat | `__chatContext`, `askChat`, `ACTION_SPECS`, `PUBLIC_MONITOR_APPS` |
| Entry/recovery | `urlEntryMode`, `__startGameEntryLoader`, `startCinematic`, `stopCinematic` |
| Scope mirrors | `syncScopeMirrors` |
