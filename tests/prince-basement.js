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
  ' Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});window.__unlockAllRooms();window.__markLowerRoomDiscovered();',
  ' var room=document.getElementById("prince-basement"),strip=document.getElementById("loft-game-strip"),host=document.getElementById("prince-basement-host"),wall=document.getElementById("prince-play-wall");room.style.transition="none";strip.style.transition="none";',
  ' window.goToStage("garden");key("ArrowDown");await sleep(80);var props=Array.from(document.querySelectorAll("#prince-dungeon-set .prince-dungeon-prop"));report.steps.dormant={state:window.__princeState(),input:window.__princeInputActive,frames:host.querySelectorAll("iframe").length,props:props.map(function(prop){return [prop.id,prop.getAttribute("aria-label"),prop.getAttribute("title"),prop.getAttribute("tabindex")];})};',
  ' click(document.getElementById("prince-dungeon-window"));elkey(document.getElementById("prince-dungeon-torch-left"),"Enter");elkey(document.getElementById("prince-dungeon-chain")," ");click(document.getElementById("prince-dungeon-ledge"));click(document.getElementById("prince-dungeon-stone"));await sleep(30);report.steps.props={window:document.getElementById("prince-dungeon-window").className,left:document.getElementById("prince-dungeon-torch-left").className,chain:document.getElementById("prince-dungeon-chain").className,ledge:document.getElementById("prince-dungeon-ledge").className,stone:document.getElementById("prince-dungeon-stone").className};',
  ' var chain=document.getElementById("prince-dungeon-chain"),set=document.getElementById("prince-dungeon-set");function chainEvent(type,id,y){chain.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:id,pointerType:"touch",button:0,buttons:type==="pointerup"?0:1,clientX:400,clientY:y}));}chainEvent("pointerdown",31,80);chainEvent("pointermove",31,150);var peek={shown:set.classList.contains("gate-secret-peek"),lift:set.style.getPropertyValue("--prince-gate-lift"),caption:document.getElementById("hunt-caption").textContent,tabindex:chain.getAttribute("tabindex")};chainEvent("pointerup",31,150);var held=set.classList.contains("gate-secret-peek");await sleep(100);chainEvent("pointerdown",32,80);chainEvent("pointermove",32,150);await sleep(450);var repeated={shown:set.classList.contains("gate-secret-peek"),dragging:set.classList.contains("chain-dragging"),lift:set.style.getPropertyValue("--prince-gate-lift")};chainEvent("pointerup",32,150);await sleep(570);report.steps.secret={peek:peek,held:held,repeated:repeated,settled:!set.classList.contains("gate-secret-peek"),lift:set.style.getPropertyValue("--prince-gate-lift")};',
  ' setLang("cs");report.steps.cs=props.map(function(prop){return [prop.getAttribute("aria-label"),prop.getAttribute("title")];});setLang("en");',
  ' key(" ");await sleep(90);var frame=host.querySelector("iframe");var ctrl=key("r",{ctrlKey:true});report.steps.started={state:window.__princeState(),input:window.__princeInputActive,frame:!!frame,src:frame&&frame.getAttribute("src"),ctrlPrevented:ctrl.defaultPrevented};',
  ' key("Escape");await sleep(780);report.steps.parked={state:window.__princeState(),input:window.__princeInputActive,frame:host.querySelector("iframe")===frame};',
  ' key("ArrowDown");await sleep(80);report.steps.returned={state:window.__princeState(),input:window.__princeInputActive,frame:host.querySelector("iframe")===frame};key("Enter");await sleep(80);report.steps.resumed={state:window.__princeState(),input:window.__princeInputActive,frame:host.querySelector("iframe")===frame};',
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
  s.dormant.props.every(function (row) { return row[1] && row[1] === row[2] && row[3] === "-1"; }),
  "all seven labelled dungeon controls stay outside the Tab order", s.dormant && s.dormant.props);
check(s.cs && s.cs.length === 7 && s.cs.every(function (row) { return row[0] && row[0] === row[1]; }),
  "all dungeon labels switch to Czech", s.cs);
check(s.props && /rattled/.test(s.props.window) && /snuffed/.test(s.props.left) &&
  /swung/.test(s.props.chain) && /thudded/.test(s.props.ledge) && /shifted/.test(s.props.stone),
  "window, torch, chain, ledge, and loose stone visibly react", s.props);
check(s.secret && s.secret.peek.shown && parseFloat(s.secret.peek.lift) >= 60 &&
  s.secret.peek.caption && s.secret.peek.tabindex === "-1" && s.secret.held &&
  s.secret.repeated.shown && s.secret.repeated.dragging && parseFloat(s.secret.repeated.lift) >= 60 &&
  s.secret.settled && parseFloat(s.secret.lift) === 0,
  "repeated far touch drags keep the current reveal alive, then the weight resets it", s.secret);
check(s.started && s.started.frame && s.started.src === "princejs/index.html" &&
  s.started.state.initiated && s.started.state.playing && s.started.input && !s.started.ctrlPrevented,
  "bare Space in the dormant dungeon lazily creates Prince and preserves browser shortcuts", s.started);
check(s.parked && !s.parked.state.open && s.parked.state.parked && s.parked.state.initiated &&
  !s.parked.input && s.parked.frame,
  "Escape parks the initiated browsing context without leaving keyboard capture behind", s.parked);
check(s.returned && s.returned.state.basement && !s.returned.state.playing && !s.returned.input &&
  s.returned.frame && s.resumed && s.resumed.state.playing && s.resumed.input && s.resumed.frame,
  "re-entering shows the play wall and bare Enter resumes the same iframe", {returned:s.returned,resumed:s.resumed});
check(s.destroyed && !s.destroyed.initiated && !s.destroyed.open && !s.destroyed.iframe,
  "destroy semantics discard the persistent run", s.destroyed);

if (failures) {
  console.log("\n" + failures + " Prince dungeon assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("\nAll checks passed.");
