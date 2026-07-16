# Second Act: "The Evening" — design proposal for rsvp.html

Internal design doc (blocked from public via `.htaccess`, like CLAUDE.md). This is a
**proposal for review — nothing here is implemented yet.** It answers the owner's brief:
the game is strong on graphics/sound/interactions and Act 1 (the solve chain) is good, but
the balcony is a cliff — the player is dropped into an open sandbox with no guidance. The
owner wants: the **party as the climax**, players **routed to the bar → party**, much more
engagement with the **monitor + phone apps**, a **photobooth** party nudge, a **piano
wind-down**, a **full-circle loop back to morning coffee**, the **RSVP as the last word /
exit**, the balcony **switch-misdirection** twist, **instructed day/night**, discreet
**psych-trip** nudges, and above all **more hints/nudges/workflow** (delivered light, no
heavy checklist — the egg-hunt was cut from 21→10 for being overwhelming).

Key discovery: the **"Watch the loft" cinematic already performs this exact arc** (coffee →
tasks → dusk → piano → blacklight party → DJs → "a flash for the album" → bar → flair → "and
that's their day. again tomorrow…"). The second act essentially already exists as a movie;
this proposal makes it **playable**.

---

## 1. Diagnosis (in code terms)

Act 1 is a directed spine via `goToStage`/`maxUnlocked`: espresso (kitchen) → water/uke/candles
(garden) → octopus + blanket (cuddly) → Prague call + PC + lamps + stained glass (office) →
balcony. First balcony entry fires `triggerBalconyFinale()` (butterfly, sun-shower 500ms, bell
3800ms, rainbow 4200ms) then at 9100ms `showRsvpNudge()` → *"Don't forget to RSVP — but wander
first ↓"*. That is the **last directed thing the game ever says.**

Everything after is pull, not push: the solved-room `showExploration()` rotation (just shipped),
the brick-hint dispenser (`ROOM_HINTS`), and a content-free `phoneNotify()` buzz every 19s
(balcony-only, no payload — nags without saying why). The richest content sits behind un-signposted
state changes:

- **Bar** exists only at dusk/party (`__barUpNow`) — a daytime player never meets Pouria, Flair-Catch
  (`startFlairCatch`), or the patrons.
- **Party** (`__setGardenParty` — UV blacklight, `PARTY_DANCE_ORDER` ~15s rotation, DJ swap +
  `announceDj` every 3 dances) hangs off one unexplained purple switch advertised only by the rotating
  line *"Every switch has a purpose."*
- **Piano wind-down** already exists: cuddly projector `chan-stars` = Satie Gnossienne No. 1 + note-synced
  sky flashes (`skyOnScreen()`). Nobody is sent there.
- **Monitor's 16 dock apps + phone's 20 apps** are the deepest content and structurally invisible.
- **Trips** (`garden-drugsbox` → `triggerRsvpTrip`, 7 variants) are pure secret.

`autoDayNight` (night after ~60s on balcony, flip every ~120s) papers over the dusk gap but takes the
one dramatic state change of the evening and makes it happen *to* the player, not *by* them.

The fix is not more content — it's a **second directed spine made of content that already ships**, held
together by the lightest possible thread.

## 2. The second act — "a day in the loft, lived once by you"

Act 1 = the couple's **day**; Act 2 = their **evening**, closing the ring back to morning. Six beats,
each an invitation, each completing off a signal the code already emits:

- **Beat 1 — Sundown.** ~10s after the finale RSVP nudge, the phone buzzes with a *payload*: a text from
  **Pouria** asking the player to tap the sun down (bar opens at dusk). Completes on the `dusk` class
  (`toggleDusk`). Replaces the content-free 19s nag with meaning.
- **Beat 2 — The bar.** Dusk raises the night bar (`__refreshKitchenBar` → `kitchen_bar_night`). Completes
  on a cocktail built (`__makeCocktail` toast) or a Flair-Catch round. Existing bar brick-hints
  (`hint_barman`/`hint_drink`/`hint_patrons`, `rel: barUp`) are the supporting cast.
- **Beat 3 — The party (climax).** After a drink, the DJs text: the purple switch on the balcony. Flipping
  `balcony-partyswitch` → `__setGardenParty(true, true)` whisks to the blacklit garden — arrived at as a
  reward, not stumbled into. Completes on `window.__gardenPartyOn`.
- **Beat 3½ — The flash for the album (flagship in-party nudge).** After the first DJ swap (`announceDj`,
  ~3 dances in), the photographer nudges → the **phone photobooth** (right one: `__openPhoneModal` opens in
  the current room, "no balcony jump"; shares the monitor compositor; the polaroid persists to the phone
  **album** `pbSavedFrame`). Monitor photobooth stays the office alternate. Completes on booth-open (never
  punish a declined camera permission). **Template for every in-party nudge: the celebration generates the
  reason to open the app.**
- **Beat 3¾ — the quiet door (trips, opt-in only).** Not a beat, advances nothing. Two discreet party-gated
  surfaces: (a) under blacklight, `garden-drugsbox` gets a faint uranium-green fluorescence (one CSS rule in
  the existing fluorescence block ~line 4500, beside the caterpillar/cat's-eyes) — glows for those who look;
  (b) one `rel: partyOn` garden rotation line worded so grandparents scroll past and the curious lean in.
  Trips **never** appear in the text thread (the thread is the mainline every guest reads).
- **Beat 4 — Wind-down.** Party ends (flipped off, or after ~2 dance rotations) → Octi texts: the projector
  found the stars. Cuddly → tap wall screen to `chan-stars` → Satie under flashing sky. Completes on
  `skyOnScreen()` holding for one phrase (~45s). The earned exhale.
- **Beat 5 — Dawn lands, RSVP exits.** After the stars phrase, the caption does the closing move in two
  breaths: *"And that's their day — coffee to stars"* (echoing `cine_encore_end`), then a **stronger final
  variant of `showRsvpNudge`** (new key `rsvp_exit`), explicitly the moment to leave and answer. Existing
  `rsvp_nudge` in the balcony rotation stays untouched; the exit beat is additive and is the terminus.
- **The ring (optional replay, never superseding the exit).** *After* the send-off shows, one new rotation
  line: tap the sun, it's morning again (`toggleDusk` back; birdsong via `__updateGardenBirdsong`, crane
  restarts, bar lowers) + a one-shot kitchen *"Morning again. Coffee first… ☕"*. **No state wipe** — a soft
  dawn, not a reset; the extinguisher (`resetHunt`) stays the hard reset and gains a `__resetActTwo` hook
  beside `__resetExplore`/`__resetExplorePtr`.

### Instructed day/night (the owner's "maybe")
**Recommendation: make sundown a player action, but keep a slow fallback rather than deleting
`autoDayNight`.** The current auto is *eager* (60s) and fires before Beat 1's text lands. Change to: (a)
starting the act-two thread suppresses auto (already stops on any manual flip — `__stopAutoDayNight`); (b)
if Beat 1 idles ~3 min, the sun sets itself once and Pouria's follow-up acknowledges it. Agency first,
passive players still reach the evening. Trade-off: the balcony loses unattended ambient day/night breathing.

## 3. Guidance without a checklist — the phone as soft quest-giver

**The thread is 4 texts total, ever** (Pouria, the DJs, the photographer, Octi) + one closing line. That's
the entire "quest system" — linear, one-at-a-time, disappears as followed. Well under the overwhelm ceiling
that killed the 21-egg hunt.

Two-channel delivery, both existing:
- **Phone buzz** (`phoneNotify` plumbing) now carries a payload: the closed phone's lock screen (live clock
  via `paintPhoneClock`) shows the latest text preview — sender + one line. Tap → phone opens. Slice 1 needs
  no new app: the lock-screen preview *is* the message.
