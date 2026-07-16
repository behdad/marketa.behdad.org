# Second-Act design: "the switch that isn't a switch" — a guided, nudge-driven arc from the balcony finale to the RSVP

Internal design doc (blocked from public via `.htaccess`, like CLAUDE.md). **A proposal for
review — nothing here is implemented.** Consolidates two fable-agent design passes.

**The brief.** rsvp.html is strong on graphics/sound/interactions and Act 1 (the kitchen→balcony
solve chain) is good, but the balcony is a **cliff**: the player is dropped into an open sandbox
with no guidance, and the richest content (bar, party, the monitor's ~16 apps, the phone's ~23
apps, the piano wind-down, the trips) sits behind un-signposted state changes. Owner wants: the
**party as climax**, players **routed bar→party**, far more engagement with the **monitor + phone
apps** (a **photobooth** party nudge as flagship), a **piano wind-down**, a **full-circle loop
back to morning coffee**, the **RSVP as the last word / exit**, the balcony **switch-misdirection**
twist, **instructed day/night**, discreet **psych-trip** nudges, and above all **more
hints/nudges/workflow** — delivered LIGHT (no heavy checklist; the egg-hunt was cut 21→10 for
overwhelm).

**Key insight.** The **"Watch the loft" cinematic already performs this exact arc** (its narration
runs coffee → tasks → dusk → piano → blacklight party → DJs → "a flash for the album" → bar →
flair → `cine_encore_end`: "And that's their day. Again tomorrow…"). This proposal makes that
movie **playable** — and almost entirely from machinery that already ships.

**Decisions locked (owner, 2026-07-16):**
- **Build the phone "messages" app** (§3) — greenlit.
- **Drop the phone `compass` app** to make room (one app dropped, not two) — it's unreliable (needs
  a device-orientation sensor that's usually absent, so it shows a dead/dim dial) and low-value; the
  messages app takes its slot.
- **Keep the phone `mail` app.** It's redundant only with the office computer's mail — but it works,
  and it's the one phone-native RSVP path for visitors who never open the office computer. Note
  mail (formal) and messages (casual texts) are *not* redundant with each other — a real phone has
  both. So the W3 RSVP-letter beat can point at either the phone mail or the office computer's mail;
  the balcony RSVP link remains the direct exit.

---

## 1. Diagnosis — where the spine breaks, in code

Act 1 is a five-link chain, each link gated and each handing off to the next (kitchen espresso via
`updateKitchenInvite()` + `#kitchen-*-arrow` step-arrows → garden watering `updateGardenHint()` →
cuddly octopus/blanket → office Prague-call `__pragueCalled` / PC `__pcPlayed` / lamps / stained
glass → balcony). First balcony entry fires `triggerBalconyFinale()` (butterfly, sun-shower,
rainbow, melody) and at **9100 ms** `showRsvpNudge()` paints the RSVP link — **and then every
directed nudge stops.** From here the game relies solely on the just-shipped `showExploration`
rotation ("Enjoy wandering — the balcony's the good part 🌅"), which is *passive by design*: it
only fires on room re-entry and never says "go **there** next."

**The six silent dead-spots (each gets a prescribed next-nudge below):**
1. **After `showRsvpNudge()` on the balcony** — the main cliff; no onward pointer at all.
2. **After the party ignites** (`__setPartyMode(true)`) — it runs (`advanceDance`, `announceDj`) but nothing names the bar, photobooth, or trips.
3. **Inside the bar** — you can watch Pouria / `__makeCocktail`, but nothing hands off to Flair-Catch or onward.
4. **Monitor desktop-OS** — once `__pcPlayed`, all 16 `DESKTOP_APPS` are live but only the generic "office is more toy than work 🖥️" caption mentions them.
5. **Pocket phone** — `phoneNotify()` buzzes every 19 s to get you to *open* it, but none of the 23 `PHONE_APPS` is ever pointed to.
6. **Night-sky piano** (`cuddly` `chan-stars` Satie Gnossienne bed) — zero nudge toward it.

