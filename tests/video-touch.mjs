#!/usr/bin/env node
"use strict";

// Trusted Android-style touch regression for the monitor Video chooser and sliders.
import http from "http";
import fs from "fs";
import os from "os";
import path from "path";
import { spawn } from "child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const PORT = 10400 + Math.floor(Math.random() * 500);
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), "video-touch-"));
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
    width: 844, height: 390, deviceScaleFactor: 3, mobile: true
  });
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });

  const evaluate = expression => send("Runtime.evaluate", {
    expression, returnByValue: true, awaitPromise: true
  }).then(result => {
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  });
  for (let i = 0; i < 80; i++) {
    if (await evaluate("typeof window.__openMonitorApp==='function'")) break;
    await sleep(250);
  }
  const fresh = await evaluate("/var mobileRoute = null/.test(document.documentElement.innerHTML)");
  if (!fresh) throw new Error("Freshness gate failed");

  await evaluate(`(function(){
    var gate=document.getElementById("loft-recovery-gate");
    if(gate)gate.querySelector(".loft-recovery-btn:not(.primary)").click();
    window.__endAttract();window.__goToStage("office");
    var mon=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio");
    tower.classList.add("on");mon.classList.add("here","screen-on","show-caps");
    window.__openMonitorApp("video");window.__monitorZoomIn();
    var video=document.getElementById("monitor-video-el"),time=0;
    Object.defineProperty(video,"duration",{configurable:true,get:function(){return 100;}});
    Object.defineProperty(video,"currentTime",{configurable:true,get:function(){return time;},set:function(v){time=Number(v)||0;}});
  })()`);
  await send("Runtime.evaluate", {
    expression: `document.getElementById("hunt-fullscreen-area").requestFullscreen()`,
    awaitPromise: true, userGesture: true
  });
  await sleep(150);
  const chooserState = await evaluate(`(function(){
    var rose=document.querySelector("[data-video-track=rose]").getBoundingClientRect();
    document.querySelectorAll(".vid-choice").forEach(function(el){el.style.pointerEvents="none";});
    return{
      fullscreen:document.fullscreenElement&&document.fullscreenElement.id,
      view:document.getElementById("monitor-video-wrap").getAttribute("data-video-view"),
      rose:{x:rose.left+rose.width/2,y:rose.top+rose.height/2,width:rose.width}
    };
  })()`);
  check(chooserState.fullscreen === "hunt-fullscreen-area", "touch probe runs in browser fullscreen", chooserState);
  check(chooserState.view === "chooser" && chooserState.rose.width > 0, "three-card chooser is visible before selection", chooserState);

  async function tap(point) {
    await send("Input.dispatchTouchEvent", {
      type: "touchStart", touchPoints: [{ x: point.x, y: point.y, radiusX: 4, radiusY: 4, force: 1 }]
    });
    await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await sleep(50);
  }
  async function drag(track) {
    const x1 = track.left + track.width * 0.1;
    const x2 = track.left + track.width * 0.9;
    await send("Input.dispatchTouchEvent", {
      type: "touchStart", touchPoints: [{ x: x1, y: track.y, radiusX: 4, radiusY: 4, force: 1 }]
    });
    await send("Input.dispatchTouchEvent", {
      type: "touchMove", touchPoints: [{ x: x2, y: track.y, radiusX: 4, radiusY: 4, force: 1 }]
    });
    await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await sleep(50);
  }
  await tap(chooserState.rose);
  const picked = await evaluate(`(function(){
    return{track:window.__monitorVideoTrack(),view:document.getElementById("monitor-video-wrap").getAttribute("data-video-view")};
  })()`);
  check(picked.track === "rose" && picked.view === "player", "trusted touch selects a visible chooser card despite foreignObject mis-targeting", picked);
  await sleep(100);
  const playerState = await evaluate(`(function(){
    var wrap=document.getElementById("monitor-video-wrap");wrap.classList.remove("absent");
    if(window.__monitorHtmlOverlayFit)window.__monitorHtmlOverlayFit();
    var seek=document.querySelector(".vid-ctrl-bar").getBoundingClientRect();
    var vol=document.querySelector(".vid-ctrl-vol").getBoundingClientRect();
    document.querySelector(".vid-ctrl-bar").style.pointerEvents="none";
    document.querySelector(".vid-ctrl-vol").style.pointerEvents="none";
    return{
      seek:{left:seek.left,right:seek.right,y:seek.top+seek.height/2,width:seek.width},
      vol:{left:vol.left,right:vol.right,y:vol.top+vol.height/2,width:vol.width}
    };
  })()`);
  check(playerState.seek.width > 0 && playerState.vol.width > 0, "both player slider tracks are visible after selection", playerState);
  await drag(playerState.seek);
  await drag(playerState.vol);
  const result = await evaluate(`(function(){
    return{time:document.getElementById("monitor-video-el").currentTime,volume:window.__vidCtrlVolume()};
  })()`);
  check(result.time > 75, "trusted touch drag seeks the film", result);
  check(result.volume > 0.75, "trusted touch drag changes film volume", result);
  check(exceptions.length === 0, "chooser and slider touches raise no page exceptions", exceptions);

  ws.close();
  cleanup();
  if (failures) process.exit(1);
  console.log("All Video touch checks passed.");
})().catch(error => {
  console.error(error && error.stack || error);
  cleanup();
  process.exit(1);
});
