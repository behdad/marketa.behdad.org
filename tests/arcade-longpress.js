#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [], steps: {} };
  function hold(name, host, target) {
    window.__closeSceneContextMenu();
    if (name) host.classList.add(name);
    target.dispatchEvent(new Event("touchstart", { bubbles: true, cancelable: true }));
    var event = new MouseEvent("contextmenu", {
      bubbles: true, cancelable: true, clientX: 120, clientY: 120
    });
    var prevented = !target.dispatchEvent(event);
    var menu = window.__sceneContextMenu();
    var selected = getComputedStyle(target).userSelect;
    if (name) host.classList.remove(name);
    return { prevented: prevented, menu: menu, userSelect: selected };
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        window.__unlockAllRooms();
        window.__goToStage("office");
        var kitchen = document.getElementById("stage-kitchen");
        var office = document.getElementById("stage-office");
        var balcony = document.getElementById("stage-balcony");
        var roomPacman = document.getElementById("pacman-room-overlay");
        var monitor = document.getElementById("office-monitor");
        var roomPacmanWasHidden = roomPacman.hidden;
        roomPacman.hidden = false;
        report.steps.flair = hold("flair-on", kitchen, document.getElementById("kitchen-flair-dim"));
        report.steps.invaders = hold("arcade", office, document.getElementById("office-chair"));
        report.steps.tetris = hold("tetris-on", balcony, document.getElementById("balcony-tetris-ui"));
        report.steps.roomPacman = hold("", roomPacman, document.getElementById("pacman-room-host"));
        report.steps.monitorPacman = hold("show-pacman", monitor, document.getElementById("monitor-pacman-wrap"));
        roomPacman.hidden = roomPacmanWasHidden;
        window.__goToStage("balcony");
        window.__openEntranceRoom();
        report.steps.entranceCar = hold("", document.getElementById("entrance-room"),
          document.getElementById("entrance-porsche"));
        window.__closeEntranceRoom();
        window.__closeSceneContextMenu();
        office.classList.add("arcade");
        var desktop = new MouseEvent("contextmenu", {
          bubbles: true, cancelable: true, clientX: 130, clientY: 130
        });
        document.getElementById("office-chair").dispatchEvent(desktop);
        report.steps.desktop = { menu: window.__sceneContextMenu() };
        office.classList.remove("arcade");
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
      }
      report.errors = (window.__errs || []).concat(report.errors);
      document.getElementById("__report").textContent = JSON.stringify(report);
    }, 180);
  });
})();
</script>`;

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : ""));
  }
}

console.log("rsvp.html mobile arcade long-press:");
var result = lib.runPageSync("rsvp.html", HARNESS, 6500, {
  chromeFlags: "--window-size=390,844"
});
if (!result) {
  console.log("  ✗ harness produced no report");
  process.exit(1);
}
check(result.errors.length === 0, "no uncaught page errors", result.errors);
["flair", "invaders", "tetris", "roomPacman", "monitorPacman"].forEach(function (name) {
  var step = result.steps[name];
  check(step && step.prevented && step.menu.length === 0 && step.userSelect === "none",
    name + " consumes a touch-generated context menu without opening Solve/Escape", step);
});
check(result.steps.desktop && result.steps.desktop.menu.length > 0,
  "an ordinary desktop right-click remains available", result.steps.desktop);
check(result.steps.entranceCar && result.steps.entranceCar.prevented &&
  result.steps.entranceCar.menu.length === 0,
  "a downstairs car hold never leaks the phase-one Solve menu", result.steps.entranceCar);

if (failures) {
  console.log("\n" + failures + " arcade long-press assertion(s) failed.");
  process.exit(1);
}
console.log("\nArcade long-press assertions passed.");
