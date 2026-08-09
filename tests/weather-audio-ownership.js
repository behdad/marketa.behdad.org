#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>(function () {
  var report = { errors: [], steps: {}, thunder: [] };
  var focused = true, visibility = "visible";
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function car() { return window.__entranceRoomState().car; }
  function click(id) {
    document.getElementById(id).dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  }
  function setExposure(name) {
    var state = car();
    var wantRoof = name === "roof-open" || name === "all-open";
    var wantWindow = name === "windows-open" || name === "door-window-open" || name === "all-open";
    var wantDoor = name === "door-open" || name === "door-window-open" || name === "all-open";
    if (!!state.roofOpen !== wantRoof) click("entrance-porsche-roof");
    state = car();
    if (!!state.windowOpen !== wantWindow) click("entrance-porsche-window");
    state = car();
    if (!!state.doorOpen !== wantDoor) click("entrance-porsche-door");
    return car();
  }
  function rainState() { return window.__entranceDriveWeatherAudioState(); }
  async function fire(label) {
    var before = report.thunder.length;
    var scene = window.__autonomousThunderScene();
    window.triggerBalconyThunder();
    await sleep(370);
    report.steps[label] = { scene: scene, calls: report.thunder.slice(before) };
  }
  try {
    Object.defineProperty(document, "hasFocus", { configurable: true, value: function () { return focused; } });
    Object.defineProperty(document, "hidden", { configurable: true, get: function () { return visibility === "hidden"; } });
    Object.defineProperty(document, "visibilityState", { configurable: true, get: function () { return visibility; } });
  } catch (_error) {}
  window.addEventListener("load", function () { setTimeout(async function () { try {
    Math.random = function () { return 0; };
    window.playThunderSound = function (volume, pan, enclosure) {
      report.thunder.push({ volume: volume, pan: pan, enclosure: enclosure || null,
        scene: window.__autonomousThunderScene() });
    };
    window.__unlockAllRooms();
    window.__setSecondRound(true, { releaseHeld: false });

    var indoor = {};
    for (var i = 0; i < 4; i++) {
      var name = ["kitchen", "garden", "cuddly", "office"][i];
      window.goToStage(name);
      var before = report.thunder.length;
      window.triggerBalconyThunder();
      await sleep(370);
      indoor[name] = { scene: window.__autonomousThunderScene(), calls: report.thunder.length - before };
    }
    report.steps.indoor = indoor;

    window.goToStage("balcony");
    await fire("balcony");
    var queuedBefore = report.thunder.length;
    window.triggerBalconyThunder();
    window.goToStage("office");
    await sleep(370);
    report.steps.queuedLeave = { calls: report.thunder.length - queuedBefore,
      scene: window.__autonomousThunderScene() };

    window.goToStage("balcony");
    window.__openEntranceRoom();
    document.querySelector(".hunt-viewport").classList.add("entrance-room-open");
    await fire("entrance");

    window.__setBalconyRain(true, "test");
    window.__updateWind(); window.__updateRainSound(); await sleep(80);
    report.steps.exteriorFacade = {
      wind: window.__exteriorWindAudioState(), rain: window.__exteriorRainAudioState()
    };
    focused = false; window.dispatchEvent(new Event("blur")); await sleep(30);
    report.steps.exteriorBlur = {
      wind: window.__exteriorWindAudioState(), rain: window.__exteriorRainAudioState()
    };
    focused = true; window.dispatchEvent(new Event("focus")); await sleep(80);
    report.steps.exteriorRefocus = {
      wind: window.__exteriorWindAudioState(), rain: window.__exteriorRainAudioState()
    };

    window.__openEntrancePorscheDriveHud();
    report.steps.exteriorStreetHud = {
      wind: window.__exteriorWindAudioState(), rain: window.__exteriorRainAudioState()
    };
    window.__updatePorscheDriveWeatherAudio(); await sleep(80);
    report.steps.streetEngineOffRain = rainState();
    window.__toggleEntrancePorscheEngine();
    window.__updatePorscheDriveWeatherAudio();
    await sleep(80);
    // The real roof/window controls must repaint the branch themselves; do not use the
    // weather test seam between these snapshots or a stale cabin profile could pass.
    setExposure("closed");
    var streetClosed = rainState();
    await fire("streetThunderClosed");
    setExposure("door-open");
    var streetDoor = rainState();
    await fire("streetThunderDoor");
    setExposure("windows-open");
    var streetWindow = rainState();
    await fire("streetThunderWindows");
    setExposure("door-window-open");
    var streetDoorWindow = rainState();
    await fire("streetThunderDoorWindow");
    setExposure("roof-open");
    var streetRoof = rainState();
    await fire("streetThunderRoof");
    setExposure("all-open");
    var streetAll = rainState();
    await fire("streetThunderAll");
    report.steps.streetRain = { closed: streetClosed, door: streetDoor, windows: streetWindow,
      doorWindow: streetDoorWindow, roof: streetRoof, all: streetAll };

    focused = false; window.dispatchEvent(new Event("blur")); await sleep(30);
    report.steps.rainBlur = rainState();
    focused = true; window.dispatchEvent(new Event("focus")); await sleep(80);
    report.steps.rainRefocus = rainState();
    visibility = "hidden"; document.dispatchEvent(new Event("visibilitychange")); await sleep(30);
    report.steps.rainHidden = rainState();
    visibility = "visible"; document.dispatchEvent(new Event("visibilitychange")); await sleep(80);
    report.steps.rainVisible = rainState();

    window.__entranceRoadtripDevStart();
    window.__entranceRoadtripSetRoute("banff", 0);
    setExposure("closed");
    var highwayClosed = rainState();
    setExposure("windows-open");
    var highwayWindow = rainState();
    setExposure("roof-open");
    var highwayRoof = rainState();
    report.steps.highwayRain = { closed: highwayClosed, windows: highwayWindow, roof: highwayRoof };

    // Arm under one exposure, then change it during the flash-to-rumble delay. The
    // recorded enclosure must be the state at playback, never the stale arm-time state.
    setExposure("closed");
    var delayedBefore = report.thunder.length;
    window.triggerBalconyThunder();
    setExposure("roof-open");
    await sleep(370);
    report.steps.roadtripDelayedExposure = {
      calls: report.thunder.slice(delayedBefore), current: window.__entranceThunderEnclosure()
    };
    setExposure("windows-open"); await fire("roadtripWindows");
    setExposure("closed"); await fire("roadtripClosed");

    window.__toggleEntranceRoadtripTransport();
    var pausedBefore = report.thunder.length;
    window.triggerBalconyThunder(); await sleep(370);
    report.steps.roadtripPaused = { scene: window.__autonomousThunderScene(),
      calls: report.thunder.length - pausedBefore, rain: rainState() };
    window.__toggleEntranceRoadtripTransport();

    window.__entranceRoadtripSetRoute("camp", 0);
    await fire("camping");
    report.steps.campingRain = rainState();

    window.__exitEntranceRoadtrip(); await sleep(30);
    report.steps.dismissed = rainState();
    window.__hideEntrancePorscheDriveHud(); await sleep(80);
    report.steps.exteriorFacadeReturn = {
      wind: window.__exteriorWindAudioState(), rain: window.__exteriorRainAudioState()
    };
    window.__closeEntranceRoom(); await sleep(30);
    report.steps.exteriorExit = {
      wind: window.__exteriorWindAudioState(), rain: window.__exteriorRainAudioState()
    };
    window.__setBalconyRain(false, "test");
  } catch (error) { report.errors.push("harness: " + String(error && error.stack || error)); }
  report.errors = (window.__errs || []).concat(report.errors);
  document.getElementById("__report").textContent = JSON.stringify(report);
  }, 260); });
})();</script>`;

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? " — " + JSON.stringify(detail) : "")); }
}
function exposureOrder(row) {
  return row && row.closed.rain.active && row.windows.rain.active && row.roof.rain.active &&
    row.closed.rain.scene === row.windows.rain.scene && row.windows.rain.scene === row.roof.rain.scene &&
    row.closed.rain.gain < row.windows.rain.gain && row.windows.rain.gain < row.roof.rain.gain &&
    row.closed.rain.cutoff < row.windows.rain.cutoff && row.windows.rain.cutoff < row.roof.rain.cutoff &&
    row.roof.rain.gain >= row.windows.rain.gain * 2 &&
    row.windows.rain.gain >= row.closed.rain.gain * 3 &&
    row.windows.rain.cutoff >= row.closed.rain.cutoff * 5;
}
function audibleCabinRain(row) {
  return row && row.roof.rain.gain >= .24 && row.windows.rain.gain >= .11 &&
    row.closed.rain.gain >= .035;
}

console.log("rsvp.html weather-audio ownership:");
var result = lib.runPageSync("rsvp.html", HARNESS, 10000, {
  patchRaf: true,
  chromeFlags: "--autoplay-policy=no-user-gesture-required --window-size=1100,900"
});
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "weather ownership has no uncaught errors", result.errors);
check(s.indoor && ["kitchen", "garden", "cuddly", "office"].every(function (name) {
  return s.indoor[name] && s.indoor[name].scene === null && s.indoor[name].calls === 0;
}), "autonomous thunder stays silent in every indoor loft room", s.indoor);
check(s.balcony && s.balcony.scene === "balcony" && s.balcony.calls.length === 1 &&
  !s.balcony.calls[0].enclosure, "Balcony owns unfiltered autonomous thunder", s.balcony);
check(s.queuedLeave && s.queuedLeave.calls === 0 && s.queuedLeave.scene === null,
  "leaving an allowed scene cancels its already-queued rumble", s.queuedLeave);
check(s.entrance && s.entrance.scene === "entrance" && s.entrance.calls.length === 1 &&
  !s.entrance.calls[0].enclosure, "Entrance owns unfiltered autonomous thunder", s.entrance);
check(s.exteriorFacade && s.exteriorFacade.wind.active && s.exteriorFacade.wind.source &&
  s.exteriorFacade.wind.where === "entrance" && s.exteriorFacade.wind.output === "outdoor" &&
  s.exteriorFacade.wind.targetGain > 0 && s.exteriorFacade.rain.active &&
  s.exteriorFacade.rain.source && s.exteriorFacade.rain.where === "entrance" &&
  s.exteriorFacade.rain.output === "outdoor" && s.exteriorFacade.rain.targetGain > 0,
  "the Entrance façade owns full outdoor wind and visual-rain beds", s.exteriorFacade);
check(s.exteriorBlur && !s.exteriorBlur.wind.active && !s.exteriorBlur.rain.active &&
  s.exteriorRefocus && s.exteriorRefocus.wind.active && s.exteriorRefocus.rain.active &&
  s.exteriorRefocus.wind.where === "entrance" && s.exteriorRefocus.rain.where === "entrance",
  "Entrance exterior weather tears down on blur and returns as one attended owner", {
    blur: s.exteriorBlur, refocus: s.exteriorRefocus
  });
check(s.exteriorStreetHud && !s.exteriorStreetHud.wind.active && !s.exteriorStreetHud.rain.active,
  "opening the street HUD retires the exterior beds before cabin weather takes ownership",
  s.exteriorStreetHud);
check(s.streetEngineOffRain && s.streetEngineOffRain.bedActive &&
  s.streetEngineOffRain.sources === 1 && s.streetEngineOffRain.dedicatedRainSource &&
  s.streetEngineOffRain.rain.active && s.streetEngineOffRain.rain.gain >= .035,
  "HUD rain is audible before ignition", s.streetEngineOffRain);
check(s.streetThunderClosed && s.streetThunderClosed.scene === "street" &&
  s.streetThunderClosed.calls.length === 1 &&
  s.streetThunderClosed.calls[0].enclosure.exposure === "closed" &&
  s.streetThunderDoor && s.streetThunderDoor.calls.length === 1 &&
  s.streetThunderDoor.calls[0].enclosure.exposure === "windows-open" &&
  s.streetThunderWindows && s.streetThunderWindows.calls.length === 1 &&
  s.streetThunderWindows.calls[0].enclosure.exposure === "windows-open" &&
  s.streetThunderRoof && s.streetThunderRoof.calls.length === 1 &&
  s.streetThunderRoof.calls[0].enclosure.exposure === "roof-open" &&
  s.streetThunderClosed.calls[0].enclosure.gain < s.streetThunderWindows.calls[0].enclosure.gain &&
  s.streetThunderWindows.calls[0].enclosure.gain < s.streetThunderRoof.calls[0].enclosure.gain &&
  s.streetThunderClosed.calls[0].enclosure.cutoff < s.streetThunderWindows.calls[0].enclosure.cutoff &&
  s.streetThunderWindows.calls[0].enclosure.cutoff < s.streetThunderRoof.calls[0].enclosure.cutoff,
  "Entrance street thunder follows closed, side-opening, and roof-open exposure", {
    closed: s.streetThunderClosed, door: s.streetThunderDoor,
    windows: s.streetThunderWindows, roof: s.streetThunderRoof
  });
check(s.streetThunderDoorWindow && s.streetThunderDoorWindow.calls.length === 1 &&
  s.streetThunderAll && s.streetThunderAll.calls.length === 1 &&
  s.streetThunderDoorWindow.calls[0].enclosure.gain === s.streetThunderWindows.calls[0].enclosure.gain &&
  s.streetThunderDoorWindow.calls[0].enclosure.cutoff === s.streetThunderWindows.calls[0].enclosure.cutoff &&
  s.streetThunderAll.calls[0].enclosure.gain === s.streetThunderRoof.calls[0].enclosure.gain &&
  s.streetThunderAll.calls[0].enclosure.cutoff === s.streetThunderRoof.calls[0].enclosure.cutoff,
  "multiple cabin openings do not stack the thunder exposure boost", {
    doorWindow: s.streetThunderDoorWindow, all: s.streetThunderAll
  });
check(exposureOrder(s.streetRain) && audibleCabinRain(s.streetRain) &&
  s.streetRain.closed.rain.scene === "street" &&
  s.streetRain.closed.sources === 1 && s.streetRain.windows.sources === 1 &&
  s.streetRain.roof.sources === 1 && s.streetRain.closed.dedicatedRainSource,
  "street driving rain owns one bounded cabin bed and follows all three exposures", s.streetRain);
check(s.streetRain && s.streetRain.door.rain.exposure === "windows-open" &&
  s.streetRain.door.rain.gain === s.streetRain.windows.rain.gain &&
  s.streetRain.door.rain.cutoff === s.streetRain.windows.rain.cutoff &&
  s.streetRain.doorWindow.rain.gain === s.streetRain.windows.rain.gain &&
  s.streetRain.doorWindow.rain.cutoff === s.streetRain.windows.rain.cutoff &&
  s.streetRain.all.rain.gain === s.streetRain.roof.rain.gain &&
  s.streetRain.all.rain.cutoff === s.streetRain.roof.rain.cutoff &&
  [s.streetRain.door, s.streetRain.doorWindow, s.streetRain.all].every(function (state) {
    return state.sources === 1 && state.dedicatedRainSource;
  }), "an open door raises cabin rain without duplicating or stacking its source", s.streetRain);
check(s.rainBlur && !s.rainBlur.bedActive && s.rainBlur.sources === 0 &&
  s.rainRefocus && s.rainRefocus.bedActive && s.rainRefocus.rain.active &&
  s.rainHidden && !s.rainHidden.bedActive && s.rainHidden.sources === 0 &&
  s.rainVisible && s.rainVisible.bedActive && s.rainVisible.rain.active,
  "cabin rain tears down and returns cleanly across blur and visibility", {
    blur: s.rainBlur, refocus: s.rainRefocus, hidden: s.rainHidden, visible: s.rainVisible
  });
check(exposureOrder(s.highwayRain) && audibleCabinRain(s.highwayRain) &&
  s.highwayRain.closed.rain.scene === "roadtrip" &&
  s.highwayRain.closed.sources === 1 && s.highwayRain.windows.sources === 1 &&
  s.highwayRain.roof.sources === 1 && s.highwayRain.roof.dedicatedRainSource,
  "highway rain keeps the same one-bed source bound and three exposure levels", s.highwayRain);
var delayed = s.roadtripDelayedExposure;
check(delayed && delayed.calls.length === 1 && delayed.calls[0].scene === "roadtrip" &&
  delayed.calls[0].enclosure && delayed.calls[0].enclosure.exposure === "roof-open" &&
  delayed.current && delayed.current.exposure === "roof-open",
  "Road Trip thunder snapshots current roof exposure at playback time", delayed);
check(s.roadtripWindows && s.roadtripWindows.calls.length === 1 &&
  s.roadtripWindows.calls[0].enclosure.exposure === "windows-open" &&
  s.roadtripWindows.calls[0].enclosure.gain >= .9 &&
  s.roadtripClosed && s.roadtripClosed.calls.length === 1 &&
  s.roadtripClosed.calls[0].enclosure.exposure === "closed" &&
  s.roadtripClosed.calls[0].enclosure.gain >= .64 &&
  s.roadtripClosed.calls[0].enclosure.gain < s.roadtripWindows.calls[0].enclosure.gain &&
  s.roadtripClosed.calls[0].enclosure.cutoff < s.roadtripWindows.calls[0].enclosure.cutoff,
  "Road Trip thunder applies intermediate-window and fully-closed enclosure profiles", {
    windows: s.roadtripWindows, closed: s.roadtripClosed
  });
check(s.roadtripPaused && s.roadtripPaused.scene === null && s.roadtripPaused.calls === 0 &&
  !s.roadtripPaused.rain.bedActive,
  "paused Road Trip owns neither queued thunder nor cabin rain", s.roadtripPaused);
check(s.camping && s.camping.scene === "camping" && s.camping.calls.length === 1 &&
  !s.camping.calls[0].enclosure && s.campingRain && !s.campingRain.bedActive,
  "Camping keeps outdoor thunder and leaves the car-rain bed behind", {
    thunder: s.camping, rain: s.campingRain
  });
check(s.dismissed && !s.dismissed.bedActive && s.dismissed.sources === 0,
  "Road Trip dismissal leaves no cabin-weather source", s.dismissed);
check(s.exteriorFacadeReturn && s.exteriorFacadeReturn.wind.active &&
  s.exteriorFacadeReturn.rain.active && s.exteriorFacadeReturn.wind.where === "entrance" &&
  s.exteriorFacadeReturn.rain.where === "entrance" &&
  s.exteriorExit && s.exteriorExit.wind.where === "balcony" &&
  s.exteriorExit.rain.where !== "entrance",
  "leaving the HUD restores the façade beds and room exit hands weather back to Balcony", {
    facade: s.exteriorFacadeReturn, exit: s.exteriorExit
  });

console.log("");
if (failures) { console.log(failures + " weather-audio assertion" + (failures === 1 ? "" : "s") + " failed."); process.exit(1); }
console.log("Weather-audio ownership assertions passed.");
