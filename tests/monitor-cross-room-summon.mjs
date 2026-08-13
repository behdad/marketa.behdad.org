#!/usr/bin/env node
"use strict";

// Trusted regression for the `m` monitor summon. The shortcut changes rooms and zooms
// in during one key event, so exercise it repeatedly from several source-room pans and
// assert the promoted dock is the visible screen owner, not merely that show-caps is set.
import fs from "fs";
import http from "http";
import os from "os";
import path from "path";
import { spawn } from "child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const DEBUG_PORT = 12000 + Math.floor(Math.random() * 500);
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), "monitor-cross-room-"));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const site = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const file = path.resolve(ROOT, "." + pathname);
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) return response.writeHead(403).end();
  fs.createReadStream(file).on("error", () => response.writeHead(404).end()).pipe(response);
});
await new Promise((resolve, reject) => { site.once("error", reject); site.listen(0, "127.0.0.1", resolve); });
const SITE_PORT = site.address().port;
const chrome = spawn(process.env.CHROME_BIN || "google-chrome", [
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
async function cleanup() {
  if (chrome.exitCode === null) {
    chrome.kill();
    await Promise.race([new Promise(resolve => chrome.once("exit", resolve)), sleep(1000)]);
  }
  await new Promise(resolve => site.close(resolve));
  try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {}
}
let failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + "   [" + JSON.stringify(detail) + "]"); }
}

