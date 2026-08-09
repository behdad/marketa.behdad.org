#!/usr/bin/env node
// A final Phase 1 action owns solved/unlocked state synchronously. Reloading during
// its presentation pause may cancel the pan, but cannot leave a terminal unsolved room.
"use strict";

var lib = require("./lib");

var CASES = {
  garden: {
    room: "garden",
    max: 1,
    solved: ["kitchen"],
    setup: [
      "window.markGardenWatered();",
      "click('garden-guitar');",
      "click('garden-candle-1');",
      "await sleep(40);"
    ].join("\n"),
    finish: "click('garden-candle-2');",
    terminalDom: "document.getElementById('garden-candle-2').classList.contains('lit')",
    terminalSaved: "raw.puzzle.garden.candles && raw.puzzle.garden.candle1 && raw.puzzle.garden.candle2",
    next: "window.__gardenDoNext()",
    target: "cuddly"
  },
  cuddly: {
    room: "cuddly",
    max: 2,
    solved: ["kitchen", "garden"],
    setup: [
      "click('cuddly-octopus');",
      "await sleep(60);",
      "click('cuddly-balcony-door');",
      "await sleep(20);"
    ].join("\n"),
    finish: "window.__pullMainBlanket();",
    terminalDom: "document.getElementById('cuddly-blanket').classList.contains('done')",
    terminalSaved: "raw.puzzle.cuddly.blankets.indexOf('cuddly-blanket') !== -1",
    next: "window.__cuddlyDoNext()",
    target: "office"
  },
  office: {
    room: "office",
    max: 3,
    solved: ["kitchen", "garden", "cuddly"],
    setup: [
      "window.__setOfficeProgress('prague', true);",
      "window.__setOfficeProgress('pc', true);",
      "window.__settleOfficeLamps(true, true);"
    ].join("\n"),
    finish: "click('office-stainedglass');",
    terminalDom: "document.getElementById('office-stainedglass').classList.contains('done')",
    terminalSaved: "raw.puzzle.office.glass",
    next: "window.__officeDoNext()",
    target: "balcony"
  }
};

