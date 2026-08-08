#!/usr/bin/env node
"use strict";

// The night-sky piano is a dismissible room overlay, not a permanent projector mode.
// Its dismissal belongs only to the current room/channel visit, and touch-first devices
// keep the playable keys without advertising computer-key labels.
var lib = require("./lib");

var HARNESS = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function key(name) {
    var event = new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true });
    document.dispatchEvent(event);
    return event;
  }
  function report() {
    out.errors = (window.__errs || []).slice();
    var pre = document.createElement("pre");
    pre.id = "__report";
    pre.textContent = JSON.stringify(out);
    document.body.appendChild(pre);
  }

  window.__setPartyMode(true, true);
  window.goToStage("cuddly");
  window.__cuddlyProjector.set("stars");
  var piano = document.getElementById("cuddly-projector-piano");
  var close = piano.querySelector(".piano-dismiss");
  var deck = piano.querySelector(".piano-deck-outline");
  var matrix = close.transform.baseVal.consolidate().matrix;
  var state = window.__projectorPianoState();
  check("visible piano has a pointer-dismiss control", state.enabled && close && getComputedStyle(close).pointerEvents !== "none");
  check("dismiss control sits at the keybed's upper right",
    matrix.e >= (+deck.getAttribute("x") + +deck.getAttribute("width") - 10) &&
    matrix.f <= (+deck.getAttribute("y") + 12),
    JSON.stringify({ x: matrix.e, y: matrix.f }));
  check("dismiss control is localized", close.querySelector("title").textContent === "Dismiss piano");
  window.setLang("cs");
  check("dismiss control has Czech accessibility copy", close.querySelector("title").textContent === "Zavřít piano");
  window.setLang("en");

  close.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  state = window.__projectorPianoState();
  check("pointer dismissal hides only the playable keybed", state.dismissed && !state.enabled && piano.classList.contains("piano-dismissed") && window.__cuddlyProjector.channel() === "stars");

  window.__cuddlyProjector.set("fire");
  window.__cuddlyProjector.set("stars");
  state = window.__projectorPianoState();
  check("changing away and back rearms the keybed", state.enabled && !state.dismissed && !piano.classList.contains("piano-dismissed"));

  var escape = key("Escape");
  state = window.__projectorPianoState();
  check("Escape dismisses the keybed before room navigation", escape.defaultPrevented && state.dismissed && !state.enabled);
  window.goToStage("garden");
  window.goToStage("cuddly");
  state = window.__projectorPianoState();
  check("leaving and returning rearms the keybed", state.enabled && !state.dismissed);

  var backspace = key("Backspace");
  state = window.__projectorPianoState();
  check("Backspace mirrors piano Escape", backspace.defaultPrevented && state.dismissed && !state.enabled);

  window.__openCinemaRoom();
  var cinemaState = window.__projectorPianoState();
  window.__closeCinemaRoom();
  state = window.__projectorPianoState();
  check("the lower Cinema owns its layer and rearms the piano on return",
    cinemaState.enabled === false && cinemaState.dismissed === false && state.enabled && !state.dismissed);

  window.goToStage("garden");
  window.goToStage("cuddly");
  window.__cuddlyProjector.set("stars");
  var calls = [], realDismiss = window.__dismissProjectorPiano, realOcti = window.__startOctiEscape;
  window.__dismissProjectorPiano = function () { calls.push("dismiss"); return realDismiss(); };
  window.__startOctiEscape = function () { calls.push("octi"); return true; };
  var enter = key("Enter");
  window.__dismissProjectorPiano = realDismiss;
  window.__startOctiEscape = realOcti;
  state = window.__projectorPianoState();
  check("global Enter clears the piano before launching Octi", enter.defaultPrevented && calls.join(",") === "dismiss,octi" && state.dismissed && !state.enabled, calls.join(","));
  check("desktop retains the computer-key map", state.labels && getComputedStyle(piano.querySelector(".piano-key-label")).display !== "none");
  report();
})();
</script>`;

var COARSE_HARNESS = String.raw`<script>
(function () {
  window.__setPartyMode(true, true);
  window.goToStage("cuddly");
  window.__cuddlyProjector.set("stars");
  var piano = document.getElementById("cuddly-projector-piano");
  var labels = [].slice.call(piano.querySelectorAll(".piano-key-label"));
  var pre = document.createElement("pre");
  pre.id = "__report";
  pre.textContent = JSON.stringify({
    checks: [{ name: "coarse/touch devices hide computer-key labels", pass:
      piano.classList.contains("coarse-input") && !window.__projectorPianoState().labels &&
      labels.length === 2 && labels.every(function (label) { return getComputedStyle(label).display === "none"; }) }],
    errors: (window.__errs || []).slice()
  });
  document.body.appendChild(pre);
})();
</script>`;

function run(label, harness, opts) {
  var report = lib.runPageSync("rsvp.html", harness, 1800, Object.assign({ patchRaf: true, forceMotion: true, seedRandom: true, urlSuffix: "#play" }, opts || {}));
  if (!report) { console.error("piano-lifecycle: no " + label + " report"); return 1; }
  var failed = false;
  report.checks.forEach(function (check) {
    console.log("  " + (check.pass ? "✓" : "✗") + " " + check.name + (check.pass || !check.detail ? "" : " — " + check.detail));
    if (!check.pass) failed = true;
  });
  if (report.errors.length) {
    failed = true;
    console.error(label + " runtime errors:\n  " + report.errors.join("\n  "));
  }
  return failed ? 1 : 0;
}

console.log("rsvp.html piano lifecycle:");
var failures = run("desktop", HARNESS) + run("coarse", COARSE_HARNESS, { forceHybridPointer: true });
if (failures) process.exit(1);
console.log("piano-lifecycle: all checks passed");
