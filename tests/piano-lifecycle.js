#!/usr/bin/env node
"use strict";

// The night-sky piano is a dismissible room overlay, not a permanent projector mode.
// Dismissal is durable until an explicit projector-channel change, and touch-first
// devices keep the playable keys without advertising computer-key labels.
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
  window.__goToStage("cuddly");
  window.__cuddlyProjector.set("stars");
  var piano = document.getElementById("cuddly-projector-piano");
  var close = piano.querySelector(".piano-dismiss");
  var hit = close.querySelector(".mini-hit");
  var visibleClose = close.querySelector(".piano-dismiss-bg");
  var deck = piano.querySelector(".piano-deck-outline");
  var matrix = close.transform.baseVal.consolidate().matrix;
  var state = window.__projectorPianoState();
  check("visible piano has a pointer-dismiss control", state.enabled && close && getComputedStyle(close).pointerEvents !== "none");
  check("dismiss control sits at the keybed's upper right",
    matrix.e >= (+deck.getAttribute("x") + +deck.getAttribute("width") - 10) &&
    matrix.f <= (+deck.getAttribute("y") + 12),
    JSON.stringify({ x: matrix.e, y: matrix.f }));
  check("dismiss control is localized", close.querySelector("title").textContent === "Dismiss piano");
  check("dismiss artwork is compact while its pointer target stays forgiving",
    +visibleClose.getAttribute("r") <= 4.1 && +hit.getAttribute("r") >= 9,
    JSON.stringify({ visible: visibleClose.getAttribute("r"), hit: hit.getAttribute("r") }));
  check("dismiss artwork uses the piano's dark wood and cream palette",
    visibleClose.getAttribute("fill") === "#302924" && visibleClose.getAttribute("stroke") === "#f8f5ec");
  window.__setLang("cs");
  check("dismiss control has Czech accessibility copy", close.querySelector("title").textContent === "Zavřít piano");
  window.__setLang("en");

  close.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  state = window.__projectorPianoState();
  check("pointer dismissal hides only the playable keybed", state.dismissed && !state.enabled && piano.classList.contains("piano-dismissed") && window.__cuddlyProjector.channel() === "stars");
  check("dismissal enters the checkpoint row", window.__captureCheckpointSystems()["projector-piano"].dismissed === true);

  window.__cuddlyProjector.set("stars");
  state = window.__projectorPianoState();
  check("selecting the same projector channel does not rearm the keybed", state.dismissed && !state.enabled);

  window.__goToStage("garden");
  window.__goToStage("cuddly");
  state = window.__projectorPianoState();
  check("leaving and returning preserves dismissal", state.dismissed && !state.enabled);

  window.__openCinemaRoom();
  var cinemaState = window.__projectorPianoState();
  window.__closeCinemaRoom();
  state = window.__projectorPianoState();
  check("the lower Cinema owns its layer without rearming the piano",
    cinemaState.enabled === false && cinemaState.dismissed === true && state.dismissed && !state.enabled);

  window.__cuddlyProjector.set("fire");
  var awayState = window.__projectorPianoState();
  window.__cuddlyProjector.set("stars");
  state = window.__projectorPianoState();
  check("an explicit channel change rearms the keybed",
    !awayState.dismissed && state.enabled && !state.dismissed && !piano.classList.contains("piano-dismissed"));

  var escape = key("Escape");
  state = window.__projectorPianoState();
  check("Escape dismisses the keybed", escape.defaultPrevented && state.dismissed && !state.enabled);
  window.__goToStage("garden");
  window.__goToStage("cuddly");
  state = window.__projectorPianoState();
  check("room navigation does not undo Escape dismissal", state.dismissed && !state.enabled);

  window.__cuddlyProjector.set("fire");
  window.__cuddlyProjector.set("stars");
  var backspace = key("Backspace");
  state = window.__projectorPianoState();
  check("Backspace mirrors piano Escape", backspace.defaultPrevented && state.dismissed && !state.enabled);

  window.__cuddlyProjector.set("fire");
  window.__cuddlyProjector.set("stars");
  var octopus = document.getElementById("cuddly-octopus");
  octopus.classList.add("played");
  var calls = [], realDismiss = window.__dismissProjectorPiano;
  window.__dismissProjectorPiano = function () { calls.push("dismiss"); return realDismiss(); };
  octopus.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  octopus.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  var pointerOcti = window.__octiEscapeState();
  window.__dismissProjectorPiano = realDismiss;
  state = window.__projectorPianoState();
  check("pointer Octi start clears the piano at the canonical game owner",
    calls.join(",") === "dismiss" && pointerOcti.active && state.dismissed && !state.enabled,
    JSON.stringify({ calls: calls, octi: pointerOcti }));
  window.__stopOctiEscape(true);

  window.__cuddlyProjector.set("fire");
  window.__cuddlyProjector.set("stars");
  calls = [];
  var realOcti = window.__startOctiEscape;
  window.__dismissProjectorPiano = function () { calls.push("dismiss"); return realDismiss(); };
  window.__startOctiEscape = function () { calls.push("route"); return realOcti(); };
  var enter = key("Enter");
  window.__dismissProjectorPiano = realDismiss;
  window.__startOctiEscape = realOcti;
  state = window.__projectorPianoState();
  check("global Enter reaches the same canonical Octi dismissal",
    enter.defaultPrevented && calls.join(",") === "route,dismiss" && window.__octiEscapeState().active && state.dismissed && !state.enabled,
    calls.join(","));
  window.__stopOctiEscape(true);
  check("desktop retains the computer-key map", state.labels && getComputedStyle(piano.querySelector(".piano-key-label")).display !== "none");
  report();
})();
</script>`;

var COARSE_HARNESS = String.raw`<script>
(function () {
  window.__setPartyMode(true, true);
  window.__goToStage("cuddly");
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
  // These lifecycle checks are motion-independent; full motion plus timer-backed rAF can keep
  // the page's animation work alive until the dump-dom transport times out.
  var report = lib.runPageSync("loft-day.html", harness, 1800, Object.assign({ forceReduce: true, seedRandom: true }, opts || {}));
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

console.log("loft-day.html piano lifecycle:");
var failures = run("desktop", HARNESS) + run("coarse", COARSE_HARNESS, { forceHybridPointer: true });
if (failures) process.exit(1);
console.log("piano-lifecycle: all checks passed");
