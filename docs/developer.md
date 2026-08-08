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

CLICK ME hands fresh play to the two-step `#opening-guide-coach`. Its transparent shell intercepts
room input while the explicit × or global Enter advances navigation → caption. That guide and the
two party bridge coaches share the `.hunt-coach-*` card, dismiss control, and single-path arrow
contract; keep their geometry target-specific but their visual/component markup identical.

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

Game chrome places date/time and room navigation above the scene and `#hunt-caption` below it. The
first-play handoff advances through those two locations before object-level Kitchen guidance begins.
Before lower-floor discovery, keyboard Down uses the same 600 ms deliberate double-press unlock as
locked lateral navigation; after discovery, one Down press enters the paired lower room.

The `#loft-dollhouse` picker reuses those same navigation owners. Tab and the always-visible grid
button open its full-width 5×2 map. The floor button is persistent but disabled until lower-floor
discovery. `seenRooms` keeps visited thumbnails sharp while locked destinations retain blurred
previews; never infer picker
access from `maxUnlocked`. Room cards reuse their real SVG art, with a matching static SVG portrait
for the HTML/CSS Dungeon. The preview temporarily neutralizes Bedroom one-shots, gives the intact
Entrance façade a daylight wash, primes a warm Cuddly projector frame, and applies the real Bar visibility state to
the complete Kitchen stage for either a party or second-round night. Double-click and
touch double-tap deliberately unlock a locked destination. The map owns an arrow-key cursor;
discovered destinations open with one Enter, while locked destinations reuse the 600 ms deliberate
unlock window and require two non-repeat Enter presses on the same card during Phase 1. Once
`__secondRound` is active, a single card click/tap or non-repeat Enter unlocks and opens any remaining
locked destination; this makes the post-party room-map coach directly actionable. Tab is consumed throughout
the game and no scene or chrome control participates in browser Tab traversal; a clicked
console/editor field may still interpret Tab internally. Opening the picker pauses an active Road
Trip through its transport owner and does not implicitly resume it on close. While that route
remains active, the Entrance card swaps its
`<use>` target to the live drive/campsite HUD and temporarily suppresses the full-size pause dialog.
Lower-card navigation positions the paired main stage with `recordVisit:false`; only the selected
lower room becomes seen, so its still-locked upper card remains blurred.

During a pan, traversed stages remain paintable until transition completion; afterward `stage-far`
parks distant rooms. A lower-room transition changes the backing main stage and opens the target
lower panel as one queued operation. Checkpoints store a lower identity only when it matches the
saved main room.

Start navigation work with `tests/navigation.js`, `tests/dollhouse.js`, `tests/upstairs-keyboard-navigation.js`,
`tests/delayed-pan.js`, `tests/rapid-navigation.js`, `tests/lower-shortcuts.js`, and the relevant
`tests/lower-room-*.js` files.

### Progression

The progression values have distinct roles:

- `stageIndex` / `currentStageName`: visible main stage or backing stage for a lower room;
- `maxUnlocked`: normal-navigation frontier;
- `solvedRooms`: independent room completion;
- `seenRooms`: player-visible settled destinations;
- `window.__secondRound`: latched Phase 2 state.

Each Phase 1 controller owns its clue sequence and `__*DoNext` walker. Its final action settles the
terminal prop and calls `__finishSolveAdvance(from, to[, navigationDelay])` in the same event turn.
That owner records the source, unlocks the destination, writes the coherent checkpoint, then delays
only the guarded pan when requested. It navigates only if the player is still in the source room.
Do not infer completion from unlock state.

`setSecondRound(true)` owns the Phase 2 transition. It unlocks and marks all main rooms solved,
releases held content, and changes Enter to each room's free-play activity. Only reset clears this
latch.

