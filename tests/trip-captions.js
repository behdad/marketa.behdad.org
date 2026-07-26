#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report">pending</pre>
<script>
(function () {
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function state() {
    var el = document.getElementById("trip-caption");
    var frame = document.querySelector(".hunt-frame");
    var box = el.getBoundingClientRect(), frameBox = frame.getBoundingClientRect();
    return {
      visible: !el.hidden && getComputedStyle(el).display !== "none",
      key: el.getAttribute("data-i"),
      text: el.textContent,
      clearsFrame: box.bottom <= frameBox.top + 0.5
    };
  }
  window.addEventListener("load", function () {
    setTimeout(async function () {
      var variants = ["nitrous", "shrooms", "acid", "froggies", "dmt", "molly", "ketamine", "iboga"];
      var report = { errors: window.__errs, english: {}, rooms: {}, cards: {} };
      try {
        document.hasFocus = function () { return true; };
        window.__unlockAllRooms();
        variants.forEach(function (variant) {
          window.__startTrip(variant);
          report.english[variant] = state();
        });
        ["kitchen", "garden", "cuddly", "office", "balcony"].forEach(function (room) {
          window.goToStage(room);
          report.rooms[room] = state();
        });
        setLang("cs");
        report.czech = state();
        setLang("en");
        window.__stopTrip(true);
        report.stopped = state();
        window.__startTrip("acid");
        await sleep(4700);
        report.naturalEnd = state();
        window.__startTrip("ketamine");
        window.__activateExtinguisher();
        await sleep(850);
        report.reset = state();
        setLang("en");
        report.cards.en = {
          thc: document.querySelector("#mol-card-thc .mol-cap").textContent,
          ethanol: document.querySelector("#mol-card-ethanol .mol-cap").textContent
        };
        setLang("cs");
        report.cards.cs = {
          thc: document.querySelector("#mol-card-thc .mol-cap").textContent,
          ethanol: document.querySelector("#mol-card-ethanol .mol-cap").textContent
        };
      } catch (e) {
        window.__errs.push("harness: " + String(e && e.stack || e));
      }
      report.errors = window.__errs;
      document.getElementById("__report").textContent = JSON.stringify(report);
    }, 300);
  });
})();
</script>`;

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail == null ? "" : " [" + JSON.stringify(detail) + "]"));
  }
}

console.log("rsvp.html trip captions:");
var result = lib.runPageSync("rsvp.html", HARNESS, 7000, { patchRaf: true, forceMotion: true });
check(!!result, "focused browser harness completed", result);
if (result) {
  var expected = {
    nitrous: "Hold that thought. It’s floating away.",
    shrooms: "Fungal kingdom for the win.",
    acid: "Time to go for a bicycle ride.",
    froggies: "Reality melting point observed.",
    dmt: "I for one welcome the machine elves.",
    molly: "Everyone is suddenly your favorite person.",
    ketamine: "It’s just a game, within a game, within a game, ...",
    iboga: "Somewhere behind you, the past is still loading."
  };
  check(!result.errors.length, "no uncaught page errors", result.errors);
  check(Object.keys(expected).every(function (variant) {
    var state = result.english[variant];
    return state && state.visible && state.key === "trip_caption_" + variant &&
      state.text === expected[variant] && state.clearsFrame;
  }), "all eight timed trips show their exact English caption above the controls", result.english);
  check(Object.keys(result.rooms).length === 5 && Object.keys(result.rooms).every(function (room) {
    return result.rooms[room].visible && result.rooms[room].key === "trip_caption_iboga" &&
      result.rooms[room].clearsFrame;
  }), "the active caption remains visible and clear of controls in every room", result.rooms);
  check(result.czech && result.czech.visible && result.czech.key === "trip_caption_iboga" &&
    result.czech.text === "Někde za tebou se minulost pořád načítá.",
    "language changes translate a running trip caption", result.czech);
  check(result.stopped && !result.stopped.visible && !result.stopped.key && !result.stopped.text,
    "explicit stop clears the caption", result.stopped);
  check(result.naturalEnd && !result.naturalEnd.visible,
    "natural trip completion clears the caption", result.naturalEnd);
  check(result.reset && !result.reset.visible,
    "the loft reset clears the caption", result.reset);
  check(result.cards && result.cards.en &&
    result.cards.en.thc === "This is soo sick, bro." &&
    result.cards.en.ethanol === "Reality is an illusion caused by alcohol deficiency.",
    "THC and alcohol cards carry the approved English captions", result.cards && result.cards.en);
  check(result.cards && result.cards.cs &&
    result.cards.cs.thc === "To je táák hustý, kámo." &&
    result.cards.cs.ethanol === "Realita je iluze způsobená nedostatkem alkoholu.",
    "THC and alcohol card captions are mirrored in Czech", result.cards && result.cards.cs);
}

process.exitCode = failures ? 1 : 0;
