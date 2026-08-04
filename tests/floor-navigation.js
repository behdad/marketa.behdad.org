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
    var coach = document.getElementById("hunt-floor-coach");
    var glyph = getComputedStyle(button, "::before");
    return {
      hidden: button.hidden,
      mark: button.textContent,
      up: button.classList.contains("floor-up"),
      down: button.classList.contains("floor-down"),
      hasAriaLabel: button.hasAttribute("aria-label"),
      hasTitle: button.hasAttribute("title"),
      coachHidden: coach.hidden,
      coach: coach.textContent,
      coachZ: parseInt(getComputedStyle(coach).zIndex, 10),
      bottomNavZ: parseInt(getComputedStyle(document.getElementById("hunt-bottom-nav")).zIndex, 10),
      lowerRoomZ: parseInt(getComputedStyle(document.getElementById("lower-room-track")).zIndex, 10),
      room: window.currentStageName,
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
    window.goToStage("kitchen");
    check("fresh upstairs chrome hides Down until discovery", floorState().hidden, floorState());
    var freshDots = document.getElementById("hunt-dots").getBoundingClientRect();
    var freshDotsCenter = freshDots.left + freshDots.width / 2;

    window.__openBathroomRoom();
    await sleep(30);
    var earlyDown = floorState();
    check("descent keeps the Down chevron before the transition midpoint",
      !earlyDown.hidden && earlyDown.mark === "›" && earlyDown.down && !earlyDown.up &&
      !earlyDown.hasAriaLabel && !earlyDown.hasTitle && earlyDown.bathroom &&
      earlyDown.coachHidden && earlyDown.navigation.pending && earlyDown.navigation.target, earlyDown);
    check("vertical floor travel uses the shorter 400ms transition",
      getComputedStyle(document.querySelector(".hunt-viewport")).transitionDuration === "0.4s",
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

    await sleep(210);
    var first = floorState();
    check("descent changes to Up at the transition midpoint and reveals its coach",
      first.up && !first.down && !first.coachHidden && first.coach === "Up gets you back." &&
      first.navigation.downstairs && !first.navigation.pending, first);
    check("the Up coach paints above the active lower-room scene",
      first.coachZ > 0 && first.bottomNavZ > first.lowerRoomZ,
      { coach: first.coachZ, bottomNav: first.bottomNavZ, lowerRoom: first.lowerRoomZ });
    await sleep(220);
    check("first-arrival coach remains after the lower room settles", !floorState().coachHidden, floorState());
    window.__bathroomRoomOpen = false;
    window.__syncFloorNavigation();
    await sleep(220);
    check("ownership churn cannot retire the coach while navigation reads upstairs",
      floorState().down && !floorState().coachHidden, floorState());
    window.__bathroomRoomOpen = true;
    window.__syncFloorNavigation();
    await sleep(220);
    check("ownership recovery restores Up without retiring the coach",
      floorState().up && !floorState().coachHidden, floorState());

    setLang("cs");
    var czech = floorState();
    check("the live coach switches to Czech without adding control labels",
      !czech.hasAriaLabel && !czech.hasTitle && czech.coach === "Nahoru se vrátíš.", czech);
    setLang("en");

    document.getElementById("hunt-floor-btn").click();
    await sleep(30);
    var earlyUp = floorState();
    check("ascent keeps Up before the same transition midpoint",
      earlyUp.up && !earlyUp.down && !earlyUp.bathroom && !earlyUp.bathroomHidden &&
      earlyUp.coachHidden && earlyUp.navigation.pending && !earlyUp.navigation.target, earlyUp);
    await sleep(210);
    var upstairs = floorState();
    check("ascent changes to Down at the transition midpoint",
      !upstairs.hidden && upstairs.mark === "›" && upstairs.down && !upstairs.up &&
      !upstairs.bathroom && !upstairs.bathroomHidden && upstairs.coachHidden &&
      upstairs.navigation.downstairs === false && !upstairs.navigation.pending, upstairs);
    await sleep(200);
    check("upstairs room owns the viewport at the 400ms settle boundary",
      floorState().bathroomHidden && floorState().down, floorState());
    document.getElementById("hunt-floor-btn").click();
    await sleep(30);
    check("re-descent also keeps Down before the midpoint",
      floorState().bathroom && floorState().down && floorState().navigation.pending, floorState());
    await sleep(210);
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
    window.goToStage("kitchen");
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
    window.goToStage("balcony");
    window.__openEntranceRoom();
    window.__openEntrancePorscheDriveHud();
    window.__toggleEntrancePorscheEngine();
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
    var coach = document.getElementById("hunt-floor-coach");
    coach.hidden = false;
    window.__entranceDriveRange("D");
    window.__entranceRoadtripStart();
    await sleep(30);
    check("the Up coach stays out of the active Road Trip",
      getComputedStyle(coach).display === "none" && !coach.hidden,
      { display: getComputedStyle(coach).display, hidden: coach.hidden });
    window.__hideEntrancePorscheDriveHud();
    await sleep(30);
    check("the preserved Up coach returns after Road Trip",
      getComputedStyle(coach).display !== "none" && !coach.hidden,
      { display: getComputedStyle(coach).display, hidden: coach.hidden });
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

var coachHasExpiry = /floorCoachTimer|setTimeout\s*\(\s*hideFloorCoach/.test(source);
console.log("  " + (!coachHasExpiry ? "✓" : "✗") + " first-arrival Up coach has no timed expiry");
if (coachHasExpiry) failed = true;

var allCssChevrons = /\.hunt-nav-prev::before\{transform:[^}]*rotate\(-135deg\)/.test(source) &&
  /\.hunt-nav-next::before\{transform:[^}]*rotate\(45deg\)/.test(source) &&
  /#hunt-floor-btn\.floor-up::before\{transform:[^}]*rotate\(-45deg\)/.test(source) &&
  /#hunt-floor-btn\.floor-down::before\{transform:[^}]*rotate\(135deg\)/.test(source);
console.log("  " + (allCssChevrons ? "✓" : "✗") + " room and floor controls share the CSS-drawn chevron primitive");
if (!allCssChevrons) failed = true;

if (failed) process.exit(1);
console.log("floor navigation: all checks passed");