Keep progression coverage in `tests/play.js`, `tests/enter.js`, `tests/phase2-progression.js`, and
`tests/progression-transitions.js`. `tests/room-progress.js` owns the room-specific bilingual
captions; `tests/room-roadtrip-bridge.js` reloads between every Road Trip exchange beat and checks
the hard 10/10 launch/restore boundary.

The `party-roadtrip-bridge` checkpoint adapter owns the one-time Garden switch coach, teardown room
progress/map coach, and once-per-reset Road Trip handoff. Every unsuppressed party on→off edge records
the handoff durably. A due switch coach waits until the phone preview/call channel is quiet on every
paint, including Garden re-entry, then becomes a light modal: four scrim quadrants preserve the live
SVG wall switch as the only scene hit target, while the popup × and global Enter retire the coach.
The modal’s actual visible state—not merely its durable due flag—owns the shared phone hold, so an
existing popup is never stolen and newly arriving popups/calls release once after dismissal. Below
ten distinct `seenRooms`, the dismissible map coach uses the same quiet-channel/attention owner;
Phase 2's one-action dollhouse
entry is the exploration path. First lower-room visits use room-specific, language-live copy whose
remaining count is derived from `seenRooms`, never unlock order. At 10/10 the adapter delivers
`downstairs_entrance` → `downstairs_roadtrip_where` → `downstairs_roadtrip_journey` →
`downstairs_roadtrip_go` with checkpointed inter-message timing. Reload resumes the next missing beat;
the first three rows carry no action and only the final row owns `lower:entrance`. The exchange may
run while the party is active; the final action uses the canonical party-stop queue and opens
Entrance only after teardown, with the HUD closed. Unrelated autonomous texts, notification popups,
and calls stay held until the exchange completes.

The Phase 2 latch plus ten `seenRooms` are the exploration qualifier; authorization additionally
requires the party to be off. `roadtripAuthorized()` gates every invite, chooser, launch, re-entry,
and restore path;
Phase 1 skip-navigation, saved `unlocked` flags, and paused runs cannot bypass it. A street lap is
optional free-play telemetry and has no progression effect. Reaching 10/10 readies the dashboard
invitation after teardown. **Let’s go!** awaits the canonical shutdown before opening Entrance with
the HUD still closed. An intentional road click or global Enter at qualified Entrance is the lenient
ignored-phone fallback: it uses that same shutdown queue, then opens the HUD. On a fresh HUD the
driving coach owns attention first; completion or its explicit
× dismissal repaints the queued Road Trip invitation, and that coach state is checkpointed.
Deterministic driving tests use the visibly
named `__entranceRoadtripDevStart()` bypass; production and restore paths never do.
At 120 attended seconds the lifecycle offers the existing optional finale cue but never flips the
party switch itself.

Act Two now ends at party teardown. Its automatic piano → dawn → direct-RSVP tail was removed;
Camping's `~ fin ~` owns the only terminal RSVP coda. `__partyActEnded()` clears the ticker, delayed
messages, redirects, and reveal timers and retires the sequencer so a delayed Balcony-finale arm
cannot resurrect it. Piano, day/night, RSVP compose, and loft free play remain independently callable.

## Entrance driving and Road Trip

Search for `porscheDrive`, `roadtripState`, `entranceRoadtrip`, and `__entranceDriveStep`. The
Entrance controller owns the Porsche, dashboard, drivetrain, road scene,
Road Trip, and their lifecycle. Road Trip reuses the driving step instead of starting another frame
loop.

### Driving model

Input must flow through the shared steering, transmission, throttle, brake, and dismiss owners.
`__entranceDriveKeyboardOwnership()` publishes the controller's `hudOpen`, Road Trip, and pending
party-stop handoff truth to the capture-phase key router. The rendered `drive-hud-visible` class is
only presentation and must not decide whether arrows, Enter, or pedals belong to the car.
The `driveCoach` follows those same action owners; desktop teaches cruise before pedals, while touch
skips cruise and combines steering with the pedal pad. Its `?` control parks the drivetrain,
clears cruise, and starts again at ignition; checkpoint recovery does not replay it automatically.
Keyboard steering ramps from a gentle tap to full authority; touch steering and pedal pads provide
direct analog input. The pedal pad maps its outer 30% zones progressively to throttle/brake,
holds entry speed while a finger remains in the middle 40%, and latches a genuine touch release
into the shared cruise state; cancellation and lifecycle cleanup do not latch. A standalone Control
tap captures a forward speed floor at 10 km/h or above;
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

