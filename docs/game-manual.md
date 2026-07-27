# The Loft Game Manual

This manual describes the current `loft-day` wedding game. The game is a
single-page, illustrated visit to The Loft, with five connected rooms, small
puzzles, phone and computer apps, a party, and many optional details.

The first playthrough does not require a keyboard, a command console, or prior
knowledge of adventure games. Follow the instruction line, click objects that
look useful, and keep wandering.

When a saved session is available, the opening screen asks whether to continue
or start over. The caption above the scene shows `Saved`, the saved room, and
its age instead of showing a gameplay instruction. Room arrows, utility rails,
Restart, and room dots stay hidden until that choice is made. Trailer and
Autoplay occupy the dots' bottom row: Trailer preserves the unopened
checkpoint, while Autoplay continues from it. Use the buttons, arrow keys,
`Enter`, or `Space` to choose. **Start over** acts immediately because the
recovery choice itself is the confirmation; the in-game Restart control still
asks before discarding active progress. Both recovery choices enter the enlarged
page mode immediately. **Start over** preserves the clean fresh-game **CLICK
ME** invitation inside that enlarged view.

## Quick start

1. Click or tap **CLICK ME** to begin. That first tap, `Enter`, `Escape`, or
   `Backspace` only dismisses the entry; it never operates the room underneath.
   The entry screen also offers language, Trailer, and Autoplay; normal game
   controls appear after entry. An installed app first shows a loading screen
   and may enter fullscreen on its first tap. A narrow portrait phone shows only
   a landscape prompt; rotate manually or tap **Try landscape**.
2. Follow the instruction line above the scene. It is the authoritative current
   hint. The first-location guide remains until you click or tap once to
   acknowledge it.
3. Solve the highlighted activity in each room. The right room arrow unlocks as
   you make progress.
4. When you are ready, start the party. The first party begins phase 2: every
   room unlocks, Messages become active, and the other free-play systems become
   available.
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
- the phase 1 clue prompts, solve walkers, and automatic next-room advances stop;
- phone messages and their actions become available;
- guests can arrive and move between rooms;
- the party, BBQ, formal moments, calls, music, apps, and minigames can overlap;
- the phone and computers remain usable during and after the party.

Some delayed messages may arrive soon after phase 2 begins. They are released as
normal notifications rather than all taking over the scene at once.
During Invaders, Flair-Catch, Tetris, and Pac-Man, incoming messages remain unread
but their notification cards and badges wait until the action game ends.
On the phone launcher, red badges show unread Messages, unread Mail, and new
Album photos. Opening Album marks the photos currently there as seen.

## Controls

### Mouse and touch

- Click or tap objects in the room to interact with them.
- Change rooms with the side navigation arrows or room dots.
- Tap a named guest, child, or Who's here entry for a brief relationship card.
- Use the lower media control to pause or resume the current foreground music.
- Right-click supported objects for a context menu.
- On a touch screen, a two-finger tap provides the general context-menu gesture.
- In Messages, press and hold one message with one finger for message actions.
- Drag only objects that visibly respond to dragging, such as garden water
  bottles and the wheeled bar cooler.

### Back, Escape, and fullscreen

`Escape` and `Backspace` normally go back one level: from a detail to its app,
from an app to the desktop, or from a zoomed computer to the room. When typing,
the first `Escape` generally removes focus and preserves an unsent draft rather
than closing the whole app.

At room level, with no app, menu, dialog, or text field consuming the key,
`Escape` and `Backspace` invoke the same guided room action as `Enter` during
phase 1. After the party has unlocked phase 2, these keys stop operating rooms:
`Escape` and `Backspace` remain back/close controls, and `Enter` is inert.

