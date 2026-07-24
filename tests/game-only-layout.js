#!/usr/bin/env node
"use strict";

// Direct #play/loft-day mode owns the browser window without surrounding page chrome.
// Fresh/recovery entry carries identity, language and watch actions inside the shell.
var lib = require("./lib");

function run(width, height, standalone) {
  var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function report() {
    out.errors = out.errors.concat((window.__errs || []).slice());
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
  }
  setTimeout(function () {
  try {
    var area = document.getElementById("hunt-fullscreen-area").getBoundingClientRect();
    var watch = document.querySelector(".watch-controls").getBoundingClientRect();
    var brand = document.querySelector(".loft-entry-brand").getBoundingClientRect();
    var clickWord = document.querySelector(".click-me-word").getBoundingClientRect();
    var langs = document.querySelector(".game-langs").getBoundingClientRect();
    var frame = document.querySelector(".hunt-frame").getBoundingClientRect();
    var viewport = document.querySelector(".hunt-viewport").getBoundingClientRect();
    var utilityIds = ["hunt-feedback-btn","hunt-bugs-btn","hunt-github-btn"];
    if (${standalone ? "true" : "false"}) {
      check("installed mode is detected", document.documentElement.classList.contains("installed-app"));
      var loader = document.getElementById("installed-load");
      check("installed mode shows its own loading progress",
        window.__installedLoaderUsed === true && !!loader &&
        Number(loader.querySelector('[role="progressbar"]').getAttribute("aria-valuenow")) >= 8);
    } else {
      check("browser mode never mounts the installed loading progress",
        window.__installedLoaderUsed === false && !document.getElementById("installed-load"));
    }
    check("game-only removes every outer title/language/advice row",
      !document.getElementById("hunt-title") &&
      getComputedStyle(document.querySelector(".page-langs")).display === "none" &&
      !document.getElementById("device-hint"));
    check("CLICK ME owns the shared entry chrome",
      document.getElementById("hunt-fullscreen-area").classList.contains("intro-active") &&
      document.documentElement.classList.contains("loft-entry-ready") &&
      !document.documentElement.classList.contains("loft-entry-pending") &&
      brand.width > 0 && langs.width > 0 &&
      getComputedStyle(document.getElementById("click-me-overlay")).pointerEvents === "auto" &&
      getComputedStyle(document.getElementById("click-me-overlay")).backgroundColor !== "rgba(0, 0, 0, 0)" &&
      getComputedStyle(document.getElementById("hunt-escape-btn")).visibility === "hidden" &&
      getComputedStyle(document.getElementById("hunt-restart-btn")).visibility === "hidden");
    check("entry title sits in the scene above CLICK ME and language occupies the upper-left",
      Math.abs((brand.left + brand.width / 2) - (viewport.left + viewport.width / 2)) <= 2 &&
      brand.bottom <= clickWord.top && langs.left >= area.left,
      JSON.stringify({ area: area, viewport: viewport, brand: brand, clickWord: clickWord, langs: langs }));
    check("entry typography scales from the scene rather than the browser viewport",
      parseFloat(getComputedStyle(document.querySelector(".loft-entry-brand")).fontSize) <= viewport.width * .13 &&
      parseFloat(getComputedStyle(document.querySelector(".click-me-word")).fontSize) <= viewport.width * .09,
      JSON.stringify({ viewportWidth: viewport.width, brandFont: getComputedStyle(document.querySelector(".loft-entry-brand")).fontSize, clickFont: getComputedStyle(document.querySelector(".click-me-word")).fontSize }));
    check("entry keeps left utility links and fullscreen available",
      utilityIds.every(function(id){var e=document.getElementById(id);return getComputedStyle(e).visibility==="visible"&&e.getBoundingClientRect().width>0;}) &&
      getComputedStyle(document.getElementById("hunt-fullscreen-btn")).visibility === "visible");
    check("entry hides room navigation and media transport",
      ["hunt-prev","hunt-next","hunt-volume-btn","hunt-playpause-btn","hunt-skip-btn"].every(function(id){
        return getComputedStyle(document.getElementById(id)).visibility === "hidden";
      }) && getComputedStyle(document.getElementById("hunt-dots")).display === "none");
    check("game-only shell stays inside the viewport width", area.left >= -1 && area.right <= innerWidth + 1,
      JSON.stringify({ innerWidth: innerWidth, left: area.left, right: area.right }));
    check("game-only shell respects the 1620px ceiling", area.width <= 1621,
      JSON.stringify({ innerWidth: innerWidth, innerHeight: innerHeight, width: area.width }));
    if (innerWidth >= 1600 && innerHeight >= 900) {
      check("a large browser grows the shell beyond the old 1080px cap", area.width > 1080,
        JSON.stringify({ innerWidth: innerWidth, innerHeight: innerHeight, width: area.width }));
    }
    check("the invitation state keeps Trailer and Autoplay in view", watch.bottom <= innerHeight + 1,
      JSON.stringify({ innerHeight: innerHeight, watchBottom: watch.bottom, areaBottom: area.bottom }));
    check("Trailer and Autoplay occupy the shell's bottom row",
      document.querySelector(".watch-controls").parentNode.id === "hunt-fullscreen-area" &&
      watch.top >= frame.bottom - 1 && watch.bottom <= area.bottom + 1,
      JSON.stringify({ watch: watch, frame: frame, area: area }));
    var invitationWidth = area.width;
    window.__endAttract();
    setTimeout(function () {
      var enteredArea = document.getElementById("hunt-fullscreen-area").getBoundingClientRect();
      check("entering page mode hides all outer invitation chrome",
        !document.getElementById("hunt-fullscreen-area").classList.contains("intro-active") &&
        !document.querySelector(".loft-entry-brand") &&
        getComputedStyle(document.querySelector(".game-langs")).display === "none" &&
        getComputedStyle(document.querySelector(".watch-controls")).display === "none");
      check("entering restores normal game controls",
        getComputedStyle(document.getElementById("hunt-escape-btn")).visibility === "visible" &&
        getComputedStyle(document.getElementById("hunt-prev")).visibility === "visible" &&
        getComputedStyle(document.getElementById("hunt-dots")).display === "flex");
      check("entered page mode enlarges or preserves the scene shell", enteredArea.width >= invitationWidth,
        invitationWidth + " -> " + enteredArea.width);
      check("entered page mode remains outside true/class fullscreen",
        !document.getElementById("hunt-fullscreen-area").classList.contains("is-fullscreen"));
      window.__activateExtinguisher();
      setTimeout(function () {
        check("an in-game extinguisher reset preserves enlarged page mode and returns to CLICK ME",
          window.__gameOnlyEntered() && !window.__gameStarted() && !!document.getElementById("click-me-overlay") &&
          document.getElementById("hunt-fullscreen-area").classList.contains("intro-active") &&
          document.querySelector(".watch-controls").parentNode.id === "hunt-fullscreen-area");
        window.__endAttract();
        window.reset();
        setTimeout(function () {
          check("the public reset() API preserves enlarged page mode and returns to CLICK ME",
            window.__gameOnlyEntered() && !window.__gameStarted() && !!document.getElementById("click-me-overlay") &&
            document.getElementById("hunt-fullscreen-area").classList.contains("intro-active") &&
            getComputedStyle(document.querySelector(".game-langs")).display === "flex");
          if (${standalone ? "true" : "false"}) {
            check("installed loading progress completes and leaves no overlay",
              window.__installedLoaderComplete === true && !document.getElementById("installed-load"));
          }
          report();
        }, 900);
      }, 900);
    }, 40);
  } catch (error) {
    out.errors.push("setup: " + (error && error.stack || error));
    report();
  }
  }, 100);
})();
</script>`;
  return lib.runPageSync("rsvp.html", harness, 3200, {
    urlSuffix: "#play",
    forceStandalone: !!standalone,
    chromeFlags: "--window-size=" + width + "," + height + " --force-device-scale-factor=1"
  });
}

var reports = [
  { label: "wide", report: run(1800, 1000) },
  { label: "mobile", report: run(390, 844) },
  { label: "installed", report: run(390, 844, true) }
];
var failed = false;
reports.forEach(function (entry) {
  if (!entry.report) {
    failed = true;
    console.error(entry.label + ": no report");
    return;
  }
  entry.report.checks.forEach(function (c) {
    console.log("  " + (c.pass ? "✓" : "✗") + " " + entry.label + ": " + c.name +
      (c.pass || !c.detail ? "" : " — " + c.detail));
    if (!c.pass) failed = true;
  });
  if (entry.report.errors.length) {
    failed = true;
    console.error(entry.label + " runtime errors:\n  " + entry.report.errors.join("\n  "));
  }
});
if (failed) process.exit(1);
console.log("game-only layout: all checks passed");
