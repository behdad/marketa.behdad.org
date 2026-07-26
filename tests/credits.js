#!/usr/bin/env node
"use strict";

// Credits must grow with the tester roster rather than relying on a hand-sized roll.
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  try {
    var names = window.LOFT_CREDITS.people.filter(function (person) {
      return person.role === "credits_tester";
    }).map(function (person) { return person.name; });
    check("Nima appears in the language-neutral tester roster",
      names.indexOf("Nima") !== -1, names.join(", "));

    var current = window.__loftCreditsLayout(names.length, 2);
    var crowded = window.__loftCreditsLayout(50, 2);
    check("software credits move below every tester",
      crowded.softwareHeadingY - current.softwareHeadingY === (50 - names.length) * 4.5,
      JSON.stringify({ current: current, crowded: crowded }));
    check("an oversized tester roster receives more travel and time",
      crowded.travel < current.travel && crowded.duration > current.duration,
      JSON.stringify({ current: current, crowded: crowded }));
    check("the final credit clears the clipped screen",
      current.dateY + current.travel < 155 && crowded.dateY + crowded.travel < 155,
      JSON.stringify({ current: current, crowded: crowded }));

    var roll = document.getElementById("monitor-credits-roll");
    check("the rendered roll uses its computed travel and duration",
      roll.style.getPropertyValue("--credits-travel") === current.travel + "px" &&
      roll.style.getPropertyValue("--credits-duration") === current.duration + "s",
      roll.getAttribute("style"));
    window.__openMonitorCredits();
    roll.dispatchEvent(new Event("animationend"));
    check("the fire keeps running after the credits finish",
      document.getElementById("monitor-credits-layer").classList.contains("finished") &&
      window.__cuddlyFlameRaf() !== null,
      String(window.__cuddlyFlameRaf()));
  } catch (error) {
    out.errors.push(String(error && error.stack || error));
  }
  out.errors = out.errors.concat(window.__errs || []);
  var pre = document.createElement("pre");
  pre.id = "__report";
  pre.textContent = JSON.stringify(out);
  document.body.appendChild(pre);
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 1800, { forceMotion: true });
if (!result) { console.error("credits: no report"); process.exit(1); }
var failed = false;
result.checks.forEach(function (check) {
  console.log("  " + (check.pass ? "✓" : "✗") + " " + check.name +
    (check.pass || !check.detail ? "" : " — " + check.detail));
  if (!check.pass) failed = true;
});
if (result.errors.length) {
  failed = true;
  console.error("runtime errors:\n  " + result.errors.join("\n  "));
}
if (failed) process.exit(1);
console.log("credits: all " + result.checks.length + " checks passed");
