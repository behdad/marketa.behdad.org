# Loft Day audio architecture

All sound owned by `loft-day.html` is Web Audio built on **one shared `AudioContext`**. This doc explains the
graph, the lifecycle rules, and the gotchas — read it before touching any `start*/stop*`
sound function, `getSfxCtx`, the song pipeline, or the idle/focus gating.

The shoot launcher has one contained exception: all three shooters run in disposable
same-origin iframe documents. Duke and Quake III construct engine-owned SDL/MIDI
contexts; Doom remains `-nosound`. Only one shooter iframe exists at a time. The
child suspends its main loop and engine-owned contexts when shoot is not foregrounded
or the tab is hidden; the parent also sends an inactive control state when the room
or window is unfocused. Back/Kill removes the iframe completely. Those isolated
engine contexts are not part of the host graph below.

## Why one context

Safari **hard-caps concurrent `AudioContext`s** (historically ~4, still limited). The page
used to construct ~26 (one per ambient bed / projector-music channel / dance / the song
pipeline / the SFX context). Past the cap, Safari's extra contexts produce **no output at
all** — so on real Safari there was NO Web Audio sound (both SFX and pipeline-captured
songs silent; only the direct native `<audio>` fallback was audible). Chrome/Firefox
don't cap, so they were fine — but 26 contending hardware streams also glitch on the
owner's Chrome/Linux box.

Fix: the Web Audio best practice — **one context, many nodes**. Exactly one `AudioContext`
is constructed at runtime, in `getAudioCtx()`. `check.js` enforces this (counts `new Ctx()`
sites; must be exactly 1).

## The three shared entry points (top of the main `<script>`)

- **`getAudioCtx()`** — lazily constructs and returns the single `AudioContext`
  (`window.AudioContext || webkitAudioContext`). The ONLY place a context is built. Stored
  in `__sharedAC`. Failure latches `__sharedACFailed` and returns null forever.
- **`resumeSharedAudio()`** — nudges the one context to `running` (a fresh context starts
  `suspended`; callers are always in a gesture/attended path when they want sound). Rejects
  swallowed (autoplay policy pre-gesture).
- **`audioBusProxy(ac, out, lifecycle)`** — builds a per-consumer **handle** that quacks
  like an `AudioContext` for node creation (`createGain/Oscillator/BufferSource/Buffer/
  BiquadFilter/DynamicsCompressor/Convolver/WaveShaper/Delay/Analyser/ChannelSplitter/
  ChannelMerger`, plus `currentTime/sampleRate/state`), but whose `.destination` is a
  caller-owned sub-master node and whose `resume/suspend/close` are caller-defined. One
  factory so `audioBed` and `getSfxCtx` can't drift apart. `createStereoPanner` is exposed
  only if the real context has it (so `pannedOut`/`swirlBus` keep their mono fallback).

## Three disjoint sub-buses on the one context

Everything mixes at the single `ac.destination`, but through three independent paths — so
their volume controls never double-scale:

1. **Beds / dances** → `audioBed()`. Each bed's graph ends at the handle's `.destination`,
   which is a per-bed unity **`_out` gain** → the shared lower-floor boundary →
   `ac.destination`. The campsite's explicit `audioBed("outdoor")` route skips only the indoor
   lower-floor filter while retaining the same shared master/context. Party dances alone insert one additional unity departure gain between
   `_out` and the lower-floor boundary. Music/projector/dance beds
   apply the volume-button level at their own in-graph `_masterGain` (`__songVolume()`);
   ambient environmental beds (fire, aqua hush, wind…) sit at fixed low levels and are NOT
   scaled by the button. The `bandari` source keeps its fast coastal 6/8 graph.
2. **One-shot SFX and the projector play-along piano** → `getSfxCtx()`. A persistent
   handle whose `.destination` is one **SFX master gain** (`_volMaster`) →
   `ac.destination`. The piano keeps one filtered output bus on that handle and gives
   each pressed key short, self-terminating oscillator voices. It is deliberately
   independent of the night-sky backing bed, so transport pause silences the score but
   not live keys. The public `loft.volume.set()` action (`__audioMaster`) scales this;
   `__applySfxMaster()` pushes changes onto it.
