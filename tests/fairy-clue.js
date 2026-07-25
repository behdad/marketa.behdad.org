#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) {
    out.checks.push({ name: name, pass: !!pass, detail: detail || "" });
  }
  function click(el) {
    if (el) el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  }
  function finish() {
    out.errors = out.errors.concat((window.__errs || []).slice());
    var pre = document.createElement("pre");
    pre.id = "__report";
    pre.textContent = JSON.stringify(out);
    document.body.appendChild(pre);
  }
  try {
    window.goToStage("garden");
    var fairy = document.getElementById("witchy-chest-fairy");
    var door = document.getElementById("witchy-door-2");
    click(door);
    check("opening the sun door releases the fairy",
      fairy && fairy.classList.contains("released"));
    var target = window.__gardenClueTarget();
    check("the fairy initially points to an unwatered plant",
      target && target.id === "garden-monstera", target && target.id);

    click(fairy);
    var trail = document.getElementById("fairy-clue-trail");
    check("clicking the fairy creates a visible clue trail",
      trail && trail.getAttribute("data-target") === "garden-monstera",
      trail && trail.getAttribute("data-target"));
    check("the trail paints in the visible garden coordinate space",
      trail && trail.parentNode && trail.parentNode.id === "stage-garden" &&
      trail.getAttribute("data-coordinate-space") === "stage-garden",
      trail && trail.parentNode && trail.parentNode.id);
    check("the strengthened trail contains sixteen sparkles",
      trail && trail.children.length === 16,
      trail && String(trail.children.length));

    window.__setGardenParty(true, false);
    check("the fairy stops guiding once phase 2 begins",
      window.__gardenClueTarget() === null);
    var departure = document.getElementById("fairy-departure-trail");
    check("starting phase 2 sends the released fairy toward cuddly-puddly",
      fairy && fairy.parentNode && fairy.parentNode.classList.contains("departing") &&
      departure && departure.children.length === 18);
    setTimeout(function () {
      try {
        check("the garden fairy is gone after the flight",
          fairy.classList.contains("departed") &&
          fairy.parentNode.classList.contains("away"));
        window.__setGardenParty(false, false);
        window.goToStage("cuddly");
        var cameo = document.getElementById("cuddly-rumi-fairy");
        window.__setDayNight(false);
        check("the fairy stays away during the day after the party",
          cameo && !cameo.classList.contains("present") &&
          cameo.getAttribute("aria-hidden") === "true");
        window.__setDayNight(true);
        check("the fairy settles above the couple once the party is quiet at night",
          cameo && cameo.classList.contains("present") &&
          cameo.getAttribute("aria-hidden") === "false");
        click(cameo);
        var rumi = document.querySelector(".egg-bubble.rumi-bubble");
        check("clicking the cuddly fairy starts Markéta and behdad's Rumi exchange",
          rumi && rumi.querySelector(".rumi-speaker") &&
          rumi.querySelector(".rumi-speaker").textContent === "markéta" &&
          rumi.querySelector(".rumi-fa") && !rumi.querySelector(".fal-fa"),
          rumi && rumi.textContent);
        check("Markéta's cumulative Rumi offset is 60px right and 5px down",
          rumi && rumi._rumiOffset && rumi._rumiOffset.x === 60 && rumi._rumiOffset.y === 5,
          rumi && (rumi.style.left + "," + rumi.style.top));
        check("Markéta's Rumi bubble has a tail aimed at her",
          rumi && rumi._rumiTailAnchor &&
          rumi._rumiTailAnchor.id === "cuddly-marketa-head" &&
          !!rumi.style.getPropertyValue("--rumi-tail-x") &&
          rumi._rumiFollowing === true);
        check("Markéta's Rumi name uses her blue",
          rumi && getComputedStyle(rumi.querySelector(".rumi-speaker")).color === "rgb(127, 158, 192)");
        check("Markéta's recitation wakes Behdad for the exchange",
          document.getElementById("loft-game-strip").classList.contains("behdad-awake"));
        check("the Rumi exchange does not add a public command",
          typeof window.rumi === "undefined");

        setTimeout(function () {
          try {
            var reply = document.querySelector(".egg-bubble.rumi-bubble");
            check("behdad's reply replaces Markéta's Rumi bubble",
              reply && reply.querySelector(".rumi-speaker") &&
              reply.querySelector(".rumi-speaker").textContent === "behdad",
              reply && reply.textContent);
            check("behdad's manual Rumi adjustment is 55px right and 48px down",
              reply && reply._rumiOffset && reply._rumiOffset.x === 55 &&
              reply._rumiOffset.y === 48 &&
              reply._rumiLayout === "head-top-left",
              reply && (reply.style.left + "," + reply.style.top));
            check("behdad's Rumi bubble has a tail aimed at him",
              reply && reply._rumiTailAnchor &&
              reply._rumiTailAnchor.id === "cuddly-behdad-head" &&
              !!reply.style.getPropertyValue("--rumi-tail-x") &&
              reply._rumiFollowing === true);
            check("behdad's Rumi name keeps his pink",
              reply && getComputedStyle(reply.querySelector(".rumi-speaker")).color === "rgb(217, 166, 166)");
            check("Behdad stays awake while reciting his reply",
              document.getElementById("loft-game-strip").classList.contains("behdad-awake"));
            window.__setDayNight(false);
            check("dawn sends the cuddly fairy away again",
              !cameo.classList.contains("present") &&
              cameo.getAttribute("aria-hidden") === "true");

            window.__resetRumiFairy();
            check("reset releases the Rumi-held wake",
              !document.getElementById("loft-game-strip").classList.contains("behdad-awake"));
            window.goToStage("garden");
            door.classList.remove("open");
            click(door);
            check("opening the fairy door after phase 2 starts also begins the flight",
              fairy.classList.contains("released") &&
              fairy.parentNode.classList.contains("departing"));
          } catch (error) {
            out.errors.push(String(error && error.stack || error));
          }
          finish();
        }, 5350);
      } catch (error) {
        out.errors.push(String(error && error.stack || error));
        finish();
      }
    }, 1850);
  } catch (error) {
    out.errors.push(String(error && error.stack || error));
    finish();
  }
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 7800, {
  patchRaf: true,
  forceMotion: true
});
if (!result) {
  console.log("  \u2717 harness produced no report");
  process.exit(1);
}
var failures = 0;
result.checks.forEach(function (item) {
  console.log("  " + (item.pass ? "\u2713" : "\u2717") + " " + item.name +
    (!item.pass && item.detail ? " (" + item.detail + ")" : ""));
  if (!item.pass) failures++;
});
if (result.errors.length) {
  console.log("  \u2717 uncaught page errors: " + result.errors.join("; "));
  failures++;
}
if (failures) process.exit(1);
console.log("All checks passed.");
