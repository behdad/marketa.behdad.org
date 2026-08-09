#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");
var source = fs.readFileSync(path.join(lib.ROOT, "loft-day.html"), "utf8");
var failures = 0;

function check(ok, label, detail) {
  console.log("  " + (ok ? "✓ " : "✗ ") + label);
  if (!ok) {
    failures++;
    if (detail !== undefined) console.log("    " + JSON.stringify(detail));
  }
}

check(source.indexOf('id="entrance-roadtrip-headlights"') >= 0 &&
  source.indexOf('id="entrance-roadtrip-headlight-left"') >= 0 &&
  source.indexOf('id="entrance-roadtrip-headlight-right"') >= 0,
  "the highway owns one forward headlight group and two beams");
var beamAt = source.indexOf('<g id="entrance-roadtrip-headlights"');
var furnitureAt = source.indexOf('<g id="entrance-roadtrip-furniture"');
var entitiesAt = source.indexOf('<g id="entrance-roadtrip-entities"');
var rainAt = source.indexOf('<g id="entrance-roadtrip-rain"');
check(beamAt >= 0 && beamAt < furnitureAt && beamAt < entitiesAt && beamAt < rainAt,
  "beams paint below road furniture, targets, and weather");

var harness = String.raw`<pre id="__report">pending</pre>
<script>
(async function () {
  var report = { errors: [] };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function opacity(node) { return parseFloat(getComputedStyle(node).opacity); }
  try {
    Object.defineProperty(document, "hasFocus", { value: function () { return true; }, configurable: true });
    window.__unlockAllRooms();
    window.goToStage("balcony");
    window.night();
    await sleep(80);
    window.__openEntranceRoom();
    window.__openEntrancePorscheDriveHud();
    if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
    window.__entranceRoadtripDevStart();
    window.__entranceDriveSetMotion(90, 3);
    window.__entranceRoadtripSetDistance(158);
    var room = document.getElementById("entrance-room");
    var group = document.getElementById("entrance-roadtrip-headlights");
    var left = document.getElementById("entrance-roadtrip-headlight-left");
    group.style.transition = "none";
    report.night = {
      roomClass: room.getAttribute("class"),
      visible: group.getAttribute("visibility"),
      opacity: opacity(group),
      d: left.getAttribute("d"),
      aim: Number(group.getAttribute("data-roadtrip-aim-x")),
      mirrorContainsBeam: !!document.getElementById("entrance-roadtrip-mirror").querySelector("#entrance-roadtrip-headlights")
    };
    document.getElementById("entrance-porsche-headlight").dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await sleep(30);
    report.switchedOff = { roomClass: room.getAttribute("class"), opacity: opacity(group) };
    document.getElementById("entrance-porsche-headlight").dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    window.__setBalconySnow(false, "test");
    window.__setBalconyRain(true, "test");
    await sleep(40);
    report.rain = { roomClass: room.getAttribute("class"), opacity: opacity(group) };
    var beforeSteer = left.getAttribute("d");
    var beforeAim = Number(group.getAttribute("data-roadtrip-aim-x"));
    var beforeLane = window.__entranceRoomState().drive.roadtrip.playerLane;
    window.__entranceDriveControl("steerRight", true);
    window.__entranceDriveStep(320);
    window.__entranceDriveControl("steerRight", false);
    var steeringAngle = window.__entranceRoomState().drive.steeringAngle;
    window.__entranceRoadtripSetDistance(158);
    window.__entranceRoadtripSetLane(beforeLane);
    report.steer = {
      before: beforeSteer,
      after: left.getAttribute("d"),
      beforeAim: beforeAim,
      afterAim: Number(group.getAttribute("data-roadtrip-aim-x")),
      amount: steeringAngle
    };
    window.day();
    await sleep(80);
    report.day = { roomClass: room.getAttribute("class"), opacity: opacity(group) };
  } catch (error) {
    report.errors.push(String(error && error.stack || error));
  }
  report.errors = (window.__errs || []).concat(report.errors);
  document.getElementById("__report").textContent = JSON.stringify(report);
})();
</script>`;

var result = lib.runPageSync("loft-day.html", harness, 3500, {
  patchRaf: true,
  forceMotion: true,
  urlSuffix: "?date=2026-09-22&time=22:00",
  chromeFlags: "--autoplay-policy=no-user-gesture-required --window-size=1100,900"
});
check(result && result.errors.length === 0, "night-driving probe has no page errors", result && result.errors);
check(result && result.night.visible === "visible" && result.night.opacity >= .6 &&
  /roadtrip-headlights-on/.test(result.night.roomClass) && /^M/.test(result.night.d || "") &&
  !result.night.mirrorContainsBeam,
  "night driving shows lit forward beams but never puts them in the mirror", result && result.night);
check(result && result.switchedOff && result.switchedOff.opacity < result.night.opacity * .35 &&
  !/roadtrip-headlights-on/.test(result.switchedOff.roomClass),
  "the physical headlight switch reduces the night beam", result && result.switchedOff);
check(result && result.rain && result.rain.opacity >= result.night.opacity && /entrance-raining/.test(result.rain.roomClass),
  "rain scatters a still-visible beam instead of hiding it", result && result.rain);
check(result && result.steer && result.steer.amount > 2 &&
  Math.abs(result.steer.afterAim - result.steer.beforeAim) < .001,
  "the car-body headlight wash stays fixed while the steering wheel turns", result && result.steer);
check(result && result.day && result.day.opacity === 0 && /entrance-day/.test(result.day.roomClass),
  "daylight removes the highway beam", result && result.day);

if (failures) process.exit(1);
console.log("Entrance roadtrip headlight assertions passed.");
