#!/usr/bin/env node
"use strict";

// Inactive monitor apps keep their DOM state but leave SVG/HTML layout. The active app stays
// mounted throughout an Office pan and its native screen backing follows the app surface.
var lib = require("./lib");

var HARNESS = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  var appClasses = ["show-console","show-code","show-mail","show-mines","show-pacman","show-prince",
    "show-video","show-tattoo","show-life","show-calendar","show-clock","show-chat","show-python",
    "show-linux","show-snake","show-doom","show-browser","photobooth","picking"];
  var groupIds = ["monitor-desktop-dock","monitor-console","monitor-code","monitor-mail","monitor-mines",
    "monitor-pacman","monitor-prince","monitor-video","monitor-tattoo","monitor-life","monitor-calendar",
    "monitor-clock","monitor-chat","monitor-python","monitor-linux","monitor-snake","monitor-doom",
    "monitor-browser","monitor-photobooth"];
  function setSurface(cls) {
    var monitor = document.getElementById("office-monitor");
    appClasses.forEach(function (name) { monitor.classList.remove(name); });
    monitor.classList.add("screen-on", "show-caps");
    if (cls) monitor.classList.add(cls);
    return monitor;
  }
  function liveGroups() {
    return groupIds.filter(function (id) { return getComputedStyle(document.getElementById(id)).display !== "none"; });
  }
  function fill() { return getComputedStyle(document.getElementById("office-monitor-bg")).fill; }
  async function run() {
    window.__unlockAllRooms();
    window.__goToStage("office");
    await sleep(850);
    setSurface("");
    check("CAPS lays out only its desktop HTML group", liveGroups().join(",") === "monitor-desktop-dock", liveGroups().join(","));

    var expected = {
      "show-console": "rgb(16, 13, 10)", "show-code": "rgb(13, 19, 14)",
      "show-mail": "rgb(234, 227, 235)", "show-pacman": "rgb(5, 7, 17)",
      "show-prince": "rgb(0, 0, 0)", "show-video": "rgb(0, 0, 0)",
      "show-tattoo": "rgb(246, 235, 232)", "show-life": "rgb(239, 230, 207)",
      "show-calendar": "rgb(248, 245, 236)", "show-clock": "rgb(238, 241, 245)",
      "show-chat": "rgb(238, 241, 240)", "show-python": "rgb(14, 21, 32)",
      "show-linux": "rgb(21, 18, 14)", "show-snake": "rgb(0, 0, 0)",
      "show-doom": "rgb(0, 0, 0)", "show-browser": "rgb(216, 210, 196)"
    };
    Object.keys(expected).forEach(function (cls) {
      var monitor = setSurface(cls), id = "monitor-" + cls.slice(5);
      if (cls === "show-doom") id = "monitor-doom";
      check(cls + " owns the sole laid-out HTML app", liveGroups().join(",") === id,
        JSON.stringify({ groups: liveGroups(), fill: fill() }));
      check(cls + " gets its matching native backing immediately",
        fill() === expected[cls] && getComputedStyle(document.getElementById("office-monitor-bg")).transitionDuration === "0s",
        fill());
      monitor.classList.remove(cls);
    });

    var mines = document.getElementById("monitor-mines");
    setSurface("show-mines");
    [["chooser","rgb(243, 234, 217)"],["mines","rgb(207, 201, 187)"],["solitaire","rgb(24, 59, 49)"]].forEach(function (row) {
      mines.setAttribute("data-view", row[0]);
      check("Classics " + row[0] + " backing follows its subview", fill() === row[1], fill());
    });

    ["chooser", "duke", "doom", "q3"].forEach(function (view) {
      var monitor = setSurface("show-doom");
      document.getElementById("monitor-doom").setAttribute("data-shoot-view", view);
      check("Shoot " + view + " keeps the black native backing", fill() === "rgb(0, 0, 0)" &&
        liveGroups().join(",") === "monitor-doom", JSON.stringify({ fill: fill(), groups: liveGroups() }));
      monitor.classList.remove("show-doom");
    });

    var monitor = setSurface("show-python");
    var pyOut = document.getElementById("monitor-py-out");
    pyOut.setAttribute("data-layout-probe", "retained");
    window.__goToStage("cuddly");
    await sleep(100);
    check("Python remains painted while Office is still sliding out",
      !document.getElementById("stage-office").classList.contains("stage-far") &&
        getComputedStyle(document.getElementById("monitor-python")).display !== "none" &&
        getComputedStyle(document.querySelector("#monitor-python > foreignObject")).visibility === "visible");
    await sleep(780);
    check("Office foreignObjects park only after the slide settles",
      document.getElementById("stage-office").classList.contains("stage-far") &&
        getComputedStyle(document.querySelector("#monitor-python > foreignObject")).visibility === "hidden");
    window.__goToStage("office");
    await sleep(850);
    check("parking preserves the live app DOM state", monitor.classList.contains("show-python") &&
      pyOut.getAttribute("data-layout-probe") === "retained" &&
      getComputedStyle(document.querySelector("#monitor-python > foreignObject")).visibility === "visible");
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      run().catch(function (error) { out.errors.push("harness: " + String(error && error.stack || error)); }).then(function () {
        out.errors = out.errors.concat((window.__errs || []).slice());
        var pre = document.createElement("pre"); pre.id = "__report";
        pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
      });
    }, 300);
  });
})();
</script>`;

var result = lib.runPageSync("loft-day.html", HARNESS, 6200, { forceMotion: true, seedRandom: true });
if (!result) { console.error("monitor surface layout: no report"); process.exit(1); }
var failed = false;
result.checks.forEach(function (item) {
  console.log("  " + (item.pass ? "✓" : "✗") + " " + item.name +
    (item.pass || !item.detail ? "" : " — " + item.detail));
  if (!item.pass) failed = true;
});
if (result.errors.length) { failed = true; console.error("runtime errors:\n  " + result.errors.join("\n  ")); }
if (failed) process.exit(1);
console.log("monitor surface layout: all " + result.checks.length + " checks passed");
