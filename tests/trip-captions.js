#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report">pending</pre>
<script>
(function () {
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function state() {
    var el = document.getElementById("hunt-caption");
    var frame = document.querySelector(".hunt-frame");
    var box = el.getBoundingClientRect(), frameBox = frame.getBoundingClientRect();
    return {
      flash: window.__flashCaptionState(),
      key: window.__captionKey(),
      text: el.textContent,
      clearsFrame: box.bottom <= frameBox.top + 0.5 || box.top >= frameBox.bottom - 0.5
    };
  }
  window.addEventListener("load", function () {
    setTimeout(async function () {
      var variants = ["nitrous", "shrooms", "acid", "froggies", "dmt", "molly", "ketamine", "iboga"];
      var report = { errors: window.__errs, english: {}, cards: {} };
      try {
        document.hasFocus = function () { return true; };
        window.__unlockAllRooms();
        window.goToStage("garden");
        window.setCaption("garden", true);
        variants.forEach(function (variant) {
          window.__startTrip(variant);
          report.english[variant] = state();
        });
        setLang("cs");
        report.czech = state();
        setLang("en");
        window.goToStage("office");
        report.roomChange = state();
        window.goToStage("garden");
        window.setCaption("garden", true);
        window.__startTrip("acid");
        window.__stopTrip(true);
        report.stopped = state();
        window.__flashCaptionKey("trip_caption_molly", 550, "trip");
        report.temporary = state();
        await sleep(650);
        report.restored = state();
        window.__flashMolCard("thc", 550);
        report.cards.thc = {
          caption: state(),
          card: document.querySelector("#mol-card-thc .mol-cap").textContent
        };
        await sleep(650);
        report.cards.thcRestored = state();
        window.__flashMolCard("ethanol", 550);
        report.cards.ethanol = {
          caption: state(),
          card: document.querySelector("#mol-card-ethanol .mol-cap").textContent
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

console.log("rsvp.html temporary trip captions:");
var result = lib.runPageSync("rsvp.html", HARNESS, 3500, { patchRaf: true, forceMotion: true });
check(!!result, "focused browser harness completed", result);
if (result) {
  var expected = {
    nitrous: "Hold that thought. It’s floating away.",
    shrooms: "Fungal kingdom for the win.",
    acid: "Time to go for a bicycle ride.",
    froggies: "Reality melting point observed.",
    dmt: "I for one welcome the machine elves.",
    molly: "Everyone is suddenly your favourite person.",
    ketamine: "It’s just a game, within a game, within a game, ...",
    iboga: "Somewhere behind you, the past is still loading."
  };
  check(!result.errors.length, "no uncaught page errors", result.errors);
  check(Object.keys(expected).every(function (variant) {
    var s = result.english[variant];
    return s && s.flash && s.flash.owner === "trip" &&
      s.key === "trip_caption_" + variant && s.text === expected[variant] && s.clearsFrame;
  }), "all eight trips briefly use the main clue line", result.english);
  check(result.czech && result.czech.key === "trip_caption_iboga" &&
    result.czech.text === "Někde za tebou se minulost pořád načítá.",
    "language changes translate the temporary caption", result.czech);
  check(result.roomChange && !result.roomChange.flash && result.roomChange.key === "office_call",
    "a room change cancels the previous room's temporary trip caption", result.roomChange);
  check(result.stopped && !result.stopped.flash && result.stopped.key === "garden",
    "stopping a trip restores the previous clue", result.stopped);
  check(result.temporary && result.temporary.key === "trip_caption_molly" &&
    result.restored && !result.restored.flash && result.restored.key === "garden",
    "a temporary caption restores the exact previous clue", { temporary: result.temporary, restored: result.restored });
  check(result.cards.thc && result.cards.thc.caption.text === "this is sooo sick, bro" &&
    result.cards.thc.card === "we’ve got chemistry",
    "THC uses the clue line while its card keeps the chemistry note", result.cards.thc);
  check(result.cards.thcRestored && !result.cards.thcRestored.flash &&
    result.cards.ethanol && result.cards.ethanol.caption.text === "Reality is an illusion caused by alcohol deficiency." &&
    result.cards.ethanol.card === "we’ve got chemistry",
    "chemistry captions restore, and ethanol uses the same clue-line path", result.cards);
}

process.exitCode = failures ? 1 : 0;
