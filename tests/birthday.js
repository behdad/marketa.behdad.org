#!/usr/bin/env node
// Birthday-axis smoke test (the 'b' key + birthday() console command).
// Loads rsvp.html headless and drives ONLY the birthday controls: asserts the ring
// leads with Markéta, that each stop time-travels the loft to that person's date +
// season + hat/crown class + reveal venue, that a season() clears the birthday axis,
// and that no uncaught JS error fires. Same one-shot runner as play.js/state.js.
//
// Usage: node tests/birthday.js
"use strict";

var lib = require("./lib");

var HARNESS = [
  "<pre id=\"__report\" style=\"position:fixed;left:-9999px\">pending</pre>",
  "<script>",
  "(function () {",
  "  function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}",
  "  function strip(){return document.getElementById('loft-game-strip');}",
  "  function hasCls(c){return strip().classList.contains(c);}",
  "  function pressB(shift){document.dispatchEvent(new KeyboardEvent('keydown',{key: shift?'B':'b', shiftKey:!!shift, bubbles:true, cancelable:true}));}",
  "  function toastText(){var t=document.querySelector('.season-toast');return t?t.textContent:'';}",
  "  function vis(sel){var el=document.querySelector(sel);return el?getComputedStyle(el).visibility:'(absent)';}",
  "  var report={errors:[],steps:{}};",
  "  window.addEventListener('load', function(){ setTimeout(function(){ run().catch(function(e){window.__errs.push('harness: '+String(e&&e.stack||e));}).then(function(){ report.errors=window.__errs; document.getElementById('__report').textContent=JSON.stringify(report); }); }, 400); });",
  "  async function run(){",
  "    report.steps.hasHooks = (typeof window.birthday==='function') && (typeof window.__stepBirthday==='function');",
  "    // first 'b' → the ring leader, Markéta (Jan 20)",
  "    pressB(false); await sleep(150);",
  "    report.steps.first = { bdMarketa: hasCls('bd-marketa'), toast: toastText(), sd: window.__seasonDate && window.__seasonDate() };",
  "    report.steps.first.crownVisible = vis('.bd-hat-marketa');",
  "    // console jump to Ali (holiday decor) with the party ON — a garden stop: garden floor",
  "    if (window.__setGardenParty) window.__setGardenParty(true, true); await sleep(150);",
  "    var ret = window.birthday('ali'); await sleep(200);",
  "    report.steps.ali = { ret: ret, bdAli: hasCls('bd-ali'), holiday: hasCls('season-holiday'), party: !!window.__gardenPartyOn, room: window.currentStageName, hatVisible: vis('.bd-hat-ali') };",
  // Historical dateless-guest birthday detail removed.
  "    // garden party + cuts a candled cake with her dancing between the hosts (the new garden-birthday behavior).",
  "    if (window.__setGardenParty) window.__setGardenParty(false, true); await sleep(300);",
  "    window.birthday('goli'); await sleep(1400);",
  "    report.steps.goli = { bd: hasCls('bd-goli'), room: window.currentStageName, party: !!window.__gardenPartyOn, cakeOn: !!window.__bdCakeOn, cutter: !!(document.querySelector('#garden-guests .g-goli')||{classList:{contains:function(){return false;}}}).classList.contains('bd-cutter') };",
  "    // Elisabeth — a Czech-family CROWN kid",
  "    window.birthday('elisabeth'); await sleep(200);",
  "    report.steps.elisabeth = { bd: hasCls('bd-elisabeth'), crownVisible: vis('.bd-crown-elisabeth'), plainHat: (document.querySelector('.bd-hat-elisabeth')?'exists':'none') };",
  "    // Ashraf — Tehran call-only; venue routes to the office + tehran call",
  "    window.birthday('ashraf'); await sleep(200);",
  "    report.steps.ashraf = { bd: hasCls('bd-ashraf'), room: window.currentStageName, hatVisible: vis('.bd-hat-ashraf') };",
  "    // Daniel — Prague call-only",
  "    window.birthday('daniel'); await sleep(200);",
  "    report.steps.daniel = { bd: hasCls('bd-daniel'), room: window.currentStageName };",
  "    // Navid — a cuddly-nook CAMEO kid: reveal must land in the cuddly-puddly with him showing",
  "    window.birthday('navid'); await sleep(250);",
  "    report.steps.navid = { bd: hasCls('bd-navid'), room: window.currentStageName, showing: !!(document.getElementById('cuddly-navid')||{classList:{contains:function(){return false;}}}).classList.contains('showing') };",
  "    // Hannah — Baharak & Payman's daughter: Tehran call-only now (NOT the cuddly), routes to the office",
  "    window.birthday('hannah'); await sleep(250);",
  "    report.steps.hannah = { bd: hasCls('bd-hannah'), room: window.currentStageName };",
  "    // a season() must CLEAR the birthday axis (mutually exclusive pretend-dates)",
  "    window.season('summer'); await sleep(150);",
  "    report.steps.seasonClears = { anyBd: /\\bbd-[a-z]+\\b/.test(strip().className), summer: hasCls('season-pride')||true, sd: window.__seasonDate() };",
  "    // list + advance-with-no-arg",
  "    report.steps.list = window.birthday('list');",
  "  }",
  "})();",
  "</script>"
].join("\n");

