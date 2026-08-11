#!/usr/bin/env node
"use strict";

var lib = require("./lib");
var harness = String.raw`<script>
(function () {
  var report = { errors: [], can: null, mister: null, moneyTree: null, droplets: null };
  var dropletAnimations = 0, nativeAnimate = Element.prototype.animate;
  Element.prototype.animate = function () {
    if (this.classList.contains("garden-water-droplet")) dropletAnimations++;
    return nativeAnimate.apply(this, arguments);
  };
  function point(x, y) {
    var svg = document.getElementById("loft-game-strip"), p = svg.createSVGPoint();
    p.x = x; p.y = y;
    return p.matrixTransform(svg.getScreenCTM());
  }
  function drag(el, x, y, pointerId, outlet) {
    var r = el.getBoundingClientRect(), sx = r.left + r.width / 2, sy = r.top + r.height / 2;
    var svg = document.getElementById("loft-game-strip"), start = svg.createSVGPoint();
    start.x = sx; start.y = sy;
    start = start.matrixTransform(svg.getScreenCTM().inverse());
    var end = point(outlet ? x + start.x - outlet.x : x, outlet ? y + start.y - outlet.y : y);
    el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: pointerId, button: 0, buttons: 1, clientX: sx, clientY: sy }));
    el.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerId: pointerId, buttons: 1, clientX: end.x, clientY: end.y }));
    el.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: pointerId, button: 0, clientX: end.x, clientY: end.y }));
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, clientX: end.x, clientY: end.y }));
  }
  addEventListener("load", function () { setTimeout(async function () {
    goToStage("garden");
    var before = __plantWaterState(), bottles = __gardenWaterInventoryState();
    drag(document.getElementById("garden-watering-can"), 1090, 200, 41, { x: 856, y: 285 });
    var afterCan = __plantWaterState();
    report.can = { before: before.counts["garden-peacelily"], after: afterCan.counts["garden-peacelily"] };
    drag(document.getElementById("garden-plant-mister"), 950, 195, 42, { x: 1041.5, y: 201 });
    var afterMister = __plantWaterState();
    report.mister = {
      monstera: afterMister.counts["garden-monstera"],
      snake: afterMister.counts["garden-snakeplant"],
      bottlesUnchanged: JSON.stringify(bottles.levels) === JSON.stringify(__gardenWaterInventoryState().levels)
    };
    var moneyBefore = __gardenWaterInventoryState().levels.reduce(function (sum, n) { return sum + n; }, 0);
    drag(document.getElementById("garden-bottles"), 788, 205, 43);
    document.getElementById("garden-money-tree").dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    var moneyAfter = __gardenWaterInventoryState().levels.reduce(function (sum, n) { return sum + n; }, 0);
    report.moneyTree = {
      count: __plantWaterState().counts["garden-money-tree"],
      bottleUses: moneyBefore - moneyAfter
    };
    await new Promise(function (resolve) { setTimeout(resolve, 30); });
    var droplets = Array.from(document.querySelectorAll(".garden-water-droplet"));
    report.droplets = { live: droplets.length, animated: dropletAnimations };
    report.errors = (window.__errs || []).slice();
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(report); document.body.appendChild(pre);
  }, 300); });
})();
</script>`;

var r = lib.runPageSync("rsvp.html", harness, 2200, { patchRaf: true });
if (!r) { console.error("garden water tools: no report"); process.exit(1); }
var failed = false;
function check(ok, text, detail) {
  console.log("  " + (ok ? "✓ " : "✗ ") + text + (ok ? "" : " — " + JSON.stringify(detail)));
  if (!ok) failed = true;
}
check(!r.errors.length, "no uncaught page errors", r.errors);
check(r.can && r.can.after === r.can.before + 1, "the watering can waters the plant it is dropped on", r.can);
check(r.mister && r.mister.monstera === 1 && r.mister.snake === 0, "the mister waters its drop target without also watering its shelf neighbor", r.mister);
check(r.mister && r.mister.bottlesUnchanged, "reusable tools do not consume bottle inventory", r.mister);
check(r.moneyTree && r.moneyTree.count === 2 && r.moneyTree.bottleUses === 2, "the money tree accepts a dragged bottle and a direct watering click", r.moneyTree);
check(r.droplets && r.droplets.animated > 0,
  "watering launches falling droplet animations even when finished nodes clean up immediately", r.droplets);
if (failed) process.exit(1);
console.log("garden water tools: all checks passed");
