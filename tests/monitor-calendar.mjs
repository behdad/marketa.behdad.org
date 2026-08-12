#!/usr/bin/env node
"use strict";

// Real-paint regression for the zoomed monitor Calendar. A DOM-only probe missed the
// original failure: the live HTML was laid out correctly but an opaque SVG backing in
// the promoted controls layer painted over it. CDP supplies trusted coordinate clicks;
// a clipped screenshot proves that the screen contains more than the cream backing.
import fs from "fs";
import http from "http";
import os from "os";
import path from "path";
import zlib from "zlib";
import { spawn } from "child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const DEBUG_PORT = 10600 + Math.floor(Math.random() * 400);
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), "monitor-calendar-"));
const CHROME = process.env.CHROME_BIN || "google-chrome";
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const site = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const file = path.resolve(ROOT, "." + pathname);
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) {
    response.writeHead(403).end();
    return;
  }
  fs.createReadStream(file).on("error", () => response.writeHead(404).end()).pipe(response);
});
await new Promise((resolve, reject) => {
  site.once("error", reject);
  site.listen(0, "127.0.0.1", resolve);
});
const SITE_PORT = site.address().port;
const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--no-sandbox", "--mute-audio",
  "--remote-debugging-port=" + DEBUG_PORT, "--user-data-dir=" + PROFILE,
  "--window-size=1100,900", "--hide-scrollbars",
  "http://127.0.0.1:" + SITE_PORT + "/loft-day.html?monitor-calendar-probe=" + Date.now()
], { stdio: "ignore" });

const get = pathname => new Promise((resolve, reject) => {
  http.get("http://127.0.0.1:" + DEBUG_PORT + pathname, response => {
    let data = "";
    response.on("data", chunk => { data += chunk; });
    response.on("end", () => resolve(JSON.parse(data)));
  }).on("error", reject);
});
const cleanup = async () => {
  if (chrome.exitCode === null) {
    try { chrome.kill(); } catch {}
    await Promise.race([new Promise(resolve => chrome.once("exit", resolve)), sleep(1000)]);
  }
  await new Promise(resolve => site.close(resolve));
  try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {}
};
let failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail == null ? "" : "   [" + JSON.stringify(detail) + "]"));
  }
}

function paeth(a, b, c) {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : (pb <= pc ? b : c);
}
function pngStats(encoded) {
  const png = Buffer.from(encoded, "base64");
  let offset = 8, width = 0, height = 0, bitDepth = 0, colorType = 0;
  const idat = [];
  while (offset < png.length) {
    const length = png.readUInt32BE(offset), type = png.toString("ascii", offset + 4, offset + 8);
    const data = png.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      bitDepth = data[8]; colorType = data[9];
    } else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    offset += length + 12;
  }
  const bpp = colorType === 6 ? 4 : (colorType === 2 ? 3 : 0);
  if (bitDepth !== 8 || !bpp || !width || !height) throw new Error("unsupported screenshot PNG");
  const raw = zlib.inflateSync(Buffer.concat(idat)), stride = width * bpp;
  let input = 0, prior = Buffer.alloc(stride), nonCream = 0, sampled = 0;
  const cream = [248, 245, 236];
  for (let y = 0; y < height; y++) {
    const filter = raw[input++], row = Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const value = raw[input++], left = x >= bpp ? row[x - bpp] : 0, up = prior[x] || 0;
      const upperLeft = x >= bpp ? prior[x - bpp] : 0;
      row[x] = (value + (filter === 0 ? 0 : filter === 1 ? left : filter === 2 ? up :
        filter === 3 ? Math.floor((left + up) / 2) : filter === 4 ? paeth(left, up, upperLeft) : 0)) & 255;
    }
    for (let x = 0; x < width; x += 2) {
      const i = x * bpp;
      if (Math.max(Math.abs(row[i] - cream[0]), Math.abs(row[i + 1] - cream[1]),
          Math.abs(row[i + 2] - cream[2])) > 12) nonCream++;
      sampled++;
    }
    prior = row;
  }
  return { width, height, nonCreamRatio: nonCream / sampled };
}

