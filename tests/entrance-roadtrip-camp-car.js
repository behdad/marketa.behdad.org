#!/usr/bin/env node
// Campsite Porsche controls own generous prop regions; body drags stay inside the parking space.
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
    return Array.prototype.filter.call(paths, function (path) {
      return getComputedStyle(path).display !== "none" && path.isPointInFill(point);
    })
      .map(function (path) { return path.getAttribute("data-camp-car-action"); });
  }
  function topActionAt(host, x, y) {
    var point = clientPoint(host, x, y);
    var target = document.elementFromPoint(point.x, point.y);
    var hit = target && target.closest && target.closest("[data-camp-car-action]");
    return hit && hit.getAttribute("data-camp-car-action");
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
        window.__goToStage("balcony");
        window.__openEntranceRoom();
        window.__openEntrancePorscheDriveHud();
        window.__entranceRoadtripDevStart();
        window.__entranceRoadtripSetRoute("camp", 0);

        var style = document.createElement("style");
        style.textContent = ".hunt-viewport,#lower-room-track,#entrance-roadtrip-camp-porsche *{transition:none!important}";
        document.head.appendChild(style);
        var viewport = document.querySelector(".hunt-viewport");
        viewport.style.setProperty("--floor-pan", "100%");
        viewport.classList.add("entrance-room-open");
        var host = document.getElementById("entrance-roadtrip-camp-porsche");
        var camp = document.getElementById("entrance-roadtrip-camp");
        var epilogueCar = document.getElementById("entrance-roadtrip-camp-epilogue-car");
        report.epilogueCar = { inactive: getComputedStyle(epilogueCar).display };
        camp.classList.add("camp-sleep-epilogue");
        report.epilogueCar.active = getComputedStyle(epilogueCar).display;
        camp.classList.remove("camp-sleep-epilogue");
        var copy = host.querySelector(".entrance-roadtrip-camp-porsche-copy");
        var dragHit = copy.querySelector(".entrance-roadtrip-camp-car-drag-hit");
        var carHitHost = dragHit.parentNode;
        var hits = copy.querySelectorAll("[data-camp-car-action]");
        var actionClasses = {
          door: "door-open", frunk: "frunk-open", trunk: "trunk-open",
          window: "windows-open", roof: "roof-open",
          headlights: "headlights-on", taillights: "taillights-on"
        };
        var expectedPoints = [
          ["door", 170, 280], ["door", 220, 305], ["door", 260, 276],
          ["frunk", 24, 258], ["frunk", 92, 262], ["frunk", 150, 260],
          ["trunk", 307, 263], ["trunk", 334, 257], ["trunk", 362, 268],
          ["window", 174, 249], ["window", 220, 229], ["window", 238, 248],
          ["roof", 250, 252], ["roof", 270, 242], ["roof", 290, 252],
          ["headlights", 15, 287], ["headlights", 49, 291],
          ["taillights", 334, 286], ["taillights", 358, 291]
        ];
        report.points = expectedPoints.map(function (row) {
          return [row[0], pointHits(hits, row[1], row[2])];
        });
        report.realPoints = expectedPoints.map(function (row) {
          return [row[0], topActionAt(carHitHost, row[1], row[2])];
        });
        report.hitboxes = Array.prototype.filter.call(hits, function (hit) {
          return getComputedStyle(hit).display !== "none";
        }).map(function (hit) {
          var box = hit.getBBox();
          var rect = hit.getBoundingClientRect();
          return {
            action: hit.getAttribute("data-camp-car-action"),
            local: [box.width, box.height],
            rendered: [rect.width, rect.height]
          };
        });
        report.coarse = matchMedia("(pointer: coarse)").matches && matchMedia("(hover: none)").matches;
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
          alignedWithArt: carHitHost.classList.contains("entrance-porsche-scale"),
          dragBelowControls: carHitHost.lastElementChild.classList.contains("entrance-roadtrip-camp-car-hits") &&
            carHitHost.lastElementChild.previousElementSibling === dragHit
        };
        var trunkHit = copy.querySelector('[data-camp-car-action="trunk"]');
        host.classList.add("roof-open");
        host.classList.remove("trunk-open");
        var roofPoint = clientPoint(carHitHost, 270, 250);
        var roofStackTarget = document.elementFromPoint(roofPoint.x, roofPoint.y);
        var roofStackAction = roofStackTarget && roofStackTarget.closest &&
          roofStackTarget.closest("[data-camp-car-action]");
        click(roofStackTarget);
        report.openRoofControl = {
          action: roofStackAction && roofStackAction.getAttribute("data-camp-car-action"),
          roofClosed: !host.classList.contains("roof-open"),
          trunkStayedClosed: !host.classList.contains("trunk-open")
        };
        host.classList.add("roof-open");
        click(trunkHit);
        report.openRoofTrunkControl = {
          roofStayedOpen: host.classList.contains("roof-open"),
          trunkOpened: host.classList.contains("trunk-open")
        };
        report.labelCount = copy.querySelectorAll("[tabindex],[title],[data-title-i],[aria-label]").length;

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
          headlights: opacity(".entrance-porsche-headlight-on"),
          taillights: opacity(".entrance-porsche-taillight-on")
        };
        host.classList.remove("taillights-on");
        report.frontLightsOnly = {
          front: opacity(".entrance-porsche-headlight-on"),
          rear: opacity(".entrance-porsche-taillight-on"),
          frontRunning: opacity(".entrance-roadtrip-camp-front-running-lamp .entrance-porsche-running-light"),
          rearRunning: opacity(".entrance-roadtrip-camp-rear-running-lamp .entrance-porsche-running-light")
        };
        host.classList.remove("headlights-on");
        host.classList.add("taillights-on");
        report.rearLightsOnly = {
          front: opacity(".entrance-porsche-headlight-on"),
          rear: opacity(".entrance-porsche-taillight-on"),
          frontRunning: opacity(".entrance-roadtrip-camp-front-running-lamp .entrance-porsche-running-light"),
          rearRunning: opacity(".entrance-roadtrip-camp-rear-running-lamp .entrance-porsche-running-light")
        };
        host.classList.add("headlights-on");

        var wheels = copy.querySelectorAll("[data-camp-car-wheel]");
        var sparkles = copy.querySelectorAll(".entrance-porsche-wheel-sparkle");
        function clickWheel(index, x) {
          var point = clientPoint(carHitHost, x, 316);
          wheels[index].dispatchEvent(new MouseEvent("click", {
            bubbles: true, cancelable: true, clientX: point.x, clientY: point.y
          }));
        }
        clickWheel(0, 95);
        clickWheel(1, 296);
        report.wheelSparkles = {
          count: sparkles.length,
          front: sparkles[0] && sparkles[0].classList.contains("sparkling"),
          rear: sparkles[1] && sparkles[1].classList.contains("sparkling"),
          frontTransform: sparkles[0] && sparkles[0].getAttribute("transform"),
          rearTransform: sparkles[1] && sparkles[1].getAttribute("transform")
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

var result = lib.runPageSync("loft-day.html", HARNESS, 5200, {
  patchRaf: true,
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=12:00",
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
function transformNear(value, x, y) {
  var match = /^translate\(([-.\d]+) ([-.\d]+)\)$/.exec(value || "");
  return !!match && Math.abs(+match[1] - x) < 2 && Math.abs(+match[2] - y) < 2;
}

console.log("loft-day.html campsite parked-car controls:");
check(result && result.errors.length === 0, "controls run without uncaught errors", result && result.errors);
check(result && result.hitMap && result.hitMap.count === 8 && result.hitMap.actionCount === 7 &&
  result.hitMap.alignedWithArt && result.hitMap.dragBelowControls,
  "seven controls and the body drag surface share the artwork's scaled coordinate group",
  result && result.hitMap);
check(result && result.epilogueCar && result.epilogueCar.inactive === "none" &&
  result.epilogueCar.active !== "none",
  "the decorative epilogue car leaves hit testing until its scene is active", result && result.epilogueCar);
check(result && result.points && result.points.every(function (row) {
  return row[1].indexOf(row[0]) >= 0 && row[1].every(function (action) {
    return action === row[0] || row[0] === "roof" && action === "window";
  });
}), "multiple points across every visible prop include their intended control", result && result.points);
check(result && result.realPoints && result.realPoints.every(function (row) {
  return row[1] === row[0];
}), "the browser exposes every practical point as the topmost intended control", result && result.realPoints);
check(result && result.overlaps && result.overlaps.every(function (row) {
  return row[2].length === 2 && row[2].indexOf("roof") >= 0 &&
    (row[2].indexOf("window") >= 0 || row[2].indexOf("door") >= 0);
}), "only the visible folded roof overlaps its adjacent window/body controls", result && result.overlaps);
var localMinimums = {
  door: [100, 60], frunk: [150, 33], trunk: [75, 24],
  window: [95, 30], roof: [55, 34], headlights: [50, 40], taillights: [50, 40]
};
check(result && result.hitboxes && result.hitboxes.every(function (row) {
  var minimum = localMinimums[row.action];
  return row.local[0] >= minimum[0] && row.local[1] >= minimum[1] &&
    Math.min(row.rendered[0], row.rendered[1]) >= 28;
}), "each control has generous local coverage and a practical rendered short edge", result && result.hitboxes);
check(result && result.labelCount === 0,
  "parked-car props carry no focus or accessibility labels", result && result.labelCount);
check(result && result.props && result.props.isolated && result.props.captionStayed &&
  Object.values(result.props.classes).every(Boolean),
  "every prop toggles independently without replacing the campsite caption", result && result.props);
check(result && result.props && result.props.door.join(",") === "1,0,1" &&
  result.props.roof.join(",") === "0,1,1" && result.props.window === "hidden" &&
  result.props.frunk.join(",") === "1,1" && result.props.trunk[0] !== "none" &&
  result.props.trunk[1] === "1" && result.props.headlights === "1" && result.props.taillights === "1",
  "all seven toggles produce visible state changes", result && result.props);
check(result && result.frontLightsOnly && result.rearLightsOnly &&
  result.frontLightsOnly.front === "1" && result.frontLightsOnly.rear === "0" &&
  result.frontLightsOnly.frontRunning === "1" && result.frontLightsOnly.rearRunning === "0" &&
  result.rearLightsOnly.front === "0" && result.rearLightsOnly.rear === "1" &&
  result.rearLightsOnly.frontRunning === "0" && result.rearLightsOnly.rearRunning === "1",
  "front and rear light regions control only their own lamps",
  { front: result && result.frontLightsOnly, rear: result && result.rearLightsOnly });
check(result && result.wheelSparkles && result.wheelSparkles.count === 2 &&
  result.wheelSparkles.front && result.wheelSparkles.rear &&
  transformNear(result.wheelSparkles.frontTransform, 95, 316) &&
  transformNear(result.wheelSparkles.rearTransform, 296, 316),
  "each parked wheel sparkles at its own clicked center", result && result.wheelSparkles);
check(result && result.mouseDrag && result.mouseDrag.x === "10.00" && result.mouseDrag.y === "8.00" &&
  result.mouseDrag.released, "mouse dragging clamps at the parking-space front/lower edge",
  result && result.mouseDrag);
check(result && result.touchDrag && result.touchDrag.x === "-30.00" && result.touchDrag.y === "-8.00" &&
  result.touchDrag.movePrevented, "touch dragging clamps at the parking-space back/upper edge and suppresses panning",
  result && result.touchDrag);
check(result && result.controlPrecedence && result.controlPrecedence.doorOpened && result.controlPrecedence.carStayed,
  "a prop press toggles the prop without starting a car drag", result && result.controlPrecedence);
check(result && result.openRoofControl && result.openRoofControl.action === "roof" &&
  result.openRoofControl.roofClosed &&
  result.openRoofControl.trunkStayedClosed,
  "clicking the folded soft top closes it without toggling the trunk", result && result.openRoofControl);
check(result && result.openRoofTrunkControl && result.openRoofTrunkControl.roofStayedOpen &&
  result.openRoofTrunkControl.trunkOpened,
  "the rear trunk remains independently clickable beside an open soft top", result && result.openRoofTrunkControl);

var coarseResult = lib.runPageSync("loft-day.html", HARNESS, 5200, {
  patchRaf: true,
  forceMotion: true,
  forceCoarsePointer: true,
  urlSuffix: "?date=2026-07-15&time=12:00",
  chromeFlags: "--window-size=844,520"
});
check(coarseResult && coarseResult.errors.length === 0 && coarseResult.coarse,
  "touch-first sizing runs without errors under coarse-pointer media", coarseResult && coarseResult.errors);
check(coarseResult && coarseResult.realPoints && coarseResult.realPoints.every(function (row) {
  return row[1] === row[0];
}), "coarse-pointer hit testing keeps every practical prop point topmost", coarseResult && coarseResult.realPoints);
check(coarseResult && coarseResult.hitboxes && coarseResult.hitboxes.every(function (row) {
  if (row.action === "roof") {
    return row.rendered[0] >= 36 && row.rendered[1] >= 22 && row.rendered[0] * row.rendered[1] >= 800;
  }
  return row.rendered[0] >= 32 && row.rendered[1] >= 22 && row.rendered[0] * row.rendered[1] >= 1000;
}), "coarse-pointer controls retain broad rendered coverage in the mobile layout",
  coarseResult && coarseResult.hitboxes);
check(coarseResult && coarseResult.controlPrecedence && coarseResult.controlPrecedence.doorOpened &&
  coarseResult.controlPrecedence.carStayed,
  "coarse-pointer prop presses retain precedence over whole-car dragging",
  coarseResult && coarseResult.controlPrecedence);

if (failures) process.exit(1);
console.log("Campsite parked-car assertions passed.");
