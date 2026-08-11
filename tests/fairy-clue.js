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
    window.__goToStage("garden");
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
        window.__goToStage("cuddly");
        var cameo = document.getElementById("cuddly-rumi-fairy");
        window.__setDayNight(false);
        check("the fairy stays away during the day after the party",
          cameo && !cameo.classList.contains("present"));
        window.__setDayNight(true);
        check("the fairy settles above the couple once the party is quiet at night",
          cameo && cameo.classList.contains("present"));
        var rumiCycleBefore = window.__rumiCycleState();
        check("Rumi pairs are shuffled into one complete load-time deck",
          rumiCycleBefore.cursor === 0 &&
          rumiCycleBefore.order.length === 7 &&
          rumiCycleBefore.order.slice().sort().join(",") === "0,1,2,3,4,5,6" &&
          rumiCycleBefore.entries === 7 && rumiCycleBefore.readings === 7 &&
          rumiCycleBefore.ghazals.join(",") === "553,553,553,162,4,1403,1798",
          JSON.stringify(rumiCycleBefore));
        var rumiConsole = window.__loftControllers.rumi();
        var rumiCycleAfter = window.__rumiCycleState();
        var rumiTrail = document.getElementById("fairy-clue-trail");
        check("the Rumi deck advances one slot instead of drawing again",
          rumiCycleAfter.cursor === 1 &&
          rumiCycleAfter.order.join(",") === rumiCycleBefore.order.join(","),
          JSON.stringify(rumiCycleAfter));
        check("the private Rumi owner reports its source and starts the visible exchange",
          /^📖 Rumi — Ghazal (4|162|553|1403|1798)\n/.test(rumiConsole) &&
          document.querySelector(".egg-bubble.rumi-bubble"),
          rumiConsole);
        var rumi = document.querySelector(".egg-bubble.rumi-bubble");
        check("the fairy casts toward Markéta before her delayed line",
          rumiTrail && rumiTrail.parentNode.id === "stage-cuddly" &&
          rumiTrail.getAttribute("data-target") === "cuddly-marketa-head" &&
          rumi && rumi.classList.contains("rumi-waiting"));
        check("clicking the cuddly fairy starts Markéta and behdad's Rumi exchange",
          rumi && rumi._rumiSpeaker === "markéta" &&
          rumi.querySelector(".rumi-fa") && !rumi.querySelector(".fal-fa"),
          rumi && rumi.textContent);
        check("Markéta's balanced Rumi bubble keeps its 5px vertical nudge",
          rumi && rumi._rumiOffset && rumi._rumiOffset.x === 0 && rumi._rumiOffset.y === 5,
          rumi && (rumi.style.left + "," + rumi.style.top));
        check("Markéta's Rumi bubble has a tail aimed at her",
          rumi && rumi._rumiTailAnchor &&
          rumi._rumiTailAnchor.id === "cuddly-marketa-head" &&
          !!rumi.style.getPropertyValue("--rumi-tail-x") &&
          rumi._rumiFollowing === true &&
          Math.abs(parseFloat(rumi.style.getPropertyValue("--rumi-tail-x")) /
            rumi.offsetWidth - .25) < .02,
          rumi && JSON.stringify({ tail: rumi.style.getPropertyValue("--rumi-tail-x"),
            width: rumi.offsetWidth, left: rumi.style.left }));
        check("Markéta's pointed Rumi bubble needs no visible speaker label",
          rumi && !rumi.querySelector(".rumi-speaker"));
        check("the Rumi exchange uses enlarged type",
          rumi && getComputedStyle(rumi).fontSize === "16px",
          rumi && getComputedStyle(rumi).fontSize);
        var rumiPersian = rumi && rumi.querySelector(".rumi-fa");
        check("the desktop Rumi bubble keeps its Persian verse on one line",
          rumiPersian && rumiPersian.scrollWidth <= rumiPersian.clientWidth &&
          rumiPersian.getBoundingClientRect().height <= parseFloat(getComputedStyle(rumiPersian).lineHeight) + 1,
          rumiPersian && JSON.stringify({
            width: rumiPersian.clientWidth, scrollWidth: rumiPersian.scrollWidth,
            height: rumiPersian.getBoundingClientRect().height,
            lineHeight: getComputedStyle(rumiPersian).lineHeight
          }));
        check("Markéta's recitation identifies the Rumi source",
          rumi && rumi.querySelector(".rumi-credit") &&
          rumi.querySelector(".rumi-credit").textContent === "— Rumi, Ghazal " + rumi._rumiGhazal);
        check("Markéta's recitation wakes Behdad for the exchange",
          document.getElementById("loft-game-strip").classList.contains("behdad-awake"));
        check("the Rumi exchange has a private scene owner",
          typeof window.__loftControllers.rumi === "function");

        setTimeout(function () {
          try {
            var reply = document.querySelector(".egg-bubble.rumi-bubble");
            var replyTrail = document.getElementById("fairy-clue-trail");
            check("behdad's reply replaces Markéta's Rumi bubble",
              reply && reply._rumiSpeaker === "behdad",
              reply && reply.textContent);
            check("the fairy casts toward Behdad before his delayed reply",
              replyTrail && replyTrail.parentNode.id === "stage-cuddly" &&
              replyTrail.getAttribute("data-target") === "cuddly-behdad-head" &&
              reply && reply.classList.contains("rumi-waiting"));
            check("behdad's balanced Rumi bubble keeps its 48px vertical nudge",
              reply && reply._rumiOffset && reply._rumiOffset.x === 0 &&
              reply._rumiOffset.y === 48 &&
              reply._rumiLayout === "head-top-left",
              reply && (reply.style.left + "," + reply.style.top));
            check("behdad's Rumi bubble has a tail aimed at him",
              reply && reply._rumiTailAnchor &&
              reply._rumiTailAnchor.id === "cuddly-behdad-head" &&
              !!reply.style.getPropertyValue("--rumi-tail-x") &&
              reply._rumiFollowing === true &&
              Math.abs(parseFloat(reply.style.getPropertyValue("--rumi-tail-x")) /
                reply.offsetWidth - .75) < .02,
              reply && JSON.stringify({ tail: reply.style.getPropertyValue("--rumi-tail-x"),
                width: reply.offsetWidth, left: reply.style.left }));
            check("behdad's pointed Rumi bubble needs no visible speaker label",
              reply && !reply.querySelector(".rumi-speaker"));
            check("behdad's recitation identifies the Rumi source",
              reply && reply.querySelector(".rumi-credit") &&
              reply.querySelector(".rumi-credit").textContent === "— Rumi, Ghazal " + reply._rumiGhazal);
            check("both halves cite the same ghazal",
              reply && rumi && reply._rumiGhazal === rumi._rumiGhazal);
            check("Behdad stays awake while reciting his reply",
              document.getElementById("loft-game-strip").classList.contains("behdad-awake"));
            window.__setDayNight(false);
            check("dawn sends the cuddly fairy away again",
              !cameo.classList.contains("present"));

            window.__resetRumiFairy();
            check("reset releases the Rumi-held wake",
              !document.getElementById("loft-game-strip").classList.contains("behdad-awake"));
            window.__goToStage("garden");
            door.classList.remove("open");
            click(door);
            check("opening the fairy door after phase 2 starts also begins the flight",
              fairy.classList.contains("released") &&
              fairy.parentNode.classList.contains("departing"));
            var offRoomCycle = window.__rumiCycleState();
            check("the private Rumi owner waits without consuming its deck outside the recitation scene",
              /^🧚 loft\.poetry\.rumi\.read\(\) waits/.test(window.__loftControllers.rumi()) &&
              window.__rumiCycleState().cursor === offRoomCycle.cursor);
            check("the private Hafez owner returns a random reading without arguments",
              /^📖 /.test(window.__loftControllers.faal()));
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
  console.log("  ✗ harness produced no report");
  process.exit(1);
}
var failures = 0;
result.checks.forEach(function (item) {
  console.log("  " + (item.pass ? "✓" : "✗") + " " + item.name +
    (!item.pass && item.detail ? " (" + item.detail + ")" : ""));
  if (!item.pass) failures++;
});
if (result.errors.length) {
  console.log("  ✗ uncaught page errors: " + result.errors.join("; "));
  failures++;
}
if (failures) process.exit(1);
console.log("All checks passed.");
