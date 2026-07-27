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
  "    report.steps.first.crownVisible = vis('.bd-crown-marketa');",
  "    report.steps.first.plainHat = (document.querySelector('.bd-hat-marketa') ? vis('.bd-hat-marketa') : 'none');",
  "    // console jump to Ali (holiday decor) with the party ON — a garden stop: garden floor",
  "    if (window.__setGardenParty) window.__setGardenParty(true, true); await sleep(150);",
  "    var ret = window.birthday('ali'); await sleep(200);",
  "    report.steps.ali = { ret: ret, bdAli: hasCls('bd-ali'), holiday: hasCls('season-holiday'), party: !!window.__gardenPartyOn, room: window.currentStageName, hatVisible: vis('.bd-hat-ali') };",
  "    // REGRESSION (the Madla floating-crown bug): the floor is already POPULATED but still filling",
  "    // (guests-in + trickle), and this birthday person hasn't arrived on it yet. __bdCakeCut only",
  "    // force-summons when __guestsIn() is FALSE, so here the summon is SKIPPED — startBdCakeCutting",
  "    // MUST force-arrive the cutter, or its crown (a visibility:visible child) floats over the",
  "    // visibility:hidden body. Set that exact state deterministically: end Ali's still-running cake",
  "    // first (else Madla's cut is idempotently skipped), mark the floor populated+trickling, and take",
  "    // Madla specifically OFF the floor.",
  "    if (window.__setGardenParty) window.__setGardenParty(true, true); await sleep(150);",
  "    if (window.__endBdCakeCutting) window.__endBdCakeCutting();", // clear the cake the prior step (or party-on) auto-lit, so Madla's cut isn't idempotently skipped
  "    var gg=document.getElementById('garden-guests'); if(gg) gg.classList.add('guests-in','trickle');",
  "    var gmPre=document.querySelector('.g-madla'); if(gmPre) gmPre.classList.remove('arrived','bd-cutter','leaving');",
  "    // birthday('madla') runs the FULL reveal: applySeasonDate lights her bd-madla crown, then",
  "    // bdReveal -> __bdCakeCut. The cake was cleared just above so startBdCakeCutting actually runs.",
  "    report.steps.madlaPre = { guestsIn: !!(window.__guestsIn && window.__guestsIn()), madlaHidden: gmPre?getComputedStyle(gmPre).visibility:'(absent)', bdCakeOnBefore: !!window.__bdCakeOn };",
  "    window.birthday('madla'); await sleep(800);",
  "    var gm=document.querySelector('.g-madla');",
  "    report.steps.madla = { party: !!window.__gardenPartyOn, room: window.currentStageName, cutter: !!(gm&&gm.classList.contains('bd-cutter')), arrived: !!(gm&&gm.classList.contains('arrived')), figVis: gm?getComputedStyle(gm).visibility:'(absent)', crownVis: vis('.bd-crown-madla') };",
  "    // and she must HOLD at the cake: a floor-wide rebalance (any later arrival triggers one) must not",
  "    // glide the cutter off to a slot — rebalanceFloor skips .bd-cutter, so her --balance-x is unchanged.",
  "    var bxBefore = gm ? gm.style.getPropertyValue('--balance-x') : '';",
  "    if (window.__summonGuests) window.__summonGuests(); await sleep(350);",
  "    report.steps.madlaHold = { bxWas: bxBefore, bxNow: gm?gm.style.getPropertyValue('--balance-x'):'', balanceSame: !!(gm && bxBefore && gm.style.getPropertyValue('--balance-x')===bxBefore), leaving: !!(gm&&gm.classList.contains('leaving')), stillCutter: !!(gm&&gm.classList.contains('bd-cutter')), stillVis: gm?getComputedStyle(gm).visibility:'(absent)' };",
  "    var trimFloor=window.__trimFloorToCap, trimCalls=0; window.__trimFloorToCap=function(){trimCalls++;return trimFloor?trimFloor():0;};",
  "    window.__endBdCakeCutting(); window.__trimFloorToCap=trimFloor;",
  "    report.steps.madlaTrim = { calls: trimCalls };",
  "    // Goli is a GARDEN-figure adult who ALSO has a nook figure (the Ali+Goli duo). Per",
  "    // the owner's routing rule, with the party OFF her birthday brings her to the CUDDLY nook (NOT a",
  "    // party): the same instant the hat turns on, her nook figure is shown under it (the hard rule —",
  "    // no adornment floating over an empty spot). The party-ON garden+cake path is covered by Ali above.",
  "    if (window.__setGardenParty) window.__setGardenParty(false, true); await sleep(300);",
  "    window.birthday('goli'); await sleep(700);",
  "    var pFig=document.getElementById('cuddly-vis-goli');",
  "    report.steps.goli = { bd: hasCls('bd-goli'), room: window.currentStageName, party: !!window.__gardenPartyOn, cakeOn: !!window.__bdCakeOn, figShown: !!(pFig && pFig.classList.contains('showing')), hatVisible: vis('#cuddly-vis-goli .bd-hat-goli') };",
  "    // Elisabeth — a Czech-family CROWN kid. With the party off, her birthday routes to the",
  "    // Lübeck laptop call, so verify the visible in-call crown rather than the hidden garden clone.",
  "    window.birthday('elisabeth'); await sleep(200);",
  "    report.steps.elisabeth = { bd: hasCls('bd-elisabeth'), room: window.currentStageName, bodyBd: document.body.classList.contains('bd-elisabeth'), crownVisible: vis('#laptop-lueb-scene .bd-crown-elisabeth'), plainHat: (document.querySelector('.bd-hat-elisabeth')?'exists':'none') };",
  "    // NON-PARTY REMOTE-FAMILY calls: Madla's Lübeck family (crowns) rides the LAPTOP video call, and",
  "    // Behdad's California brother's family (hats) rides the MONITOR call — NOT the cuddly. The",
  "    // adornment lights on their figure INSIDE the call scene (body.bd-<who>). Party is off here (Goli).",
  "    window.birthday('madla'); await sleep(450);",
  "    report.steps.madlaCall = { bd: hasCls('bd-madla'), room: window.currentStageName, bodyBd: document.body.classList.contains('bd-madla'), crownVis: vis('#laptop-lueb-scene .bd-crown-madla') };",
  "    window.birthday('patricia'); await sleep(450);",
  "    report.steps.patriciaCall = { bd: hasCls('bd-patricia'), room: window.currentStageName, bodyBd: document.body.classList.contains('bd-patricia'), hatVis: vis('#monitor-california-scene .bd-hat-patricia') };",
  "    // Ashraf — Tehran call-only; venue routes to the office + tehran call",
  "    window.birthday('ashraf'); await sleep(200);",
  "    report.steps.ashraf = { bd: hasCls('bd-ashraf'), room: window.currentStageName, hatVisible: vis('.bd-hat-ashraf') };",
  "    // Daniel — Prague call-only",
  "    window.birthday('daniel'); await sleep(200);",
  "    report.steps.daniel = { bd: hasCls('bd-daniel'), room: window.currentStageName };",
  "    // Navid — a cuddly-nook CAMEO kid: reveal must land in the cuddly-puddly with him showing",
  "    window.birthday('navid'); await sleep(250);",
  "    report.steps.navid = { bd: hasCls('bd-navid'), room: window.currentStageName, showing: !!(document.getElementById('cuddly-navid')||{classList:{contains:function(){return false;}}}).classList.contains('showing'), parkedRunnerHat: vis('#garden-kid-navid .bd-hat-navid') };",
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
  if (s.first && s.first.crownVisible === "visible" && s.first.plainHat === "none") pass("Markéta wears a CROWN (bd-crown, no bd-hat)"); else fail("Markéta crown visible / no hat", JSON.stringify(s.first && { crown: s.first.crownVisible, hat: s.first.plainHat }));
  // Historical dateless-guest birthday detail removed.
  if (s.ali && s.ali.party && s.ali.room === "garden" && s.ali.hatVisible === "visible") pass("party-ON garden stop pans to the garden floor, hat visible"); else fail("Ali garden reveal", JSON.stringify(s.ali));
  if (s.madlaPre && s.madlaPre.guestsIn && s.madlaPre.madlaHidden === "hidden") pass("bug precondition set: floor populated (guests-in) with Madla still hidden off-floor"); else fail("Madla precondition (guests-in + madla hidden)", JSON.stringify(s.madlaPre));
  if (s.madla && s.madla.party && s.madla.room === "garden" && s.madla.cutter && s.madla.arrived && s.madla.figVis === "visible" && s.madla.crownVis === "visible") pass("populated-floor birthday (Madla): startBdCakeCutting FORCE-arrives the figure — visible under its crown (no floating crown)"); else fail("Madla populated-floor regression (arrived+visible under crown)", JSON.stringify(s.madla));
  if (s.madlaHold && s.madlaHold.balanceSame && !s.madlaHold.leaving && s.madlaHold.stillCutter && s.madlaHold.stillVis === "visible") pass("Madla HOLDS at the cake through a rebalance — the cutter isn't glided off to a slot/corner"); else fail("Madla holds at cake through rebalance (no drift to corner)", JSON.stringify(s.madlaHold));
  if (s.madlaTrim && s.madlaTrim.calls === 1) pass("ending the birthday cake trims forced arrivals back to the floor cap"); else fail("birthday cake end trims floor", JSON.stringify(s.madlaTrim));
  if (s.goli && s.goli.bd && s.goli.room === "cuddly" && s.goli.party === false && !s.goli.cakeOn && s.goli.figShown && s.goli.hatVisible === "visible") pass("party-OFF garden-adult reveal (Goli) brings her to the NOOK — figure shown AND hat on it (no floating adornment)"); else fail("Goli nook reveal + hat-on-figure", JSON.stringify(s.goli));
  if (s.elisabeth && s.elisabeth.bd && s.elisabeth.room === "office" && s.elisabeth.bodyBd && s.elisabeth.crownVisible === "visible" && s.elisabeth.plainHat === "none") pass("non-party Elisabeth routes to the Lübeck call wearing her crown"); else fail("Elisabeth Lübeck-call crown", JSON.stringify(s.elisabeth));
  if (s.madlaCall && s.madlaCall.bd && s.madlaCall.room === "office" && s.madlaCall.bodyBd && s.madlaCall.crownVis === "visible") pass("non-party Madla (Lübeck) → LAPTOP call (office), her crown lit on the figure IN the call scene"); else fail("Madla lübeck-call crown", JSON.stringify(s.madlaCall));
  if (s.patriciaCall && s.patriciaCall.bd && s.patriciaCall.room === "office" && s.patriciaCall.bodyBd && s.patriciaCall.hatVis === "visible") pass("non-party Patricia (California) → MONITOR call (office), her hat lit on the figure IN the call scene"); else fail("Patricia california-call hat", JSON.stringify(s.patriciaCall));
  if (s.ashraf && s.ashraf.bd && s.ashraf.room === "office") pass("Ashraf (Tehran call) pans to the office + shows her hat class"); else fail("Ashraf tehran reveal", JSON.stringify(s.ashraf));
  if (s.hannah && s.hannah.bd && s.hannah.room === "office") pass("Hannah (Tehran family now) routes to the office, not the cuddly"); else fail("Hannah tehran reveal", JSON.stringify(s.hannah));
  if (s.daniel && s.daniel.bd && s.daniel.room === "office") pass("Daniel (Prague call) pans to the office"); else fail("Daniel prague reveal", JSON.stringify(s.daniel));
  if (s.navid && s.navid.bd && s.navid.room === "cuddly" && s.navid.showing && s.navid.parkedRunnerHat === "hidden") pass("Navid reveals in the cuddly-puddly without leaving his parked chase hat in the garden"); else fail("Navid cuddly reveal / parked runner hat hidden", JSON.stringify(s.navid));
  if (s.seasonClears && s.seasonClears.anyBd === false) pass("season() clears the birthday axis (no stray bd-* class)"); else fail("season clears bd axis", JSON.stringify(s.seasonClears));
  if (typeof s.list === "string" && /marketa/.test(s.list)) pass("birthday('list') prints the ring"); else fail("birthday list", JSON.stringify(s.list));
  if (r.errors.length === 0) pass("no uncaught JS errors across the run"); else fail("no uncaught JS errors", r.errors.slice(0,12).join("\n"));
}

