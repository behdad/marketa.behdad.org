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
  window.__goToStage("cuddly");
  document.getElementById("stage-cuddly").classList.add("dusk");

  var roof = document.getElementById("cuddly-ceiling");
  roof.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true }));
  for (var i = 0; i < 3; i++) roof.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  var roofVisitors = window.__cuddlyVisitorsNow().length;

  var realGuests = window.__loftControllers.guests, guestCalls = 0, madlaCalls = 0;
  window.__loftControllers.guests = function () {
    guestCalls++;
    return realGuests.apply(window, arguments);
  };
  window.__madlaFromOutlet = function () { madlaCalls++; return true; };
  document.getElementById("cuddly-outlet").dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

  setTimeout(function () {
    check("the roof no longer summons a visitor group",
      !window.__cuddlyRoofSummon && roofVisitors === 0,
      String(roofVisitors));
    check("the outlet does not summon the dance-floor roster", guestCalls === 0, String(guestCalls));
    check("the outlet no longer triggers Madla", madlaCalls === 0, String(madlaCalls));
    check("the outlet summons a Cuddly visitor group without starting the party",
      !window.__gardenPartyOn && window.__currentStageName === "cuddly" && window.__cuddlyVisitorsNow().length >= 1,
      window.__currentStageName + "/" + window.__gardenPartyOn + "/" + window.__cuddlyVisitorsNow().length);
    check("the explicit outlet visit works at night",
      document.getElementById("stage-cuddly").classList.contains("dusk"),
      document.getElementById("stage-cuddly").className.baseVal);
    check("the outlet keeps its spark and explains the result",
      document.getElementById("cuddly-outlet").classList.contains("sparking") &&
      window.__captionKey() === "cuddly_outlet_visit",
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
