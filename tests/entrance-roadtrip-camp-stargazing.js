#!/usr/bin/env node
// Served stew unlocks a clear-night, checkpointed three-constellation finale.
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");
var source = fs.readFileSync(path.join(lib.ROOT, "rsvp.html"), "utf8");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<style>
#entrance-roadtrip-stargazing-game *,#entrance-roadtrip-camp-finale-constellations,#entrance-roadtrip-camp-wisdom{transition:none!important}
#entrance-roadtrip-camp-wisdom.show .entrance-roadtrip-camp-wisdom-bubble{animation:none!important;opacity:1!important}
</style>
<script>
(function () {
  var report = { errors: [] };
  function click(node) {
    if (!node) return false;
    node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    return true;
  }
  function clickPoint(node) {
    var box = node.getBoundingClientRect();
    var target = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    click(target);
    return target && target.id;
  }
  function clearNight() {
    window.storm(false); window.rain(false); window.snow(false); window.overcast(false);
    if (window.__applyBalconyWeather) window.__applyBalconyWeather();
    window.__setDayNight(true);
  }
  function trace(name, from) {
    var figure = document.querySelector('[data-stargazing-constellation="' + name + '"]');
    Array.prototype.slice.call(figure.querySelectorAll("[data-stargazing-star]"), from || 0)
      .forEach(click);
  }
  function shapes(root, figureAttribute, starAttribute, coreSelector) {
    var result = {};
    Array.prototype.forEach.call(root.querySelectorAll("[" + figureAttribute + "]"), function (figure) {
      var name = figure.getAttribute(figureAttribute);
      result[name] = {
        points: Array.prototype.map.call(figure.querySelectorAll("[" + starAttribute + "]"), function (star) {
          var core = star.querySelector(coreSelector);
          return [Number(core.getAttribute("cx")), Number(core.getAttribute("cy"))];
        }),
        lines: figure.getAttribute("data-live-stargazing-lines") || Array.prototype.map.call(
          figure.querySelectorAll(".entrance-roadtrip-stargazing-segment"), function (line) {
            return ["x1", "y1", "x2", "y2"].map(function (name) { return Number(line.getAttribute(name)); });
          })
      };
    });
    return result;
  }
  function bounds(nodes, xAttribute, yAttribute, padding) {
    var points = Array.prototype.map.call(nodes, function (node) {
      return [Number(node.getAttribute(xAttribute)), Number(node.getAttribute(yAttribute))];
    });
    return {
      minX: Math.min.apply(null, points.map(function (point) { return point[0]; })) - padding,
      maxX: Math.max.apply(null, points.map(function (point) { return point[0]; })) + padding,
      minY: Math.min.apply(null, points.map(function (point) { return point[1]; })) - padding,
      maxY: Math.max.apply(null, points.map(function (point) { return point[1]; })) + padding
    };
  }
  function ridgePoints(path) {
    var points = [], match, pattern = /[ML](-?\d+(?:\.\d+)?)(-?\d+(?:\.\d+)?)/g;
    while ((match = pattern.exec(path.getAttribute("d")))) points.push([Number(match[1]), Number(match[2])]);
    return points;
  }
  function ridgeYAt(points, x) {
    for (var index = 1; index < points.length; index++) {
      if (x <= points[index][0]) {
        var from = points[index - 1], to = points[index];
        return from[1] + (to[1] - from[1]) * (x - from[0]) / (to[0] - from[0]);
      }
    }
    return points[points.length - 1][1];
  }
  function mountainClearance(live, ridge) {
    var clearance = Infinity;
    Array.prototype.forEach.call(live.querySelectorAll("[data-live-stargazing-constellation]"), function (figure) {
      var stars = {};
      Array.prototype.forEach.call(figure.querySelectorAll("[data-live-stargazing-star]"), function (star) {
        stars[star.getAttribute("data-live-stargazing-star")] = [
          Number(star.getAttribute("data-live-x")), Number(star.getAttribute("data-live-y"))
        ];
      });
      (figure.getAttribute("data-live-stargazing-lines") || "").split(/\s+/).forEach(function (edge) {
        var ends = edge.split("-"), from = stars[ends[0]], to = stars[ends[1]], samples = [0, 1];
        ridge.forEach(function (point) {
          if (from[0] !== to[0] && point[0] > Math.min(from[0], to[0]) && point[0] < Math.max(from[0], to[0])) {
            samples.push((point[0] - from[0]) / (to[0] - from[0]));
          }
        });
        samples.forEach(function (amount) {
          var x = from[0] + (to[0] - from[0]) * amount;
          var y = from[1] + (to[1] - from[1]) * amount;
          clearance = Math.min(clearance, ridgeYAt(ridge, x) - y);
        });
      });
    });
    return clearance;
  }
  function dragLiveStar(name, index, dx, dy) {
    var live = document.getElementById("entrance-roadtrip-camp-finale-constellations");
    var star = live.querySelector('[data-live-stargazing-constellation="' + name + '"] [data-live-stargazing-star="' + index + '"]');
    var svg = live.ownerSVGElement, matrix = live.getScreenCTM(), start = svg.createSVGPoint(), end = svg.createSVGPoint();
    start.x = Number(star.getAttribute("data-live-x")); start.y = Number(star.getAttribute("data-live-y"));
    end.x = start.x + dx; end.y = start.y + dy;
    start = start.matrixTransform(matrix); end = end.matrixTransform(matrix);
    star.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true, pointerId: 71, pointerType: "mouse", button: 0, buttons: 1, clientX: start.x, clientY: start.y }));
    star.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, cancelable: true, pointerId: 71, pointerType: "mouse", button: 0, buttons: 1, clientX: end.x, clientY: end.y }));
    star.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, cancelable: true, pointerId: 71, pointerType: "mouse", button: 0, clientX: end.x, clientY: end.y }));
  }
  function snap() {
    var game = document.getElementById("entrance-roadtrip-stargazing-game");
    var live = document.getElementById("entrance-roadtrip-camp-finale-constellations");
    var wisdom = document.getElementById("entrance-roadtrip-camp-wisdom");
    var sky = document.getElementById("entrance-roadtrip-camp-sky-hit");
    var outer = document.getElementById("entrance-roadtrip-dismiss");
    var moon = document.getElementById("entrance-roadtrip-camp-moon");
    var moonGlow = moon.querySelector("circle");
    var skyHit = document.getElementById("entrance-roadtrip-camp-sky-hit");
    var liveStars = live.querySelectorAll("[data-live-stargazing-star]");
    var liveLine = live.querySelector(".entrance-roadtrip-camp-finale-line");
    var liveHitRadius = Number(live.querySelector(".entrance-roadtrip-camp-finale-star-hit").getAttribute("r"));
    var campRidge = ridgePoints(document.getElementById("entrance-roadtrip-camp-ridge"));
    var wisdomHit = document.getElementById("entrance-roadtrip-camp-wisdom-hit");
    var room = document.getElementById("entrance-room");
    var roadtrip = window.__captureCheckpointSystems().entrance.drive.roadtrip;
    var panel = game.querySelector(".entrance-roadtrip-stargazing-panel");
    var cards = game.querySelectorAll(".entrance-roadtrip-stargazing-card");
    var cardsBottom = Math.max.apply(null, Array.prototype.map.call(cards, function (card) {
      return Number(card.getAttribute("y")) + Number(card.getAttribute("height"));
    }));
    return {
      state: window.__entranceRoadtripCampStargazingState(),
      openClass: game.classList.contains("open"),
      completeClass: game.classList.contains("complete"),
      sunsetClass: document.getElementById("entrance-roadtrip-camp").classList.contains("stargazing-sunset"),
      clearClass: document.getElementById("entrance-room").classList.contains("camp-stargazing-clear"),
      dusk: document.getElementById("stage-balcony").classList.contains("dusk"),
      skyPointer: getComputedStyle(sky).pointerEvents,
      skyCursor: getComputedStyle(sky).cursor,
      outerDismiss: getComputedStyle(outer).display,
      campActive: room.classList.contains("roadtrip-active") && room.classList.contains("roadtrip-route-camp"),
      caption: window.__captionKey && window.__captionKey(),
      constellations: game.querySelectorAll("[data-stargazing-constellation]").length,
      stars: game.querySelectorAll("[data-stargazing-star]").length,
      minHit: Math.min.apply(null, Array.prototype.map.call(game.querySelectorAll(".entrance-roadtrip-stargazing-star-hit"), function (node) {
        return Number(node.getAttribute("r"));
      })),
      panelBottomGap: Number(panel.getAttribute("y")) + Number(panel.getAttribute("height")) - cardsBottom,
      liveOpacity: Number(getComputedStyle(live).opacity),
      livePointer: getComputedStyle(live).pointerEvents,
      liveLineOpacity: Number(getComputedStyle(liveLine).opacity),
      liveLineStroke: getComputedStyle(liveLine).stroke,
      liveLineWidth: parseFloat(getComputedStyle(liveLine).strokeWidth),
      ordinaryPatternOpacities: ["cassiopeia", "dipper", "cygnus"].map(function (name) {
        return Number(getComputedStyle(document.getElementById("entrance-roadtrip-camp-const-" + name)).opacity);
      }),
      liveConstellations: live.querySelectorAll("[data-live-stargazing-constellation]").length,
      liveStars: live.querySelectorAll("[data-live-stargazing-star]").length,
      liveMinHit: Math.min.apply(null, Array.prototype.map.call(live.querySelectorAll(".entrance-roadtrip-camp-finale-star-hit"), function (node) { return Number(node.getAttribute("r")); })),
      liveStarCursor: getComputedStyle(live.querySelector("[data-live-stargazing-star]")).cursor,
      liveVisualBounds: bounds(liveStars, "data-live-x", "data-live-y", 0),
      liveHitBounds: bounds(liveStars, "data-live-x", "data-live-y", liveHitRadius),
      liveMountainClearance: mountainClearance(live, campRidge),
      skyBounds: {
        minX: Number(skyHit.getAttribute("x") || 0),
        maxX: Number(skyHit.getAttribute("x") || 0) + Number(skyHit.getAttribute("width")),
        minY: Number(skyHit.getAttribute("y")),
        maxY: Number(skyHit.getAttribute("y")) + Number(skyHit.getAttribute("height"))
      },
      moonBounds: {
        minX: Number(moonGlow.getAttribute("cx")) - Number(moonGlow.getAttribute("r")),
        maxX: Number(moonGlow.getAttribute("cx")) + Number(moonGlow.getAttribute("r")),
        minY: Number(moonGlow.getAttribute("cy")) - Number(moonGlow.getAttribute("r")),
        maxY: Number(moonGlow.getAttribute("cy")) + Number(moonGlow.getAttribute("r"))
      },
      builderShapes: shapes(game, "data-stargazing-constellation", "data-stargazing-star", ".entrance-roadtrip-stargazing-star-core"),
      checks: Array.prototype.map.call(game.querySelectorAll(".entrance-roadtrip-stargazing-check"), function (check) {
        var path = check.querySelector("path");
        return { tag: check.tagName.toLowerCase(), stroke: path && path.getAttribute("stroke"), cap: path && path.getAttribute("stroke-linecap"), join: path && path.getAttribute("stroke-linejoin") };
      }),
      liveShapes: shapes(live, "data-live-stargazing-constellation", "data-live-stargazing-star", ".entrance-roadtrip-camp-finale-star-core"),
      livePaths: Array.prototype.map.call(live.querySelectorAll(".entrance-roadtrip-camp-finale-line"), function (path) { return path.getAttribute("d"); }),
      moonAfterConstellations: !!(live.compareDocumentPosition(moon) & Node.DOCUMENT_POSITION_FOLLOWING),
      wisdomShown: wisdom.classList.contains("show"),
      wisdomBubbles: wisdom.querySelectorAll(".entrance-roadtrip-camp-wisdom-bubble").length,
      wisdomSpeakers: wisdom.querySelectorAll(".entrance-roadtrip-camp-wisdom-speaker").length,
      wisdomClose: !!document.getElementById("entrance-roadtrip-camp-wisdom-close"),
      wisdomShapes: Array.prototype.map.call(wisdom.querySelectorAll(".entrance-roadtrip-camp-wisdom-bubble"), function (bubble) {
        var path = bubble.querySelector("path.entrance-roadtrip-camp-wisdom-shape");
        var box = path && path.getBBox();
        return {
          paths: bubble.querySelectorAll("path.entrance-roadtrip-camp-wisdom-shape").length,
          rects: bubble.querySelectorAll("rect.entrance-roadtrip-camp-wisdom-shape").length,
          stroke: path && getComputedStyle(path).stroke,
          x: box && Math.round(box.x),
          width: box && Math.round(box.width),
          centerY: box && Math.round(box.y + box.height / 2)
        };
      }),
      wisdomTypography: Array.prototype.map.call(wisdom.querySelectorAll(".entrance-roadtrip-camp-wisdom-bubble"), function (bubble) {
        var shape = bubble.querySelector("path.entrance-roadtrip-camp-wisdom-shape").getBBox();
        var text = bubble.querySelector("text");
        var textBox = text.getBBox();
        return {
          fontSize: parseFloat(getComputedStyle(text).fontSize),
          shapeWidth: Math.round(shape.width),
          textWidth: Math.round(textBox.width),
          shapeHeight: Math.round(shape.height),
          textHeight: Math.round(textBox.height)
        };
      }),
      wisdomHit: wisdomHit && {
        x: Number(wisdomHit.getAttribute("x") || 0),
        y: Number(wisdomHit.getAttribute("y")),
        width: Number(wisdomHit.getAttribute("width")),
        height: Number(wisdomHit.getAttribute("height"))
      },
      wisdomText: wisdom.textContent.replace(/\s+/g, " ").trim(),
      tentOpen: document.getElementById("entrance-roadtrip-camp-tent").classList.contains("open"),
      fireBuilt: roadtrip.campFireBuilt,
      fireLit: roadtrip.campFireLit,
      pinecones: roadtrip.campPinecones,
      stew: roadtrip.stew
    };
  }
  function finish() {
    report.errors = (window.__errs || []).concat(report.errors);
    document.getElementById("__report").textContent = JSON.stringify(report);
  }
  window.addEventListener("load", function () {
    window.__unlockAllRooms();
    window.__setSecondRound(true, { releaseHeld: false });
    window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
      "bathroom", "dungeon", "cinema", "bedroom", "entrance"]);
    window.goToStage("balcony");
    setTimeout(function () {
      try {
        window.__openEntranceRoom();
        document.querySelector(".hunt-viewport").classList.add("entrance-room-open");
        window.__openEntrancePorscheDriveHud();
        window.__entranceRoadtripDevStart();
        window.__entranceRoadtripSetRoute("camp", 0);
        clearNight();
        report.beforeStew = snap();
        var dinnerCheckpoint = window.__captureCheckpointSystems().entrance;
        dinnerCheckpoint.drive.roadtrip.campFireBuilt = true;
        dinnerCheckpoint.drive.roadtrip.campFireLit = true;
        dinnerCheckpoint.drive.roadtrip.campActive = true;
        dinnerCheckpoint.drive.roadtrip.stew = {
          protein: "beef", starch: "barley", status: "served", elapsed: 11600
        };
        window.__restoreCheckpointSystems({ entrance: dinnerCheckpoint }, "afterStage");
        setTimeout(function () {
          try {
            report.ready = snap();
            window.__setDayNight(false);
            setTimeout(function () {
              try {
                window.overcast(true);
                if (window.__applyBalconyWeather) window.__applyBalconyWeather();
                click(document.getElementById("entrance-roadtrip-camp-sky-hit"));
                report.dayOpen = snap().state.sunsetting ? "sunset" : false;
                report.sunset = snap();
                setTimeout(function () {
                  try {
                    report.open = snap();
                    click(document.querySelector('[data-stargazing-constellation="cassiopeia"] [data-stargazing-star="2"]'));
                    report.wrongOrder = snap().state.progress.cassiopeia;
                    trace("cassiopeia");
                    trace("ursa-major", 0);
                    report.partial = snap();
                    var partialCheckpoint = window.__captureCheckpointSystems().entrance;
                    report.partialSaved = partialCheckpoint.drive.roadtrip.stargazing;
                    window.__restoreCheckpointSystems({ entrance: partialCheckpoint }, "afterStage");
                    setTimeout(function () {
                      try {
                        report.partialRestored = snap();
                        window.__entranceRoadtripCampStargazingOpen();
                        trace("ursa-minor");
                        report.complete = snap();
                        var tent = document.getElementById("entrance-roadtrip-camp-tent");
                        report.earlyTarget = clickPoint(tent);
                        report.earlyClick = snap();
                        setTimeout(function () {
                          try {
                            report.handoff = snap();
                            var completeCheckpoint = window.__captureCheckpointSystems().entrance;
                            report.englishContinue = document.getElementById("hunt-caption").textContent.replace(/\s+/g, " ").trim();
                            window.setLang("cs");
                            report.czech = {
                              title: document.querySelector('[data-i="entrance_roadtrip_stargazing_title"]').textContent,
                              builderNames: Array.prototype.map.call(document.querySelectorAll('#entrance-roadtrip-stargazing-game [data-i^="entrance_roadtrip_stargazing_ursa"],#entrance-roadtrip-stargazing-game [data-i="entrance_roadtrip_stargazing_cassiopeia"]'), function (node) { return node.textContent; }),
                              liveNames: document.querySelectorAll('#entrance-roadtrip-camp-finale-constellations text').length,
                              wisdom: document.getElementById("entrance-roadtrip-camp-wisdom").textContent.replace(/\s+/g, " ").trim(),
                              wisdomTypography: snap().wisdomTypography,
                              continueText: document.getElementById("hunt-caption").textContent.replace(/\s+/g, " ").trim()
                            };
                            window.setLang("en");
                            report.dismissTarget = clickPoint(tent);
                            report.dismissed = snap();
                            dragLiveStar("cassiopeia", 0, 24, 30);
                            click(document.querySelector('[data-live-stargazing-constellation="cassiopeia"] [data-live-stargazing-star="0"]'));
                            var guardedTouchMove = new Event("touchmove", { bubbles: true, cancelable: true });
                            document.querySelector('[data-live-stargazing-constellation="cassiopeia"] [data-live-stargazing-star="0"]').dispatchEvent(guardedTouchMove);
                            report.touchDragGuard = guardedTouchMove.defaultPrevented;
                            report.dragged = snap();
                            window.__restoreCheckpointSystems({ entrance: completeCheckpoint }, "afterStage");
                            setTimeout(function () {
                              try {
                                report.completeRestored = snap();
                                click(document.getElementById("entrance-roadtrip-dismiss"));
                                report.exited = snap();
                                click(document.querySelector('[data-roadtrip-reentry-choice="camp"]'));
                                report.preservedArrival = snap();
                                window.overcast(false); clearNight();
                              } catch (error) { report.errors.push(String(error && error.stack || error)); }
                              finish();
                            }, 180);
                          } catch (error) { report.errors.push(String(error && error.stack || error)); finish(); }
                        }, 5550);
                      } catch (error) { report.errors.push(String(error && error.stack || error)); finish(); }
                    }, 180);
                  } catch (error) { report.errors.push(String(error && error.stack || error)); finish(); }
                }, 1750);
              } catch (error) { report.errors.push(String(error && error.stack || error)); finish(); }
            }, 60);
          } catch (error) { report.errors.push(String(error && error.stack || error)); finish(); }
        }, 180);
      } catch (error) { report.errors.push(String(error && error.stack || error)); finish(); }
    }, 320);
  });
})();
</script>`;

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail == null ? "" : "   [" + JSON.stringify(detail) + "]"));
  }
}

console.log("rsvp.html campsite stargazing:");
var result = lib.runPageSync("rsvp.html", HARNESS, 10000, {
  forceReduce: true,
  urlSuffix: "?date=2026-07-15&time=23:00#play",
  chromeFlags: "--window-size=1180,900"
});
function same(actual, expected) { return JSON.stringify(actual) === JSON.stringify(expected); }
check(result && result.errors.length === 0, "the finale has no uncaught errors", result && result.errors);
check(result && result.beforeStew && !result.beforeStew.state.eligible && result.beforeStew.skyPointer === "none" &&
  result.beforeStew.liveOpacity === .68 && result.beforeStew.liveLineOpacity === 0 &&
  result.beforeStew.livePointer === "none" && result.beforeStew.liveStarCursor === "default" &&
  result.beforeStew.ordinaryPatternOpacities.every(function (opacity) { return opacity === 0; }),
  "the ordinary night seeds the three eventual figures as inert, unconnected stars",
  result && result.beforeStew);
check(result && result.ready && result.ready.state.eligible && result.ready.skyPointer === "all" &&
  result.ready.skyCursor === "pointer",
  "served stew unlocks the sky with the standard pointing-hand cursor", result && result.ready);
check(result && result.dayOpen === "sunset" && result.sunset && result.sunset.state.sunsetting &&
  result.sunset.sunsetClass && result.sunset.clearClass && result.sunset.dusk &&
  result.sunset.caption === "entrance_roadtrip_stargazing_invite",
  "clicking the live sky starts sunset, clears camp weather, and summons night", result && result.sunset);
check(result && result.open && result.open.openClass && result.open.outerDismiss === "none" &&
  !result.open.state.sunsetting && result.open.clearClass && result.open.dusk &&
  result.open.constellations === 3 && result.open.stars === 19 && result.open.minHit >= 14,
  "sunset resolves into the clear overlay with three forgiving traces and no outer dismiss",
  result && result.open);
check(result && result.open && result.open.panelBottomGap >= 8 && result.open.panelBottomGap <= 16,
  "the stargazing frame ends shortly below the cards instead of leaving a large empty tail",
  result && result.open && result.open.panelBottomGap);
check(result && result.open &&
  same(result.open.builderShapes.cassiopeia.points, [[68,-20],[105,25],[150,20],[178,55],[210,24]]) &&
  same(result.open.builderShapes["ursa-major"].points, [[265,-22],[298,-22],[326,-10],[351,7],[410,10],[398,52],[354,42]]) &&
  same(result.open.builderShapes["ursa-minor"].points, [[466,42],[489,55],[513,20],[492,2],[552,-8],[592,-8],[626,1]]) &&
  result.open.builderShapes["ursa-major"].lines.length === 7 && result.open.builderShapes["ursa-minor"].lines.length === 7,
  "the trace cards use an upright Cassiopeia W and the referenced seven-star Big and Little Dippers",
  result && result.open && result.open.builderShapes);
check(result && result.open && result.open.checks.length === 3 && result.open.checks.every(function (check) {
  return check.tag === "g" && check.stroke === "#7f9ec0" && check.cap === "round" && check.join === "round";
}), "completed-card checks are rounded hand-drawn paths in the campsite light blue", result && result.open && result.open.checks);
check(result && result.wrongOrder === 0, "out-of-order stars do not skip the guided trace", result && result.wrongOrder);
check(result && result.partial && result.partial.state.completed.indexOf("cassiopeia") >= 0 &&
  result.partial.state.completed.indexOf("ursa-major") >= 0 && !result.partial.state.complete,
  "Cassiopeia and Ursa Major can be completed independently", result && result.partial);
check(result && result.partialSaved && result.partialSaved.progress.cassiopeia === 5 &&
  result.partialSaved.progress["ursa-major"] === 7 && result.partialSaved.progress["ursa-minor"] === 0,
  "checkpoint capture records exact trace progress", result && result.partialSaved);
check(result && result.partialRestored && !result.partialRestored.state.open &&
  result.partialRestored.state.progress.cassiopeia === 5 && result.partialRestored.state.progress["ursa-major"] === 7,
  "Continue restores progress with the popup closed", result && result.partialRestored);
check(result && result.complete && result.complete.state.complete && !result.complete.state.open &&
  !result.complete.openClass && result.complete.liveOpacity === 1 &&
  result.complete.liveLineOpacity === .22 && result.complete.liveLineStroke === "rgb(220, 236, 255)" &&
  result.complete.liveLineWidth === .55 &&
  result.complete.skyPointer === "none" && result.complete.skyCursor === "default" &&
  result.complete.livePointer === "all" && result.complete.liveStarCursor === "grab" &&
  result.complete.liveConstellations === 3 && result.complete.liveStars === 19 && result.complete.liveMinHit >= 14 &&
  result.complete.moonAfterConstellations && result.complete.wisdomShown &&
  result.complete.wisdomBubbles === 4 && result.complete.wisdomSpeakers === 0 &&
  !result.complete.wisdomClose &&
  result.complete.wisdomShapes.every(function (shape) {
    return shape.paths === 1 && shape.rects === 0 && shape.width >= 175 && shape.width <= 290;
  }) &&
  result.complete.wisdomShapes.map(function (shape) { return shape.stroke; }).join("|") ===
    "rgb(217, 166, 166)|rgb(127, 158, 192)|rgb(217, 166, 166)|rgb(127, 158, 192)" &&
  result.complete.wisdomShapes[0].x >= 380 && result.complete.wisdomShapes[1].x <= 10 &&
  result.complete.wisdomShapes[2].x >= 485 && result.complete.wisdomShapes[3].x <= 5 &&
  result.complete.wisdomShapes[1].centerY - result.complete.wisdomShapes[0].centerY >= 15 &&
  result.complete.wisdomShapes[2].centerY - result.complete.wisdomShapes[1].centerY >= 30 &&
  result.complete.wisdomShapes[3].centerY - result.complete.wisdomShapes[2].centerY >= 35 &&
  result.complete.wisdomTypography.every(function (row) {
    return row.fontSize >= 12 && row.textWidth <= row.shapeWidth - 24 && row.textHeight <= row.shapeHeight - 10;
  }) &&
  result.complete.wisdomHit && result.complete.wisdomHit.x === 0 && result.complete.wisdomHit.y === -120 &&
  result.complete.wisdomHit.width === 680 && result.complete.wisdomHit.height === 340 &&
  result.complete.wisdomText.indexOf("Until that ends as well.") >= 0 &&
  result.complete.wisdomText.indexOf("When something is over,") >= 0 &&
  result.complete.wisdomText.indexOf("something else begins") >= 0 &&
  result.complete.wisdomText.indexOf("—ad infinitum.") >= 0,
  "finishing returns to a non-traceable live sky with draggable stars behind the moon and four large staggered path bubbles",
  result && result.complete);
check(result && result.complete && !result.complete.state.wisdomHandoffReady &&
  result.complete.caption === "entrance_roadtrip_stargazing_title" &&
  result.earlyTarget === "entrance-roadtrip-camp-wisdom-hit" && result.earlyClick &&
  !result.earlyClick.state.wisdomDismissed && result.earlyClick.state.sleepPhase === "idle" &&
  !result.earlyClick.tentOpen,
  "the full-campsite wisdom shield consumes early prop clicks while the exchange reveals",
  { complete: result && result.complete, target: result && result.earlyTarget, after: result && result.earlyClick });
check(/camp-wisdom-bubble:nth-child\(1\)\{animation-delay:2s\}/.test(source) &&
  /camp-wisdom-bubble:nth-child\(2\)\{animation-delay:3s\}/.test(source) &&
  /camp-wisdom-bubble:nth-child\(3\)\{animation-delay:4s\}/.test(source) &&
  /camp-wisdom-bubble:nth-child\(4\)\{animation-delay:5s\}/.test(source),
  "the exchange waits two seconds, then reveals its four bubbles one second apart");
check(result && result.complete &&
  same(result.complete.liveShapes.cassiopeia.points, [[53.735,-95.87],[70.565,-79.04],[88.415,-87.2],[102.185,-74.45],[120.545,-88.73]]) &&
  same(result.complete.liveShapes["ursa-minor"].points, [[166.615,-69.265],[178.345,-61.615],[191.095,-75.895],[179.875,-85.585],[216.595,-91.705],[244.645,-91.705],[270.145,-86.605]]) &&
  same(result.complete.liveShapes["ursa-major"].points, [[337.805,-91.705],[355.655,-92.725],[373.505,-86.095],[386.255,-77.935],[436.235,-74.875],[427.055,-56.515],[390.845,-62.125]]) &&
  result.complete.liveShapes.cassiopeia.lines === "0-1 1-2 2-3 3-4" &&
  result.complete.liveShapes["ursa-minor"].lines === "0-1 1-2 2-3 3-0 2-4 4-5 5-6" &&
  result.complete.liveShapes["ursa-major"].lines === "0-1 1-2 2-3 3-4 4-5 5-6 6-3",
  "the completed northern sky preserves the same recognizable silhouettes with Cassiopeia opposite the Dipper around Polaris",
  result && result.complete && result.complete.liveShapes);
check(result && result.complete &&
  result.complete.liveHitBounds.minX >= result.complete.skyBounds.minX + 10 &&
  result.complete.liveHitBounds.maxX <= result.complete.skyBounds.maxX - 10 &&
  result.complete.liveHitBounds.minY >= result.complete.skyBounds.minY + 10 &&
  result.complete.liveHitBounds.maxY <= result.complete.skyBounds.maxY - 10 &&
  result.complete.liveVisualBounds.maxX <= 455,
  "the reduced live constellations and their full drag targets fit comfortably in the left sky",
  result && result.complete && { visual: result.complete.liveVisualBounds, hit: result.complete.liveHitBounds, sky: result.complete.skyBounds });
check(result && result.complete && result.complete.liveHitBounds.maxX < result.complete.moonBounds.minX &&
  result.complete.moonBounds.minX - result.complete.liveHitBounds.maxX >= 90,
  "even the constellation drag targets leave a clear gap before the moon's outer glow",
  result && result.complete && { hit: result.complete.liveHitBounds, moon: result.complete.moonBounds });
check(result && result.complete && result.complete.liveMountainClearance >= 9,
  "every completed connector clears the campsite mountain silhouette",
  result && result.complete && result.complete.liveMountainClearance);
check(result && result.dragged && result.dragged.state.complete && !result.dragged.state.open &&
  Math.abs(result.dragged.liveShapes.cassiopeia.points[0][0] - 77.735) < .01 &&
  Math.abs(result.dragged.liveShapes.cassiopeia.points[0][1] + 65.87) < .01 &&
  result.dragged.livePaths[0] !== result.complete.livePaths[0] &&
  same(result.dragged.state.progress, result.complete.state.progress),
  "dragging one completed star moves it and redraws its connectors without reopening or changing the trace",
  result && result.dragged);
check(result && result.touchDragGuard,
  "completed-star touch drags suppress page panning through a non-passive local guard", result && result.touchDragGuard);
check(result && result.handoff && result.handoff.state.wisdomHandoffReady &&
  result.handoff.caption === "entrance_roadtrip_stargazing_continue" &&
  result.englishContinue === "Great wisdom dispensed. Click anywhere to continue.",
  "the persistent handoff clue appears after all four one-second reveals", result && result.handoff);
check(result && result.czech && result.czech.title === "Pozorování hvězd" &&
  result.czech.builderNames.join("|") === "Kasiopeja|Velká medvědice|Malá medvědice" &&
  result.czech.liveNames === 0 &&
  result.czech.wisdom.indexOf("Když něco skončí,") >= 0 &&
  result.czech.wisdom.indexOf("něco jiného začne") >= 0 &&
  result.czech.wisdomTypography.every(function (row) {
    return row.fontSize >= 12 && row.textWidth <= row.shapeWidth - 24 && row.textHeight <= row.shapeHeight - 10;
  }) &&
  result.czech.continueText === "Velká moudrost rozdána. Klikni kamkoli a pokračuj.",
  "builder labels and spacious wisdom bubbles switch cleanly to Czech while the permanent sky stays unlabeled", result && result.czech);
check(result && result.dismissed && result.dismissed.state.wisdomDismissed && !result.dismissed.wisdomShown &&
  result.dismissed.state.sleepPhase === "prompt" &&
  result.dismissed.caption === "entrance_roadtrip_camp_sleep_prompt" && result.dismissed.outerDismiss === "grid" &&
  result.dismissTarget === "entrance-roadtrip-camp-wisdom-hit" && !result.dismissed.tentOpen,
  "the next campsite click dismisses the exchange without reaching the underlying prop", result && result.dismissed);
check(result && result.completeRestored && result.completeRestored.state.complete &&
  !result.completeRestored.state.wisdomDismissed && result.completeRestored.wisdomShown &&
  result.completeRestored.state.sleepPhase === "idle" && result.completeRestored.state.wisdomHandoffReady &&
  result.completeRestored.caption === "entrance_roadtrip_stargazing_continue",
  "checkpoint restore returns the ready, undismissed live-sky handoff",
  result && result.completeRestored);
check(result && result.exited && !result.exited.campActive,
  "the standard campsite exit returns to the Road Trip controls", result && result.exited);
check(result && result.preservedArrival && result.preservedArrival.state.complete &&
  result.preservedArrival.wisdomShown && result.preservedArrival.state.wisdomHandoffReady &&
  result.preservedArrival.caption === "entrance_roadtrip_stargazing_continue" &&
  result.preservedArrival.fireBuilt && result.preservedArrival.fireLit &&
  result.preservedArrival.stew && result.preservedArrival.stew.status === "served",
  "leaving before the curtain call preserves the finished stargazing campsite", result && result.preservedArrival);

if (failures) process.exit(1);
console.log("Campsite stargazing assertions passed.");
