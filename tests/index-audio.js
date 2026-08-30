#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report">pending</pre>
<script>(function () {
  var report = { errors: [], contexts: 0, panners: 0, sources: 0 };
  var focused = true;
  function param(value) {
    return { value: value || 0, cancelScheduledValues: function () {},
      setValueAtTime: function (next) { this.value = next; },
      linearRampToValueAtTime: function (next) { this.value = next; },
      exponentialRampToValueAtTime: function (next) { this.value = next; } };
  }
  function node() { return { connect: function () {}, disconnect: function () {},
    start: function () { report.sources++; }, stop: function () {} }; }
  function FakeAudioContext() {
    report.contexts++;
    this.currentTime = 0;
    this.sampleRate = 1000;
    this.state = "suspended";
    this.destination = node();
  }
  FakeAudioContext.prototype.createBuffer = function (_channels, length) {
    var data = new Float32Array(length);
    return { getChannelData: function () { return data; } };
  };
  FakeAudioContext.prototype.createBufferSource = function () {
    return Object.assign(node(), { buffer: null, loop: false });
  };
  FakeAudioContext.prototype.createGain = function () {
    return Object.assign(node(), { gain: param(1) });
  };
  FakeAudioContext.prototype.createBiquadFilter = function () {
    return Object.assign(node(), { type: "lowpass", frequency: param(350), Q: param(1) });
  };
  FakeAudioContext.prototype.createOscillator = function () {
    return Object.assign(node(), { type: "sine", frequency: param(440) });
  };
  FakeAudioContext.prototype.createStereoPanner = function () {
    report.panners++;
    return Object.assign(node(), { pan: param(0) });
  };
  FakeAudioContext.prototype.resume = function () { this.state = "running"; return Promise.resolve(); };
  FakeAudioContext.prototype.suspend = function () { this.state = "suspended"; return Promise.resolve(); };
  try {
    Object.defineProperty(document, "hidden", { configurable: true, get: function () { return false; } });
    Object.defineProperty(document, "visibilityState", { configurable: true, get: function () { return "visible"; } });
    Object.defineProperty(document, "hasFocus", { configurable: true, value: function () { return focused; } });
    window.AudioContext = FakeAudioContext;
    var button = document.getElementById("hub-sound");
    setLang("cs");
    button.click();
    report.started = window.__hubAudioState();
    report.startedControl = { active: button.getAttribute("data-sound-active"), label: button.textContent.trim(),
      language: document.documentElement.lang };
    setLang("en");
    report.englishLabel = button.textContent.trim();
    focused = false;
    dispatchEvent(new Event("blur"));
    report.blurred = window.__hubAudioState();
    focused = true;
    dispatchEvent(new Event("focus"));
    report.refocused = window.__hubAudioState();
    button.click();
    report.stopped = window.__hubAudioState();
  } catch (error) { report.errors.push(String(error && error.stack || error)); }
  report.errors = (window.__errs || []).concat(report.errors);
  document.getElementById("__report").textContent = JSON.stringify(report);
})();</script>`;

var result = lib.runPageSync("index.html", HARNESS, 700, {
  chromeFlags: "--window-size=1100,900"
});
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail ? " — " + JSON.stringify(detail) : ""));
  }
}

console.log("index.html spatial audio:");
if (!result) {
  console.error("  ✗ harness produced no report");
  process.exit(1);
}
check(result.errors.length === 0, "audio controller has no uncaught errors", result.errors);
check(result.contexts === 1, "hub sound uses exactly one AudioContext", result.contexts);
check(result.started && result.started.enabled && result.started.ambient && result.started.flight,
  "Sound starts both savanna ambience and the goose flight", result.started);
check(result.panners >= 4, "wind, insects, and geese have independent spatial outputs", result.panners);
check(result.startedControl && result.startedControl.active === "true" &&
  result.startedControl.language === "cs" && /Ztlumit/.test(result.startedControl.label),
  "Sound preserves Czech and exposes its mute action", result.startedControl);
check(/Mute/.test(result.englishLabel || ""), "active sound control follows the English language switch", result.englishLabel);
check(result.blurred && result.blurred.enabled && !result.blurred.ambient && !result.blurred.flight,
  "blur retires every autonomous sound while remembering the opt-in", result.blurred);
check(result.refocused && result.refocused.enabled && result.refocused.ambient && !result.refocused.flight,
  "focus restores ambience without replaying an interrupted flock", result.refocused);
check(result.stopped && !result.stopped.enabled && !result.stopped.ambient && !result.stopped.flight,
  "Mute retires all hub-owned sound", result.stopped);

if (failures) {
  console.error("\n" + failures + " index audio check(s) failed.");
  process.exit(1);
}
console.log("\nIndex audio checks passed.");