3. **Songs (real recordings)** → the **pipeline** (`eqAudioCtx`), which uses the **raw
   shared context** (not a handle — it needs real `suspend/resume` and, crucially,
   `createMediaElementSource`, which irreversibly captures an `<audio>` element). Graph:
   `MediaElementSource → bassShelf → 6-band manual EQ → muffle → width → masterGain →
   compressor → route → panner → analyser → the shared lower-floor boundary →
   `ac.destination`. The normal route uses the
   room stereo panner; headphone mode crossfades to an HRTF panner whose restrained
   position follows the draggable office headphones.

**Volume model (by design):** the in-scene volume **button** controls music/beds and the
active cross-origin Cinema film (`__songVolume`), so you can turn program audio down to
hear SFX. The public **`loft.volume.set()`** master (`__audioMaster`) is the god-knob over
everything (SFX master + folded into `__songVolume`, including Vimeo). Vimeo alone gets
a smooth perceptual lift after that shared level: mute remains exactly 0, site 0.15 maps
to about 0.35, site 0.4 to about 0.55, and full remains 1. Other sources keep their
existing linear levels. Overall level is otherwise the device's job. The headphone-mode
filter (bass shelf + lowpass) lives only in the song pipeline — music-only, deliberately
not applied to SFX/beds or Vimeo.

The roughly 100-second Trailer owns Tumbalalaika as one temporary, gracefully faded loop. The score
starts from the trusted Trailer click, spans the whole reel (including Road Trip, Camping, and the
final card), then fades before preview teardown restores every song's incoming time, loop, logical
level, and playing state. Natural completion, Take over, hide/pagehide, and error abort all use that
same finite owner. Road Trip and Camping are their exact renderer/controller previews rather than a
separate visual adapter, so their normal focus-gated vehicle, lake, wind, fire, and weather layers
remain under their existing audio owners while the centered trailer score continues.

## Lower-floor acoustics

`lowerFloorAudioOutput()` is one lazily-created low-pass plus gain stage shared
by continuous synth beds and captured loft songs. It creates no context. The
main floor targets unity/20 kHz; Prince dungeon and Cinema target
`0.48`/2.4 kHz, with a 1.9-second stone-tail reverb mixed in only for the
dungeon; Bedroom keeps the same 2.4 kHz filter at a quieter `0.40`;
the enclosed Bathroom targets `0.30`/1.45 kHz; and the exterior
Entrance targets `0.25`/1.2 kHz. Changes
use `setTargetAtTime` with a 320 ms time constant, so Down, Up, close, and
lateral lower-room pans cannot click or leave stale attenuation behind.

Local one-shot SFX deliberately bypass the boundary: a bathroom faucet or
entrance window was touched in the room the visitor occupies and should remain
present. The dungeon's autonomous ceiling-drip plink follows the standard
hidden-or-unfocused gate before touching the shared SFX context. Opening the
Bathroom synchronously cancels Pouria's in-flight ambient
or player cocktail make, so its queued pours and shaker rattles cannot bypass
the boundary from the bar above. `__roomAutonomyAllowed(room)` is the shared
gate for autonomous room output: the named room must be visible, attended, and
uncovered by a foreground device or any lower room. Balcony city/wind/rain beds
and delayed chimes, eclipse payoffs, door creaks, and sky celebrations use it;
opening a lower room also rechecks the three beds synchronously. Direct prop
sounds remain local, and `loft.sky.eclipse.play()` navigates upstairs before starting.
Cross-origin Vimeo also bypasses the boundary as deliberate Cinema foreground
media. A song still on native `<audio>` fallback cannot receive Web Audio
filtering, so `setSongLevel()` applies the profile's gain only; after capture,
the logical level stays unchanged and the shared boundary owns both filtering
and gain. Returning upstairs restores the exact logical level.

Speech ("fishu" TTS) uses the browser **`speechSynthesis`** API — separate from Web Audio,
never counted against the context cap. The formant/vocal-tract synths (giggle, espresso
"aahh", phone "alo?") take a `ctx` param fed by `getSfxCtx()`, so they ride the SFX bus.
Trip cues use that same SFX handle too. DMT has its own six-second glassy drone-and-bells
soundscape; its teardown fades and stops only those oscillator nodes when the trip ends,
is reset, or is interrupted, leaving the shared context and every other consumer alone.
The campsite mushroom replaces the ordinary shrooms melody with six seconds of scheduled,
stereo birdsong; interruption fades and stops only those chirp oscillators.
The monitor power menu also stays on this bus: reboot's three window-close clicks align
with its closing cards, PC shutdown answers its two-note boot cue in reverse, and sleep uses
a short filtered noise exhale. Reboot's delayed clicks re-check focus and visibility at playback time.

## Per-consumer lifecycle maps to NODES, not the context

With one shared context, a bed stopping must NOT close/suspend the context — that would
kill everyone else. So each handle's lifecycle acts on its own nodes:

- **`audioBed()` handle:**
  - `.suspend()` → ramp `_out` gain to ~0 over 20 ms (a music "pause" = **mute-in-place**).
  - `.resume()` → ramp `_out` gain back to 1 (un-mute / start).
  - `.close()` → decrement the active-bed count and `disconnect()` `_out` (plus the party-only
    departure node, when present). The bed's own
    oscillators/sources are already stopped by the caller's fade-then-stop, so this never
    pops. Idempotent (guarded), so a double-close can't under-count.
- **`getSfxCtx()` handle:** `resume/suspend/close` are all no-ops. Leftover per-effect
  `close()` calls must never touch the shared context; suspend is handled centrally.

### Why mute-in-place (not real pause) is safe

`ctx.suspend()` freezes `currentTime`; gain-gating lets it keep advancing. The paused synth
beds are **look-ahead schedulers** (`bedNext = currentTime + lead`, `setTimeout` queues
notes up to `currentTime + horizon`). Because the shared clock keeps running during a
gain-gate mute, the scheduler self-consumes in real time — no backlog, no catch-up burst.
The beds all **loop**, so muting then un-muting a few notes later is inaudible. (Real
pause-in-place is impossible without freezing the shared clock, which would freeze everyone.
The real `<audio>` songs still pause via the element, unaffected.)

**The burst trap this avoids:** if the shared context were suspended *underneath* a live
look-ahead scheduler, `currentTime` would freeze then jump on resume, and the scheduler
would fire its whole backlog at once (an audible cluster / pop). The idle manager below
prevents exactly this.

## Central idle/suspend manager — `window.__updateSharedAudioIdle()`

The ONE place the shared context is suspended/resumed, replacing every old per-context
suspend + idle timer. Keep it **running** while:

- the page is attended (`!hidden && hasFocus`), OR
- any `<audio>` song is playing (`window.__anySongPlaying()` — backgrounded playback is a
  feature), OR
- any synth bed is live (`__activeAudioBeds > 0`).

**Suspend only when truly idle** (unattended, no song, no bed) so we never hold a silent OS
stream open. `__activeAudioBeds` is a refcount: `audioBed()` increments, the handle's
`close()` decrements. This is what keeps the clock from freezing under the **background-safe
beds** (the Cuddly-local projector scores and every garden-party dance) — while their room
gate remains open they intentionally keep playing while unfocused, so the context must stay
running under them → no clock jump → no burst.

Wiring: `visibilitychange` + window `blur`/`focus` + a 2 s interval backstop
(`updateFocusGatedAudio`) all call the manager (via `__updateEqCtxIdle`, which now just
delegates to it). The shared context also watches its own `statechange`: if the browser or
OS suspends/interrupts the live device while a bed still owns it, the manager resumes that
same context and connected graph in place. The pipeline's old song-only idle condition
folded into this.

## Focus/visibility gating (the "crickets/crane rule") — preserved

API preview sessions treat score playback as transaction-owned audio. Starting a preview score
snapshots and pauses all four real song elements, plays one selected loop through the existing
media/audio graph, and registers generation-scoped teardown. Typed `fade_ms` arguments use the
existing song fade owner and settle before the action completes. Ending, hiding, page-hiding, or
aborting the preview stops that loop and restores each song's prior time, loop, volume, and playing
state; a clean-fresh ending stops preview ownership without leaking another audio context.

- **Continuous ambient beds** (fire, aqua hush, totoro rain, bird, kettle, radio, PC fan, projector hum,
  Porsche idle/drivetrain, road bed, and driving loop,
  campsite fire/lake/weather, AC hum, city, wind, rain, call ambience) gate their `want()` on `!hidden && hasFocus` and
  **self-teardown on blur/hide** (`updateFocusGatedAudio` re-checks each). When they stop,
  the refcount drops and the manager can suspend. The recovery Continue/Start over cover also
  counts as a room-ambience cover, keeping its saved-room preview silent until a choice is made.
  The cricket scheduler owns its short-lived chirp nodes as well: raising a cover or leaving an
  attended window retires an in-flight chirp immediately, and a later scheduler tick may start a
  fresh one only after uncovered play resumes.

The campsite outdoor bed keeps a low-passed lake lap under its wind and fire/weather layers; its
rain is a softly band-passed wash rather than a bright broadband hiss. The
sleep finale retains the lake and halves the calm wind while the locally clear stargazing sky keeps
rain/storm channels at zero; the night therefore stays audible without reverting to broadband hiss.
Each of the four staggered wisdom bubbles carries one soft, speaker-pitched formant murmur,
triggered by that bubble's reveal animation and suppressed whenever Camping is unattended or covered.
At `~ fin ~`, the campsite also suppresses the loft weather scheduler's lightning and thunder,
including a rumble already queued before the finale, so only the quiet lake/wind bed remains.
Its attended curtain call adds four one-shot cues: an ember breath when the fire goes out, padded
footfalls and a low snuffle as the mama bear approaches, dry cob snaps when she collects the food,
and a campsite-only couple motif at `~fin~`. Markéta's glassy upper voice and Behdad's warm lower
voice trade phrases, resolve together, then their existing formant synths answer with sequential
high/low “I love you” lines. The delayed voices re-check the terminal Camping foreground, focus,
and visibility before playing. No curtain-call cue replays during checkpoint paint/restore.

The Porsche HUD adds an original compact four-bar driving loop on its own `audioBed()`:
four-on-the-floor kick, short “doob” bass replies, muted chord stabs, and sparse hats.
It exists only while the Entrance, HUD, engine, and attended-window gates are all live;
leaving, dismissing the HUD, stopping/stalling the engine, hiding, or unfocusing fades and
closes only that bed. Speed gently raises its tempo and opens its low-pass filter, while RPM
adds a smaller brightness lift. Its master follows `__songVolume()` so the music button and
session master scale it independently of the Porsche engine/drivetrain bed.
During an active Road Trip, returning focus keeps the simulation and all Porsche driving
audio paused until a fresh steering or pedal input resumes both from a clean frame boundary.
A browser/OS audio-device interruption is different from attention loss: it leaves the
Road Trip running and recovers the shared clock in place, so the existing engine/tire bed
does not remain silently stranded until the next scene or SFX creates a new owner.

Autonomous weather thunder keeps its lightning visuals across the loft, but its delayed rumble is
owned only by an attended Balcony, Entrance, active Road Trip, or Camping scene. Indoor loft rooms,
foreground covers, a paused Road Trip, blur/hide, and room navigation are silent; every delayed clap
rechecks ownership at playback so a queued sound cannot follow the player away. Entrance street
driving and active Road Trip also snapshot the Porsche cabin exposure at playback: roof-open
is prominent and unfiltered, a door or window opening is intermediate, and a closed cabin remains clearly
audible but darker behind a low-pass. Cabin weather is mixed high enough to survive the drivetrain
and road bed; filtering, rather than near-silence, carries most of the enclosure contrast. The
Entrance façade without its driving HUD and Camping remain outside that car-only
enclosure stage. Deliberate thunder and monitor-game effects are
user-triggered SFX, not part of this autonomous weather gate.

With the Entrance façade open and no driving HUD, the shared wind generator and the visual-rain
generator each retarget their bounded bed to an `audioBed("outdoor")` route. This is
local exterior weather, so it bypasses the lower-floor boundary that intentionally muffles upstairs
loft audio at the Entrance; wind and rain therefore retain their full open-air level and bandwidth.
Opening the street HUD retires both exterior beds before the independent cabin-rain bed takes ownership;
dismissing the HUD restores them. Blur/hide, foreground coverage, room exit, reload, and the existing
fade-and-close timers retain one-bed ownership, with room exit handing wind back to Balcony.

Abraham Lake Camping owns one bounded outdoor bed: soft wind is always present, completed lit
fire raises its crackle layer, rain raises a brighter precipitation layer, and storm weather also
raises wind and low rumble. The stargazing clear-night override suppresses those underlying
precipitation/storm layers while retaining calm wind and fire. The layers retarget from tracked in-flight levels, preserving the
arrival fade even when several route/weather paints land in the same tick; blur, hide, route pause/dismiss,
recovery cover, or Entrance close fades and closes the bed; extinguishing fades and stops only the
fire source. A re-entry during that fade retires the old bed before starting its replacement, so
two noise beds cannot overlap during the route handoff.

Fancy-Stupid's engine/drivetrain, driving loop, tire screech, and ABS chatter keep their
authored source gains and then enter a car-only spatial output stage. Engine and tire noise
track the moving car; the score stays centered on the HUD and ABS sits by the brake control.
The stage adds mild edge-distance attenuation plus stereo placement. Closing the soft top
smoothly applies a shared `0.74` enclosure gain and source-appropriate low-pass cutoff;
opening it restores unity/18 kHz. The continuous engine and score retarget as the car or roof
moves, while each half-second brake one-shot snapshots the current car/roof position. This
stage still terminates at the owning bed or SFX destination, so it does not alter trigger,
focus, teardown, volume-button, or shared-context rules.

While the visual rain layer is live, both Entrance street driving and active highway Road Trip own
one bounded cabin-rain noise source in the shared AudioContext. Its lifecycle follows the attended
HUD rather than ignition, so rain remains audible while parked with the engine off. Keeping it
separate from the road/tyre voice also makes precipitation perceptually distinct. Roof-open,
door/window-open, and closed profiles progressively lower both gain and low-pass cutoff while keeping
rain unmistakable over the moving drivetrain. Rain uses a deliberately wider exposure curve than
thunder so roof, door, and window changes are immediately audible. Snow suppresses
the branch with the Entrance rain streaks; Camping remains outdoors on its separate lake/weather bed.
Engine/HUD teardown, Road Trip pause, blur/hide, foreground coverage, route arrival, and Entrance exit
therefore remove cabin rain through the drivetrain's existing lifecycle with no duplicate tail.

The continuous drivetrain bed now has one downstream vehicle master after the engine/tire
spatial branches; live passing-traffic voices join it too. It eases in over 220 ms and normally
retires over 280 ms, so engine stop, pause, and focus changes no longer hard-disconnect live
oscillators and road noise. Re-entry can start a fresh bed while the old node-owned tail finishes;
each tail closes only its own `audioBed()` handle.

At the Abraham Lake arrival, `arriveRoadtripCamp()` owns one 1.15-second program handoff: the
drivetrain/road/traffic master and existing driving score recede together, hot-weather AC clears
slightly sooner, and the already-authored outdoor lake/wind bed rises underneath. The transition
does not create or replay a sound, and it leaves all spatial, volume-button, focus/visibility,
and shared-context ownership unchanged. After the tails finish, Camping again owns exactly one
outdoor bed.

Hack-Man's five compact arcade cues—pellet tick, game start, edible ghost, player death,
and maze clear—are oscillator-only one-shots on `getSfxCtx()`, panned to the retained board
in either its monitor or room presentation. Pellet ticks have a short retrigger floor and
alternate pitch to stay light. Simulation-fired cues repeat the hidden/unfocused and live-
presentation gates before requesting the SFX bus; blur, pause, close, Kill, reset, and state
restore stop the game's outstanding oscillator nodes without touching the shared context.
Reduced motion does not mute these cues.

At an effective outside temperature of 24°C or warmer, the running Porsche HUD
also starts a restrained filtered-noise fan and low motor tone through the same
shared `audioBed()` route. It reads `__outdoorTempC()` (live weather, pretend-date
weather, or the explicit thermometer override), fades only its own nodes, and is
gated by Entrance + HUD + engine + foreground focus. Cooling below the threshold,
leaving or covering the room, hiding/unfocusing the page, or stopping the engine
removes the vent wash without touching the shared context.

High-speed street braking uses a broad filtered-noise screech reinforced by a lightly
warbled tire tone; its audio retry is independent from the unchanged tire-mark
cadence, so a temporarily unavailable shared context cannot swallow the stop.
The low-passed ABS layer stays subordinate on the street. Road Trip suppresses it and replaces
the repeating held-brake screech with one brief, quiet tire chirp per pedal press. Braking below
65 km/h schedules neither layer.

Roadtrip impacts are attended one-shots on `getSfxCtx()`, routed through the
HUD-centered Porsche spatial stage. A low crash/noise body and high glass-shard
layer share one severity value derived from relative speed and object mass;
head-on events extend the envelope, while rear-end and deer bumps remain shorter
and quieter. Rabbit clips use a separate very short, low-gain thump/noise body
without the glass layer. They never create, suspend, or close an `AudioContext`.

Roadtrip pickups use the same attended shared-context path and HUD-centred
spatial stage. Hearts play a soft rising pair, kisses a brighter swept pair, and
the rare infinity a four-note shimmer. Each voice disconnects after its short
envelope; hidden or unfocused collection remains silent.

Faster traffic passing a Porsche stopped in the inner lane adds one 0.66-second horn on that same
shared context; a stopped shoulder or outer-lane Porsche stays silent. Oncoming traffic adds a
distinct 1.35-second warning only when the Porsche occupies that vehicle's negative lane, latched
once per entity. Both gains follow distance and cabin exposure, their stereo position follows the
vehicle lane, and their oscillators disconnect after the envelope.

A speeding pursuit adds one restrained two-tone siren on the shared SFX handle,
localized to the live rear-view mirror. Its oscillators exist only while the
highway police state is pursuit/capture/stopped/arrest and the Entrance is visible,
focused, uncovered, and audible. Its master gain falls with the pursuit's modeled separation once the
Porsche sustains 180+ km/h, then fades and disconnects after escape. During a police
capture it remains present through the progressive forced slowdown and court-arrest sequence.
An ordinary roadside stop, final resolution, leaving the highway, closing the room,
hiding the tab, or losing focus fades and disconnects those nodes; focus may recreate
them while pursuit/capture/arrest remains active. The siren never suspends or closes the shared
context.

Court-required stops add two short attended cues on that same shared SFX context:
a two-tap window knock as the officer reaches the driver, followed by restrained
radio static and two light metal clicks as the summons card appears. The police
step clock triggers each cue once; there are no sound timers and no additional
`AudioContext`. Live source/node records are stopped and disconnected on blur,
tab hide, room close, highway teardown, or reset. The visual arrest clock pauses
while unattended, so a hidden or unfocused page cannot advance into either cue.

The drivetrain bed also owns one looped noise source fanned into five continuous
textures: low road body, tire band, high-speed wind, filtered corner scrub, and a
quiet pitched corner squeal. `porscheTireAudioMix()` raises road/tire/wind with
speed, corner layers with speed × steering angle, and adds progressively rougher
rumble-strip/gravel gain. Tire paths use their own Porsche-anchored spatial output
with a 5.2 kHz closed-roof cutoff; the engine keeps its lower cabin cutoff. These
nodes start and stop with the existing drivetrain bed and inherit the same
Entrance + engine + focus/visibility lifecycle.

The brief turn-indicator flourish remains a street-driving response only.
Highway steering suppresses its lamp/tick sequence so repeated lane corrections
do not compete with traffic, tire, pursuit, or collision cues.

- **`getSfxCtx()`** returns null while `document.visibilityState === "hidden"` — the
  hidden-tab choke point that silences all one-shots (and autonomous timer-driven ambients)
  without per-call-site guards. Autonomous one-shots additionally guard on
  `document.hidden || !document.hasFocus()` themselves (X11 gives no occlusion signal).
- **Projector piano voices** start only from focused keyboard or pointer input and have a
  fixed natural decay. Pointer/key release, focus loss, room/channel change, and tab hide
  all release the active voice set; the visible ×, Escape/Backspace, and an Enter-launched
  Octi game also release the set before hiding the keybed. Dismissal leaves the night-sky
  backing score alone, survives room changes and Continue/reload, and rearms only after an
  explicit projector-channel change. Party start/stop does not release voices, because
  playing along is supported during the party.
- **Office device signatures** are separate one-shots on the shared SFX bus: the PC uses
  two short low notes, rising on boot and descending on power-off; the laptop uses
  three glassy high-low-rise tones; video-call connection keeps its low swell and rising
  C-major arpeggio. PC-driven monitor/typewriter swaps suppress their separate genie-poof
  cue, while manual swaps retain it. Device helpers re-check focus and visibility before scheduling.
- **The office typewriter** schedules a 3–5-key burst directly on the shared audio clock for each
  activation, varying pitch and spacing without leaving timer-driven sounds behind.
- **The office laptop's automatic update** keeps animating while the desktop monitor is
  being engaged or is zoomed, but its update click and laptop-specific reboot cue are
  suppressed at callback time. Attention begins on the initiating monitor tap, including the brief
  dark-screen boot interval before zoom becomes eligible. Room tone (fire, aquarium
  hush/rain, birds/crickets, kettle, radio, PC fan, AC, and city hum) yields while the pocket phone or either
  office screen owns the foreground, then re-evaluate on dismissal. Player-triggered app,
  call, projector-score, song/media, and toy sounds are unaffected.
- **Background-safe beds** (channel-only `want()`) intentionally ignore focus/visibility and
  keep playing — the refcount keeps the context alive under them.

The coffee-cat channel is one of these Cuddly-only projector beds. Its original 72 BPM loop uses
self-terminating chord, bass, brush, kick, and melody voices scheduled ahead on the shared clock;
channel exit cancels the sole scheduler, fades the bed master, then closes only its `audioBed`
handle.

The cinema creates no new AudioContext. All loft-owned Web Audio outputs—the
bed proxies, shared SFX bus, and captured song analyser—meet at the single
`__loftAudioMaster` immediately before the shared context destination. While a
Vimeo film reports active playback, `__setCinemaAudioDuck(true)` fades that
master to 0.035; pause, end, Choose another, projector-off, sprinkler short, or
leaving fades it back to exactly 1. Source gains and playback states remain
untouched, so the precise pre-film mix returns. Vimeo lives outside that graph
in its cross-origin iframe and is therefore never self-ducked. The existing
party duck is still re-evaluated so its own source mix remains coherent.

Opening Cinema joins the foreground coverage gate, starts the room-local projector hum while the projector is on, and fades the active Cuddly
projector score, and leaves the durable projector channel unchanged. The
physical cinema projector initially creates no iframe. Selecting a film creates
one; a ready or ping reply subscribes to Vimeo's play, pause, ended, and timeupdate
events, pushes the current `__songVolume()`, and begins a bounded `getEnded` status
poll. Messages are accepted only from the active iframe. An ended event, a trusted
final timeupdate, or a true `getEnded` reply removes the iframe, restores the
chooser, and releases the whole-loft duck. The status reply is the deterministic
fallback for Vimeo's seek-near-end path, which can reach its recommendations card
without emitting a terminal subscribed event. The side transport queues and sends
play/pause commands through postMessage; the shared volume step and console master
also retarget Vimeo with `setVolume`. Teardown cancels the poll and removes the
iframe, which remains the reliable cross-origin stop path.

Room navigation gives ordinary room-local ambience a five-second fade. Cuddly projector channels
use a shorter three-second room-exit fade so they recede behind the visitor without lingering.
Projector score schedulers remain alive through that ramp, rather than exhausting their short
look-ahead queue. Direct channel and device changes keep their shorter local fades.

The garden-party dance bed also ducks while either office monitor or laptop is zoomed, then swells
back over a slower roughly 2.5-second screen-focus ramp when the zoom is dismissed. Room navigation
still clears it on the ordinary room-transition timing. This uses the existing
`__partyDuck` dance-only projection; loft songs—including the guitar-started song—do not read that
scalar and keep their current level. A playing loft song is itself another global party-duck gate:
its media-element `play`/`pause`/`ended` events re-evaluate the projection, so the party glides
under the song everywhere and returns when the song stops. Every dance bed retargets that shared
projection by cancelling-and-holding its current AudioParam automation first; overlapping monitor
focus and song fades therefore cannot leave an old duck ramp stranded after both gates clear.

Instrument motion follows audible playback, not transport state alone. The shared song-level
setter publishes the zero/nonzero boundary used by the guitar/ukulele sway, string shimmer,
garden notes, and room groovers. A track that remains technically playing while an ownership or
snippet fade reaches silence therefore settles visually; raising its level resumes those visuals.

While a visible graceful party wind-down walks the guests out, the dedicated output gain
linearly lowers every connected party bed over the same 3.1 seconds. It sits downstream of each
dance's master, bass lift, and panner, so every party source crosses the fade before reaching the
shared lower-floor bus. The dance scheduler and its `audioBed()` remain live until normal party
teardown, leaving the shared context and bed refcount unchanged. Cancelling the goodbye ramps
the still-connected output back to unity over 350 ms; an immediate or direct teardown cancels
the pending wind-down and closes the dance through its existing node-owned lifecycle. Volume
and foreground-duck changes remain independent because they operate on the upstream dance
master and cannot replace the output fade's automation.

Road Trip foreground ownership is another independent edge. Actual route launch—not merely
Entrance, HUD, or chooser—sets `__partyForegroundSuspended`; every dance `want()` closes at that
boundary, all connected party outputs ramp to zero over 700 ms, and party look-ahead/timer owners
stop. This includes Camping while it remains the active route. Parking starts only the retained
dance's one scheduler/output and resumes the same dance clock, DJ, roster, and party progress.
An explicit global transport pause is remembered separately: release recreates the retained bed
muted and leaves it held until the player resumes. The owner is intentionally not persisted because
checkpointed Road Trips restore parked and reclaim foreground only on explicit re-entry.

## Kill switch

`AUDIO_PIPELINE_ENABLED` (in `ensureAudioGraph`'s block) is the owner's source-level kill
switch. Set it to `false` and redeploy to revert songs to plain native `<audio>` plus the
beat-pulse EQ fallback; set it back to `true` and redeploy to restore the pipeline.

## Adding a new sound

The monitor’s `snake` DOS bundle is deliberately silent:
`dos/player.html` starts js-dos with volume zero and DOSBox sound devices
disabled. It does not create or join the loft’s shared audio graph.

- **A one-shot effect** → get the context via `getSfxCtx()` (returns null → bail; every
  caller already handles that). Connect to `ctx.destination` (the SFX master) directly or
  via `pannedOut(ctx, elId)`. Never construct your own context.
- **A new continuous bed / dance** → `x = audioBed(); if (!x) return;`. Build your graph on
  `x` exactly as if it were a context; end at `x.destination` (via `pannedOut`). Give it a
  `startX`/`stopX` where stop **fades a gain to silence, then a `setTimeout` stops the
  nodes and calls `x.close()`** — `check.js` asserts the fade-end and close-delay derive
  from one shared `fadeSecs` variable (an abrupt close mid-fade is a known pop). If it's
  focus-gated, add a `__updateXSound` and register it in `updateFocusGatedAudio`; if it's
  background-safe, gate `want()` on channel/party state only.
- **The context stays alive for everyone** — your `close()`/`suspend()` only touch your own
  nodes. Don't call `__sharedAC.suspend()`/`.close()` from a consumer; that's the idle
  manager's job.

## Testing

- **One-context proof:** `scratchpad/pw/ctxcount.mjs` monkeypatches the `AudioContext`
  constructor to count instantiations and routes all output through a probe analyser, then
  drives beds + every registered dance + SFX clicks and asserts the count is **1** with live analyser
  signal — on **both** Chromium and WebKit (Playwright-WebKit does NOT enforce Safari's
  cap, so it can't reproduce the silence; the fix is correct-by-construction + this proof).
- **Regression:** `node tests/check.js` (new-Ctx == 1, fade/close race), `tests/state.js`
  (drone start/fade-stop storm, pause/groove), `tests/play.js` (full playthrough + click
  storm), `tests/projector-coffee.js` (seasonal order, translated now-playing, bed lifecycle),
  `tests/cinema-room.js` (foreground coverage, Vimeo teardown, party duck, navigation),
  `tests/lower-audio.js` (all five lower profiles, native fallback attenuation,
  lateral retargeting, exact upstairs restore, and Entrance glass groove),
  `tests/entrance-roadtrip-camp-audio-handoff.js` (vehicle-master fade, synchronized car-tail
  ownership, campsite rise, and final one-bed cleanup), `tests/weather-audio-ownership.js`
  (scene-gated thunder, Entrance exterior-weather ownership, delayed enclosure snapshots, bounded
  street/highway cabin rain, three roof/window profiles, and teardown), `tests/piano-message.js` (message transition, layered keys, polyphony,
  backing-pause independence, and party continuity), `tests/piano-lifecycle.js` (durable dismissal,
  explicit-channel rearm, canonical Octi handoff, bilingual close control, and coarse-pointer labels),
  and `tests/piano-checkpoint.js` (reload/Continue persistence), plus `tests/party-roadtrip-lifecycle.js`
  (party fade/suspension, exact resume, global-pause independence, and no obsolete post-party coda).
  All must pass.
