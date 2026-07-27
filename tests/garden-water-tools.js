#!/usr/bin/env node
"use strict";

var lib = require("./lib");
var harness = String.raw`<script>
(function () {
  var report = { errors: [], can: null, mister: null };
  function point(x, y) {
    var svg = document.getElementById("loft-game-strip"), p = svg.createSVGPoint();
    p.x = x; p.y = y;
    return p.matrixTransform(svg.getScreenCTM());
  }
  function drag(el, x, y, pointerId) {
    var r = el.getBoundingClientRect(), sx = r.left + r.width / 2, sy = r.top + r.height / 2, end = point(x, y);
    el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: pointerId, button: 0, buttons: 1, clientX: sx, clientY: sy }));
    el.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerId: pointerId, buttons: 1, clientX: end.x, clientY: end.y }));
    el.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: pointerId, button: 0, clientX: end.x, clientY: end.y }));
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, clientX: end.x, clientY: end.y }));
  }
  addEventListener("load", function () { setTimeout(function () {
    goToStage("garden");
    var before = __plantWaterState(), bottles = __gardenWaterInventoryState();
    drag(document.getElementById("garden-watering-can"), 1090, 200, 41);
    var afterCan = __plantWaterState();
    report.can = { before: before.counts["garden-peacelily"], after: afterCan.counts["garden-peacelily"] };
    drag(document.getElementById("garden-plant-mister"), 950, 195, 42);
    var afterMister = __plantWaterState();
    report.mister = {
      monstera: afterMister.counts["garden-monstera"],
      snake: afterMister.counts["garden-snakeplant"],
      bottlesUnchanged: JSON.stringify(bottles.levels) === JSON.stringify(__gardenWaterInventoryState().levels)
    };
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
if (failed) process.exit(1);
console.log("garden water tools: all checks passed");
