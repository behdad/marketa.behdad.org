#!/usr/bin/env node
"use strict";

// Hack-Man's timer-driven arcade cues must map to real state transitions, stay on the
// one shared SFX bus, and refuse to start after blur or presentation teardown.
var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>(function () {
  var report = { errors: [], steps: {} }, focused = true;
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function key(value) { document.dispatchEvent(new KeyboardEvent("keydown", { key: value, bubbles: true, cancelable: true })); }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  try { Object.defineProperty(document, "hasFocus", { configurable: true, value: function () { return focused; } }); } catch (_error) {}
  window.addEventListener("load", function () { setTimeout(async function () { try {
    window.__goToStage("garden");
    window.__unlockPacman(false);
    window.__openRoomPacman();
    var realSound = window.__playHackManSound, realStop = window.__stopHackManSounds;
    var cues = [];
    window.__playHackManSound = function (kind) { cues.push(kind); return true; };
    var base = window.__pacmanCapture(), pelletMask = base.pellets.map(function () { return true; });

    var run = clone(base);
    run.status = "ready"; run.player = { r: 13, c: 9 }; run.direction = run.desired = "left";
    run.ghosts.forEach(function (ghost, i) { ghost.r = 1; ghost.c = 1 + i * 8; ghost.released = false; ghost.releaseAt = 999; });
    run.pellets = pelletMask.slice();
    window.__pacmanRestore(run); cues = []; key("ArrowLeft"); await sleep(210);
    report.steps.start_pellet = cues.slice();

    var death = clone(run);
    death.ghosts[0] = { r: 13, c: 8, dir: "right" };
    death.ghosts[1] = { r: 1, c: 1, dir: "right" };
    death.ghosts[2] = { r: 1, c: 17, dir: "left" };
    death.lives = 3; death.fright = 0; death.pellets = pelletMask.slice();
    window.__pacmanRestore(death); cues = []; key("ArrowLeft"); await sleep(220);
    report.steps.death = cues.slice();

    var ghost = clone(death);
    ghost.player = { r: 13, c: 2 }; ghost.direction = ghost.desired = "left";
    ghost.ghosts[0] = { r: 13, c: 1, dir: "right" }; ghost.lives = 3; ghost.fright = 0;
    window.__pacmanRestore(ghost); cues = []; key("ArrowLeft"); await sleep(220);
    report.steps.ghost = cues.slice();

    var end = clone(run), last = 13 * 19 + 8;
    end.pellets = end.pellets.map(function (_on, i) { return i === last; });
    window.__pacmanRestore(end); cues = []; key("ArrowLeft"); await sleep(190);
    report.steps.end = cues.slice();

    // Run the real synth against a fake SFX handle. This proves the five shapes are
    // distinct without constructing or touching a browser AudioContext in the test.
    window.__pacmanRestore(run);
    var activeKind = "", fakeCalls = 0, signatures = {}, fakeOscillators = [];
    function param(initial) {
      return { value: initial, events: [],
        setValueAtTime: function (value) { this.value = value; this.events.push(value); },
        linearRampToValueAtTime: function (value) { this.value = value; this.events.push(value); },
        exponentialRampToValueAtTime: function (value) { this.value = value; this.events.push(value); },
        cancelScheduledValues: function () {}, setTargetAtTime: function (value) { this.value = value; }
      };
    }
    function node() { return { connect: function () {}, disconnect: function () {} }; }
    var fakeCtx = {
      currentTime: 10, destination: node(),
      createGain: function () { var value = node(); value.gain = param(1); return value; },
      createStereoPanner: function () { var value = node(); value.pan = param(0); return value; },
      createOscillator: function () {
        var value = node(); value.frequency = param(440); value.start = function () {};
        value.stop = function () {}; value.kind = activeKind; fakeOscillators.push(value); return value;
      }
    };
    window.__getSfxCtx = function () { fakeCalls++; return fakeCtx; };
    window.__playHackManSound = realSound;
    ["pellet", "ghost", "death", "start", "end"].forEach(function (kind) {
      activeKind = kind; var before = fakeOscillators.length;
      var played = realSound(kind, kind === "death");
      var made = fakeOscillators.slice(before);
      signatures[kind] = { played: played, count: made.length,
        notes: made.map(function (osc) { return osc.frequency.events[0]; }).join(",") };
    });
    report.steps.profiles = { signatures: signatures, getSfxCalls: fakeCalls,
      distinct: new Set(Object.keys(signatures).map(function (kind) { var s = signatures[kind]; return s.count + ":" + s.notes; })).size };

    var callsBeforeBlur = fakeCalls;
    focused = false; window.dispatchEvent(new Event("blur"));
    report.steps.unfocused = { played: realSound("start"), getSfxCalls: fakeCalls - callsBeforeBlur };
    focused = true; window.dispatchEvent(new Event("focus"));
    var stopCalls = 0;
    window.__stopHackManSounds = function () { stopCalls++; realStop(); };
    window.__closeMonitorPacman();
    var callsBeforeClose = fakeCalls;
    report.steps.closed = { played: realSound("start"), getSfxCalls: fakeCalls - callsBeforeClose,
      stopCalls: stopCalls, presentation: window.__pacmanPresentation() };
  } catch (error) { window.__errs.push("harness: " + String(error && error.stack || error)); }
  report.errors = window.__errs; document.getElementById("__report").textContent = JSON.stringify(report);
  }, 300); });
})();</script>`;

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? " — " + JSON.stringify(detail) : "")); }
}

console.log("rsvp.html Hack-Man audio:");
var result = lib.runPageSync("rsvp.html", HARNESS, 5200, { patchRaf: true, forceMotion: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.start_pellet && s.start_pellet[0] === "start" && s.start_pellet.indexOf("pellet") > 0,
  "the first legal move cues start before its first pellet", s.start_pellet);
check(s.death && s.death.indexOf("death") >= 0,
  "a live-ghost collision cues the player death sound", s.death);
check(s.ghost && s.ghost.indexOf("ghost") >= 0,
  "an edible-ghost collision cues the bonus sound", s.ghost);
check(s.end && s.end.indexOf("end") >= 0,
  "the final pellet cues the maze-clear ending", s.end);
check(s.profiles && s.profiles.distinct === 5 && s.profiles.getSfxCalls === 5 &&
  Object.keys(s.profiles.signatures).every(function (kind) { return s.profiles.signatures[kind].played && s.profiles.signatures[kind].count > 0; }),
  "all five restrained synth profiles are distinct and share the injected SFX handle", s.profiles);
check(s.unfocused && !s.unfocused.played && s.unfocused.getSfxCalls === 0,
  "an unfocused loop event cannot even request the SFX bus", s.unfocused);
check(s.closed && !s.closed.played && s.closed.getSfxCalls === 0 && s.closed.stopCalls > 0 && !s.closed.presentation.mode,
  "teardown stops live cue nodes and blocks later sounds", s.closed);

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
check((source.match(/new Ctx\(\)/g) || []).length === 1 &&
  /function playHackManSound\([\s\S]*?getSfxCtx\(\)[\s\S]*?pannedOut\(ctx, "monitor-pacman-wrap"\)/.test(source),
  "Hack-Man adds no AudioContext and routes through the shared, room-panned SFX path");

console.log("");
if (failures) { console.log(failures + " Hack-Man audio assertion" + (failures === 1 ? "" : "s") + " failed."); process.exit(1); }
console.log("Hack-Man audio assertions passed.");
