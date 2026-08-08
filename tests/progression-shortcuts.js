#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function key(value, shift) {
    return document.dispatchEvent(new KeyboardEvent("keydown", {
      key: value, code: "Key" + value.toUpperCase(), shiftKey: !!shift,
      bubbles: true, cancelable: true
    }));
  }
  async function run() {
    var resetCalls = 0, realReset = window.__requestLoftReset;
    window.__requestLoftReset = function () { resetCalls++; };
    var plainP = key("p", false), plainR = key("r", false);
    await sleep(40);
    check("plain P and R are inert global keys",
      plainP && plainR && !window.__gardenPartyOn && !window.__secondRound && resetCalls === 0,
      JSON.stringify({ plainP: plainP, plainR: plainR, party: window.__gardenPartyOn,
        phase2: window.__secondRound, resetCalls: resetCalls }));

    var shiftP = key("P", true);
    await sleep(80);
    check("Shift+P starts the canonical Party and unlocks its room frontier",
      !shiftP && window.__gardenPartyOn && window.__secondRound && window.__maxUnlocked() === 4,
      JSON.stringify({ eventResult: shiftP, party: window.__gardenPartyOn,
        phase2: window.__secondRound, max: window.__maxUnlocked() }));

    var shiftR = key("R", true);
    await sleep(1400);
    var entrance = window.__entranceRoomState && window.__entranceRoomState();
    check("Shift+R winds down the Party and lands at the Road Trip-ready Entrance",
      !shiftR && !window.__gardenPartyOn && window.__secondRound &&
      window.__seenRooms().length === 10 && window.currentStageName === "balcony" &&
      window.__entranceRoomOpen && entrance && entrance.drive.hud === false &&
      entrance.drive.roadtrip.unlocked && entrance.drive.roadtrip.invitationReady,
      JSON.stringify({ eventResult: shiftR, party: window.__gardenPartyOn,
        phase2: window.__secondRound, seen: window.__seenRooms(), stage: window.currentStageName,
        entrance: entrance && { open: entrance.open, hud: entrance.drive.hud,
          unlocked: entrance.drive.roadtrip.unlocked,
          invitationReady: entrance.drive.roadtrip.invitationReady } }));
    check("Shift+R does not route through the reset owner", resetCalls === 0, String(resetCalls));
    window.__requestLoftReset = realReset;
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      run().catch(function (error) { out.errors.push(String(error && error.stack || error)); }).then(function () {
        out.errors = out.errors.concat((window.__errs || []).slice());
        var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(out);
        document.body.appendChild(pre);
      });
    }, 280);
  });
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 8000, { patchRaf: true, seedRandom: true, forceReduce: true });
if (!result) { console.error("progression shortcuts: no report"); process.exit(1); }
var failed = false;
result.checks.forEach(function (item) {
  console.log("  " + (item.pass ? "✓" : "✗") + " " + item.name +
    (item.pass || !item.detail ? "" : " — " + item.detail));
  if (!item.pass) failed = true;
});
if (result.errors.length) { failed = true; console.error("runtime errors:\n  " + result.errors.join("\n  ")); }
if (failed) process.exit(1);
console.log("progression shortcuts: all " + result.checks.length + " checks passed");
