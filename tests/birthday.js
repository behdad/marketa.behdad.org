#!/usr/bin/env node
// Birthday-axis smoke test (the 'b' key + typed Loft calendar API).
// Loads rsvp.html headless and drives ONLY the birthday controls: asserts the ring
// leads with Markéta, that each stop time-travels the loft to that person's date +
// season + hat/crown class + reveal venue, that a season change clears the birthday axis,
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
  "  function toastText(){var ts=document.querySelectorAll('.season-toast');return ts.length?ts[ts.length-1].textContent:'';}",
  "  function vis(sel){var el=document.querySelector(sel);return el?getComputedStyle(el).visibility:'(absent)';}",
  "  function birthdayDay(iso,who,prop){window.__loftControllers.date(iso);var occ=window.__shareOccasion&&window.__shareOccasion(),banner=document.getElementById('occasion-banner');return {strip:hasCls('bd-'+who),body:document.body.classList.contains('bd-'+who),prop:vis(prop),cake:vis('.thr-bd-only'),tehran:document.body.classList.contains('thr-bd'),exact:(window.__exactBirthdayWhos&&window.__exactBirthdayWhos())||[],share:occ&&{kind:occ.kind,id:occ.id},banner:banner&&banner.textContent};}",
  "  function floorCount(){return document.querySelectorAll('#garden-guests .guest.arrived:not(.leaving):not(.off-with-kids):not(.off-at-games):not(.off-asleep):not(.off-at-bbq)').length;}",
  "  var report={errors:[],steps:{}};",
  "  window.addEventListener('load', function(){ setTimeout(function(){ run().catch(function(e){window.__errs.push('harness: '+String(e&&e.stack||e));}).then(function(){ report.errors=window.__errs; document.getElementById('__report').textContent=JSON.stringify(report); }); }, 400); });",
  "  async function run(){",
  "    report.steps.hasHooks = (typeof window.__loftControllers.birthday==='function') && (typeof window.__stepBirthday==='function');",
  "    report.steps.hamidDays=[birthdayDay('2031-08-11','hamid','#garden-guests .g-hamid .bd-hat-hamid'),birthdayDay('2031-08-12','hamid','#garden-guests .g-hamid .bd-hat-hamid'),birthdayDay('2031-08-13','hamid','#garden-guests .g-hamid .bd-hat-hamid')];",
  "    report.steps.mohsenDays=[birthdayDay('2031-08-22','mohsen','#tehran-hon-mohsen'),birthdayDay('2031-08-23','mohsen','#tehran-hon-mohsen'),birthdayDay('2031-08-24','mohsen','#tehran-hon-mohsen')];",
  "    // first 'b' → the ring leader, Markéta (Jan 20)",
  "    pressB(false);",
  "    report.steps.first = { bdMarketa: hasCls('bd-marketa'), toast: toastText(), sd: window.__seasonDate && window.__seasonDate() };",
  "    await sleep(150);",
  "    report.steps.first.crownVisible = vis('.bd-crown-marketa');",
  "    report.steps.first.plainHat = (document.querySelector('.bd-hat-marketa') ? vis('.bd-hat-marketa') : 'none');",
  "    // Dateless people stay outside the birthday ring; their dormant art remains hidden.",
  "    var birthdayList = window.__loftControllers.birthday('list');",
  "    report.steps.dateless = { ali: window.__loftControllers.birthday('ali'), goli: window.__loftControllers.birthday('goli'), son: window.__loftControllers.birthday('patricia-son'), daughter: window.__loftControllers.birthday('patricia-daughter'), list: birthdayList, bdAli: hasCls('bd-ali'), bdGoli: hasCls('bd-goli'), bdSon: hasCls('bd-patricia-son'), bdDaughter: hasCls('bd-patricia-daughter'), aliHat: vis('.bd-hat-ali'), goliHat: vis('.bd-hat-goli'), sonHat: vis('.bd-hat-patricia-son'), daughterHat: vis('.bd-hat-patricia-daughter') };",
  "    if (window.__setGardenParty) window.__setGardenParty(true, true); await sleep(150);",
  "    // REGRESSION (the Madla floating-crown bug): start from an exact small floor where Madla has",
  "    // not arrived. Her birthday must force her visible under the crown, temporarily summon the",
  "    // wider crowd, then release only those temporary arrivals back to this seeded floor.",
  "    if (window.__setGardenParty) window.__setGardenParty(true, true); await sleep(150);",
  "    if (window.__endBdCakeCutting) window.__endBdCakeCutting();", // clear the cake the prior step (or party-on) auto-lit, so Madla's cut isn't idempotently skipped
  "    if (window.__dismissGuests) window.__dismissGuests();",
  "    var gg=document.getElementById('garden-guests'); if(gg) gg.classList.add('guests-in','trickle');",
  "    ['.g-chinnell','.g-rafi','.g-ayushi'].forEach(function(sel){var el=gg&&gg.querySelector(sel);if(el)el.classList.add('arrived');});",
  "    var gmPre=document.querySelector('.g-madla'); if(gmPre) gmPre.classList.remove('arrived','bd-cutter','leaving');",
  "    // The private birthday owner runs the full reveal and cake lifecycle against that seeded floor.",
  "    report.steps.madlaPre = { guestsIn: !!(window.__guestsIn && window.__guestsIn()), madlaHidden: gmPre?getComputedStyle(gmPre).visibility:'(absent)', bdCakeOnBefore: !!window.__bdCakeOn };",
  "    window.__loftControllers.birthday('madla'); await sleep(800);",
  "    var gm=document.querySelector('.g-madla');",
  "    report.steps.madla = { party: !!window.__gardenPartyOn, room: window.__currentStageName, cutter: !!(gm&&gm.classList.contains('bd-cutter')), arrived: !!(gm&&gm.classList.contains('arrived')), figVis: gm?getComputedStyle(gm).visibility:'(absent)', crownVis: vis('.bd-crown-madla') };",
  "    // and she must HOLD at the cake: a floor-wide rebalance (any later arrival triggers one) must not",
  "    // glide the cutter off to a slot — rebalanceFloor skips .bd-cutter, so her --balance-x is unchanged.",
  "    var bxBefore = gm ? gm.style.getPropertyValue('--balance-x') : '';",
  "    if (window.__summonGuests) window.__summonGuests(); await sleep(350);",
  "    report.steps.madlaHold = { bxWas: bxBefore, bxNow: gm?gm.style.getPropertyValue('--balance-x'):'', balanceSame: !!(gm && bxBefore && gm.style.getPropertyValue('--balance-x')===bxBefore), leaving: !!(gm&&gm.classList.contains('leaving')), stillCutter: !!(gm&&gm.classList.contains('bd-cutter')), stillVis: gm?getComputedStyle(gm).visibility:'(absent)' };",
  "    var releaseCrowd=window.__releaseBdCakeCrowd, releaseCalls=0; window.__releaseBdCakeCrowd=function(){releaseCalls++;return releaseCrowd?releaseCrowd():0;};",
  "    var fullFloorBeforeTrim=floorCount();",
  "    window.__endBdCakeCutting(); window.__releaseBdCakeCrowd=releaseCrowd;",
  "    var firstLeaver=document.querySelector('#garden-guests .guest.leaving .guest-walk');",
  "    var trimStarted={ leaving:document.querySelectorAll('#garden-guests .guest.leaving').length, staying:document.querySelectorAll('#garden-guests .guest.arrived:not(.leaving)').length, animation:firstLeaver?getComputedStyle(firstLeaver).animationName:'' };",
  "    await sleep(3400);",
  "    report.steps.madlaTrim = { calls: releaseCalls, before: fullFloorBeforeTrim, started: trimStarted, after: floorCount(), leavingAfter:document.querySelectorAll('#garden-guests .guest.leaving').length };",
  "    // Any datable birthday person with a real dance-floor model goes to the party cake.",
  "    if (window.__setGardenParty) window.__setGardenParty(false, true); await sleep(300);",
  "    // Elisabeth has a dance-floor model, so her crown belongs at the cake.",
  "    window.__loftControllers.birthday('elisabeth'); await sleep(450);",
  "    var eFig=document.querySelector('#garden-guests .g-elisabeth');",
  "    report.steps.elisabeth = { bd: hasCls('bd-elisabeth'), room: window.__currentStageName, party: !!window.__gardenPartyOn, cakeOn: !!window.__bdCakeOn, cutter: !!(eFig&&eFig.classList.contains('bd-cutter')), crownVisible: vis('#garden-guests .g-elisabeth .bd-crown-elisabeth') };",
  "    if (window.__endBdCakeCutting) window.__endBdCakeCutting();",
  "    // Adults with floor models use the same structural rule, even if they also have a family call.",
  "    window.__loftControllers.birthday('madla'); await sleep(450);",
  "    report.steps.madlaCall = { bd: hasCls('bd-madla'), room: window.__currentStageName, cakeOn: !!window.__bdCakeOn, cutter: !!document.querySelector('#garden-guests .g-madla.bd-cutter'), crownVis: vis('#garden-guests .g-madla .bd-crown-madla') };",
  "    if (window.__endBdCakeCutting) window.__endBdCakeCutting();",
  "    window.__loftControllers.birthday('patricia'); await sleep(450);",
  "    report.steps.patriciaCall = { bd: hasCls('bd-patricia'), room: window.__currentStageName, cakeOn: !!window.__bdCakeOn, cutter: !!document.querySelector('#garden-guests .g-patricia.bd-cutter'), hatVis: vis('#garden-guests .g-patricia .bd-hat-patricia') };",
  "    if (window.__endBdCakeCutting) window.__endBdCakeCutting();",
  "    // Ashraf — Tehran call-only; venue routes to the office + tehran call",
  "    window.__loftControllers.birthday('ashraf'); await sleep(200);",
  "    report.steps.ashraf = { bd: hasCls('bd-ashraf'), room: window.__currentStageName, hatVisible: vis('.bd-hat-ashraf') };",
  "    // Daniel — Prague call-only",
  "    window.__loftControllers.birthday('daniel'); await sleep(200);",
  "    report.steps.daniel = { bd: hasCls('bd-daniel'), room: window.__currentStageName };",
  "    // From a clean, party-off state, one Chinnell birthday activation must reach the cake.",
  "    if (window.__setGardenParty) window.__setGardenParty(false, true); await sleep(120);",
  "    window.__loftControllers.birthday('chinnell'); await sleep(250);",
  "    report.steps.chinnell = { room: window.__currentStageName, party: !!window.__gardenPartyOn, cakeOn: !!window.__bdCakeOn, cutter: !!document.querySelector('#garden-guests .g-chinnell.bd-cutter'), hatVis: vis('#garden-guests .g-chinnell .bd-hat-chinnell') };",
  "    if (window.__endBdCakeCutting) window.__endBdCakeCutting();",
  "    // Navid has a full dance-floor figure, so his birthday starts the party and brings him to the cake.",
  "    window.__loftControllers.birthday('navid'); await sleep(250);",
  "    var navidFig=document.querySelector('#garden-guests .g-navid');",
  "    report.steps.navid = { bd: hasCls('bd-navid'), room: window.__currentStageName, party: !!window.__gardenPartyOn, cakeOn: !!window.__bdCakeOn, cutter: !!(navidFig&&navidFig.classList.contains('bd-cutter')), arrived: !!(navidFig&&navidFig.classList.contains('arrived')), hatVisible: vis('#garden-guests .g-navid .bd-hat-navid') };",
  "    var blowStarted=window.__beginBdCandleBlow&&window.__beginBdCandleBlow();",
  "    var blowLean=document.getElementById('garden-guests').classList.contains('bd-candles-blow'); await sleep(800);",
  "    report.steps.navidBlow = { started:!!blowStarted, leaned:blowLean, blown:document.getElementById('garden-bd-cake').classList.contains('blown') };",
  "    if (window.__endBdCakeCutting) window.__endBdCakeCutting();",
  "    if (window.__setPartyKidFormation) window.__setPartyKidFormation('play'); await sleep(80);",
  "    report.steps.navidAfterCake = { arrived: !!(navidFig&&navidFig.classList.contains('arrived')), honoree: !!(navidFig&&navidFig.classList.contains('bd-honoree')), cutter: !!(navidFig&&navidFig.classList.contains('bd-cutter')), away: !!(navidFig&&(navidFig.classList.contains('off-with-kids')||navidFig.classList.contains('off-at-games')||navidFig.classList.contains('off-asleep')||navidFig.classList.contains('off-at-bbq'))) };",
  "    // Hannah has a dance-floor model too, so the model-derived rule routes her to the cake.",
  "    window.__loftControllers.birthday('hannah'); await sleep(250);",
  "    report.steps.hannah = { bd: hasCls('bd-hannah'), room: window.__currentStageName, cakeOn: !!window.__bdCakeOn, cutter: !!document.querySelector('#garden-guests .g-hannah.bd-cutter'), hatVis: vis('#garden-guests .g-hannah .bd-hat-hannah') };",
  "    // A typed season change must CLEAR the birthday axis (mutually exclusive pretend-dates)",
  "    window.__loftControllers.season('summer'); await sleep(150);",
  "    report.steps.seasonClears = { anyBd: /\\bbd-[a-z]+\\b/.test(strip().className), summer: hasCls('season-pride')||true, sd: window.__seasonDate() };",
  "    // list + advance-with-no-arg",
  "    report.steps.list = window.__loftControllers.birthday('list');",
  "  }",
  "})();",
  "</script>"
].join("\n");