When the scene or API opens a phone app directly, `Escape` or `Backspace` closes
the phone instead of exposing its launcher. This applies to
Aspen's post-shutter Album, the magic-box Calendar clue, and the scene date/time
pills. An app opened from a Messages action returns to that thread first.

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
| `Enter` | During phase 1, perform the current room's guided action |
| `Escape` / `Backspace` | Back or close; during phase 1, also perform the guided room action |
| `M` | Open or close the main computer monitor |
| `L` | Open or close the laptop |
| `C` | Open or close the phone |
| `/` | Open Messages; inside searchable apps, focus search when appropriate |
| `W` / `H` | Show or hide Who's here during phase 2 |
| `F` | Toggle fullscreen |
| `Space` | Game action, or play or pause foreground media |
| `N` | Play the next applicable song or music selection |
| `G` | Send the next catalog message |
| `Tab` | Send a random, context-appropriate test message (Chat may rephrase it in English; Czech stays authored) |
| `D` | Toggle day and night |
| `Up` / `Down` | Set day or night |
| `Shift+Left` / `Shift+Right` | Previous or next significant calendar day |
| `Shift+Up` / `Shift+Down` | Move the game clock by 30 minutes |
| `P` | Toggle the party |
| `U` | Toggle ultraviolet party lighting |
| `S` / `Shift+S` | Next or previous season |
| `B` / `Shift+B` | Next or previous birthday scene |
| `T` | Start the next magic-box trip |
| `Shift+1` through `Shift+8` | Select a particular magic-box trip |
| `K` | Repeat the cat activity |
| `R` | Reset the game after confirmation |
| `` ` `` | Show or hide the dropdown JavaScript console |

The top-left back arrow supplies the same Escape/Backspace action on every layout,
including touch devices without a hardware keyboard. Restart remains available as
the button directly below Fullscreen at top-right.

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
temporarily; after a quiet interval the kiosk resumes. Run `autoplay(false)` in
the console to stop it deliberately.

The direct game entries have distinct purposes:

- `#play` opens Loft Day without starting a presentation.
- `#trailer` opens the game-only view and starts the fixed Trailer reel.
- `#autoplay` opens the game-only view and starts persistent Autoplay.

The older `?autoplay` URL remains an alias for `#autoplay`.
If a saved-session choice is waiting, URL autoplay begins only after Continue or
Start over resolves that screen.

## Room guide

This section first describes each room without giving away its main solution.
Exact solutions follow in the clearly marked spoiler section.

### Kitchen/bar

The **La Maz** espresso machine and **El Maz** grinder form the first guided
activity. The kitchen keeps its espresso setup throughout phase 1, even when the
windows reflect Edmonton at night. After the first party unlocks phase 2, the
same room can become the bar, with Pouria, cocktail tools, a cocktail menu, and
the Flair-Catch minigame. The unnamed seated regulars belong to the calm night
bar; the active party bar instead uses the named guests who rotate through the
room. The kitchen/bar also contains personal details, props, and small repeat
interactions that are not required for progression.

### Garden/party

The garden activity combines plants, music, and candlelight. In phase 2 this room
becomes the main party room. Its wall switch changes meaning after the party has
been unlocked: in phase 1 it changes day and night; in phase 2 it changes between
day and party. As a hidden alternative, three rapid taps on the mirror start the
party and three rapid taps on the active DJ end it. A single DJ tap triggers the
DJ's physical reaction; right-click opens the modal song picker to the left of
the booth, while touch keeps a direct tap route. A double-click skips to the
next song.

The guitar always toggles **Tumbalalaika**, sung by Markéta Jakešová. The ukulele
alternates between **I Need You** by Dan Bern and **Strange & Beautiful Things**
by Orit Shimoni.

The fairy hidden in the witchy table can provide an optional hint during the
garden puzzle. Clicking them sends a trail of sparkles toward the next clue.
Once released, they fly from the garden as phase 2 begins. When the party is off,
they float above the couple in cuddly-puddly at night and prompt a Rumi exchange.
Markéta's verse wakes Behdad, who stays awake through his reply. The available
Rumi pairs are shuffled once when the page loads, then dealt in that order so
every pair appears before the cycle repeats. In the console, `faal()` returns a
random Hafez reading without changing the scene. `rumi()` deals from this same
Rumi deck and starts the attached exchange when the nighttime fairy is present;
elsewhere it waits without consuming a pair.
The plant grow light follows the loft clock automatically, staying on from
11:00 to 17:00; clicking it overrides the schedule until the next boundary.
Click the mini-split's temperature display to switch it between Celsius and
Fahrenheit without switching the unit itself on or off.

