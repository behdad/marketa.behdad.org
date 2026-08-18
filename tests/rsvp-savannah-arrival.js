#!/usr/bin/env node
"use strict";

const fs = require("fs");
const vm = require("vm");

const html = fs.readFileSync("loft-day.html", "utf8");
const marker = "(function () {\n  var arrival = document.getElementById(\"rsvp-savanna-arrival\");";
const start = html.indexOf(marker);
const close = html.indexOf("\n})();\n</script>", start);
if (start < 0 || close < 0) throw new Error("RSVP savannah arrival controller not found");
const controller = html.slice(start, close + "\n})();".length);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function classList(initial) {
  const values = new Set(initial || []);
  return {
    add(value) { values.add(value); },
    remove(value) { values.delete(value); },
    contains(value) { return values.has(value); }
  };
}

function harness(options = {}) {
  let now = 0;
  let nextTimer = 1;
  const timers = new Map();
  const windowEvents = new Map();
  const documentEvents = new Map();
  const mediaEvents = new Map();
  const arrivalEvents = new Map();
  const root = { classList: classList(options.revealed === false ? [] : ["revealed"]) };
  const arrival = {
    classList: classList(),
    state: "",
    querySelector() { return null; },
    setAttribute(name, value) { if (name === "data-arrival-state") this.state = value; },
    addEventListener(name, callback) { arrivalEvents.set(name, callback); }
  };
  const media = {
    matches: !!options.reduced,
    addEventListener(name, callback) { mediaEvents.set(name, callback); },
    addListener(callback) { mediaEvents.set("change", callback); }
  };
  const document = {
    hidden: !!options.hidden,
    documentElement: root,
    hasFocus() { return options.focus !== false; },
    getElementById(id) { return id === "rsvp-savanna-arrival" ? arrival : null; },
    addEventListener(name, callback) { documentEvents.set(name, callback); }
  };
  function setTimeoutMock(callback, delay) {
    const id = nextTimer++;
    timers.set(id, { callback, due: now + delay });
    return id;
  }
  function clearTimeoutMock(id) { timers.delete(id); }
  function advance(milliseconds) {
    const target = now + milliseconds;
    for (;;) {
      const due = [...timers.entries()]
        .filter(([, item]) => item.due <= target)
        .sort((a, b) => a[1].due - b[1].due)[0];
      if (!due) break;
      now = due[1].due;
      timers.delete(due[0]);
      due[1].callback();
    }
    now = target;
  }
  function addEventListener(name, callback) { windowEvents.set(name, callback); }
  const window = { matchMedia() { return media; } };
  vm.runInNewContext(controller, {
    window,
    document,
    matchMedia: window.matchMedia,
    setTimeout: setTimeoutMock,
    clearTimeout: clearTimeoutMock,
    addEventListener
  });
  return {
    arrival,
    root,
    media,
    document,
    timers,
    advance,
    focus(value) { options.focus = value; },
    dispatchWindow(name) { windowEvents.get(name)?.(); },
    dispatchDocument(name) { documentEvents.get(name)?.(); },
    dispatchMedia(name) { mediaEvents.get(name)?.(); },
    dispatchArrival(name, event) { arrivalEvents.get(name)?.(event); }
  };
}

assert(html.includes("var RSVP_ARRIVAL_DELAY_MS = 15000;"), "arrival must wait 15 seconds");
assert(html.includes("@media (prefers-reduced-motion:reduce){#rsvp-savanna-arrival{display:none}}"),
  "reduced-motion visitors must not see the entrance");
assert(html.includes("width - inset - rose.getBoundingClientRect().right"),
  "traveler and rose must stay anchored to the viewport's right edge");

{
  const page = harness();
  assert(page.arrival.state === "scheduled", "RSVP load should schedule the cameo");
  page.advance(14999);
  assert(!page.arrival.classList.contains("started"), "cameo started before 15 seconds");
  page.advance(1);
  assert(page.arrival.classList.contains("started"), "cameo did not start at 15 seconds");
  page.dispatchArrival("animationend", { animationName: "rsvp-traveler-cameo" });
  assert(!page.arrival.classList.contains("started"), "completed cameo did not clean up");
  assert(page.arrival.classList.contains("rose-left"), "completed cameo did not leave its wild rose");
  assert(page.arrival.state === "complete", "completed cameo state was not recorded");
}

{
  const page = harness({ hidden: true, focus: false });
  page.advance(15000);
  assert(page.arrival.state === "waiting-for-focus", "backgrounded cameo should wait for focus");
  assert(!page.arrival.classList.contains("started"), "backgrounded cameo started invisibly");
  page.document.hidden = false;
  page.focus(true);
  page.dispatchDocument("visibilitychange");
  assert(page.arrival.classList.contains("started"), "focused RSVP did not resume the due cameo");
}

{
  const page = harness({ reduced: true });
  assert(page.arrival.state === "reduced-motion", "reduced-motion state was not honored");
  assert(page.timers.size === 0, "reduced-motion RSVP scheduled a cameo timer");
}

{
  const page = harness({ revealed: false });
  assert(page.arrival.state === "game-only", "game-only page should not schedule the cameo");
  assert(page.timers.size === 0, "game-only page scheduled a cameo timer");
  page.root.classList.add("revealed");
  page.dispatchWindow("hashchange");
  page.advance(0);
  assert(page.arrival.state === "scheduled", "revealing RSVP did not schedule the cameo");
}

{
  const page = harness();
  page.media.matches = true;
  page.dispatchMedia("change");
  assert(page.arrival.state === "reduced-motion", "live reduced-motion change was ignored");
  assert(page.timers.size === 0, "live reduced-motion change left its timer running");
  assert(!page.arrival.classList.contains("rose-left"), "reduced-motion state left the wild rose visible");
}

{
  const page = harness();
  page.advance(15000);
  page.dispatchArrival("animationend", { animationName: "rsvp-traveler-cameo" });
  assert(page.arrival.classList.contains("rose-left"), "completed cameo did not retain its rose");
  page.media.matches = true;
  page.dispatchMedia("change");
  assert(!page.arrival.classList.contains("rose-left"), "reduced-motion change did not hide the retained rose");
}

console.log("RSVP savannah arrival checks passed.");