var failures = 0;
function pass(m){console.log("  ✓ "+m);}
function fail(m,d){failures++;console.log("  ✗ "+m); if(d) console.log("      "+String(d).split("\n").join("\n      "));}

console.log("rsvp.html birthday axis:");
var r = lib.runPageSync("rsvp.html", HARNESS, 11000, { patchRaf: true, forceMotion: true });
if (!r) { fail("harness reported (page error before load, or budget too small)"); }
else {
  var s = r.steps || {};
  if (s.hasHooks) pass("typed birthday + __stepBirthday hooks are wired"); else fail("birthday hooks wired");
  var hamidOff = s.hamidDays && [s.hamidDays[0], s.hamidDays[2]].every(function (x) { return x && !x.strip && x.prop === "hidden" && x.exact.indexOf("hamid") < 0 && (!x.share || x.share.kind !== "birthday") && !/Hamid/i.test(x.banner || ""); });
  var hamidOn = s.hamidDays && s.hamidDays[1] && s.hamidDays[1].strip && s.hamidDays[1].prop === "hidden" && s.hamidDays[1].exact.indexOf("hamid") >= 0 && s.hamidDays[1].share && s.hamidDays[1].share.kind === "birthday" && s.hamidDays[1].share.id === "hamid" && /Hamid/i.test(s.hamidDays[1].banner || "");
  if (hamidOff && hamidOn) pass("Hamid's adornment class, banner, exact-date owner, and share-card classification agree on Aug 12 only"); else fail("Hamid exact-day birthday contract", JSON.stringify(s.hamidDays));
  var mohsenOff = s.mohsenDays && [s.mohsenDays[0], s.mohsenDays[2]].every(function (x) { return x && !x.strip && !x.body && x.prop === "hidden" && x.cake === "hidden" && !x.tehran && x.exact.indexOf("mohsen") < 0 && (!x.share || x.share.kind !== "birthday"); });
  var mohsenOn = s.mohsenDays && s.mohsenDays[1] && s.mohsenDays[1].strip && s.mohsenDays[1].body && s.mohsenDays[1].tehran && s.mohsenDays[1].exact.indexOf("mohsen") >= 0 && s.mohsenDays[1].share && s.mohsenDays[1].share.kind === "birthday" && s.mohsenDays[1].share.id === "mohsen";
  if (mohsenOff && mohsenOn) pass("Tehran hats, cake/call props, and share-card classification agree on Mohsen's exact day only"); else fail("Tehran exact-day birthday contract", JSON.stringify(s.mohsenDays));
  if (s.first && s.first.bdMarketa) pass("first 'b' press leads with Markéta (bd-marketa set)"); else fail("first 'b' → Markéta", JSON.stringify(s.first));
  if (s.first && s.first.sd && s.first.sd.m === 0 && s.first.sd.d === 20) pass("Markéta's stop time-travels to Jan 20"); else fail("Markéta date = Jan 20", JSON.stringify(s.first && s.first.sd));
  if (s.first && /Mark/.test(s.first.toast)) pass("birthday toast names the person (" + (s.first && s.first.toast) + ")"); else fail("toast names the person", JSON.stringify(s.first && s.first.toast));
  if (s.first && s.first.crownVisible === "visible" && s.first.plainHat === "none") pass("Markéta wears a CROWN (bd-crown, no bd-hat)"); else fail("Markéta crown visible / no hat", JSON.stringify(s.first && { crown: s.first.crownVisible, hat: s.first.plainHat }));
  if (s.dateless && [s.dateless.ali, s.dateless.goli, s.dateless.son, s.dateless.daughter].every(function (v) { return /^no birthday/.test(v); }) && !/\"ali\"|\"goli\"|patricia-son|patricia-daughter/.test(s.dateless.list)) pass("dateless people stay outside the birthday API and its ring"); else fail("dateless people have no birthday records", JSON.stringify(s.dateless));
  if (s.dateless && !s.dateless.bdAli && !s.dateless.bdGoli && !s.dateless.bdSon && !s.dateless.bdDaughter && [s.dateless.aliHat, s.dateless.goliHat, s.dateless.sonHat, s.dateless.daughterHat].every(function (v) { return v === "hidden"; })) pass("their retained birthday props remain dormant without active birthday classes"); else fail("retained birthday props dormant", JSON.stringify(s.dateless));
  if (s.madlaPre && s.madlaPre.guestsIn && s.madlaPre.madlaHidden === "hidden") pass("bug precondition set: floor populated (guests-in) with Madla still hidden off-floor"); else fail("Madla precondition (guests-in + madla hidden)", JSON.stringify(s.madlaPre));
  if (s.madla && s.madla.party && s.madla.room === "garden" && s.madla.cutter && s.madla.arrived && s.madla.figVis === "visible" && s.madla.crownVis === "visible") pass("populated-floor birthday (Madla): startBdCakeCutting FORCE-arrives the figure — visible under its crown (no floating crown)"); else fail("Madla populated-floor regression (arrived+visible under crown)", JSON.stringify(s.madla));
  if (s.madlaHold && s.madlaHold.balanceSame && !s.madlaHold.leaving && s.madlaHold.stillCutter && s.madlaHold.stillVis === "visible") pass("Madla HOLDS at the cake through a rebalance — the cutter isn't glided off to a slot/corner"); else fail("Madla holds at cake through rebalance (no drift to corner)", JSON.stringify(s.madlaHold));
  if (s.madlaTrim && s.madlaTrim.calls === 1 && s.madlaTrim.started.leaving > 0 && s.madlaTrim.after <= 8) pass("ending the birthday cake releases its temporary crowd and rebalances the retained floor"); else fail("birthday cake end releases forced crowd", JSON.stringify(s.madlaTrim));
  if (s.elisabeth && s.elisabeth.bd && s.elisabeth.room === "garden" && s.elisabeth.party && s.elisabeth.cakeOn && s.elisabeth.cutter && s.elisabeth.crownVisible === "visible") pass("Elisabeth's dance-floor model routes her birthday to the cake"); else fail("Elisabeth floor-model birthday", JSON.stringify(s.elisabeth));
  if (s.madlaCall && s.madlaCall.bd && s.madlaCall.room === "garden" && s.madlaCall.cakeOn && s.madlaCall.cutter && s.madlaCall.crownVis === "visible") pass("Madla's dance-floor model routes her birthday to the cake"); else fail("Madla floor-model birthday", JSON.stringify(s.madlaCall));
  if (s.patriciaCall && s.patriciaCall.bd && s.patriciaCall.room === "garden" && s.patriciaCall.cakeOn && s.patriciaCall.cutter && s.patriciaCall.hatVis === "visible") pass("Patricia's dance-floor model routes her birthday to the cake"); else fail("Patricia floor-model birthday", JSON.stringify(s.patriciaCall));
  if (s.ashraf && s.ashraf.bd && s.ashraf.room === "office") pass("Ashraf (Tehran call) pans to the office + shows her hat class"); else fail("Ashraf tehran reveal", JSON.stringify(s.ashraf));
  if (s.hannah && s.hannah.bd && s.hannah.room === "garden" && s.hannah.cakeOn && s.hannah.cutter && s.hannah.hatVis === "visible") pass("Hannah's dance-floor model routes her birthday to the cake"); else fail("Hannah floor-model birthday", JSON.stringify(s.hannah));
  if (s.daniel && s.daniel.bd && s.daniel.room === "office") pass("Daniel (Prague call) pans to the office"); else fail("Daniel prague reveal", JSON.stringify(s.daniel));
  if (s.chinnell && s.chinnell.room === "garden" && s.chinnell.party && s.chinnell.cakeOn && s.chinnell.cutter && s.chinnell.hatVis === "visible") pass("one Chinnell birthday activation starts the party and cake"); else fail("Chinnell one-activation birthday cake", JSON.stringify(s.chinnell));
  if (s.navid && s.navid.bd && s.navid.room === "garden" && s.navid.party && s.navid.cakeOn && s.navid.cutter && s.navid.arrived && s.navid.hatVisible === "visible") pass("Navid's birthday starts the party and brings him to the cake in his hat"); else fail("Navid party-room birthday cake", JSON.stringify(s.navid));
  if (s.navidBlow && s.navidBlow.started && s.navidBlow.leaned && s.navidBlow.blown) pass("the birthday honoree leans in and blows out the candles"); else fail("birthday honoree blows out candles", JSON.stringify(s.navidBlow));
  if (s.navidAfterCake && s.navidAfterCake.arrived && s.navidAfterCake.honoree && !s.navidAfterCake.cutter && !s.navidAfterCake.away) pass("the birthday honoree stays dancing after cake and cannot be reassigned"); else fail("birthday honoree persists all night", JSON.stringify(s.navidAfterCake));
  if (s.seasonClears && s.seasonClears.anyBd === false) pass("typed season change clears the birthday axis (no stray bd-* class)"); else fail("season clears bd axis", JSON.stringify(s.seasonClears));
  if (typeof s.list === "string" && /marketa/.test(s.list)) pass("birthday owner lists the ring"); else fail("birthday list", JSON.stringify(s.list));
  if (r.errors.length === 0) pass("no uncaught JS errors across the run"); else fail("no uncaught JS errors", r.errors.slice(0,12).join("\n"));
}

var reducedHarness = [
  "<pre id=\"__report\" style=\"position:fixed;left:-9999px\">pending</pre>",
  "<script>",
  "window.addEventListener('load',function(){setTimeout(function(){",
  "  loft.calendar.birthday.show('navid');",
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
if (!/\bbefore\s*:|\bafter\s*:/.test((/var BIRTHDAYS = \[([\s\S]*?)\n  \];/.exec(source) || ["", ""])[1]) && source.indexOf("inBirthdayWindow") < 0) {
  pass("birthday registry and runtime contain no before/after range contract");
} else {
  fail("birthday ranges removed");
}
if (source.indexOf('body.thr-bd .thr-bd-only{visibility:visible}') >= 0 &&
    source.indexOf('body.bd-payman .thr-hon-payman') >= 0 &&
    source.indexOf('body.bd-ashraf .thr-hon-ashraf') >= 0 &&
    source.indexOf('body.bd-mohsen .thr-hon-mohsen') >= 0) {
  pass("the exact-day Tehran body classes still gate its cake and birthday seats");
} else {
  fail("Tehran birthday prop gates retained");
}
var retainedPropMinimums = { ali: 1, goli: 1, "patricia-son": 3, "patricia-daughter": 3 };
if (Object.keys(retainedPropMinimums).every(function (who) {
  var matches = source.match(new RegExp('class="[^"]*bd-hat-' + who + '(?:\\s|"|$)', "g")) || [];
  return matches.length >= retainedPropMinimums[who];
})) {
  pass("dateless people retain their authored floor, runner, and call birthday props for future reuse");
} else {
  fail("retained birthday prop inventory");
}
if (source.indexOf('#stage-garden > [id^="garden-kid-"]:not(.chasing) .bd-adorn') >= 0 &&
    source.indexOf('#loft-game-strip [id^="garden-kid-"]:not(.chasing) .bd-adorn') < 0) {
  pass("parked-runner gate targets outer runners without catching their *-body descendants");
} else {
  fail("parked-runner selector scope");
}
if (source.indexOf('#loft-game-strip #garden-guests.trickle .guest:not(.arrived) .bd-adorn') >= 0 &&
    source.indexOf('#loft-game-strip.polyamory-day #garden-guests.trickle') < 0) {
  pass("every fresh Party hides birthday adornments until their wearer arrives");
} else {
  fail("fresh-Party birthday adornment gate");
}

console.log("");
if (failures > 0) { console.log(failures + " check(s) failed."); process.exit(1); }
else { console.log("All checks passed."); }
