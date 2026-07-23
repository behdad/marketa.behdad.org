# The Loft Game Manual

This manual describes the current `loft-day` wedding game. The game is a
single-page, illustrated visit to The Loft, with five connected rooms, small
puzzles, phone and computer apps, a party, and many optional details.

The first playthrough does not require a keyboard, a command console, or prior
knowledge of adventure games. Follow the instruction line, click objects that
look useful, and keep wandering.

When a saved session is available, the opening screen asks whether to continue
or start over. Gameplay shortcuts remain disabled until that choice is made;
use the buttons, arrow keys, `Enter`, or `Space` to choose. Trailer and Autoplay
remain hidden until the recovery choice is complete. **Start over** acts
immediately because the recovery choice itself is the confirmation; the in-game
Restart control still asks before discarding active progress.

## Quick start

1. Click or tap the game once to begin. In installed-app or game-only mode, this
   first interaction may also enter fullscreen.
2. Follow the instruction line above the scene. It is the authoritative current
   hint.
3. Solve the highlighted activity in each room. The right room arrow unlocks as
   you make progress.
4. Completing the first trip through the loft starts phase 2. Every room is then
   unlocked, Messages become active, and the party and other free-play systems
   become available.
5. Keep exploring after the party. Ending the party does not end the game.

The five rooms are:

- **Kitchen/bar**
- **Garden/party**
- **Cuddly-puddly**
- **Office**
- **Balcony**

Use the arrows at the sides of the scene or the five dots below it to change
rooms. On mobile, use these controls rather than swiping across the scene.

## Trailer

**Trailer** plays a fixed, roughly one-minute preview of all five rooms. It is an
atmospheric cut rather than a solution walkthrough: it shows small reactive details,
the loft's real music, and a brief glimpse of the garden filling with guests, while
leaving puzzle order, apps, formal party moments, and the balcony finale undisclosed.

The ghost cursor identifies the few objects the reel touches. Room navigation and
Restart are hidden during playback so they cannot interrupt a shot; fullscreen,
volume, and **Take over** remain available. Taking over stops the reel immediately
and leaves the current room ready to explore. Moving the tab into the background also
ends the reel rather than letting its timing drift. With reduced motion enabled, the
same five-room arc becomes a shorter sequence of still tableaux.

## How the game is organized

### Phase 1: the room trail

Phase 1 is intentionally quiet. It introduces one room activity at a time and
holds phone messages so they do not distract from the room trail. The instruction
line changes as each step is completed.

The forward room remains locked until the current activity is solved. Players
who do not want to solve a step can double-click or double-tap its locked room
dot to unlock through that room and jump there.

### Phase 2: the loft opens up

Starting the party marks phase 2 as reached. From that point onward:

- all five rooms remain unlocked;
- phone messages and their actions become available;
- guests can arrive and move between rooms;
- the party, BBQ, formal moments, calls, music, apps, and minigames can overlap;
- the phone and computers remain usable during and after the party.

Some delayed messages may arrive soon after phase 2 begins. They are released as
normal notifications rather than all taking over the scene at once.

## Controls

### Mouse and touch

- Click or tap objects in the room to interact with them.
- Use the side arrows or room dots to navigate.
- Use the lower media control to pause or resume the current foreground music.
- Right-click supported objects for a context menu.
- On a touch screen, a two-finger tap provides the general context-menu gesture.
- In Messages, press and hold one message with one finger for message actions.
- Drag only objects that visibly respond to dragging, such as garden water
  bottles.

There is currently no room-swipe gesture. The scene contains many small
interactive objects, so room swipes would compete with taps and drags.

### Back, Escape, and fullscreen

`Escape` and `Backspace` normally go back one level: from a detail to its app,
from an app to the desktop, or from a zoomed computer to the room. When typing,
the first `Escape` generally removes focus and preserves an unsent draft rather
than closing the whole app.

When a scene opens a phone app directly, `Escape` or `Backspace` closes the phone
instead of exposing its launcher. This applies to Aspen's post-shutter Album, the
magic-box Calendar clue, and the scene date/time pills.

Monitor and laptop zoom snaps between the room and screen. Animating the large
scaled scene caused white repaint flicker in Chrome even when the room otherwise
held 60 FPS, so device zoom deliberately does not glide. Room navigation still
animates normally. Monitor app icons only show hover feedback once the monitor is
zoomed, matching when a click can launch the app.

