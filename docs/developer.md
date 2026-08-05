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

Every game-only entry, including installed/standalone launch, paints its interactive entry surface
first: either CLICK ME or checkpoint Continue/Start over. The single-file game continues loading in
the background. Selecting one of those actions calls `__startGameEntryLoader`; if window-load
readiness is already complete, the held action runs immediately. Otherwise it raises the bilingual
`#installed-load` cover at the estimated background percentage and performs the action as soon as
the remaining work completes. The legacy `__installedLoaderUsed` /
`__installedLoaderComplete` probes now describe that post-selection handoff. The revealed invitation
removes the loader synchronously and never paints it.

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

Android keyboard animation shrinks the visual viewport through several transient heights. The
`__gameSoftKeyboardOpen` gate keeps fullscreen sizing and device-zoom refits off that hot path, then
allows the ordinary resize fit once the viewport returns; the viewport meta also requests
`interactive-widget=resizes-visual` so opening an editor does not relayout the full game shell.
Keep this handling geometry-only—text inputs and their app-specific positioning still own focus.

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
current-run elapsed time, distance and scoring, the bounded entity pool, and lifecycle flags. The roadtrip reuses
the driving step instead of starting a second frame loop. `__entranceRoadtripStart()` and
`__entranceRoadtripSpawn(type, lane)` are narrow deterministic test seams; player input still goes
through the dashboard's existing steering, shift, throttle, brake, and dismiss owners.
Keyboard steering starts at 28% authority, builds to full over 760 ms while held, and adds 22%
for same-direction presses inside a 420 ms tap window; reversing resets to the gentle baseline.
The direct touch-wheel input and the coarse-pointer blue steering pad bypass that transient
keyboard ramp. The tall pink pedal pad owns a second pointer independently, maps its vertical position
to analog throttle or brake strength, and projects the active side through the existing pedal-hold
state so dashboard animation, coaching, Road Trip resume, and lifecycle cleanup stay shared. Its
`PORSCHE_TOUCH_THROTTLE_CURVE` exponent stretches the low end without reducing full throttle. The
wheel and physical pedal targets remain active alongside both pads.

The drivetrain uses the 2010 base Boxster's six manual ratios (`3.667`, `2.050`, `1.407`, `1.133`,
`.972`, `.841`), `3.875` final drive, and `235/50 R17` rear-tire circumference. Coupled RPM is derived
directly from road speed; first-gear launch slip is the only exception. The 7,500 rpm limiter,
350 ms shift interruption, torque curve, drag, 263 km/h power-limited top speed, and progressive
pedal ramp calibrate a correctly shifted 0–100 km/h run near the published 5.9 seconds. Keep
`__entranceDriveRpmForSpeed()`, `__entranceDriveAcceleration()`, and `__entranceDriveSetMotion()` as
deterministic focused-test seams when tuning this model.

The automatic range interlock uses `PORSCHE_AUTO_DIRECTION_CHANGE_LIMIT_KMH`: R↔D is valid only
while opposite-direction speed is strictly below 10 km/h, and the same boundary validates restored
range/speed snapshots. Keep this separate from the manual gearbox's wrong-direction stall rule.
`#entrance-drive-auto-readout` is the persistent P/R/N/D1–D7 display in the right-hand instrument;
`paintPorscheDriveHud()` updates it from `driveGearLabel()` across selection, automatic shifts,
checkpoint restore, reset, and the shared Road Trip lifecycle.

`spinPorscheOnBrake()` owns both hard-brake gestures. The block's 180° turn reverses facing and
signed speed; Road Trip's 360° leaves both intact after ordinary braking has reduced speed. Their
dry thresholds are 140 and 200 km/h respectively, reduced by 20 in rain and 40 in snow.