Actual route launch also claims party foreground ownership through
`__setPartyForegroundSuspended(true, "roadtrip")`; `parkRoadtrip()` releases it. Entrance, HUD, and
chooser presentation do not claim that owner. The single listener installed by the party controller
holds its dance deadline, attended clock, guest roster/placements, Act Two beat, particles, room
projections, balcony callouts, and autonomous photo/kid/disco timers, then fades and retires every
party audio scheduler. Release re-arms the remaining clocks around the same dance/DJ/roster rather
than calling `setGardenParty()` or rebuilding the party. This foreground owner is derived runtime
state—not checkpoint data—because saved Road Trips restore parked and claim it only on explicit
Continue/route launch. Road Trip transport pause and Camping retain the claim; global music pause is
a separate user-owned state and remains paused across release.

`drive.roadtrip.route` owns:

```text
calgary → turnoff → banff → lake-turnoff → abraham ↺
                                                └→ camp (optional)
```

Route legs, turnoffs, and Abraham's recurring campsite exit consume actual forward metres from the
driving step; `elapsedSeconds` remains HUD/scoring time and must not select scenery. Their authored
lengths preserve the former pacing at a nominal 100 km/h. The route is part of the version-4
paused-run snapshot; restore migrates version 1–3 elapsed-route fields into metres. Direct segment
selection clears live entities before changing road geometry. Attended Calgary → Banff and Banff →
Abraham turnoffs instead feed metre-based weights from `roadtripRouteBlend()` into the already-
authored backdrops, so scenery, day/night lighting, winter treatment, and distance-scrolled
parallax remain in phase through the crossfade. `roadtripGeometryProfile()` applies those same
weights to road, shoulder, median, centreline, and lane-mark geometry: Calgary's divided highway
narrows into Banff while surplus lane marks fade, then Banff's divider fades into Abraham's
single-lane road. The latched Camping approach keeps the complete Abraham road frame through its
automatic slowdown; only the stopped route swap begins the campsite/road opacity handoff, so the
campsite ground cannot appear as an isolated foreground band before arrival. Signs are
projected beyond the current road edge by
`positionRoadtripExitSign()`; fixed road fractions fail on Calgary's wider divided highway.

The route chooser writes `routeChoice` through `setRoadtripStartingSegment()`. Shift-click or a
touch long-press is a private test shortcut that begins three nominal seconds of travel before the chosen segment's
exit. Every chooser launch clears carried motion while preserving the selected transmission setting;
the compact re-entry control offers the exact paused run, a provisional fresh-route chooser, and a
direct campsite return after `campVisited` is set. The chooser's open state, selected card, and
campsite availability are checkpointed; recovery reopens the chooser without launching the route.
Checkpoint recovery retains the saved Entrance/dashboard presentation and interrupted highway
snapshot, but leaves explicit re-entry to Road Trip → Continue. Continue activates the retained
presentation with `roadtripResumePending` set, so transport Play or fresh driving input owns the
actual resume. A saved `camp` route still restores its camp presentation directly.
Touch-first devices scale route and turnoff lengths to 72%. Abraham's optional campsite exit then
recurs after the distance formerly covered in 60 seconds at 100 km/h on fine pointers, or 45 seconds
on coarse pointers.

