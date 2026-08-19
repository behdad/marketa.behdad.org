#!/usr/bin/env node
"use strict";

// A trusted mobile touch may be re-hit-tested after monitor zoom promotes the desktop
// into #monitor-html-overlay. The touch that requests zoom must not also launch the app
// newly painted beneath the stationary finger; a later deliberate tap still must.
import http from "http";
import fs from "fs";
import os from "os";
import path from "path";
import { spawn } from "child_process";

const ROOT = process.env.WEDDING_TEST_ROOT
  ? path.resolve(process.env.WEDDING_TEST_ROOT)
  : path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const PORT = 11600 + Math.floor(Math.random() * 400);
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), "monitor-zoom-touch-"));
const CHROME = process.env.CHROME_BIN || "google-chrome";
const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--no-sandbox", "--mute-audio",
  "--remote-debugging-port=" + PORT, "--user-data-dir=" + PROFILE,
  "--hide-scrollbars", "file://" + path.join(ROOT, "loft-day.html") + "?t=" + Date.now()
], { stdio: "ignore" });

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const get = pathname => new Promise((resolve, reject) => {
  http.get("http://127.0.0.1:" + PORT + pathname, response => {
    let data = "";
    response.on("data", chunk => { data += chunk; });
    response.on("end", () => resolve(JSON.parse(data)));
  }).on("error", reject);
});
const cleanup = () => {
  try { chrome.kill(); } catch {}
  try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {}
};
let failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : ""));
  }
}

