#!/usr/bin/env node
"use strict";

// The sunset observation starts an authored late-night choice: Athena hands the
// disco ball to the last person awake, or the magic box keeps things going.
var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var html = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
if (!/sunset:[^\n]+next:\s*"sunset_bed"/.test(html) ||
    !/sunset_bed:[^\n]+next:\s*"sunset_irene_code"/.test(html) ||
    !/sunset_irene_code:[^\n]+next:\s*"sunset_bahareh_awake"/.test(html) ||
    !/sunset_bahareh_awake:[^\n]+next:\s*"sunset_hannah_tattoo"/.test(html) ||
    !/sunset_hannah_tattoo:[^\n]+next:\s*"sunset_baharak_awake"/.test(html) ||
    !/sunset_baharak_awake:[^\n]+next:\s*"sunset_magicbox"/.test(html)) {
  console.error("sunset-fork: sunset follow-up chain is missing");
  process.exit(1);
}

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function report() {
    out.errors = (window.__errs || []).slice();
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
  }
  try {
    window.__secondRound = true;
    window.__setPartyMode(true, true);
    window.__goToStage("office");
    window.__deliverPhoneMessage("sunset_bed");
    window.__deliverPhoneMessage("sunset_irene_code");
    window.__deliverPhoneMessage("sunset_bahareh_awake");
    window.__deliverPhoneMessage("sunset_hannah_tattoo");
    window.__deliverPhoneMessage("sunset_baharak_awake");
    window.__deliverPhoneMessage("sunset_magicbox");
    var thread = window.__chatMessagesKnowledge();
    check("sunset fork adds all six late-night replies",
      thread.some(function (m) { return m.sender === "Athena" && /I'm going to sleep/.test(m.text) && /dim the disco ball/.test(m.text); }) &&
      thread.some(function (m) { return /turtle art in Python/.test(m.text); }) &&
      thread.some(function (m) { return m.sender === "Bahareh" && /why are you still awake/.test(m.text); }) &&
      thread.some(function (m) { return /draw your next tattoo/.test(m.text); }) &&
      thread.some(function (m) { return m.sender === "Baharak" && /why are you still awake/.test(m.text); }) &&
      thread.some(function (m) { return /magic box and keep going/.test(m.text); }),
      JSON.stringify(thread));

    var pc = document.getElementById("office-pc-desk-trio");
    var monitor = document.getElementById("office-monitor");
    pc.classList.add("on");
    monitor.classList.add("here", "screen-on", "show-caps");
    window.__goToStage("garden");
    window.__runMsgAction("sunset_irene_code");
    setTimeout(function () {
      check("Irene's turtle-art reply opens the office Code app",
        window.__currentStageName === "office" && monitor.classList.contains("show-code"),
        window.__currentStageName + " / " + monitor.getAttribute("class"));
      window.__goToStage("balcony");
      window.__runMsgAction("sunset_hannah_tattoo");
    }, 100);
    setTimeout(function () {
      check("Hannah's tattoo reply opens the office Tattoo app",
        window.__currentStageName === "office" && monitor.classList.contains("show-tattoo"),
        window.__currentStageName + " / " + monitor.getAttribute("class"));
      window.__runMsgAction("sunset_bed");
    }, 220);
    setTimeout(function () {
      check("Athena's bedtime reply leaves the last guest in charge",
        window.__currentStageName === "garden" && window.__gardenPartyOn,
        window.__currentStageName + " / party=" + window.__gardenPartyOn);
      check("Athena's bedtime reply points out the optional disco control",
        document.getElementById("garden-disco-ball").classList.contains("invite-pulse"),
        document.getElementById("garden-disco-ball").getAttribute("class"));
      window.__goToStage("office");
      window.__runMsgAction("sunset_magicbox");
    }, 1050);
    setTimeout(function () {
      check("magic-box reply pans back to the party room",
        window.__currentStageName === "garden", window.__currentStageName);
      check("magic-box reply opens the box",
        document.getElementById("garden-boxlock").classList.contains("showing"),
        "locked=" + window.__drugsboxLocked() + " class=" + document.getElementById("garden-boxlock").getAttribute("class"));
      report();
    }, 2050);
  } catch (error) {
    out.errors.push("setup: " + (error && error.stack || error));
    report();
  }
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 3200, {
  forceMotion: true,
  seedRandom: true
});

if (!result) { console.error("sunset-fork: no report"); process.exit(1); }
var failed = false;
result.checks.forEach(function (check) {
  console.log("  " + (check.pass ? "✓" : "✗") + " " + check.name +
    (check.pass || !check.detail ? "" : " — " + check.detail));
  if (!check.pass) failed = true;
});
if (result.errors.length) {
  failed = true;
  console.error("runtime errors:\n  " + result.errors.join("\n  "));
}
if (failed) process.exit(1);
console.log("sunset-fork: all " + result.checks.length + " checks passed");
