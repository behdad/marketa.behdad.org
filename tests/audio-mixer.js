#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = [
  '<pre id="__report">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(error){window.__errs.push(String(error&&error.stack||error));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},300);});',
  'async function run(){',
  ' var button=document.getElementById("hunt-volume-btn"),mixer=document.getElementById("audio-mixer"),rail=document.getElementById("hunt-right");var musicBefore=window.__audioMixState().music;button.click();report.steps.leftClick={before:musicBefore,after:window.__audioMixState().music,mixerHidden:mixer.hidden};button.dispatchEvent(new MouseEvent("contextmenu",{bubbles:true,cancelable:true,button:2}));',
  ' report.steps.open={shown:!mixer.hidden,lifted:rail.classList.contains("mixer-open"),railZ:Number(getComputedStyle(rail).zIndex),monitorZ:Number(getComputedStyle(document.getElementById("monitor-html-overlay")).zIndex),labels:Array.from(mixer.querySelectorAll(".audio-mixer-row span")).map(function(node){return node.textContent;})};',
  ' document.getElementById("kitchen-kettle").dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(100);',
  ' function set(key,value){var input=mixer.querySelector("[data-audio-mix="+key+"]");input.value=String(value);input.dispatchEvent(new Event("input",{bubbles:true}));}',
  ' set("master",80);set("music",35);set("ambience",25);set("effects",45);await sleep(150);',
  ' report.steps.changed={state:window.__audioMixState(),diag:window.__audioMixDiagnostics(),stored:JSON.parse(localStorage.getItem("loftAudioMix:v1")),outputs:Array.from(mixer.querySelectorAll("output")).map(function(node){return node.textContent;})};',
  ' var api=window.loft.api,status=api.query("volume.status"),changed=await api.perform("volume.ambience.set",{level:.5},{source:"test"});await sleep(100);report.steps.api={status:status,changed:changed,state:window.__audioMixState(),diag:window.__audioMixDiagnostics()};',
  ' set("music",100);button.click();report.steps.cycledMute={runtime:window.__audioMixState().music,stored:JSON.parse(localStorage.getItem("loftAudioMix:v1")).music};set("music",35);',
  ' document.querySelector(".langs [data-lang=cs]").click();report.steps.czech=Array.from(mixer.querySelectorAll(".audio-mixer-row span")).map(function(node){return node.textContent;});',
  ' var reset=await api.perform("volume.reset",{},{source:"test"});await sleep(100);report.steps.reset={result:reset,state:window.__audioMixState(),diag:window.__audioMixDiagnostics()};',
  ' document.getElementById("audio-mixer-close").click();report.steps.closeButton={hidden:mixer.hidden,lifted:rail.classList.contains("mixer-open")};',
  ' button.dispatchEvent(new MouseEvent("contextmenu",{bubbles:true,cancelable:true,button:2}));button.dispatchEvent(new MouseEvent("contextmenu",{bubbles:true,cancelable:true,button:2}));report.steps.rightToggle={hidden:mixer.hidden,lifted:rail.classList.contains("mixer-open")};',
  ' button.dispatchEvent(new MouseEvent("contextmenu",{bubbles:true,cancelable:true,button:2}));var clickBefore=window.__audioMixState().music;button.click();report.steps.leftDismiss={hidden:mixer.hidden,lifted:rail.classList.contains("mixer-open"),before:clickBefore,after:window.__audioMixState().music};',
  ' button.dispatchEvent(new MouseEvent("contextmenu",{bubbles:true,cancelable:true,button:2}));document.body.dispatchEvent(new MouseEvent("click",{bubbles:true}));report.steps.closed={hidden:mixer.hidden,lifted:rail.classList.contains("mixer-open")};',
  '}',
  '})();</script>'
].join("\n");

var result = lib.runPageSync("rsvp.html", HARNESS, 4200, {
  patchRaf: true,
  chromeFlags: "--autoplay-policy=no-user-gesture-required"
});
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}
function near(value, expected) { return typeof value === "number" && Math.abs(value - expected) < 0.025; }

console.log("rsvp.html sound mixer:");
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.leftClick && s.leftClick.before === .15 && s.leftClick.after === .4 && s.leftClick.mixerHidden,
  "ordinary click keeps the original stepped Music control without opening the mixer", s.leftClick);
check(s.open && s.open.shown && s.open.lifted && s.open.railZ > s.open.monitorZ,
  "the mixer opens above the promoted monitor layer", s.open);
check(s.changed && JSON.stringify(s.changed.state) === JSON.stringify({ master:.8, music:.35, ambience:.25, effects:.45 }) &&
  near(s.changed.diag.effectiveMusic,.28) && s.changed.diag.ambience.some(function(value){return near(value,.2);}) && near(s.changed.diag.effects,.36),
  "Master composes once with Music, Ambience, and Effects", s.changed);
check(s.changed && JSON.stringify(s.changed.state) === JSON.stringify(s.changed.stored) &&
  JSON.stringify(s.changed.outputs) === JSON.stringify(["80%","35%","25%","45%"]),
  "continuous values persist and repaint their percentages", s.changed);
check(s.api && s.api.status.ok && s.api.changed.ok && s.api.changed.value.channel === "ambience" &&
  s.api.state.ambience === .5 && s.api.diag.ambience.some(function(value){return near(value,.4);}),
  "the typed API reads and changes one mixer channel", s.api);
check(s.cycledMute && s.cycledMute.runtime === 0 && s.cycledMute.stored === 1,
  "a mute reached by the legacy click cycle stays temporary across reloads", s.cycledMute);
check(s.czech && JSON.stringify(s.czech) === JSON.stringify(["Celkově","Hudba","Prostředí","Efekty"]),
  "the four mixer labels switch to Czech together", s.czech);
check(s.reset && s.reset.result.ok && JSON.stringify(s.reset.state) === JSON.stringify({ master:1, music:.15, ambience:1, effects:1 }) &&
  near(s.reset.diag.effectiveMusic,.15) && s.reset.diag.ambience.some(function(value){return near(value,1);}) && near(s.reset.diag.effects,1),
  "Reset restores the authored mix on every live bus", s.reset);
check(s.closeButton && s.closeButton.hidden && !s.closeButton.lifted,
  "the visible close button dismisses the mixer and releases its stacking lift", s.closeButton);
check(s.rightToggle && s.rightToggle.hidden && !s.rightToggle.lifted,
  "a second right-click on the volume button dismisses the mixer", s.rightToggle);
check(s.leftDismiss && s.leftDismiss.hidden && !s.leftDismiss.lifted && s.leftDismiss.before === .15 && s.leftDismiss.after === .4,
  "an ordinary volume click dismisses the mixer while retaining its stepped Music action", s.leftDismiss);
check(s.closed && s.closed.hidden && !s.closed.lifted, "an outside click closes the mixer and releases its stacking lift", s.closed);

var source = fs.readFileSync(path.join(__dirname, "..", "loft-day.html"), "utf8");
check(/eqAnalyser\.connect\(lowerFloorAudioOutput\(eqAudioCtx\)\)/.test(source) &&
  !/eqAnalyser\.connect\([^\n]*(?:ambience|effects)/.test(source),
  "the Music app EQ remains confined to the captured-song pipeline");

console.log("");
if (failures) { console.log(failures + " sound-mixer assertion" + (failures === 1 ? "" : "s") + " failed."); process.exit(1); }
console.log("Sound mixer assertions passed.");
