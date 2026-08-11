#!/usr/bin/env node
"use strict";

// The lower floor uses one persistent bottom-chrome Up/Down control. A still-locked
// adjacent room keeps the same deliberate double-press contract as the main floor.
var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function key(name) {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true }));
  }
  function floorState() {
    var button = document.getElementById("hunt-floor-btn");
    var glyph = getComputedStyle(button, "::before");
    return {
      hidden: button.hidden,
      disabled: button.disabled,
      mark: button.textContent,
      up: button.classList.contains("floor-up"),
      down: button.classList.contains("floor-down"),
      hasAriaLabel: button.hasAttribute("aria-label"),
      hasTitle: button.hasAttribute("title"),
      bottomNavZ: parseInt(getComputedStyle(document.getElementById("hunt-bottom-nav")).zIndex, 10),
      lowerRoomZ: parseInt(getComputedStyle(document.getElementById("lower-room-track")).zIndex, 10),
      room: window.__currentStageName,
      max: window.__maxUnlocked(),
      bathroom: !!window.__bathroomRoomOpen,
      bathroomHidden: document.getElementById("bathroom-room").hidden,
      dungeon: !!(window.__princeState && window.__princeState().basement),
      glyph: {
        content: glyph.content,
        position: glyph.position,
        left: glyph.left,
        top: glyph.top,
        width: glyph.width,
        height: glyph.height,
        borderTop: glyph.borderTopWidth,
        borderRight: glyph.borderRightWidth,
        buttonTransform: getComputedStyle(button).transform
      },
      navigation: window.__floorNavigationState()
    };
  }
  function report() {
    out.errors = out.errors.concat((window.__errs || []).slice());
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(out);
    document.body.appendChild(pre);
  }
  async function run() {
    window.__endAttract();
    window.__resetLowerRoomDiscovery();
    window.__goToStage("kitchen");
    check("fresh upstairs chrome shows a disabled Down until discovery",
      !floorState().hidden && floorState().disabled && !document.getElementById("hunt-dollhouse-btn").hidden, floorState());
    key("ArrowDown");
    await sleep(30);
    check("one Down press leaves the undiscovered lower floor locked",
      !floorState().bathroom && floorState().disabled && !window.__lowerRoomDiscoveryClueState().discovered,
      floorState());
    key("ArrowDown");
    await sleep(30);
    check("the second Down press deliberately discovers and enters downstairs",
      floorState().bathroom && !floorState().disabled && window.__lowerRoomDiscoveryClueState().discovered,
      floorState());
    window.__closeBathroomRoom();
    await sleep(450);
    window.__resetLowerRoomDiscovery();
    var floorSlot = document.querySelector(".hunt-floor-slot");
    floorSlot.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true }));
    await sleep(30);
    check("double-clicking the locked Down deliberately discovers and enters downstairs",
      floorState().bathroom && !floorState().disabled && window.__lowerRoomDiscoveryClueState().discovered,
      floorState());
    window.__closeBathroomRoom();
    await sleep(450);
    window.__resetLowerRoomDiscovery();
    floorSlot.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, cancelable: true, pointerType: "touch" }));
    floorSlot.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, cancelable: true, pointerType: "touch" }));
    await sleep(30);
    check("double-tapping the locked Down performs the same deliberate mobile unlock",
      floorState().bathroom && !floorState().disabled && window.__lowerRoomDiscoveryClueState().discovered,
      floorState());
    window.__closeBathroomRoom();
    await sleep(450);
    window.__resetLowerRoomDiscovery();
    var freshDots = document.getElementById("hunt-dots").getBoundingClientRect();
    var freshDotsCenter = freshDots.left + freshDots.width / 2;

    window.__openBathroomRoom();
    await sleep(30);
    var earlyDown = floorState();
    check("descent keeps the Down chevron before the transition midpoint",
      !earlyDown.hidden && !earlyDown.disabled && earlyDown.mark === "›" && earlyDown.down && !earlyDown.up &&
      !earlyDown.hasAriaLabel && !earlyDown.hasTitle && earlyDown.bathroom &&
      earlyDown.navigation.pending && earlyDown.navigation.target, earlyDown);
    check("vertical floor travel uses the responsive 240ms transition",
      getComputedStyle(document.querySelector(".hunt-viewport")).transitionDuration === "0.24s",
      getComputedStyle(document.querySelector(".hunt-viewport")).transitionDuration);
    var dots = document.getElementById("hunt-dots").getBoundingClientRect();
    var button = document.getElementById("hunt-floor-btn").getBoundingClientRect();
    check("floor control appearance leaves the room dots at their exact center",
      Math.abs(dots.left + dots.width / 2 - freshDotsCenter) < .5,
      { before: freshDotsCenter, after: dots.left + dots.width / 2 });
    check("Up sits to the right of the room dots with breathing room", button.left - dots.right >= 6,
      { dotsRight: dots.right, buttonLeft: button.left });
    check("floor directions use a centered CSS-drawn chevron instead of rotated font metrics",
      earlyDown.glyph.content !== "none" && earlyDown.glyph.position === "absolute" &&
      Math.abs(parseFloat(earlyDown.glyph.left) - parseFloat(earlyDown.glyph.top)) < .1 &&
      Math.abs(parseFloat(earlyDown.glyph.width) - parseFloat(earlyDown.glyph.height)) < .1 &&
      parseFloat(earlyDown.glyph.borderTop) > 0 && parseFloat(earlyDown.glyph.borderRight) > 0 &&
      earlyDown.glyph.buttonTransform === "none", earlyDown.glyph);

    await sleep(130);
    var first = floorState();
    check("descent changes to Up at the transition midpoint",
      first.up && !first.down && !first.disabled &&
      first.navigation.downstairs && !first.navigation.pending, first);
    check("no dedicated floor coach remains in the chrome", !document.getElementById("hunt-floor-coach"));

    document.getElementById("hunt-floor-btn").click();
    await sleep(30);
    var earlyUp = floorState();
    check("ascent keeps Up before the same transition midpoint",
      earlyUp.up && !earlyUp.down && !earlyUp.bathroom && !earlyUp.bathroomHidden &&
      earlyUp.navigation.pending && !earlyUp.navigation.target, earlyUp);
    await sleep(130);
    var upstairs = floorState();
    check("ascent changes to Down at the transition midpoint",
      !upstairs.hidden && upstairs.mark === "›" && upstairs.down && !upstairs.up &&
      !upstairs.bathroom && !upstairs.bathroomHidden && !upstairs.disabled &&
      upstairs.navigation.downstairs === false && !upstairs.navigation.pending, upstairs);
    await sleep(100);
    check("upstairs room owns the viewport at the 240ms settle boundary",
      floorState().bathroomHidden && floorState().down, floorState());
    document.getElementById("hunt-floor-btn").click();
    await sleep(30);
    check("re-descent also keeps Down before the midpoint",
      floorState().bathroom && floorState().down && floorState().navigation.pending, floorState());
    await sleep(130);
    check("re-descent changes to Up at the midpoint", floorState().bathroom && floorState().up, floorState());

    window.__setMaxUnlocked(0);
    var next = document.getElementById("hunt-next");
    next.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 }));
    await sleep(40);
    var pointerFirst = floorState();
    check("one pointer press cannot enter the locked next lower room",
      pointerFirst.room === "kitchen" && pointerFirst.bathroom && pointerFirst.max === 0, pointerFirst);
    next.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 }));
    await sleep(40);
    var pointerSecond = floorState();
    check("the second pointer press unlocks and enters the next lower room",
      pointerSecond.room === "garden" && pointerSecond.dungeon && pointerSecond.max === 1, pointerSecond);
    check("lateral lower-room travel keeps its 720ms slide",
      document.getElementById("lower-room-track").style.transition.indexOf(".72s") !== -1,
      document.getElementById("lower-room-track").style.transition);

    await sleep(760);
    window.__closeMonitorPrince();
    await sleep(760);
    window.__setMaxUnlocked(0);
    window.__goToStage("kitchen");
    window.__openBathroomRoom();
    key("ArrowRight");
    await sleep(40);
    var keyboardFirst = floorState();
    check("one keyboard press cannot enter the locked next lower room",
      keyboardFirst.room === "kitchen" && keyboardFirst.bathroom && keyboardFirst.max === 0, keyboardFirst);
    key("ArrowRight");
    await sleep(40);
    var keyboardSecond = floorState();
    check("the second keyboard press unlocks and enters the next lower room",
      keyboardSecond.room === "garden" && keyboardSecond.dungeon && keyboardSecond.max === 1, keyboardSecond);

    await sleep(760);
    window.__closeMonitorPrince();
    await sleep(760);
    window.__unlockAllRooms();
    window.__goToStage("balcony");
    window.__openEntranceRoom();
    window.__openEntrancePorscheDriveHud();
    window.__toggleEntrancePorscheEngine();
    document.getElementById("entrance-drive-coach-dismiss").dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }));
    document.dispatchEvent(new KeyboardEvent("keydown", {
      key: "Shift", code: "ShiftLeft", shiftKey: true, bubbles: true, cancelable: true
    }));
    document.dispatchEvent(new KeyboardEvent("keydown", {
      key: "ArrowDown", code: "ArrowDown", shiftKey: true, bubbles: true, cancelable: true
    }));
    var shiftedDown = window.__entranceRoomState().drive;
    check("Shift then Down selects reverse without counting as brake",
      shiftedDown.transmission.mode === "auto" && shiftedDown.transmission.range === "R" &&
        !shiftedDown.holds.brake, shiftedDown);
    document.dispatchEvent(new KeyboardEvent("keyup", {
      key: "ArrowDown", code: "ArrowDown", shiftKey: true, bubbles: true, cancelable: true
    }));
    document.dispatchEvent(new KeyboardEvent("keyup", {
      key: "Shift", code: "ShiftLeft", bubbles: true, cancelable: true
    }));
    window.__entranceDriveRange("D");
    window.__entranceRoadtripDevStart();
    await sleep(30);
    check("Road Trip keeps the persistent chrome coach-free",
      !document.getElementById("hunt-floor-coach") && !document.getElementById("hunt-dollhouse-btn").hidden);
    window.__hideEntrancePorscheDriveHud();
    await sleep(30);
    check("leaving Road Trip keeps the same coach-free controls",
      !document.getElementById("hunt-floor-coach") && !document.getElementById("hunt-floor-btn").hidden);
    window.__resetLowerRoomDiscovery();
    window.__cinematic = true;
    document.getElementById("hunt-fullscreen-area").classList.add("cinematic-running");
    window.__markLowerRoomEntered();
    check("Trailer mode does not recreate a player-only floor coach", !document.getElementById("hunt-floor-coach"));
    document.getElementById("hunt-fullscreen-area").classList.remove("cinematic-running");
    window.__cinematic = false;
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      run().catch(function (error) { out.errors.push("harness: " + String(error && error.stack || error)); }).then(report);
    }, 300);
  });
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 7000, { patchRaf: true, seedRandom: true });
if (!result) { console.error("floor navigation: no report"); process.exit(1); }
var failed = false;
result.checks.forEach(function (item) {
  console.log("  " + (item.pass ? "✓" : "✗") + " " + item.name +
    (item.pass || !item.detail ? "" : " — " + JSON.stringify(item.detail)));
  if (!item.pass) failed = true;
});
if (result.errors.length) { failed = true; console.error("runtime errors:\n  " + result.errors.join("\n  ")); }

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
var oldCloseIds = ["bathroom-room-close", "cinema-room-close", "bedroom-room-close", "entrance-room-close"];
var oldClosePresent = oldCloseIds.filter(function (id) { return source.indexOf('id="' + id + '"') !== -1; });
console.log("  " + (!oldClosePresent.length ? "✓" : "✗") + " lower rooms no longer render corner dismiss X controls" +
  (!oldClosePresent.length ? "" : " — " + oldClosePresent.join(", ")));
if (oldClosePresent.length) failed = true;

var noFloorCoach = source.indexOf('id="hunt-floor-coach"') === -1 && source.indexOf("showFloorCoach") === -1;
console.log("  " + (noFloorCoach ? "✓" : "✗") + " floor navigation has no dedicated coach");
if (!noFloorCoach) failed = true;

var allCssChevrons = /\.hunt-nav-prev::before\{transform:[^}]*rotate\(-135deg\)/.test(source) &&
  /\.hunt-nav-next::before\{transform:[^}]*rotate\(45deg\)/.test(source) &&
  /#hunt-floor-btn\.floor-up::before\{transform:[^}]*rotate\(-45deg\)/.test(source) &&
  /#hunt-floor-btn\.floor-down::before\{transform:[^}]*rotate\(135deg\)/.test(source);
console.log("  " + (allCssChevrons ? "✓" : "✗") + " room and floor controls share the CSS-drawn chevron primitive");
if (!allCssChevrons) failed = true;

if (failed) process.exit(1);
console.log("floor navigation: all checks passed");