function recoveryHarness(id, testCase) {
  var sessionKey = "checkpoint-solve-handoff-" + id;
  return String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [] };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function click(id) {
    var node = document.getElementById(id);
    if (!node) throw new Error("missing click target: " + id);
    node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  }
  async function seed() {
    localStorage.removeItem("loftCheckpoint:v1");
    window.__endAttract();
    window.__setMaxUnlocked(${testCase.max});
    window.__setSolvedRooms(${JSON.stringify(testCase.solved)});
    window.goToStage(${JSON.stringify(testCase.room)});
    ${testCase.setup}
    window.__saveLoftCheckpoint();
    ${testCase.finish}
    var raw = JSON.parse(localStorage.getItem("loftCheckpoint:v1"));
    sessionStorage.setItem(${JSON.stringify(sessionKey + "-immediate")}, JSON.stringify({
      room: window.currentStageName,
      max: window.__maxUnlocked(),
      solved: window.__solvedRooms(),
      terminal: !!(${testCase.terminalDom}),
      stored: {
        room: raw.progress.room,
        max: raw.progress.maxUnlocked,
        solved: raw.progress.solvedRooms,
        terminal: !!(${testCase.terminalSaved})
      }
    }));
    sessionStorage.setItem(${JSON.stringify(sessionKey)}, "1");
    location.reload();
  }
  async function recover() {
    report.immediate = JSON.parse(sessionStorage.getItem(${JSON.stringify(sessionKey + "-immediate")}));
    var raw = JSON.parse(localStorage.getItem("loftCheckpoint:v1"));
    report.saved = {
      room: raw.progress.room,
      max: raw.progress.maxUnlocked,
      solved: raw.progress.solvedRooms,
      terminal: !!(${testCase.terminalSaved})
    };
    var gate = document.getElementById("loft-recovery-gate");
    if (!gate) throw new Error("missing recovery gate");
    gate.querySelector(".loft-recovery-btn.primary").click();
    await sleep(180);
    report.restored = {
      room: window.currentStageName,
      max: window.__maxUnlocked(),
      solved: window.__solvedRooms(),
      terminal: !!(${testCase.terminalDom}),
      next: ${testCase.next},
      nextLocked: document.getElementById("hunt-next").classList.contains("locked")
    };
    document.getElementById("hunt-next").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await sleep(80);
    report.afterNext = { room: window.currentStageName, solved: window.__solvedRooms() };
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      var recovering = sessionStorage.getItem(${JSON.stringify(sessionKey)}) === "1";
      (recovering ? recover() : seed()).catch(function (error) {
        report.errors.push("harness: " + String(error && error.stack || error));
      }).then(function () {
        if (!recovering) return;
        report.errors = (window.__errs || []).concat(report.errors);
        document.getElementById("__report").textContent = JSON.stringify(report);
      });
    }, 220);
  });
})();
</script>`;
}

var VISIT_HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [] };
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        window.__endAttract();
        window.__setMaxUnlocked(4);
        window.__setSolvedRooms([]);
        ["garden", "cuddly", "office"].forEach(function (room) { window.goToStage(room); });
        report.room = window.currentStageName;
        report.max = window.__maxUnlocked();
        report.solved = window.__solvedRooms();
      } catch (error) {
        report.errors.push("harness: " + String(error && error.stack || error));
      }
      report.errors = (window.__errs || []).concat(report.errors);
      document.getElementById("__report").textContent = JSON.stringify(report);
    }, 260);
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

console.log("loft-day.html final-action checkpoint handoffs:");
Object.keys(CASES).forEach(function (id) {
  var testCase = CASES[id];
  var result = lib.runPageSync("loft-day.html", recoveryHarness(id, testCase), 3200, {
    patchRaf: true,
    forceMotion: true,
    urlSuffix: "?date=2026-07-15&time=12:00"
  });
  check(result && result.errors.length === 0, id + " reload has no uncaught errors", result && result.errors);
  check(result && result.immediate && result.immediate.room === testCase.room &&
    result.immediate.max === testCase.max + 1 && result.immediate.terminal &&
    result.immediate.solved.indexOf(testCase.room) !== -1 &&
    result.immediate.stored && result.immediate.stored.room === testCase.room &&
    result.immediate.stored.max === testCase.max + 1 && result.immediate.stored.terminal &&
    result.immediate.stored.solved.indexOf(testCase.room) !== -1,
  id + " final action synchronously persists prop, solved, and unlock state before its pan", result && result.immediate);
  check(result && result.saved && result.saved.room === testCase.room &&
    result.saved.max === testCase.max + 1 && result.saved.terminal &&
    result.saved.solved.indexOf(testCase.room) !== -1,
  id + " pagehide persists one coherent completed-room checkpoint", result && result.saved);
  check(result && result.restored && result.restored.room === testCase.room &&
    result.restored.max === testCase.max + 1 && result.restored.terminal &&
    result.restored.solved.indexOf(testCase.room) !== -1 && result.restored.next === null &&
    !result.restored.nextLocked,
  id + " Continue restores a stable solved room with its next room available", result && result.restored);
  check(result && result.afterNext && result.afterNext.room === testCase.target &&
    result.afterNext.solved.indexOf(testCase.room) !== -1,
  id + " the unlocked next-room control completes the cancelled handoff", result && result.afterNext);
});

var visit = lib.runPageSync("loft-day.html", VISIT_HARNESS, 1000, { patchRaf: true });
check(visit && visit.errors.length === 0, "unlocked-room visit harness has no uncaught errors", visit && visit.errors);
check(visit && visit.room === "office" && visit.max === 4 && visit.solved.length === 0,
  "freely visiting unlocked Garden, Cuddly, and Office never marks them solved", visit);

if (failures) process.exit(1);
console.log("Final-action checkpoint handoff assertions passed.");
