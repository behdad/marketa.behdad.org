#!/usr/bin/env node
"use strict";

var lib = require("./lib");
var harness = String.raw`<script>
(function () {
  window.__goToStage("kitchen");
  if (window.__setSecondRound) window.__setSecondRound(true, { releaseHeld: false });
  if (window.__setPartyMode) window.__setPartyMode(false, true);
  if (window.__setDayNight) window.__setDayNight(true);
  var mixer = document.getElementById("kitchen-bar-mixer");
  var patrons = document.getElementById("kitchen-bar-patrons");
  var bottles = mixer ? mixer.querySelectorAll(".mixer-bottle") : [];
  var stool1 = document.getElementById("kitchen-bar-stool-1");
  var stool3 = document.getElementById("kitchen-bar-stool-3");
  var patronA = document.getElementById("kitchen-bar-patron-a");
  var patronB = document.getElementById("kitchen-bar-patron-b");
  var cooler = document.getElementById("kitchen-bar-cooler");
  var opener = document.getElementById("kitchen-bar-cooler-opener");
  var dietCans = cooler ? cooler.querySelectorAll("#kitchen-bar-cooler-inside .diet-coke-can") : [];
  function pointer(type, x) {
    cooler.dispatchEvent(new PointerEvent(type, {
      bubbles: true, cancelable: true, pointerId: 7, pointerType: "mouse",
      button: 0, buttons: type === "pointerup" ? 0 : 1, clientX: x, clientY: 460
    }));
  }
  pointer("pointerdown", 120);
  pointer("pointermove", 220);
  pointer("pointerup", 220);
  cooler.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  var coolerAfterDrag = {
    offset: window.__cokeCoolerOffset(),
    lidUp: cooler.classList.contains("lid-up")
  };
  var lidHitL = document.getElementById("kitchen-bar-cooler-lid-hit-l");
  var lidHitR = document.getElementById("kitchen-bar-cooler-lid-hit-r");
  function tap(el) { el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })); }
  tap(lidHitR);
  var coolerRightOnly = cooler.classList.contains("lid-r-up") && !cooler.classList.contains("lid-l-up");
  tap(lidHitL);
  var coolerBoth = cooler.classList.contains("lid-r-up") && cooler.classList.contains("lid-l-up");
  tap(lidHitR);
  var coolerLeftOnly = !cooler.classList.contains("lid-r-up") && cooler.classList.contains("lid-l-up");
  tap(lidHitL);
  var coolerBothClosed = !cooler.classList.contains("lid-up");
  tap(opener);
  var coolerOpenerWorks = !!cooler.querySelector(".cooler-cap");
  window.__resetCokeCooler();
  function innerShift(el) {
    return el && el.firstElementChild ? el.firstElementChild.getAttribute("transform") : null;
  }
  var report = {
    errors: window.__errs,
    mixerBeforePatrons: !!(mixer && patrons && (mixer.compareDocumentPosition(patrons) & Node.DOCUMENT_POSITION_FOLLOWING)),
    bottleCount: bottles.length,
    vermouthBody: bottles[2] && bottles[2].querySelector("rect") ? bottles[2].querySelector("rect").getAttribute("fill") : null,
    shifts: [innerShift(stool1), innerShift(stool3), innerShift(patronA), innerShift(patronB)],
    coolerAfterDrag: coolerAfterDrag,
    coolerRightOnly: coolerRightOnly,
    coolerBoth: coolerBoth,
    coolerLeftOnly: coolerLeftOnly,
    coolerBothClosed: coolerBothClosed,
    coolerOpenerWorks: coolerOpenerWorks,
    coolerReset: window.__cokeCoolerOffset() === 0 && !cooler.classList.contains("lid-up"),
    dietCans: dietCans.length,
    dietLabels: Array.prototype.map.call(dietCans, function (can) {
      var label = can.querySelector("text");
      return label && label.textContent;
    })
  };
  var pre = document.createElement("pre");
  pre.id = "__report";
  pre.textContent = JSON.stringify(report);
  document.body.appendChild(pre);
})();
</script>`;

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail == null ? "" : " [" + JSON.stringify(detail) + "]")); }
}

console.log("rsvp.html calm-night bar layout:");
var result = lib.runPageSync("rsvp.html", harness, 1400, { patchRaf: true, forceMotion: true });
check(!!result, "focused browser harness completed", result);
if (result) {
  check(!result.errors.length, "no uncaught page errors", result.errors);
  check(result.mixerBeforePatrons, "the hands-on mixer paints behind the seated patrons");
  check(result.bottleCount === 4, "the mixer still exposes exactly four ingredient bottles", result.bottleCount);
  check(result.vermouthBody === "#5f8a52", "the vermouth bottle uses distinct green glass", result.vermouthBody);
  check(result.shifts.length === 4 && result.shifts.every(function (v) { return v === "translate(-15,0)"; }),
    "both occupied stools and both patrons share the 15-unit default left shift", result.shifts);
  check(result.coolerAfterDrag.offset > 0 && !result.coolerAfterDrag.lidUp,
    "rolling the Coca-Cola cooler moves it without also opening its lid", result.coolerAfterDrag);
  check(result.coolerRightOnly && result.coolerBoth && result.coolerLeftOnly && result.coolerBothClosed,
    "each visible cooler lid toggles independently", {
      rightOnly: result.coolerRightOnly,
      both: result.coolerBoth,
      leftOnly: result.coolerLeftOnly,
      bothClosed: result.coolerBothClosed
    });
  check(result.coolerOpenerWorks, "the cooler's wall opener still pops a bottle cap");
  check(result.coolerReset, "a game reset returns the cooler home with its lid down");
  check(result.dietCans === 3 && result.dietLabels.every(function (label) { return label === "diet"; }),
    "the opened Coca-Cola cooler contains three Diet Coke cans", result.dietLabels);
}
process.exitCode = failures ? 1 : 0;
