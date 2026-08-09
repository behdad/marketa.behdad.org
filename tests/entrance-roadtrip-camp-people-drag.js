#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [] };
  function pointer(target, type, id, pointerType, x, y) {
    target.dispatchEvent(new PointerEvent(type, {
      bubbles: true, cancelable: true, pointerId: id, pointerType: pointerType,
      button: 0, buttons: type === "pointerup" ? 0 : 1, clientX: x, clientY: y
    }));
  }
  function click(target) {
    target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  }
  function centre(node) {
    var box = node.getBoundingClientRect();
    return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  }
  function delta(before, after) {
    return [after.x - before.x, after.y - before.y];
  }
  function offset(mover) {
    var match = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(mover.getAttribute("transform") || "");
    return match ? [Number(match[1]), Number(match[2])] : [0, 0];
  }
  function notebookLayout() {
    var book = document.querySelector(".entrance-roadtrip-notebook-book");
    var close = document.querySelector(".entrance-roadtrip-notebook-close");
    var title = book && book.querySelector("h2");
    if (!book || !close || !title) return null;
    var style = getComputedStyle(book);
    var bookRect = book.getBoundingClientRect();
    var closeRect = close.getBoundingClientRect();
    var titleRect = title.getBoundingClientRect();
    return {
      clientHeight: book.clientHeight,
      scrollHeight: book.scrollHeight,
      paddingTop: parseFloat(style.paddingTop),
      paddingBottom: parseFloat(style.paddingBottom),
      bookTop: bookRect.top,
      bookBottom: bookRect.bottom,
      viewportHeight: innerHeight,
      closePosition: getComputedStyle(close).position,
      closeTop: closeRect.top,
      titleTop: titleRect.top
    };
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        window.__unlockAllRooms();
        window.goToStage("balcony");
        window.__openEntranceRoom();
        window.__openEntrancePorscheDriveHud();
        window.__entranceRoadtripDevStart();
        window.__entranceRoadtripSetRoute("camp", 0);

        var marketa = document.getElementById("entrance-roadtrip-camp-marketa");
        var behdad = document.getElementById("entrance-roadtrip-camp-behdad");
        var tent = document.getElementById("entrance-roadtrip-camp-tent");
        var car = document.getElementById("entrance-roadtrip-camp-porsche");
        report.paintOrder = {
          marketaBeforeTent: !!(marketa.compareDocumentPosition(tent) & Node.DOCUMENT_POSITION_FOLLOWING),
          marketaBeforeCar: !!(marketa.compareDocumentPosition(car) & Node.DOCUMENT_POSITION_FOLLOWING),
          behdadBeforeTent: !!(behdad.compareDocumentPosition(tent) & Node.DOCUMENT_POSITION_FOLLOWING),
          behdadBeforeCar: !!(behdad.compareDocumentPosition(car) & Node.DOCUMENT_POSITION_FOLLOWING)
        };
        var marketaMover = marketa.querySelector(".entrance-roadtrip-camp-character-drag");
        var marketaHit = marketa.querySelector(".entrance-roadtrip-camp-character-drag-hit");
        var marketaChair = marketaHit.nextElementSibling;
        var marketaHead = marketa.querySelector(".entrance-roadtrip-camp-character-head");
        var notebook = document.getElementById("entrance-roadtrip-camp-notebook");
        var before = {
          chair: centre(marketaChair), head: centre(marketaHead), notebook: centre(notebook)
        };
        var start = centre(marketaHit);
        pointer(marketaHit, "pointerdown", 31, "mouse", start.x, start.y);
        pointer(marketa, "pointermove", 31, "mouse", start.x + 900, start.y + 900);
        pointer(marketa, "pointerup", 31, "mouse", start.x + 900, start.y + 900);
        var after = {
          chair: centre(marketaChair), head: centre(marketaHead), notebook: centre(notebook)
        };
        report.marketa = {
          offset: offset(marketaMover),
          outerTransform: marketa.getAttribute("transform"),
          chairDelta: delta(before.chair, after.chair),
          headDelta: delta(before.head, after.head),
          notebookDelta: delta(before.notebook, after.notebook),
          settled: !marketa.classList.contains("dragging")
        };

        var behdadMover = behdad.querySelector(".entrance-roadtrip-camp-character-drag");
        var behdadHit = behdad.querySelector(".entrance-roadtrip-camp-character-drag-hit");
        start = centre(behdadHit);
        pointer(behdadHit, "pointerdown", 32, "touch", start.x, start.y);
        var touchMove = new Event("touchmove", { bubbles: true, cancelable: true });
        behdadHit.dispatchEvent(touchMove);
        pointer(behdad, "pointermove", 32, "touch", start.x - 900, start.y - 900);
        pointer(behdad, "pointerup", 32, "touch", start.x - 900, start.y - 900);
        report.behdad = {
          offset: offset(behdadMover),
          outerTransform: behdad.getAttribute("transform"),
          pagePanPrevented: touchMove.defaultPrevented,
          settled: !behdad.classList.contains("dragging")
        };

        var marketaTransform = marketaMover.getAttribute("transform");
        var headPoint = centre(marketaHead);
        pointer(marketaHead, "pointerdown", 33, "mouse", headPoint.x, headPoint.y);
        pointer(marketaHead, "pointerup", 33, "mouse", headPoint.x, headPoint.y);
        click(marketaHead);
        report.head = {
          laughing: marketaHead.classList.contains("laughing"),
          noTabTarget: !marketaHead.hasAttribute("tabindex"),
          title: marketaHead.getAttribute("title"),
          keptOffset: marketaMover.getAttribute("transform") === marketaTransform,
          didNotDrag: !marketa.classList.contains("dragging")
        };
        window.setLang("cs");
        report.head.czechTitle = marketaHead.getAttribute("title");
        window.setLang("en");

        marketaHead.classList.remove("laughing");
        var bookPoint = centre(notebook);
        pointer(notebook, "pointerdown", 34, "touch", bookPoint.x, bookPoint.y);
        pointer(notebook, "pointerup", 34, "touch", bookPoint.x, bookPoint.y);
        click(notebook);
        report.notebook = {
          open: !!document.querySelector(".entrance-roadtrip-notebook-backdrop"),
          headIdle: !marketaHead.classList.contains("laughing"),
          keptOffset: marketaMover.getAttribute("transform") === marketaTransform,
          didNotDrag: !marketa.classList.contains("dragging"),
          layout: notebookLayout()
        };
        document.querySelector(".entrance-roadtrip-notebook-close").click();
        window.setLang("cs");
        click(notebook);
        report.notebook.czechLayout = notebookLayout();
        document.querySelector(".entrance-roadtrip-notebook-close").click();
        window.setLang("en");

        click(marketaHit);
        report.bodyClick = {
          headIdle: !marketaHead.classList.contains("laughing"),
          notebookClosed: !document.querySelector(".entrance-roadtrip-notebook-backdrop")
        };
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
      }
      report.errors = (window.__errs || []).concat(report.errors);
      document.getElementById("__report").textContent = JSON.stringify(report);
    }, 260);
  });
})();
</script>`;

var result = lib.runPageSync("loft-day.html", HARNESS, 4500, {
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
function sameDelta(rows) {
  return rows.slice(1).every(function (row) {
    return Math.abs(row[0] - rows[0][0]) < .5 && Math.abs(row[1] - rows[0][1]) < .5;
  });
}

console.log("loft-day.html campsite camper dragging:");
check(result && result.errors.length === 0,
  "camper drag harness has no uncaught errors", result && result.errors);
check(result && result.paintOrder && result.paintOrder.marketaBeforeTent &&
  result.paintOrder.marketaBeforeCar && result.paintOrder.behdadBeforeTent &&
  result.paintOrder.behdadBeforeCar,
  "both campers and their chairs paint behind the tent and parked car", result && result.paintOrder);
check(result && result.marketa && result.marketa.offset[0] === 38 && result.marketa.offset[1] === 14 &&
  result.marketa.outerTransform === "translate(205 112) scale(.88)" && result.marketa.settled,
  "mouse dragging clamps Markéta and her chair inside their campsite area", result && result.marketa);
check(result && result.marketa && sameDelta([
  result.marketa.chairDelta, result.marketa.headDelta, result.marketa.notebookDelta
]), "Markéta, chair, head, and notebook travel as one composition", result && result.marketa);
check(result && result.behdad && result.behdad.offset[0] === -38 && result.behdad.offset[1] === -12 &&
  result.behdad.outerTransform === "translate(475 115) scale(.9)" && result.behdad.pagePanPrevented &&
  result.behdad.settled,
  "touch dragging clamps Behdad and his chair inside their campsite area", result && result.behdad);
check(result && result.head && result.head.laughing && result.head.noTabTarget &&
  result.head.title === "Make Markéta laugh" && result.head.czechTitle === "Rozesmát Markétu" &&
  result.head.keptOffset && result.head.didNotDrag,
  "the click-only head stays out of the tab order and remains an independent reaction target", result && result.head);
check(result && result.notebook && result.notebook.open && result.notebook.headIdle &&
  result.notebook.keptOffset && result.notebook.didNotDrag,
  "the notebook still opens independently without starting a drag or head reaction", result && result.notebook);
check(result && result.bodyClick && result.bodyClick.headIdle && result.bodyClick.notebookClosed,
  "an ordinary body/chair click triggers no old camper action", result && result.bodyClick);

var mobileResult = lib.runPageSync("loft-day.html", HARNESS, 4500, {
  patchRaf: true,
  forceMotion: true,
  forceCoarsePointer: true,
  urlSuffix: "?date=2026-07-15&time=12:00",
  chromeFlags: "--window-size=390,844"
});
check(mobileResult && mobileResult.errors.length === 0,
  "mobile notebook layout runs without uncaught errors", mobileResult && mobileResult.errors);
function compactNotebookFits(pageResult) {
  return pageResult && pageResult.notebook &&
    [pageResult.notebook.layout, pageResult.notebook.czechLayout].every(function (layout) {
      return layout && layout.paddingTop <= 6 && layout.paddingBottom <= 4 &&
        layout.scrollHeight <= layout.clientHeight && layout.bookTop >= 0 &&
        layout.bookBottom <= layout.viewportHeight && layout.closePosition === "absolute" &&
        Math.abs(layout.closeTop - layout.titleTop) <= 8;
    });
}
check(compactNotebookFits(mobileResult),
  "portrait phone book keeps both languages in view with the dismiss beside Chapter 1",
  mobileResult && mobileResult.notebook);

if (failures) process.exit(1);
console.log("Campsite camper-drag assertions passed.");
