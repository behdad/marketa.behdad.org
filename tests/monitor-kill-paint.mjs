#!/usr/bin/env node
"use strict";

// Real-paint regression for every shared monitor Kill overlay. A DOM-state test missed the
// original failure: death-* classes and tick state advanced correctly while the promoted,
// opaque HTML app still painted above #monitor-deathfx. CDP provides trusted context-menu
// and Kill clicks; clipped before/mid-gag rasters prove the visible screen actually changes.
import fs from "fs";
import http from "http";
import os from "os";
import path from "path";
import zlib from "zlib";
import { spawn } from "child_process";

const ROOT = process.env.WEDDING_TEST_ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const DEBUG_PORT = 11000 + Math.floor(Math.random() * 500);
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), "monitor-kill-paint-"));
const CHROME = process.env.CHROME_BIN || "google-chrome";
const CAPTURE_DIR = process.env.WEDDING_KILL_CAPTURE_DIR || "";
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
if (CAPTURE_DIR) fs.mkdirSync(CAPTURE_DIR, { recursive: true });

const cases = [
  ["Browser", "show-browser", "__killMonitorBrowser", "monitor-awsnap", "monitor-browser-wrap", "mon"],
  ["Calendar", "show-calendar", "__killMonitorCalendar", "monitor-calendar-farewell", "monitor-cal-body", "mon"],
  ["Call", "show-family", "__killMonitorFamily", "monitor-call-farewell", null, "mon"],
  ["Clock", "show-clock", "__killMonitorClock", "monitor-clock-farewell", "monitor-clock-wrap", "mon"],
  ["Code", "show-code", "__killMonitorCode", "monitor-qbasic", "monitor-code-wrap", "mon"],
  ["Console", "show-console", "__killMonitorConsole", "monitor-js", "monitor-console-wrap", "console"],
  ["Doom", "show-doom", "__killMonitorDoom", "monitor-fatality", "monitor-doom-wrap", "mon"],
  ["Life", "show-life", "__killMonitorLife", "monitor-life-farewell", "monitor-life-wrap", "mon"],
  ["Linux", "show-linux", "__killMonitorLinux", "monitor-bsod", "monitor-linux-wrap", "console"],
  ["Mail", "show-mail", "__killMonitorMail", "monitor-mail-farewell", "monitor-mail-wrap", "mon"],
  ["Music", "show-nowplaying", "__killMonitorMusic", "monitor-music-farewell", null, "mon"],
  ["Photobooth", "photobooth", "__killMonitorPhotobooth", "monitor-photobooth-farewell", "monitor-pb-videowrap", "mon"],
  ["Python", "show-python", "__killMonitorPython", "monitor-pymonty", "monitor-py-wrap", "console"],
  ["Snake", "show-snake", "__killMonitorSnake", "monitor-snake-farewell", "monitor-snake-wrap", "mon"],
  ["Tattoo", "show-tattoo", "__killMonitorTattoo", "monitor-tattoo-farewell", "monitor-tattoo-wrap", "mon"],
  ["Video", "show-video", "__killMonitorVideo", "monitor-video-farewell", "monitor-video-wrap", "mon"],
  ["Weather", "show-weather", "__killMonitorWeather", "monitor-weather-farewell", null, "mon"]
];

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
  "--window-size=1100,900", "--hide-scrollbars", "about:blank"
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
function decodePng(encoded) {
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
  const raw = zlib.inflateSync(Buffer.concat(idat)), stride = width * bpp, pixels = Buffer.alloc(width * height * 3);
  let input = 0, output = 0, prior = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[input++], row = Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const value = raw[input++], left = x >= bpp ? row[x - bpp] : 0, up = prior[x] || 0;
      const upperLeft = x >= bpp ? prior[x - bpp] : 0;
      row[x] = (value + (filter === 0 ? 0 : filter === 1 ? left : filter === 2 ? up :
        filter === 3 ? Math.floor((left + up) / 2) : filter === 4 ? paeth(left, up, upperLeft) : 0)) & 255;
    }
    for (let x = 0; x < width; x++) {
      const i = x * bpp;
      pixels[output++] = row[i]; pixels[output++] = row[i + 1]; pixels[output++] = row[i + 2];
    }
    prior = row;
  }
  return { width, height, pixels };
}
function rasterDifference(before, after) {
  if (before.width !== after.width || before.height !== after.height) return { ratio: 1, mean: 255 };
  let changed = 0, delta = 0, samples = 0;
  for (let i = 0; i < before.pixels.length; i += 12) {
    const d = Math.max(Math.abs(before.pixels[i] - after.pixels[i]),
      Math.abs(before.pixels[i + 1] - after.pixels[i + 1]),
      Math.abs(before.pixels[i + 2] - after.pixels[i + 2]));
    if (d > 14) changed++;
    delta += d; samples++;
  }
  return { ratio: changed / samples, mean: delta / samples };
}

