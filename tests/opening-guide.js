#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var harness = String.raw`<script>
(async function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function click(node, x, y) { if (node) node.dispatchEvent(new MouseEvent("click", {
    bubbles: true, cancelable: true, clientX: x || 0, clientY: y || 0
  })); }
  function report() {
    out.errors = (window.__errs || []).slice();
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
  }
  function cardSignature(card) {
    var s = getComputedStyle(card);
    return [s.backgroundColor, s.borderColor, s.borderWidth, s.borderRadius, s.boxShadow,
      s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft,
      s.fontFamily, s.fontSize, s.fontWeight, s.lineHeight].join("|");
  }
  function inside(inner, outer) {
    return inner.left >= outer.left - 1 && inner.right <= outer.right + 1 &&
      inner.top >= outer.top - 1 && inner.bottom <= outer.bottom + 1;
  }
  async function showGuide(lang) {
    window.__setLang(lang);
    if (window.__showHuntIntro) window.__showHuntIntro();
    await sleep(30);
    click(document.getElementById("click-me-overlay"));
    await sleep(60);
    var area = document.getElementById("hunt-fullscreen-area");
    if (innerHeight <= 400 && innerWidth > innerHeight) {
      area.classList.add("is-fullscreen");
      if (window.__sizeFullscreenFrame) window.__sizeFullscreenFrame();
    }
    area.scrollIntoView({ block: "start" });
    await sleep(30);
    window.dispatchEvent(new Event("resize"));
    await sleep(40);
  }

  await sleep(900);
  await showGuide("en");
  var area = document.getElementById("hunt-fullscreen-area");
  var overlay = document.getElementById("opening-guide-coach");
  var card = overlay.querySelector(".hunt-coach-card");
  var copy = overlay.querySelector(".hunt-coach-copy");
  var navCopy = overlay.querySelector('[data-i="intro_guide_nav"]');
  var captionCopy = overlay.querySelector('[data-i="intro_guide"]');
  var x = overlay.querySelector(".hunt-coach-x");
  var navArrow = overlay.querySelector(".opening-guide-arrow-nav");
  var captionArrow = overlay.querySelector(".opening-guide-arrow-caption");
  check("English landmarks coach uses the shared readable card and explicit dismiss control",
    overlay.classList.contains("show") && window.__openingGuideStep() === "landmarks" &&
      navCopy.textContent === "Navigation at the top." &&
      captionCopy.textContent === "Instructions at the bottom." && x.textContent === "×" &&
      document.getElementById("hunt-caption").textContent === "Click to dismiss." &&
      card.querySelectorAll(":scope > .hunt-coach-x").length === 1);
  var cardRect = card.getBoundingClientRect(), xRect = x.getBoundingClientRect();
  var areaRect = area.getBoundingClientRect();
  check("the responsive modal coach stays prominent without crowding a short shell",
    cardRect.width >= areaRect.width * .64 && cardRect.height >= areaRect.height * .22,
    JSON.stringify({ card: cardRect.toJSON(), area: areaRect.toJSON() }));
  check("the modal surface blocks input without washing out the scene",
    getComputedStyle(overlay).backgroundColor === "rgba(0, 0, 0, 0)",
    getComputedStyle(overlay).backgroundColor);
  check("the coach dismiss control stays in the true upper-right corner",
    xRect.top - cardRect.top < 16 && cardRect.right - xRect.right < 16,
    JSON.stringify({ card: cardRect.toJSON(), dismiss: xRect.toJSON() }));
  check("landmarks coach stays inside the game shell between its targets",
    inside(card.getBoundingClientRect(), area.getBoundingClientRect()) &&
      card.getBoundingClientRect().top > document.getElementById("hunt-bottom-nav").getBoundingClientRect().bottom &&
      card.getBoundingClientRect().bottom < document.getElementById("hunt-caption").getBoundingClientRect().top,
    JSON.stringify({ card: card.getBoundingClientRect().toJSON(), area: area.getBoundingClientRect().toJSON() }));
  var navArrowBox = navArrow.getBBox(), captionArrowBox = captionArrow.getBBox();
  var navRect = document.getElementById("hunt-bottom-nav").getBoundingClientRect();
  var captionRect = document.getElementById("hunt-caption").getBoundingClientRect();
  check("opening coach has one arrow for each landmark with the requested motion policy",
    overlay.querySelectorAll("svg > path.hunt-coach-arrow").length === 2 &&
      !overlay.querySelector("svg polygon,svg rect") && !!navArrow.getAttribute("d") &&
      !!captionArrow.getAttribute("d") && getComputedStyle(navArrow).fill === "rgb(239, 23, 23)" &&
      [navArrow, captionArrow].every(function (arrow) {
        return getComputedStyle(arrow).animationName ===
          (matchMedia("(prefers-reduced-motion: reduce)").matches ? "none" : "kitchen-arrow-bounce");
      }),
    [getComputedStyle(navArrow).animationName, getComputedStyle(captionArrow).animationName].join(", "));
  check("the two opening arrows occupy opposite sides of the card and reach their chrome targets",
    navArrowBox.y <= navRect.bottom - areaRect.top + 8 &&
      navArrowBox.y + navArrowBox.height <= cardRect.top - areaRect.top + 14 &&
      captionArrowBox.y >= cardRect.bottom - areaRect.top - 14 &&
      captionArrowBox.y + captionArrowBox.height >= captionRect.top - areaRect.top - 20,
    JSON.stringify({ navArrow: navArrowBox, captionArrow: captionArrowBox,
      nav: navRect.toJSON(), caption: captionRect.toJSON(), card: cardRect.toJSON() }));
  check("both landmark labels stay on one line",
    [navCopy, captionCopy].every(function (line) { return getComputedStyle(line).whiteSpace === "nowrap"; }),
    JSON.stringify([navCopy.getBoundingClientRect().toJSON(), captionCopy.getBoundingClientRect().toJSON()]));
  check("the opening coach clips animated arrow paint to the embedded game shell",
    getComputedStyle(overlay).overflow === "hidden", getComputedStyle(overlay).overflow);

  var cabinet = document.getElementById("kitchen-cabinet-2");
  var machine = document.getElementById("kitchen-lamarzocco"), cr = machine.getBoundingClientRect();
  var hit = document.elementFromPoint(cr.left + cr.width / 2, cr.top + cr.height / 2);
  var hitX = cr.left + cr.width / 2, hitY = cr.top + cr.height / 2;
  if (!hit || hit.closest(".hunt-coach-card")) {
    hit = null;
    for (var py = 8; py < innerHeight && !hit; py += 28) {
      for (var px = 8; px < innerWidth; px += 28) {
        var candidate = document.elementFromPoint(px, py);
        if (candidate && candidate.closest("#opening-guide-coach") && !candidate.closest(".hunt-coach-card")) {
          var targetRect = document.getElementById("hunt-caption").getBoundingClientRect();
          if (px < targetRect.left || px > targetRect.right || py < targetRect.top || py > targetRect.bottom) {
            hit = candidate; hitX = px; hitY = py; break;
          }
        }
      }
    }
  }
  click(hit, hitX, hitY);
  check("background input is swallowed without advancing or operating Kitchen",
    hit && hit.closest("#opening-guide-coach") && window.__openingGuideStep() === "landmarks" &&
      !machine.classList.contains("powered-on") && !cabinet.classList.contains("open"),
    JSON.stringify({ hit: hit && (hit.id || hit.className && String(hit.className)), step: window.__openingGuideStep(),
      powered: machine.classList.contains("powered-on"), open: cabinet.classList.contains("open") }));
  await showGuide("en");
  var captionTarget = document.getElementById("hunt-caption");
  var captionTargetRect = captionTarget.getBoundingClientRect();
  var captionTargetHit = document.elementFromPoint(captionTargetRect.left + captionTargetRect.width / 2,
    captionTargetRect.top + captionTargetRect.height / 2);
  click(captionTargetHit || captionTarget, captionTargetRect.left + captionTargetRect.width / 2,
    captionTargetRect.top + captionTargetRect.height / 2);
  check("clicking the taught caption target dismisses the opening coach",
    !window.__openingGuideShowing() && !overlay.classList.contains("show"),
    JSON.stringify({ hit: captionTargetHit && (captionTargetHit.id || String(captionTargetHit.className)),
      rect: captionTargetRect.toJSON() }));
  await showGuide("en");
  await sleep(1050);
  click(card);
  check("clicking the coach card itself dismisses the opening coach",
    !window.__openingGuideShowing() && !overlay.classList.contains("show"));
  await showGuide("en");
  check("the opening guide and Party exploration overlay own the modal treatment",
    overlay.classList.contains("modal-coach") && getComputedStyle(overlay).pointerEvents === "auto" &&
      document.querySelectorAll(".hunt-coach-overlay.modal-coach").length === 3 &&
      Array.prototype.slice.call(document.querySelectorAll("#party-room-map-coach")).every(function (item) {
        return item.classList.contains("modal-coach") && item.classList.contains("party-onboarding-coach") &&
          getComputedStyle(item).pointerEvents === "none";
      }));

  var guideMusicBefore = window.__anySongPlaying && window.__anySongPlaying();
  var guideSpace = new KeyboardEvent("keydown", { key: " ", code: "Space", bubbles: true, cancelable: true });
  document.dispatchEvent(guideSpace);
  check("Space dismisses and consumes the opening coach",
    guideSpace.defaultPrevented && !window.__openingGuideShowing() && !overlay.classList.contains("show") &&
      (!window.__anySongPlaying || window.__anySongPlaying() === guideMusicBefore));
  var solveCalls = 0, realKitchenDoNext = window.__kitchenDoNext;
  window.__kitchenDoNext = function () { solveCalls++; return true; };
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace", bubbles: true, cancelable: true }));
  window.__kitchenDoNext = realKitchenDoNext;
  check("room-level Escape and Backspace never advance the morning routine", solveCalls === 0 && !machine.classList.contains("powered-on"), String(solveCalls));

  window.__goToStage("kitchen");
  await showGuide("cs");
  check("Czech landmarks coach is concise and localized",
    navCopy.textContent === "Navigace nahoře." && captionCopy.textContent === "Pokyny dole." &&
      document.getElementById("hunt-caption").textContent === "Klikni pro zavření." &&
      !/pokračuj/i.test(copy.textContent));
  var partyCards = Array.prototype.slice.call(document.querySelectorAll("#party-room-map-coach .hunt-coach-card"));
  check("opening and Party onboarding coaches share the approved responsive-card structure",
    partyCards.length === 1 &&
      partyCards.every(function (item) {
        return item.querySelectorAll(":scope > .hunt-coach-copy").length === 1 &&
          item.querySelectorAll(":scope > .hunt-coach-x").length === 1;
      }));
  click(x);

  await showGuide("en");
  localStorage.setItem("opening-guide-reset-unrelated", "keep");
  localStorage.setItem("loftCheckpoint:v1", "discarded-by-explicit-reset");
  var confirmations = 0;
  window.confirm = function () { confirmations++; return true; };
  var reset = document.getElementById("hunt-restart-btn"), resetRect = reset.getBoundingClientRect();
  var resetHit = document.elementFromPoint(resetRect.left + resetRect.width / 2, resetRect.top + resetRect.height / 2);
  click(resetHit);
  await sleep(850);
  var watch = document.getElementById("watch-loft-btn"), watchRect = watch.getBoundingClientRect();
  var watchHit = document.elementFromPoint(watchRect.left + watchRect.width / 2, watchRect.top + watchRect.height / 2);
  check("Phase-one coach keeps the explicit whole-loft Reset pointer-accessible",
    resetHit && resetHit.closest("#hunt-restart-btn") && confirmations === 1,
    JSON.stringify({ hit: resetHit && (resetHit.id || String(resetHit.className)), confirmations: confirmations }));
  check("Phase-one Kitchen Reset returns to CLICK ME with Trailer selectable",
    window.__currentStageName === "kitchen" && !window.__secondRound && window.__maxUnlocked() === 0 &&
      !window.__gameStarted() && !!document.getElementById("click-me-overlay") &&
      document.getElementById("hunt-fullscreen-area").classList.contains("intro-active") &&
      !document.getElementById("hunt-fullscreen-area").classList.contains("opening-guide-active") &&
      watchHit && watchHit.closest("#watch-loft-btn"),
    JSON.stringify({ room: window.__currentStageName, phase2: !!window.__secondRound,
      max: window.__maxUnlocked(), started: window.__gameStarted(), watchHit: watchHit && (watchHit.id || String(watchHit.className)) }));
  check("explicit Reset discards the stale checkpoint and preserves unrelated browser data",
    (function () {
      var saved = localStorage.getItem("loftCheckpoint:v1"), parsed = null;
      try { parsed = saved && JSON.parse(saved); } catch (_error) {}
      return saved !== "discarded-by-explicit-reset" && (!saved || (parsed && parsed.progress &&
        parsed.progress.room === "kitchen" && parsed.progress.phase2 === false)) &&
        localStorage.getItem("opening-guide-reset-unrelated") === "keep";
    })(),
    JSON.stringify({ checkpoint: localStorage.getItem("loftCheckpoint:v1"),
      unrelated: localStorage.getItem("opening-guide-reset-unrelated") }));
  localStorage.removeItem("opening-guide-reset-unrelated");
  report();
})().catch(function (error) {
  var pre = document.createElement("pre"); pre.id = "__report";
  pre.textContent = JSON.stringify({ checks: [], errors: [String(error && error.stack || error)] });
  document.body.appendChild(pre);
});
</script>`;

function run(label, opts) {
  var result = lib.runPageSync("rsvp.html", harness, 5200, opts);
  if (!result) { console.error("opening guide " + label + ": no report"); return false; }
  var failed = false;
  result.checks.forEach(function (check) {
    console.log("  " + (check.pass ? "PASS" : "FAIL") + " " + label + ": " + check.name +
      (check.pass || !check.detail ? "" : " - " + check.detail));
    if (!check.pass) failed = true;
  });
  if (result.errors.length) { failed = true; console.error("  " + label + " errors: " + result.errors.join("; ")); }
  return !failed;
}

var desktop = run("desktop", { forceMotion: true, patchRaf: true, chromeFlags: "--window-size=1100,900" });
var mobile = run("mobile landscape/reduced motion", {
  forceReduce: true, forceCoarsePointer: true, patchRaf: true,
  chromeFlags: "--window-size=740,480 --force-prefers-reduced-motion"
});
var mobileShort = run("390px-tall mobile landscape", {
  forceCoarsePointer: true, patchRaf: true, chromeFlags: "--window-size=844,390"
});
if (!desktop || !mobile || !mobileShort) process.exit(1);
console.log("opening guide: all focused checks passed");
