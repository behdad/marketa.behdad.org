#!/usr/bin/env node
"use strict";

import child from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SOURCE = fs.readFileSync(path.join(ROOT, "loft-day.html"), "utf8");
const WEB_PORT = 10400 + Math.floor(Math.random() * 500);
const CHROME_PORT = WEB_PORT + 501;
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), "party-modal-coaches-"));
const SCREENSHOT_DIR = process.env.PARTY_SCREENSHOT_DIR || "";
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
  try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch (_) {}
};

let failures = 0;
function check(ok, label, detail) {
  console.log("  " + (ok ? "✓" : "✗") + " " + label +
    (ok || detail == null ? "" : " — " + JSON.stringify(detail)));
  if (!ok) failures++;
}

check(!/disco-peek|__updateGardenDiscoPeek|peekTimer/.test(SOURCE),
  "legacy delayed disco-ball entrance plumbing is removed");

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
  const screenshot = async name => {
    if (!SCREENSHOT_DIR) return;
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    const shot = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, name + ".png"), Buffer.from(shot.data, "base64"));
  };
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.addScriptToEvaluateOnNewDocument", { source:
    "window.__errs=[];window.addEventListener('error',function(e){window.__errs.push(String(e.message));});" +
    "window.addEventListener('unhandledrejection',function(e){window.__errs.push('rejection: '+String(e.reason));});"
  });
  const cases = [
    { label: "desktop", width: 1100, height: 900, mobile: false, fullscreen: false, reduced: false },
    { label: "desktop fullscreen", width: 1100, height: 700, mobile: false, fullscreen: true, reduced: false },
    { label: "390px fullscreen", width: 390, height: 250, mobile: true, fullscreen: true, reduced: true }
  ];
  for (const spec of cases) {
    await send("Emulation.setEmulatedMedia", { features: [
      { name: "prefers-reduced-motion", value: spec.reduced ? "reduce" : "no-preference" }
    ] });
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
      try { ready = await evaluate("typeof window.__showPartyExplorationCoach==='function' && document.readyState==='complete'"); } catch (_) {}
      if (!ready) await sleep(100);
    }
    if (!ready) throw new Error(spec.label + " page did not become ready");

    const setup = await evaluate(`(async function () {
      var sleep=function(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});};
      var point=function(el){var r=el.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2];};
      document.hasFocus=function(){return true;};localStorage.clear();
      var restart=document.querySelector("#loft-recovery-gate .loft-recovery-btn:not(.primary)");
      if(restart){restart.click();await sleep(650);}if(window.__removeClickMe)window.__removeClickMe();
      if(window.__finishOpeningGuide)window.__finishOpeningGuide();if(window.__endAttract)window.__endAttract();
      if(window.__shareCloseModal)window.__shareCloseModal();if(window.__resetPartyExitHint)window.__resetPartyExitHint();
      if(window.__setSeenRooms)window.__setSeenRooms(["kitchen","garden","cuddly"]);
      var preBall=document.getElementById("garden-disco-ball"),phase1={opacity:getComputedStyle(preBall).opacity,pointer:getComputedStyle(preBall).pointerEvents};
      var area=document.getElementById("hunt-fullscreen-area");
      if(${spec.fullscreen}){await area.requestFullscreen();await sleep(120);if(window.__sizeFullscreenFrame)window.__sizeFullscreenFrame();}
      window.__setSecondRound(true,{releaseHeld:false});window.__goToStage("garden");await sleep(850);
      if(window.__stopCueDrip)window.__stopCueDrip();if(window.__hideMessageThumb)window.__hideMessageThumb(true);
      if(window.__hideCallRing)window.__hideCallRing();if(window.__resetPhoneApps)window.__resetPhoneApps();
      var ball=document.getElementById("garden-disco-ball"),spin=document.getElementById("garden-disco-ball-spin"),p=point(ball),hit=document.elementFromPoint(p[0],p[1]);
      var roster=document.querySelector(".roster-toggle"),br=ball.getBoundingClientRect(),rr=roster&&roster.getBoundingClientRect();
      return {phase1:phase1,ball:p,ballRect:ball.getBoundingClientRect().toJSON(),ballHit:hit&&!!hit.closest("#garden-disco-ball"),ballOpacity:getComputedStyle(ball).opacity,
        spin:getComputedStyle(spin).animationName,party:!!window.__gardenPartyOn,phase2:!!window.__secondRound,
        facetCount:ball.querySelectorAll(".db-facet").length,hasAttachment:!!ball.querySelector(".db-ceiling-plate"),rosterRect:rr&&rr.toJSON(),rosterClear:!!rr&&(br.right+4<=rr.left||rr.right+4<=br.left||br.bottom+4<=rr.top||rr.bottom+4<=br.top),
        noLegacyEntrance:typeof window.__updateGardenDiscoPeek==="undefined"&&!document.querySelector(".disco-peek")&&ball.getAnimations({subtree:true}).length===0,
        noSwitchCoach:!document.getElementById("party-switch-coach")&&typeof window.__showPartySwitchCoach==="undefined"};
    })()`);
    await clickPoint(setup.ball);
    await sleep(700);
    setup.started = await evaluate("window.__gardenPartyOn&&document.getElementById('stage-garden').classList.contains('garden-party')");
    setup.partyLook = await evaluate(`(function(){var spin=document.getElementById("garden-disco-ball-spin"),ball=document.getElementById("garden-disco-ball"),glint=ball.querySelector(".db-reflected-glint");document.documentElement.classList.remove("frame-rate-low");var normal={opacity:getComputedStyle(ball).opacity,name:getComputedStyle(spin).animationName,duration:getComputedStyle(spin).animationDuration,timing:getComputedStyle(spin).animationTimingFunction,glintName:getComputedStyle(glint).animationName,glintOpacity:getComputedStyle(glint).opacity,rect:ball.getBoundingClientRect().toJSON()};document.documentElement.classList.add("frame-rate-low");var low={name:getComputedStyle(spin).animationName,duration:getComputedStyle(spin).animationDuration,timing:getComputedStyle(spin).animationTimingFunction,opacity:getComputedStyle(ball).opacity,glintName:getComputedStyle(glint).animationName,glintOpacity:getComputedStyle(glint).opacity};document.documentElement.classList.remove("frame-rate-low");return {normal:normal,low:low};})()`);
    await screenshot(spec.label.replace(/\s+/g, "-") + "-party-reveal");

    const blockedMoment = await evaluate(`(async function(){
      var sleep=function(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});};
      window.__setPartyMomentState("bdCake",true);var activated=window.__showPartyExplorationCoach();
      window.__refreshPartyBridgeCoaches();await sleep(80);
      var hidden=!document.getElementById("party-room-map-coach").classList.contains("show");
      window.__setPartyMomentState("bdCake",false);await sleep(240);
      return {activated:activated,hidden:hidden,shown:document.getElementById("party-room-map-coach").classList.contains("show"),party:!!window.__gardenPartyOn};
    })()`);

    const map = await evaluate(`(async function(){
      var sleep=function(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});};
      var point=function(el){var r=el.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2];};
      var overlay=document.getElementById("party-room-map-coach"),target=document.getElementById("hunt-dollhouse-btn"),area=document.getElementById("hunt-fullscreen-area"),card=overlay.querySelector(".hunt-coach-card");
      var delivered=window.__deliverPhoneMessage("cue_calendar");await sleep(80);window.__hideMessageThumb(true);window.__updateMsgBadge();var repeated=window.__repeatMsgBadgeCoach();
      var p=point(target),hit=document.elementFromPoint(p[0],p[1]),scrimEls=[].slice.call(overlay.querySelectorAll(".modal-coach-scrim"));
      var bg=scrimEls.map(function(el){var r=el.getBoundingClientRect();return {r:r,area:r.width*r.height};}).sort(function(a,b){return b.area-a.area;})[0],np=[bg.r.left+bg.r.width/2,bg.r.top+bg.r.height/2],nh=document.elementFromPoint(np[0],np[1]);
      return {kind:window.__partyCoachModalKind(),card:card.getBoundingClientRect().toJSON(),area:area.getBoundingClientRect().toJSON(),target:p,unrelated:np,
        targetHit:hit&&!!hit.closest("#hunt-dollhouse-btn"),unrelatedHit:nh&&String(nh.className),delivered:delivered,repeated:repeated,
        messageQueued:window.__partyMessageRevealGateState().queued.indexOf("cue_calendar")!==-1&&!window.__phoneMessageThread().includes("cue_calendar")&&!document.querySelector(".msg-badge-coach.show"),copy:overlay.querySelector(".party-bridge-room-copy").textContent,
        scrims:[].slice.call(overlay.querySelectorAll(".modal-coach-scrim")).map(function(el){return [getComputedStyle(el).backgroundColor,getComputedStyle(el).pointerEvents];})};
    })()`);
    await clickPoint(map.unrelated); await sleep(60);
    map.blocked = await evaluate("document.getElementById('loft-dollhouse').hidden&&window.__currentStageName==='garden'&&window.__partyCoachModalKind()==='room-map'");
    await clickPoint(map.target); await sleep(180);
    map.acted = await evaluate("!document.getElementById('loft-dollhouse').hidden&&!window.__partyRoomMapCoachActive()&&window.__partyLifecycleState().roomMapCoachAcknowledged&&window.__gardenPartyOn");
    await evaluate("window.__closeDollhouse()");
    map.release = await evaluate(`(async function(){var until=Date.now()+5200;while(Date.now()<until&&!window.__partyMessageRevealGateState().complete)await new Promise(function(resolve){setTimeout(resolve,80);});var thumb=document.querySelector('.msg-thumb');var ball=document.getElementById('garden-disco-ball'),br=ball.getBoundingClientRect(),tr=thumb&&thumb.getBoundingClientRect();var overlap=!!tr&&Math.max(0,Math.min(br.right,tr.right)-Math.max(br.left,tr.left))*Math.max(0,Math.min(br.bottom,tr.bottom)-Math.max(br.top,tr.top));return {complete:window.__partyMessageRevealGateState().complete,thread:window.__phoneMessageThread(),preview:!!thumb&&thumb.classList.contains('show'),previewRect:tr&&tr.toJSON(),ballRect:br.toJSON(),previewClear:!overlap};})()`);
    await screenshot(spec.label.replace(/\s+/g, "-") + "-message-preview");
    await evaluate("window.__hideMessageThumb(true);window.__updateMsgBadge();window.__repeatMsgBadgeCoach()");
    await sleep(240);

    const message = await evaluate(`(function(){
      var point=function(el){var r=el.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2];};
      var overlay=document.querySelector(".msg-badge-coach"),target=document.querySelector(".msg-badge"),area=document.getElementById("hunt-fullscreen-area"),card=overlay&&overlay.querySelector(".hunt-coach-card");
      if(!overlay||!overlay.classList.contains("show"))return {missing:true};
      var p=point(target),hit=document.elementFromPoint(p[0],p[1]),scrimEls=[].slice.call(overlay.querySelectorAll(".modal-coach-scrim"));
      var bg=scrimEls.map(function(el){var r=el.getBoundingClientRect();return {r:r,area:r.width*r.height};}).sort(function(a,b){return b.area-a.area;})[0],np=[bg.r.left+bg.r.width/2,bg.r.top+bg.r.height/2],nh=document.elementFromPoint(np[0],np[1]);
      window.__messageCoachChanges=0;window.addEventListener("loft:statechange",function(event){if(event.detail&&event.detail.id==="messages.coach")window.__messageCoachChanges++;});
      return {kind:window.__partyCoachModalKind(),card:card.getBoundingClientRect().toJSON(),area:area.getBoundingClientRect().toJSON(),target:p,unrelated:np,
        targetHit:hit&&!!hit.closest(".msg-badge"),unrelatedHit:nh&&String(nh.className),
        scrims:[].slice.call(overlay.querySelectorAll(".modal-coach-scrim")).map(function(el){return [getComputedStyle(el).backgroundColor,getComputedStyle(el).pointerEvents];}),
        modalCount:document.querySelectorAll(".hunt-coach-overlay.modal-coach").length,partyModalCount:document.querySelectorAll(".party-onboarding-coach.modal-coach").length};
    })()`);
    if (!message.missing) {
      await clickPoint(message.unrelated); await sleep(60);
      message.blocked = await evaluate("window.__currentStageName==='garden'&&window.__partyCoachModalKind()==='messages'&&!window.__chatPhoneState().open");
      await clickPoint(message.target); await sleep(120);
      message.acted = await evaluate("(function(){var p=window.__chatPhoneState();return p.open&&p.app==='messages'&&!window.__msgBadgeCoachModalActive()&&window.__messageCoachChanges===1;})()");
    }

    const controls = await evaluate(`(async function(){
      var sleep=function(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});};
      var point=function(el){var r=el.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2];};
      if(window.__closePhoneModal)window.__closePhoneModal(true);await sleep(320);if(window.__setPartyMode)window.__setPartyMode(false,true,false);
      if(window.__resetPartyExitHint)window.__resetPartyExitHint();if(window.__setPartyMode)window.__setPartyMode(true,true,false);window.__goToStage("garden");await sleep(120);
      var ball=document.getElementById("garden-disco-ball"),bp=point(ball),bh=document.elementFromPoint(bp[0],bp[1]);
      return {ball:bp,ballHit:bh&&!!bh.closest("#garden-disco-ball"),beforeNight:document.getElementById("stage-garden").classList.contains("dusk"),
        relit:{opacity:getComputedStyle(ball).opacity,spin:getComputedStyle(document.getElementById("garden-disco-ball-spin")).animationName,rect:ball.getBoundingClientRect().toJSON(),noEntrance:!document.querySelector(".disco-peek")}};
    })()`);
    await clickPoint(controls.ball); await sleep(900);
    const stoppedState = await evaluate("(function(){var ball=document.getElementById('garden-disco-ball'),spin=document.getElementById('garden-disco-ball-spin'),s=window.__partyLifecycleState();return {fallback:!window.__gardenPartyOn&&s.roomMapCoachActive&&!s.roomMapCoachAcknowledged&&document.getElementById('party-room-map-coach').classList.contains('show'),opacity:getComputedStyle(ball).opacity,spin:getComputedStyle(spin).animationName,animations:ball.getAnimations({subtree:true}).map(function(a){return a.animationName||a.transitionProperty||'animation';})};})()");
    controls.fallback = stoppedState.fallback;
    const geometry = await evaluate(`(async function(){
      var sleep=function(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});};
      var ball=document.getElementById("garden-disco-ball"),snap=function(){return ball.getBoundingClientRect().toJSON();};
      var stopped=snap();window.__retirePartyRoomMapCoach();window.__setDayNight(!document.getElementById("stage-garden").classList.contains("dusk"),true);await sleep(80);
      var dayNight=snap();window.__goToStage("kitchen");await sleep(820);window.__goToStage("garden");await sleep(820);
      return {stopped:stopped,dayNight:dayNight,returned:snap(),noClass:!document.querySelector(".disco-peek"),noHook:typeof window.__updateGardenDiscoPeek==="undefined"};
    })()`);
    const wallData = await evaluate("(function(){var el=document.getElementById('garden-lightswitch'),r=el.getBoundingClientRect(),p=[r.left+r.width/2,r.top+r.height/2],h=document.elementFromPoint(p[0],p[1]);return {point:p,hit:h&&((h.id||'')+':'+(h.parentElement&&h.parentElement.id||'')),target:h&&!!h.closest('#garden-lightswitch')};})()");
    const wall = wallData.point;
    const beforeWall = await evaluate("({party:!!window.__gardenPartyOn,night:document.getElementById('stage-garden').classList.contains('dusk')})");
    await clickPoint(wall); await sleep(80);
    const afterWall = await evaluate("({party:!!window.__gardenPartyOn,night:document.getElementById('stage-garden').classList.contains('dusk')})");
    controls.wallOnly = beforeWall.party === afterWall.party && beforeWall.night !== afterWall.night;

    const closeRect = (a, b) => ["x", "y", "width", "height"].every(key => Math.abs(a[key] - b[key]) < .75);
    controls.stableGeometry = [setup.partyLook.normal.rect, geometry.stopped, geometry.dayNight, geometry.returned]
      .every(rect => closeRect(setup.ballRect, rect));

    const result = await evaluate(`(function(){var area=document.getElementById("hunt-fullscreen-area");return {errors:(window.__errs||[]).slice(),size:[innerWidth,innerHeight],fullscreen:document.fullscreenElement===area};})()`);
    const prefix = spec.label + ": ";
    check(result.errors.length === 0, prefix + "sequence has no page errors", result.errors);
    check(result.size[0] === spec.width, prefix + "runs at the requested viewport width", result.size);
    check(result.fullscreen === spec.fullscreen, prefix + "keeps the requested fullscreen state", result.fullscreen);
    check(Number(setup.phase1.opacity) === 0 && setup.phase1.pointer === "none",
      prefix + "phase one keeps the disco control absent and inert", setup.phase1);
    check(setup.phase2 && !setup.party && setup.ballHit && Number(setup.ballOpacity) > .35 && setup.spin === "none",
      prefix + "phase two exposes a dim, still, fingertip-sized disco control", setup);
    check(setup.noLegacyEntrance, prefix + "phase-two reveal has no delayed fall timer, class, or animation", setup);
    check(setup.facetCount >= 10 && setup.hasAttachment && setup.rosterClear,
      prefix + "mirror-ball facets stay physically attached and clear of notification chrome", setup);
    check(setup.noSwitchCoach, prefix + "wall-switch onboarding is absent", setup);
    check(setup.started, prefix + "trusted disco-ball click starts Party", setup);
    check(Number(setup.partyLook.normal.opacity) > .9 &&
      (spec.reduced ? setup.partyLook.normal.name === "none" && setup.partyLook.normal.glintName === "none" && Number(setup.partyLook.normal.glintOpacity) >= .5 :
        setup.partyLook.normal.name === "disco-ball-spin" && setup.partyLook.normal.glintName === "db-reflected-glint"),
      prefix + "Party lights the disco ball and honors reduced motion", setup.partyLook);
    if (!spec.reduced) check(setup.partyLook.normal.duration === "9s" && setup.partyLook.normal.timing === "linear" &&
      setup.partyLook.low.name === "disco-ball-spin" && setup.partyLook.low.duration === "30s" && /^steps\(30/.test(setup.partyLook.low.timing) && Number(setup.partyLook.low.opacity) > .9 &&
      setup.partyLook.low.glintName === "none" && Number(setup.partyLook.low.glintOpacity) >= .5,
      prefix + "low-frame mode slows the disco spin instead of dropping its state", setup.partyLook);
    check(blockedMoment.activated && blockedMoment.hidden && blockedMoment.shown && blockedMoment.party,
      prefix + "exploration waits behind an authored Party moment, then appears while Party stays on", blockedMoment);
    check(!message.missing && message.modalCount === 3 && message.partyModalCount === 2,
      prefix + "only opening, exploration, and first Messages lessons are modal", message);
    [map, message].forEach((step, index) => {
      const name = ["room-map", "messages"][index];
      check(step.kind === name && step.scrims.length === 4 && step.scrims.every(scrim =>
        scrim[0] === "rgba(0, 0, 0, 0)" && scrim[1] === "auto"),
      prefix + name + " visibly blocks around one live target island", step);
      check(step.card.width >= step.area.width * .72 && step.card.height >= step.area.height * .35,
        prefix + name + " card occupies most of the shell", step);
      check(step.blocked, prefix + name + " blocks unrelated controls", step);
      check(step.targetHit, prefix + name + " target wins hit-testing above the scrim", step);
      check(step.acted, prefix + name + " trusted target click acts and dismisses exactly once", step);
    });
    check(map.messageQueued && map.release.complete && map.release.preview && map.release.previewClear &&
      map.release.thread.filter(id => id === "cue_calendar").length === 1 && /All rooms are open/.test(map.copy),
      prefix + "Messages holds behind the reveal and exploration lesson, then releases once clear of the ball", map);
    check(controls.ballHit && controls.fallback,
      prefix + "trusted disco-ball stop preserves the early post-Party exploration fallback", controls);
    check(Number(controls.relit.opacity) > .9 && controls.relit.noEntrance &&
      (spec.reduced ? controls.relit.spin === "none" : controls.relit.spin === "disco-ball-spin") &&
      Number(stoppedState.opacity) > .35 && Number(stoppedState.opacity) < .6 && stoppedState.spin === "none" && stoppedState.animations.length === 0,
      prefix + "Party off is dim and completely still; Party on relights without an entrance", { relit: controls.relit, stopped: stoppedState });
    check(geometry.noClass && geometry.noHook && controls.stableGeometry,
      prefix + "disco geometry stays fixed across Party, day/night, and room transitions", { setup: setup.ballRect, party: setup.partyLook.normal.rect, geometry });
    check(wallData.target && controls.wallOnly, prefix + "Garden wall switch changes only day/night in phase two", { wallData, beforeWall, afterWall });
  }
  ws.close();
} finally {
  await cleanup();
}

if (failures) process.exit(1);
console.log("Party exploration modal and disco-control assertions passed.");
