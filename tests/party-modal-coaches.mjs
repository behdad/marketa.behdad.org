#!/usr/bin/env node
"use strict";

import child from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const WEB_PORT = 10400 + Math.floor(Math.random() * 500);
const CHROME_PORT = WEB_PORT + 501;
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), "party-modal-coaches-"));
const contentTypes = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg",
  ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".opus": "audio/ogg"
};
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const file = path.resolve(ROOT, "." + pathname);
  if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404); response.end("not found"); return;
  }
  response.setHeader("Content-Type", contentTypes[path.extname(file)] || "application/octet-stream");
  fs.createReadStream(file).pipe(response);
});
await new Promise(resolve => server.listen(WEB_PORT, "127.0.0.1", resolve));

const chrome = child.spawn(process.env.CHROME_BIN || "google-chrome", [
  "--headless=new", "--disable-gpu", "--no-sandbox", "--mute-audio", "--hide-scrollbars",
  "--remote-debugging-port=" + CHROME_PORT, "--user-data-dir=" + PROFILE,
  "--no-first-run", "--no-default-browser-check", "about:blank"
], { stdio: "ignore" });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const get = pathname => new Promise((resolve, reject) => {
  http.get("http://127.0.0.1:" + CHROME_PORT + pathname, response => {
    let data = "";
    response.on("data", chunk => data += chunk);
    response.on("end", () => { try { resolve(JSON.parse(data)); } catch (error) { reject(error); } });
  }).on("error", reject);
});
const cleanup = async () => {
  server.close();
  if (chrome.exitCode === null) chrome.kill("SIGTERM");
  await Promise.race([new Promise(resolve => chrome.once("exit", resolve)), sleep(1000)]);
  await sleep(100);
  try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch (_) {}
};

let failures = 0;
function check(ok, label, detail) {
  console.log("  " + (ok ? "✓" : "✗") + " " + label +
    (ok || detail == null ? "" : " — " + JSON.stringify(detail)));
  if (!ok) failures++;
}

