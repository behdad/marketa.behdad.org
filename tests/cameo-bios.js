#!/usr/bin/env node
"use strict";

// Bar and office couples reuse the same artwork, but each visible person owns an individual bio.
// Clicking one member must never collapse back to the enclosing couple-level label.
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function cardName() {
    var card = document.querySelector(".egg-bubble.who-pop");
    var name = card && card.firstElementChild;
    return name ? name.textContent.trim() : "";
  }
  function click(el) { if (el) el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })); }
  try {
    window.__setGardenParty(true, false);

    window.couples("alireza");
    var bar = document.querySelector("#kitchen-bar-couples .bc-alirezamahzad");
    click(bar && bar.querySelector(".bc-p1"));
    check("clicking the first bar figure opens Alireza's bio", cardName() === "Alireza", cardName());
    check("a direct bar bio points at the individual", !!document.querySelector(".bc-p1 .guest-spot-arrow"));
    click(bar && bar.querySelector(".bc-p2"));
    check("clicking the second bar figure opens Mahzad's bio", cardName() === "Mahzad", cardName());

    window.goToStage("office");
    window.officefolks("spencer");
    var office = document.querySelector("#office-hangout .of-spencerjay");
    click(office && office.querySelector(".of-p1"));
    check("clicking the first office figure opens Spencer's bio", cardName() === "Spencer", cardName());
    check("a direct office bio points at the individual", !!document.querySelector(".of-p1 .guest-spot-arrow"));
    click(office && office.querySelector(".of-p2"));
    check("clicking the second office figure opens Jay's bio", cardName() === "Jay", cardName());

    var armL = bar && bar.querySelector(".bc-arm-l");
    var armR = bar && bar.querySelector(".bc-arm-r");
    var leftOrigin = armL ? getComputedStyle(armL).transformOrigin : "";
    var rightOrigin = armR ? getComputedStyle(armR).transformOrigin : "";
    check("bar arms pivot from their shoulder-side top corners",
      /0px$/.test(leftOrigin) && /0px$/.test(rightOrigin),
      leftOrigin + "/" + rightOrigin);

    var baharehFlip = document.querySelector("#garden-kid-bahareh .gk-flip");
    var baharehStyle = baharehFlip && getComputedStyle(baharehFlip);
    check("Bahareh's left-facing mirror uses a fixed SVG-space pivot",
      baharehStyle && baharehStyle.transformBox === "view-box" &&
        /^0px 0px/.test(baharehStyle.transformOrigin),
      baharehStyle ? baharehStyle.transformBox + "/" + baharehStyle.transformOrigin : "missing");
  } catch (error) {
    out.errors.push(String(error && error.stack || error));
  }
  out.errors = out.errors.concat((window.__errs || []).slice());
  var pre = document.createElement("pre");
  pre.id = "__report";
  pre.textContent = JSON.stringify(out);
  document.body.appendChild(pre);
})();
</script>`;

var report = lib.runPageSync("rsvp.html", harness, 4000, {
  forceMotion: true,
  seedRandom: true
});

if (!report) { console.error("cameo bios: no report"); process.exit(1); }
var failed = false;
report.checks.forEach(function (c) {
  console.log("  " + (c.pass ? "✓" : "✗") + " " + c.name + (c.pass || !c.detail ? "" : " — " + c.detail));
  if (!c.pass) failed = true;
});
if (report.errors.length) { failed = true; console.error("runtime errors:\n  " + report.errors.join("\n  ")); }
if (failed) process.exit(1);
console.log("cameo bios: all " + report.checks.length + " checks passed");