The first-person world is native SVG under `#entrance-drive-hud-svg`. `#entrance-room.roadtrip-active`
expands its viewBox and HUD while leaving `#entrance-room-art` and `#entrance-porsche` rendered so
spatial-audio geometry remains valid. The roadtrip weather layers follow the Entrance's existing
day/cloud/rain/snow/winter classes. Keep runtime traffic, wildlife, and tokens capped by the owned
pool; never let timer- or step-spawned entities accumulate without a bound.
Entering or leaving Road Trip is an atomic presentation swap: its HUD height, cockpit position,
world visibility, ordinary windshield scenery, and SVG viewBox must not transition independently.
Keep those state-owned properties transition-free so a frame can show either Road Trip or street
driving, never a resized mixture of both.
`drive.roadtrip.route` owns the `calgary` → `turnoff` → `banff` → `lake-turnoff` →
`abraham` → `camp` sequence and is included in the
version-2 paused-run snapshot. Calgary uses three equal lanes in each direction around a wide,
impassable dirt median, starts the Porsche on the outer shoulder at `3.08`, and forces terrain
elevation, grade, and curvature to zero. After 75 attended seconds, a six-second right-turn
approach keeps the flat scenery; only the Banff phase restores the original four-lane mountain road, 90 km/h signs,
terrain, and curves. Route changes clear live entities before changing lane geometry.
Banff runs for 90 attended seconds before a second six-second right turn. Abraham Lake narrows to
one lane in each direction, posts 100 km/h, reduces the traffic cadence, and runs for 75 attended
seconds. Its right-pointing Camping sign projects through the final six seconds. Once that route
timer reaches the entrance, `syncRoadtripCampApproachSpeed()` owns an exponential slowdown
independent of throttle or residual momentum; below 10 km/h, `arriveRoadtripCamp()` parks it and
fades in the full-viewport camp. The route chooser writes `routeChoice` and uses
`setRoadtripStartingSegment()` so Calgary, Banff, and Abraham are valid deterministic starts;
Shift-click supplies an elapsed offset three seconds before the chosen segment's exit.
The camp's exact Entrance Porsche is cloned once by `ensureRoadtripCampPorsche()`; mark any copied
component before stripping duplicate ids, and keep each prop's transparent hit path separate so a
pointer action cannot toggle the whole car. `syncRoadtripCampLayers()` keeps atmospheric overlays
behind the camp figures while precipitation remains in front. The capture-phase Entrance keyboard
owner treats `roadtrip-route-camp` as a navigation boundary: arrows are consumed, ordinary game
shortcuts pass through, and Escape/Backspace dispatch the same exit as `#entrance-roadtrip-dismiss`. Run
`tests/entrance-roadtrip-camp.js` when changing that boundary. Camp object handlers use
`bindRoadtripCampAction()`; their one-shot animation classes belong on untransformed inner wrappers,
and lake effects cap and remove their runtime SVG children. Run
`tests/entrance-roadtrip-camp-interactions.js` when changing them.
The separate `entranceRoadtripDemerits:v1` driver record stores timestamped citation batches.
Each batch expires after three wall-clock minutes; active suspension discards the old batches and
reinstatement creates a fresh seven-point batch. `scheduleRoadtripDemeritExpiryPaint()` updates an
idle HUD at the next expiry, while every drive/input gate also calls `syncRoadtripDemeritState()`.
Run `tests/entrance-demerits.js` when changing that lifecycle.
Positive-lane traffic advances on the right-hand carriageway; negative-lane traffic uses
front/headlight art and a negative world velocity so it closes faster from the opposite lanes.
The Porsche's roadtrip lane remains separate from the side-view SVG lane offset.
Traffic types are `car`, `pickup`, `truck` (semi), and `rv`; each owns rear and oncoming-front
templates, speed, scale, and mass treatment. Keep the natural spawn table varied, with RVs common
enough to read as Alberta highway traffic. `deer` and the compatibility-named `rabbit` render as a
mule deer and snowshoe hare.
Mirror double-click traffic uses `roadtripSummonedTrafficPlan()` and its own seeded streams, so a
run reproduces vehicle type, lane, spacing, and speed while different run seeds vary them. Each
four-plan permutation contains a sedan, pickup, semi, and RV. Ordinary summoned heavy vehicles
normalize to their direction's outer lane; an overtaking heavy vehicle may start in the blocked
inner lane so `overtakeLaneTarget` can visibly carry it outward around the Porsche.
The stress control remains deliberately uncapped up to the shared entity-pool limit. A stopped
Porsche forces its overtaker to begin in the occupied forward lane; the entity-owned
`overtakeLaneTarget` then carries the visible move into an adjacent open lane and arms a horn below
60 km/h. A shoulder stop stays silent. Moving low-speed summons may originate in any forward lane
and move only when they initially share the Porsche's lane. `roadtripTrafficHornProfile()` owns the distance/cabin/spatial projection:
passing horns use a 0.66-second envelope, while an oncoming vehicle whose own negative lane is
occupied uses a distinct 1.35-second warning and latches `oncomingHorned` after one successful voice.
`roadtripOncomingEvasionDecision()` shuffles one positive decision through every five entity serials,
giving an exact seeded 20% plan without runtime randomness. On first wrong-lane proximity, the entity
latches that decision. A selected vehicle commits only if `roadtripOncomingEvasionSafe()` finds an
adjacent negative lane free of the Porsche and oncoming traffic within 24 road units; its lane then
interpolates at 2.4 lane units/second. An unsafe selected vehicle and the other 80% hold course. No
branch targets a positive/player-direction lane.
`roadtripCurvatureAt()` defines alternating eased bends. `roadtripCurveOffset()` integrates the
upcoming curve into the sampled asphalt, shoulder, lane, furniture, sign, and entity projection,
while the current curvature adds a small unsteered outside drift. Curve-warning uses are separately
pooled and placed 54 road units before their matching bend. The player range extends beyond the four
lane centres into rumble and gravel zones; `syncRoadtripShoulder()` owns their view vibration, grip
reduction, speed bleed, classes, and exposed test state.
The windshield road and its edge, double-yellow, and dashed lane markings are sampled perspective
polygons: their filled widths converge with the asphalt at the horizon rather than using fixed SVG
strokes. The rumble strip remains a separate dashed path beside the filled white edge band.
Shoulder view vibration is wheel-speed driven and must clear at a stop; stationary RPM vibration stays
local to the Porsche/cockpit instead of shaking the road scene.
`porscheTireAudioMix()` is the deterministic speed/steering/surface projection for the continuous
road, tire, wind, corner-squeal, and shoulder textures. It shares the drivetrain bed but uses a
separate tire spatial output so a closed roof can muffle high frequencies without the engine's
lower cutoff erasing them.
The top-centre ornament is a live SVG mirror. `paintRoadtripMirror()` samples the same curvature
model behind the Porsche, so its road edges, double-yellow centre, lane dividers, and reflected
traffic share one rearward projection. That projection pins the wide near edge at the mirror centre;
historical curvature accumulates only toward the horizon, so a bend must never slide or skew the
near base. An eight-use roadside-tree pool follows the same rear projection on alternating verges;
the shared conifer glyph is vertically flipped so its trunk base, rather than its crown, stays planted
at the projected road edge. A clean traffic pass keeps the pooled entity alive briefly behind the
player, projects it into a separate six-use mirror pool, swaps forward traffic to its front/headlight template, and
releases it after 38 road units. The mirror's clipped cloud, smoke, rain, snow, and winter layers read
the same Entrance classes and `--smoke` value as the windshield. The main windshield hides passed
entities below its lower edge, so a pooled vehicle is never painted in both views at once.
The nested `drive.roadtrip.police` state owns the infrequent speed trap independently of the bounded
traffic pool. `stepRoadtripPolice()` advances its warning → pursuit → capture/stopped/arrest → cooldown/ended
state machine;
`paintRoadtripPolice()` projects a dedicated oncoming warning car, parked patrol car, and rear-view
pursuit use without competing for pooled traffic slots. Once the Porsche passes `stationAt`, the
dedicated patrol use leaves the windshield and follows the mirror road's right-shoulder projection
for 62 metres, including tolerated readings. A pursuit smoothsteps that same reflected transform
toward the following-car transform over 24 metres, avoiding a disappear/reappear cut while the
patrol pulls out. A sibling clipped SVG overlay follows that exact transform and alternates the
lightbar only for pursuit/capture/stopped/arrest; it remains hidden for a tolerated roadside
reflection, and the reduced-motion media rule replaces the alternation with steady paired lights.
The first trap begins after 950 metres;
later traps are spaced by 1,200–1,560 metres. The warning car exposes exactly three high-beam
flashes with the patrol car 240 metres ahead; detection is gated until at least three seconds after
the third flash finishes. Posted speed is 90 km/h and enforcement begins above 110.
`ROADTRIP_POLICE_STANDARD_FINES` indexes Alberta's complete 1–50 km/h standard schedule, including
the published 20% surcharge; 51+ stores `fine: null`, sets `courtRequired`, and increments summonses
rather than inventing an amount. A right-shoulder stop at 2.5 km/h or less settles the ticket or
summons. Every enforced speed, including every 51+ court case, first enters pursuit. Ordinary fixed
fines settle into cooldown without an arrest. A court-required shoulder stop or completed capture enters
the 5.8-second `arrest` phase. `paintRoadtripArrest()` drives the inline SVG from `arrestElapsed`—cabin
wash, stopped hood, officer approach, bilingual measured-overage summons card, and final fade—without a
timer or bitmap; the live patrol use remains prominent in the mirror. The phase records the summons and
parks the highway with the HUD still open only after that sequence. Twenty attended seconds or
500 metres below the escape threshold without stopping, or an attempted pursuit exit, enters capture:
the police controller clears held inputs and progressively eases the live drivetrain speed to zero over
2.2–3.6 seconds while retaining the highway, mirror car, and siren. A fixed-fine capture then uses a
1.25-second stopped beat; a court capture enters the arrest sequence. Only after that resolution does it
apply the separate 1,000-point refusal penalty and end the highway run. At 180 km/h
or faster, separation grows from the patrol car's 170 km/h pursuit pace: the 55 m gap takes about 20
seconds at 180 and 7 seconds at 200.
The mirror scale and siren gain follow that separation; reaching 55 metres clears the chase, while
slowing below 180 before then closes the gap and resumes the refusal counters. Neither enforcement
case resets the loft game.
Ticket, escape, and run-ending outcomes clear any live `entrance-roadtrip` pickup/pass flash and
publish a persistent caption, so an older flash or `caption()` restore timer cannot reclaim the line.
`__entranceRoadtripPolice(ahead)`, `__entranceRoadtripPoliceDetect(speed)`, and
`__entranceRoadtripPoliceStep(speed, seconds)` are the deterministic focused-test seams; police
presentation, capture/stopped/arrest phases, and siren state remain transient rather than checkpoint data.
The balcony module is the sole owner of alcohol state under `balconyDrinkState:v1`.
`__registerDrink()` normalizes elapsed wall time before adding an equivalent;
`__drinkState()` exposes the normalized equivalent count, display BAC, and impairment level to Road Trip.
The simplified display model adds `DRINK_BAC_PER_EQUIVALENT` (`0.03`) per equivalent; player-requested
bar cocktails and draft pours use the same registration boundary as balcony wine and beer.
Decay is timestamp-derived in exact one-minute steps rather than timer-driven, so hidden or unfocused
pages run no autonomous loop. Checkpoint reset cannot rewind the separate state, while the existing
full-reset `__resetWineSips()` boundary clears it. Road Trip must read that owner for both the HUD and
police/steering impairment; do not add a second BAC counter to `roadtripState`.
Escape cannot skip an arrest. Blur/hidden gates pause its elapsed time, while room close/reset cancels the
transient phase and tears down its overlay and audio. Run
`tests/entrance-police.js` with the other Entrance tests.
Wildlife switches to a timed hop-and-verge escape inside 22 road units: a slow approach gives the
escape its required `0.48s`, while a fast same-lane arrival can reach the collision zone first.
Roadtrip event feedback is routed through the shared lower-room caption flash; do not place transient
score or coaching copy over the windshield.
While `__flashCaptionKey()` owns the visible clue line, `setCaption()` stages any newer permanent
caption as that flash's return target. Let the temporary copy finish; on expiry it must reveal the
newest room or progress instruction rather than the permanent caption that was visible at flash start.
`awardRoadtripBonus()` is the only combo-scored path: a close pass and safe wildlife clear are worth
2/3, while the pooled `heart`, `kiss`, and `inf` collectibles are worth 5/10/25 before a combo capped
at `3×`. `awardRoadtripDistance()` adds one point per 100 physical metres without the combo;
elapsed time is display-only. `applyRoadtripPenalty()` centralizes unmultiplied deductions and resets
the combo, including severity-scaled rear-end and wildlife penalties plus the fixed head-on penalty.
Keep that generic deduction helper as the scoring boundary for any future fine system; it must not
make scoring own police lifecycle or presentation.
The original `v1` best and checkpoint scores migrate proportionally into scoring version 2, while
new checkpoints retain elapsed time and the already-awarded distance-point watermark so recovery
cannot award the same kilometre twice. Grade thresholds are 100/250/500 and their labels live in
the EN/CS dictionaries.
Collectibles use pooled `heart`, `kiss`, and `inf` entities;
the original `token` test-seam input remains a compatibility alias for `inf`.
`roadtripCollisionSeverity()` combines relative velocity with a per-object mass factor. It scales
speed loss, shake displacement, SFX gain/duration, and crack opacity. Forward traffic and wildlife
use the localized `.roadtrip-cracked` layer. `entranceRoadtripCrackVariant()` rolls a compact origin,
whole-crack rotation, six primary branches, and two to four secondary fractures; severity also scales
their reach, and the SVG windshield clip is the final containment boundary. Same-lane oncoming traffic
hard-stops/stalls the Porsche and uses the independent full `.roadtrip-shattered` layer. Restart repairs
either windshield state.

