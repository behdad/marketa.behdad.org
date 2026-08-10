#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report">pending</pre>
<script>
(function () {
  var report = { errors: [], steps: {} };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function click(el) { el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })); }
  function press(el, key) {
    var event = new KeyboardEvent("keydown", { key: key, bubbles: true, cancelable: true });
    el.dispatchEvent(event);
    return event.defaultPrevented;
  }
  function state(coats) {
    var style = getComputedStyle(coats);
    return {
      opacity: style.opacity,
      pointer: style.pointerEvents,
      tab: coats.getAttribute("tabindex"),
      rustling: coats.classList.contains("rustling"),
      animation: style.animationName,
      focus: document.activeElement && document.activeElement.id
    };
  }
  window.addEventListener("load", function () {
    setTimeout(async function () {
      try {
        Object.defineProperty(document, "hasFocus", { value: function () { return true; }, configurable: true });
        var room = document.getElementById("bedroom-room");
        var viewport = document.querySelector(".hunt-viewport");
        var coats = document.getElementById("bedroom-party-coats");
        var coatPath = coats.querySelector(".bedroom-party-coat path");
        var bed = document.getElementById("bedroom-bed");
        room.style.transition = "none";
        viewport.style.transition = "none";
        coats.style.transition = "none";
        window.goToStage("office");
        window.__openBedroomRoom();
        await sleep(80);

        var swishes = [];
        window.playSwishSound = function (id) { swishes.push(id); };
        report.steps.idle = state(coats);
        click(coatPath);
        report.steps.idleClick = { state: state(coats), swishes: swishes.slice(), bed: bed.classList.contains("made") };

        window.__setGardenParty(true, false);
        await sleep(40);
        var childTransforms = Array.from(coats.querySelectorAll(".bedroom-party-coat")).map(function (coat) {
          return coat.getAttribute("transform");
        });
        var checkpointBefore = JSON.stringify(window.__captureCheckpointSystems()["bedroom-lamps"] || null);
        report.steps.party = state(coats);
        click(coatPath);
        report.steps.pointer = {
          state: state(coats), swishes: swishes.slice(), bed: bed.classList.contains("made"),
          childTransforms: Array.from(coats.querySelectorAll(".bedroom-party-coat")).map(function (coat) {
            return coat.getAttribute("transform");
          })
        };

        coats.focus();
        var enterPrevented = press(coats, "Enter");
        var enter = { state: state(coats), prevented: enterPrevented, swishes: swishes.slice() };
        var spacePrevented = press(coats, " ");
        report.steps.keyboard = {
          enter: enter,
          space: { state: state(coats), prevented: spacePrevented, swishes: swishes.slice() },
          checkpointUnchanged: checkpointBefore === JSON.stringify(window.__captureCheckpointSystems()["bedroom-lamps"] || null),
          childTransforms: childTransforms
        };

        window.__setGardenParty(false, true);
        await sleep(40);
        report.steps.ended = state(coats);
        click(coatPath);
        report.steps.endedClick = { state: state(coats), swishes: swishes.slice(), bed: bed.classList.contains("made") };

        window.__setGardenParty(true, false);
        await sleep(40);
        window.__closeBedroomRoom();
        await sleep(20);
        click(coatPath);
        report.steps.closed = { state: state(coats), swishes: swishes.slice(), party: !!window.__gardenPartyOn };
        window.__setGardenParty(false, true);
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
      }
      report.errors = (window.__errs || []).concat(report.errors);
      document.getElementById("__report").textContent = JSON.stringify(report);
    }, 240);
  });
})();
</script>`;

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail == null ? "" : " — " + JSON.stringify(detail)));
  }
}

console.log("loft-day.html Bedroom Party jackets:");
var result = lib.runPageSync("rsvp.html", HARNESS, 5000, { patchRaf: true, forceMotion: true });
var s = (result && result.steps) || {};
check(result && result.errors.length === 0, "no uncaught page errors", result && result.errors);
check(s.idle && s.idle.opacity === "0" && s.idle.pointer === "none" && s.idle.tab === "-1" &&
  s.idleClick && !s.idleClick.state.rustling && s.idleClick.swishes.length === 0 && !s.idleClick.bed,
  "the jackets stay hidden, unfocusable, and inert before Party", { idle: s.idle, click: s.idleClick });
check(s.party && s.party.opacity === "1" && s.party.pointer === "auto" && s.party.tab === "-1",
  "Party exposes the jacket pile without adding a browser Tab stop", s.party);
check(s.pointer && s.pointer.state.rustling &&
  s.pointer.state.animation === "bedroom-party-coats-rustle" &&
  s.pointer.swishes.length === 1 && s.pointer.swishes[0] === "bedroom-party-coats" &&
  !s.pointer.bed && s.pointer.state.focus === "bedroom-party-coats" &&
  JSON.stringify(s.pointer.childTransforms) === JSON.stringify(s.keyboard && s.keyboard.childTransforms),
  "a jacket click rustles the pile without making the bed or replacing garment placement", s.pointer);
check(s.keyboard && s.keyboard.enter.prevented && s.keyboard.enter.state.rustling &&
  s.keyboard.enter.swishes.length === 2 && s.keyboard.space.prevented &&
  s.keyboard.space.state.rustling && s.keyboard.space.swishes.length === 3 &&
  s.keyboard.checkpointUnchanged,
  "Enter and Space replay the transient reaction without entering checkpoint state", s.keyboard);
check(s.ended && s.ended.opacity === "0" && s.ended.pointer === "none" &&
  s.ended.tab === "-1" && !s.ended.rustling && s.ended.focus !== "bedroom-party-coats" &&
  s.endedClick && s.endedClick.swishes.length === 3 && !s.endedClick.bed,
  "ending Party clears the reaction and focus, and later jacket clicks stay inert",
  { ended: s.ended, click: s.endedClick });
check(s.closed && s.closed.party && s.closed.state.pointer === "none" &&
  s.closed.state.tab === "-1" && !s.closed.state.rustling && s.closed.swishes.length === 3,
  "closing Bedroom disables the jackets without altering Party itself", s.closed);

var source = fs.readFileSync(path.join(__dirname, "..", "loft-day.html"), "utf8");
check(/function partyCoatsActive\(\) \{[\s\S]*window\.__bedroomRoomOpen[\s\S]*gameStrip\.classList\.contains\("party-on"\)/.test(source) &&
  /partyCoats\.addEventListener\("click", function \(event\) \{[\s\S]*event\.stopPropagation\(\);[\s\S]*if \(!partyCoatsActive\(\)\) return;[\s\S]*replayClass\(partyCoats, "rustling", 760\)/.test(source) &&
  /event\.target\.closest\("#bedroom-room \.bedroom-prop, #bedroom-party-coats"\)/.test(source),
  "the shared Bedroom controller owns the scoped pointer and keyboard paths");

console.log("");
if (failures) {
  console.log(failures + " Bedroom Party jacket assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Bedroom Party jacket assertions passed.");
