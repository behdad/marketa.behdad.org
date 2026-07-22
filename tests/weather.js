#!/usr/bin/env node
// Pocket weather regression: both couple-city caps, current conditions and the next
// three local forecast days must mirror the monitor's shared real-weather model.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function texts(root,sel){return [].map.call(root.querySelectorAll(sel),function(e){return e.textContent;});}',
  'window.addEventListener("load",function(){setTimeout(async function(){',
  ' var report={errors:window.__errs,offline:null,live:null,cs:null};',
  ' window.__realWx=null; window.__realOutdoorC=null; window.__realWxPrague=null; window.__realPragueC=null; window.__realDaily=null;',
  ' window.phone("weather"); await sleep(250);',
  ' var body=document.querySelector(".phone-app-body");',
  ' report.offline={cards:body.querySelectorAll(".wx-city").length,caps:body.querySelectorAll(".wxc-cap use").length,days:body.querySelectorAll(".wxc-day").length,ranges:texts(body,".wxc-range")};',
  ' window.__realWx={code:0}; window.__realOutdoorC=21.6; window.__realWxPrague={code:61}; window.__realPragueC=13.2;',
  ' window.__realDaily=[',
  '  {time:["2026-07-21","2026-07-22","2026-07-23","2026-07-24"],code:[0,2,61,95],max:[25,24.6,18.2,16.9],min:[14,12.4,9.8,8.1]},',
  '  {time:["2026-07-21","2026-07-22","2026-07-23","2026-07-24"],code:[61,3,0,71],max:[18,20.1,23.7,4.3],min:[9,10.2,12.1,-1.2]}',
  ' ];',
  ' window.__refreshPhoneWeather(); await sleep(150); body=document.querySelector(".phone-app-body");',
  ' var uses=[].map.call(body.querySelectorAll(".wxc-cap use"),function(e){var b;try{b=e.getBBox();}catch(x){b={width:0,height:0};}return {href:e.getAttribute("href"),w:b.width,h:b.height};});',
  ' report.live={names:texts(body,".wxc-name"),temps:texts(body,".wxc-temp"),weekdays:texts(body,".wxc-weekday"),ranges:texts(body,".wxc-range"),glyphs:texts(body,".wxc-day-glyph"),uses:uses,bodyFits:body.scrollHeight<=body.clientHeight,rangeFits:[].every.call(body.querySelectorAll(".wxc-range"),function(e){return e.scrollWidth<=e.clientWidth+1;})};',
  ' setLang("cs"); await sleep(150); body=document.querySelector(".phone-app-body"); report.cs={names:texts(body,".wxc-name"),weekdays:texts(body,".wxc-weekday")};',
  ' report.errors=window.__errs; document.getElementById("__report").textContent=JSON.stringify(report);',
  '},350);});',
  '})();</script>'
].join("\n");

var failures = 0;
function pass(msg) { console.log("  ✓ " + msg); }
function fail(msg, detail) { failures++; console.log("  ✗ " + msg); if (detail) console.log("      " + detail); }
function check(ok, msg, detail) { if (ok) pass(msg); else fail(msg, detail); }

console.log("rsvp.html pocket weather:");
var r = lib.runPageSync("rsvp.html", HARNESS, 3500, { patchRaf: true });
if (!r) {
  fail("harness reported");
} else {
  check(r.errors.length === 0, "no uncaught page errors", r.errors.join("\n"));
  check(r.offline.cards === 2 && r.offline.caps === 2 && r.offline.days === 6, "offline view keeps two capped cities and six stable forecast cells", JSON.stringify(r.offline));
  check(r.offline.ranges.every(function (x) { return x === "—"; }), "offline forecast uses quiet em-dashes", JSON.stringify(r.offline.ranges));
  check(r.live.names.join(",") === "Edmonton,Prague" && r.live.temps.join(",") === "22°,13°", "live current conditions render for Edmonton and Prague", JSON.stringify(r.live));
  check(r.live.ranges.join(",") === "25°/12°,18°/10°,17°/8°,20°/10°,24°/12°,4°/-1°", "next three local high/low ranges render for both cities", JSON.stringify(r.live.ranges));
  check(r.live.glyphs.join("") === "⛅🌧⛈⛅☀❄", "forecast WMO codes use the shared weather glyphs", JSON.stringify(r.live.glyphs));
  check(r.live.uses[0].href === "#cap-pink" && r.live.uses[1].href === "#cap-blue" && r.live.uses.every(function (x) { return x.w > 0 && x.h > 0; }), "pink and blue cap artwork paints above its city", JSON.stringify(r.live.uses));
  check(r.live.bodyFits && r.live.rangeFits, "normal phone viewport fits the panels and every temperature range", JSON.stringify(r.live));
  check(r.cs.names.join(",") === "Edmonton,Praha" && r.cs.weekdays.every(Boolean), "language refresh localizes the city and forecast weekdays", JSON.stringify(r.cs));
}

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