The third forward practice wrap unlocks the highway and reveals the owned SVG invitation; it does not
start the roadtrip. Acceptance and invitation eligibility are one-HUD-session state. Each later HUD
session starts on the block with `invitationReady=false`; one full `PORSCHE_WRAP_SPAN` of live forward
block travel makes the card eligible, independent of the car's position relative to a wrap boundary.
Enter accepts a visible card, while Escape dismisses it for that session. Closing the Entrance or
leaving an active highway parks the run and clears acceptance, so acceleration cannot resume it.
The next Escape dismisses the dashboard and clears the run while retaining unlock and best. Full reset also clears
unlock/practice, while the best score remains localStorage-owned. Checkpoints persist compact settled
roadtrip counters, unlock, and score, but capture/restore acceptance as false and never restore active
presentation, spawn timing, or live entities. Run
`tests/entrance-driving.js`, `tests/entrance-lap-odometer.js`, `tests/entrance-recovery.js`, and
`tests/entrance-roadtrip.js` for this boundary. The source-only
`tests/entrance-roadtrip-scoring.js` and `tests/entrance-windshield-cracks.js` check the scoring
scale/formatting and randomized glass geometry/crack separation without launching a browser.
Street `driveState.position` uses twice the roadtrip world-travel scale so the compact block loops
briskly; speed, RPM, odometer distance, and `roadtripState.distance` remain unscaled physical values.
Roadtrip spawn normalization puts RVs in the outer/right lane for either travel direction and
starts semis there as well. The deterministic 20-entry natural cycle includes one forward sedan
in the inner/left lane so that lane is occasionally occupied without becoming a constant wall.
`syncRoadtripSemiLane()` detects slower same-direction traffic ahead,
moves the semi into its direction-relative inner/left lane, raises it to a 26–30 km/h passing
advantage capped at 110, and returns it to the outer lane and cruise speed after clearance.
`driveState.odometerKm` is the persistent physical-distance total: every drive step adds
`abs(speed) × elapsed time`, independent of the street scene's theatrical travel scale. Engine lifecycle
does not reset it; full game reset does, and Entrance checkpoint capture/restore preserves it.
The capture-phase Entrance keyboard owner returns immediately while `__dropTermOpen()` is true;
otherwise its HUD branch would prevent keys before the focused drop-down console receives them.
Run `tests/entrance-police.js` for the enforcement state machine.
RPM and engine temperature remain runtime-only: restore accepts them from older rows, but new
checkpoint captures omit them so idle ticks cannot churn an otherwise settled recovery snapshot.
Checkpoint restore marks the first-drive coach complete before the Entrance reopens; a fresh reset
still owns the four-step lesson, and the dashboard help control remains its explicit replay path.

