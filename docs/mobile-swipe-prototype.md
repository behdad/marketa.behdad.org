# Mobile room-swipe prototype

This branch prototypes one-finger room navigation without merging or deploying it.

## Gesture contract

- Touch pointers only. Mouse drags never navigate.
- Exactly one active touch.
- Start inside the scene's left or right edge band: 18% of the rendered scene width,
  clamped to 48-76 CSS pixels.
- Move inward: right edge to the left for the next room; left edge to the right for the
  previous room.
- Travel at least 16% of the scene width, clamped to 58-84 CSS pixels.
- Finish within 800 ms, with no more than 54 CSS pixels of vertical travel and at least
  1.6x as much horizontal as vertical movement.
- A clearly vertical move or an outward edge move cancels the candidate immediately.
- A successful swipe has a 800 ms navigation cooldown (the 720 ms room slide plus 80 ms).
- Navigation is only to an already unlocked room. Swiping never solves or unlocks a room.

The viewport uses `touch-action: pan-y pinch-zoom` on coarse-pointer devices. Vertical page
scrolling and pinch zoom remain browser-native. The scene does not visually follow the
finger; this keeps incomplete gestures indistinguishable from ordinary taps.

## Guards

The gesture does not arm when any of these owns the interaction:

- Flair-Catch or Invaders is active.
- The cinematic or interactive bouquet toss is active.
- A device is zoomed, the phone/dialog/roster/drop-down terminal is open, or the start is
  outside the current room.
- The start target is a link, control, focusable element, `.hunt-hit`, device, or known
  draggable: office chair/desk, garden bottles, bartender, bar stools/patrons, or a cuddly
  blanket/knife.
- The target or one of its room-local ancestors has a pointer/grab/crosshair cursor or
  `touch-action:none`. This catches later controls that follow the existing conventions.

Only after a swipe passes every threshold is its trailing synthetic click swallowed. Normal
taps and rejected gestures retain their existing click path.

## Run

From this worktree:

```sh
cd /tmp/wedding-mobile-swipe
node tests/swipe.js
node tests/check.js
node tests/state.js
node tests/play.js
```

For device testing, serve this worktree separately from main:

```sh
cd /tmp/wedding-mobile-swipe
python3 -m http.server 8001
```

Open `http://<machine>:8001/rsvp.html` on a phone. Unlock at least two rooms, then try inward
swipes from empty scene edges as well as the guarded objects listed above.