try {
  let target;
  for (let i = 0; i < 80 && !target; i++) {
    try { target = (await get("/json")).find(item => item.type === "page"); } catch (_) {}
    if (!target) await sleep(100);
  }
  if (!target) throw new Error("Chrome page target did not appear");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  await new Promise(resolve => { ws.onopen = resolve; });
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    pending.get(message.id)(message.result || {});
    pending.delete(message.id);
  };
  const send = (method, params = {}) => new Promise(resolve => {
    const requestId = ++id;
    pending.set(requestId, resolve);
    ws.send(JSON.stringify({ id: requestId, method, params }));
  });
  const evaluate = expression => send("Runtime.evaluate", {
    expression, returnByValue: true, awaitPromise: true, userGesture: true
  }).then(result => {
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  });
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.addScriptToEvaluateOnNewDocument", { source:
    "window.__errs=[];window.addEventListener('error',function(e){window.__errs.push(String(e.message));});" +
    "window.addEventListener('unhandledrejection',function(e){window.__errs.push('rejection: '+String(e.reason));});"
  });
  await send("Emulation.setEmulatedMedia", { features: [
    { name: "prefers-reduced-motion", value: "no-preference" }
  ] });

  const cases = [
    { label: "desktop", width: 1100, height: 900, mobile: false, fullscreen: false },
    { label: "desktop fullscreen", width: 1100, height: 700, mobile: false, fullscreen: true },
    { label: "390px fullscreen", width: 390, height: 250, mobile: true, fullscreen: true }
  ];
  for (const spec of cases) {
    await send("Emulation.setDeviceMetricsOverride", {
      width: spec.width, height: spec.height, deviceScaleFactor: 1, mobile: spec.mobile,
      screenWidth: spec.width, screenHeight: spec.height
    });
    await send("Page.navigate", {
      url: "http://127.0.0.1:" + WEB_PORT + "/loft-day.html?party-modal=" +
        encodeURIComponent(spec.label) + "-" + Date.now()
    });
    let ready = false;
    for (let i = 0; i < 80 && !ready; i++) {
      try { ready = await evaluate("typeof window.__showPartySwitchCoach==='function' && document.readyState==='complete'"); } catch (_) {}
      if (!ready) await sleep(100);
    }
    if (!ready) throw new Error(spec.label + " page did not become ready");
    const result = await evaluate(`(async function () {
      var sleep=function(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});};
      var fire=function(node,type){node.dispatchEvent(new MouseEvent(type||"click",{bubbles:true,cancelable:true}));};
      document.hasFocus=function(){return true;};
      localStorage.clear();
      if(window.__removeClickMe)window.__removeClickMe();
      if(window.__finishOpeningGuide)window.__finishOpeningGuide();
      if(window.__endAttract)window.__endAttract();
      if(window.__resetPartyExitHint)window.__resetPartyExitHint();
      if(window.__setSeenRooms)window.__setSeenRooms(["kitchen","garden","cuddly"]);
      var area=document.getElementById("hunt-fullscreen-area");
      if(${spec.fullscreen}){await area.requestFullscreen();await sleep(120);if(window.__sizeFullscreenFrame)window.__sizeFullscreenFrame();}
      window.__setSecondRound(true,{releaseHeld:false});
      window.__setGardenParty(true,false);
      window.__goToStage("garden");
      await sleep(820);
      window.__showPartySwitchCoach();
      await sleep(100);
      var viewport=document.querySelector(".hunt-viewport"),switchCoach=document.getElementById("party-switch-coach");
      var switchCard=switchCoach.querySelector(".hunt-coach-card");
      var first={kind:window.__partyCoachModalKind(),card:switchCard.getBoundingClientRect().toJSON(),
        area:area.getBoundingClientRect().toJSON(),viewport:viewport.getBoundingClientRect().toJSON(),
        bg:getComputedStyle(switchCoach).backgroundColor,pointer:getComputedStyle(switchCoach).pointerEvents};
      if(innerWidth<=390&&window.__rebuildTapHalos){
        window.__rebuildTapHalos();
        var switchHalo=(window.__haloRegions().garden||[]).find(function(box){return box.el.id==="garden-lightswitch";});
        if(switchHalo){
          first.hitPx=[(switchHalo.x1-switchHalo.x0)*viewport.getBoundingClientRect().width/680,
            (switchHalo.y1-switchHalo.y0)*viewport.getBoundingClientRect().width/680];
        }
      }
      fire(document.getElementById("garden-lightswitch"));
      fire(document.getElementById("hunt-next"));
      document.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowRight",code:"ArrowRight",bubbles:true,cancelable:true}));
      await sleep(80);
      first.blocked=window.__gardenPartyOn&&window.__currentStageName==="garden"&&window.__partyCoachModalKind()==="switch";
      fire(switchCoach.querySelector(".hunt-coach-x"));
      first.dismissed=!window.__partyCoachModalActive()&&window.__gardenPartyOn;
      fire(document.getElementById("garden-lightswitch"));
      await sleep(3500);
      if(window.__hideMessageThumb)window.__hideMessageThumb(true);
      if(window.__hideCallRing)window.__hideCallRing();
      if(window.__refreshPartyBridgeCoaches)window.__refreshPartyBridgeCoaches();
      await sleep(100);
      var roomCoach=document.getElementById("party-room-map-coach"),roomCard=roomCoach.querySelector(".hunt-coach-card");
      var second={kind:window.__partyCoachModalKind(),card:roomCard.getBoundingClientRect().toJSON(),
        area:area.getBoundingClientRect().toJSON(),bg:getComputedStyle(roomCoach).backgroundColor,
        pointer:getComputedStyle(roomCoach).pointerEvents,party:!!window.__gardenPartyOn,
        lifecycle:window.__partyLifecycleState(),seen:window.__seenRooms()};
      fire(document.getElementById("hunt-dollhouse-btn"));
      fire(document.getElementById("hunt-next"));
      await sleep(80);
      second.blocked=document.getElementById("loft-dollhouse").hidden&&window.__currentStageName==="garden"&&
        window.__partyCoachModalKind()==="room-map";
      document.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",code:"Enter",bubbles:true,cancelable:true}));
      await sleep(40);
      second.dismissed=!window.__partyCoachModalActive();
      fire(document.getElementById("hunt-next"));
      await sleep(780);
      return {errors:(window.__errs||[]).slice(),size:[innerWidth,innerHeight],fullscreen:document.fullscreenElement===area,
        modalCount:document.querySelectorAll(".hunt-coach-overlay.modal-coach").length,
        partyModalCount:document.querySelectorAll(".party-onboarding-coach.modal-coach").length,
        first:first,second:second,roomAfterRelease:window.__currentStageName};
    })()`);
    const prefix = spec.label + ": ";
    check(result.errors.length === 0, prefix + "sequence has no page errors", result.errors);
    check(result.size[0] === spec.width, prefix + "runs at the requested viewport width", result.size);
    check(result.fullscreen === spec.fullscreen, prefix + "keeps the requested fullscreen state", result.fullscreen);
    check(result.modalCount === 3 && result.partyModalCount === 2,
      prefix + "only opening and the two Party onboarding coaches are modal", result);
    [result.first, result.second].forEach((step, index) => {
      const name = index ? "room-map" : "switch";
      check(step.kind === name && step.pointer === "auto" && step.bg === "rgba(69, 58, 49, 0.2)",
        prefix + name + " coach is visibly modal", step);
      check(step.card.width >= step.area.width * .72 && step.card.height >= step.area.height * .35,
        prefix + name + " card occupies most of the shell", step);
      check(step.blocked, prefix + name + " coach blocks background controls", step);
      check(step.dismissed, prefix + name + " coach acknowledges without triggering its target", step);
    });
    if (spec.width <= 390) {
      check(result.first.hitPx && result.first.hitPx[0] >= 27.5 && result.first.hitPx[1] >= 27.5,
        prefix + "keeps a fingertip-sized wall-switch target", result.first.hitPx);
    }
    check(!result.second.party && result.roomAfterRelease === "cuddly",
      prefix + "the ordered switch → room-map handoff releases ordinary navigation", result);
  }
  ws.close();
} finally {
  await cleanup();
}

if (failures) process.exit(1);
console.log("Party modal coach sequence assertions passed.");