var reducedHarness = [
  "<pre id=\"__report\" style=\"position:fixed;left:-9999px\">pending</pre>",
  "<script>",
  "window.addEventListener('load',function(){setTimeout(function(){",
  "  birthday('navid');",
  "  var g=document.getElementById('stage-garden'),r=document.getElementById('garden-kid-navid');",
  "  if(g)g.style.setProperty('visibility','visible','important');",
  "  if(r)r.classList.add('chasing');",
  "  var h=r&&r.querySelector('.bd-hat-navid');",
  "  document.getElementById('__report').textContent=JSON.stringify({hat:h?getComputedStyle(h).visibility:'(absent)',opacity:h?getComputedStyle(h).opacity:'',errors:window.__errs});",
  "},500);});",
  "</script>"
].join("\n");
var reduced = lib.runPageSync("rsvp.html", reducedHarness, 4000, {
  patchRaf: true,
  chromeFlags: "--force-prefers-reduced-motion=reduce"
});
if (reduced && reduced.hat === "hidden") pass("reduced-motion suppression cannot leave an active runner's birthday hat floating"); else fail("reduced-motion runner hat suppression", JSON.stringify(reduced));
if (reduced && reduced.errors && reduced.errors.length === 0) pass("no uncaught JS errors in reduced-motion runner probe"); else fail("reduced-motion probe errors", JSON.stringify(reduced && reduced.errors));

var source = require("fs").readFileSync(require("path").join(__dirname, "..", "rsvp.html"), "utf8");
if (source.indexOf('#stage-garden > [id^="garden-kid-"]:not(.chasing) .bd-adorn') >= 0 &&
    source.indexOf('#loft-game-strip [id^="garden-kid-"]:not(.chasing) .bd-adorn') < 0) {
  pass("parked-runner gate targets outer runners without catching their *-body descendants");
} else {
  fail("parked-runner selector scope");
}

console.log("");
if (failures > 0) { console.log(failures + " check(s) failed."); process.exit(1); }
else { console.log("All checks passed."); }
