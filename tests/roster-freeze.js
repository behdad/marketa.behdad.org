#!/usr/bin/env node
"use strict";

// The garden roster is a deliberate occupancy freeze-frame. A picked person gets a dedicated
// in-place reaction, but their arrival/departure wrapper must remain paused.
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  var pending = false;
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function report() {
    out.errors = out.errors.concat((window.__errs || []).slice());
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
  }
  function animatedPart(figure) {
    if (!figure) return null;
    var nodes = [figure].concat(Array.prototype.slice.call(figure.querySelectorAll("*")));
    return nodes.find(function (node) { return getComputedStyle(node).animationName !== "none"; }) || figure;
  }
  function state(node) { return node ? getComputedStyle(node).animationPlayState : "missing"; }

  try {
    window.__setGardenParty(true, false);
    window.goToStage("garden");
    if (window.__summonGuests) window.__summonGuests();
    var rosterToggle = document.querySelector(".roster-toggle");
    check("the Who's here chip is click-only scene chrome", rosterToggle && rosterToggle.tabIndex === -1,
      rosterToggle && rosterToggle.tabIndex);
    var stage = document.getElementById("stage-garden");
    var ali = document.querySelector("#garden-guests .g-ali");
    var goli = document.querySelector("#garden-guests .g-goli");
    var irene = document.querySelector("#garden-guests .g-irene");
    var aliPart = animatedPart(ali), goliPart = animatedPart(goli), irenePart = animatedPart(irene);
    var aliWalk = ali.querySelector(".guest-walk"), aliReact = ali.querySelector(".guest-react");
    var aliMover = ali.querySelector(".guest-move"), aliBox = aliMover.getBBox();

    window.__startGardenChase(true);
    var liveRunner = document.querySelector('[id^="garden-kid-"].chasing');
    var liveCross = liveRunner && liveRunner.querySelector(".gk-run");
    window.roster.set(true);
    var rosterClose = document.querySelector(".roster-close");
    var rosterCloseRect = rosterClose && rosterClose.getBoundingClientRect();
    check("the roster has a plainly sized circular dismiss control",
      rosterCloseRect && rosterCloseRect.width >= 40 && rosterCloseRect.height >= 40 &&
        getComputedStyle(rosterClose).borderRadius === "50%",
      rosterCloseRect ? rosterCloseRect.width + "x" + rosterCloseRect.height : "missing");
    check("opening the roster pauses an active chase sprite in place",
      liveCross && state(liveCross) === "paused" &&
        document.getElementById("loft-game-strip").classList.contains("roster-freeze-runners"),
      (liveRunner && liveRunner.id || "missing") + "/" + state(liveCross));
    check("opening the garden roster applies the adult freeze", stage.classList.contains("roster-freeze"));
    check("the open roster pauses named guests", state(aliPart) === "paused" && state(goliPart) === "paused",
      state(aliPart) + "/" + state(goliPart));
    check("party children cannot change position while the roster is open", state(irenePart) === "paused", state(irenePart));

    window.__spotlightGuest([".g-ali"]);
    var aliArrow = aliMover.querySelector(".guest-spot-arrow");
    var arrowBox = aliArrow && aliArrow.getBBox();
    check("a roster pick reacts in place without resuming its gate walk",
      state(aliReact) === "running" && state(aliWalk) === "paused" && state(goliPart) === "paused",
      state(aliReact) + "/" + state(aliWalk) + "/" + state(goliPart));
    check("the picked guest arrow uses the same SVG coordinate space as the figure",
      arrowBox && Math.abs((arrowBox.x + arrowBox.width / 2) - (aliBox.x + aliBox.width / 2)) < 0.2 &&
        Math.abs((arrowBox.y + arrowBox.height) - (aliBox.y - 3)) < 0.2,
      arrowBox ? JSON.stringify({ arrow: arrowBox, person: aliBox }) : "missing");

    window.__clearGuestSpotlight();
    check("the roster freeze remains after the short spotlight",
      stage.classList.contains("roster-freeze") && state(aliPart) === "paused", state(aliPart));

    var backdrop = document.querySelector(".roster-backdrop");
    var aliRect = ali.getBoundingClientRect();
    backdrop.dispatchEvent(new MouseEvent("click", {
      bubbles: true,
      clientX: aliRect.left + aliRect.width / 2,
      clientY: aliRect.top + aliRect.height / 2
    }));
    var pickedRow = document.querySelector(".roster-list li.roster-picked");
    check("clicking a person through the modal keeps it open and pulses their roster entry",
      window.__rosterOpen() && pickedRow && state(aliWalk) === "paused",
      String(window.__rosterOpen()) + "/" + !!pickedRow + "/" + state(aliWalk));

    window.__clearGuestSpotlight();
    window.__spotlightGuest(["__dj"]);
    var booth = document.getElementById("garden-djbooth");
    var dj = document.getElementById("garden-dj");
    check("selecting the DJ wiggles the person without rotating the booth or decks",
      getComputedStyle(dj).animationName === "roster-person-wiggle" &&
        getComputedStyle(booth).animationName !== "roster-person-wiggle",
      getComputedStyle(dj).animationName + "/" + getComputedStyle(booth).animationName);

    window.roster.set(false);
    check("closing the roster resumes the same chase timeline",
      liveCross && state(liveCross) === "running" &&
        !document.getElementById("loft-game-strip").classList.contains("roster-freeze-runners"),
      state(liveCross));
    if (window.__clearGardenChase) window.__clearGardenChase();
    check("closing the roster removes its freeze", !stage.classList.contains("roster-freeze") && state(aliPart) === "running",
      state(aliPart));

    window.roster.set(true);
    backdrop.dispatchEvent(new MouseEvent("click", {
      bubbles: true,
      clientX: aliRect.left + aliRect.width / 2,
      clientY: aliRect.top + aliRect.height / 2
    }));
    pending = true;
    setTimeout(function () {
      try {
        var pop = document.querySelector(".egg-bubble.who-pop");
        var arrow = document.querySelector(".guest-spot-arrow");
        var pr = pop && pop.getBoundingClientRect(), ar = arrow && arrow.getBoundingClientRect();
        check("the roster card sits just above rather than over the arrow",
          pr && ar && pr.bottom <= ar.top + 1 && ar.top - pr.bottom <= 12,
          pr && ar ? JSON.stringify({ popupBottom: pr.bottom, arrowTop: ar.top }) : "missing");
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
        check("ArrowRight changes rooms while keeping the roster open",
          window.currentStageName === "cuddly" && window.__rosterOpen(),
          window.currentStageName + "/" + window.__rosterOpen());
        document.getElementById("hunt-next").click();
        check("the next button changes rooms while keeping the roster open",
          window.currentStageName === "office" && window.__rosterOpen(),
          window.currentStageName + "/" + window.__rosterOpen());
        document.getElementById("hunt-prev").click();
        check("the previous button changes rooms while keeping the roster open",
          window.currentStageName === "cuddly" && window.__rosterOpen(),
          window.currentStageName + "/" + window.__rosterOpen());
        document.querySelectorAll(".hunt-dot")[4].click();
        check("a room dot changes rooms while keeping the roster open",
          window.currentStageName === "balcony" && window.__rosterOpen(),
          window.currentStageName + "/" + window.__rosterOpen());
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "1", bubbles: true, cancelable: true }));
        check("number keys change rooms while keeping the roster open",
          window.currentStageName === "kitchen" && window.__rosterOpen(),
          window.currentStageName + "/" + window.__rosterOpen());
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true }));
        check("ArrowLeft changes rooms while keeping the roster open",
          window.currentStageName === "kitchen" && window.__rosterOpen(),
          window.currentStageName + "/" + window.__rosterOpen());
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
        var fading = document.querySelector(".egg-bubble.who-pop");
        check("Escape closes the roster and starts dismissing its person card after a backdrop pick",
          !window.__rosterOpen() && (!fading || !fading.classList.contains("show")),
          String(window.__rosterOpen()) + "/" + !!(fading && fading.classList.contains("show")));
        window.__setGardenParty(false, false);
        window.__toggleRoster(true);
        check("party teardown hides the chip and refuses a stale roster",
          !rosterToggle.classList.contains("avail") && !window.__rosterOpen(),
          rosterToggle.className + "/" + window.__rosterOpen());
      } catch (error) {
        out.errors.push("async: " + (error && error.stack || error));
      }
      setTimeout(function () {
        check("the dismissed roster card is removed after its fade", !document.querySelector(".egg-bubble.who-pop"));
        report();
      }, 340);
    }, 80);
  } catch (error) {
    out.errors.push("setup: " + (error && error.stack || error));
  }
  if (!pending) report();
})();
</script>`;

var report = lib.runPageSync("rsvp.html", harness, 4000, {
  forceMotion: true,
  seedRandom: true,
  patchRaf: true
});

if (!report) { console.error("roster freeze: no report"); process.exit(1); }
var failed = false;
report.checks.forEach(function (c) {
  console.log("  " + (c.pass ? "✓" : "✗") + " " + c.name + (c.pass || !c.detail ? "" : " — " + c.detail));
  if (!c.pass) failed = true;
});
if (report.errors.length) { failed = true; console.error("runtime errors:\n  " + report.errors.join("\n  ")); }
if (failed) process.exit(1);
console.log("roster freeze: all " + report.checks.length + " checks passed");