(async () => {
  let target;
  for (let i = 0; i < 80; i++) {
    try {
      const targets = await get("/json");
      target = targets.find(item => item.type === "page" && item.url.includes("loft-day.html"));
      if (target) break;
    } catch {}
    await sleep(250);
  }
  if (!target) throw new Error("Chrome page target did not appear");

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0;
  const pending = {};
  const exceptions = [];
  const send = (method, params = {}) => new Promise(resolve => {
    const requestId = ++id;
    pending[requestId] = resolve;
    ws.send(JSON.stringify({ id: requestId, method, params }));
  });
  await new Promise(resolve => { ws.onopen = resolve; });
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.exceptionThrown") exceptions.push(message.params.exceptionDetails.text);
    if (!message.id || !pending[message.id]) return;
    pending[message.id](message.result);
    delete pending[message.id];
  };
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390, height: 300, deviceScaleFactor: 2, mobile: true
  });
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });

  const evaluate = expression => send("Runtime.evaluate", {
    expression, returnByValue: true, awaitPromise: true
  }).then(result => {
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  });
  for (let i = 0; i < 80; i++) {
    if (await evaluate("typeof window.__monitorZoomIn==='function'")) break;
    await sleep(250);
  }

  const candidate = await evaluate(`(async function(){
    var gate=document.getElementById("loft-recovery-gate");
    if(gate)gate.querySelector(".loft-recovery-btn:not(.primary)").click();
    window.__endAttract();window.__goToStage("office");
    await new Promise(function(resolve){setTimeout(resolve,820);});
    var mon=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio"),screen=document.getElementById("monitor-zoom-box");
    tower.classList.add("on");mon.classList.add("here","screen-on","show-caps");
    var before=screen.getBoundingClientRect();
    window.__monitorZoomIn();await new Promise(function(resolve){setTimeout(resolve,100);});
    var cells=Array.from(document.querySelectorAll("#monitor-html-overlay .dock-app"));
    cells.sort(function(a,b){return (a.id==="monitor-dock-call"?-1:0)-(b.id==="monitor-dock-call"?-1:0);});
    var pick=null;
    cells.some(function(cell){
      var r=cell.getBoundingClientRect(),left=Math.max(before.left+1,r.left+1),right=Math.min(before.right-1,r.right-1),top=Math.max(before.top+1,r.top+1),bottom=Math.min(before.bottom-1,r.bottom-1);
      if(right-left<2||bottom-top<2)return false;
      pick={x:(left+right)/2,y:(top+bottom)/2,id:cell.id,app:cell.id.replace("monitor-dock-","")};return true;
    });
    window.__monitorZoomOut();await new Promise(function(resolve){setTimeout(resolve,100);});
    if(!pick)return null;
    var start=document.elementFromPoint(pick.x,pick.y);
    pick.start=start&&start.id;pick.startsOnMonitor=!!(start&&start.closest&&start.closest("#office-monitor"));
    return pick;
  })()`);
  check(candidate && candidate.startsOnMonitor, "probe finds one stationary touch point that starts on the room-scale monitor and ends over an app", candidate);
  if (!candidate || !candidate.startsOnMonitor) throw new Error("No monitor/app overlap point found");

  async function tap(x, y) {
    // Dispatch the touch pointerdown directly to the pre-zoom hit target, then let CDP
    // generate one trusted compatibility click by coordinates after the synchronous zoom.
    // This models the browser's target handoff without CDP adding an earlier synthetic click.
    await evaluate(`(function(){
      var target=document.elementFromPoint(${x},${y});
      target.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerId:71,pointerType:"touch",isPrimary:true,button:0,buttons:1,clientX:${x},clientY:${y}}));
    })()`);
    await sleep(30);
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", buttons: 1, clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", buttons: 0, clickCount: 1 });
    await sleep(120);
  }
  async function trustedTouch(x, y) {
    await send("Input.dispatchTouchEvent", {
      type: "touchStart", touchPoints: [{ x, y, radiusX: 2, radiusY: 2, force: 1, id: 81 }]
    });
    await sleep(30);
    await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await sleep(120);
  }
  await tap(candidate.x, candidate.y);
  const first = await evaluate(`(function(){
    var mon=document.getElementById("office-monitor");
    return {zoomed:window.__monitorZoomed(),running:window.__monitorRunningApps(),classes:Array.from(mon.classList).filter(function(c){return /^show-|^photobooth$/.test(c);}),roots:window.__monitorHtmlOverlayState().roots};
  })()`);
  check(first.zoomed && first.running.length === 0 && first.classes.length === 1 && first.classes[0] === "show-caps" && first.roots.length === 1 && first.roots[0] === "dock-grid",
    "the touch that zooms the monitor launches no newly revealed app", { candidate, first });

  const deliberate = await evaluate(`(function(){
    var cell=document.getElementById(${JSON.stringify(candidate.id)}),r=cell.getBoundingClientRect();
    return {x:r.left+r.width/2,y:r.top+r.height/2};
  })()`);
  await tap(deliberate.x, deliberate.y);
  const second = await evaluate(`(function(){return {running:window.__monitorRunningApps(),roots:window.__monitorHtmlOverlayState().roots};})()`);
  check(second.running.indexOf(candidate.app) !== -1,
    "a second deliberate touch still opens that monitor app", { candidate, second });

  const saverPoint = await evaluate(`(async function(){
    window.__closeTopMonitorApp();await new Promise(function(resolve){setTimeout(resolve,60);});
    var cell=document.getElementById(${JSON.stringify(candidate.id)}),r=cell.getBoundingClientRect();
    window.__startMonitorSaver("julia");await new Promise(function(resolve){setTimeout(resolve,60);});
    return {x:r.left+r.width/2,y:r.top+r.height/2,saver:document.getElementById("office-monitor").classList.contains("show-saver"),overlay:window.__monitorHtmlOverlayState().active};
  })()`);
  check(saverPoint.saver && !saverPoint.overlay, "the zoomed saver parks the promoted desktop before the touch", saverPoint);
  await trustedTouch(saverPoint.x, saverPoint.y);
  const saverWake = await evaluate(`(function(){var mon=document.getElementById("office-monitor"),cls=window.__monitorAppClasses[${JSON.stringify(candidate.app)}];return {awake:!mon.classList.contains("show-saver"),foreground:mon.classList.contains(cls),roots:window.__monitorHtmlOverlayState().roots};})()`);
  check(saverWake.awake && !saverWake.foreground && saverWake.roots.length === 1 && saverWake.roots[0] === "dock-grid",
    "the trusted touch that wakes the saver launches no newly exposed app", { candidate, saverWake });
  await trustedTouch(saverPoint.x, saverPoint.y);
  const saverSecond = await evaluate(`(function(){var mon=document.getElementById("office-monitor"),cls=window.__monitorAppClasses[${JSON.stringify(candidate.app)}];return {foreground:mon.classList.contains(cls),roots:window.__monitorHtmlOverlayState().roots};})()`);
  check(saverSecond.foreground,
    "the next trusted touch opens the app after the saver wake", { candidate, saverSecond });
  check(exceptions.length === 0, "zoom handoff and compatibility clicks raise no page exceptions", exceptions);

  ws.close();
  cleanup();
  if (failures) process.exit(1);
  console.log("All monitor zoom touch checks passed.");
})().catch(error => {
  console.error(error && error.stack || error);
  cleanup();
  process.exit(1);
});
