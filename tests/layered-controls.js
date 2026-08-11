#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var html = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message);
    if (detail) console.log("      " + JSON.stringify(detail));
  }
}

console.log("Layered app controls:");
check(/id="monitor-console-close"[\s\S]*?id="monitor-console-back"/.test(html) &&
      /id="monitor-py-close"[\s\S]*?id="monitor-py-back"/.test(html),
  "Console and Python have separate Dismiss and Back controls");
check(/consoleCloseBtn\.addEventListener\("click"[\s\S]*?closeConsole\(false\)[\s\S]*?consoleBackBtn\.addEventListener\("click"[\s\S]*?closeConsole\(true\)/.test(html) &&
      /pyCloseBtn\.addEventListener\("click"[\s\S]*?closePython\(false\)[\s\S]*?pyBackBtn\.addEventListener\("click"[\s\S]*?closePython\(true\)/.test(html),
  "terminal Dismiss and Back controls take distinct close paths");

var harness = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var out={};try{',
  'function tap(el){el.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}))}',
  'var gate=document.getElementById("loft-recovery-gate");if(gate)gate.querySelector(".loft-recovery-btn:not(.primary)").click();',
  'var mon=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio");window.__endAttract();window.__goToStage("office");tower.classList.add("on");mon.classList.add("here","screen-on","show-caps");',
  'window.__openMonitorApp("mail");tap(document.querySelector(".mail-row"));var mailBack=document.getElementById("monitor-mail-back");out.mailOpen={back:getComputedStyle(mailBack).pointerEvents,closePath:document.querySelector("#monitor-mail-close path").getAttribute("d")};tap(document.getElementById("monitor-mail-close"));out.mailDismiss=!mon.classList.contains("show-mail");window.__openMonitorApp("mail");out.mailRetained=!!document.querySelector(".mail-body");tap(mailBack);out.mailBack=!!document.querySelector(".mail-list")&&mon.classList.contains("show-mail")&&getComputedStyle(mailBack).pointerEvents==="none";tap(document.getElementById("monitor-mail-close"));',
  'window.__openMonitorApp("tattoo");tap(document.querySelectorAll(".tattoo-cell")[1]);var tattooBack=document.getElementById("monitor-tattoo-back");out.tattooOpen={pointer:getComputedStyle(tattooBack).pointerEvents,owner:tattooBack.parentNode.id};tap(document.getElementById("monitor-tattoo-close"));out.tattooDismiss=!mon.classList.contains("show-tattoo");window.__openMonitorApp("tattoo");out.tattooRetained=!!document.querySelector(".tattoo-preview");tap(tattooBack);out.tattooBack=!!document.querySelector(".tattoo-grid")&&mon.classList.contains("show-tattoo")&&getComputedStyle(tattooBack).pointerEvents==="none";tap(document.getElementById("monitor-tattoo-close"));',
  'window.__openMonitorApp("life");tap(document.getElementById("monitor-life-help-button"));var lifeBack=document.getElementById("monitor-life-back");out.lifeOpen=getComputedStyle(lifeBack).pointerEvents;tap(document.getElementById("monitor-life-close"));out.lifeDismiss=!mon.classList.contains("show-life");window.__openMonitorApp("life");out.lifeRetained=document.getElementById("monitor-life-wrap").classList.contains("help-open");tap(lifeBack);out.lifeBack=!document.getElementById("monitor-life-wrap").classList.contains("help-open")&&mon.classList.contains("show-life")&&getComputedStyle(lifeBack).pointerEvents==="none";',
  '}catch(e){out.error=String(e&&e.stack||e)}document.getElementById("__report").textContent=JSON.stringify(out);',
  '})();</script>'
].join("\n");

var state = lib.runPageSync("rsvp.html", harness, 3500, { patchRaf: true, seedRandom: true });
check(state && !state.error, "headless layered-control interaction completed", state && state.error);
if (state && !state.error) {
  check(state.mailOpen.back !== "none" &&
        state.mailOpen.closePath === "M373.45 158.2 L375.55 160.3 M375.55 158.2 L373.45 160.3" &&
        state.mailDismiss && state.mailRetained && state.mailBack,
    "Mail Dismiss retains the message while Back returns to Inbox", state);
  check(state.tattooOpen.pointer !== "none" && state.tattooOpen.owner === "monitor-tattoo" &&
        state.tattooDismiss && state.tattooRetained && state.tattooBack,
    "Tattoo Dismiss retains the design while Back returns to the gallery", state);
  check(state.lifeOpen !== "none" && state.lifeDismiss && state.lifeRetained && state.lifeBack,
    "Life Dismiss retains Help while Back returns to the simulation", state);
}

if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");
