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
  ' window.phone.open("weather"); await sleep(250);',
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

var HISTORICAL_HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var archiveCalls=[];',
  'function payload(start){',
  ' var y=+start.slice(0,4),base={2025:10,2024:12,2023:14,2022:16,2021:18}[y]||20;',
  ' var d0=new Date(start+"T12:00:00"),times=[],temps=[],codes=[];',
  ' for(var day=0;day<4;day++){var d=new Date(d0);d.setDate(d.getDate()+day);var iso=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");for(var h=0;h<24;h++){times.push(iso+"T"+String(h).padStart(2,"0")+":00");temps.push(base+(h-18));codes.push([0,1,2,61,3][(2025-y+day)%5]);}}',
  ' var days=[],dailyCode=[],high=[],low=[],sunrise=[],sunset=[];for(var i=0;i<4;i++){var dd=new Date(d0);dd.setDate(dd.getDate()+i);var di=dd.getFullYear()+"-"+String(dd.getMonth()+1).padStart(2,"0")+"-"+String(dd.getDate()).padStart(2,"0");days.push(di);dailyCode.push([0,1,2,61,3][(2025-y+i)%5]);high.push(base+8+i);low.push(base-4+i);sunrise.push(di+"T06:0"+i);sunset.push(di+"T21:0"+i);}',
  ' return {hourly:{time:times,temperature_2m:temps,weather_code:codes},daily:{time:days,weather_code:dailyCode,temperature_2m_max:high,temperature_2m_min:low,sunrise:sunrise,sunset:sunset}};',
  '}',
  'window.fetch=function(url){url=String(url);if(url.indexOf("archive-api.open-meteo.com")>=0){var m=/start_date=(\\d{4}-\\d{2}-\\d{2})/.exec(url);archiveCalls.push(m&&m[1]);return Promise.resolve({ok:true,json:function(){return Promise.resolve(payload(m[1]));}});}return Promise.resolve({ok:false,json:function(){return Promise.resolve(null);},text:function(){return Promise.resolve("");}});};',
  'window.addEventListener("load",function(){setTimeout(async function(){',
  ' var report={errors:[],future:null,hour:null,exact:null,reset:null};',
  ' try{',
  '  var meta=window.__weatherApprox,ctx=window.__chatContext("what is the weather?");',
  '  window.phone.open("weather");await sleep(100);var body=document.querySelector(".phone-app-body");',
  '  report.future={calls:archiveCalls.slice(),temp:window.__realOutdoorC,code:window.__realWx&&window.__realWx.code,active:window.__realWxActive(),daily:window.__realDaily&&window.__realDaily[0],meta:meta,phone:body&&body.querySelector(".wx-city.his .wxc-temp").textContent,chat:ctx.weather.edmonton.approximation};',
  '  window.__setLoftTime(22*60);await sleep(100);report.hour={temp:window.__realOutdoorC,meta:window.__weatherApprox,calls:archiveCalls.length};',
  '  window.__jumpToDate(2025,4,1);await sleep(150);report.exact={temp:window.__realOutdoorC,meta:window.__weatherApprox,calls:archiveCalls.slice()};',
  '  window.__calResetDateTime();await sleep(100);report.reset={approx:window.__weatherApprox,temp:window.__realOutdoorC};',
  ' }catch(e){window.__errs.push("historical harness: "+String(e&&e.stack||e));}',
  ' report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);',
  '},4550);});',
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
console.log("rsvp.html pretend-date historical weather:");
var historical = lib.runPageSync("rsvp.html", HISTORICAL_HARNESS, 5400, {
  patchRaf: true,
  urlSuffix: "?date=2027-05-01&time=18:00"
});
if (!historical) {
  fail("historical harness reported");
} else {
  check(historical.errors.length === 0, "no uncaught errors while archive weather changes", historical.errors.join("\n"));
  var f = historical.future;
  check(f && f.calls.length === 5 && f.calls.join(",") === "2025-05-01,2024-05-01,2023-05-01,2022-05-01,2021-05-01",
    "future pretend dates fetch five recent same-calendar archive samples", JSON.stringify(f));
  check(f && f.temp === 14 && f.code === 1 && f.active === "clear" && f.daily.time[1] === "2027-05-02",
    "median hourly temperature, modal weather family, and target-date forecast are published", JSON.stringify(f));
  check(f && f.meta.source === "historical-ensemble" && f.meta.target_hour === "18:00" &&
      f.meta.sample_years.length === 5 && /^≈14°$/.test(f.phone) &&
      f.chat && f.chat.source === "historical-ensemble",
    "weather UI and Charlie mark the Edmonton reading as an approximation", JSON.stringify(f));
  check(historical.hour && historical.hour.temp === 18 && historical.hour.meta.target_hour === "22:00" && historical.hour.calls === 5,
    "changing pretend time reselects cached hourly history without another fetch", JSON.stringify(historical.hour));
  check(historical.exact && historical.exact.meta.source === "historical-exact" &&
      historical.exact.meta.sample_years.join(",") === "2025" && historical.exact.calls.length === 6,
    "a genuinely past pretend date uses its exact archive day", JSON.stringify(historical.exact));
  check(historical.reset && historical.reset.approx === null && historical.reset.temp === null,
    "reset clears the approximation and hands Edmonton back to the live feed", JSON.stringify(historical.reset));
}

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