console.log("Cross-room trusted monitor summon:");
try {
  let target;
  for (let i = 0; i < 80; i++) {
    try { target = (await get("/json")).find(item => item.type === "page"); } catch {}
    if (target) break;
    await sleep(100);
  }
  if (!target) throw new Error("Chrome target unavailable");
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
  await send("Emulation.setDeviceMetricsOverride", { width: 1100, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: "http://127.0.0.1:" + SITE_PORT + "/loft-day.html?cross-room-monitor=" + Date.now() });
  await sleep(1000);
  const evaluate = expression => send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }).then(result => {
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  });
  const press = async (key, code) => {
    await send("Input.dispatchKeyEvent", { type: "keyDown", key, code, text: key.length === 1 ? key : undefined });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key, code });
  };
  for (let i = 0; i < 60; i++) {
    if (await evaluate("typeof window.__monitorHtmlOverlayState==='function'")) break;
    await sleep(100);
  }
  await evaluate(`(function(){
    var gate=document.getElementById("loft-recovery-gate");
    if(gate){var skip=gate.querySelector(".loft-recovery-btn:not(.primary)");if(skip)skip.click();}
    if(window.__endAttract)window.__endAttract();
    if(window.__unlockAllRooms)window.__unlockAllRooms();
    var tower=document.getElementById("office-pc-desk-trio"),monitor=document.getElementById("office-monitor");
    tower.classList.add("on");monitor.setAttribute("class","here screen-on show-caps");
    window.__goToStage("office");
  })()`);
  const sources = ["kitchen", "garden", "cuddly", "balcony"];
  for (let cycle = 0; cycle < 12; cycle++) {
    const source = sources[cycle % sources.length];
    await evaluate(`window.__goToStage(${JSON.stringify(source)})`);
    await press("m", "KeyM");
    await sleep(40);
    const pan = await evaluate(`({room:window.__currentStageName,zoomed:window.__monitorZoomed(),overlay:window.__monitorHtmlOverlayState().active,settling:window.__upperRoomKeyboardNavigationState().settling})`);
    check(pan.room === "office" && !pan.zoomed && !pan.overlay,
      source + " summon " + (cycle + 1) + " leaves the room pan as the first transform owner", pan);
    await sleep(860);
    const state = await evaluate(`(function(){
      var monitor=document.getElementById("office-monitor"),dock=document.querySelector("#monitor-html-overlay .dock-grid"),screen=document.getElementById("monitor-zoom-box"),overlay=window.__monitorHtmlOverlayState();
      var dr=dock&&dock.getBoundingClientRect(),sr=screen.getBoundingClientRect(),style=dock&&getComputedStyle(dock),hit=dr&&document.elementsFromPoint(dr.left+dr.width/2,dr.top+dr.height/2);
      return{room:window.__currentStageName,zoomed:window.__monitorZoomed(),far:document.getElementById("stage-office").classList.contains("stage-far"),
        active:overlay.active,roots:overlay.roots,owners:overlay.owners,monitor:Array.from(monitor.classList),tiles:dock?dock.querySelectorAll(".dock-app").length:0,
        visible:!!(style&&style.display!=="none"&&style.visibility!=="hidden"&&Number(style.opacity)>.99),box:dr&&{left:dr.left,top:dr.top,width:dr.width,height:dr.height},
        screen:{left:sr.left,top:sr.top,width:sr.width,height:sr.height},hit:!!(dock&&hit.some(function(node){return node===dock||dock.contains(node);}))};
    })()`);
    check(state.room === "office" && state.zoomed && !state.far && state.active && state.roots.join(",") === "dock-grid" &&
        state.owners.join(",") === "monitor-desktop-dock" && state.tiles >= 16 && state.visible && state.hit && state.box.width > 100,
      source + " summon " + (cycle + 1) + " paints the promoted dock", state);
  }
  const lowerSources = [
    { name: "Bedroom", stage: "office", flag: "__bedroomRoomOpen" },
    { name: "Dungeon", stage: "garden", state: "__princeState().basement" },
    { name: "Entrance", stage: "balcony", flag: "__entranceRoomOpen" }
  ];
  for (const source of lowerSources) {
    for (let cycle = 0; cycle < (source.name === "Bedroom" ? 6 : 2); cycle++) {
      await evaluate(`(function(){if(window.__monitorZoomOut)window.__monitorZoomOut();window.__goToStage(${JSON.stringify(source.stage)});if(window.__markLowerRoomDiscovered)window.__markLowerRoomDiscovered();})()`);
      await sleep(820);
      await press("ArrowDown", "ArrowDown");
      await sleep(320);
      const opened = await evaluate(source.flag ? `!!window.${source.flag}` : `!!(${source.state})`);
      check(opened, source.name + " summon " + (cycle + 1) + " starts from the visible lower room", opened);
      await press("m", "KeyM");
      await sleep(40);
      const returning = await evaluate(`(function(){var v=document.querySelector(".hunt-viewport"),s=window.__monitorHtmlOverlayState();return{room:window.__currentStageName,zoomed:window.__monitorZoomed(),overlay:s.active,floorPan:getComputedStyle(v).getPropertyValue("--floor-pan"),classes:Array.from(v.classList)};})()`);
      check(returning.room === "office" && !returning.zoomed && !returning.overlay,
        source.name + " summon " + (cycle + 1) + " lets the lower-floor return retain ownership", returning);
      await sleep(source.name === "Bedroom" ? 360 : 760);
      const state = await evaluate(`(function(){var dock=document.querySelector("#monitor-html-overlay .dock-grid"),s=window.__monitorHtmlOverlayState(),style=dock&&getComputedStyle(dock);return{room:window.__currentStageName,zoomed:window.__monitorZoomed(),active:s.active,roots:s.roots,owners:s.owners,tiles:dock?dock.querySelectorAll(".dock-app").length:0,visible:!!(style&&style.display!=="none"&&style.visibility!=="hidden"&&Number(style.opacity)>.99)};})()`);
      check(state.room === "office" && state.zoomed && state.active && state.roots.join(",") === "dock-grid" &&
          state.owners.join(",") === "monitor-desktop-dock" && state.tiles >= 16 && state.visible,
        source.name + " summon " + (cycle + 1) + " paints the promoted dock after both pans", state);
    }
  }
  for (let cycle = 0; cycle < 4; cycle++) {
    const source = sources[cycle % sources.length];
    await evaluate(`(function(){window.__goToStage("office");if(window.__monitorZoomOut)window.__monitorZoomOut();var pc=document.getElementById("office-pc-desk-trio");if(pc.classList.contains("on"))window.__loftControllers.computer.set(false);window.__goToStage(${JSON.stringify(source)});})()`);
    await press("m", "KeyM");
    let state;
    for (let attempt = 0; attempt < 36; attempt++) {
      await sleep(100);
      state = await evaluate(`(function(){var dock=document.querySelector("#monitor-html-overlay .dock-grid"),s=window.__monitorHtmlOverlayState();return{room:window.__currentStageName,zoomed:window.__monitorZoomed(),active:s.active,roots:s.roots,classes:Array.from(document.getElementById("office-monitor").classList),tiles:dock?dock.querySelectorAll(".dock-app").length:0,visible:!!(dock&&getComputedStyle(dock).visibility!=="hidden"&&Number(getComputedStyle(dock).opacity)>.99)};})()`);
      if (state.classes.includes("show-caps") && state.active) break;
    }
    check(state.room === "office" && state.zoomed && state.active && state.roots.join(",") === "dock-grid" && state.tiles >= 16 && state.visible,
      source + " cold-boot summon " + (cycle + 1) + " paints the promoted dock", state);
  }
  ws.close();
} catch (error) {
  failures++;
  console.log("  ✗ harness completed   [" + String(error && error.stack || error) + "]");
} finally {
  await cleanup();
}
console.log(failures ? ("FAILED " + failures + " check(s)") : "All cross-room monitor summon checks passed.");
process.exit(failures ? 1 : 0);