Traffic, wildlife, collectibles, mirror uses, signs, and roadside objects use bounded pools. Keep
spawn plans deterministic from the run seed and never add timer-driven unbounded entities.
At an attended road-width boundary, `transitionRoadtripTraffic()` rebases existing lanes, cancels
only in-progress lane changes, and scales the remaining next-spawn gap; do not clear the traffic
pool there, or the scenery dissolve exposes an implausibly empty road.
`roadtripSpawnPlan()` assigns natural traffic a route-relative seeded speed; forward traffic's deck
centres above the posted limit while RVs and semis retain a slower tail. Pursuit and summoned plans
carry their own explicit seeded speed so changing the natural profile cannot silently retune them.
`scheduleRoadtripNaturalSpawn()` anchors one due spawn to the current distance, briefly retries a
full pool, and gives wildlife a bounded defer while police or a traffic manoeuvre owns attention;
it never replays missed intervals as a burst. The police production clock likewise waits, within a
bounded distance, for visible wildlife or a traffic manoeuvre to clear. A Camping-turnoff approach
is an unbounded roadside owner: a due speed trap waits until that exit has passed rather than sharing
its sign/junction beat. Rear overtakers use the same attention signals, while direct mirror summons
and the pursuit deck remain explicit overrides.
`syncRoadtripTrafficLane()` owns faster traffic's pull-out, clearance, return, and car-following
speed. `roadtripTrafficLead()` selects only the nearest vehicle in the current lane; if a pass is
blocked, a bounded headway controller slows the follower and exposes its brake-lamp state. Banff may
borrow an empty opposing inner lane, Calgary stays within its carriageway, and Abraham never weaves.
`roadtripCurvatureAt()`, `roadtripCurveOffset()`, `syncRoadtripShoulder()`, and
`paintRoadtripMirror()` are the central geometry owners. `stepRoadtripHandling()` integrates the
eased wheel angle into lateral velocity, speed-weights bend drift, and carries bounded loose-surface
slip into a damped asphalt recovery. `surfaceRoughness` is the shared continuous owner for grip,
windshield vibration, and live tyre audio; paused-run snapshots retain both it and lateral velocity.

The global frame-health monitor also owns Road Trip's rendering budget. Physics, input, traffic,
police, scoring state, and audio continue on every driving step, while sustained low frame delivery
caps the first-person SVG world painter near 30 Hz. Highway painters equality-guard retained SVG
attributes and preserve traffic/police layer order until depth actually changes, so a steady frame
does not repeatedly invalidate identical visibility, metadata, or DOM order. Drive-audio spatial
profiles read their anchor pan through a 250ms cache (`porscheDrivePanFor`) instead of a live
`panForElId` per tick — the live read forces a synchronous layout, which was the single largest
per-tick cost on throttled CPUs.

Cross-room state styling uses `html.mir-*` scope-mirror classes instead of top-anchored `:has()`
(`body:has(…)`, `.hunt-viewport:has(…)`, `#loft-game-strip:has(…)`): those selectors charged every
DOM mutation anywhere a document-wide style-invalidation sweep (~13ms desktop, 50-80ms throttled —
the dominant Road Trip frame cost). One MutationObserver over the source elements' class attributes
(`syncScopeMirrors`, end of the main script) keeps the mirrors true, and the canonical toggle
functions also ping `window.__syncScopeMirrors()` synchronously so same-task computed-style reads
(tests, screenshots) stay coherent. `tests/check.js` enforces both invariants: no reintroduced
top-anchored `:has()`, and CSS↔JS mirror-class parity. Room-scoped `:has()` (a stage, a context
menu, the touch pads) remains fine.

### Camping

`campExitDistance` preserves Abraham's recurring-exit phase. During its projected sign/spur window,
crossing onto the right shoulder makes `syncRoadtripCampExit()` latch the turn. Only that latch lets
`syncRoadtripCampApproachSpeed()` slow independently of throttle or momentum. Below 10 km/h,
`arriveRoadtripCamp()` retains the Abraham snapshot, parks the drivetrain, and activates the camp
overlay inside Entrance. The same owner starts the documented audio handoff: the continuous
vehicle, score, and AC beds retire while the campsite outdoor bed rises; do not split that
transition across route painters.