console.log("Zoomed monitor Calendar:");
try {
  let target;
  for (let i = 0; i < 80; i++) {
    try {
      target = (await get("/json")).find(item => item.type === "page" && item.url.includes("monitor-calendar-probe"));
    } catch {}
    if (target) break;
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
  await send("Emulation.setDeviceMetricsOverride", { width: 1100, height: 900, deviceScaleFactor: 1, mobile: false });
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
  const fresh = await evaluate("document.documentElement.innerHTML.indexOf('entry.owner.id === &quot;monitor-calendar&quot;')!==-1 || document.documentElement.innerHTML.indexOf('entry.owner.id === \"monitor-calendar\"')!==-1");
  if (!fresh) throw new Error("freshness gate failed");
  await evaluate(`(function(){
    var gate=document.getElementById("loft-recovery-gate");
    if(gate){var skip=gate.querySelector(".loft-recovery-btn:not(.primary)");if(skip)skip.click();}
    if(window.__endAttract)window.__endAttract();window.__goToStage("office");
    var monitor=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio");
    tower.classList.add("on");monitor.setAttribute("class","here screen-on show-caps");
    window.__monitorZoomIn();window.__calendarTrusted=[];
    document.addEventListener("click",function(e){
      var owner=e.target&&e.target.closest&&e.target.closest("#monitor-desk-calendar,#monitor-cal-body,#monitor-cal-close");
      if(owner)window.__calendarTrusted.push({id:owner.id||owner.className,trusted:e.isTrusted});
    },true);
  })()`);
  await sleep(150);

  async function point(selector) {
    return evaluate(`(function(){var r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};})()`);
  }
  async function clickPoint(where) {
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: where.x, y: where.y });
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x: where.x, y: where.y, button: "left", buttons: 1, clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: where.x, y: where.y, button: "left", buttons: 0, clickCount: 1 });
  }
  async function calendarState() {
    return evaluate(`(function(){
      var body=document.getElementById("monitor-cal-body"),screen=document.getElementById("monitor-zoom-box"),
        owner=document.getElementById("monitor-calendar"),close=document.getElementById("monitor-cal-close"),
        city=body.querySelector(".calx-card-city"),fo=owner.querySelector("foreignObject"),
        cards=Array.from(body.querySelectorAll(".calx-card")),calendar=body.querySelector(".calx-cal"),
        panels=cards.concat(calendar?[calendar]:[]),cardsBox=body.querySelector(".calx-cards").getBoundingClientRect(),
        calendarBox=calendar.getBoundingClientRect(),panelStyles=panels.map(function(panel){return getComputedStyle(panel);}),
        br=body.getBoundingClientRect(),sr=screen.getBoundingClientRect(),cr=city&&city.getBoundingClientRect(),
        top=cr&&document.elementFromPoint(cr.left+cr.width/2,cr.top+cr.height/2),state=window.__monitorHtmlOverlayState();
      return{open:document.getElementById("office-monitor").classList.contains("show-calendar"),zoomed:window.__monitorZoomed(),
        roots:state.roots,ownerHome:owner.parentNode&&owner.parentNode.id,closeHome:close.parentNode&&close.parentNode.id,
        nativeBackings:owner.querySelectorAll(":scope > rect").length,bodyBackground:getComputedStyle(body).backgroundColor,
        panels:panels.length,rounded:panelStyles.every(function(style){return parseFloat(style.borderTopLeftRadius)>0;}),
        panelBackgrounds:panelStyles.map(function(style){return style.backgroundColor;}),
        columnGap:calendarBox.left-cardsBox.right,rightPadding:parseFloat(getComputedStyle(calendar).paddingRight),
        parked:getComputedStyle(fo).visibility,cardCount:body.querySelectorAll(".calx-card").length,
        dayCount:body.querySelectorAll(".calx-day").length,text:body.innerText.length,
        topPaint:!!(top&&top.closest&&top.closest("#monitor-cal-body")),title:(body.querySelector(".calx-title")||{}).textContent||"",
        body:[br.left,br.top,br.width,br.height],screen:[sr.left,sr.top,sr.width,sr.height],
        clip:{x:br.left,y:br.top,width:br.width,height:br.height,scale:1}};
    })()`);
  }
  async function raster(state) {
    const shot = await send("Page.captureScreenshot", { format: "png", clip: state.clip, captureBeyondViewport: false });
    return pngStats(shot.data);
  }

  await clickPoint(await point("#monitor-desk-calendar"));
  await sleep(180);
  const toolbar = await calendarState(), toolbarRaster = await raster(toolbar);
  check(toolbar.open && toolbar.zoomed && toolbar.roots.join(",") === "monitor-cal-body",
    "a trusted top-toolbar click opens Calendar without dropping monitor zoom", toolbar);
  check(toolbar.ownerHome === "office-monitor-screen-content" && toolbar.closeHome === "monitor-html-overlay-controls" && toolbar.parked === "hidden",
    "Calendar keeps its canonical owner parked and promotes only its close control", toolbar);
  check(toolbar.nativeBackings === 0 && toolbar.bodyBackground === "rgba(0, 0, 0, 0)" &&
      toolbar.panels === 3 && toolbar.rounded && toolbar.panelBackgrounds.every(function(color){return color === "rgb(255, 253, 248)";}) &&
      toolbar.columnGap > 1 && toolbar.rightPadding >= 0.7,
    "Calendar paints exactly three separated rounded cards with no outer cream sheet", toolbar);
  check(toolbar.cardCount === 2 && toolbar.dayCount >= 28 && toolbar.text > 80 && toolbar.topPaint,
    "Calendar content is populated and owns the top-painted point", toolbar);
  check(toolbar.body[2] > toolbar.screen[2] * 0.9 && toolbar.body[3] > toolbar.screen[3] * 0.9 &&
      toolbar.body[0] >= toolbar.screen[0] && toolbar.body[1] >= toolbar.screen[1],
    "Calendar body fills the authored monitor-screen geometry", toolbar);
  check(toolbarRaster.nonCreamRatio > 0.08,
    "Calendar raster contains substantial non-cream content instead of a blank surface", toolbarRaster);

  const next = await point("#monitor-cal-body .calx-nav:nth-of-type(3)");
  await clickPoint(next); await sleep(120);
  const advanced = await calendarState();
  check(advanced.title && advanced.title !== toolbar.title && advanced.topPaint,
    "a trusted Calendar navigation click advances the rendered month", { before: toolbar.title, after: advanced.title });
  await clickPoint(await point("#monitor-cal-close")); await sleep(120);
  let restored = await evaluate(`(function(){var s=window.__monitorHtmlOverlayState();return{calendar:document.getElementById("office-monitor").classList.contains("show-calendar"),zoomed:window.__monitorZoomed(),roots:s.roots};})()`);
  check(!restored.calendar && restored.zoomed && restored.roots.join(",") === "dock-grid",
    "trusted close returns to the zoomed dock", restored);

  await evaluate("window.__openMonitorApp('calendar')"); await sleep(160);
  const direct = await calendarState(), directRaster = await raster(direct);
  check(direct.open && direct.roots.join(",") === "monitor-cal-body" && direct.topPaint && directRaster.nonCreamRatio > 0.08,
    "the direct Calendar route has the same visible content and paint ownership", { state: direct, raster: directRaster });
  await clickPoint(await point("#monitor-cal-close")); await sleep(120);
  restored = await evaluate(`(function(){var s=window.__monitorHtmlOverlayState();return{calendar:document.getElementById("office-monitor").classList.contains("show-calendar"),zoomed:window.__monitorZoomed(),roots:s.roots,trusted:window.__calendarTrusted};})()`);
  check(!restored.calendar && restored.zoomed && restored.roots.join(",") === "dock-grid" &&
      restored.trusted.length >= 4 && restored.trusted.every(event => event.trusted),
    "toolbar, Calendar controls, and both closes are trusted and restore the dock", restored);
  check(exceptions.length === 0, "Calendar open, navigation, and close raise no page exceptions", exceptions);
  ws.close();
} catch (error) {
  check(false, "Calendar paint probe completes", String(error && error.stack || error));
} finally {
  await cleanup();
}

console.log("");
if (failures) {
  console.log(failures + " monitor Calendar check(s) failed.");
  process.exit(1);
}
console.log("All monitor Calendar checks passed.");
