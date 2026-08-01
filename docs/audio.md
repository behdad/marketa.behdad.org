# rsvp.html audio architecture

All sound owned by `rsvp.html` is Web Audio built on **one shared `AudioContext`**. This doc explains the
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
songs silent; only `?pipeline=off` direct `<audio>` playback was audible). Chrome/Firefox
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
   `ac.destination`. Music/projector/dance beds
   apply the volume-button level at their own in-graph `_masterGain` (`__songVolume()`);
   ambient environmental beds (fire, aqua hush, wind…) sit at fixed low levels and are NOT
   scaled by the button. The `bandari` source keeps its fast coastal 6/8 graph.
2. **One-shot SFX and the projector play-along piano** → `getSfxCtx()`. A persistent
   handle whose `.destination` is one **SFX master gain** (`_volMaster`) →
   `ac.destination`. The piano keeps one filtered output bus on that handle and gives
   each pressed key short, self-terminating oscillator voices. It is deliberately
   independent of the night-sky backing bed, so transport pause silences the score but
   not live keys. The console `volume()` command (`__audioMaster`) scales this;
   `__applySfxMaster()` pushes changes onto it.
3. **Songs (real recordings)** → the **pipeline** (`eqAudioCtx`), which uses the **raw
   shared context** (not a handle — it needs real `suspend/resume` and, crucially,
   `createMediaElementSource`, which irreversibly captures an `<audio>` element). Graph:
   `MediaElementSource → bassShelf → 6-band manual EQ → muffle → width → masterGain →
   compressor → route → panner → analyser → the shared lower-floor boundary →
   `ac.destination`. The normal route uses the
   room stereo panner; headphone mode crossfades to an HRTF panner whose restrained
   position follows the draggable office headphones.

**Volume model (by design):** the in-scene volume **button** controls only music/beds
(`__songVolume`), so you can turn music down to hear SFX. The console **`volume()`** master
(`__audioMaster`) is the god-knob over everything (SFX master + folded into `__songVolume`).
Overall level is otherwise the device's job. The headphone-mode filter (bass shelf +
lowpass) lives only in the song pipeline — music-only, deliberately not applied to SFX/beds.

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
the boundary from the bar above. The Balcony's autonomous wind chime is fully
gated while Entrance is open rather than leaking through its shared stage
index. Cross-origin Vimeo also bypasses it as deliberate Cinema foreground
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
The monitor power menu also stays on this bus: reboot's three window-close clicks align
with its closing cards, shutdown uses one descending tone, and sleep uses a short filtered
noise exhale. Reboot's delayed clicks re-check focus and visibility at playback time.

## Per-consumer lifecycle maps to NODES, not the context

With one shared context, a bed stopping must NOT close/suspend the context — that would
kill everyone else. So each handle's lifecycle acts on its own nodes:

- **`audioBed()` handle:**
  - `.suspend()` → ramp `_out` gain to ~0 over 20 ms (a music "pause" = **mute-in-place**).
  - `.resume()` → ramp `_out` gain back to 1 (un-mute / start).
  - `.close()` → decrement the active-bed count and `disconnect()` `_out`. The bed's own
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
delegates to it). The pipeline's old song-only idle condition folded into this.

## Focus/visibility gating (the "crickets/crane rule") — preserved

- **Continuous ambient beds** (fire, aqua hush, totoro rain, bird, kettle, radio, PC fan, projector hum,
  Porsche idle,
  AC hum, city, wind, rain, call ambience) gate their `want()` on `!hidden && hasFocus` and
  **self-teardown on blur/hide** (`updateFocusGatedAudio` re-checks each). When they stop,
  the refcount drops and the manager can suspend.
- **`getSfxCtx()`** returns null while `document.visibilityState === "hidden"` — the
  hidden-tab choke point that silences all one-shots (and autonomous timer-driven ambients)
  without per-call-site guards. Autonomous one-shots additionally guard on
  `document.hidden || !document.hasFocus()` themselves (X11 gives no occlusion signal).
- **Projector piano voices** start only from focused keyboard or pointer input and have a
  fixed natural decay. Pointer/key release, focus loss, room/channel change, and tab hide
  all release the active voice set; party start/stop does not, because playing along is
  supported during the party.
- **The office laptop's automatic update** keeps animating while the desktop monitor is
  being engaged or is zoomed, but its update click and reboot chime are suppressed at
  callback time. Attention begins on the initiating monitor tap, including the brief
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
one; Vimeo play/pause/ended messages keep the whole-loft duck honest, while the
side transport sends play/pause commands back through postMessage. Removing the
iframe remains the reliable stop/teardown path.

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

## Kill switch / overrides (unchanged)

- `AUDIO_PIPELINE_ENABLED` (in `ensureAudioGraph`'s block) — owner's kill switch: `false`
  reverts songs to plain native `<audio>` + the beat-pulse EQ fallback.
- `?pipeline=on` / `?pipeline=off` — force the pipeline on/off for testing (`off` == kill
  switch).

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
  and `tests/piano-message.js` (message transition, layered keys, polyphony,
  backing-pause independence, and party continuity). All must pass.
