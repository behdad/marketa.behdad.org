#!/usr/bin/env node
"use strict";

// Phase two retires the linear room trail. Delayed phase-one completions may still
// resolve, but they must not unlock or pan; direct room navigation remains available.
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function check(name, pass, detail) {
    out.checks.push({ name: name, pass: !!pass, detail: detail || "" });
  }
  function report() {
    out.errors = out.errors.concat((window.__errs || []).slice());
    var pre = document.createElement("pre");
    pre.id = "__report";
    pre.textContent = JSON.stringify(out);
    document.body.appendChild(pre);
  }
  async function run() {
    window.__setSecondRound(true, { releaseHeld: false });
    check("phase two unlocks the complete manual room map",
      window.__secondRound && window.__maxUnlocked() === 4, String(window.__maxUnlocked()));

    window.goToStage("garden");
    var staleResult = window.__finishSolveAdvance("garden", "cuddly");
    await sleep(850);
    check("a stale phase-one completion cannot pan in phase two",
      staleResult === false && window.currentStageName === "garden", window.currentStageName);

    var beforeOctopus = document.getElementById("cuddly-octopus").getAttribute("class") || "";
    var walkers = [
      window.__kitchenDoNext(),
      window.__gardenDoNext(),
      window.__cuddlyDoNext(),
      window.__officeDoNext(),
      window.__activateCurrentRoom()
    ];
    check("all guided solve walkers are retired in phase two",
      walkers.every(function (value) { return value === null || value === false; }),
      JSON.stringify(walkers));
    check("retired walkers do not operate their old targets",
      (document.getElementById("cuddly-octopus").getAttribute("class") || "") === beforeOctopus);
    check("phase-one clue targets and nudges are retired",
      window.__gardenClueTarget() === null &&
      window.__cuddlyDoorNeeded() === false &&
      ["kitchen-lamarzocco", "kitchen-grinder", "kitchen-tamper-pos",
       "kitchen-knockbox", "kitchen-portafilter-fly", "kitchen-shotcup"]
        .every(function (id) {
          return !document.getElementById(id).classList.contains("invite-pulse");
        }) &&
      !document.getElementById("office-pc-desk-trio").classList.contains("inviting") &&
      !document.getElementById("office-monitor").classList.contains("await-turn"));

    // Reproduce the two former direct bypasses: both object callbacks still finish
    // their local flourish, but their delayed room change must hit the phase guard.
    window.goToStage("cuddly");
    document.getElementById("cuddly-octopus").classList.add("played");
    document.getElementById("cuddly-balcony-door").classList.add("open");
    window.__pullMainBlanket();
    await sleep(850);
    check("a phase-two blanket completion stays in the cuddly room",
      window.currentStageName === "cuddly" &&
      !document.getElementById("cuddly-blanket").classList.contains("done"),
      window.currentStageName);

    window.goToStage("office");
    window.__pragueCalled = true;
    window.__pcPlayed = true;
    document.getElementById("office-lamp").classList.add("dimmed");
    document.getElementById("office-pendant").classList.add("dimmed");
    document.getElementById("office-stainedglass")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await sleep(2150);
    check("a phase-two butterfly completion stays in the office",
      window.currentStageName === "office" &&
      !document.getElementById("office-stainedglass").classList.contains("done"),
      window.currentStageName);

    // Explicit navigation is not progression: arrows, number keys, and dots still work.
    window.goToStage("garden");
    document.getElementById("hunt-next")
      .dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    check("the next-room arrow remains functional", window.currentStageName === "cuddly",
      window.currentStageName);
    document.dispatchEvent(new KeyboardEvent("keydown",
      { key: "ArrowRight", bubbles: true, cancelable: true }));
    check("room arrow keys remain functional", window.currentStageName === "office",
      window.currentStageName);
    document.dispatchEvent(new KeyboardEvent("keydown",
      { key: "1", bubbles: true, cancelable: true }));
    check("room number keys remain functional", window.currentStageName === "kitchen",
      window.currentStageName);
    document.querySelectorAll(".hunt-dot")[4]
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    check("room dots remain functional", window.currentStageName === "balcony",
      window.currentStageName);
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      run().catch(function (error) {
        out.errors.push("harness: " + String(error && error.stack || error));
      }).then(report);
    }, 300);
  });
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 9000, {
  patchRaf: true,
  seedRandom: true
});

if (!result) {
  console.error("phase-two progression: no report");
  process.exit(1);
}
var failed = false;
result.checks.forEach(function (item) {
  console.log("  " + (item.pass ? "✓" : "✗") + " " + item.name +
    (item.pass || !item.detail ? "" : " — " + item.detail));
  if (!item.pass) failed = true;
});
if (result.errors.length) {
  failed = true;
  console.error("runtime errors:\n  " + result.errors.join("\n  "));
}
if (failed) process.exit(1);
console.log("phase-two progression: all " + result.checks.length + " checks passed");
