#!/usr/bin/env node
"use strict";

// Real CDP touch input for the two Classics games. Synthetic TouchEvent dispatch does not
// generate the browser's pointer/click compatibility sequence, so it cannot catch mobile-only
// hit-testing or gesture-cancellation failures.
import http from "http";
import fs from "fs";
import os from "os";
import path from "path";
import { spawn } from "child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const PORT = 9200 + Math.floor(Math.random() * 700);
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), "classics-touch-"));
const CHROME = process.env.CHROME_BIN || "google-chrome";
const source = path.join(ROOT, "loft-day.html");
const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--no-sandbox", "--mute-audio",
  "--remote-debugging-port=" + PORT, "--user-data-dir=" + PROFILE,
  "--hide-scrollbars", "file://" + source + "?t=" + Date.now()
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
    if (await evaluate("typeof window.__openMonitorApp==='function' && document.querySelector('#monitor-mines-wrap .mines-cell')")) break;
    await sleep(250);
  }
  const fresh = await evaluate("typeof window.__classicsView==='function' && /touch long-press/.test(document.documentElement.innerHTML)");
  if (!fresh) throw new Error("Freshness gate failed");

  await evaluate(`(function(){
    var gate=document.getElementById("loft-recovery-gate");
    if(gate)gate.querySelector(".loft-recovery-btn:not(.primary)").click();
    window.__endAttract();window.__goToStage("office");
    var mon=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio");
    tower.classList.add("on");mon.classList.add("here","screen-on","show-caps");
    window.__monitorZoomIn();window.__openMonitorApp("classics");
  })()`);
  await sleep(100);

  async function centre(selector) {
    return evaluate(`(function(){var r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:(r.left+r.right)/2,y:(r.top+r.bottom)/2,w:r.width,h:r.height};})()`);
  }
  async function tap(point) {
    await send("Input.dispatchTouchEvent", {
      type: "touchStart", touchPoints: [{ x: point.x, y: point.y, radiusX: 4, radiusY: 4, force: 1 }]
    });
    await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await sleep(80);
  }
  async function hold(point, duration = 650) {
    await send("Input.dispatchTouchEvent", {
      type: "touchStart", touchPoints: [{ x: point.x, y: point.y, radiusX: 4, radiusY: 4, force: 1 }]
    });
    await sleep(duration);
    await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await sleep(80);
  }
  async function drag(from, to) {
    await send("Input.dispatchTouchEvent", {
      type: "touchStart", touchPoints: [{ x: from.x, y: from.y, radiusX: 4, radiusY: 4, force: 1 }]
    });
    for (let step = 1; step <= 5; step++) {
      await send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{
          x: from.x + (to.x - from.x) * step / 5,
          y: from.y + (to.y - from.y) * step / 5,
          radiusX: 4, radiusY: 4, force: 1
        }]
      });
      await sleep(20);
    }
    const preview = await evaluate(`(function(){
      var ghost=document.querySelector(".sol-drag-ghost"),r=ghost&&ghost.getBoundingClientRect();
      var source=document.querySelector(".sol-drag-source"),sr=source&&source.getBoundingClientRect();
      return{present:!!ghost,rect:r&&[r.x,r.y,r.width,r.height],sourceRect:sr&&[sr.x,sr.y,sr.width,sr.height],
        hidden:!!source&&getComputedStyle(source).visibility==="hidden",cards:ghost&&ghost.querySelectorAll(".sol-card").length};
    })()`);
    if (process.env.CLASSICS_TOUCH_SHOT) {
      const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      fs.writeFileSync(process.env.CLASSICS_TOUCH_SHOT, Buffer.from(shot.data, "base64"));
    }
    await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await sleep(80);
    return preview;
  }

  const minesChoice = await centre(".classics-choice-mines");
  await tap(minesChoice);
  const minesView = await evaluate("window.__classicsView()");
  check(minesView === "mines", "a real touch tap opens Mines from the Classics chooser", minesView);

  const mine = await centre("#monitor-mines-wrap .mines-cell");
  const mineBefore = await evaluate("document.querySelectorAll('#monitor-mines-wrap .mines-cell.open').length");
  await tap(mine);
  const mineAfter = await evaluate("document.querySelectorAll('#monitor-mines-wrap .mines-cell.open').length");
  check(mine.w >= 20 && mine.h >= 20, "Mines cells render at a finger-usable size while the monitor is zoomed", mine);
  check(mineAfter > mineBefore, "a real touch tap reveals a Mines cell", { before: mineBefore, after: mineAfter });
  await evaluate("document.querySelector('.mines-face').click()");
  const flagCell = await centre("#monitor-mines-wrap .mines-cell");
  await hold(flagCell);
  const flagCount = await evaluate("document.querySelectorAll('#monitor-mines-wrap .mines-cell.flag').length");
  check(flagCount === 1, "one real Android long-press leaves exactly one Mines flag set", flagCount);

  const classicsBack = await centre("#monitor-mines-back");
  await tap(classicsBack);
  const chooserView = await evaluate("window.__classicsView()");
  check(chooserView === "chooser", "the separate Back touch target returns Mines to the chooser", chooserView);
  const solitaireChoice = await centre(".classics-choice-solitaire");
  await tap(solitaireChoice);
  const solitaireView = await evaluate("window.__classicsView()");
  check(solitaireView === "solitaire", "a real touch tap opens Solitaire from the Classics chooser", solitaireView);
  const stock = await centre("#monitor-solitaire-wrap .sol-stock");
  const stockBefore = await evaluate("window.__solitaireState().stock.length");
  await tap(stock);
  const stockAfter = await evaluate("window.__solitaireState().stock.length");
  check(stock.w >= 20 && stock.h >= 20, "Solitaire stock renders at a finger-usable size while the monitor is zoomed", stock);
  check(stockAfter === stockBefore - 1, "a real touch tap draws a Solitaire card", { before: stockBefore, after: stockAfter });
  await evaluate(`window.__solitaireLoadForTest({tableau:[
    [{suit:"s",rank:13}],
    [{suit:"h",rank:12}],
    [],[],[],[],[]
  ]})`);
  const dragSource = await centre('[data-sol-source="tableau"][data-sol-pile="1"]');
  const dragTarget = await centre('[data-sol-target="tableau"][data-sol-pile="0"]');
  const dragPreview = await drag(dragSource, dragTarget);
  const piles = await evaluate("window.__solitaireState().tableau.map(function(pile){return pile.length;})");
  check(dragPreview.present && dragPreview.hidden && dragPreview.cards === 1 &&
    Math.abs(dragPreview.rect[2] - dragPreview.sourceRect[2]) < 2 &&
    Math.abs(dragPreview.rect[3] - dragPreview.sourceRect[3]) < 2,
    "the actual-size Solitaire card lifts from its pile during a live Android touch drag", dragPreview);
  check(piles[0] === 2 && piles[1] === 0, "a real Android touch drag moves a legal Solitaire card", piles);

  ws.close();
  cleanup();
  if (failures) process.exit(1);
  console.log("All Classics touch checks passed.");
})().catch(error => {
  console.error(error && error.stack || error);
  cleanup();
  process.exit(1);
});