var failures = 0;
function pass(m){console.log("  ✓ "+m);}
function fail(m,d){failures++;console.log("  ✗ "+m); if(d) console.log("      "+String(d).split("\n").join("\n      "));}

console.log("rsvp.html birthday axis:");
var r = lib.runPageSync("rsvp.html", HARNESS, 30000, { patchRaf: true });
if (!r) { fail("harness reported (page error before load, or budget too small)"); }
else {
  var s = r.steps || {};
  if (s.hasHooks) pass("birthday() + __stepBirthday hooks are wired"); else fail("birthday hooks wired");
  if (s.first && s.first.bdMarketa) pass("first 'b' press leads with Markéta (bd-marketa set)"); else fail("first 'b' → Markéta", JSON.stringify(s.first));
  if (s.first && s.first.sd && s.first.sd.m === 0 && s.first.sd.d === 20) pass("Markéta's stop time-travels to Jan 20"); else fail("Markéta date = Jan 20", JSON.stringify(s.first && s.first.sd));
  if (s.first && /Mark/.test(s.first.toast)) pass("birthday toast names the person (" + (s.first && s.first.toast) + ")"); else fail("toast names the person", JSON.stringify(s.first && s.first.toast));
  if (s.first && s.first.crownVisible === "visible") pass("Markéta's crown becomes visible"); else fail("Markéta crown visible", JSON.stringify(s.first && s.first.crownVisible));
  // Historical dateless-guest birthday detail removed.
  if (s.ali && s.ali.party && s.ali.room === "garden" && s.ali.hatVisible === "visible") pass("party-ON garden stop pans to the garden floor, hat visible"); else fail("Ali garden reveal", JSON.stringify(s.ali));
  if (s.goli && s.goli.bd && s.goli.room === "garden" && s.goli.party === true && s.goli.cakeOn && s.goli.cutter) pass("party-OFF garden-adult reveal (Goli) THROWS the party + cake, dancing between the hosts"); else fail("Goli garden birthday party+cake", JSON.stringify(s.goli));
  if (s.elisabeth && s.elisabeth.bd && s.elisabeth.crownVisible === "visible" && s.elisabeth.plainHat === "none") pass("Elisabeth wears a CROWN (bd-crown, no bd-hat)"); else fail("Elisabeth crown", JSON.stringify(s.elisabeth));
  if (s.ashraf && s.ashraf.bd && s.ashraf.room === "office") pass("Ashraf (Tehran call) pans to the office + shows her hat class"); else fail("Ashraf tehran reveal", JSON.stringify(s.ashraf));
  if (s.hannah && s.hannah.bd && s.hannah.room === "office") pass("Hannah (Tehran family now) routes to the office, not the cuddly"); else fail("Hannah tehran reveal", JSON.stringify(s.hannah));
  if (s.daniel && s.daniel.bd && s.daniel.room === "office") pass("Daniel (Prague call) pans to the office"); else fail("Daniel prague reveal", JSON.stringify(s.daniel));
  if (s.navid && s.navid.bd && s.navid.room === "cuddly" && s.navid.showing) pass("Navid (cameo kid) reveals in the cuddly-puddly, showing"); else fail("Navid cuddly reveal", JSON.stringify(s.navid));
  if (s.seasonClears && s.seasonClears.anyBd === false) pass("season() clears the birthday axis (no stray bd-* class)"); else fail("season clears bd axis", JSON.stringify(s.seasonClears));
  if (typeof s.list === "string" && /marketa/.test(s.list)) pass("birthday('list') prints the ring"); else fail("birthday list", JSON.stringify(s.list));
  if (r.errors.length === 0) pass("no uncaught JS errors across the run"); else fail("no uncaught JS errors", r.errors.slice(0,12).join("\n"));
}

console.log("");
if (failures > 0) { console.log(failures + " check(s) failed."); process.exit(1); }
else { console.log("All checks passed."); }