Camping begins with an empty pit and publishes `entrance_roadtrip_camp_fire_invite` through
`__setLowerRoomCaption()`. `campFireState` owns the focused build, fuel chain, log arrangement,
bounded pinecone collection, and success transition. Up to four cones dropped into an unlit pit
persist with the camp and can substitute for twigs; drops onto a lit proper fire flare and burn
away. The one-shot flame/flare is transient. Built and lit/off state are durable; unfinished fuel
choices also checkpoint and restore with the builder closed. An in-flight ignition restores as its
assembled, actionable fuel state rather than replaying its timer.
Success restores the finished fire with an empty silver pot and publishes the stable, non-clickable
`entrance_roadtrip_stew_invite` caption while it burns. A lit fire ignores early replay clicks and
becomes extinguishable only from the explicit sleep prompt, which prevents dinner/stargazing state
from being discarded into the terminal RSVP caption. The `camp` route is never resume-pending,
including after checkpoint restore, blur, or visibility changes; dismissing it ends the drive run,
while the re-entry menu can rebuild the camp presentation without resetting its fire or stew. New
routes stay provisional in the chooser, so dismissing it preserves any paused highway run. A camp
revisit temporarily parks that run in `roadtripCampResumeRun`; checkpoint capture records both the
camp presentation and that highway snapshot, and Continue restores the snapshot exactly.
The Entrance checkpoint row also owns the driving coach’s explicit step/completed/dismissed record.
Continue restores that record exactly; a row without it is fresh onboarding, never inferred history.

`campStewState` owns the exact protein/base choices, six required fixed ingredients, close-up state,
attended cooking elapsed time, and served/overcooked payoff. `advanceCampStew()` applies the slower
open-lid rate and advances only with a lit fire in an attended camp; runtime frame deltas are capped
so returning to a throttled tab cannot skip phases. Recipe drafts, cooking progress, and payoff are
checkpointed, while the builder and lid restore closed. `arriveRoadtripCamp()` resets stew for a
genuinely fresh arrival.

The camp sky uses the loft's `.twinkle` / `.const-lines` animations and
`__applyMoonPhases()` painter. Entrance day/night, cloud, and highway-season classes gate its sun,
celestial bodies, and expanded winter mountain snow. Served stew unlocks the campsite sky; selecting
it during daylight commits the shared day/night state to night, locally clears camp weather, and then
opens the stargazing trace. The live Cassiopeia/Ursa Major/Ursa Minor geometry supplies the ordinary
night's three unconnected seed patterns; completion closes the overlay, adds restrained `.55px`
connectors behind the moon, enables bounded per-star dragging that redraws each figure's connectors,
and starts the Camping target in the shared `gardenAurora` SVG-curtain engine. That story target
uses the same octave geometry and gradient shimmer as the Garden/Balcony sky, guarantees a strong
display independent of the forecast, and runs only while active Camping is clear, dark, solved, and
pre-fire-out. A class observer follows the campsite/Entrance state owners; the shared rAF still
self-cancels on exit, blur, visibility loss, and sleep, while reduced motion paints one still frame.
The live sky holds the four edge-set, integrated-tail bubbles until dismissal; after a two-second beat,
Behdad's pink and Markéta's blue bubbles reveal one second apart. Drag positions are session-only.
Once the fourth reveal finishes, a persistent bilingual caption invites a click anywhere; a
full-campsite transparent hit shield consumes that click, dismisses the exchange, and changes the
caption to the sleep prompt without activating a prop. Clicking the fire starts the ordered
fire-out → campers and stripped corn cobs → tent-light →
deep-blue darkness with a foreground field of static authored stars whose CSS-only twinkles run
only during the dark finale; the solved constellation copy retreats and remains as subdued context
instead of competing with the denser sky → Zs and mama-bear food collection → bilingual food-safety
warning for three seconds → the existing bilingual RSVP congratulations. The mama's untransformed
inner group owns the walk so its campsite placement transform stays on the outer group; at Zs that
outer group moves into `#entrance-roadtrip-camp-mama-collection-layer`, after the completed fire, so
the collecting bear paints above the ring stones. Reset returns it to its original campsite sibling.
During the checkpointed three-second warning, `#entrance-roadtrip-camp` pans to the already-authored
dense star field; a translated `<use>` repeats that field above the original scene bounds, and the
terminal phase reveals the neutral Fraunces `~ fin ~` with one combined congratulations, attended-time,
and RSVP caption. The pan seeks
through `--camp-sleep-pan-resume`, pauses with the same attended-time owner, and snaps to its end for
reduced motion. Reduced motion also snaps the bear and cobs to their collected positions. The
mama-look and cub-rejoin one-shots do not replace the terminal line; language refreshes reformat the
frozen duration rather than exposing its placeholder.
`campStargazingState` checkpoints exact trace and handoff progress plus
`campSleepState.phase` and attended time within that phase, but always restores the trace overlay
closed. Leaving, hiding the tab, or moving focus to another window pauses an unfinished curtain call,
including its bear/corn/Z animations; return resumes the remaining beat rather than replaying or
skipping it. The legacy `complete` phase owns the warning and its three-second attended timer;
`congrats` is terminal, and leaving only then resets fire, stew, stargazing, and finale state.

