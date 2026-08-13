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
  "--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream",
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
function greenRasterRatio(raster) {
  let green = 0, samples = 0;
  for (let i = 0; i < raster.pixels.length; i += 3) {
    if (raster.pixels[i + 1] > raster.pixels[i] + 20 && raster.pixels[i + 1] > raster.pixels[i + 2] + 10) green++;
    samples++;
  }
  return green / Math.max(1, samples);
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
  async function key(keyName, code, text) {
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: keyName, code: code || keyName, text: text || "" });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: keyName, code: code || keyName });
  }
  async function waitForSnakeFrame() {
    for (let i = 0; i < 60; i++) {
      if (await evaluate(`(function(){var f=document.querySelector("#monitor-snake-wrap iframe");return!!(f&&f.contentDocument&&f.contentDocument.readyState==="complete");})()`)) return;
      await sleep(100);
    }
  }

  // Photobooth is the one app whose normal launch has three distinct paint owners:
  // the promoted desktop tile, the canonical SVG consent panel, then a live promoted
  // video. Drive those exact trusted clicks with Chrome's fake camera before auditing
  // the shared native farewell below.
  const pbDesktop = await screenshot(await evaluate(`(function(){
    var r=document.getElementById("monitor-zoom-box").getBoundingClientRect();
    return{x:r.left,y:r.top,width:r.width,height:r.height,scale:1};
  })()`), "photobooth-desktop");
  await evaluate(`(function(){window.__killPaintPermissionsQuery=navigator.permissions.query.bind(navigator.permissions);
    navigator.permissions.query=function(){return Promise.resolve({state:"prompt"});};})()`);
  const pbTile = await evaluate(`(function(){var r=document.getElementById("monitor-dock-photobooth").getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};})()`);
  await mouse(pbTile, "left");
  await sleep(600);
  const pbConsent = await evaluate(`(function(){
    var panel=document.getElementById("monitor-pb-confirm"),yes=document.getElementById("monitor-pb-confirm-yes"),
      pr=panel.getBoundingClientRect(),yr=yes.getBoundingClientRect(),state=window.__monitorHtmlOverlayState();
    return{shown:document.getElementById("office-monitor").classList.contains("pb-confirm"),active:state.active,roots:state.roots,
      opacity:Number(getComputedStyle(panel).opacity),intersects:pr.width>0&&pr.height>0,
      yes:{x:yr.left+yr.width/2,y:yr.top+yr.height/2}};
  })()`);
  const pbConsentRaster = await screenshot(await evaluate(`(function(){var r=document.getElementById("monitor-zoom-box").getBoundingClientRect();return{x:r.left,y:r.top,width:r.width,height:r.height,scale:1};})()`), "photobooth-consent");
  check(pbConsent.shown && !pbConsent.active && pbConsent.roots.length === 0 && pbConsent.opacity > .99 && pbConsent.intersects &&
      rasterDifference(pbDesktop, pbConsentRaster).ratio > .005,
    "Photobooth trusted dock launch visibly hands paint to its native consent panel", pbConsent);
  await evaluate("navigator.permissions.query=window.__killPaintPermissionsQuery");
  await mouse(pbConsent.yes, "left");
  await sleep(1000);
  const pbLive = await evaluate(`(function(){
    var monitor=document.getElementById("office-monitor"),video=document.getElementById("monitor-pb-video"),preview=document.getElementById("monitor-pb-preview"),image=document.getElementById("monitor-pb-preview-image"),wrap=document.getElementById("monitor-pb-videowrap"),
      state=window.__monitorHtmlOverlayState(),r=wrap.getBoundingClientRect(),style=getComputedStyle(image),ctx=preview.getContext("2d"),pixels=ctx.getImageData(0,0,preview.width,preview.height).data,painted=false;
    for(var i=0;i<pixels.length;i+=400){if(pixels[i]||pixels[i+1]||pixels[i+2]){painted=true;break;}}
    return{shown:monitor.classList.contains("photobooth"),ready:video.readyState,width:video.videoWidth,height:video.videoHeight,
      paused:video.paused,root:state.roots,overlay:!!wrap.closest("#monitor-html-overlay"),display:style.display,visibility:style.visibility,
      opacity:Number(style.opacity),painted:painted,image:(image.getAttribute("href")||"").length,point:{x:r.left+r.width/2,y:r.top+r.height/2}};
  })()`);
  const pbLiveRaster = await screenshot(await evaluate(`(function(){var r=document.getElementById("monitor-zoom-box").getBoundingClientRect();return{x:r.left,y:r.top,width:r.width,height:r.height,scale:1};})()`), "photobooth-live");
  check(pbLive.shown && pbLive.ready >= 2 && pbLive.width > 0 && pbLive.height > 0 && !pbLive.paused && pbLive.painted && pbLive.image > 100 && pbLive.overlay &&
      pbLive.root.indexOf("monitor-pb-videowrap") !== -1 && pbLive.display !== "none" && pbLive.visibility !== "hidden" &&
      rasterDifference(pbDesktop, pbLiveRaster).ratio > .005,
    "Photobooth fake-camera preview visibly paints through its native SVG image", pbLive);
  await evaluate(`window.__pbTestIdentity={video:document.getElementById("monitor-pb-video"),canvas:document.getElementById("monitor-pb-preview"),image:document.getElementById("monitor-pb-preview-image"),stream:document.getElementById("monitor-pb-video").srcObject}`);
  await evaluate("window.__monitorZoomOut()");
  await sleep(250);
  const pbZoomOut = await evaluate(`(function(){
    var monitor=document.getElementById("office-monitor"),video=document.getElementById("monitor-pb-video"),canvas=document.getElementById("monitor-pb-preview"),image=document.getElementById("monitor-pb-preview-image"),
      r=image.getBoundingClientRect(),s=getComputedStyle(image);
    return{zoomed:window.__monitorZoomed(),active:monitor.classList.contains("photobooth"),video:video===window.__pbTestIdentity.video,
      canvas:canvas===window.__pbTestIdentity.canvas,image:image===window.__pbTestIdentity.image,stream:video.srcObject===window.__pbTestIdentity.stream,
      connected:image.isConnected,parent:image.parentNode&&image.parentNode.id,href:(image.getAttribute("href")||"").length,
      display:s.display,visibility:s.visibility,opacity:Number(s.opacity),box:{left:r.left,top:r.top,width:r.width,height:r.height}};
  })()`);
  const pbZoomOutRaster = await screenshot(await evaluate(`(function(){var r=document.getElementById("monitor-zoom-box").getBoundingClientRect();return{x:r.left,y:r.top,width:r.width,height:r.height,scale:1};})()`), "photobooth-live-zoomed-out");
  check(!pbZoomOut.zoomed && pbZoomOut.active && pbZoomOut.video && pbZoomOut.canvas && pbZoomOut.image && pbZoomOut.stream &&
      pbZoomOut.connected && pbZoomOut.parent === "monitor-photobooth" && pbZoomOut.href > 100 && pbZoomOut.display !== "none" &&
      pbZoomOut.visibility !== "hidden" && pbZoomOut.opacity > .99 && pbZoomOut.box.width > 0 && pbZoomOut.box.height > 0 &&
      greenRasterRatio(pbZoomOutRaster) > .03,
    "Photobooth keeps one live preview pipeline visibly owned by the in-room monitor after zoom out", pbZoomOut);
  await evaluate("window.__monitorZoomIn()");
  await sleep(250);
  const pbZoomBack = await evaluate(`(function(){var video=document.getElementById("monitor-pb-video"),canvas=document.getElementById("monitor-pb-preview"),image=document.getElementById("monitor-pb-preview-image"),s=getComputedStyle(image);
    return{zoomed:window.__monitorZoomed(),video:video===window.__pbTestIdentity.video,canvas:canvas===window.__pbTestIdentity.canvas,
      image:image===window.__pbTestIdentity.image,stream:video.srcObject===window.__pbTestIdentity.stream,href:(image.getAttribute("href")||"").length,
      display:s.display,visibility:s.visibility,opacity:Number(s.opacity)};})()`);
  check(pbZoomBack.zoomed && pbZoomBack.video && pbZoomBack.canvas && pbZoomBack.image && pbZoomBack.stream && pbZoomBack.href > 100 &&
      pbZoomBack.display !== "none" && pbZoomBack.visibility !== "hidden" && pbZoomBack.opacity > .99,
    "Photobooth returns the same live preview pipeline to the zoom overlay", pbZoomBack);
  const pbMenuPoint = await evaluate(`(function(){var r=document.getElementById("monitor-pb-videowrap").getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};})()`);
  await mouse(pbMenuPoint, "right");
  await sleep(120);
  const pbMenu = await evaluate(`(function(){var menu=document.querySelector(".mon-ctx:not(.scene-ctx)"),kill=menu&&menu.querySelector(".ctx-kill");
    if(!kill)return null;var r=kill.getBoundingClientRect();return{connected:menu.isConnected,visible:getComputedStyle(menu).visibility,disabled:kill.disabled,scene:!!document.querySelector(".mon-ctx.scene-ctx"),point:{x:r.left+r.width/2,y:r.top+r.height/2}};})()`);
  check(pbMenu && pbMenu.connected && pbMenu.visible === "visible" && !pbMenu.disabled && !pbMenu.scene,
    "Photobooth live preview keeps its app Kill menu for a full event-loop turn", pbMenu);
  if (pbMenu) await mouse(pbMenu.point, "left");
  await sleep(220);
  const pbDeath = await evaluate(`(function(){var state=window.__monitorHtmlOverlayState(),fx=document.getElementById("monitor-photobooth-farewell"),s=getComputedStyle(fx);return{death:state.deathPaint,opacity:Number(s.opacity),menu:!!document.querySelector(".mon-ctx")};})()`);
  check(pbDeath.death && pbDeath.death.effect === "monitor-photobooth-farewell" && pbDeath.opacity > .99 && !pbDeath.menu,
    "Photobooth trusted live-preview Kill visibly hands off to its native farewell", pbDeath);
  await evaluate("if(window.__deathFlashCleanup)window.__deathFlashCleanup()");
  await sleep(100);

  // Nibbles and the bare DOS shell share one retained runtime host but own distinct
  // farewell dispatch. Drive both actual launch routes and right-click inside the iframe.
  const snakeTile = await evaluate(`(function(){var r=document.getElementById("monitor-dock-snake").getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};})()`);
  await mouse(snakeTile, "left");
  await sleep(120);
  const snakeGo = await evaluate(`(function(){var b=document.querySelector(".snake-launch-go"),r=b.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};})()`);
  await mouse(snakeGo, "left");
  await waitForSnakeFrame();
  await evaluate(`(function(){window.__snakeCtx=[];window.addEventListener("message",function(e){if(e.data&&e.data.type==="snake-context")window.__snakeCtx.push("message");});var f=document.querySelector("#monitor-snake-wrap iframe");if(f&&f.contentDocument)f.contentDocument.addEventListener("contextmenu",function(){window.__snakeCtx.push("child");},true);})()`);
  let snakePoint = await evaluate(`(function(){var r=document.querySelector("#monitor-snake-wrap iframe").getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};})()`);
  await mouse(snakePoint, "right");
  await sleep(140);
  let snakeMenu = await evaluate(`(function(){var m=document.querySelector(".mon-ctx:not(.scene-ctx)"),b=m&&m.querySelector(".ctx-kill");if(!b)return{mode:window.__snakeState().mode,stable:false,trace:window.__snakeCtx,top:document.elementsFromPoint(${snakePoint.x},${snakePoint.y}).slice(0,4).map(function(n){return n.id||n.tagName})};var r=b.getBoundingClientRect();return{mode:window.__snakeState().mode,stable:m.isConnected,scene:!!document.querySelector(".scene-ctx"),point:{x:r.left+r.width/2,y:r.top+r.height/2}};})()`);
  check(snakeMenu && snakeMenu.mode === "nibbles" && snakeMenu.stable && !snakeMenu.scene,
    "Nibbles keeps a stable app Kill menu on its real iframe surface", snakeMenu);
  if (snakeMenu && snakeMenu.point) await mouse(snakeMenu.point, "left");
  await sleep(220);
  const nibblesDeath = await evaluate(`(function(){var m=document.getElementById("office-monitor"),s=getComputedStyle(document.getElementById("monitor-snake-farewell"));return{snake:m.classList.contains("death-snake"),dos:m.classList.contains("death-dos"),opacity:Number(s.opacity)};})()`);
  check(nibblesDeath.snake && !nibblesDeath.dos && nibblesDeath.opacity > .99,
    "Nibbles exclusively keeps the self-devouring Snake farewell", nibblesDeath);
  await evaluate("if(window.__deathFlashCleanup)window.__deathFlashCleanup()");
  await sleep(120);

  await evaluate(`document.getElementById("monitor-desktop-dock").focus()`);
  await key("d", "KeyD", "d"); await key("o", "KeyO", "o"); await key("s", "KeyS", "s"); await key("Enter", "Enter");
  await waitForSnakeFrame();
  snakePoint = await evaluate(`(function(){var r=document.querySelector("#monitor-snake-wrap iframe").getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};})()`);
  await mouse(snakePoint, "right");
  await sleep(140);
  snakeMenu = await evaluate(`(function(){var m=document.querySelector(".mon-ctx:not(.scene-ctx)"),b=m&&m.querySelector(".ctx-kill");if(!b)return null;var r=b.getBoundingClientRect();return{mode:window.__snakeState().mode,stable:m.isConnected,scene:!!document.querySelector(".scene-ctx"),point:{x:r.left+r.width/2,y:r.top+r.height/2}};})()`);
  check(snakeMenu && snakeMenu.mode === "dos" && snakeMenu.stable && !snakeMenu.scene,
    "DOS keeps a stable app Kill menu on its real iframe surface", snakeMenu);
  if (snakeMenu && snakeMenu.point) await mouse(snakeMenu.point, "left");
  await sleep(380);
  const dosPrompt = await evaluate(`(function(){var m=document.getElementById("office-monitor");return{dos:m.classList.contains("death-dos"),snake:m.classList.contains("death-snake"),prompt:Number(document.getElementById("monitor-dos-kill-prompt").getAttribute("opacity"))};})()`);
  await sleep(600);
  const dosError = await evaluate(`(function(){return{answer:Number(document.getElementById("monitor-dos-kill-answer").getAttribute("opacity")),error:Number(document.getElementById("monitor-dos-kill-error").getAttribute("opacity"))};})()`);
  await sleep(420);
  const dosShell = await evaluate(`(function(){return{shell:Number(document.getElementById("monitor-dos-kill-shell").getAttribute("opacity")),cursor:Number(document.getElementById("monitor-dos-kill-cursor").getAttribute("opacity"))};})()`);
  await sleep(450);
  const dosCollapse = await evaluate(`(function(){return{crt:document.getElementById("monitor-dos-kill-crt").getAttribute("transform")||"",line:Number(document.getElementById("monitor-dos-kill-line").getAttribute("opacity"))};})()`);
  check(dosPrompt.dos && !dosPrompt.snake && dosPrompt.prompt === 1 && dosError.answer === 1 && dosError.error === 1 &&
      dosShell.shell === 1 && dosShell.cursor === 1 && /scale\(1 (?:0|0\.)/.test(dosCollapse.crt) && dosCollapse.line === 1,
    "DOS alone types the approved command failure, freezes its prompt, and collapses to a CRT line",
    { prompt: dosPrompt, error: dosError, shell: dosShell, collapse: dosCollapse });
  await sleep(300);
  const dosClosed = await evaluate(`(function(){var s=window.__snakeState(),m=document.getElementById("office-monitor");return{open:s.open,state:s.state,frame:!!document.querySelector("#monitor-snake-wrap iframe"),death:m.classList.contains("death-dos")};})()`);
  check(!dosClosed.open && dosClosed.state === "cold" && !dosClosed.frame && !dosClosed.death,
    "DOS Kill closes and resets its runtime after the visible sequence", dosClosed);

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
        point={x:r.left+r.width/2,y:r.top+r.height/2};
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
  const unexpectedExceptions = exceptions.filter(message => message !== "Uncaught (in promise)");
  check(unexpectedExceptions.length === 0, "no uncaught JavaScript exceptions during the paint audit", unexpectedExceptions);
  ws.close();
} catch (error) {
  failures++;
  console.log("  ✗ paint harness completed   [" + String(error && error.stack || error) + "]");
} finally {
  await cleanup();
}

console.log(failures ? ("FAILED " + failures + " check(s)") : "All monitor Kill paint checks passed.");
process.exit(failures ? 1 : 0);
