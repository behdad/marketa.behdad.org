# The Loft Game Manual

Loft Day is a point-and-click visit to ten connected rooms. Follow the story for direction or linger
over the optional games, music, guests, messages, and odd details. No adventure-game experience is
required.

## Contents

- [Start here](#start-here)
- [Finding your way](#finding-your-way)
- [How the day unfolds](#how-the-day-unfolds)
- [Captions, coaches, and messages](#captions-coaches-and-messages)
- [Pointer and mobile controls](#pointer-and-mobile-controls)
- [Keyboard navigation](#keyboard-navigation)
- [Road Trip and Camping](#road-trip-and-camping)
- [Saves and browser notes](#saves-and-browser-notes)

## Start here

Select **CLICK ME**. The opening coach points out the top room navigation and bottom caption; dismiss
each step with its visible ×. Follow the caption when you want direction. The required path is short,
and most objects, games, apps, conversations, and surprises are optional.

## Finding your way

The top dots select the five main rooms, the side arrows move between them, and the up/down control
changes floors once a downstairs route has been found. Every main room has a paired lower room:

| Main floor | Lower floor |
| --- | --- |
| Kitchen / Bar | Bathroom |
| Garden / Party | Dungeon |
| Cuddly-puddly | Cinema |
| Office | Bedroom |
| Balcony | Entrance |

Each main room contains a route downstairs; finding any one opens lower-floor navigation for the
rest of the run. Before that, deliberately double-click or double-tap the floor control to open the
current room's lower neighbour.

The window-grid button opens **The Loft**, a ten-room map: clear cards are visited and blurred cards
are waiting. Before the Party, a locked card needs a deliberate double-click or double-tap; after the
Party begins, one selection unlocks and opens it. The first navigation coach leaves these controls
live while waiting to be dismissed.

During a Road Trip or Camping, Entrance represents the live scene. Opening the map during a drive
pauses it; choosing Entrance returns to the paused dashboard, which you resume yourself.

## How the day unfolds

### Morning routine

The caption leads through Kitchen, Garden, Cuddly-puddly, Office, and Balcony. Each room remembers
where its short action chain stopped. Completing Balcony ends the clue trail and opens free
exploration.

### Party

Start the Party in the Garden, then visit all ten rooms. Introductions and the map keep count;
visiting is enough, and lower-room games remain optional. Guests stay active while you explore. Tap
the DJ for song requests without losing the booth's scratch reaction.

A coach eventually points to the Garden wall switch. Use it to end the Party, dismiss it and keep
dancing, or leave the Party running while you explore. After the Party has started and all ten rooms
are visited, Behdad and Markéta’s message exchange offers **Let’s go!**, which winds down the Party
and takes you to Entrance. Selecting the Entrance road after the same milestone is the fallback.

### Road Trip

The Entrance car allows local driving at any time. The longer journey follows the milestone above:
finish or dismiss the first-drive coach, choose a **Road Trip** starting point, and take the final
road's Camping turnoff for the fire, dinner, stargazing, sleep, and `~ fin ~`.

## Captions, coaches, and messages

The bottom caption carries the Morning clue trail, later feedback, and progression help. Brief
feedback yields to important story or outcome text, then returns to the latest instruction rather
than replaying an old line.

Coaches explain easy-to-miss controls. Their × dismisses the lesson, not its activity. The Party
handoff coach allows navigation but holds new notifications and calls until it leaves. Opening a
message never performs its suggested activity: use the separate activity arrow. Old messages remain
readable even when their activity has expired.

If you are unsure what comes next:

1. Read the bottom caption.
2. Open **The Loft** and look for a blurred room.
3. Check Messages for an activity arrow.
4. If the Party has started and all ten rooms are clear, visit the Entrance road.

## Pointer and mobile controls

- Click or tap an object to use it. Some objects can be dragged; a short tap still performs their
  ordinary action.
- Right-click opens local actions. On touch, press and hold without moving.
- Double-click or double-tap only for deliberate early unlocks in the map or floor control; ordinary
  actions need one selection.
- Use × or Back to close a layer. From an idle lower room, use Up to return to its main room.
- On a narrow phone, landscape orientation gives the scenes and overlays more room.
- Phone and tablet apps leave text fields unfocused; tap the exact field to type.
- Phone Mines fills the space above its bottom toolbar. Tap a cell to reveal it, press and hold to
  flag it, and use `↻` to restart. The ring count and timer remain in that toolbar.
- In the car, starting the engine reveals touch steering and accelerator/brake sliders. The centre
  of the pedal slider holds speed; its outer zones accelerate or brake.

## Keyboard navigation

Keyboard commands are global unless a field, game, device, or dashboard owns the same key. Outside
a typing field, `?` opens the complete shortcut card.

### Rooms and layers

- `←` / `→`: move to an adjacent room. At a locked right-hand frontier, press `→` twice deliberately
  to open the next room.
- `↓`: enter the paired lower room. Before any downstairs route is known, press it twice deliberately
  to open the lower floor.
- `↑`: return from a lower room.
- `1`–`5`: jump to Kitchen through Balcony.
- `6`–`0`: jump to Bathroom through Entrance.
- `Tab`: open or close **The Loft** room map. Its arrow-key selection follows the room layout;
  `Enter` opens the selected room. A locked room takes two quick `Enter` presses before the Party and
  one after it begins.
- `Escape` / `Backspace`: dismiss the current activity or layer. On an active Road Trip, the first
  press pauses and the second exits. In a search field, Backspace only edits the query and stays put
  even when it is empty; use Escape to leave. In an idle lower room both keys stay put; use `↑`.

### Actions and tools

- `Enter`: perform the next guided action. After the Morning routine it uses the room's main
  activity: the daytime Kitchen repeats the espresso steps, the visible Bar starts Flair Catch,
  and the Garden / Party toggles the party.
- `Space`: play, pause, or act in the current game or media surface. While driving, it sets cruise
  control to the current speed; pressing it again resets the held speed rather than cancelling it.
- `C`: open or close the phone.
- `/`: open or close Messages.
- `M`: open the Office monitor.
- `L`: open or close the Office laptop.
- `` ` ``: open or close the drop-down console.
- `D`: toggle day and night.
- `?`: open or close the complete keyboard-shortcut card outside a typing field.
- `F`: toggle browser fullscreen.

An open, idle Office laptop alternates the crossed-caps and sleeping-couple screensavers in a
shuffled starting order until activity wakes it. Its unmarked top-left bezel corner starts or
advances the reel, like the matching monitor control.

The JavaScript console, Code, and Python share the typed `loft` scripting API. JavaScript preloads
it. Use `loft.help()` for top-level objects, drill down with `loft.help(loft.weather)`, list the
catalogue with `loft.api.capabilities()`, and read its revision with `loft.api.info()`.

Controls use explicit reads and writes such as `loft.party.status()` and
`loft.party.set(true)`. Weather controls accept `set(null)` to restore automatic ownership and
include `mode: "auto"|"on"|"off"` in `status()`. The room API covers all ten rooms (`loft.bar`
aliases Kitchen; `loft.party` aliases Garden). Use `await loft.room.go("garden")` for navigation;
an explicitly invoked physical room action brings its required room or interactive surface into
view before it runs. Scripts may enter any room or start Road Trip outside story progression, but
conflicting, controller, and prerequisite gates remain real. Use
`loft.api.describe(...)` or typed help to see the current reason and, when one direct API step can
honestly enable it, a structured remedy. Use `await loft.caption.show("hello")` for a literal caption.

Preview another date or clock time with `loft.calendar.date.set("2027-05-01")` and
`loft.calendar.time.set({hours: 18, minutes: 0})`; the matching `.reset()` actions restore the real
calendar and clock. Block Party is the `"block-party"` choice for `loft.minigame.start(...)`.

Code lists the unsaved buffer first, then default and user files by basename. Unsaved and untouched
defaults are italic; overridden defaults and user files are upright. Tooltips—not icons or colors—
identify ownership. Editing a default stores a local override; right-click its edited filename to
reset only that local edit, or use its Reset control to restore the public file. After confirmation,
the sidebar's **Reset files…** clears all saved files, default overrides, and the draft, then restores
the default list plus a blank unsaved buffer. This affects Code files, not the game checkpoint.
Fixed line numbers stay beside the editor; long lines scroll instead of wrap.

The canonical `trailer.js` loads only when played, and Watch Trailer and Code both use its local
override. Use `await loft.trailer.play()`, `loft.trailer.status()`, and
`await loft.trailer.stop("restore")` to interrupt and restore the active visit. Normal Trailer
completion returns to Welcome back when a resumable save exists, or to CLICK ME otherwise; scripts
can request that same entry surface with `await loft.trailer.stop("entry")`. For apps,
`loft.app.close(...)` preserves a session while
`loft.app.kill(...)` resets it.

### Fast-forward shortcuts

- `Shift` + `P`: unlock and start the Party.
- `Shift` + `R`: mark every room visited, wind down the Party, and go to the Entrance ready for
  Road Trip.

Plain `P` and `R` do nothing globally. Start over remains available from the visible reset control
and `loft.game.reset(...)`.

### Python scripting

The Office Python Console imports `loft` while it boots, so Python files in Code can use it
immediately:

```python
import loft

status = loft.game.status()
loft.party.set(True)
loft.weather.rain.set(None)  # release the override to automatic weather
await loft.room.go("garden") # wait for a finite action to finish
```

Queries return ordinary Python values. Actions start when called and may be awaited; failures raise
`loft.LoftError`; availability failures expose `.reason` and an optional `.remedy`. Use `None`, not
`"auto"`, to restore automatic environment control. `loft.help()` and
`loft.help(loft.weather)` browse Loft; normal Python `help(str)` remains unchanged.

### Driving

- `Enter`: start the engine when it is off.
- `←` / `→`: steer.
- `↑`: accelerate; `↓`: brake and cancel cruise control.
- `Space`: set or reset cruise control at the current speed.
- `Shift` + `↑` / `↓`: change gear or move the automatic selector toward P/D.
On a Road Trip, `Enter` toggles pause/resume; `Space`, steering, or a pedal also resumes. Escape or
Backspace pauses first and exits on the next press. Fields, open devices, and Camping activities
keep their keys. The coach adapts to the transmission and input device; during its automatic lesson,
finish the current step before another selector or driving input can act.

## Road Trip and Camping

Street laps are optional and do not unlock the journey. After starting the Party and visiting all
ten rooms, finish or dismiss the car coach and choose **Road Trip**. A route starts stopped on the
shoulder and keeps the selected transmission.

Routes progress west through Calgary, Banff, and Abraham Lake; choose a later segment for a shorter
drive. The three-part HUD ribbon tracks the legs and hatches skipped ones. On the Abraham Lake leg,
a missed Camping turnoff returns after 30 seconds of desktop travel or 20 seconds on mobile.

Unfocusing pauses the highway. Reloading while it is visible restores that view paused; leaving
Entrance instead offers **Continue**, **New**, or, once reached, **Camping**.

At Camping, follow the caption through fire, stew, stargazing, and sleep. Stew burns after 45
seconds of counted cooking; Markéta’s open notebook pauses that clock. The fire stays lit until the
sleep prompt. The finale reports time spent in the loft and offers to share it in the RSVP.

## Saves and browser notes

Checkpointing begins after Kitchen is solved or deliberately left. **Continue** restores room and
floor, story progress, durable discoveries, Album, and Messages. Games, calls, cameras, and media
return stopped; an interrupted highway returns paused.

The finale clock counts only while the started game is visible, focused, and not paused, and carries
across Continue. Game **Start over** clears the checkpoint and clock and returns the car to automatic
in park; it is separate from Code's **Reset files…**.

The roughly 100-second **Trailer** is separate from the checkpoint and clock. Its reversible Office
beat waits for the real Python prompt before giving that runtime the monitor's full themed Kill.
Trailer scenes never solve or reward the player's game.

- English and Czech are available, and the choice persists when storage is allowed.
- Reduced-motion preferences simplify animation without removing activities.
- Camera, torch, sharing, fullscreen, installation, and some computer toys need browser support or
  permission; denying them does not block the story.
- Python and its starter tools are local. A first import of another supported package needs a
  connection for the matching pinned build.
- If audio is silent, interact with the page once so the browser can enable sound.

The simplest path is also the whole shape of the day: finish the Morning routine, start the Party,
visit all ten rooms, then take the Road Trip.
