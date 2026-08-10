#!/usr/bin/env node
"use strict";

var lib = require("./lib");
var harness = String.raw`<script>
(function () {
  var report = { errors: [], tries: [], additions: 0 };
  addEventListener("load", function () { setTimeout(function () {
    try {
      goToStage("garden");
      Math.random = function () { return 0.999999; }; // the former click-chance path always rejected this value
      var now = 100000;
      Date.now = function () { return now; };
      var rooster = document.getElementById("garden-rooster");
      var egg = document.getElementById("garden-rooster-egg");
      var stage = document.getElementById("stage-garden");
      var svg = document.getElementById("loft-game-strip");
      function eggOrigin() {
        var point = svg.createSVGPoint(); point.x = 0; point.y = 0;
        var screen = point.matrixTransform(egg.getScreenCTM());
        var local = screen.matrixTransform(stage.getScreenCTM().inverse());
        return [Number(local.x.toFixed(3)), Number(local.y.toFixed(3))];
      }
      report.geometry = {
        roosterTransform: rooster.getAttribute("transform"),
        hit: Array.from(rooster.querySelectorAll(":scope > rect")).map(function (rect) {
          return ["x", "y", "width", "height"].map(function (name) { return rect.getAttribute(name); });
        }),
        eggTransform: egg.getAttribute("transform"),
        eggParent: egg.parentNode && egg.parentNode.id,
        effectOwners: ["garden-rooster-egg-anim", "garden-rooster-egg-sparkle"].map(function (id) {
          var effect = document.getElementById(id); return effect && effect.parentNode && effect.parentNode.id;
        }),
        preOrigin: eggOrigin()
      };
      var lay = window.__roosterEggTry;
      window.__roosterEggTry = function () {
        var accepted = lay();
        report.tries.push(accepted);
        return accepted;
      };
      new MutationObserver(function (records) {
        records.forEach(function (record) {
          if (record.attributeName === "class" && egg.classList.contains("laying")) report.additions++;
        });
      }).observe(egg, { attributes: true, attributeFilter: ["class"] });
      function click() { rooster.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })); }

      click();
      setTimeout(function () {
        report.first = {
          laying: egg.classList.contains("laying"),
          eggs: document.querySelectorAll("#garden-rooster-egg").length,
          accepted: report.tries.filter(Boolean).length,
          additions: report.additions,
          origin: eggOrigin()
        };
        for (var i = 0; i < 5; i++) click();
        setTimeout(function () {
          report.capped = {
            results: report.tries.slice(),
            laying: egg.classList.contains("laying"),
            eggs: document.querySelectorAll("#garden-rooster-egg").length,
            accepted: report.tries.filter(Boolean).length,
            additions: report.additions
          };
          egg.dispatchEvent(new Event("animationend", { bubbles: true }));
          report.firstCleaned = !egg.classList.contains("laying");
          report.finishedOrigin = eggOrigin();
          now += 2700;
          click();
          setTimeout(function () {
            report.second = {
              laying: egg.classList.contains("laying"),
              accepted: report.tries.filter(Boolean).length,
              additions: report.additions
            };
            egg.dispatchEvent(new Event("animationend", { bubbles: true }));
            report.secondCleaned = !egg.classList.contains("laying");
            now += 2700;
            click();
            setTimeout(function () {
              report.third = {
                laying: egg.classList.contains("laying"),
                accepted: report.tries.filter(Boolean).length,
                additions: report.additions
              };
              window.__resetRoosterEgg();
              report.reset = {
                laying: egg.classList.contains("laying"),
                eggs: document.querySelectorAll("#garden-rooster-egg").length,
                origin: eggOrigin()
              };
              report.errors = (window.__errs || []).slice();
              var pre = document.createElement("pre");
              pre.id = "__report";
              pre.textContent = JSON.stringify(report);
              document.body.appendChild(pre);
            }, 80);
          }, 80);
        }, 80);
      }, 80);
    } catch (err) {
      report.thrown = String(err && err.stack || err);
    }
  }, 350); });
})();
</script>`;

var r = lib.runPageSync("rsvp.html", harness, 1800, { patchRaf: true, forceMotion: true });
if (!r) { console.error("rooster eggs: no report"); process.exit(1); }
var failed = false;
function check(ok, text, detail) {
  console.log("  " + (ok ? "✓ " : "✗ ") + text + (ok ? "" : " — " + JSON.stringify(detail)));
  if (!ok) failed = true;
}
check(!r.errors.length, "no uncaught page errors", r.errors);
check(!r.thrown, "the real-click probe completes", r.thrown);
check(r.geometry && r.geometry.roosterTransform === "translate(184,192)" &&
  JSON.stringify(r.geometry.hit) === JSON.stringify([["-4", "0", "30", "42"]]) &&
  r.geometry.eggTransform === "translate(24,39.4)" && r.geometry.eggParent === "garden-rooster" &&
  JSON.stringify(r.geometry.effectOwners) === JSON.stringify(["garden-rooster-egg", "garden-rooster-egg"]),
  "the whole rooster moves eight units while its hit box and nested egg effects stay unchanged", r.geometry);
check(r.geometry && JSON.stringify(r.geometry.preOrigin) === JSON.stringify([208, 231.4]) &&
  r.first && JSON.stringify(r.first.origin) === JSON.stringify([208, 231.4]) &&
  JSON.stringify(r.finishedOrigin) === JSON.stringify([208, 231.4]) &&
  r.reset && JSON.stringify(r.reset.origin) === JSON.stringify([208, 231.4]),
  "the static, active, finished, and reset egg origin follows the exact eight-unit shift", {
    pre: r.geometry && r.geometry.preOrigin, active: r.first && r.first.origin,
    finished: r.finishedOrigin, reset: r.reset && r.reset.origin
  });
check(r.first && r.first.laying && r.first.eggs === 1 && r.first.accepted === 1 && r.first.additions === 1,
  "the first real click lays the single static egg even at the old rejecting random value", r.first);
check(r.capped && r.capped.results.length === 6 && r.capped.results[0] === true &&
  r.capped.results.slice(1).every(function (accepted) { return accepted === false; }) &&
  r.capped.laying && r.capped.eggs === 1 && r.capped.accepted === 1 && r.capped.additions === 1,
  "rapid clicks respect the one-egg capacity without spawning or restarting eggs", r.capped);
check(r.firstCleaned && r.secondCleaned, "each completed egg animation cleans up its laying state", {
  first: r.firstCleaned, second: r.secondCleaned
});
check(r.second && r.second.laying && r.second.accepted === 2 && r.second.additions === 2 &&
  r.third && r.third.laying && r.third.accepted === 3 && r.third.additions === 3,
  "every subsequent real click accepted after cleanup lays exactly one egg", { second: r.second, third: r.third });
check(r.reset && !r.reset.laying && r.reset.eggs === 1,
  "reset clears an in-flight egg while retaining the bounded static node", r.reset);
if (failed) process.exit(1);
console.log("rooster eggs: all checks passed");
