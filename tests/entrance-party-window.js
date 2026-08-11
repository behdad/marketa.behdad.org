#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var harness = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [] };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function state() { return window.__entranceRoomState(); }
  function openEntrance() {
    window.__goToStage("balcony");
    window.__openEntranceRoom();
  }
  function activate(target, pointerType, detail) {
    var rect = target.getBoundingClientRect(), x = rect.left + rect.width / 2,
      y = rect.top + rect.height / 2;
    target.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, cancelable: true, pointerId: 31, pointerType: pointerType,
      isPrimary: true, button: 0, buttons: 1, clientX: x, clientY: y
    }));
    target.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, cancelable: true, pointerId: 31, pointerType: pointerType,
      isPrimary: true, button: 0, buttons: 0, clientX: x, clientY: y
    }));
    target.dispatchEvent(new MouseEvent("click", {
      bubbles: true, cancelable: true, detail: detail, clientX: x, clientY: y
    }));
  }
  function enter(target) {
    target.dispatchEvent(new KeyboardEvent("keydown", {
      bubbles: true, cancelable: true, key: "Enter", code: "Enter"
    }));
  }
  window.addEventListener("load", function () { setTimeout(async function () {
    try {
      Object.defineProperty(document, "hasFocus", {
        value: function () { return true; }, configurable: true
      });
      window.__unlockAllRooms();
      var home = document.getElementById("entrance-window-mid-left");
      var hit = home.querySelector(".entrance-hit");
      var art = document.getElementById("entrance-window-view-mid-left");

      openEntrance();
      document.querySelector(".hunt-viewport").scrollIntoView({ block: "center" });
      await sleep(50);
      var hitRect = hit.getBBox(), artRect = art.getBBox();
      report.geometry = {
        hit: [hitRect.x, hitRect.y, hitRect.width, hitRect.height],
        art: [artRect.x, artRect.y, artRect.width, artRect.height],
        owner: hit.closest(".entrance-prop") && hit.closest(".entrance-prop").id,
        tabindex: home.getAttribute("tabindex"),
        role: home.getAttribute("role")
      };

      activate(hit, "mouse", 1);
      report.partyOff = { room: window.__currentStageName, entrance: state() };

      window.__setGardenParty(true, false);
      report.partyArt = {
        party: !!window.__gardenPartyOn,
        grooving: document.getElementById("entrance-room-art").classList.contains("grooving"),
        animation: getComputedStyle(art).animationName
      };
      activate(hit, "mouse", 1);
      report.mouse = { room: window.__currentStageName, entrance: state() };

      openEntrance();
      await sleep(50);
      enter(document.querySelector(".hunt-viewport"));
      report.enter = { room: window.__currentStageName, entrance: state() };
      activate(home, "mouse", 1);
      report.hudGate = { room: window.__currentStageName, entrance: state() };
      window.__dismissEntrancePorscheDriveHud();

      enter(home);
      report.keyboard = {
        room: window.__currentStageName,
        entrance: state(),
        active: document.activeElement && document.activeElement.id
      };

      activate(home, "touch", 1);
      report.touch = { room: window.__currentStageName, entrance: state() };
    } catch (error) {
      report.errors.push(String(error && error.stack || error));
    }
    document.getElementById("__report").textContent = JSON.stringify(report);
  }, 260); });
})();
</script>`;

function run(width, height, coarse) {
  return lib.runPageSync("rsvp.html", harness, 2600, {
    patchRaf: true,
    forceMotion: true,
    forceCoarsePointer: coarse,
    chromeFlags: "--window-size=" + width + "," + height
  });
}

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + "   [" + JSON.stringify(detail) + "]"); }
}
function checkRun(result, label) {
  var tolerance = 5, g = result && result.geometry;
  check(result && result.errors.length === 0, label + " has no uncaught errors", result && result.errors);
  check(g && g.owner === "entrance-window-mid-left" && g.tabindex === null && g.role === null &&
    g.hit[0] <= g.art[0] + tolerance && g.hit[1] <= g.art[1] + tolerance &&
    g.hit[0] + g.hit[2] >= g.art[0] + g.art[2] - tolerance &&
    g.hit[1] + g.hit[3] >= g.art[1] + g.art[3] - tolerance,
    label + " keeps the pointer-only hit surface aligned over the home window", g);
  check(result && result.partyOff && result.partyOff.room === "balcony" &&
    result.partyOff.entrance.open && !result.partyOff.entrance.drive.hud,
    label + " leaves the shortcut inert while the party is off", result && result.partyOff);
  check(result && result.partyArt && result.partyArt.party && result.partyArt.grooving &&
    result.partyArt.animation === "entrance-glass-home-beat",
    label + " reuses the home window's existing live-party treatment", result && result.partyArt);
  check(result && result.mouse && result.mouse.room === "garden" && !result.mouse.entrance.open,
    label + " pointer click closes Entrance and returns to the Garden party", result && result.mouse);
  check(result && result.enter && result.enter.room === "balcony" && result.enter.entrance.open &&
    result.enter.entrance.drive.hud,
    label + " global Enter still opens the driving HUD", result && result.enter);
  check(result && result.hudGate && result.hudGate.room === "balcony" && result.hudGate.entrance.open &&
    result.hudGate.entrance.drive.hud,
    label + " the party window cannot steal a click from the HUD", result && result.hudGate);
  check(result && result.keyboard && result.keyboard.room === "balcony" &&
    result.keyboard.entrance.open && !result.keyboard.entrance.drive.hud &&
    result.keyboard.active !== "entrance-window-mid-left",
    label + " keyboard activation never uses or focuses the pointer shortcut", result && result.keyboard);
  check(result && result.touch && result.touch.room === "garden" && !result.touch.entrance.open,
    label + " touch tap closes Entrance and returns to the Garden party", result && result.touch);
}

console.log("rsvp.html Entrance party-window shortcut:");
checkRun(run(1100, 900, false), "desktop");
checkRun(run(390, 844, true), "mobile");

if (failures) process.exit(1);
console.log("\nEntrance party-window assertions passed.");