The checkpoint `progress` row owns `attendedMs` and `attendedComplete`. The clock begins only after
the attract/recovery surface releases the real game, settles its active slice before every checkpoint,
and runs only while the document is visible and focused. Road Trip's explicit transport pause also
reconciles the clock through `__syncLoftAttendedTime`; ordinary media pauses do not pause gameplay.
Entering Camping's terminal `congrats` phase freezes the total before the closing bear beats, so a
reload/Continue can replay those visuals without adding or losing time. Fresh-game checkpoint clear
resets both fields.

`__updateRoadtripCampAudio()` owns one shared-context outdoor bed. It gain-gates fire, wind, rain,
and storm layers from camp/fire/weather state, and tears the whole bed down when camp is dismissed
or unattended.

The capture-phase campsite key owner consumes Enter before Entrance navigation. Plain non-repeat
Enter calls `roadtripCampDoNext()` for one bounded fire → stew → stargazing action. Fire completion
reuses the builder's open/place/light owners but closes it at ignition and does not move focus into
the hidden panel. Stargazing completion reuses the canonical trace owner with its overlay closed;
click/tap still opens each interactive builder. A short debounce and the ignition state gate prevent
quick doubles from skipping asynchronous work.
After completion it remains consumed and inert, so Enter never dismisses camp. Escape and Backspace
retain dismissal ownership. Pointer actions go through `bindRoadtripCampAction()`. Animate
untransformed inner wrappers, cap runtime SVG effects, and keep effects in the target's coordinate
space. Camper placement stays on the outer group, drag offsets stay on
`.entrance-roadtrip-camp-character-drag`, and head one-shots stay on the nested head.
`ensureRoadtripCampPorsche()` owns the generated prop hit map and bounded body drag.

Run `tests/entrance-roadtrip-distance.js`, `tests/entrance-roadtrip-camp.js`, `tests/entrance-roadtrip-camp-exit.js`,
`tests/entrance-roadtrip-camp-fire.js`,
`tests/entrance-roadtrip-camp-pinecone-fire.js`,
`tests/entrance-roadtrip-camp-caption.js`, `tests/entrance-roadtrip-camp-car.js`,
`tests/entrance-roadtrip-camp-interactions.js`, `tests/entrance-roadtrip-camp-people-drag.js`,
`tests/entrance-roadtrip-camp-sky.js`, `tests/entrance-roadtrip-camp-aurora.js`,
`tests/entrance-roadtrip-camp-audio.js`, `tests/entrance-roadtrip-camp-audio-handoff.js`,
`tests/entrance-roadtrip-camp-stew.js`, `tests/entrance-roadtrip-camp-stargazing.js`,
`tests/entrance-roadtrip-camp-sleep.js`, and `tests/entrance-roadtrip-camp-enter.js` for this boundary.

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