### Cuddly-puddly

Cuddly-puddly contains soft furnishings, Octi, a balcony door, children's play,
and a projector. The wall screen cycles through fireplace, workout, night-sky
piano, aquarium, Totoro, and off. It can temporarily take ownership of the
foreground media controls and lower the party music. The witchy chest can also
release the cat; further taps, or `K`, prompt another antic.

### Office

The office contains the laptop, the main computer monitor, lamps, the Prague and
Lübeck call experience, a stained-glass detail, and the hidden Invaders minigame.
The computer is also the main home of the game's larger apps and pro tools.

The laptop's two contact tiles place Prague and Lübeck calls. Its context menu
can open a tile, end a live call, wake a closed laptop, or translate the
on-screen *L'amour* heading.

At room scale, the first click on a monitor or laptop zooms it. A second click
interacts with its screen. This prevents an accidental click-through while the
camera is moving.

### Balcony

The balcony contains the smoker and grill, weather and sky interactions, the
day/night celestial control, smoking-area details, and the main BBQ activity.
The quiet grill beside the smoker keeps its dusty response while covered.
Double-click it to remove or replace the fitted cover; while exposed, a single
click opens or closes its real stainless lid.
Double-click the sun or moon for the matching eclipse effect; a single click
changes day or night.
The wall thermometer carries Fahrenheit markings on the left and Celsius on
the right. Open its controls, then click the numeric reading to switch units.

The building across the street has forty independently lit office windows.
Clicking one window toggles only that window; unattended lights also change
gently on their own while the balcony is visible and focused. Its lights
occasionally form a falling shape, and during the party a neighbour or two may
appear at a lit window to watch—more often when the deck is crowded. Double-clicking
any window starts **Block Party** on the facade's 10×16 lamp
grid. During the game, use `Left`/`Right` to move, `Down` to soft-drop,
`Up` or `X` to rotate clockwise, `Z` to rotate counter-clockwise, `Space` to
hard-drop, and `Escape` or the visible close button to quit. Game over restores the office lights and
briefly accepts `Enter` to restart. The best score persists across visits.

## Puzzle solutions

> **Spoilers:** The following steps reveal the full phase 1 room trail.

### Kitchen/bar solution

1. Turn on La Maz and allow it to warm up.
2. Run El Maz.
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

Reaching the balcony completes the main guided traversal. Its finale points to
the party switch; if left alone, the game continues into the party after about
20 seconds of attended play. Once the party starts, phase 2 remains unlocked
even after the party is later stopped.

## Phone

The phone can be opened from the scene, with `C`, or with the supported scripting
API. On its first ordinary opening it presents a small math lock. Three failed
answers unlock it automatically. The lock also has an accessible context-menu
shortcut.

The phone has Home, Back, and Recents controls. Swipe vertically anywhere on
the launcher to scroll; press and hold an app icon briefly before dragging to
rearrange it. Most app and navigation state lasts for the current browser
session; the full game reset restores the initial layout.

Right-click an app icon, or use the two-finger touch gesture, for **Open**,
**Stop**, and **Uninstall**. Stop clears that app's current session but keeps its
icon. Uninstall leaves an empty launcher slot until the game is reset or
reloaded.

The current phone apps are:

