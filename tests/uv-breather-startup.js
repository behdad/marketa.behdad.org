#!/usr/bin/env node
"use strict";

// Exercise the authored UV-breather block with captured timers. This pins the one-off startup
// hold without spending 18–30 seconds waiting for each later phase in a browser.
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var html = fs.readFileSync(path.join(__dirname, "..", "loft-day.html"), "utf8");
var start = html.indexOf("(function () {\n  var ON_MIN = 18000, ON_JIT = 12000;");
var end = html.indexOf("// Shift+P is the deliberate Party fast-forward.", start);
if (start < 0 || end <= start) throw new Error("UV-breather source boundary not found");

var timers = [];
var uvClass = false;
var context = {
  window: {
    __gardenPartyOn: true,
    __bbqDayPartyOn: false,
    __updateKitchenUvLinger: function () {}
  },
  document: {
    hidden: false,
    hasFocus: function () { return true; },
    addEventListener: function () {},
    getElementById: function () {
      return { classList: { contains: function () { return uvClass; } } };
    }
  },
  Math: Object.create(Math),
  setTimeout: function (callback, delay) {
    var timer = { callback: callback, delay: delay, cleared: false };
    timers.push(timer);
    return timer;
  },
  clearTimeout: function (timer) { if (timer) timer.cleared = true; },
  setInterval: function () {},
  setUvMode: function (on) { uvClass = !!on; },
  applyUvMode: function () { uvClass = true; },
  console: console
};
context.Math.random = function () { return 0.5; };
context.window.addEventListener = function () {};

vm.runInNewContext(html.slice(start, end), context);
context.window.__updateUvBreather();

var failures = 0;
function check(name, pass, detail) {
  if (pass) console.log("  ✓ " + name);
  else { failures++; console.error("  ✗ " + name + (detail ? "\n    " + detail : "")); }
}
function liveTimers() { return timers.filter(function (timer) { return !timer.cleared; }); }

var opening = liveTimers()[0];
check("Party starts with exactly one UV timer", liveTimers().length === 1 && uvClass, JSON.stringify(liveTimers()));
check("the opening UV phase lasts exactly 500 ms", opening && opening.delay === 500, opening && opening.delay);

opening.cleared = true;
opening.callback();
var normalLight = liveTimers()[0];
check("the first timer turns UV off", !uvClass, String(uvClass));
check("the later normal-light phase retains its 18–30 second cadence",
  normalLight && normalLight.delay === 24000, normalLight && normalLight.delay);

normalLight.cleared = true;
normalLight.callback();
var laterUv = liveTimers()[0];
check("the next timer turns UV back on", uvClass, String(uvClass));
check("the later UV phase retains its 18–30 second cadence",
  laterUv && laterUv.delay === 24000, laterUv && laterUv.delay);

process.exitCode = failures ? 1 : 0;
