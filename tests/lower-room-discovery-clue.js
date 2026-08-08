#!/usr/bin/env node
"use strict";

// The phase-two portal clue is intentionally late and one-shot. Portal knowledge
// lives outside checkpoint/reset state and any successful lower-room entry records it.
var fs = require("fs");
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) {
    out.checks.push({ name: name, pass: !!pass, detail: detail || "" });
  }
  function report() {
    out.errors = out.errors.concat((window.__errs || []).slice());
    var pre = document.createElement("pre");
    pre.id = "__report";
    pre.textContent = JSON.stringify(out);
    document.body.appendChild(pre);
  }
  function key(name, options) {
    var init = { key: name, bubbles: true, cancelable: true };
    Object.assign(init, options || {});
    document.dispatchEvent(new KeyboardEvent("keydown", init));
  }
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  async function run() {
    localStorage.removeItem("lowerRoomDiscovered:v1");
    window.__setSecondRound(true, { releaseHeld: false });
    window.__lowerRoomDiscoveryClueTick(179999, true);
    check("the clue stays quiet until three attended phase-two minutes",
      window.__captionKey() !== "lower_rooms_clue" &&
      window.__lowerRoomDiscoveryClueState().shown === false,
      JSON.stringify(window.__lowerRoomDiscoveryClueState()));

    window.__lowerRoomDiscoveryClueTick(1, true);
    check("the late clue appears once in English",
      window.__captionKey() === "lower_rooms_clue" &&
      document.getElementById("hunt-caption").textContent ===
        "The loft may have kept a few rooms out of sight.",
      document.getElementById("hunt-caption").textContent);
    setLang("cs");
    check("the live clue follows the language switch",
      document.getElementById("hunt-caption").textContent ===
        "Loft možná pár pokojů schoval před očima.",
      document.getElementById("hunt-caption").textContent);

    setLang("en");
    window.__clearFlashCaption("lower-room-discovery");
    window.setCaption("kitchen", true);
    window.__lowerRoomDiscoveryClueTick(600000, true);
    check("the clue does not repeat in the same page session",
      window.__captionKey() === "kitchen" &&
      window.__lowerRoomDiscoveryClueState().shown === true,
      JSON.stringify(window.__lowerRoomDiscoveryClueState()));

    window.goToStage("kitchen");
    key("ArrowDown");
    check("the first Down press only arms the undiscovered lower floor",
      !window.__bathroomRoomState().open &&
      window.__lowerRoomDiscoveryClueState().discovered === false &&
      localStorage.getItem("lowerRoomDiscovered:v1") === null,
      JSON.stringify(window.__bathroomRoomState()));
    key("ArrowDown");
    check("the second Down press enters and permanently unlocks the lower floor",
      window.__bathroomRoomState().open &&
      window.__lowerRoomDiscoveryClueState().discovered === true &&
      localStorage.getItem("lowerRoomDiscovered:v1") === "1",
      JSON.stringify(window.__bathroomRoomState()));

    key("ArrowDown", { repeat: true });
    check("held-key repeats leave the entered lower room stable",
      window.__lowerRoomDiscoveryClueState().discovered === true &&
      window.__bathroomRoomState().open === true &&
      localStorage.getItem("lowerRoomDiscovered:v1") === "1",
      JSON.stringify(window.__lowerRoomDiscoveryClueState()));

    key("ArrowUp");
    await sleep(760);
    window.goToStage("garden");
    key("ArrowDown");
    check("one Down press enters every lower room after discovery",
      window.__princeState().basement === true &&
      localStorage.getItem("lowerRoomDiscovered:v1") === "1",
      JSON.stringify(window.__princeState()));

    window.__activateExtinguisher({ resetDateTime: false });
    await sleep(1000);
    check("Start over clears the persisted lower-floor unlock",
      window.__lowerRoomDiscoveryClueState().discovered === false &&
      window.__lowerRoomDiscoveryClueState().shown === false &&
      localStorage.getItem("lowerRoomDiscovered:v1") === null,
      JSON.stringify(window.__lowerRoomDiscoveryClueState()));

    window.goToStage("kitchen");
    key("ArrowDown");
    check("Start over re-arms deliberate double-press discovery",
      !window.__bathroomRoomState().open &&
      window.__lowerRoomDiscoveryClueState().discovered === false &&
      localStorage.getItem("lowerRoomDiscovered:v1") === null,
      JSON.stringify(window.__bathroomRoomState()));
    key("ArrowDown");
    check("the second post-reset Down press enters and records discovery",
      window.__bathroomRoomState().open &&
      window.__lowerRoomDiscoveryClueState().discovered === true &&
      localStorage.getItem("lowerRoomDiscovered:v1") === "1",
      JSON.stringify(window.__bathroomRoomState()));
  }
  window.addEventListener("load", function () {
    setTimeout(async function () {
      try { await run(); } catch (error) { out.errors.push(String(error && error.stack || error)); }
      report();
    }, 300);
  });
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 7000, { patchRaf: true, seedRandom: true });
if (!result) { console.error("lower-room discovery clue: no report"); process.exit(1); }
var failed = false;
result.checks.forEach(function (item) {
  console.log("  " + (item.pass ? "✓" : "✗") + " " + item.name +
    (item.pass || !item.detail ? "" : " — " + item.detail));
  if (!item.pass) failed = true;
});
if (result.errors.length) {
  failed = true;
  console.error("runtime errors:\n  " + result.errors.join("\n  "));
}

var source = fs.readFileSync("rsvp.html", "utf8");
[
  "openBathroom", "openCinema", "openEntrance", "openBedroom", "openPrinceBasement"
].forEach(function (name) {
  var match = source.match(new RegExp("function " + name + "\\(\\) \\{([\\s\\S]*?)\\n  \\}"));
  var pass = !!(match && /__markLowerRoomDiscovered/.test(match[1]));
  console.log("  " + (pass ? "✓" : "✗") + " " + name + " records successful lower-room entry");
  if (!pass) failed = true;
});

if (failed) process.exit(1);
console.log("lower-room discovery clue: all checks passed");