Triple-click or triple-tap the ceramic mask in the garden to open the drop-down
console on a device without a hardware keyboard. This permanently reveals the
console's top-left open/close button for the rest of the page visit. The console
shows the current rendered FPS. Double-clicking the mask does not start or stop
the party.

`F` toggles fullscreen, except when the Video app owns that key for its player. If
opening an external tab causes the browser to leave fullscreen, the first click
after returning to the game restores fullscreen. An intentional fullscreen exit
is not immediately undone. The phone is preserved across fullscreen changes and
deliberate external-link clicks. Use `Backspace` instead of `Escape` when you want
to go back without also invoking the browser's fullscreen-exit behavior.

### Keyboard shortcut reference

Press `?` in the game for the live shortcut overlay. Current global shortcuts are:

| Key | Action |
| --- | --- |
| `?` | Show or hide keyboard help |
| `Left` / `Right` | Previous or next room |
| `1` through `5` | Go directly to a room, unlocking through it if needed |
| `Enter` | Perform the current room's main action |
| `Escape` / `Backspace` | Back, close, or remove text focus |
| `M` | Open or close the main computer monitor |
| `L` | Open or close the laptop |
| `C` | Open or close the phone |
| `/` | Open Messages; inside searchable apps, focus search when appropriate |
| `W` | Show or hide Who's here during phase 2 |
| `F` | Toggle fullscreen |
| `Space` | Play or pause foreground audio |
| `N` | Play the next applicable song or music selection |
| `G` | Show the next phone hint |
| `Tab` | Send a random, context-appropriate test message |
| `A` | Toggle autoplay |
| `D` | Toggle day and night |
| `Up` / `Down` | Set day or night |
| `Shift+Left` / `Shift+Right` | Previous or next significant calendar day |
| `Shift+Up` / `Shift+Down` | Move the game clock by 30 minutes |
| `P` | Toggle the party |
| `U` | Toggle ultraviolet party lighting |
| `S` | Cycle the season |
| `T` | Start the next magic-box trip |
| `Shift+1` through `Shift+7` | Select a particular magic-box trip |
| `K` | Repeat the cat activity |
| `R` | Reset the game after confirmation |
| `` ` `` | Show or hide the dropdown JavaScript console |

Keyboard shortcuts are primarily a testing and power-user layer. They are not
required for normal play. While a text field is active, ordinary typing keys are
reserved for that field.

### Autoplay watch mode

Autoplay is the persistent watch mode beside Trailer. It takes over from the room
and progress already on screen, then composes an ongoing show from short authored
stories: coffee and bar rituals, live music, guests and wedding moments, projector
and toy scenes, calls, computer and phone apps, photos, weather, the BBQ, and a few
relays that travel through several rooms. Its choices vary while actively avoiding
recent repeats and returning to rooms that have been away too long.

Incoming phone messages and calls can interrupt a story. Autoplay handles the
notification, follows its action, and resumes the interrupted sequence. It pauses
without advancing while the tab is hidden or unfocused and uses a calmer motion
profile when reduced motion is requested.

Stray clicks and keys do not stop a kiosk show. Use **Take over** to return control
temporarily; after a quiet interval the kiosk resumes. Press `A` or run
`autoplay(false)` in the console to stop it deliberately. Opening the game with
`?autoplay` starts the same persistent mode after initialization.
If a saved-session choice is waiting, URL autoplay begins only after Continue or
Start over resolves that screen.

## Room guide

This section first describes each room without giving away its main solution.
Exact solutions follow in the clearly marked spoiler section.

### Kitchen/bar

The espresso station is the first guided activity. Later, the same room becomes
the bar, with Pouria, cocktail tools, a cocktail menu, and the Flair-Catch
minigame. The unnamed seated regulars belong to the calm night bar; the active
party bar instead uses the named guests who rotate through the room. The
kitchen/bar also contains personal details, props, and small repeat interactions
that are not required for progression.

### Garden/party

The garden activity combines plants, music, and candlelight. In phase 2 this room
becomes the main party room. Its wall switch changes meaning after the party has
been unlocked: in phase 1 it changes day and night; in phase 2 it changes between
day and party. As a hidden alternative, three rapid taps on the mirror start the
party and three rapid taps on the active DJ end it. A single DJ tap opens the
song picker, which appears to the left of the booth; a double-click skips to the
next song.

The guitar always toggles **Tumbalalaika**, sung by Markéta Jakešová. The ukulele
alternates between **I Need You** by Dan Bern and **Strange & Beautiful Things**
by Orit Shimoni.

### Cuddly-puddly

Cuddly-puddly contains soft furnishings, Octi, a balcony door, children's play,
and a projector. After its guided activity, the projector can cycle among several
visual programs. It can temporarily take ownership of the foreground media
controls and lower the party music.

### Office

The office contains the laptop, the main computer monitor, lamps, the Prague and
Lübeck call experience, a stained-glass detail, and the hidden Invaders minigame.
The computer is also the main home of the game's larger apps and pro tools.

At room scale, the first click on a monitor or laptop zooms it. A second click
interacts with its screen. This prevents an accidental click-through while the
camera is moving.

### Balcony

The balcony contains the smoker and grill, weather and sky interactions, the
day/night celestial control, smoking-area details, and the main BBQ activity.
Double-click the sun or moon for the matching eclipse effect; a single click
changes day or night.

## Puzzle solutions

> **Spoilers:** The following steps reveal the full phase 1 room trail.

### Kitchen/bar solution

1. Turn on the espresso machine and allow it to warm up.
2. Use the grinder.
3. Tamp the grounds.
4. Attach the portafilter and brew.
5. Drink the espresso.

After the first successful coffee, spent grounds and the knock box become part of
a repeatable coffee loop. They are not required for the initial solve.

### Garden/party solution

1. Water any plant with a bottle.
2. Start the guitar music.
3. Light both candles.

### Cuddly-puddly solution

1. Play with Octi.
2. Open the balcony door.
3. Pull back any blanket.

### Office solution

1. Use the laptop to call Prague.
2. Wait for the call to connect, then hang up.
3. Boot and play with the main monitor.
4. Dismiss the monitor zoom.
5. Turn off the room lamp and then the pendant light.
6. Click the stained-glass butterfly.

### Balcony solution

Reaching the balcony completes the main guided traversal. Its finale leads into
the phone and party arc. Once the party starts, phase 2 remains unlocked even
after the party is later stopped.

## Phone

The phone can be opened from the scene, with `C`, or with the supported scripting
API. On its first ordinary opening it presents a small math lock. Three failed
answers unlock it automatically. The lock also has an accessible context-menu
shortcut.

The phone has Home, Back, and Recents controls. App icons can be rearranged by
dragging. Most app and navigation state lasts for the current browser session;
the full game reset restores the initial layout.

The current phone apps are:

| App | What it contains |
| --- | --- |
| **Call** | Calls to Tehran, California, Prague, and Lübeck; Madla is an incoming-call contact available only in phase 2 while the party is off |
| **Messages** | Wedding crew thread, search, unread filter, composer, replies, reactions, and explicit message actions |
| **Mail** | Authored inbox messages plus compose and reply through the device's email client |
| **Calendar** | Wedding events, calendar export, Google Calendar links, date/time controls, and search |
| **Album** | Session photos plus Aspen and photobooth captures; search, grid, delete, and share controls |
| **Photobooth** | Camera capture, filters, and frames, subject to browser camera permission |
| **Music** | The shared three-song loft catalog |
| **News** | A compact Hacker News reader |
| **Weather** | Edmonton and Prague current conditions and three-day forecasts |
| **Clock** | City clocks, event countdowns, play time, and game-time controls |
| **Calculator** | A standard calculator |
| **Currency** | Currency conversion |
| **Notes** | Authored notes and a local draft/composition surface |
| **Cards** | An English/Czech phrase-card set |
| **Flashlight** | Screen light and, when supported and permitted, the camera torch |
| **Browser** | A small fixed set of loft, Markéta, Behdad, and HarfBuzz pages |
| **Cocktails** | Drink recipes used by the bar |
| **Dress-up** | A playful outfit activity |
| **Mines** | A compact Minesweeper game |
| **Quiz** | A small quiz |

### Notifications and the message badge

A notification click always opens Messages and centers the exact message. It does
not perform the message's scene action. To start an action, open the message and
use its visible action control.

The unread badge is red and shows a count. After messages are read, it remains as
a quieter blue Messages launcher so the thread is still easy to reopen.

## Main computer

The main monitor desktop contains these app tiles:

- Browser
- Music
- Photobooth
- Video
- Call
- Chat
- Mail
- Calendar
- Tattoo
- Mines
- Life
- Doom
- Editor
- Console
- Python
- Linux

While **Doom**, **Console**, **Python**, or **Linux** is open, right-click the
app and choose **Kill** to terminate it with a gag display instead of closing it
silently.

Weather does not occupy a desktop tile. Click the Edmonton weather item in the
computer's menu bar to open it.

Typing an app name while the desktop or screensaver is visible opens an
autocomplete search bar. `Enter` or `Tab` accepts the suggestion; `Escape` clears
it. Search recognizes localized app labels where a translation exists. In apps
with their own search field, `/` focuses that field when it will not overwrite an
active draft.

`Escape` or `Backspace` follows app hierarchy. For example, Tattoo detail returns
to the tattoo gallery, and an open Mail message returns to the inbox, before the
app itself closes.

The Tattoo detail view includes the design, artist portrait, and the artist's
name and relationship. The gallery stays compact. The Album and Photobooth share
captured photo metadata, while live camera pixels remain local to the browser.

### Computer-only environments

The monitor includes a JavaScript Console, a Python environment, and a Linux-like
command environment. These are optional toys for technically curious players.
The Python and Linux apps use browser-hosted, pinned runtimes rather than a shell
on the visitor's device. HarfBuzz and font-tool demonstrations are included.

On iOS and some WebKit versions, canvas, video, live-camera, or embedded-frame
monitor apps can appear blank because of platform rendering restrictions. The
rest of the game remains usable.

## Messages and crew replies

Messages are held until phase 2. The thread is chronological, with search and the
unread-only filter kept at the top and the composer at the bottom. The composer
receives focus when Messages opens. Press `Escape` to leave the composer; press
`/` while it is empty to focus message search.

Right-click a message, or long-press it on touch, to:

- reply;
- copy its text;
- mark it read or unread;
- add a reaction.

A reply can quote an earlier message. Tapping the quote finds the original.

Messages may include scene actions such as starting a party moment, visiting a
room, or beginning an activity. These actions never run just because a
notification or message is opened. The player must tap the action control.

When the player sends a free-form message, an AI wedding-crew reply can arrive
asynchronously. There is no blocking "thinking" message, and the composer remains
available for follow-ups. The responder is chosen from the relevant wedding crew
when possible, rather than always speaking as Charlie. A failed response remains
retryable without duplicating the player's message.

The crew assistant receives a privacy-filtered, public game context. It may use
relevant roles and relationships, the current room roster, game date and time,
day or night, party and BBQ state, weather and forecast, calendar events, music,
tattoo credits, public note content, and photo metadata. It does not receive
visitor camera pixels, private drafts, secret credentials, or private birthday
details.

## Charlie

Charlie is the private wedding assistant in the monitor's **Chat** app. Charlie
knows the loft, game systems, public wedding information, and gameplay hints.
Charlie replies in the language used by the player, including English, Czech,
and Persian.

The Chat app warms its anti-bot check when opened. Follow-up messages can be
queued while a response is in progress. Conversation history survives closing
and reopening the app for the current session; killing the app or resetting the
game clears it. Network or verification failures appear as retryable errors.

The JavaScript console command `/chat your question` uses the same Charlie
conversation as the Chat app.

Charlie receives query-triggered context rather than a full dump on every turn.
Relevant context can include:

- the pretend game date, local time, and applicable calendar event;
- the current phase, room, room occupants, party, BBQ, and active moment;
- day or night, eclipse, seasonal sky effect, and scene weather;
- current conditions and forecasts for Edmonton and Prague;
- the current song, projector, calls, minigames, and open app;
- the runtime calendar, public people/role data, tattoo catalog and credits,
  authored public notes, and album captions/metadata without image pixels.

On an explicit request, Charlie may perform at most one currently available,
allowlisted game action after replying. Charlie cannot run arbitrary JavaScript.
The Messages crew assistant uses a separate conversation and prompt, and its
suggested actions still require the player to tap them.

## Party

The garden wall switch is the most direct party control. Before phase 2, it changes
day and night. After phase 2, it changes between daytime free play and the party.

During the party:

- guests arrive and rotate among the five rooms as appropriate;
- children may dance, play in Cuddly-puddly, or run through the party room;
- Bahareh may follow the running children;
- party music becomes quieter when a projector, video, piano, or other foreground
  media experience is active;
- opening **Who's here** freezes guest arrivals, departures, and room changes only
  while the roster is open.

### Party ending

The normal party interval is approximately three minutes of **attended** time.
Time counts only while the game is visible, focused, and not occupied by a major
cinematic moment. Background-tab time does not advance this timer.

At about 2 minutes 30 seconds, the wall switch is emphasized and a final-song or
final-dance message may appear. At about 3 minutes, the party winds down
automatically. Accepting a final-song or final-dance cue schedules an earlier
graceful ending after its authored beat. Completing the wedding-cake sequence can
also end the party gracefully. The wall switch ends it immediately.

Ending the party does not reset progress or end the game. Rooms, phone and
computer apps, music, minigames, and exploration remain available. A later
invitation can restart the party. The supported `party.extend` action cancels a
pending wind-down and starts a fresh attended interval.

### Party moments

Formal moments do not start randomly. They start only from an explicit Messages
action or the supported console/API action. Available moments include:

- first dance;
- slow dance;
- toasts;
- group photo;
- sparklers;
- cake cutting;
- bouquet toss;
- chair lift.

Only one major moment runs at a time. Routine automatic texts wait until the
moment is over, while a direct player action remains immediate.

## BBQ

The balcony smoker is interactive: open the firebox or lid, light it, allow it to
heat, and cook or serve food. During a party, a lit smoker activates BBQ mode.
Selected adults then split naturally between the balcony and garden/party while
children may keep playing elsewhere. BBQ mode remains active across later
day/night changes; extinguishing the smoker or ending the party ends it.

Three open-cookout dates use a daytime, no-UV party presentation:

- May 2, the Edmonton open BBQ;
- July 1, Canada Day;
- Sizdah Bedar, on its computed calendar date.

On those dates Behdad's BBQ invitation is delivered early in phase 2. Tapping it
pans to the balcony and starts the BBQ workflow. Open cookouts omit the formal
reception-moment text sequence. A BBQ invitation can also start BBQ mode during a
night party without changing the time of day.

## Music and foreground media

The phone and monitor Music apps share this three-track catalog:

1. **Tumbalalaika** - Markéta Jakešová
2. **I Need You** - Dan Bern
3. **Strange & Beautiful Things** - Orit Shimoni

The guitar starts or stops only Tumbalalaika. The ukulele rotates through only
the other two tracks. The shared player advances and wraps through all three.

The global play/pause button controls whichever foreground experience currently
owns media: loft music, party music, projector audio, video, or piano as
applicable. Its pause state becomes burgundy while audio is playing; the play
state remains visually quiet. `N` selects the next applicable track or scene.

## Minigames and optional activities

- **Flair-Catch:** In the kitchen/bar, repeat a nearby click on Pouria to begin,
  or use its message/API action. Pouria follows the pointer while the player
  catches garnishes and avoids the wasp. Clicking Pouria during the game does not
  open his personal card. Flair-Catch is unavailable when reduced motion is
  requested.
- **Invaders:** A hidden office-chair gesture, message action, or API action
  starts the game. Move to aim and fire at the invaders; close it with its visible
  close control.
- **Minesweeper:** Available on both phone and monitor.
- **Game of Life and Doom:** Available on the monitor.
- **Bouquet toss:** A party moment with its own aiming interaction.
- **Magic box:** The garden's magic box contains a set of optional visual trips.
  Its first click opens a two-digit wedding-date lock. The partial date at the top
  opens the phone Calendar as a clue. Set both day wheels, then press the single
  `Unlock` bar to check the answer; merely landing on the right digits does not open
  it. `T` cycles trips and `Shift+1` through `Shift+7` selects directly. Some variants
  are deliberately unavailable through typed actions while the party is active.

## Calendar, special days, weather, and sky

The runtime calendar supplies event dates rather than duplicating them in the AI
knowledge file. A permanent event bubble announces an active special day. Special
dates may alter decorations, weather, sky, messages, calls, cake, or the starting
state of the party.

Current wedding events are:

| Event | Local date and time |
| --- | --- |
| Edmonton wedding | May 1, 2027, 4:00 PM to May 2, 4:00 AM, Edmonton time |
| Edmonton open BBQ | May 2, 2027, 4:00 PM to 10:00 PM, Edmonton time |
| Prague wedding | July 10, 2027, 3:00 PM to July 11, 3:00 AM, Prague time |
| Prague garden brunch | July 11, 2027, 11:00 AM to 3:00 PM, Prague time |

Selecting one of these four event cards in the phone or computer Calendar reveals
its month without changing the loft date. Selecting a day in the calendar grid or
its search results activates that date and any associated scene.

Wedding-day invitations arrive through Messages and run only when explicitly
opened. Prague dates prepare the family gathering and Prague call. Birthday and
anniversary scenes can add greetings or cake, but private birthday dates are not
part of assistant answers.

The seasonal engine includes wedding, Pride, summer-solstice, St. John's Eve,
Canada Day, summer, smoky, autumn, Mehregan, Halloween, St. Martin's Day and
Remembrance Day, Christmas, Yalda, New Year, winter, Sadeh, Valentine's Day,
Chaharshanbe Suri, Nowruz, Sizdah Bedar, spring, and Witches' Night treatments.

Weather is modeled independently for Edmonton and Prague. The phone and monitor
weather views show current conditions and three-day forecasts. Scene weather,
daylight, moon phase, aurora/twilight effects, and eclipses can also affect the
room illustration. Heavy effects pause or limit work when their room is not
visible or the browser is in the background.

The Calendar and Clock apps provide friendly controls for simulated game time.
Power users can also use the `?date=` and `?time=` URL parameters. The lower
date/time overlay appears only when at least one of those parameters is present.

## Accessibility and platform behavior

- The interface is available in English and Czech. The selected language is
  persisted when the browser permits it.
- System `prefers-reduced-motion` is honored across major motion systems. Some
  animation is simplified or stopped, and Flair-Catch is disabled.
- Buttons and navigation controls have enlarged mobile hit areas, visible focus
  states, accessible labels, and stable dimensions.
- Small required scene targets receive invisible touch halos on coarse-pointer
  devices.
- Room dots expose their names, current selection, and locked state to assistive
  technology.
- The phone, app dialogs, rosters, notifications, and context menus keep their
  close controls in consistent locations.
- Browser zoom and scene scaling are stabilized on touch devices to reduce
  flicker during room and computer transitions.

The illustrated room objects themselves are intentionally not all in the Tab
order. The live instruction line and global keyboard commands provide alternate
progress controls, but the game should not yet be described as fully operable by
conventional keyboard traversal alone.

Camera, torch, fullscreen, autoplay, clipboard, sharing, and installation depend
on browser permission and platform support. Denying an optional permission does
not block the main room trail.

## Pro console

The dropdown JavaScript console is intentionally hidden from ordinary players.
It becomes discoverable after the monitor Console has received input or after
the backtick shortcut has been used. Press backtick to show it.

The console evaluates JavaScript in the page. Do not paste code from an untrusted
source. Internal names beginning with `__` are implementation details and are not
supported integrations.

Useful human-oriented console commands include:

```js
room()                 // show the current room
goto("garden")         // go to the garden/party room
party()                // inspect or toggle the party
bbq()                  // inspect or toggle BBQ mode
daylight()             // inspect daylight
night()                // set night
music()                // inspect or control loft music
phone("messages")      // open a phone app
computer("chat")       // open a monitor app
roster()               // inspect or show Who's here
weather()              // inspect weather
shortcuts()            // print keyboard shortcuts
```

`/chat question` sends a question to Charlie. `/message text` sends a message to
the wedding crew thread. These slash commands are for the pro console, not
ordinary JavaScript syntax.

### Script Editor

The monitor's **Editor** app is a small workspace for writing named JavaScript scripts that control
the loft. A first-time blank editor includes a runnable example. Scripts use the same human-oriented
commands as the console, and the editor accepts top-level `await`, so timed sequences can be written
directly:

```js
caption("hello from the editor", { blink: 1000, hold: 2500 })
await sleep(900)
party(true)
await sleep(1600)
dance("salsa")
```

Naming a script enables autosave. Saved scripts are stored in this browser and survive reloads,
game resets, and simulated computer reboots. The editor can also create, duplicate, delete, import,
download, email, or run its current script.

From either JavaScript console:

```js
scripts()          // list saved script names
edit("welcome")   // open a named script in the Editor
run("welcome")    // run it once
repeat("welcome") // keep running it until stopped
stop()             // stop a running or repeating script
```

The Editor's Run button executes the current buffer even before it has been named. While a script is
repeating, the button becomes Stop; `Escape` and `stop()` also end the loop. Repeating scripts pause
while the browser is hidden. As with the console, do not import or run untrusted code.

## Supported JavaScript status and action API

`loft.api` is the supported programmatic facade for integrations and tests. It
uses named queries and allowlisted actions, validates arguments, reports current
availability, and emits events for durable state transitions. Prefer
it to console helper aliases when writing external automation.

```js
loft.api.version

