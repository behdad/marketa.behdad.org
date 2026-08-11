#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var harness = [
  '<pre id="__report">pending</pre>',
  '<script>(async function(){',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'window.__openPhoneModal(true);await sleep(80);var wrap=document.querySelector(".psb-sig-wrap"),bars=[].slice.call(wrap.querySelectorAll(".psb-sig-bar")),pop=wrap.querySelector(".psb-sig-pop"),level=+wrap.getAttribute("data-level"),out={errors:window.__errs,level:level,lit:bars.filter(function(bar){return !bar.classList.contains("off");}).length,key:pop.getAttribute("data-i"),en:pop.textContent,tiers:{edmonton:window.__phoneSignalLevel("America/Edmonton",0),vancouver:window.__phoneSignalLevel("America/Vancouver",1),toronto:window.__phoneSignalLevel("America/Toronto",2),mexico:window.__phoneSignalLevel("America/Mexico_City",0),brazil:window.__phoneSignalLevel("America/Sao_Paulo",3),prague:window.__phoneSignalLevel("Europe/Prague",8)}};',
  'wrap.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));out.open=wrap.classList.contains("show")&&getComputedStyle(pop).display!=="none";window.__setLang("cs");await sleep(30);out.cs=pop.textContent;document.querySelector(".phone-shell").dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));out.closed=!wrap.classList.contains("show")&&getComputedStyle(pop).display==="none";document.getElementById("__report").textContent=JSON.stringify(out);',
  '})().catch(function(error){document.getElementById("__report").textContent=JSON.stringify({error:String(error&&error.stack||error)});});<\/script>'
].join("\n");

var result = lib.runPageSync("rsvp.html", harness, 1200, { patchRaf: true });
var failures = 0;
function check(ok, label, detail) {
  console.log("  " + (ok ? "✓" : "✗") + " " + label);
  if (!ok) {
    failures++;
    if (detail != null) console.log("    " + JSON.stringify(detail));
  }
}

console.log("rsvp.html phone reception gag:");
check(result && !result.error, "focused harness completed", result && result.error);
if (result && !result.error) {
  check(result.errors.length === 0, "no uncaught page errors", result.errors);
  check(result.level >= 1 && result.level <= 4 && result.lit === result.level &&
      result.key === "phone_signal_" + result.level,
    "the tooltip copy follows the timezone-derived signal level", result);
  check(result.open && result.closed, "tap opens the signal verdict and an outside tap dismisses it", result);
  check(/Edmonton/.test(result.en) && /Edmontonu/.test(result.cs),
    "the verdict follows the current English or Czech language", result);
  check(result.tiers.edmonton === 4 && result.tiers.vancouver === 3 && result.tiers.toronto === 2 &&
      result.tiers.mexico === 1 && result.tiers.brazil === 1 && result.tiers.prague === 1,
    "timezone identities prevent distant same-offset regions from receiving Edmonton bars", result.tiers);
}

if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");