The fix is **not a quest log** — it's restoring Act 1's handoff discipline (always a next nudge)
into Act 2, delivered *ambiently and diegetically* so it never reads as a checklist.

## 2. The second act — beat sheet

The emotional hinge is a **misdirection**: the game frames the balcony as an *exit* ("wrap up,
head out"), points you at what looks like the light switch to leave — and that switch
(`#balcony-partyswitch`, already wired to `__setPartyMode`) **erupts the loft into a blacklight
party** instead. *"I'm leaving"* becomes *"the party's starting."*

**BRIDGE — balcony, after the Act-1 finale settles**
- **B0. Make it night.** Once `balconyIntroSeen` and the RSVP nudge have had their moment, the rotation's first job nudges toward dusk (point at `balcony-sun` / `__toggleDayNight`). Guided or not, it always completes (`autoDayNight` flips after ~60 s — but see §4, we retime it).
- **B1. The held night-sky moment.** On `dusk`, a quiet contemplative caption — no arrows, no urgency. The dusk balcony already rewards a sky-tap with a shooting star (`balcony-skyclick → spawnShootingStar`), so the pause can invite a wish. The *breath* before the pivot.
- **B2. "Head out."** Framing turns to leaving: kill the lights, call it a night. The caption names **the switch, by the door** (not "the lights" — §4), with an `.invite-pulse` + step-arrow on `#balcony-partyswitch`.
- **B3. THE MISDIRECTION.** Reaching the switch → `__setPartyMode(true)` → `__setGardenParty(true,true)`: UV blacklight, violet LED flare, the view **whisks to the garden** (that whisk already exists, ~line 33523). Reveal: *that was never the light switch.*

**PARTY (the peak)**
- **P1. The bar, as a callback (FIRST in-party nudge).** `barUpNow() = party OR dusk`, so a player who lingered at dusk in B1 already glimpsed Pouria (`nightBarNow` / `kitchen_bar_night`). The party nudge leans on **"again"**: *"Pouria's mixing again — go get the drink you skipped this morning. 🍸"* Routes kitchen-ward (now party-true): watch him shake, drag him along the bar (`hint_barman`), tap the drink to read its recipe (`__makeCocktail`/`cocktail-toast`/`hint_drink`), and the onward handoff — **Flair-Catch** (`startFlairCatch`, auto-arms while `barUpNow() && currentStageName==="kitchen"`). Patrons kiss (`hint_patrons`).
- **P2. The floor.** Back to garden: the DJs (`announceDj` — Amir/Danesh trade every 3 dances), the dance rotation (`advanceDance`/`PARTY_DANCE_ORDER`), the disco ball. *"Amir's on the decks — Danesh takes it in a bit."*
- **P3. The album (flagship app-weave).** Nudge to the **photobooth** — it exists in *both* the monitor and the phone (`DESKTOP_APPS`/`PHONE_APPS`). The phone booth is the party-right one: `__openPhoneModal` opens in the current room ("no balcony jump"), shares the monitor compositor, and the strip persists to the phone **album**. *"Grab a strip for the album — there's a booth on your phone, and one on the office monitor. 📷"*
- **P4. The office joins in (optional, light).** `cine_officeparty` already exists ("the gold skull dances"). A soft line routes the curious into DOOM/mines/life/console — gates nothing.
- **P5. The trips door (optional, untracked, discreet).** `garden-drugsbox → triggerRsvpTrip`. Kept exactly as light as today — mentioned once at most, never arrowed. Optionally: under blacklight, give the drugsbox a faint uranium-green fluorescence (one CSS rule in the existing fluorescence block, beside the caterpillar/cat's-eyes) — *glows for those who look.* Broad audience (grandparents→kids) → opt-in only, never in the phone thread.

**WIND-DOWN → true ending**
- **W1. Piano under the stars.** Nudge to the cuddly nook + `chan-stars` Gnossienne. *"The party's easing off — someone's playing piano in the nook, under the stars. 🎹"*
- **W2. Full circle / dawn.** `autoDayNight` (or a sun nudge) brings morning back; echo `cine_encore_end`: *"Morning again. Same loft, same coffee. It does this every day. ☕"* — **no state wipe** (a soft dawn, not a reset; `resetHunt` stays the hard reset, gains a `__resetActTwo` hook).
- **W3. RSVP — the real exit.** The "leaving" framing from B2 now pays off honestly: *"You've seen the whole day now — bar, party, all of it. One thing left: tell us you'll come. ↓"* Routes to RSVP; can optionally surface it *through* the unread RSVP letter already in the mail inbox (`MAILS` has `{id:"rsvp", reply:true}` on both monitor and phone) — one last app-engagement. The loop-back to morning is **optional replay that never supersedes the exit**; RSVP stays the last word.

## 3. Guidance — the "always a next nudge" workflow, kept ambient

The owner's two asks ("MORE nudges / continuous workflow" and "keep it light / no checklist") are
reconciled by making guidance **abundant but ambient and diegetic**. Four layers; only one is new:

| Layer | Scope | Status |
|---|---|---|
| **Caption nudges** (`setCaption`/`showExploration`/`__nextExploreHint`) | current room | exists |
| **Phone "messages" thread** — in-character texts from friends/family/Pouria | cross-room handoffs + app discovery | **new (light)** |
| **`.invite-pulse` + step-arrows** | precise single target (the switch) | reuse |
| **`phoneNotify()` buzz** | draws you to the phone in the first place | exists |

**Division of labor (this is the crux of "more nudges but light"):**
- **Exploration captions** own the *within-room* "what else is alive here" — unchanged.
- **Phone texts** own the *between-beat, cross-room* handoffs and *app discovery* — the thing a
  caption structurally can't do (a caption can't say "go to the garden" because it only shows once
  you're already somewhere).

They never collide: captions answer "what's in *this* room," texts answer "where next." A passive
player follows the texts like breadcrumbs; a curious player ignores them and the captions still
reward wandering. This *is* the "always a next nudge" workflow, without a tracked panel.

**The phone as soft quest-giver (the one substantial new surface).** A small **"messages" phone
app** — a scrollable thread of short in-character texts that arrive timed to beats (Pouria, the
group chat, the photobooth/album, M&B). Each is a diegetic nudge to a room/app/beat. It's exactly
the kind of thing that **grows per drop** (future drops add texts, tie one more app into a beat),
fitting the frozen-archive/drops cadence.

*Lighter fallback if a new app is too much for now:* skip the messages app and surface the beat
nudges as balcony **captions only** via the existing buzz — weaker (loses cross-room reach + the
charm of named friends) but zero new surface. Recommendation: build the messages app; it's the
highest-leverage light-touch mechanism for the continuous workflow the owner wants.

**App touchpoints (5, the ceiling — more turns the evening into a tour):** phone `cocktails` (bar
menu, P1) · phone `photobooth`→`album` (P3) · monitor `music` visualizer (a garden line: the office
is dancing too) · monitor/phone `mail` (the RSVP letter, W3) · monitor/phone `calendar` (the dawn
joke — tomorrow's on it, and so are May 1 / July 10). Everything else (doom, mines, linux, python,
tattoo, dress-up, places…) stays a pure discovery.

## 4. The switch misdirection — interaction wiring

Two hazards, both confirmed in code:

**Hazard A — players click the *lamp*, not the *switch*.** Told "turn off the lights," the obvious
targets are `#balcony-lights` (string lights) and `#balcony-walllamp` (wall lamp) — both
`hunt-hit`. Only `#balcony-partyswitch` ignites the party. So:
- **Word the instruction at the switch** — name it + its location ("the switch on the wall, by the door"), never just "the lights."
- **Point at it** — reuse the kitchen's `.invite-pulse` + `~ arrow` pattern: `.invite-pulse` on `#balcony-partyswitch` + a sibling `#balcony-partyswitch-arrow` `<g>` shown by a `~` rule (copy `#kitchen-shotcup.invite-pulse ~ #kitchen-shotcup-arrow`). One arrow, one pulse.
- **Redirect the mis-click, don't dead-end it** — a small handler on the lamp/lights, active during B2: a one-line redirect caption + re-flare the switch arrow. No penalty, just a wink and a re-point. (Neither lamp has a dedicated toggle handler today — the wall lamp is driven only by `toggleDusk` — so this is a clean additive listener.)

**Hazard B — the auto-cycle.** `autoDayNight` could flip back to day mid-beat. B1 should call
`__stopAutoDayNight()` so the night-sky pause and switch moment aren't yanked to daylight.
**Instructed day/night (owner's "maybe"): recommend making sundown a player action but keeping a
slow fallback** — the current auto is *eager* (~60 s) and fires before B0's nudge lands; retime it
so starting the arc suppresses auto, and if B0 idles ~3 min the sun sets itself once (with a
Pouria follow-up acknowledging it). Agency first; passive players still reach the evening.
*Trade-off:* the balcony loses unattended ambient day/night breathing.

## 5. Draft copy (EN — CS mirrored later by Markéta)

**Captions (narrator-voiced):**
- B0 (nudge to night): *"The day's done — but the sky isn't. Tap the sun, watch it go. 🌇"*
- B1 (held moment, no arrow): *"There. The whole sky comes out. Stay a minute — wish on something. ✨"*
- B2 (switch arrow + pulse): *"Time to head out. Kill the lights — the switch is on the wall, by the door."*
- B2-redirect (mis-click on lamp): *"Not the lamp — the little switch by the door. 👉"*
- B3 (eruption): *"…that was never the light switch. 🎉 Surprise — the loft doesn't do quiet nights."*
- P1 (bar callback): *"Pouria's back behind the bar — go get the drink you skipped this morning. 🍸"*
- P1-onward (Flair-Catch): *"He's showing off now — catch the garnishes he flips. Mind the wasp. 🍋"*
- P2 (floor): *"Amir's on the decks — Danesh takes over in a bit. The garden's dancing. 💃"*
- P3 (album): *"Grab a strip for the album — there's a booth on your phone, and one on the office monitor. 📷"*
- P5 (trips door, party-only rotation): *"Something small glows under the blacklight. For the adventurous — enjoy responsibly. 🙃"*
- W1 (piano): *"The party's easing off — someone's playing piano in the nook, under the stars. 🎹"*
- W2 (full circle): *"Morning again. Same loft, same coffee. It does this every day. ☕"*
- W3 (true exit): *"You've seen the whole day now — bar, party, all of it. One thing left: tell us you'll come. ↓"*

**Phone messages (soft quest-giver, timed to beats):**
- **Pouria** · bar's open again 🍸 get down here
- **the group chat** · you dancing or what?? 💃
- **📷 album** · new photo added — grab a strip while you're up
- **markéta & behdad** · did you RSVP yet? 😉 no pressure. (some pressure.)

*(Tone check vs. shipped copy — `kitchen_bar`, `explore_balcony`, `cine_encore_end` — warm,
em-dashes, one emoji, dry-literary. Drafts sit in that register.)*

## 6. Reuse vs. new machinery (kept minimal)

**Reused wholesale:** `__setPartyMode`/`__setGardenParty` (party); `barUpNow`/`kitchen-bartender`/
`__makeCocktail`/`startFlairCatch`/`hint_barman·drink·patrons` (bar); `advanceDance`/`announceDj`/
`garden-disco-ball` (floor); `chan-stars`/`skyOnScreen` (piano); `autoDayNight`/`__toggleDayNight`
(day-cycle); `showRsvpNudge` + mail apps (ending); `.invite-pulse` + `~ arrow` (targeting);
`phoneNotify` + `PHONE_APPS` (phone); `showExploration`/`explorePool` rel/done/sentinel; `resetHunt`
hooks; EN/CS `T`.

**Genuinely new (small, bounded):**
1. **Beat-sequencer** — one small IIFE / `actBeat` state machine advancing B0→B3→P1→…→W3, deciding
   which nudge/text/arrow is live, advanced by ~6 one-line pings at existing sites (`toggleDusk`,
   the cocktail-built toast, `setGardenParty`, `announceDj` first swap, photobooth open, the
   stars-phrase timer). Respects `window.__cinematic` (don't fire beats during "Watch the loft");
   resets with the extinguisher.
2. **Phone "messages" app** — the one substantial new surface (a thread + `T`-keyed texts). Or the
   caption-only fallback for slice 1.
3. **Explore-pool injection** — extend `explorePool()` to consult the beat-sequencer (~10 lines,
   same shape as the balcony `rsvp_nudge` sentinel).
4. **`#balcony-partyswitch-arrow` `<g>` + CSS `~` rule + lamp-redirect listener.**
5. **New `T` keys** (B0–W3 captions, `rsvp_exit`, dawn one-shot) + **drugsbox UV CSS rule**.
6. Infra: `check.js` enforces EN/CS parity automatically; `play.js` grows an act-two chain
   (dusk → cocktail → party → photobooth → stars → exit), same style as its Act-1 `solve()`.

## 7. Phased sketch — smallest first slice, then deferrals

- **Phase 1 (the hinge — ship first; it's the whole point):** B0→B3 only. The night-sky pause, the
  "head out" instruction with switch arrow + lamp redirect, and the party eruption. ~1 arrow, ~6
  caption keys, one small listener, and the sequencer for just those four beats. Reuses
  `__setPartyMode` wholesale. **This alone converts the balcony cliff into a payoff** and delivers
  the emotional hinge.
- **Phase 2 (the party spine):** P1 bar-callback + Flair-Catch handoff, P2 floor, P3 photobooth,
  W1 piano, W2 full-circle, W3 RSVP-as-true-exit — pure caption/text routing over existing systems,
  no new surfaces. The arc is now complete end-to-end for a passive player, via captions only.
- **Phase 3 (the soft quest-giver):** the phone **messages** app + wiring texts to beats — where
  "more phone engagement" and the growable-per-drop model land.
- **Deferrable to later drops:** P5 trips-door polish, P4 office-joins-in, growing the messages
  thread (future characters text — e.g. Irene's cameo), RSVP-through-the-notes-app ("write us a
  little note"), party-framed polaroid auto-styling, dawn-flourish polish.

## 8. Open questions for the owner

1. **Night-sky pause (B1) length** — a true contemplative silence risks a passive player thinking
   the game ended. Fixed ~8–12 s dwell before B2 appears, or gate B2 on the player doing *anything*
   (a sky-tap / a wish)? Which feels right?
2. **Party gating** — keep the switch/ball-peek/mask-dblclick always-available (recommended; the
   sequencer skips completed beats), so the *guided* first ignition feels special but the switch
   keeps working forever? OK that a returning player already knows the trick?
3. **Switch-arrow explicitness** — a blinking arrow makes the misdirection land reliably but
   slightly telegraphs "this matters." Arrow (reliable) vs. worded nudge only (more surprising,
   more mis-clicks)?
4. **Messages app vs. caption-only fallback** — build the new phone app, or ship captions-only for
   now? If built, **named** friends/family (charming but names are personal — Pouria, Amir,
   Danesh, M&B) or generic ("the group chat," "a friend")?
5. **RSVP-through-the-inbox (W3)** — route the true ending *through* opening mail + hitting reply
   (deep, ties in the mail app) or keep the direct `showRsvpNudge` link primary and only *mention*
   the inbox? Former is more engaging but adds a step to the most important action on the site.
6. **Auto day/night** — fully retire the eager 60 s auto for instructed-with-3-min-fallback, or
   keep auto for a visitor who idles at the balcony?
7. **Trips discretion** — glow + one rotation line the right volume, or should Pouria also slide a
   coaster hint (one surface too many for the grandparent audience)?
8. **Persistence** — beats per-session (like `exploreSeen`, recommended for a ~10-min experience)
   or localStorage? And **photobooth completion** on booth-open (recommended — camera permission
   may be declined) or on shutter?

---

*The film ends with "And that's their day. Again tomorrow…" — the game already knows its shape.
This hands that shape to the player: coffee to stars, the party as the peak, the piano as the
exhale, the RSVP as the last word — and tomorrow, if they want it, one tap of the sun away.*
