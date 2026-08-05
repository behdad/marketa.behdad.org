#!/usr/bin/env node
// Campsite Porsche controls own precise regions; body drags stay inside the parking space.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [] };
  function click(node) {
    node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  }
  function pointHits(paths, x, y) {
    var point = new DOMPoint(x, y);
    return Array.prototype.filter.call(paths, function (path) { return path.isPointInFill(point); })
      .map(function (path) { return path.getAttribute("data-camp-car-action"); });
  }
  function clientPoint(host, x, y) {
    var point = host.ownerSVGElement.createSVGPoint();
    point.x = x;
    point.y = y;
    return point.matrixTransform(host.getScreenCTM());
  }
  function pointer(node, host, type, x, y, pointerId, pointerType) {
    var point = clientPoint(host, x, y);
    node.dispatchEvent(new PointerEvent(type, {
      bubbles: true, cancelable: true, button: 0, buttons: type === "pointerup" ? 0 : 1,
      clientX: point.x, clientY: point.y, pointerId: pointerId, pointerType: pointerType, isPrimary: true
    }));
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        window.__unlockAllRooms();
        window.goToStage("balcony");
        window.__openEntranceRoom();
        window.__openEntrancePorscheDriveHud();
        window.__entranceRoadtripStart();
        window.__entranceRoadtripSetRoute("camp", 0);

        var style = document.createElement("style");
        style.textContent = "#entrance-roadtrip-camp-porsche *{transition:none!important}";
        document.head.appendChild(style);
        var host = document.getElementById("entrance-roadtrip-camp-porsche");
        var copy = host.querySelector(".entrance-roadtrip-camp-porsche-copy");
        var dragHit = copy.querySelector(".entrance-roadtrip-camp-car-drag-hit");
        var hits = copy.querySelectorAll("[data-camp-car-action]");
        var actionClasses = {
          door: "door-open", frunk: "frunk-open", trunk: "trunk-open",
          window: "windows-open", roof: "roof-open", lamps: "lamps-on"
        };
        var expectedPoints = [
          ["door", 220, 285], ["frunk", 90, 265], ["trunk", 320, 264],
          ["window", 220, 241], ["roof", 220, 219],
          ["lamps", 27, 292], ["lamps", 357, 294]
        ];
        report.points = expectedPoints.map(function (row) {
          return [row[0], pointHits(hits, row[1], row[2])];
        });
        report.overlaps = [];
        for (var y = 210; y <= 324; y += 2) for (var x = 4; x <= 374; x += 2) {
          var actions = Array.from(new Set(pointHits(hits, x, y)));
          if (actions.length > 1) report.overlaps.push([x, y, actions]);
        }
        report.hitMap = {
          count: hits.length,
          actionCount: new Set(Array.prototype.map.call(hits, function (hit) {
            return hit.getAttribute("data-camp-car-action");
          })).size,
          dragBelowControls: copy.lastElementChild.classList.contains("entrance-roadtrip-camp-car-hits") &&
            copy.lastElementChild.previousElementSibling === dragHit
        };
        window.setLang("cs");
        report.czechDoorTitle = copy.querySelector('[data-camp-car-action="door"]').getAttribute("title");
        window.setLang("en");

        Object.keys(actionClasses).forEach(function (action) { host.classList.remove(actionClasses[action]); });
        function snapshot() {
          var result = {};
          Object.keys(actionClasses).forEach(function (action) {
            result[action] = host.classList.contains(actionClasses[action]);
          });
          return result;
        }
        var isolated = true;
        var caption = document.getElementById("hunt-caption");
        var captionBefore = caption.textContent;
        Object.keys(actionClasses).forEach(function (action) {
          var before = snapshot();
          click(copy.querySelector('[data-camp-car-action="' + action + '"]'));
          var after = snapshot();
          if (after[action] === before[action]) isolated = false;
          Object.keys(actionClasses).forEach(function (other) {
            if (other !== action && after[other] !== before[other]) isolated = false;
          });
        });
        function opacity(selector) {
          var node = copy.querySelector(selector);
          return node && getComputedStyle(node).opacity;
        }
        report.props = {
          isolated: isolated,
          captionStayed: caption.textContent === captionBefore,
          classes: snapshot(),
          door: [opacity(".entrance-roadtrip-camp-door-open"), opacity(".entrance-roadtrip-camp-door-closed"),
            opacity(".entrance-roadtrip-camp-door-well")],
          roof: [opacity(".entrance-roadtrip-camp-roof-closed"), opacity(".entrance-roadtrip-camp-roof-stack"),
            opacity(".entrance-roadtrip-camp-open-cockpit")],
          window: getComputedStyle(copy.querySelector(".entrance-roadtrip-camp-side-glass")).visibility,
          frunk: [opacity(".entrance-roadtrip-camp-frunk-panel"), opacity(".entrance-roadtrip-camp-frunk-well")],
          trunk: [getComputedStyle(copy.querySelector(".entrance-roadtrip-camp-trunk-panel")).transform,
            opacity(".entrance-roadtrip-camp-trunk-well")],
          lamps: opacity(".entrance-porsche-headlight-on")
        };

        pointer(dragHit, host, "pointerdown", 140, 300, 11, "mouse");
        pointer(dragHit, host, "pointermove", 900, 900, 11, "mouse");
        pointer(dragHit, host, "pointerup", 900, 900, 11, "mouse");
        report.mouseDrag = {
          x: host.getAttribute("data-camp-car-drag-x"),
          y: host.getAttribute("data-camp-car-drag-y"),
          transform: copy.getAttribute("transform"),
          released: !host.classList.contains("is-dragging")
        };

        pointer(dragHit, host, "pointerdown", 140, 300, 22, "touch");
        pointer(dragHit, host, "pointermove", -900, -900, 22, "touch");
        pointer(dragHit, host, "pointerup", -900, -900, 22, "touch");
        var touchMove = new Event("touchmove", { bubbles: true, cancelable: true });
        dragHit.dispatchEvent(touchMove);
        report.touchDrag = {
          x: host.getAttribute("data-camp-car-drag-x"),
          y: host.getAttribute("data-camp-car-drag-y"),
          transform: copy.getAttribute("transform"),
          movePrevented: touchMove.defaultPrevented
        };

        host.classList.remove("door-open");
        var beforeControlDrag = copy.getAttribute("transform");
        var door = copy.querySelector('[data-camp-car-action="door"]');
        pointer(door, host, "pointerdown", 220, 285, 33, "mouse");
        pointer(door, host, "pointermove", 900, 900, 33, "mouse");
        pointer(door, host, "pointerup", 900, 900, 33, "mouse");
        click(door);
        report.controlPrecedence = {
          doorOpened: host.classList.contains("door-open"),
          carStayed: copy.getAttribute("transform") === beforeControlDrag
        };
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
      }
      report.errors = (window.__errs || []).concat(report.errors);
      document.getElementById("__report").textContent = JSON.stringify(report);
    }, 300);
  });
})();
</script>`;

var result = lib.runPageSync("rsvp.html", HARNESS, 5200, {
  patchRaf: true,
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=12:00#play",
  chromeFlags: "--window-size=1100,900"
});
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail == null ? "" : "   [" + JSON.stringify(detail) + "]"));
  }
}

console.log("rsvp.html campsite parked-car controls:");
check(result && result.errors.length === 0, "controls run without uncaught errors", result && result.errors);
check(result && result.hitMap && result.hitMap.count === 7 && result.hitMap.actionCount === 6 &&
  result.hitMap.dragBelowControls, "six controls own seven topmost regions above the body drag surface",
  result && result.hitMap);
check(result && result.points && result.points.every(function (row) {
  return row[1].length === 1 && row[1][0] === row[0];
}), "authored points resolve to exactly the intended car control", result && result.points);
check(result && result.overlaps && result.overlaps.length === 0,
  "the precise control regions never overlap", result && result.overlaps);
check(result && result.czechDoorTitle === "Otevřít nebo zavřít dveře Fancy Stupid",
  "generated control titles follow the active language", result && result.czechDoorTitle);
check(result && result.props && result.props.isolated && result.props.captionStayed &&
  Object.values(result.props.classes).every(Boolean),
  "every prop toggles independently without replacing the campsite caption", result && result.props);
check(result && result.props && result.props.door.join(",") === "1,0,1" &&
  result.props.roof.join(",") === "0,1,1" && result.props.window === "hidden" &&
  result.props.frunk.join(",") === "1,1" && result.props.trunk[0] !== "none" &&
  result.props.trunk[1] === "1" && result.props.lamps === "1",
  "all six toggles produce visible state changes", result && result.props);
check(result && result.mouseDrag && result.mouseDrag.x === "10.00" && result.mouseDrag.y === "8.00" &&
  result.mouseDrag.released, "mouse dragging clamps at the parking-space front/lower edge",
  result && result.mouseDrag);
check(result && result.touchDrag && result.touchDrag.x === "-30.00" && result.touchDrag.y === "-8.00" &&
  result.touchDrag.movePrevented, "touch dragging clamps at the parking-space back/upper edge and suppresses panning",
  result && result.touchDrag);
check(result && result.controlPrecedence && result.controlPrecedence.doorOpened && result.controlPrecedence.carStayed,
  "a prop press toggles the prop without starting a car drag", result && result.controlPrecedence);

if (failures) process.exit(1);
console.log("Campsite parked-car assertions passed.");