loft.api.capabilities({ kind: "query" })
loft.api.capabilities({ kind: "action", available: true })

loft.api.query("game.progress")
loft.api.query("room.occupants", { room: "garden" })

await loft.api.perform(
  "room.go",
  { room: "garden" },
  { source: "manual-example" }
)

const unsubscribe = loft.api.subscribe((event) => console.log(event))
unsubscribe()
```

Queries are synchronous. Actions return promises because an action may wait for
UI or media work. A successful result includes fields such as `ok`, `status`,
`stateVersion`, `changed`, and `value`. A failure includes a stable `code` and a
human-readable `message`. Availability is state-dependent, so discover
capabilities or handle a `NOT_AVAILABLE` failure instead of assuming an action
can always run.

### Queries

| Query | Purpose |
| --- | --- |
| `game.snapshot` | Broad current snapshot; convenient but more likely to grow over time |
| `game.progress` | Phase and room-trail progress |
| `game.busy` | Major transition or cinematic state |
| `room.current` | Current room |
| `room.list` | Room catalog and navigation state |
| `room.occupants` | Occupants of the current or requested room |
| `people.locations` | Current public character locations |
| `party.status` | Party, dance, DJ, and BBQ status |
| `bbq.status` | Smoker and BBQ split status |
| `audio.status` | Foreground audio owner and playback state |
| `projector.status` | Cuddly-puddly projector mode |
| `app.current` | Currently open phone or monitor app |
| `apps.list` | Discoverable app catalog |
| `calls.status` | Active and incoming call state |
| `messages.summary` | Counts and metadata, deliberately excluding message bodies |
| `minigames.status` | Minigame availability and activity |
| `scene.environment` | Daylight, weather, season, sky, and eclipse state |
| `calendar.events` | Runtime special-day and event data |
| `weather.cities` | Edmonton and Prague weather and forecasts |
| `album.list` | Album metadata, not photo pixels |
| `tattoos.catalog` | Tattoo designs and public artist credits |
| `trip.status` | Magic-box trip state |

Prefer a focused status query over `game.snapshot` when the caller needs only one
subsystem.

### Actions

The exact current set is discoverable with `capabilities()`. The public action
families are:

| Action | Main arguments or behavior |
| --- | --- |
| `room.go` | `{ room }` using a canonical room id |
| `app.open` | `{ app }` from the API's allowlisted app subset |
| `roster.set` | `{ open: true/false }` |
| `music.play`, `music.pause`, `music.skip`, `music.previous` | Shared music transport; skip can be unavailable during party ownership |
| `video.pause` | Pause Markéta's monitor film when it is playing |
| `music.track.play` | `{ track: "tumbala" | "danbern" | "orit" }` |
| `daylight.set` | `{ on: true/false }` |
| `party.set` | `{ on: true/false }` |
| `party.extend` | Cancel a wind-down and reset attended party time |
| `party.music.next` | Choose the next party music segment |
| `party.dj.set` | `{ dj: "sina" | "danesh" }` |
| `party.dance.request` | `{ style }` from the discovered style enum |
| `party.moment.start` | `{ moment }` from the discovered moment enum |
| `bbq.set` | `{ on: true/false }` |
| `coffee.make` | End an active party, restore daylight, and take the player to the kitchen/bar espresso machine |
| `photo.take` | Capture through the available in-game photo flow |
| `fishu.speak` | Run the Fishu interaction |
| `trip.next` | Start the next shuffled magic-box trip, equivalent to using the box |
| `trip.start` | `{ variant }`; availability depends on phase, visibility, active-trip, and party state |
| `projector.set` | `{ mode: "off" | "stars" | "workout" | "totoro" | "aqua" }` |
| `weather.scene.set` | `{ mode: "clear" | "rain" | "thunderstorm" | "overcast" }` |
| `sky.effect.set` | `{ effect: "none" | "aurora" | "twilight" }` |
| `call.incoming.trigger` | `{ caller: "madla" | "prague" }` |
| `call.video.start` | `{ contact: "prague" | "lubeck" }` |
| `call.hangup` | End the active or incoming call |
| `bar.cocktail.make` | `{ drink }` using a discovered cocktail slug |
| `bar.mixer.start` | `{ recipe: "negroni" | "yale" }` |
| `minigame.start` | `{ game: "invaders" | "flair-catch" }` |
| `minigame.stop` | End the active minigame |
| `album.remove` | `{ id }`; remove one Album record by its numeric id |
| `scene.activity.start` | `{ activity: "kids-chase" | "butterfly" | "rainbow" }` |

The optional action `source` is diagnostic text, not authority. The API still
validates and gates every action. Subscriptions report semantic transitions from
typed actions, direct player controls, and tracked autonomous systems. They do
not report animation frames, minigame score ticks, or sound effects.

## Troubleshooting

### A room will not unlock

Read the instruction line and complete the current room's remaining highlighted
step. To skip, double-click or double-tap the locked destination dot. Keyboard
players can press a room number directly.

### The phone is locked

Solve the displayed math question. After three failed submissions it opens
automatically. A context-menu unlock is also available for accessibility.

### A notification did not start its event

This is intentional. A notification opens and centers the message; it never runs
the action. Tap the action control inside that message.

### Messages have not arrived

Ordinary messages are held until phase 2. Finish the room trail or start the
party. On special dates, the first event message is also held until phase 2.

### Charlie or a crew reply keeps waiting

Leave the composer available for follow-ups. If the network or anti-bot check
times out, use the retry control on the failed response. Reloading can renew a
stale verification session, but it also clears some session-only state.

### Audio will not begin

Browsers require a user gesture before playing sound. Click the game, then use
the play control or the instrument again. Check the device mute state and browser
site permission. Another foreground app may currently own the media control.

### Fullscreen exited after opening a link

Return to the game and click once; game-only and installed-app play restore the
previous fullscreen intent. Use `F` if the browser declined the request.

### Camera, torch, or sharing is unavailable

These features require browser support, a secure origin, and permission. The
Photobooth still provides its interface without camera access, and denying the
permission does not affect the room puzzles.

### Animation flickers or performance drops

Close heavy monitor apps, leave fullscreen and re-enter if browser compositing is
stuck, or enable the operating system's reduced-motion setting. Browser
performance tools can provide an approximate FPS trace. Weather particles,
fireworks, and other continuous effects are designed to pause when their scene is
not visible; a persistent off-room effect should be reported as a bug.

### Resetting

Press `R` and confirm, or use the visible reset/extinguisher control. Reset clears
progress and session-scoped UI state. It is intentionally more destructive than
ending the party.

## Maintainer verification

The `loft-day` game is a static, single-file application with no build step. Keep
changes narrow, preserve English/Czech dictionary parity, and prefer existing
runtime helpers over new parallel state. See `docs/developer.md` for the internal
source layout.

For any game-code change, run at minimum:

```bash
node tests/check.js
node tests/state.js
```

Run the broader interaction suite when behavior or progression changes:

```bash
node tests/play.js
```

Then add the focused suite that owns the changed behavior. Common examples are:

```bash
node tests/enter.js
node tests/navigation.js
node tests/menu.js
node tests/laptopmenu.js
node tests/phone-lock.js
node tests/mobile-controls.js
node tests/party-lifecycle.js
node tests/status-api.js
node tests/api-state-events.js
node tests/message-context.js
node tests/message-resilience.js
node tests/message-typed-actions.js
node tests/chat-context.js
```

Use browser screenshots and direct interaction checks for visual, touch, camera,
fullscreen, and animation changes. Test at both desktop and mobile sizes and with
reduced motion. For performance work, compare a stable idle room, an active party,
and an off-room/background case using browser performance tools.

Deployment is a separate, explicit maintainer action. Follow the approved private
procedure in `CLAUDE.md`; do not place credentials, internal host details, or
deployment commands in public documentation. Because the app is one large file,
avoid overlapping rapid deployments, verify that the live file matches the
intended revision, and reload after deployment before diagnosing a transient
partial render.