| App | What it contains |
| --- | --- |
| **Call** | Calls to Tehran, California, Prague, and Lübeck; outgoing Madla requests reach Lübeck, while “have Madla call me” triggers her incoming ring when available |
| **Messages** | Wedding crew thread, search, unread filter, composer, replies, reactions, and explicit message actions |
| **Mail** | Authored inbox messages plus compose and reply through the device's email client |
| **Calendar** | Wedding events, calendar export, Google Calendar links, date/time controls, and search |
| **Album** | Session photos plus Aspen and photobooth captures; search, grid, delete, share, and an after-party contact sheet |
| **Photobooth** | Camera capture, filters, and frames, subject to browser camera permission |
| **Music** | The shared three-song loft catalog |
| **News** | A compact Hacker News reader |
| **Weather** | Edmonton and Prague current conditions and three-day forecasts |
| **Clock** | City clocks, event countdowns, play time, and game-time controls |
| **Calculator** | A calculator with a live, animated abacus |
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

A notification card opens Messages and centers the exact message. When the message
has an attached action, its separate arrow runs that action directly; the card itself
never runs it automatically.

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
- Code
- Console
- Python
- Linux

Every monitor app has its own Kill gag. A normal close leaves the app marked as
running. Right-click its desktop tile or open surface and choose **Kill** to
clear that session with its own send-off. Runtime apps also offer **Restart**
when appropriate.

Pac-Man never occupies a desktop tile, but typing its name in the computer's app
search opens it at any time. During the ketamine magic-box trip, catching the
roaming Behdad ghost opens it directly. Use the arrow keys or `WASD`,
the on-screen direction pad (tap or drag without lifting), or a swipe across the
maze. A blocked direction is
remembered until the next junction. Closing the app retains the current maze,
and its star score keeps a persistent personal best. Right-clicking the open game
and choosing **Kill** starts a fresh maze without erasing that best.

Weather does not occupy a desktop tile. Click the Edmonton weather item in the
computer's menu bar to open it. The live time beside it opens Clock, with the
same Edmonton, Prague, Tehran, and Lübeck times, wedding countdowns, play time,
and game-time controls as the phone Clock. Reset appears only after choosing a
pretend time. The monitor slider moves minute by minute; the phone keeps larger
half-hour steps. While **Day at the Loft** runs, both scene-corner date and time
controls remain visible, then return to their usual URL-driven visibility when
the day stops.

The idle monitor rotates through a live Julia fractal, growing 3D Pipes, and a
deforming 3D Flower Box. The `m ∞ b` wordmark opens the computer's system menu. **Sleep**
darkens and unzooms only the monitor; press it to wake with every app exactly
where it was. **Lock** starts at the screensaver; activity reveals CAPS LOCK,
and another idle stretch returns to the saver. Put
the pink flat cap on behdad and the blue baker cap on Markéta by tapping a cap
and then a portrait, dragging it, or using `Tab`, the arrow keys, and `Enter`.
An intentional Caps Lock on/off cycle also unlocks it. The lock affects only the
computer and survives leaving the monitor and continuing after a reload. **Reboot** and
**Shut down** perform a clean power cycle and clear running app sessions. **About**
introduces The Loft without leaving the game. **Credits**
rolls the people and open-source software behind the loft over its ever-burning fire.

Tap the magnifying glass in the desktop menu bar, or type an app name while the
desktop or screensaver is visible, to open autocomplete search. `Enter` or `Tab`
accepts the suggestion. Its close control or `Escape` dismisses it; `Backspace`
dismisses it once the field is empty. About and Credits are searchable apps even
though they have no desktop tiles.
Search recognizes localized app labels where a translation exists. In apps
with their own search field, `/` focuses that field when it will not overwrite an
active draft.

`Escape` or `Backspace` follows app hierarchy. For example, Tattoo detail returns
to the tattoo gallery, and an open Mail message returns to the inbox, before the
app itself closes. In the monitor Photobooth's look picker, either key returns to
the live camera view; the orange top-right dismiss button remains available there
to exit the app directly.

