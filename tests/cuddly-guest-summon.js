#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) {
    out.checks.push({ name: name, pass: !!pass, detail: detail || "" });
  }
  function report() {
    out.errors = (window.__errs || []).slice();
    var pre = document.createElement("pre");
    pre.id = "__report";
    pre.textContent = JSON.stringify(out);
    document.body.appendChild(pre);
  }

  window.__setPartyMode(false, true);
  if (window.__dismissGuests) window.__dismissGuests();
  window.goToStage("cuddly");

  var roof = document.getElementById("cuddly-ceiling");
  roof.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true }));
  for (var i = 0; i < 3; i++) roof.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

  var realGuests = window.guests, guestCalls = 0, madlaCalls = 0;
  window.guests = function () {
    guestCalls++;
    return realGuests.apply(window, arguments);
  };
  window.__madlaFromOutlet = function () { madlaCalls++; return true; };
  document.getElementById("cuddly-outlet").dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

  setTimeout(function () {
    check("the roof no longer summons a visitor duo",
      !window.__cuddlyRoofSummon && window.__cuddlyVisitorsNow().length === 0,
      String(window.__cuddlyVisitorsNow().length));
    check("the outlet uses the canonical guests transition", guestCalls === 1, String(guestCalls));
    check("the outlet no longer triggers Madla", madlaCalls === 0, String(madlaCalls));
    check("the outlet starts the party and fills its guest floor",
      window.__gardenPartyOn && window.currentStageName === "garden" && window.__guestsIn(),
      window.currentStageName + "/" + window.__gardenPartyOn + "/" + window.__guestsIn());
    check("the outlet keeps its spark and explains the result",
      document.getElementById("cuddly-outlet").classList.contains("sparking") &&
      window.__captionKey() === "cuddly_outlet_party",
      window.__captionKey());
    report();
  }, 500);
})();
</script>`;

var report = lib.runPageSync("rsvp.html", HARNESS, 2500, {
  patchRaf: true,
  forceMotion: true,
  seedRandom: true
});
if (!report) {
  console.error("cuddly guest summon: no report");
  process.exit(1);
}

var failed = false;
report.checks.forEach(function (c) {
  console.log("  " + (c.pass ? "✓" : "✗") + " " + c.name + (c.pass || !c.detail ? "" : " — " + c.detail));
  if (!c.pass) failed = true;
});
if (report.errors.length) {
  failed = true;
  console.error("cuddly guest summon runtime errors:\n  " + report.errors.join("\n  "));
}
if (failed) process.exit(1);
console.log("cuddly guest summon: all checks passed");
