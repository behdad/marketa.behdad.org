#!/usr/bin/env node
"use strict";

// Drive the real visible garden-switch goodbye and inspect the dedicated party output node.
// This deliberately waits through the Web Audio clock: a target flag alone cannot prove that
// the connected output remains live or that its effective gain changes across the guest walk.
var lib = require("./lib");

var harness = String.raw`<script>
(async function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function report() {
    out.errors = (window.__errs || []).slice();
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
  }
  try {
    document.hasFocus = function () { return true; };
    if (window.__setSecondRound) window.__setSecondRound(true, { releaseHeld: false });
    if (window.__goToStage) window.__goToStage("garden");
    await sleep(500);
    if (window.__setPartyMode) window.__setPartyMode(true, true, false);
    if (window.__summonGuests) window.__summonGuests();
    await sleep(250);

    var before = window.__partyAudioOutputState ? window.__partyAudioOutputState() : [];
    check("setup has one live party output at unity", before.length === 1 && before[0].connected && before[0].gain > 0.98 && before[0].target === 1, before);

    document.getElementById("garden-lightswitch").dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    var start = window.__partyAudioOutputState ? window.__partyAudioOutputState() : [];
    check("the visible party-off path keeps the output connected at the start of its ramp",
      window.__partyWindingDown && window.__partyWindingDown() && window.__gardenPartyOn && start.length === 1 &&
        start[0].connected && start[0].gain > 0.85 && start[0].target === 0 && Math.abs((start[0].endAt - start[0].startAt) - 3.1) < 0.01,
      start);

    await sleep(850);
    var middle = window.__partyAudioOutputState ? window.__partyAudioOutputState() : [];
    check("the connected effective output has audibly begun fading during the guest walk",
      window.__gardenPartyOn && window.__partyWindingDown && window.__partyWindingDown() && middle.length === 1 && middle[0].connected &&
        middle[0].gain < start[0].gain - 0.01 && middle[0].gain > 0.5 && middle[0].target === 0,
      middle);

    await sleep(850);
    var later = window.__partyAudioOutputState ? window.__partyAudioOutputState() : [];
    check("the same connected output continues downward instead of being disconnected",
      later.length === 1 && later[0].connected && later[0].gain < middle[0].gain && later[0].gain > 0.25 && later[0].target === 0,
      { middle: middle, later: later });

    if (window.__extendPartyLifecycle) window.__extendPartyLifecycle();
    await sleep(400);
    var recovered = window.__partyAudioOutputState ? window.__partyAudioOutputState() : [];
    check("cancelling the goodbye restores that output without replacing the shared context",
      window.__gardenPartyOn && !(window.__partyWindingDown && window.__partyWindingDown()) && recovered.length === 1 &&
        recovered[0].connected && recovered[0].gain > later[0].gain && recovered[0].target === 1 && recovered[0].contextState === before[0].contextState,
      recovered);
  } catch (error) {
    out.errors.push("harness: " + String(error && error.stack || error));
  }
  report();
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 4200, {
  forceMotion: true,
  patchRaf: true,
  seedRandom: true,
  chromeFlags: "--autoplay-policy=no-user-gesture-required"
});
if (!result) { console.error("party audio fade: no report"); process.exit(1); }
var failed = false;
result.checks.forEach(function (item) {
  console.log("  " + (item.pass ? "PASS" : "FAIL") + " " + item.name +
    (item.pass || !item.detail ? "" : " - " + JSON.stringify(item.detail)));
  if (!item.pass) failed = true;
});
if (result.errors.length) { failed = true; console.error("runtime errors:\n  " + result.errors.join("\n  ")); }
if (failed) process.exit(1);
console.log("party audio fade: all " + result.checks.length + " checks passed");
