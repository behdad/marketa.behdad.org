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

`loft.api` has a registry of typed queries and actions. It validates argument shapes and enum values,
reports capability/availability information, and emits `loft:statechange` after a semantic state
transition. `stateVersion` advances for typed actions and for direct mutations owned by rooms,
daylight, party/BBQ, Messages, apps, calls, music/transport, projector, weather/forecasts, minigame
lifecycle, and Album storage. Composite typed actions coalesce their synchronous owner mutations
into one revision. Visual-only animation frames, minigame score ticks, and every incidental closure
field are deliberately not revisions.

Language is another shared state axis. User-facing copy lives in the `T.en` and `T.cs` dictionaries,
with static fallback text where needed. Any English copy change must be mirrored in Czech.

## Rooms, phases, and unlocking

The five rooms are `kitchen`, `garden`, `cuddly`, `office`, and `balcony`. Search for `STAGES` and
`goToStage`. They are adjacent groups in one SVG strip; navigation translates the 500%-wide strip by
20% per room.

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

### Party lifetime

`setGardenParty` is the party source of truth. A separate controller, searchable as
`PARTY LIFECYCLE`, counts attended seconds only while the document is visible, focused, and outside a
cinematic. It offers a quiet close cue and an authored last-dance/last-song text at 150 attended
seconds, then automatically winds down at 180 seconds unless an accepted finale ends it sooner or
`party.extend` restarts the attended interval. A later autonomous invitation may offer to restart the
party, but it does not restart by itself.

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
for `ROSTER`, `__whoIsHere`, `__roomOccupants`, and `__rosterPresence`.

- `__whoIsHere(room, opts)` is the instantaneous occupancy accessor used by album photography and
  other consumers. It composes hosts, crew, party guests, children, visitors, DJs, Aspen, and
  room-specific cameos according to what is actually painted.
- The Who's Here UI is phase-two-only. It polls cheaply and mutates only when occupancy changes.
  Arrivals appear immediately; departures have a short hysteresis to avoid flicker during movement.
  The accessor itself remains instantaneous.
- Display order is based on current left-to-right geometry, while preserving existing order and
  inserting newcomers to reduce churn.
- Opening the roster can hold autonomous arrivals/departures. Check `rosterHoldsOccupants` before
  adding another population timer.
- Party entry/exit controllers move guests to and from the floor. CSS variables help balance crowd
  placement. Avoid rendering the same person in standing, dance, visitor, and kid-activity layers at
  the same time.
- Children switch among free, family, godson, chase/game, and asleep states. Chase handoffs remove
  standing duplicates; sleeping/waking can be both an authored state transition and a message.
- Aspen has garden stations and a photographer presence that can be cloned into other rooms/deck
  contexts. Automatic rounds and explicit `photo.take` use the same occupancy truth as album shots.

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

### Pocket phone

The phone is a lazily built HTML modal with launcher, app, and in-call screens. Search for
`openApp`, `navBack`, `messageAppReturn`, and `directCloseApp`. Its first ordinary open can show the
math lock; explicit/cinematic deep links may skip it.

Back behavior depends on entry context:

- nested app detail views consume Back first;
- an app launched from a Messages action returns to Messages;
- a direct scene notification opens Messages as a deep link, so Back/Escape closes the phone rather
  than exposing the launcher;
- an ordinary app returns to the phone home screen;
- leaving the owning room closes the phone.

Some app data is session-sticky across close/reopen: drafts, filters, current cards, saved
photobooth output, and similar state. Kill, uninstall, or full reset must clear the app's documented
retained state. Adding an app therefore requires an open path, a teardown path, Back semantics,
context-menu behavior, and reset coverage.

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
Persian dates are runtime code; avoid duplicating dates in another UI data source.

Weather is fetched client-side for Edmonton and Prague, with current conditions and multi-day data.
The implementation also retrieves aviation observations, Edmonton air quality, and geomagnetic
forecast data for scene effects. Search for `api.open-meteo.com`, `__realWx`, `__realOutdoorC`,
`__realPragueC`, and `__realDaily`. Missing or failed network data falls back to the simulated scene
model; UI and Charlie context must tolerate `null`. Console temperature overrides intentionally
separate the simulated outdoor model from live readings until reset.

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

Wedding-moment messages are routed through `__deliverAutonomousPhoneMessage`. While first dance,
slow dance, toasts, group photo, sparklers, cake, bouquet toss, or chair lift owns attention, incoming
autonomous texts queue instead of interrupting. The queue re-checks the gates and drains one item at
a time, approximately 4.2 seconds apart, after the moment ends. Explicit/story delivery remains
outside this deferral queue, but still passes the shared phase and deduplication boundary.

### Thread behavior

- Read state, reactions, arrival timestamps, filters, draft, and reply target are session-only.
- Opening a notification scrolls to its exact row but does not run that message's action. Opening or
  selecting the row marks it read; the separate action affordance performs the action.
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

`chat-knowledge.json` should contain verified, stable facts and explicit unknowns. Live state belongs
in client context. Exact birthdays and other private facts are deliberately excluded from model
context. Do not add secrets, credentials, operational access details, or unverified logistics to the
knowledge file.

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
- `tests/party-lifecycle.js` for attended party timing and finales;
- `tests/message-context.js`, `tests/message-launcher.js`, and
  `tests/message-resilience.js` for Messages behavior;
- `tests/chat.js`, `tests/chat-context.js`, `tests/chat-worker.mjs`,
  `tests/safe-actions.js`, and `tests/safe-actions-worker.mjs` for assistant/action boundaries;
- `tests/performance.js` and `tests/leak.js` for lifecycle regressions;
- `tests/album-axis.mjs`, `tests/album-render.mjs`, and `tests/album-ui.js` for photography;
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
| Autoplay/cinematic | `apParam`, `__autoplayOn`, `window.__cinematic` |

Worker-side searches in `chat.js`: `ACTION_SPECS`, `cleanContext`, `cleanGroupChat`,
`verifyTurnstile`, `callOpenAI`, and `export default`. Stable assistant facts and policy live in
`chat-knowledge.json`; runtime facts should not be moved there.
