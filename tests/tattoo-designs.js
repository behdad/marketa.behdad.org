#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var asset = path.join(__dirname, "..", "art", "tattoo", "ayushi.svg");
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message);
    if (detail) console.log("      " + JSON.stringify(detail));
  }
}

console.log("Tattoo design gallery:");
check(fs.existsSync(asset) && /<svg\b/.test(fs.readFileSync(asset, "utf8")),
  "Ayushi's supplied vector is installed as art/tattoo/ayushi.svg");

var harness = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'var out={};window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){out.error=String(e&&e.stack||e);}).then(function(){out.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(out);});},250);});',
  'async function run(){',
  ' window.setLang("en");var mon=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio");window.goToStage("office");tower.classList.add("on");mon.classList.add("here","screen-on","show-caps");window.__openMonitorApp("tattoo");await sleep(100);',
  ' var cells=[].slice.call(document.querySelectorAll(".tattoo-cell")),thumbs=[].slice.call(document.querySelectorAll(".tattoo-thumb"));var thumb=document.querySelector(\'.tattoo-thumb[src$="ayushi.svg"]\');out.gallery={cells:cells.length,found:!!thumb,credit:thumb&&thumb.parentNode.querySelector(".tattoo-cap").textContent,order:thumbs.map(function(img){return (img.src||"").split("/").pop().split(".")[0];})};',
  ' if(thumb)thumb.parentNode.click();await sleep(50);var preview=document.querySelector(".tattoo-preview img");out.en={src:preview&&preview.getAttribute("src"),alt:preview&&preview.alt,credit:(document.querySelector(".tattoo-credit")||{}).textContent,portrait:!!document.querySelector(".tattoo-artist-svg")};',
  ' window.setLang("cs");await sleep(40);preview=document.querySelector(".tattoo-preview img");out.cs={alt:preview&&preview.alt,credit:(document.querySelector(".tattoo-credit")||{}).textContent};',
  '}',
  '})();</script>'
].join("\n");

var state = lib.runPageSync("rsvp.html", harness, 3000, { patchRaf: true, seedRandom: true });
check(state && !state.error && state.errors.length === 0,
  "gallery interaction completes without an uncaught error", state && (state.error || state.errors));
if (state && !state.error) {
  check(state.gallery.cells === 9 && state.gallery.found && state.gallery.credit === "by Ayushi",
    "the gallery loads Ayushi's built-in design with her credit", state.gallery);
  check(state.gallery.order.join(",") === "ayushi,pufferfish,dinosaur,princesses,elephant,giraffe,bored,butterfly",
    "the gallery follows the owners' eight-design order", state.gallery.order);
  check(state.en.src === "art/tattoo/ayushi.svg" && state.en.alt === "Paisley" &&
        state.en.credit === "by Ayushi, Diva" && state.en.portrait,
    "the English detail view keeps the supplied vector, label, role, and artist portrait", state.en);
  check(state.cs.alt === "Paisley" && state.cs.credit === "od Ayushi, Diva",
    "the Czech detail view mirrors the localized credit", state.cs);
}

if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");