All ten Phase 2 room visits qualify Road Trip; party-off authorizes it. Before first acceptance, invitation-ready, dismissed/re-entry,
and open-chooser state survive HUD/Entrance closure and checkpoint recovery. Optional forward street
wraps are still recorded for deterministic driving coverage but do not own progression. Unlock and
best score survive sessions, while route acceptance and active presentation do not. Checkpoint restore may retain a paused run,
but active highway presentation resumes only through Entrance and requires explicit driving input
unless the route is terminal Camping. The paused-run drive snapshot also owns cruise activation and
its held-speed target; unattended lifecycle cleanup releases momentary inputs without clearing it.

Primary coverage is `tests/entrance-driving.js`, `tests/entrance-lap-odometer.js`,
`tests/entrance-recovery.js`, `tests/entrance-coach.js`, `tests/entrance-cruise.js`, `tests/entrance-roadtrip.js`,
`tests/entrance-roadtrip-handling.js`, `tests/entrance-roadtrip-pause.js`, `tests/entrance-roadtrip-scoring.js`,
`tests/entrance-roadtrip-ai-overtake.js`, `tests/entrance-roadtrip-traffic-speed.js`,
`tests/entrance-windshield-cracks.js`, `tests/entrance-demerits.js`, and `tests/entrance-police.js`.

## Apps and minigames

The monitor and phone are separate registry-backed shells:

- `DESKTOP_APPS` and `TOOLBAR_APPS` define monitor apps.
- `PHONE_APPS` defines phone labels, launchers, activities, and game metadata.
- `__chatMonitorApps()` and `__chatAppCatalog()` project those registries for chat.

Do not create a second hand-maintained app catalog. Update the owning record, any intentional
Worker allowlist, and focused contract tests.

Editable app surfaces share `appTouchConstrained()` and `appAutoFocusTextControl()`. App opens,
restores, delayed responses, search toggles, and wrapper clicks must not script-focus text controls
on narrow/coarse layouts; the browser's native focus from a direct tap on the control is the mobile
keyboard boundary. Desktop may retain ready-to-type focus. Messages may refocus a rebuilt field on
mobile only when that same logical field already owned focus before the live repaint.

Each game owns its loop, input capture, score, result state, and teardown. App games advertise a
`game` record; scene games exposed to chat live in `CHAT_SCENE_GAMES`. `PUBLIC_GAME_IDS` is only the
Worker sanitization allowlist.

Action games publish `minigame.change` through `__loftStateChanged`. Wire every start and stop path,
including Escape, room leave, blur/hidden state, reset, and game over. High scores normally use
their own localStorage keys and stay outside the gameplay checkpoint.

## Checkpoints and recovery

Search for `LOFT_CHECKPOINT_KEY`, `checkpointPayload`, `applyCheckpoint`, and
`__registerCheckpointAdapter`. The 90-day `loftCheckpoint:v1` record contains progression, compact
puzzle state, cumulative attended play time, selected phone/Album/game data, and a `systems` map from adapters.

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

Restore through non-navigating state owners. UI and console conveniences that pan to their prop's
room (for example `bbq()`) are not checkpoint setters: calling one during Continue can silently
raise the room-unlock frontier before the saved room is restored.

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
| Main/lower navigation | `navigation.js`, `dollhouse.js`, `upstairs-keyboard-navigation.js`, `delayed-pan.js`, `rapid-navigation.js`, `lower-shortcuts.js`, `lower-room-*.js` |
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
