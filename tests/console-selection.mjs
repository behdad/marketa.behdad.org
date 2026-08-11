#!/usr/bin/env node
"use strict";

import fs from "fs";
import http from "http";
import path from "path";
import { spawn } from "child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const PORT = 9200 + Math.floor(Math.random() * 700);
const SCRATCH = fs.mkdtempSync(path.join(process.env.CONSOLE_TEST_TMPDIR || "/tmp", "console-selection-"));
const PROFILE = path.join(SCRATCH, "profile");
fs.mkdirSync(PROFILE);
const CHROME = process.env.CHROME_BIN || "google-chrome";
const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--no-sandbox", "--mute-audio",
  "--remote-debugging-port=" + PORT, "--user-data-dir=" + PROFILE,
  "file://" + path.join(ROOT, "loft-day.html") + "?t=" + Date.now()
], { stdio: "ignore", env: { ...process.env, TMPDIR: SCRATCH } });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const get = pathname => new Promise((resolve, reject) => {
  http.get("http://127.0.0.1:" + PORT + pathname, response => {
    let data = "";
    response.on("data", chunk => { data += chunk; });
    response.on("end", () => resolve(JSON.parse(data)));
  }).on("error", reject);
});
const cleanup = async () => {
  if (chrome.exitCode === null) {
    try { chrome.kill(); } catch {}
    await Promise.race([
      new Promise(resolve => chrome.once("exit", resolve)),
      sleep(1000)
    ]);
  }
  try { fs.rmSync(SCRATCH, { recursive: true, force: true }); } catch {}
};
let failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("Console scrollback selection:");
try {
  let target;
  for (let i = 0; i < 80; i++) {
    try { target = (await get("/json")).find(item => item.type === "page" && item.url.includes("loft-day.html")); } catch {}
    if (target) break;
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
  await send("Emulation.setDeviceMetricsOverride", { width: 1000, height: 900, deviceScaleFactor: 1, mobile: false });
  const evaluate = expression => send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }).then(result => {
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  });
  for (let i = 0; i < 80; i++) {
    if (await evaluate("typeof window.__openMonitorApp==='function'")) break;
    await sleep(250);
  }
  await evaluate(`(function(){
    var gate=document.getElementById("loft-recovery-gate");if(gate){var skip=gate.querySelector(".loft-recovery-btn:not(.primary)");if(skip)skip.click();}
    if(window.__endAttract)window.__endAttract();window.__goToStage("office");
    var mon=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio");tower.classList.add("on");mon.classList.add("here","screen-on","show-caps");
    window.__monitorZoomIn();window.__openMonitorApp("console");
  })()`);
  const surfaces = [
    { id: "monitor-console-out", mode: "show-console", label: "JavaScript Console" },
    { id: "monitor-py-out", mode: "show-python", label: "Python Console" },
    { id: "monitor-linux-out", mode: "show-linux", label: "Linux Console" },
    { id: "dropterm-out", mode: "drop", label: "drop-down JavaScript Console" }
  ];
  for (const surface of surfaces) {
    await evaluate(`(function(){
      var mon=document.getElementById("office-monitor");mon.classList.remove("show-console","show-python","show-linux");
      if(${JSON.stringify(surface.mode)}==="drop")window.__openDropTerm();else{window.__closeDropTerm();mon.classList.add(${JSON.stringify(surface.mode)});}
    })()`);
    await sleep(surface.mode === "drop" ? 500 : 50);
    const setup = await evaluate(`(function(){
      var out=document.getElementById(${JSON.stringify(surface.id)});out.replaceChildren();var line=document.createElement("div");line.id="selection-probe-line";line.textContent="alpha bravo charlie delta";out.appendChild(line);
      var range=document.createRange();range.selectNodeContents(line);var r=range.getBoundingClientRect(),y=r.top+r.height/2,x=r.left+1,x2=r.right-1;
      window.getSelection().removeAllRanges();return{x:x,y:y,x2:x2,userSelect:getComputedStyle(line).userSelect,hit:(document.elementFromPoint(x,y)||{}).id};
    })()`);
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x: setup.x, y: setup.y, button: "left", buttons: 1, clickCount: 1 });
    for (let step = 1; step <= 8; step++) {
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: setup.x + (setup.x2 - setup.x) * step / 8, y: setup.y, button: "left", buttons: 1 });
      await sleep(15);
    }
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: setup.x2, y: setup.y, button: "left", buttons: 0, clickCount: 1 });
    const selected = await evaluate("window.getSelection().toString()");
    check(setup.userSelect === "text" && setup.hit === "selection-probe-line", surface.label + " renders selectable backlog text", setup);
    check(selected.length > 0, "a real mouse drag selects " + surface.label + " backlog", selected);
  }
  ws.close();
} catch (error) {
  check(false, "selection probe completes", String(error && error.stack || error));
} finally {
  await cleanup();
}
console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All Console scrollback selection checks passed.");
