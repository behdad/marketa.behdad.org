#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function click(el){el.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));}',
  'function elkey(el,key){el.dispatchEvent(new KeyboardEvent("keydown",{key:key,bubbles:true,cancelable:true}));}',
  'function key(key,extra){var init={key:key,bubbles:true,cancelable:true};Object.assign(init,extra||{});var event=new KeyboardEvent("keydown",init);document.dispatchEvent(event);return event;}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  ' Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});window.__unlockAllRooms();',
  ' var room=document.getElementById("prince-basement"),strip=document.getElementById("loft-game-strip"),host=document.getElementById("prince-basement-host"),wall=document.getElementById("prince-play-wall");room.style.transition="none";strip.style.transition="none";',
  ' window.goToStage("garden");key("ArrowDown");await sleep(80);var props=Array.from(document.querySelectorAll("#prince-dungeon-set .prince-dungeon-prop"));report.steps.dormant={state:window.__princeState(),input:window.__princeInputActive,frames:host.querySelectorAll("iframe").length,props:props.map(function(prop){return [prop.id,prop.getAttribute("aria-label"),prop.getAttribute("title")];})};',
  ' click(document.getElementById("prince-dungeon-window"));elkey(document.getElementById("prince-dungeon-torch-left"),"Enter");elkey(document.getElementById("prince-dungeon-chain")," ");click(document.getElementById("prince-dungeon-ledge"));click(document.getElementById("prince-dungeon-stone"));await sleep(30);report.steps.props={window:document.getElementById("prince-dungeon-window").className,left:document.getElementById("prince-dungeon-torch-left").className,chain:document.getElementById("prince-dungeon-chain").className,ledge:document.getElementById("prince-dungeon-ledge").className,stone:document.getElementById("prince-dungeon-stone").className};',
  ' setLang("cs");report.steps.cs=props.map(function(prop){return [prop.getAttribute("aria-label"),prop.getAttribute("title")];});setLang("en");',
  ' wall.focus();elkey(wall," ");await sleep(90);var frame=host.querySelector("iframe");var ctrl=key("r",{ctrlKey:true});report.steps.started={state:window.__princeState(),input:window.__princeInputActive,frame:!!frame,src:frame&&frame.getAttribute("src"),ctrlPrevented:ctrl.defaultPrevented};',
  ' key("Escape");await sleep(780);report.steps.parked={state:window.__princeState(),input:window.__princeInputActive,frame:host.querySelector("iframe")===frame};',
  ' key("ArrowDown");await sleep(80);report.steps.returned={state:window.__princeState(),input:window.__princeInputActive,frame:host.querySelector("iframe")===frame};click(wall);await sleep(80);report.steps.resumed={state:window.__princeState(),input:window.__princeInputActive,frame:host.querySelector("iframe")===frame};',
  ' window.__destroyMonitorPrince();await sleep(30);report.steps.destroyed=window.__princeState();',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},240);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html Prince dungeon play wall:");
var result = lib.runPageSync("rsvp.html", HARNESS, 7000, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.dormant && s.dormant.state.basement && !s.dormant.state.initiated &&
  !s.dormant.state.playing && !s.dormant.input && s.dormant.frames === 0,
  "descending opens the authored dungeon without constructing or focusing Prince", s.dormant);
check(s.dormant && s.dormant.props.length === 7 &&
  s.dormant.props.every(function (row) { return row[1] && row[1] === row[2]; }),
  "all seven distinct dungeon controls have English pointer and keyboard labels", s.dormant && s.dormant.props);
check(s.cs && s.cs.length === 7 && s.cs.every(function (row) { return row[0] && row[0] === row[1]; }),
  "all dungeon labels switch to Czech", s.cs);
check(s.props && /rattled/.test(s.props.window) && /dim/.test(s.props.left) &&
  /swung/.test(s.props.chain) && /thudded/.test(s.props.ledge) && /shifted/.test(s.props.stone),
  "window, torch, chain, ledge, and loose stone visibly react", s.props);
check(s.started && s.started.frame && s.started.src === "princejs/index.html" &&
  s.started.state.initiated && s.started.state.playing && s.started.input && !s.started.ctrlPrevented,
  "Space on the play wall lazily creates Prince and preserves browser shortcuts", s.started);
check(s.parked && !s.parked.state.open && s.parked.state.parked && s.parked.state.initiated &&
  !s.parked.input && s.parked.frame,
  "Escape parks the initiated browsing context without leaving keyboard capture behind", s.parked);
check(s.returned && s.returned.state.basement && !s.returned.state.playing && !s.returned.input &&
  s.returned.frame && s.resumed && s.resumed.state.playing && s.resumed.input && s.resumed.frame,
  "re-entering shows the play wall and clicking it resumes the same iframe", {returned:s.returned,resumed:s.resumed});
check(s.destroyed && !s.destroyed.initiated && !s.destroyed.open && !s.destroyed.iframe,
  "destroy semantics discard the persistent run", s.destroyed);

if (failures) {
  console.log("\n" + failures + " Prince dungeon assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("\nAll checks passed.");