The Tattoo detail view includes the design, artist portrait, and the artist's
name and relationship. The gallery stays compact. The Album and Photobooth share
captured photo metadata, while live camera pixels remain local to the browser.
After a party ends, **Tonight at the loft** groups that party's keepsakes into a
compact recap without mixing in the older pre-wedding photoshoot.
During the party, Aspen follows people into the loft's rooms and deck. She does
not enter, flash, or create an Album keepsake when a room has no subjects.
The party itself may therefore continue while Aspen is absent from an empty
garden; she returns as soon as somebody returns to the floor. Her occasional
whole-floor photo pose lasts about four seconds; ordinary Album captures do not
freeze the dancing.

### Computer-only environments

The monitor includes a JavaScript Console, a shared JavaScript/Python Script
Code, a Python environment, and a Linux-like command environment. These are
optional toys for technically curious players. The Python and Linux apps use
browser-hosted, pinned runtimes rather than a shell on the visitor's device.
HarfBuzz and font-tool demonstrations are included.

On iOS and some WebKit versions, canvas, video, live-camera, or embedded-frame
monitor apps can appear blank because of platform rendering restrictions. The
rest of the game remains usable.

## Messages and crew replies

Messages are held until phase 2. The thread is chronological, with search and the
unread-only filter and a mark-all-read control kept at the top and the composer
at the bottom. Marking all read clears the badge without deleting the thread. The composer
receives focus when Messages opens. Press `Escape` to leave the composer; press
`/` while it is empty to focus message search.

Some automatic English messages are lightly rephrased by Chat; others
intentionally keep their authored wording. Czech always uses the authored
translation. If Chat is unavailable, the original English message arrives.

Right-click a message, or long-press it on touch, to:

- reply;
- copy its text;
- mark it read or unread;
- add a reaction.

A reply can quote an earlier message. Tapping the quote finds the original.
Some incoming texts also collect quiet emoji reactions from the wedding crowd;
these do not create another notification or change unread state.

Messages may include scene actions such as starting a party moment, visiting a
room, or beginning an activity. These actions never run just because a
notification or message is opened. The player must tap the action control.
When changing game state makes an action permanently irrelevant, its action
control expires and the row becomes read history. It no longer occupies an
unread slot, while still-applicable messages remain actionable.

When the player sends a free-form message, an AI wedding-crew reply can arrive
asynchronously. There is no blocking "thinking" message, and the composer remains
available for follow-ups. The responder is chosen from the relevant wedding crew
when possible, rather than always speaking as Charlie. A failed response remains
retryable without duplicating the player's message.

After phase 2 begins and another message has arrived, Charlie sends one delayed
introduction that also points out the general escape control: use `Escape` to
leave a situation, or `Backspace` when browser fullscreen consumes `Escape`.

The crew assistant receives a privacy-filtered, public game context. It may use
relevant roles and relationships, the current room roster, game date and time,
day or night, party and BBQ state, weather and forecast, calendar events, music,
tattoo credits, public note content, and photo metadata. It does not receive
visitor camera pixels, private drafts, secret credentials, or private birthday
details.

## Charlie

Charlie is the private wedding assistant in the monitor's **Chat** app. Charlie
knows the loft's recognizable objects and interactions room by room, game
systems, public wedding information, and gameplay hints. Charlie replies in the
language used by the player, including English, Czech, and Persian.

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
- children may dance, play in Cuddly-puddly, run through the party room, join
  balcony activities, or go to sleep as the evening changes;
- named guests occasionally perform their authored visual reactions on their
  own while the player watches the garden;
- the ordinary Irene, Robin, and Navid Cuddly-puddly cameos occur only during
  daylight while the party is off. Night dismisses an active cameo;
- Totoro gathers the children in Cuddly-puddly to watch. Its smaller non-party
  audience is also daylight-only;
- party music becomes quieter when a projector, video, piano, or other foreground
  media experience is active;
- opening **Who's here** freezes guest arrivals, departures, room changes, and
  adult dance-floor motion. It also pauses automatic message delivery and hides
  message previews until the roster closes.

### Party ending

Elapsed time does not end the party. It continues while the player works in
another window or leaves the game occluded. The attended clock still paces later
messages and explicit finales, but it does not impose a deadline.