### Phase and solved-state model

The main progression values have separate jobs:

- `stageIndex` / `currentStageName` identify the visible paired room;
- `maxUnlocked` is the furthest main room available to normal navigation;
- `solvedRooms` records each room's completion independently;
- `seenRooms` records only player-visible settled destinations; lower-floor navigation uses
  `goToStage(..., { recordVisit: false })` for its hidden main-floor alignment, and the shared
  lower-room return records the paired main room only on a real upward reveal;
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

Checkpoint creation is gated on `checkpointWorthSavingNow()`: tap-only and mid-Kitchen visits have
no recoverable record, while solving the Kitchen or deliberately leaving it for another upper/lower
room arms checkpointing. Loading applies the matching payload gate; Kitchen's Bathroom counts as
leaving even though the saved upper-room key remains `kitchen`. A progressed legacy v1 record without
`solvedRooms` remains compatible when its unlock frontier is beyond the Kitchen. Writes are debounced
through `__checkpointChanged`. A subsystem adapter provides
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

The Loft Day game DOM intentionally carries no ARIA attributes, explicit `role` metadata, or native
`title` tooltips. Player guidance is visible copy: captions, cards, labels, and explicitly authored
coaches. Do not add invisible accessibility/tooltip message keys, and do not restore metadata to
satisfy a stale test. Focused tests should use stable ids, classes, `data-*` state, and rendered
behavior rather than translated metadata selectors. `tests/check.js` pins this source-level
boundary. This stance is specific to the game; do not infer it for `save-the-dates.html`.

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
| Android keyboard viewport | `android-keyboard.js` |
| Monitor/phone shells and menus | `menu.js`, `laptopmenu.js`, `systemmenu.js`, `monitor-*.js`, `phone-*.js` |
| Room-specific interactions | the corresponding `kitchen`/`garden`/`cuddly`/`office`/`balcony` or lower-room focused file; Entrance driving also runs `entrance-driving.js` and `entrance-roadtrip.js` |
| Apps and games | the named app/game test plus `minigame-vocabulary.js`; include touch tests for shared D-pads or drag controls |
| Messages and Charlie | `message-*.js`, `chat.js`, `chat-context.js`, `chat-worker.mjs`, `assistant-behavior.mjs`, `safe-actions*.js` |
| Audio/media lifecycle | `media-transitions.js`, `device-audio.js`, `lower-audio.js`, `pacman-audio.js`, `piano-message.js`, `performance.js`, `leak.js` |
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
| Date/weather | `__now`, `__weddingOccasion`, `__boxlockSelectCalendarDate`, `__realWx`, `refreshWeatherText` |
| Album | `albumPhotoSvg`, `ALBUM_SKY_SIG`, `__albumList` |
| Console | `CONSOLE_HELP`, `CONSOLE_CMDS`, `window.loft` |
| Trailer | `THE TRAILER`, `startCinematic`, `stopCinematic`, `urlEntryMode` |

Most debugging should begin with the subsystem's state hook and transition owner, then inspect its
DOM projection and outstanding timers. Avoid repairing state by deleting classes manually; that
usually leaves audio nodes, callbacks, retained app state, or paired room ownership behind.
