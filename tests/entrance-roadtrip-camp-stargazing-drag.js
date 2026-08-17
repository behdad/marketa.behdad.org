#!/usr/bin/env node
// A held mouse/touch pointer traces campsite constellations in canonical order.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<style>#entrance-roadtrip-stargazing-game *{transition:none!important}</style>
<script>
(function () {
  var report = { errors: [] };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function state() { return window.__entranceRoadtripCampStargazingState(); }
  function figure(name) {
    return document.querySelector('[data-stargazing-constellation="' + name + '"]');
  }
  function star(name, index) {
    return figure(name).querySelector('[data-stargazing-star="' + index + '"]');
  }
  function point(node) {
    var hit = node.querySelector(".entrance-roadtrip-stargazing-star-hit");
    var svg = node.ownerSVGElement, local = svg.createSVGPoint();
    local.x = Number(hit.getAttribute("cx"));
    local.y = Number(hit.getAttribute("cy"));
    return local.matrixTransform(document.getElementById("entrance-roadtrip-stargazing-game").getScreenCTM());
  }
  function pointer(node, type, id, pointerType, at, buttons) {
    var event = new PointerEvent(type, {
      bubbles: true, cancelable: true, pointerId: id, pointerType: pointerType,
      isPrimary: true, button: type === "pointerdown" ? 0 : -1,
      buttons: buttons == null ? (type === "pointerup" || type === "pointercancel" ? 0 : 1) : buttons,
      clientX: at.x, clientY: at.y
    });
    node.dispatchEvent(event);
    return event.defaultPrevented;
  }
  function begin(name, index, id, pointerType) {
    var node = star(name, index);
    return { node: node, id: id, pointerType: pointerType, prevented: pointer(node, "pointerdown", id, pointerType, point(node)) };
  }
  function move(drag, name, index) {
    var destination = star(name, index);
    return pointer(drag.node, "pointermove", drag.id, drag.pointerType, point(destination));
  }
  function finish(drag, type, name, index) {
    var destination = star(name, index);
    return pointer(drag.node, type, drag.id, drag.pointerType, point(destination), 0);
  }
  function dragConstellation(name, length, id, pointerType) {
    var drag = begin(name, 0, id, pointerType), prevented = [drag.prevented];
    for (var index = 1; index < length; index++) prevented.push(move(drag, name, index));
    prevented.push(finish(drag, "pointerup", name, length - 1));
    return prevented;
  }
  function clearNight() {
    window.__loftControllers.storm.set(false); window.__loftControllers.rain.set(false); window.__loftControllers.snow.set(false); window.__loftControllers.overcast.set(false);
    if (window.__applyBalconyWeather) window.__applyBalconyWeather();
    window.__setDayNight(true);
  }
  async function prepare() {
    window.__unlockAllRooms();
    window.__goToStage("balcony");
    await sleep(220);
    window.__openEntranceRoom();
    document.querySelector(".hunt-viewport").classList.add("entrance-room-open");
    window.__openEntrancePorscheDriveHud();
    window.__entranceRoadtripDevStart();
    window.__entranceRoadtripSetRoute("camp", 0);
    window.__entranceRoadtripCampFireStart();
    window.__entranceRoadtripCampFirePlace("tinder");
    window.__entranceRoadtripCampFirePlace("twigs");
    window.__entranceRoadtripCampFirePlace("teepee");
    window.__entranceRoadtripCampFireLight(true);
    await sleep(2150);
    window.__entranceRoadtripCampStewOpen();
    window.__entranceRoadtripCampStewSelect("beef");
    window.__entranceRoadtripCampStewSelect("barley");
    window.__entranceRoadtripCampStewCook();
    window.__entranceRoadtripCampStewStep(12000);
    window.__entranceRoadtripCampStewServe();
    clearNight();
    return window.__entranceRoadtripCampStargazingOpen();
  }
  async function run() {
    report.opened = await prepare();
    report.initial = state();

    var wrong = begin("cassiopeia", 2, 41, "touch");
    report.wrongOrder = { prevented: wrong.prevented, progress: state().progress.cassiopeia };

    var first = begin("cassiopeia", 0, 42, "touch");
    var firstMoves = [first.prevented, move(first, "cassiopeia", 1), move(first, "cassiopeia", 2)];
    var pan = new Event("touchmove", { bubbles: true, cancelable: true });
    first.node.dispatchEvent(pan);
    firstMoves.push(finish(first, "pointercancel", "cassiopeia", 2));
    report.cancelled = {
      prevented: firstMoves,
      panPrevented: pan.defaultPrevented,
      progress: state().progress.cassiopeia
    };
    report.cancelledMove = {
      prevented: move(first, "cassiopeia", 3),
      progress: state().progress.cassiopeia
    };

    var second = begin("cassiopeia", 2, 43, "touch");
    var secondPrevented = [second.prevented, move(second, "cassiopeia", 3), move(second, "cassiopeia", 4), finish(second, "pointerup", "cassiopeia", 4)];
    first.node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    report.previousOrigin = { prevented: secondPrevented, progress: state().progress.cassiopeia };

    report.mouseMajor = dragConstellation("ursa-major", 7, 44, "mouse");
    report.mouseMinor = dragConstellation("ursa-minor", 7, 45, "mouse");
    report.complete = state();
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      run().catch(function (error) { report.errors.push(String(error && error.stack || error)); }).then(function () {
        report.errors = (window.__errs || []).concat(report.errors);
        document.getElementById("__report").textContent = JSON.stringify(report);
      });
    }, 320);
  });
})();
</script>`;

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail == null ? "" : "   [" + JSON.stringify(detail) + "]"));
  }
}

console.log("loft-day.html campsite stargazing pointer drag:");
var result = lib.runPageSync("loft-day.html", HARNESS, 7000, {
  forceReduce: true,
  patchRaf: true,
  seedRandom: true,
  urlSuffix: "?date=2026-07-15&time=22:00",
  chromeFlags: "--window-size=1180,900"
});
check(result && result.errors.length === 0, "the drag trace has no uncaught errors", result && result.errors);
check(result && result.opened === true && result.initial.open && !result.initial.complete,
  "a served clear-night campsite opens the canonical trace", result && result.initial);
check(result && !result.wrongOrder.prevented && result.wrongOrder.progress === 0,
  "an out-of-order star neither starts a drag nor advances", result && result.wrongOrder);
check(result && result.cancelled.prevented.every(Boolean) && result.cancelled.panPrevented && result.cancelled.progress === 3,
  "touch drag advances in order, consumes page-pan, and cancels cleanly", result && result.cancelled);
check(result && !result.cancelledMove.prevented && result.cancelledMove.progress === 3,
  "a cancelled pointer cannot keep drawing", result && result.cancelledMove);
check(result && result.previousOrigin.prevented.every(Boolean) && result.previousOrigin.progress === 5,
  "a fresh touch can resume from the previously connected star without a synthetic-click duplicate",
  result && result.previousOrigin);
check(result && result.mouseMajor.every(Boolean) && result.mouseMinor.slice(0, -1).every(Boolean) &&
  result.mouseMinor[result.mouseMinor.length - 1] === false,
  "held mouse drags consume the trace and release immediately on completion",
  result && { major: result.mouseMajor, minor: result.mouseMinor });
check(result && result.complete.complete && !result.complete.open &&
  result.complete.progress.cassiopeia === 5 && result.complete.progress["ursa-major"] === 7 &&
  result.complete.progress["ursa-minor"] === 7,
  "all three drags finish through the existing completion path", result && result.complete);

if (failures) process.exit(1);
console.log("Campsite stargazing drag assertions passed.");