Accepting a final-song, final-dance, or sparkler send-off cue schedules a
graceful ending after its authored beat. Completing the wedding-cake sequence
can also end the party gracefully. The wall switch ends it immediately.

Ending the party does not reset progress or end the game. Rooms, phone and
computer apps, music, minigames, and exploration remain available. A later
invitation can restart the party. The supported `party.extend` action cancels a
pending authored wind-down. Party lighting, including
the blacklight and magic-box glow, switches off with the party.

### Party moments

Formal moments do not start randomly. They start only from an explicit Messages
action or the supported console/API action. Their autonomous Messages invitations
are withheld for the first 45 seconds of attended party time, allowing ordinary
conversation to establish the party first. Available moments include:

- first dance;
- slow dance;
- toasts;
- group photo;
- sparklers;
- cake cutting;
- bouquet toss (a fictional, game-only event);
- chair lift.

The toast sequence follows Ali and Farhang to the rooms they actually occupy,
panning between them when they are apart.

Only one major moment runs at a time. Routine automatic texts wait until the
moment is over, while a direct player action remains immediate.

## BBQ

The balcony smoker is interactive: open the firebox or lid, light it, allow it to
heat, and cook or serve food. During a party, a lit smoker activates BBQ mode.
Selected adults then split naturally between the balcony and garden/party while
children may keep playing elsewhere. BBQ mode remains active across later
day/night changes; extinguishing the smoker or ending the party ends it. Hamid
tends the grill and announces the first cooked batch in the group chat, prompting
a cheer from the balcony and a couple of replies in the thread. The grate empties
across twelve servings, after which Hamid signs off. Behdad and Markéta move together
between the party floor and balcony. Extinguishing and relighting the grill starts
with a fresh batch. As Hamid serves, plates briefly appear with guests who are
currently outside.

Three open-cookout dates use a daytime, no-UV party presentation:

- May 2, the Edmonton open BBQ;
- July 1, Canada Day;
- Sizdah Bedar, on its computed calendar date.

On those dates Behdad's BBQ invitation is delivered early in phase 2. Tapping it
pans to the balcony and starts the BBQ workflow. Open cookouts omit the formal
reception-moment text sequence. A BBQ invitation can also start BBQ mode during a
night party without changing the time of day. Selecting Canada Day through
Calendar or the season controls starts its daytime balcony cookout immediately.

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

While an action game is running, its keyboard controls take priority and other
ordinary game shortcuts are suspended until the player exits.

- **Flair-Catch:** In the kitchen/bar, repeat a nearby click on Pouria to begin,
  or use its message/API action. Pouria follows the pointer while the player
  catches garnishes and avoids the wasp; Left/Right arrows move him too. Clicking
  Pouria during the game does not open his personal card. Space pauses or resumes
  the run. Flair-Catch is unavailable when reduced motion is requested.
- **Invaders:** A hidden office-chair gesture, message action, or API action
  starts the game. Move the chair or use Left/Right arrows to aim; Space fires
  while auto-fire remains active.
- **Block Party:** On the balcony, double-click any across-the-street office
  window. The forty physical windows become a 10×16 board with four square lamps
  per window. Arrow keys move and rotate pieces, and Space drops them. On touchscreens,
  tap to rotate, drag sideways to move through columns, swipe down to lower a piece,
  or flick down to drop it. Its controls, score, lines, and persistent best score
  appear in the room.
- **Minesweeper:** Available on both phone and monitor.
- **Pac-Man:** Type its name in the computer's app search, or catch the roaming
  ghost during the ketamine trip to jump directly into the monitor game. Clear
  the pellets while avoiding the three ghosts; the larger
  corner pellets briefly make the ghosts edible. Movement, ghost personalities,
  staggered releases, scatter/chase phases, and the wrap tunnel adapt the
  original arcade game's level-one rules while turns remain buffered at maze
  corners. Press `Space` to pause or resume.
