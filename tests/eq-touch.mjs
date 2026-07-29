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
  "--hide-scrollbars", "file://" + path.join(ROOT, "rsvp.html") + "?t=" + Date.now() + "#play"
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
      target = targets.find(item => item.type === "page" && item.url.includes("rsvp.html"));
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
  const fresh = await evaluate("/openMeqTouchContext/.test(document.documentElement.innerHTML)");
  if (!fresh) throw new Error("Freshness gate failed");

  await evaluate(`(function(){
    var gate=document.getElementById("loft-recovery-gate");
    if(gate)gate.querySelector(".loft-recovery-btn:not(.primary)").click();
    window.__endAttract();window.goToStage("office");
    var mon=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio");
    tower.classList.add("on");mon.classList.add("here","screen-on","show-caps","show-nowplaying");
    window.__monitorZoomIn();
  })()`);
  await sleep(100);
  const band = await evaluate(`(function(){
    var el=document.querySelector("#monitor-manual-eq .meq-band rect[fill=transparent]");
    var r=el.getBoundingClientRect();
    return{x:r.left+r.width/2,top:r.top+1,mid:r.top+r.height/2,w:r.width,h:r.height};
  })()`);
  const touchStart = y => send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: band.x, y, radiusX: 4, radiusY: 4, force: 1 }]
  });
  const touchEnd = () => send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });

  await touchStart(band.top);
  await touchEnd();
  await sleep(80);
  const adjusted = await evaluate("JSON.parse(localStorage.getItem('songEqBands')||'[]')[0]");
  check(adjusted > 0, "a real touch still adjusts an EQ band", adjusted);

  await touchStart(band.mid);
  await sleep(360);
  await touchEnd();
  await sleep(80);
  const menu = await evaluate(`(function(){
    var m=document.querySelector(".mon-ctx"),reset=m&&m.querySelector(".ctx-reset-eq"),kill=m&&m.querySelector(".ctx-kill");
    return{open:!!m,reset:!!reset,resetEnabled:!!reset&&!reset.disabled,kill:!!kill};
  })()`);
  check(menu.open && menu.reset && menu.resetEnabled && menu.kill,
    "the EQ menu remains open after the held finger is released", menu);

  const reset = await evaluate(`(function(){
    var b=document.querySelector(".mon-ctx .ctx-reset-eq");if(b)b.click();
    return JSON.parse(localStorage.getItem("songEqBands")||"[]");
  })()`);
  check(reset.length === 6 && reset.every(value => value === 0),
    "Reset EQ from the touch-opened menu flattens every band", reset);

  ws.close();
  cleanup();
  if (failures) process.exit(1);
  console.log("All EQ touch checks passed.");
})().catch(error => {
  console.error(error && error.stack || error);
  cleanup();
  process.exit(1);
});