console.log("Zoomed monitor Kill real-paint ownership:");
try {
  let target;
  for (let i = 0; i < 80; i++) {
    try { target = (await get("/json")).find(item => item.type === "page"); } catch {}
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
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
  const url = "http://127.0.0.1:" + SITE_PORT + "/loft-day.html?monitor-kill-paint=" + Date.now();
  await send("Page.navigate", { url });
  await sleep(1200);
  const evaluate = expression => send("Runtime.evaluate", {
    expression, returnByValue: true, awaitPromise: true
  }).then(result => {
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  });
  for (let i = 0; i < 80; i++) {
    if (await evaluate("typeof window.__monitorHtmlOverlayState==='function'")) break;
    await sleep(250);
  }
  const fresh = await evaluate("document.documentElement.innerHTML.indexOf('overlay-by-default')!==-1&&typeof window.__monitorHtmlOverlayState==='function'");
  if (!fresh) throw new Error("freshness gate failed");
  await evaluate(`(function(){
    var gate=document.getElementById("loft-recovery-gate");
    if(gate){var skip=gate.querySelector(".loft-recovery-btn:not(.primary)");if(skip)skip.click();}
    if(window.__endAttract)window.__endAttract();window.__goToStage("office");
    var monitor=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio");
    tower.classList.add("on");monitor.setAttribute("class","here screen-on show-caps");
    document.hasFocus=function(){return true;};window.__doomRunning=function(){return true;};
    window.__snakeRunning=function(){return true;};window.__pyRunning=function(){return true;};
    window.__lxRunning=function(){return true;};window.__killPaintTrusted=[];
    document.addEventListener("contextmenu",function(event){window.__killPaintTrusted.push(["contextmenu",event.isTrusted]);},true);
    document.addEventListener("click",function(event){if(event.target&&event.target.closest&&event.target.closest(".ctx-kill,.cc-kill"))window.__killPaintTrusted.push(["kill",event.isTrusted]);},true);
    window.__monitorZoomIn();
  })()`);
  await sleep(180);

  async function screenshot(clip, label) {
    const shot = await send("Page.captureScreenshot", { format: "png", clip, captureBeyondViewport: false });
    if (CAPTURE_DIR && label) fs.writeFileSync(path.join(CAPTURE_DIR, label + ".png"), Buffer.from(shot.data, "base64"));
    return decodePng(shot.data);
  }
  async function mouse(where, button) {
    const buttons = button === "right" ? 2 : 1;
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: where.x, y: where.y });
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x: where.x, y: where.y, button, buttons, clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: where.x, y: where.y, button, buttons: 0, clickCount: 1 });
  }

  for (const spec of cases) {
    const [name, appClass, hook, effectId, rootId, menuKind] = spec;
    const before = await evaluate(`(function(){
      if(window.__deathFlashCleanup)window.__deathFlashCleanup();
      document.querySelectorAll(".mon-ctx").forEach(function(node){node.remove();});
      var cc=document.querySelector(".console-ctx");if(cc)cc.classList.remove("show");
      var monitor=document.getElementById("office-monitor"),classes=window.__monitorAppClasses||{};
      Object.keys(classes).forEach(function(key){monitor.classList.remove(classes[key]);});
      Array.from(monitor.classList).forEach(function(cls){if(cls.indexOf("death-")===0)monitor.classList.remove(cls);});
      monitor.classList.add("here","screen-on","show-caps",${JSON.stringify(appClass)});
      window.__killPaintRoot=${rootId ? `document.getElementById(${JSON.stringify(rootId)})` : "null"};
      window.__killPaintTrusted.length=0;
      window.__monitorHtmlOverlayOpen();
      var state=window.__monitorHtmlOverlayState(),screen=document.getElementById("monitor-zoom-box").getBoundingClientRect();
      var target=window.__killPaintRoot||document.getElementById("office-monitor-bg"),r=target.getBoundingClientRect(),
        bezel=document.getElementById("office-monitor-bezel").getBoundingClientRect(),glass=document.getElementById("office-monitor-bg").getBoundingClientRect(),
        point=${menuKind === "console" ? "{x:r.left+r.width/2,y:r.top+r.height/2}" : "{x:bezel.left+Math.max(1,(glass.left-bezel.left)/2),y:(bezel.top+bezel.bottom)/2}"};
      return{active:state.active,roots:state.roots,rootOverlay:!!(window.__killPaintRoot&&window.__killPaintRoot.closest("#monitor-html-overlay")),
        point:point,clip:{x:screen.left,y:screen.top,width:screen.width,height:screen.height,scale:1},
        hook:typeof window[${JSON.stringify(hook)}]};
    })()`);
    await sleep(80);
    const beforeRaster = await screenshot(before.clip, name.toLowerCase() + "-before");
    await mouse(before.point, "right");
    await sleep(50);
    const kill = await evaluate(`(function(){var button=${menuKind === "console" ?
      'document.querySelector(".console-ctx.show .cc-kill")' : 'document.querySelector(".mon-ctx .ctx-kill")'};
      if(!button)return null;var r=button.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2,disabled:button.disabled};})()`);
    if (kill && !kill.disabled) await mouse(kill, "left");
    await sleep(220);
    const during = await evaluate(`(function(){
      var monitor=document.getElementById("office-monitor"),effect=document.getElementById(${JSON.stringify(effectId)}),
        screen=document.getElementById("monitor-zoom-box"),state=window.__monitorHtmlOverlayState(),style=getComputedStyle(effect),
        er=effect.getBoundingClientRect(),sr=screen.getBoundingClientRect(),root=window.__killPaintRoot;
      return{menuGone:!document.querySelector(".mon-ctx")&&!document.querySelector(".console-ctx.show"),
        trusted:window.__killPaintTrusted.slice(),deathPaint:state.deathPaint,active:state.active,roots:state.roots,
        effectParent:effect.parentNode&&effect.parentNode.id,opacity:Number(style.opacity),display:style.display,visibility:style.visibility,
        intersects:er.right>sr.left&&er.left<sr.right&&er.bottom>sr.top&&er.top<sr.bottom,
        rootSame:!root||root===document.getElementById(${JSON.stringify(rootId || "")}),
        rootHome:root&&root.parentNode&&root.parentNode.namespaceURI,
        rootOverlay:!!(root&&root.closest("#monitor-html-overlay")),deathClass:Array.from(monitor.classList).filter(function(cls){return cls.indexOf("death-")===0;})};
    })()`);
    const duringRaster = await screenshot(before.clip, name.toLowerCase() + "-kill");
    const raster = rasterDifference(beforeRaster, duringRaster);
    check(before.hook === "function" && !!kill && !kill.disabled,
      name + " exposes its exact enabled Kill hook to a trusted context menu", { before, kill });
    check(during.trusted.some(item => item[0] === "contextmenu" && item[1]) &&
        during.trusted.some(item => item[0] === "kill" && item[1]) && during.menuGone,
      name + " dismisses its menu before the trusted Kill paints", during);
    check(during.deathPaint && during.deathPaint.effect === effectId && !during.active && during.roots.length === 0 &&
        during.rootSame && !during.rootOverlay && (!rootId || during.rootHome === "http://www.w3.org/2000/svg"),
      name + " parks the promoted live node in its canonical SVG owner without replacing it", during);
    check(during.effectParent === "monitor-deathfx" && during.opacity > 0.99 && during.display !== "none" &&
        during.visibility !== "hidden" && during.intersects && during.deathClass.length === 1,
      name + " exposes the intended native farewell across the monitor screen", during);
    check(raster.ratio > 0.005 && raster.mean > 0.5,
      name + " changes the clipped real monitor raster before teardown", raster);
    await evaluate("if(window.__deathFlashCleanup)window.__deathFlashCleanup()");
    await sleep(80);
    const after = await evaluate(`(function(){var state=window.__monitorHtmlOverlayState(),monitor=document.getElementById("office-monitor");return{deathPaint:state.deathPaint,active:state.active,roots:state.roots,death:Array.from(monitor.classList).some(function(cls){return cls.indexOf("death-")===0;})};})()`);
    check(!after.deathPaint && !after.death && after.active && after.roots.join(",") === "dock-grid",
      name + " releases paint ownership only after close/reset, returning directly to the dock", after);
  }
  check(exceptions.length === 0, "no uncaught JavaScript exceptions during the paint audit", exceptions);
  ws.close();
} catch (error) {
  failures++;
  console.log("  ✗ paint harness completed   [" + String(error && error.stack || error) + "]");
} finally {
  await cleanup();
}

console.log(failures ? ("FAILED " + failures + " check(s)") : "All monitor Kill paint checks passed.");
process.exit(failures ? 1 : 0);