- **Game of Life and Doom:** Available on the monitor. Space pauses or resumes
  Life, which also pauses when its board goes empty or reaches a stationary
  arrangement. Oscillating patterns continue to run; the `?` button explains
  its rules and controls.
- **Bouquet toss:** A fictional, game-only party moment with its own aiming
  interaction. No bouquet toss is planned for either real wedding celebration.
- **Magic box:** The garden's magic box contains a set of optional visual trips.
  Its first click opens a two-digit wedding-date lock. The partial date at the top
  opens the phone Calendar as a clue. Set both day wheels, then press the single
  `Unlock` bar to check the answer; merely landing on the right digits does not open
  it. `T` cycles trips and `Shift+1` through `Shift+8` selects directly. Some variants
  are deliberately unavailable through typed actions while the party is active.
  Each trip briefly borrows the clue line for its own caption, then restores the
  previous clue; THC and alcohol use the same treatment. The ketamine trip's roaming
  ghost is also a direct shortcut into Pac-Man.

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
part of assistant answers. Selecting World Polyamory Day on November 23 stops an
active party and gathers Chinnel, Raffi, Markéta, and Behdad in Cuddly-puddly.
Tap Chinnel or Raffi there for an affectionate couch reaction.

The seasonal engine includes wedding, Pride, summer-solstice, St. John's Eve,
Canada Day, summer, smoky, autumn, Mehregan, Halloween, St. Martin's Day and
Remembrance Day, Christmas, Yalda, New Year, winter, Sadeh, Valentine's Day,
Chaharshanbe Suri, Nowruz, Sizdah Bedar, spring, and Witches' Night treatments.
On Valentine's Day, Markéta carries roses in Cuddly-puddly, and tapping the
heart garland sends kisses into the room.
During Pride, a muted rainbow wash crosses the current room every ten seconds
while the game is attended; trips and chemistry-card effects take visual priority.
Selecting the summer solstice starts a daytime BBQ on the balcony.
On Nowruz, the two haft-seen candles in the office can be snuffed and relit
individually.

Weather is modeled independently for Edmonton and Prague. The phone and monitor
weather views show current conditions and three-day forecasts. Scene weather,
daylight, moon phase, aurora/twilight effects, and eclipses can also affect the
room illustration. Heavy effects pause or limit work when their room is not
visible or the browser is in the background.

The Calendar and Clock apps provide friendly controls for simulated game time.
**Day at the Loft** runs the balcony sky through a full day in about 30 seconds
and repeats until stopped; press `Escape` or its Stop control to end it.
Power users can also use the `?date=` and `?time=` URL parameters. The lower
date/time overlay appears only when at least one of those parameters is present.
Its `◀`/`▶` controls move one day at a time, while `◀◀`/`▶▶` jump between
significant dates. Selecting the date opens Calendar; selecting the top occasion
banner activates that day's celebration.
The hanging wedding countdown in Cuddly-puddly opens Calendar.
For a pretend Edmonton date or time, the game uses historical weather to
approximate the selected moment. An `≈` before the Edmonton temperature marks a
reconstructed reading rather than today's live weather.

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

### Code

The monitor's **Code** app is a small workspace for named JavaScript and Python
files. Use the **JS** and **PY** controls to choose a language; a `.js` or `.py`
filename chooses it automatically. Each language starts with runnable examples;
Python includes `square.py` and the centered recursive `space-filler.py`.

JavaScript files use the same human-oriented commands as the console, and accept
top-level `await`, so timed loft sequences can be written directly:

```js
caption("hello from the Code", { blink: 1000, hold: 2500 })
await sleep(900)
party(true)
await sleep(1600)
dance("salsa")
```

Python files run in the monitor's real CPython environment. The bundled
browser-compatible Turtle module draws into the Python app:

```python
import turtle

t = turtle.Turtle()
t.color("#8e3a4a")
for _ in range(5):
    t.forward(80)
    t.right(144)
```

Turtle graphics open automatically when drawing begins. Use the small **gfx** /
**>>>** control in the Python app to switch between the drawing and console.
Common movement, pen, color, fill, circle, dot, write, and screen-background
operations are supported. It does not open a desktop Tk window.

