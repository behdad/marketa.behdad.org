#!/usr/bin/env node
"use strict";

// Every authored Party moment shares one UV hold: the first moment snapshots the physical
// blacklight, overlaps keep it down, and the final end/teardown restores exactly that snapshot.
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function uv() { return document.getElementById("loft-game-strip").classList.contains("uv-mode"); }
  function report() {
    out.errors = (window.__errs || []).slice();
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
  }

  window.__goToStage("garden");
  window.__setGardenParty(true, false);
  window.__setUvParty(true);
  if (window.__summonGuests) window.__summonGuests();
  check("setup raises the UV blacklight", uv());

  var weddingStarted = window.__startCakeCutting && window.__startCakeCutting();
  check("the wedding-cake ceremony suppresses UV", weddingStarted && window.__cakeOn && !uv());
  window.__endCakeCutting();
  check("the wedding-cake ceremony restores prior-on UV", !window.__cakeOn && uv());

  var birthdayWho = Object.keys(window.__bdGardenFigures || {})[0];
  var birthdayStarted = birthdayWho && window.__startBdCakeCutting && window.__startBdCakeCutting(birthdayWho);
  check("the birthday-cake ceremony suppresses UV", birthdayStarted && window.__bdCakeOn && !uv(), birthdayWho || "no garden birthday figure");
  window.__endBdCakeCutting();
  check("the birthday-cake ceremony restores prior-on UV", !window.__bdCakeOn && uv());

  var bouquetStarted = window.__startBouquetToss && window.__startBouquetToss();
  check("the bouquet toss suppresses UV", bouquetStarted && window.__bouquetOn && !uv());
  window.__endBouquetToss();
  check("the bouquet toss restores prior-on UV", !window.__bouquetOn && uv());

  window.__setPartyMomentState("cake", true);
  window.__setPartyMomentState("bouquet", true);
  window.__setUvMode(true); // model a breather tick while the shared hold is active
  check("a breather tick cannot relight UV during overlapping moments", !uv());
  window.__setPartyMomentState("cake", false);
  check("ending one overlapping moment keeps UV suppressed", window.__bouquetOn && !uv());
  window.__setPartyMomentState("bouquet", false);
  check("the final overlapping moment restores prior-on UV", uv());

  window.__setUvMode(false); // physical breather phase was already off
  window.__setPartyMomentState("groupPhoto", true);
  window.__setUvMode(true);  // another attempted breather tick remains hidden
  window.__setPartyMomentState("groupPhoto", false);
  check("a moment preserves a prior-off breather phase", !uv());

  window.__setUvParty(true);
  window.__setPartyMomentState("sparklers", true);
  window.__setGardenParty(false, true); // canonical reset/interruption tears every moment down
  check("party teardown cannot strand restored UV", !window.__gardenPartyOn && !window.__sparklersOn && !uv());

  report();
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 1400, {
  forceMotion: true,
  seedRandom: true,
  patchRaf: true,
  chromeFlags: "--autoplay-policy=no-user-gesture-required"
});

if (!result) process.exit(1);
var failures = 0;
result.checks.forEach(function (row) {
  if (row.pass) console.log("  ✓ " + row.name);
  else { failures++; console.error("  ✗ " + row.name + (row.detail ? "\n    " + JSON.stringify(row.detail) : "")); }
});
if (result.errors.length) {
  failures += result.errors.length;
  result.errors.forEach(function (error) { console.error("  ✗ runtime: " + error); });
}
process.exitCode = failures ? 1 : 0;
