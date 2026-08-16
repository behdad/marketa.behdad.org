#!/usr/bin/env node
"use strict";

// Canonical Loft Day owns the browser window without surrounding page chrome.
// Fresh/recovery entry carries identity, language and watch actions inside the shell.
var lib = require("./lib");

function run(width, height, standalone, fullPage, entryFile) {
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
    var github = document.getElementById("hunt-github-btn").getBoundingClientRect();
    var utilityIds = ["hunt-github-btn"];
    if (${(!fullPage || standalone) ? "true" : "false"}) {
      if (${standalone ? "true" : "false"}) {
        check("installed mode is detected", document.documentElement.classList.contains("installed-app"));
      }
      var loader = document.getElementById("installed-load");
      check("game-only entry keeps progress dormant behind its splash",
        window.__installedLoaderUsed === false && window.__installedLoaderComplete === false &&
        !!loader && getComputedStyle(loader).display === "none");
    } else {
      check("revealed invitation never mounts game loading progress",
        window.__installedLoaderUsed === false && !document.getElementById("installed-load"));
    }
    if (${fullPage ? "true" : "false"}) {
      check("full RSVP keeps its invitation chrome around the portrait game gate",
        document.documentElement.classList.contains("revealed") &&
        getComputedStyle(document.querySelector(".page-langs")).display === "flex");
    } else {
      check("game-only removes every outer title/language/advice row",
        !document.getElementById("hunt-title") &&
        getComputedStyle(document.querySelector(".page-langs")).display === "none" &&
        !document.getElementById("device-hint"));
    }
    var portrait = matchMedia("(max-width:600px) and (orientation:portrait)").matches;
    if (portrait) {
      var gate = document.getElementById("portrait-orientation-gate");
      var portraitBrand = document.getElementById("portrait-orientation-brand");
      var action = document.getElementById("portrait-landscape-btn");
      check("portrait shows one intentional orientation banner",
        gate && getComputedStyle(gate).display === "grid" &&
        gate.getBoundingClientRect().width > 0 && gate.getBoundingClientRect().right <= innerWidth + 1);
      check("portrait banner identifies Loft Day before asking for landscape",
        portraitBrand && portraitBrand.textContent.trim().length > 0 &&
        portraitBrand.getBoundingClientRect().width > 0 &&
        portraitBrand.getBoundingClientRect().top < document.getElementById("portrait-orientation-title").getBoundingClientRect().top);
      window.__setLang("cs");
      check("Czech portrait copy stays inside the orientation banner",
        gate.scrollWidth <= gate.clientWidth &&
        Array.prototype.every.call(gate.children, function (child) {
          return child.getBoundingClientRect().right <= gate.getBoundingClientRect().right + 1;
        }));
      window.__setLang("en");
      check("portrait suppresses the caption, scene, game controls, and watch actions",
        getComputedStyle(document.getElementById("hunt-caption")).display === "none" &&
        getComputedStyle(document.querySelector(".hunt-frame")).display === "none" &&
        getComputedStyle(document.querySelector(".game-langs")).display === "none" &&
        getComputedStyle(document.querySelector(".watch-controls")).display === "none");
      function exercisePortraitAction() {
        action.click();
        setTimeout(function () {
          check("portrait action requests the fullscreen fill while keeping the gate",
            document.getElementById("hunt-fullscreen-area").classList.contains("is-fullscreen") &&
            getComputedStyle(gate).display === "grid" &&
            getComputedStyle(document.querySelector(".hunt-frame")).display === "none");
          report();
        }, 100);
      }
      if (${(!fullPage || standalone) ? "true" : "false"}) {
        setTimeout(function () {
          var loader = document.getElementById("installed-load");
          check("portrait keeps progress dormant until a splash action",
            window.__installedLoaderUsed === false && window.__installedLoaderComplete === false &&
            !!loader && getComputedStyle(loader).display === "none");
          exercisePortraitAction();
        }, 2700);
      } else {
        exercisePortraitAction();
      }
      return;
    }
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
    check("entry keeps its repository link and fullscreen available",
      utilityIds.every(function(id){var e=document.getElementById(id);return getComputedStyle(e).visibility==="visible"&&e.getBoundingClientRect().width>0;}) &&
      getComputedStyle(document.getElementById("hunt-fullscreen-btn")).visibility === "visible" &&
      github.left >= area.left && github.left <= area.left + 24 && github.bottom <= area.bottom && github.bottom >= area.bottom - 24);
    check("entry hides room navigation and media transport",
      ["hunt-prev","hunt-next","hunt-volume-btn","hunt-playpause-btn","hunt-skip-btn"].every(function(id){
        return getComputedStyle(document.getElementById(id)).visibility === "hidden";
      }) && getComputedStyle(document.getElementById("hunt-dots")).display === "none" &&
      getComputedStyle(document.getElementById("hunt-dollhouse-btn")).visibility === "hidden" &&
      getComputedStyle(document.getElementById("hunt-floor-btn")).visibility === "hidden");
    check("game-only shell stays inside the viewport width", area.left >= -1 && area.right <= innerWidth + 1,
      JSON.stringify({ innerWidth: innerWidth, left: area.left, right: area.right }));
    check("game-only shell stays within its width and height fit", area.width <= innerWidth + 1 &&
      area.width <= (innerHeight * 2 - 79),
      JSON.stringify({ innerWidth: innerWidth, innerHeight: innerHeight, width: area.width }));
    check("the invitation does not make the browser page scroll",
      area.top >= -1 && area.bottom <= innerHeight + 1 &&
      document.documentElement.scrollHeight <= innerHeight + 1,
      JSON.stringify({ innerHeight: innerHeight, area: area, scrollHeight: document.documentElement.scrollHeight }));
    if (innerWidth >= 1600 && innerHeight >= 900) {
      check("a large browser uses the full available width instead of the old 1620px cap",
        area.width > 1620 && area.width >= Math.min(innerWidth - 68, innerHeight * 2 - 80) - 1,
        JSON.stringify({ innerWidth: innerWidth, innerHeight: innerHeight, width: area.width }));
    }
    check("the invitation state keeps Trailer in view", watch.bottom <= innerHeight + 1,
      JSON.stringify({ innerHeight: innerHeight, watchBottom: watch.bottom, areaBottom: area.bottom }));
    check("Trailer occupies the shell's top row",
      document.querySelector(".watch-controls").parentNode.id === "hunt-bottom-nav" &&
      watch.top >= document.getElementById("hunt-bottom-nav").getBoundingClientRect().top - 1 &&
      watch.bottom <= frame.top + 1,
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
      check("entered page mode stays at the entry size within its extra control allowance",
        enteredArea.width >= invitationWidth - 16,
        invitationWidth + " -> " + enteredArea.width);
      check("entered page mode does not make the browser page scroll",
        enteredArea.top >= -1 && enteredArea.bottom <= innerHeight + 1 &&
        document.documentElement.scrollHeight <= innerHeight + 1,
        JSON.stringify({
          innerHeight: innerHeight,
          area: enteredArea,
          scrollHeight: document.documentElement.scrollHeight
        }));
      check("entered page mode remains outside true/class fullscreen",
        !document.getElementById("hunt-fullscreen-area").classList.contains("is-fullscreen"));
      if (${standalone ? "true" : "false"}) {
        var installedWidth = enteredArea.width;
        window.__toggleFullscreen();
        check("installed desktop can enter its fullscreen fill",
          document.getElementById("hunt-fullscreen-area").classList.contains("is-fullscreen"));
        window.__toggleFullscreen();
        var returnedArea = document.getElementById("hunt-fullscreen-area").getBoundingClientRect();
        check("installed desktop restores the full non-fullscreen fit after exiting",
          !document.getElementById("hunt-fullscreen-area").classList.contains("is-fullscreen") &&
          returnedArea.width >= installedWidth - 1 &&
          returnedArea.bottom <= innerHeight + 1 &&
          document.documentElement.scrollHeight <= innerHeight + 1,
          JSON.stringify({
            before: enteredArea,
            after: returnedArea,
            innerHeight: innerHeight,
            scrollHeight: document.documentElement.scrollHeight
          }));
      }
      window.__activateExtinguisher();
      setTimeout(function () {
        check("an in-game extinguisher reset preserves enlarged page mode and returns to CLICK ME",
          window.__gameOnlyEntered() && !window.__gameStarted() && !!document.getElementById("click-me-overlay") &&
          document.getElementById("hunt-fullscreen-area").classList.contains("intro-active") &&
          document.querySelector(".watch-controls").parentNode.id === "hunt-bottom-nav");
        window.__endAttract();
        window.__loftControllers.reset();
        setTimeout(function () {
          check("the public reset() API preserves enlarged page mode and returns to CLICK ME",
            window.__gameOnlyEntered() && !window.__gameStarted() && !!document.getElementById("click-me-overlay") &&
            document.getElementById("hunt-fullscreen-area").classList.contains("intro-active") &&
            getComputedStyle(document.querySelector(".game-langs")).display === "flex");
          if (${(!fullPage || standalone) ? "true" : "false"}) {
            var loader = document.getElementById("installed-load");
            check("scripted layout setup leaves entry progress dormant",
              window.__installedLoaderUsed === false && window.__installedLoaderComplete === false &&
              !!loader && getComputedStyle(loader).display === "none");
          }
          report();
        }, ${standalone ? "1800" : "900"});
      }, 900);
    }, 40);
  } catch (error) {
    out.errors.push("setup: " + (error && error.stack || error));
    report();
  }
  }, 100);
})();
</script>`;
  return lib.runPageSync(entryFile || (fullPage ? "rsvp.html" : "loft-day.html"), harness, standalone ? 4600 : 3200, {
    forceStandalone: !!standalone,
    patchRaf: true,
    chromeFlags: "--window-size=" + width + "," + height + " --force-device-scale-factor=1"
  });
}

var reports = [
  { label: "wide", report: run(1800, 1000) },
  { label: "canonical Loft Day", report: run(1800, 1000, false, false, "loft-day.html") },
  { label: "installed desktop", report: run(1800, 1000, true) },
  { label: "landscape phone", report: run(844, 390) },
  { label: "installed landscape phone", report: run(844, 390, true) },
  { label: "mobile", report: run(390, 844) },
  { label: "installed", report: run(390, 844, true) },
  { label: "RSVP portrait", report: run(390, 844, false, true) }
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
