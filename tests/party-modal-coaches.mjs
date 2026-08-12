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
  const clickPoint = async point => {
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: point[0], y: point[1] });
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x: point[0], y: point[1], button: "left", clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: point[0], y: point[1], button: "left", clickCount: 1 });
  };
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.addScriptToEvaluateOnNewDocument", { source:
    "window.__errs=[];window.addEventListener('error',function(e){window.__errs.push(String(e.message));});" +
    "window.addEventListener('unhandledrejection',function(e){window.__errs.push('rejection: '+String(e.reason));});"
  });
  await send("Emulation.setEmulatedMedia", { features: [
    { name: "prefers-reduced-motion", value: "reduce" }
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
    await send("Storage.clearDataForOrigin", {
      origin: "http://127.0.0.1:" + WEB_PORT, storageTypes: "all"
    });
    await send("Page.navigate", {
      url: "http://127.0.0.1:" + WEB_PORT + "/loft-day.html?party-modal=" +
        encodeURIComponent(spec.label) + "-" + Date.now() + "&date=2026-08-13"
    });
    let ready = false;
    for (let i = 0; i < 80 && !ready; i++) {
      try { ready = await evaluate("typeof window.__showPartySwitchCoach==='function' && document.readyState==='complete'"); } catch (_) {}
      if (!ready) await sleep(100);
    }
    if (!ready) throw new Error(spec.label + " page did not become ready");
    const first = await evaluate(`(async function () {
      var sleep=function(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});};
      var point=function(el){var r=el.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2];};
      var snap=function(overlay,target){
        var area=document.getElementById("hunt-fullscreen-area"),card=overlay.querySelector(".hunt-coach-card"),arrow=overlay.querySelector(".hunt-coach-arrow"),arrowBox=arrow.getBBox();
        var p=point(target),hit=document.elementFromPoint(p[0],p[1]),next=document.getElementById("hunt-next"),np=point(next),nh=document.elementFromPoint(np[0],np[1]);
        return {kind:window.__partyCoachModalKind(),card:card.getBoundingClientRect().toJSON(),area:area.getBoundingClientRect().toJSON(),
          target:p,unrelated:np,targetHit:hit&&((hit.closest&&hit.closest("#garden-lightswitch,#hunt-dollhouse-btn,.msg-badge,.msg-thumb")||hit).id||hit.className&&String(hit.className)),arrowBox:[arrowBox.x,arrowBox.y,arrowBox.width,arrowBox.height],
          unrelatedHit:nh&&nh.className&&String(nh.className),scrims:[].slice.call(overlay.querySelectorAll(".modal-coach-scrim")).map(function(el){return [getComputedStyle(el).backgroundColor,getComputedStyle(el).pointerEvents,el.getBoundingClientRect().toJSON()];})};
      };
      document.hasFocus=function(){return true;};
      localStorage.clear();
      var recoveryRestart=document.querySelector("#loft-recovery-gate .loft-recovery-btn:not(.primary)");
      if(recoveryRestart){recoveryRestart.click();await sleep(650);}
      if(window.__removeClickMe)window.__removeClickMe();
      if(window.__finishOpeningGuide)window.__finishOpeningGuide();
      if(window.__endAttract)window.__endAttract();
      if(window.__shareCloseModal)window.__shareCloseModal();
      await sleep(300);
      if(window.__resetPartyExitHint)window.__resetPartyExitHint();
      if(window.__setSeenRooms)window.__setSeenRooms(["kitchen","garden","cuddly"]);
      var area=document.getElementById("hunt-fullscreen-area");
      if(${spec.fullscreen}){await area.requestFullscreen();await sleep(120);if(window.__sizeFullscreenFrame)window.__sizeFullscreenFrame();}
      window.__setSecondRound(true,{releaseHeld:false});
      window.__setGardenParty(true,false);
      window.__goToStage("garden");
      await sleep(820);
      if(window.__shareCloseModal)window.__shareCloseModal();
      await sleep(300);
      if(window.__stopCueDrip)window.__stopCueDrip();
      if(window.__hideMessageThumb)window.__hideMessageThumb(true);
      if(window.__hideCallRing)window.__hideCallRing();
      var showResult=window.__showPartySwitchCoach();
      if(window.__refreshPartyBridgeCoaches)window.__refreshPartyBridgeCoaches();
      await sleep(850);
      var viewport=document.querySelector(".hunt-viewport"),switchCoach=document.getElementById("party-switch-coach");
      var first=snap(switchCoach,document.getElementById("garden-lightswitch"));
      first.showResult=showResult;first.party=!!window.__gardenPartyOn;first.room=window.__currentStageName;first.lifecycle=window.__partyLifecycleState();
      first.viewport=viewport.getBoundingClientRect().toJSON();
      if(innerWidth<=390&&window.__rebuildTapHalos){
        window.__rebuildTapHalos();
        var switchHalo=(window.__haloRegions().garden||[]).find(function(box){return box.el.id==="garden-lightswitch";});
        if(switchHalo){
          first.hitPx=[(switchHalo.x1-switchHalo.x0)*viewport.getBoundingClientRect().width/680,
            (switchHalo.y1-switchHalo.y0)*viewport.getBoundingClientRect().width/680];
        }
      }
      return first;
    })()`);
    await clickPoint(first.unrelated);
    await sleep(80);
    first.blocked = await evaluate("window.__gardenPartyOn&&window.__currentStageName==='garden'&&window.__partyCoachModalKind()==='switch'");
    await clickPoint(first.target);
    await sleep(3500);
    first.acted = await evaluate("!window.__gardenPartyOn&&window.__partyCoachModalKind()!=='switch'&&window.__partyLifecycleState().switchCoachRetired");
    if (!first.acted) throw new Error("switch target did not act: " + JSON.stringify(first));
    const second = await evaluate(`(async function () {
      var sleep=function(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});};
      var point=function(el){var r=el.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2];};
      if(window.__hideMessageThumb)window.__hideMessageThumb(true);
      if(window.__hideCallRing)window.__hideCallRing();
      if(window.__refreshPartyBridgeCoaches)window.__refreshPartyBridgeCoaches();
      await sleep(100);
      var area=document.getElementById("hunt-fullscreen-area"),overlay=document.getElementById("party-room-map-coach"),target=document.getElementById("hunt-dollhouse-btn"),card=overlay.querySelector(".hunt-coach-card"),p=point(target),hit=document.elementFromPoint(p[0],p[1]),next=document.getElementById("hunt-next"),np=point(next),nh=document.elementFromPoint(np[0],np[1]);
      return {kind:window.__partyCoachModalKind(),card:card.getBoundingClientRect().toJSON(),area:area.getBoundingClientRect().toJSON(),target:p,unrelated:np,
        targetHit:hit&&((hit.closest&&hit.closest("#hunt-dollhouse-btn")||hit).id||String(hit.className)),unrelatedHit:nh&&String(nh.className),
        scrims:[].slice.call(overlay.querySelectorAll(".modal-coach-scrim")).map(function(el){return [getComputedStyle(el).backgroundColor,getComputedStyle(el).pointerEvents,el.getBoundingClientRect().toJSON()];}),
        party:!!window.__gardenPartyOn,lifecycle:window.__partyLifecycleState(),seen:window.__seenRooms()};
    })()`);
    await clickPoint(second.unrelated);
    await sleep(80);
    second.blocked = await evaluate("document.getElementById('loft-dollhouse').hidden&&window.__currentStageName==='garden'&&window.__partyCoachModalKind()==='room-map'");
    await clickPoint(second.target);
    await sleep(120);
    second.acted = await evaluate("!document.getElementById('loft-dollhouse').hidden&&!window.__partyRoomMapCoachActive()&&window.__partyCoachModalKind()!== 'room-map'");
    const messageSetup = await evaluate("(async function(){var sleep=function(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});};window.__closeDollhouse();window.__resetPhoneApps();var delivered=window.__deliverPhoneMessage('cue_calendar');window.__setPartyRoomMapAttentionHold(false);await sleep(520);window.__hideMessageThumb(true);window.__updateMsgBadge();var repeated=window.__repeatMsgBadgeCoach();return {delivered:delivered,repeated:repeated,thread:window.__phoneMessageThread(),hold:window.__messageNotificationsHeld(),phone:window.__chatPhoneState(),summary:window.__chatMessagesSummary(),badge:!!document.querySelector('.msg-badge.show'),thumb:!!document.querySelector('.msg-thumb.show'),switchModal:window.__partySwitchCoachModalActive(),roomMap:window.__partyRoomMapCoachActive(),roster:window.__rosterOpen&&window.__rosterOpen(),hidden:document.hidden,focus:document.hasFocus(),cinematic:window.__cinematic};})()");
    await sleep(120);
    if (!await evaluate("!!document.querySelector('.msg-badge-coach.show')")) throw new Error("message coach did not show: " + JSON.stringify(messageSetup));
    const third = await evaluate(`(function () {
      var point=function(el){var r=el.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2];};
      var overlay=document.querySelector(".msg-badge-coach"),target=document.querySelector(".msg-badge"),area=document.getElementById("hunt-fullscreen-area"),card=overlay.querySelector(".hunt-coach-card"),p=point(target),hit=document.elementFromPoint(p[0],p[1]),next=document.getElementById("hunt-next"),np=point(next),nh=document.elementFromPoint(np[0],np[1]);
      window.__messageCoachChanges=0;window.addEventListener("loft:statechange",function(event){if(event.detail&&event.detail.id==="messages.coach")window.__messageCoachChanges++;});
      return {kind:window.__partyCoachModalKind(),card:card.getBoundingClientRect().toJSON(),area:area.getBoundingClientRect().toJSON(),target:p,unrelated:np,
        targetHit:hit&&((hit.closest&&hit.closest(".msg-badge")||hit).className&&String((hit.closest&&hit.closest(".msg-badge")||hit).className)),unrelatedHit:nh&&String(nh.className),
        scrims:[].slice.call(overlay.querySelectorAll(".modal-coach-scrim")).map(function(el){return [getComputedStyle(el).backgroundColor,getComputedStyle(el).pointerEvents,el.getBoundingClientRect().toJSON()];}),
        modalCount:document.querySelectorAll(".hunt-coach-overlay.modal-coach").length,partyModalCount:document.querySelectorAll(".party-onboarding-coach.modal-coach").length};
    })()`);
    await clickPoint(third.unrelated);
    await sleep(80);
    third.blocked = await evaluate("window.__currentStageName==='garden'&&window.__partyCoachModalKind()==='messages'&&!window.__chatPhoneState().open");
    await clickPoint(third.target);
    await sleep(120);
    third.acted = await evaluate("(function(){var p=window.__chatPhoneState();return p.open&&p.app==='messages'&&!window.__msgBadgeCoachModalActive()&&window.__messageCoachChanges===1;})()");
    const result = await evaluate(`(function(){var area=document.getElementById("hunt-fullscreen-area");return {errors:(window.__errs||[]).slice(),size:[innerWidth,innerHeight],fullscreen:document.fullscreenElement===area};})()`);
    const prefix = spec.label + ": ";
    check(result.errors.length === 0, prefix + "sequence has no page errors", result.errors);
    check(result.size[0] === spec.width, prefix + "runs at the requested viewport width", result.size);
    check(result.fullscreen === spec.fullscreen, prefix + "keeps the requested fullscreen state", result.fullscreen);
    check(third.modalCount === 4 && third.partyModalCount === 3,
      prefix + "only opening and the three Party onboarding coaches are modal", third);
    [first, second, third].forEach((step, index) => {
      const name = ["switch", "room-map", "messages"][index];
      check(step.kind === name && step.scrims.length === 4 && step.scrims.every(scrim =>
        scrim[0] === "rgba(69, 58, 49, 0.2)" && scrim[1] === "auto"),
      prefix + name + " coach visibly blocks around one live target island", step);
      check(step.card.width >= step.area.width * (name === "switch" && spec.width <= 390 ? .64 : .72) && step.card.height >= step.area.height * .35,
        prefix + name + " card occupies most of the shell", step);
      check(step.blocked, prefix + name + " coach blocks background controls", step);
      check(/garden-lightswitch|hunt-dollhouse-btn|msg-badge/.test(step.targetHit || ""),
        prefix + name + " target wins hit-testing above the scrim", step.targetHit);
      check(step.acted, prefix + name + " trusted target click performs its action and dismisses exactly once", step);
    });
    if (spec.width <= 390) {
      check(first.hitPx && first.hitPx[0] >= 27.5 && first.hitPx[1] >= 27.5,
        prefix + "keeps a fingertip-sized wall-switch target", first.hitPx);
    }
    check(first.card.left + first.card.width / 2 >= first.area.left + first.area.width * .5 &&
      first.arrowBox[2] >= (spec.width <= 390 ? 38 : first.area.width * .1),
      prefix + "centers the switch card and gives its arrow a clearly visible shaft", first);
  }
  ws.close();
} finally {
  await cleanup();
}

if (failures) process.exit(1);
console.log("Party modal coach sequence assertions passed.");