Naming a file enables autosave. Saved JavaScript and Python files are stored in
this browser and survive reloads, game resets, and simulated computer reboots.
Code can also create, duplicate, delete, import, download, email, or run
its current file.

From either JavaScript console:

```js
scripts()          // list saved script names
edit("welcome")   // open a named script in the Code
run("welcome")    // run it once
repeat("welcome") // keep running it until stopped
stop()             // stop a running or repeating script
```

The Code's Run button executes the current buffer even before it has been
named. A Python run switches to the Python app, where output and errors appear.
While a JavaScript script is repeating, the button becomes Stop; `Escape` and
`stop()` also end the loop. Repeating scripts pause while the browser is hidden.
As with the consoles, do not import or run untrusted code.

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
| `api.info` | API version and current state revision |
| `api.capabilities` | Discover registered queries/actions and current availability |
| `game.snapshot` | Broad current snapshot; convenient but more likely to grow over time |
| `game.status` | Bounded overview of progress, room, activity, and session |
| `game.progress` | Phase and room-trail progress |
| `game.busy` | Major transition or cinematic state |
| `room.current` | Current room |
| `room.list` | Room catalog and navigation state |
| `room.occupants` | Occupants of the current or requested room |
| `people.locations` | Current public character locations |
| `person.list`, `person.get` | Public cast profiles |
| `attendance.status` | Current public room attendance |
| `party.status` | Party, dance, DJ, and BBQ status |
| `bbq.status` | Smoker and BBQ split status |
| `audio.status` | Foreground audio owner and playback state |
| `media.status` | Combined music, video, dance, projector, and volume state |
| `projector.status` | Cuddly-puddly projector mode |
| `app.current` | Currently open phone or monitor app |
| `apps.list` | Discoverable app catalog |
| `apps.status` | Current device apps and their public catalogs |
| `calls.status` | Active and incoming call state |
| `messages.summary` | Counts and metadata, deliberately excluding message bodies |
| `messages.recent` | A bounded list of recent wedding-thread messages |
| `minigames.status` | Minigame availability and activity |
| `scene.environment` | Daylight, weather, season, sky, and eclipse state |
| `calendar.events` | Runtime special-day and event data |
| `calendar.upcoming` | A bounded list of upcoming public occasions |
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
| `message.send` | `{ text }`; send as the visitor to the wedding thread |
| `volume.set` | `{ level }` from 0 to 1 |
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
| `coffee.make` | End an active party, restore daylight, and take the player to La Maz in the kitchen/bar |
| `photo.take` | Capture through the available in-game photo flow |
| `fishu.speak` | Run the Fishu interaction |
| `trip.next` | Start the next shuffled magic-box trip, equivalent to using the box |
| `trip.start` | `{ variant }`; availability depends on phase, visibility, active-trip, and party state |
| `projector.set` | `{ mode: "off" | "stars" | "workout" | "totoro" | "aqua" }` |
| `weather.scene.set` | `{ mode: "clear" | "rain" | "thunderstorm" | "overcast" }` |
| `sky.effect.set` | `{ effect: "none" | "aurora" | "twilight" }` |
| `call.incoming.trigger` | `{ caller: "madla" | "prague" }` |
| `call.video.start` | `{ contact: "tehran" | "california" | "prague" | "lubeck" }` |
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

Ordinary messages are held until phase 2. Reach the balcony and let its finale
continue, or start the party yourself. On special dates, the first event
message is also held until phase 2.

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
ending the party. In game-only browser play, an in-game reset preserves the
enlarged page view while returning the scene to the clean **CLICK ME**
invitation. The console/API `reset()` command uses the same transition.
When `?date=` or `?time=` is active, recovery **Start over**, `R`, `reset()`,
and the in-room extinguisher preserve that pretend date and time. The explicit
Restart control in the right-side game chrome clears them and returns to today.

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
