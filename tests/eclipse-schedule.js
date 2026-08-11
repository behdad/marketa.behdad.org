#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var vm = require("vm");

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
var start = source.indexOf("(function scheduleSolarEclipse() {");
var end = source.indexOf("\n  })();", start);
if (start < 0 || end < 0) throw new Error("solar eclipse scheduler not found");
var scheduler = source.slice(start, end + "\n  })();".length);

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail == null ? "" : "   [" + JSON.stringify(detail) + "]"));
  }
}

function load(randoms) {
  var timers = [];
  var runs = 0;
  var allowed = false;
  var dusk = false;
  var randomIndex = 0;
  var sandbox = {
    Math: { random: function () { return randoms[randomIndex++] || 0; } },
    document: {
      getElementById: function (id) {
        if (id !== "stage-balcony") return null;
        return { classList: { contains: function (name) { return name === "dusk" && dusk; } } };
      }
    },
    window: {
      __roomAutonomyAllowed: function (room) { return room === "balcony" && allowed; }
    },
    runSolarEclipse: function () { runs++; },
    setTimeout: function (fn, delay) { timers.push({ fn: fn, delay: delay }); return timers.length; }
  };
  vm.runInNewContext(scheduler, sandbox);
  return {
    timers: timers,
    runs: function () { return runs; },
    setAllowed: function (value) { allowed = !!value; },
    setDusk: function (value) { dusk = !!value; },
    fire: function () {
      var timer = timers.shift();
      if (!timer) throw new Error("no eclipse timer armed");
      timer.fn();
      return timer;
    }
  };
}

console.log("rsvp.html automatic eclipse cadence:");

var low = load([0, 0]);
check(low.timers[0].delay === 90000, "the first opportunity starts at 90 seconds", low.timers[0].delay);
low.fire();
check(low.timers[0].delay === 300000, "later opportunities start at five minutes", low.timers[0].delay);

var high = load([0.999999, 0.999999]);
check(high.timers[0].delay >= 90000 && high.timers[0].delay < 180000,
  "the first opportunity stays below three minutes", high.timers[0].delay);
high.fire();
check(high.timers[0].delay >= 300000 && high.timers[0].delay < 540000,
  "later opportunities stay below nine minutes", high.timers[0].delay);

var missed = load([0.5, 0.25, 0.75]);
check(missed.timers[0].delay === 135000, "a midpoint first roll lands at 135 seconds", missed.timers[0].delay);
missed.fire();
check(missed.runs() === 0 && missed.timers[0].delay === 360000,
  "an ineligible opportunity is skipped and advances to the long cadence",
  { runs: missed.runs(), next: missed.timers[0].delay });
missed.setAllowed(true);
check(missed.runs() === 0,
  "entering the Balcony after a miss does not fire the eclipse immediately", missed.runs());
missed.fire();
check(missed.runs() === 1 && missed.timers[0].delay === 480000,
  "the next due eligible opportunity fires once and re-arms the long cadence",
  { runs: missed.runs(), next: missed.timers[0].delay });

var night = load([0.2, 0.4]);
night.setAllowed(true);
night.setDusk(true);
night.fire();
check(night.runs() === 0 && night.timers[0].delay >= 300000,
  "a nighttime opportunity is skipped rather than queued for daybreak",
  { runs: night.runs(), next: night.timers[0].delay });

check(/register\(\{ id: "sky\.eclipse\.play"[\s\S]*?runInRoom\("balcony"[\s\S]*?controllers\.eclipse\(\)[\s\S]*?__loftAwaitLifecycle/.test(source) &&
    !/window\.eclipse\s*=/.test(source),
  "the typed loft.sky.eclipse.play action owns explicit navigation and the full finite eclipse lifecycle");

console.log("");
if (failures) {
  console.log(failures + " eclipse cadence assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Eclipse cadence assertions passed.");
