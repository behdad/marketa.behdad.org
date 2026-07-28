#!/usr/bin/env node
"use strict";

// Party attendance is class-only state and deliberately keeps moving while another window has
// focus. Exercise both scheduler phases: the initial trickle and a settled revolving-door swap.
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function report() {
    out.errors = (window.__errs || []).slice();
    var pre = document.createElement("pre");
    pre.id = "__report";
    pre.textContent = JSON.stringify(out);
    document.body.appendChild(pre);
  }
  function arrivedCount() {
    var group = document.getElementById("garden-guests");
    if (!group) return 0;
    return Array.prototype.filter.call(group.querySelectorAll(".guest.arrived:not(.leaving)"), function (guest) {
      return !guest.classList.contains("g-behdad") && !guest.classList.contains("g-marketa") &&
        !guest.classList.contains("off-with-kids") && !guest.classList.contains("off-at-games") &&
        !guest.classList.contains("off-asleep") && !guest.classList.contains("off-at-bbq");
    }).length;
  }
  var units = [
    ["chinnell", ".g-chinnell"], ["alireza", ".g-alireza"], ["ali", ".g-ali"],
    ["spencer", ".g-spencer"], ["farhang", ".g-farhang"], ["patricia", ".g-patricia"],
    ["madla", ".g-madla"], ["hamid", ".g-hamid"], ["baharak", ".g-baharak"],
    ["bahareh", ".g-bahareh"], ["musicians", ".g-danbern"]
  ];
  function presentUnits() {
    var group = document.getElementById("garden-guests");
    return units.filter(function (unit) {
      var guest = group && group.querySelector(unit[1]);
      return guest && guest.classList.contains("arrived") && !guest.classList.contains("leaving");
    }).map(function (unit) { return unit[0]; });
  }
  function ordinaryGuestInCenter() {
    var group = document.getElementById("garden-guests");
    return Array.prototype.map.call(group.querySelectorAll(".guest.arrived:not(.leaving)"), function (guest) {
      if (/g-(behdad|marketa|robin|navid)\b/.test(guest.getAttribute("class") || "") || guest.classList.contains("bd-cutter")) return null;
      var m = /translate\(\s*([-\d.]+)/.exec(guest.getAttribute("transform") || "");
      var x = (m ? parseFloat(m[1]) : 0) + (parseFloat(guest.style.getPropertyValue("--balance-x")) || 0);
      return x > 255 && x < 405 ? { className: guest.getAttribute("class"), x: x } : null;
    }).filter(Boolean);
  }

  var focused = false;
  document.hasFocus = function () { return focused; };
  window.addEventListener("load", function () {
    setTimeout(function () {
      (async function () {
        window.party(true);
        await sleep(3000);
        var first = arrivedCount();
        await sleep(7000);
        var growing = arrivedCount();
        check("the initial party trickle continues while the page is unfocused",
          first > 0 && growing > first, JSON.stringify({ first: first, growing: growing }));

        await sleep(12000);
        var beforeCount = arrivedCount(), before = presentUnits();
        check("the unattended initial fill reaches the four-family floor capacity",
          before.length === 4, JSON.stringify({ count: beforeCount, units: before }));
        var centerGuests = ordinaryGuestInCenter();
        check("ordinary guests leave the couple's center lane clear",
          centerGuests.length === 0, JSON.stringify(centerGuests));

        await sleep(10000);
        var after = presentUnits();
        var arrived = after.filter(function (unit) { return before.indexOf(unit) === -1; });
        var departed = before.filter(function (unit) { return after.indexOf(unit) === -1; });
        check("the revolving door completes an arrival while the page is unfocused",
          arrived.length > 0, JSON.stringify({ before: before, after: after, arrived: arrived }));
        check("the revolving door completes a departure while the page is unfocused",
          departed.length > 0, JSON.stringify({ before: before, after: after, departed: departed }));
        check("the revolving door never drifts above the four-family floor capacity",
          after.length <= 4, JSON.stringify({ count: arrivedCount(), units: after }));

        focused = true;
        window.__duoArrive("ali");
        await sleep(100);
        window.__duoDepart("ali");
        var leavingAtBlur = document.querySelectorAll("#garden-guests .guest.leaving").length;
        focused = false;
        window.__settleGuestLeavers();
        await sleep(20);
        check("blur settles any departure that began while the window was focused",
          leavingAtBlur > 0 && document.querySelectorAll("#garden-guests .guest.leaving").length === 0,
          JSON.stringify({ leavingAtBlur: leavingAtBlur, afterBlur: document.querySelectorAll("#garden-guests .guest.leaving").length }));
        report();
      })().catch(function (error) {
        out.errors.push("harness: " + (error && error.stack || error));
        report();
      });
    }, 300);
  });
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 35000, {
  forceMotion: true,
  patchRaf: true,
  seedRandom: true
});

if (!result) { console.error("party arrivals: no report"); process.exit(1); }
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
if (failed) process.exit(1);
console.log("party arrivals: all " + result.checks.length + " checks passed");