- **Captions** as guaranteed fallback: the active beat's nudge is the *first surviving item* in the room's
  explore rotation — same pattern as the balcony's `rsvp_nudge` sentinel, but `done` latches on the beat's
  completion signal and `rel` gates it to the beat being active. A phone-ignorer still drifts down the arc.

**Composition with the shipped exploration captions is by design:** beats live *inside* `explorePool` as
highest-priority self-retiring items; when a beat's signal fires, its `done()` latches and the rotation
returns to pure wandering. One system. (`restoreStageHint`'s `liveSolveState` special cases still win.)

The generic 19s balcony nag is retired in favor of: buzz once per new text + at most one reminder buzz.

## 4. Monitor + phone apps (moments, not menus)

| Beat | App | Diegetic pull |
|---|---|---|
| Bar | phone `cocktails` | Pouria's text ends "…menu's on your phone if you want to order fancy" — the drinks-list app becomes the bar menu it already is. |
| Party | phone `photobooth` → `album` | Flagship; the polaroid lands in the album. Octi's wind-down text can add "bring the photo." |
| Party | monitor `music` | Garden rotation line: the office is dancing too — the tower's visualizer (`eq-live`) is up. Rewards whoever walks to the office mid-party. |
| Wind-down/dawn | monitor `mail` | The inbox holds an unread RSVP letter with a reply flow (`monitor-mail-row-rsvp`). One office rotation line post-party: a second, fully-built RSVP path that doubles as mail-app discovery. |
| Dawn | monitor/phone `calendar` | Ring-closing joke: tomorrow's on the calendar — and so are two bigger days (May 1 / July 10). |

Not here: doom, mines, linux, python, tattoo, dress-up, places… stay pure discoveries. **Five app touchpoints
is the ceiling** — more turns the evening into a tour.

## 5. Reuse vs. new machinery

**Reused wholesale (zero new systems):** `toggleDusk`/`__setDayNight` + dusk cascade; `__barUpNow`/night bar +
cocktail/flair/patron logic; `__setGardenParty` + dance rotation + `announceDj`; phone modal opening in current
room; photobooth compositor + album persistence; `chan-stars` Satie + `skyOnScreen`; `explorePool`'s
`rel`/`done`/sentinel pattern; `showRsvpNudge` plumbing; `phoneNotify` buzz/LED; `resetHunt` hooks; EN/CS `T`.

**Genuinely new (small, bounded):**
1. **Beat tracker** — one IIFE, a single `actBeat` index advanced by ~6 one-line pings at existing sites
   (`toggleDusk`, cocktail-built toast, `setGardenParty`, `announceDj` first swap, photobooth open, stars-phrase
   timer). ~60–80 lines with fallback timer.
2. **Lock-screen text preview** — one DOM element on the closed phone + a `T`-keyed message list. ~40 lines + copy.
3. **Explore-pool injection** — extend `explorePool()` to consult the beat tracker; ~10 lines.
4. **`rsvp_exit` send-off + dawn one-shot captions** — new `T` keys + short sequence reusing `setCaption`/`showRsvpNudge`.
5. **Drugsbox UV glow** — one CSS rule in the fluorescence block; one `rel:`-gated garden rotation line.
6. Infra: `check.js` enforces EN/CS parity automatically; `play.js` grows an act-two chain (dusk → cocktail →
   party → photobooth → stars → exit caption), same style as its Act-1 `solve()`.

## 6. Draft copy (EN — CS mirrored later by Markéta)

**Texts** (lock screen; sender-voiced, lowercase-casual like the wordmark):
- **Pouria 🍸** — *"bar opens at sundown. tap the sun for me? first pour's on the house."*
- **Pouria 🍸** (fallback, if the sun set itself) — *"sun beat you to it — bar's open anyway. come thirsty."*
- **Amir & Danesh 🎧** — *"decks are warm. purple switch, your balcony. you know what to do 🪩"*
- **the photographer 📷** — *"everyone's in my shots but you. the booth's in your pocket — one flash for the album?"*
- **Octi 🐙** — *"the projector found the stars. come be horizontal. bring the blanket — and the photo."*

**Caption injections** (narrator-voiced, matching the shipped hint register):
- Beat 1, balcony: *"The sun's hanging low — one tap starts the evening. 🌇"*
- Beat 3, balcony: *"The purple switch has waited all day. Flip it and hold on. 🪩"*
- Beat 3½, garden mid-party: *"You're the only one not in a photo — the pocket phone has a booth. 📸"*
- Trips door, garden party-only rotation: *"Something small glows under the blacklight. For the adventurous — enjoy responsibly. 🙃"*
- Beat 4, post-party: *"The nook's projector knows a night sky. Go be horizontal. 🌙"*
- Cuddly, stars on: *"Satie, stars, someone soft to hold. Stay a minute."*
- **Send-off breath 1:** *"And that's their day — coffee to stars. ☕→🌙"*
- **Send-off breath 2 (`rsvp_exit`, linked):** *"Now the real question — will you be there? → RSVP 💌"*
- Ring offer (post-send-off rotation): *"Or wind it back — tap the sun, and it's morning again. ☀️"*
- Dawn one-shot, kitchen: *"Morning again. Coffee first… ☕"*
- Office post-party rotation: *"There's a letter on the big computer. It's been waiting all day. ✉️"*
- Garden party rotation: *"The office is dancing too — the tower's got the visualizer up."*

## 7. Phased sketch

- **Slice 1 (delivers the whole arc, no new UI):** beat tracker + caption injections + `autoDayNight` retimed
  to arc-fallback + `rsvp_exit` send-off + dawn one-shot + reset hooks + play.js act-two chain. Buzz fires
  per-beat but payload is captions-only.
- **Slice 2 (the phone finds its voice):** lock-screen text previews + the five sender texts; drugsbox UV glow +
  trips rotation line; the album/mail/calendar/music rotation lines.
- **Slice 3 (later drop, ~3-month cadence):** a proper messages-thread app (21st tile, grows per-drop — future
  characters can text, e.g. Irene's cameo); party-framed polaroid auto-styling; dawn flourish polish.

## 8. Open questions for the owner

1. **Auto day/night:** fully retire the eager 60s auto for instructed-with-3-min-fallback? Or keep auto for
   visitors who idle at the balcony?
2. **Party gating:** recommend the switch stays always-live (beat tracker skips completed beats; `done()`
   latching handles any order). Confirm no hard "bar first" gate wanted.
3. **Text senders:** Pouria, Amir & Danesh, the photographer, Octi — all in-game cast, zero personal narrative.
   Any names you'd rather not put in writing on the site?
4. **Trips discretion:** glow + one rotation line the right volume? Should Pouria also slide a coaster hint, or
   is that one surface too many for the grandparent audience?
5. **Exit strength:** `rsvp_exit` as just the linked caption (recommended — never force navigation), or actually
   scroll/reveal the RSVP section?
6. **Persistence:** beats per-session (like `exploreSeen`, recommended for a ~10-min experience) or localStorage?
7. **Photobooth completion:** on booth-open (recommended — permission may be declined) or on shutter?
8. **Copy taste:** lowercase sender-voice texts vs. sentence-case narrator captions — does that split feel right?

---

*The deepest point: the film ends with "And that's their day. Again tomorrow…" — the game already knows its
shape. This proposal hands that shape to the player: coffee to stars, the party as the peak, the piano as the
exhale, the RSVP as the last word — and tomorrow, if they want it, one tap of the sun away.*
