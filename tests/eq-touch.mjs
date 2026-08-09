#!/usr/bin/env node
"use strict";

// Trusted Android-style touch for the monitor EQ. A synthetic contextmenu proves the menu
// contents, but not the transformed SVG long-press sequence that must summon it on a phone.
import http from "http";
import fs from "fs";
import os from "os";
import path from "path";
import { spawn } from "child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const PORT = 9900 + Math.floor(Math.random() * 500);
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), "eq-touch-"));
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
  const send = (method, params = {}) => new Promise(resolve => {
    const requestId = ++id;
    pending[requestId] = resolve;
    ws.send(JSON.stringify({ id: requestId, method, params }));
  });
  await new Promise(resolve => { ws.onopen = resolve; });
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
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
    if (await evaluate("typeof window.__resetManualEq==='function'")) break;
    await sleep(250);
  }
  const fresh = await evaluate("/stationary one-finger hold/.test(document.documentElement.innerHTML)");
  if (!fresh) throw new Error("Freshness gate failed");

  await evaluate(`(function(){
    var gate=document.getElementById("loft-recovery-gate");
    if(gate)gate.querySelector(".loft-recovery-btn:not(.primary)").click();
    window.__endAttract();window.goToStage("office");
    var mon=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio");
    tower.classList.add("on");mon.classList.add("here","screen-on","show-caps","show-nowplaying");
    window.__monitorZoomIn();
  })()`);
  await send("Runtime.evaluate", {
    expression: `document.getElementById("hunt-fullscreen-area").requestFullscreen()`,
    awaitPromise: true, userGesture: true
  });
  await sleep(100);
  const fullscreen = await evaluate(`(function(){
    var area=document.getElementById("hunt-fullscreen-area");
    return{active:document.fullscreenElement===area,host:document.fullscreenElement&&document.fullscreenElement.id};
  })()`);
  check(fullscreen.active, "the touch probe runs in real browser fullscreen", fullscreen);
  const band = await evaluate(`(function(){
    var els=document.querySelectorAll("#monitor-manual-eq .meq-band rect[fill=transparent]");
    var r=els[0].getBoundingClientRect(),r2=els[1].getBoundingClientRect();
    return{x:r.left+r.width/2,x2:r2.left+r2.width/2,top:r.top+1,mid:r.top+r.height/2,w:r.width,h:r.height};
  })()`);
  const touchStart = (y, x = band.x) => send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y, radiusX: 4, radiusY: 4, force: 1 }]
  });
  const touchEnd = () => send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });

  await touchStart(band.top);
  await touchEnd();
  await sleep(80);
  const adjusted = await evaluate("JSON.parse(localStorage.getItem('songEqBands')||'[]')[0]");
  check(adjusted > 0, "a real touch still adjusts an EQ band", adjusted);

  await touchStart(band.mid, band.x2);
  await sleep(440);
  await touchEnd();
  await sleep(80);
  const menu = await evaluate(`(function(){
    var m=document.querySelector(".mon-ctx"),reset=m&&m.querySelector(".ctx-reset-eq"),kill=m&&m.querySelector(".ctx-kill");
    return{open:!!m,painted:!!(m&&document.fullscreenElement&&document.fullscreenElement.contains(m)),reset:!!reset,resetEnabled:!!reset&&!reset.disabled,kill:!!kill};
  })()`);
  check(menu.open && menu.painted && menu.reset && menu.resetEnabled && !menu.kill,
    "the touch EQ menu stays open with Reset but no destructive Kill", menu);

  const reset = await evaluate(`(function(){
    var b=document.querySelector(".mon-ctx .ctx-reset-eq");if(b)b.click();
    return JSON.parse(localStorage.getItem("songEqBands")||"[]");
  })()`);
  check(reset.length === 6 && reset.every(value => value === 0),
    "Reset EQ from the touch-opened menu flattens every band", reset);

  const player = await evaluate(`(function(){
    var el=document.getElementById("monitor-logo-nowplaying"),r=el.getBoundingClientRect();
    return{x:r.left+r.width/2,y:r.top+r.height/2};
  })()`);
  await send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: player.x, y: player.y, radiusX: 4, radiusY: 4, force: 1 }]
  });
  await sleep(440);
  await touchEnd();
  await sleep(80);
  const surfaceMenu = await evaluate(`(function(){
    var m=document.querySelector(".mon-ctx");
    return{open:!!m,painted:!!(m&&document.fullscreenElement&&document.fullscreenElement.contains(m)),kill:!!(m&&m.querySelector(".ctx-kill"))};
  })()`);
  check(surfaceMenu.open && surfaceMenu.painted && !surfaceMenu.kill,
    "a held touch on the app surface keeps the coarse-pointer menu non-destructive", surfaceMenu);

  ws.close();
  cleanup();
  if (failures) process.exit(1);
  console.log("All EQ touch checks passed.");
})().catch(error => {
  console.error(error && error.stack || error);
  cleanup();
  process.exit(1);
});
