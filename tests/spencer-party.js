#!/usr/bin/env node
"use strict";

// Spencer's tap gag is a feet-planted duck. The flare must lower his head without translating
// his shoes through the garden floor, and neither the direct bio nor roster wiggle may regress.
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
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
  function cardName() {
    var card = document.querySelector(".egg-bubble.who-pop");
    var name = card && card.firstElementChild;
    return name ? name.textContent.trim() : "";
  }

  try {
    window.__setGardenParty(true, false);
    window.goToStage("garden");
    window.__summonGuests();

    var spencer = document.querySelector("#garden-guests .g-spencer");
    var react = spencer && spencer.querySelector(".guest-react");
    var head = spencer && spencer.querySelector(".guest-head");
    [".guest-walk", ".guest-arrival", ".guest-orbit", ".guest-move", ".guest-sway"].forEach(function (sel) {
      var node = spencer && spencer.querySelector(sel);
      if (node) node.style.animationPlayState = "paused";
    });
    var before = react.getBoundingClientRect();
    var headBefore = head.getBoundingClientRect();

    spencer.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
    react.style.animationDelay = "-.4s";
    react.style.animationPlayState = "paused";
    var duck = react.getBoundingClientRect();
    var headDuck = head.getBoundingClientRect();

    check("Spencer's party tap starts his authored flare",
      react.classList.contains("spencer-flare") &&
        getComputedStyle(react).animationName === "guest-spencer-flare",
      react.getAttribute("class") + "/" + getComputedStyle(react).animationName);
    check("Spencer ducks with his shoes planted on the floor",
      Math.abs(duck.bottom - before.bottom) < 1 &&
        headDuck.top > headBefore.top + 10,
      JSON.stringify({
        footShift: duck.bottom - before.bottom,
        headShift: headDuck.top - headBefore.top
      }));

    spencer.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    setTimeout(function () {
      try {
        check("clicking Spencer still opens his individual bio",
          cardName() === "Spencer", cardName());

        window.__dismissWhoPop();
        window.roster(true);
        window.__clearGuestSpotlight();
        window.__spotlightGuest([".g-spencer"]);
        check("the roster pick keeps Spencer's dedicated in-place wiggle",
          getComputedStyle(react).animationName === "roster-person-wiggle",
          getComputedStyle(react).animationName);
      } catch (error) {
        out.errors.push("async: " + String(error && error.stack || error));
      }
      report();
    }, 80);
  } catch (error) {
    out.errors.push("setup: " + String(error && error.stack || error));
    report();
  }
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 2500, {
  forceMotion: true,
  seedRandom: true
});

if (!result) {
  console.error("spencer party: no report");
  process.exit(1);
}
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
console.log("spencer party: all " + result.checks.length + " checks passed");
