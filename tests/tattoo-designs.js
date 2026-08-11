#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var tattooDir = path.join(__dirname, "..", "art", "tattoo");
var asset = path.join(tattooDir, "ayushi.svg");
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
var paperless = {
  ayushi: /<g fill="none">\s*<path d="M0 64\.17/,
  bored: /<path fill="none" d="m0 0l960\.0 0l0 384\.0l-960\.0 0z"/,
  butterfly: /<g fill="none">[\s\S]*<g fill="none">/,
  giraffe: /<g fill="none">\s*<path d="M0 344\.76/
};
check(Object.keys(paperless).every(function (id) {
  return paperless[id].test(fs.readFileSync(path.join(tattooDir, id + ".svg"), "utf8"));
}), "opaque source-paper layers are transparent so the app's skin backdrop reaches every design");

var harness = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'var out={};window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){out.error=String(e&&e.stack||e);}).then(function(){out.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(out);});},250);});',
  'async function run(){',
  ' window.__setLang("en");var mon=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio");window.__goToStage("office");tower.classList.add("on");mon.classList.add("here","screen-on","show-caps");window.__openMonitorApp("tattoo");await sleep(100);',
  ' var cells=[].slice.call(document.querySelectorAll(".tattoo-cell")),thumbs=[].slice.call(document.querySelectorAll(".tattoo-thumb"));function designId(img){return (img.src||"").split("/").pop().split(".")[0];}var thumb=document.querySelector(\'.tattoo-thumb[src$="ayushi.svg"]\');out.gallery={cells:cells.length,found:!!thumb,credit:thumb&&thumb.parentNode.querySelector(".tattoo-cap").textContent,order:thumbs.map(designId),skins:thumbs.map(function(img){return {id:designId(img),className:img.className,background:getComputedStyle(img).backgroundColor,hasAlt:img.hasAttribute("alt")};})};',
  ' if(thumb)thumb.parentNode.click();await sleep(50);var preview=document.querySelector(".tattoo-preview img");out.en={src:preview&&preview.getAttribute("src"),hasAlt:preview&&preview.hasAttribute("alt"),credit:(document.querySelector(".tattoo-credit")||{}).textContent,portrait:!!document.querySelector(".tattoo-artist-svg"),className:preview&&preview.className,background:preview&&getComputedStyle(preview).backgroundColor};',
  ' window.__setLang("cs");await sleep(40);preview=document.querySelector(".tattoo-preview img");out.cs={hasAlt:preview&&preview.hasAttribute("alt"),credit:(document.querySelector(".tattoo-credit")||{}).textContent};',
  ' document.getElementById("monitor-tattoo-back").dispatchEvent(new MouseEvent("click",{bubbles:true}));await sleep(30);var elephant=document.querySelector(\'.tattoo-thumb[src$="elephant.svg"]\');if(elephant)elephant.parentNode.click();await sleep(30);preview=document.querySelector(".tattoo-preview img");out.marketaPreview={className:preview&&preview.className,background:preview&&getComputedStyle(preview).backgroundColor};',
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
  check(state.gallery.skins.every(function (row) { return !row.hasAlt; }),
    "gallery tattoo images carry no hidden names", state.gallery.skins);
  check(state.gallery.skins.every(function (row) {
    var marketa = row.id === "elephant" || row.id === "bored";
    return row.className.indexOf(marketa ? "tattoo-skin-marketa" : "tattoo-skin-behdad") !== -1 &&
      row.background === (marketa ? "rgb(242, 207, 174)" : "rgb(230, 180, 137)");
  }), "only elephant and boring use Markéta's lighter skin; all six other designs use Behdad's", state.gallery.skins);
  check(state.en.src === "art/tattoo/ayushi.svg" && !state.en.hasAlt &&
        state.en.credit === "by Ayushi, diva" && state.en.portrait &&
        state.en.className === "tattoo-skin-behdad" && state.en.background === "rgb(230, 180, 137)",
    "Ayushi's English detail view keeps its vector, credit, portrait, and Behdad skin backdrop", state.en);
  check(!state.cs.hasAlt && state.cs.credit === "od Ayushi, diva",
    "the Czech detail view mirrors the localized credit without naming the image", state.cs);
  check(state.marketaPreview.className === "tattoo-skin-marketa" &&
        state.marketaPreview.background === "rgb(242, 207, 174)",
    "the expanded elephant preview keeps Markéta's lighter skin backdrop", state.marketaPreview);
}

if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");
