#!/usr/bin/env node
// A durable checkpoint replaces the opening invitation with a keyboard-accessible
// Continue / Start over gate, and Continue restores the saved game progression.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var saved={version:1,savedAt:Date.now()-120000,progress:{room:"office",maxUnlocked:4,phase2:true,party:true,daylight:false,bbq:false},puzzle:{cuddly:{door:true}},phone:null,album:null,systems:{pc:{powered:true},monitor:{surface:"monitor",screenOn:true,foreground:"mail",running:["mail","code"],zoomed:true},laptop:{open:true,zoomed:false},"phone-shell":{unlocked:true,open:true,app:"notes"},projector:{channel:"stars"},"kitchen-candle":{lit:true},"kitchen-kettle":{on:true},"kitchen-radio":{on:true},"garden-ac":{on:true},"balcony-lamp":{on:true},"office-faith":{symbol:"crescent"},"bar-neon":{label:"pamenar"},"bbq-food":{spots:[{servings:4,cooked:false},{servings:2,cooked:true},{servings:1,cooked:false}]},"kitchen-water":{level:0},"kitchen-damage":{fallen:["kitchen-pan-2","kitchen-pan-4","kitchen-pan-6"]},"garden-water":{levels:[0,2,4]},"plant-water":{counts:{"garden-monstera":3,"garden-peacelily":1,"garden-dieffenbachia":0,"garden-snakeplant":0,"garden-smallpots":0,"garden-potstand":0},overwateredAt:{"garden-monstera":Date.now()}},"balcony-wine":{pours:1,glassEmpty:true},"bar-bottles":{broken:[0,2],clicks:2,threshold:5}}};',
  'if(!sessionStorage.getItem("recovery-seeded")){sessionStorage.setItem("recovery-seeded","1");localStorage.setItem("loftCheckpoint:v1",JSON.stringify(saved));location.reload();return;}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  ' var gate=document.getElementById("loft-recovery-gate"),buttons=gate&&gate.querySelectorAll(".loft-recovery-btn"),watch=document.querySelector(".watch-controls"),caption=document.getElementById("hunt-caption"),area=document.getElementById("hunt-fullscreen-area"),brand=gate&&gate.querySelector(".loft-entry-brand"),title=gate&&gate.querySelector(".loft-recovery-title"),langs=document.querySelector(".game-langs"),strip=document.getElementById("loft-game-strip"),kitchen=document.getElementById("stage-kitchen"),previewDisco=document.getElementById("garden-disco-ball"),previewDiscoBox=previewDisco.getBBox(),incidental=window.__captionOverlay("trip_caption_molly",{owner:"recovery-real-probe",scope:"stage:kitchen",priority:80,duration:100}),captionClaim=window.__captionState(),dollhouseWarm=window.__dollhouseState().backgroundWarm;S("gate",{shown:!!gate,clickMe:!!document.getElementById("click-me-overlay"),primary:buttons&&buttons[0].classList.contains("selected"),summary:caption&&caption.textContent,incidentalAccepted:!!incidental,captionOwner:captionClaim.exclusive&&captionClaim.exclusive.owner,duplicateMeta:!!(gate&&gate.querySelector(".loft-recovery-meta")),ariaCount:gate&&Array.from(gate.attributes).filter(function(a){return a.name.indexOf("aria-")===0;}).length,recoveryActive:area&&area.classList.contains("recovery-active"),preview:strip.classList.contains("recovery-preview"),previewTransform:strip.style.transform,previewPhase2:strip.classList.contains("second-round"),previewParty:strip.classList.contains("party-on"),previewNight:kitchen.classList.contains("dusk"),previewBar:getComputedStyle(document.getElementById("kitchen-bar")).opacity,dollhouseWarmMode:dollhouseWarm.mode,discoBox:{x:previewDiscoBox.x,y:previewDiscoBox.y,width:previewDiscoBox.width,height:previewDiscoBox.height},discoTransform:getComputedStyle(previewDisco).transform,officeVisible:!document.getElementById("stage-office").classList.contains("stage-far"),kitchenParked:kitchen.classList.contains("stage-far"),restartVisibility:getComputedStyle(document.getElementById("hunt-restart-btn")).visibility,escapeVisibility:getComputedStyle(document.getElementById("hunt-escape-btn")).visibility,prevVisibility:getComputedStyle(document.getElementById("hunt-prev")).visibility,mediaVisibility:getComputedStyle(document.getElementById("hunt-side")).visibility,utilityVisibility:getComputedStyle(document.getElementById("hunt-github-btn")).visibility,brandDisplay:getComputedStyle(brand).display,brandAboveTitle:brand.getBoundingClientRect().bottom<=title.getBoundingClientRect().top,langsDisplay:getComputedStyle(langs).display,dotsDisplay:getComputedStyle(document.getElementById("hunt-dots")).display,fullscreenVisibility:getComputedStyle(document.getElementById("hunt-fullscreen-btn")).visibility,watchParent:watch&&watch.parentNode&&watch.parentNode.id,watchHidden:watch&&watch.hidden,watchAria:watch&&watch.getAttribute("aria-hidden"),watchDisplay:watch&&getComputedStyle(watch).display,ambienceCovered:window.__roomAmbienceCovered()});',
  ' window.__setLang("cs");S("translatedRecovery",{brand:brand.textContent,title:title.textContent,continueText:buttons[0].textContent,restartText:buttons[1].textContent,summary:caption.textContent});window.__setLang("en");',
  ' function key(k,code,shift){document.dispatchEvent(new KeyboardEvent("keydown",{key:k,code:code||"",shiftKey:!!shift,bubbles:true,cancelable:true}));}',
  ' [ ["5","Digit5"], ["d","KeyD"], ["p","KeyP"], ["t","KeyT"], ["?","Slash",true], ["`","Backquote"], ["r","KeyR"], ["Tab","Tab"] ].forEach(function(x){key(x[0],x[1],x[2]);});',
  ' S("blocked",{gate:!!document.getElementById("loft-recovery-gate"),room:window.__currentStageName,started:window.__gameStarted(),party:!!window.__gardenPartyOn,trip:!!window.__tripActive,help:!!document.querySelector(".kbd-backdrop"),console:document.getElementById("dropterm").classList.contains("open"),save:!!localStorage.getItem("loftCheckpoint:v1")});',
  ' document.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowRight",bubbles:true}));S("right",buttons[1].classList.contains("selected"));',
  ' document.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowLeft",bubbles:true}));S("left",buttons[0].classList.contains("selected"));',
  ' var leakedSpace=0;document.addEventListener("keydown",function(e){if(e.key===" ")leakedSpace++;});',
  ' document.dispatchEvent(new KeyboardEvent("keydown",{key:" ",code:"Space",bubbles:true,cancelable:true}));document.dispatchEvent(new KeyboardEvent("keydown",{key:" ",code:"Space",repeat:true,bubbles:true,cancelable:true}));document.dispatchEvent(new KeyboardEvent("keyup",{key:" ",code:"Space",bubbles:true,cancelable:true}));var partyRestored=!!window.__gardenPartyOn,switchRestored=document.getElementById("balcony-partyswitch").classList.contains("on"),discoBall=document.getElementById("garden-disco-ball"),discoBox=discoBall.getBBox(),discoSpin=document.getElementById("garden-disco-ball-spin");var monitor=document.getElementById("office-monitor"),phoneShell=document.querySelector(".phone-shell"),persisted=JSON.parse(localStorage.getItem("loftCheckpoint:v1")).systems;window.__openDollhouse();var recoveredDollhouse=window.__dollhouseState(),recoveredGarden=document.querySelector(".loft-dollhouse-room[data-dollhouse-room=garden]");var recoveredDollhouseSharp=recoveredDollhouse.rooms.every(function(room){return !room.locked;})&&getComputedStyle(recoveredGarden.querySelector("span")).filter==="none"&&getComputedStyle(recoveredGarden.querySelector("svg")).filter==="none";window.__closeDollhouse();S("continued",{gate:!!document.getElementById("loft-recovery-gate"),room:window.__currentStageName,max:window.__maxUnlocked(),phase2:!!window.__secondRound,started:window.__gameStarted(),dollhouseSharp:recoveredDollhouseSharp,dollhouseWarmMode:recoveredDollhouse.backgroundWarm.mode,dollhouseLivePreviews:recoveredDollhouse.livePreviews.length,spaceLeaks:leakedSpace,spaceHeld:!!window.__recoveryActivationHeld,partyRestored:partyRestored,switchRestored:switchRestored,partyAfterP:!!window.__gardenPartyOn,switchAfterP:document.getElementById("balcony-partyswitch").classList.contains("on"),discoOpacity:getComputedStyle(discoBall).opacity,discoSpin:getComputedStyle(discoSpin).animationName,discoBox:{x:discoBox.x,y:discoBox.y,width:discoBox.width,height:discoBox.height},discoTransform:getComputedStyle(discoBall).transform,noLegacyDiscoEntrance:typeof window.__updateGardenDiscoPeek==="undefined"&&!document.querySelector(".disco-peek"),caption:caption&&caption.textContent,recoveryCaption:caption&&caption.classList.contains("recovery-caption"),recoveryActive:area&&area.classList.contains("recovery-active"),leftVisibility:getComputedStyle(document.getElementById("hunt-left")).visibility,rightVisibility:getComputedStyle(document.getElementById("hunt-right")).visibility,dotsDisplay:getComputedStyle(document.getElementById("hunt-dots")).display,watchParent:watch&&watch.parentNode&&watch.parentNode.tagName,watchHidden:watch.hidden,watchAria:watch.hasAttribute("aria-hidden"),watchDisplay:getComputedStyle(watch).display,frontDoor:document.getElementById("balcony-door").classList.contains("open"),nookDoor:document.getElementById("cuddly-balcony-door").classList.contains("open"),devices:{pc:document.getElementById("office-pc-desk-trio").classList.contains("on"),monitor:monitor.classList.contains("here")&&monitor.classList.contains("screen-on")&&monitor.classList.contains("show-caps"),running:window.__monitorRunningApps().sort(),monitorZoom:window.__monitorZoomed(),laptopOpen:document.getElementById("office-laptop").classList.contains("open"),laptopZoom:window.__laptopZoomed(),phoneOpen:!!document.querySelector(".phone-backdrop"),phoneLocked:!!(phoneShell&&phoneShell.classList.contains("booting")),phoneApp:!!(phoneShell&&phoneShell.classList.contains("pm-app")&&/notes/i.test(phoneShell.querySelector(".pah-title").textContent)),call:!!window.__phoneCallFamily,camera:monitor.classList.contains("photobooth"),videoPlaying:!document.getElementById("monitor-video-el").paused,persisted:persisted},utilities:{projector:window.__cuddlyProjector.channel(),projectorPaused:window.__projectorRestorePaused,projectorPlaying:window.__starsPlaying(),candle:document.getElementById("kitchen-candle").classList.contains("lit"),kettle:window.__kettleCheckpointState(),radio:window.__radioCheckpointState(),ac:window.__acCheckpointState(),balconyLamp:document.getElementById("balcony-walllamp").classList.contains("on"),faith:document.getElementById("office-window-faith").classList.contains("crescent"),neon:document.getElementById("kitchen-bar-neon").classList.contains("pamenar")},inventory:{bbq:window.__bbqFoodState(),kitchenWater:window.__kitchenWaterState(),damage:window.__kitchenDamageState(),gardenWater:window.__gardenWaterInventoryState(),plants:window.__plantWaterState(),wine:window.__wineInventoryState(),bar:window.__barBottleInventoryState(),barBroken:document.querySelectorAll("#kitchen-bar-bottles .bar-bottle.broken").length,puddles:document.querySelectorAll("#kitchen-bar-shatter .bar-splash").length,panPlaced:["kitchen-pan-2","kitchen-pan-4","kitchen-pan-6"].every(function(id){return !!document.getElementById(id).style.transform;}),waterBroken:document.getElementById("kitchen-waterbottle").classList.contains("broken"),kettleBroken:document.getElementById("kitchen-kettle").classList.contains("broken"),canisterBroken:document.getElementById("kitchen-canister").classList.contains("broken"),monsteraRot:document.getElementById("garden-monstera").classList.contains("overwatered")}});',
  ' var malformed=JSON.parse(JSON.stringify(persisted));malformed.projector={channel:"karaoke"};malformed["kitchen-candle"]={lit:"yes"};malformed["kitchen-kettle"]={on:1};malformed["kitchen-radio"]={on:"yes"};malformed["garden-ac"]={on:1};malformed["balcony-lamp"]={on:"yes"};malformed["office-faith"]={symbol:"star"};malformed["bar-neon"]={label:"other"};malformed["bbq-food"]={spots:[{servings:99,cooked:true}]};malformed["kitchen-water"]={level:-1};malformed["kitchen-damage"]={fallen:["not-a-pan"]};malformed["garden-water"]={levels:[5,2,1]};malformed["plant-water"]={counts:{"not-a-plant":3}};malformed["balcony-wine"]={pours:"one",glassEmpty:"yes"};malformed["bar-bottles"]={broken:[999],clicks:8,threshold:8};window.__restoreCheckpointSystems(malformed,"beforeStage");window.__restoreCheckpointSystems(malformed,"afterStage");S("malformed",{projector:window.__cuddlyProjector.channel(),candle:document.getElementById("kitchen-candle").classList.contains("lit"),kettle:window.__kettleCheckpointState().on,radio:window.__radioCheckpointState().on,ac:window.__acCheckpointState().on,balconyLamp:document.getElementById("balcony-walllamp").classList.contains("on"),faith:document.getElementById("office-window-faith").classList.contains("crescent"),neon:document.getElementById("kitchen-bar-neon").classList.contains("pamenar"),inventory:{bbq:window.__bbqFoodState(),kitchenWater:window.__kitchenWaterState(),damage:window.__kitchenDamageState(),gardenWater:window.__gardenWaterInventoryState(),plants:window.__plantWaterState(),wine:window.__wineInventoryState(),bar:window.__barBottleInventoryState()}});',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},350);});',
  '})();</script>'
].join("\n");

var START_OVER_HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var saved={version:1,savedAt:Date.now()-120000,progress:{room:"office",maxUnlocked:4,phase2:true,party:false,daylight:true,bbq:false},puzzle:{},phone:null,album:null,systems:{projector:{channel:"stars"},"kitchen-candle":{lit:true},"kitchen-kettle":{on:true},"kitchen-radio":{on:true},"garden-ac":{on:true},"balcony-lamp":{on:true},"office-faith":{symbol:"crescent"},"bar-neon":{label:"pamenar"}}};',
  'if(!sessionStorage.getItem("recovery-restart-seeded")){sessionStorage.setItem("recovery-restart-seeded","1");localStorage.setItem("loftCheckpoint:v1",JSON.stringify(saved));location.reload();return;}',
  'var report={errors:[],steps:{}};',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  ' var confirmations=0;window.confirm=function(){confirmations++;return false;};',
  ' var gate=document.getElementById("loft-recovery-gate"),buttons=gate&&gate.querySelectorAll(".loft-recovery-btn");',
  ' if(buttons&&buttons[1])buttons[1].click();',
  ' var area=document.getElementById("hunt-fullscreen-area"),watch=document.querySelector(".watch-controls"),url=new URL(location.href),clickMe=document.getElementById("click-me-overlay");window.__setLang("cs");var translatedClickMe={brand:clickMe.querySelector(".loft-entry-brand").textContent,word:clickMe.querySelector(".click-me-word").textContent,ariaCount:Array.from(clickMe.attributes).filter(function(a){return a.name.indexOf("aria-")===0;}).length};window.__setLang("en");report.steps.startedOver={confirmations:confirmations,gate:!!document.getElementById("loft-recovery-gate"),save:!!localStorage.getItem("loftCheckpoint:v1"),room:window.__currentStageName,phase2:!!window.__secondRound,discoOpacity:getComputedStyle(document.getElementById("garden-disco-ball")).opacity,started:window.__gameStarted(),entered:window.__gameOnlyEntered(),clickMe:!!clickMe,translatedClickMe:translatedClickMe,introActive:area.classList.contains("intro-active"),watchParent:watch.parentNode&&watch.parentNode.id,langsDisplay:getComputedStyle(document.querySelector(".game-langs")).display,escapeVisibility:getComputedStyle(document.getElementById("hunt-escape-btn")).visibility,caption:document.getElementById("hunt-caption").textContent,date:url.searchParams.get("date"),time:url.searchParams.get("time"),utilities:{projector:window.__cuddlyProjector.channel(),projectorPaused:window.__projectorRestorePaused,candle:document.getElementById("kitchen-candle").classList.contains("lit"),kettle:window.__kettleCheckpointState().on,radio:window.__radioCheckpointState().on,ac:window.__acCheckpointState().on,balconyLamp:document.getElementById("balcony-walllamp").classList.contains("on"),faith:document.getElementById("office-window-faith").classList.contains("crescent"),neon:document.getElementById("kitchen-bar-neon").classList.contains("pamenar")}};',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},350);});',
  '})();</script>'
].join("\n");

var RESET_CONTEXT_HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  ' window.__activateExtinguisher();',
  ' setTimeout(function(){var afterPhysical=new URL(location.href);report.steps.physical={date:afterPhysical.searchParams.get("date"),time:afterPhysical.searchParams.get("time")};window.confirm=function(){return true;};document.getElementById("hunt-restart-btn").click();',
  ' setTimeout(function(){var afterChrome=new URL(location.href);report.steps.chrome={date:afterChrome.searchParams.get("date"),time:afterChrome.searchParams.get("time")};report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},850);},850);',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);}},100);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("loft-day.html checkpoint recovery:");
var r = lib.runPageSync("loft-day.html", HARNESS, 1900, { patchRaf: true, urlSuffix: "?date=2027-02-14&time=18:30" });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.gate.shown && !s.gate.clickMe && s.gate.primary, "a valid save replaces CLICK ME with Continue selected", s.gate);
check(s.gate.preview && s.gate.previewTransform === "translateX(-60%)" && s.gate.officeVisible && s.gate.kitchenParked,
  "the recovery gate previews the saved room without entering it", s.gate);
check(s.gate.previewPhase2 && s.gate.previewParty && s.gate.previewNight && parseFloat(s.gate.previewBar) > 0.9,
  "the recovery preview uses the saved phase, party, and day/night look", s.gate);
check(s.gate.dollhouseWarmMode === "continue",
  "the recovery splash warms the saved session's Dollhouse variants", s.gate);
check(s.gate.ambienceCovered, "the recovery cover silences saved-room ambience before Continue", s.gate);
check(!s.gate.incidentalAccepted && s.gate.captionOwner === "recovery",
  "the real recovery gate rejects lower-priority incidental captions", s.gate);
check(!!s.gate.summary && /^Saved office · /.test(s.gate.summary) && !s.gate.duplicateMeta && s.gate.ariaCount === 0, "the visible caption alone carries the concise recovery summary, without ARIA metadata", s.gate);
check(s.gate.recoveryActive && s.gate.restartVisibility === "hidden" && s.gate.escapeVisibility === "hidden" && s.gate.prevVisibility === "hidden" && s.gate.mediaVisibility === "hidden" && s.gate.dotsDisplay === "none" && s.gate.fullscreenVisibility === "visible", "recovery hides inactive game controls but keeps fullscreen available", s.gate);
check(s.gate.utilityVisibility === "visible" && s.gate.brandDisplay === "block" && s.gate.brandAboveTitle && s.gate.langsDisplay === "flex", "recovery keeps utilities/language in chrome and Loft Day above Welcome back", s.gate);
check(s.translatedRecovery && s.translatedRecovery.brand === "Den v loftu" && s.translatedRecovery.title === "Vítej zpátky" &&
  /Pokračovat/.test(s.translatedRecovery.continueText) && /Začít znovu/.test(s.translatedRecovery.restartText) && /^Uloženo pracovna · /.test(s.translatedRecovery.summary),
  "changing language repaints the visible recovery choice and saved-room summary", s.translatedRecovery);
check(s.gate.watchParent === "hunt-bottom-nav" && s.gate.watchDisplay === "flex", "Trailer occupies the top row during recovery", s.gate);
check(!s.gate.watchHidden && s.gate.watchAria === null && s.gate.watchDisplay === "flex", "Trailer remains available beside the recovery choice", s.gate);
check(s.blocked && s.blocked.gate && s.blocked.room === "kitchen" && !s.blocked.started && !s.blocked.party && !s.blocked.trip && !s.blocked.help && !s.blocked.console && s.blocked.save, "gameplay shortcuts stay inert until a recovery choice is made", s.blocked);
check(s.right && s.left, "arrow keys move between Start over and Continue", { right: s.right, left: s.left });
check(!s.continued.gate && s.continued.room === "office" && s.continued.max === 4 && s.continued.phase2 && s.continued.started, "Space continues into the restored unlocked game", s.continued);
check(s.continued.dollhouseSharp, "Continue restores Phase 2 with every Dollhouse card sharp", s.continued);
check(s.continued.dollhouseWarmMode === "session" && s.continued.dollhouseLivePreviews === 0,
  "Continue hands the Dollhouse warm cache to the restored session without live room clones", s.continued);
check(s.continued.spaceLeaks === 0 && !s.continued.spaceHeld, "the accepting Space and its auto-repeat are consumed through keyup", s.continued);
check(s.continued.partyRestored && s.continued.switchRestored &&
  s.continued.partyAfterP && s.continued.switchAfterP && parseFloat(s.continued.discoOpacity) > .9 &&
  s.continued.discoSpin === "none",
  "a restored Party keeps its story latch and live disco control synchronized", s.continued);
check(s.continued.noLegacyDiscoEntrance && s.gate.discoTransform === s.continued.discoTransform &&
  ["x", "y", "width", "height"].every(function (key) { return Math.abs(s.gate.discoBox[key] - s.continued.discoBox[key]) < 0.01; }),
  "Continue preserves the disco ball's fixed SVG geometry without a delayed entrance", { gate: s.gate, continued: s.continued });
check(s.continued.frontDoor && s.continued.nookDoor, "Continue restores both views of the one balcony door", s.continued);
check(s.continued.devices && s.continued.devices.pc && s.continued.devices.monitor &&
  s.continued.devices.running.length === 0 && s.continued.devices.monitorZoom &&
  s.continued.devices.laptopOpen && !s.continued.devices.laptopZoom &&
  s.continued.devices.phoneOpen && s.continued.devices.phoneLocked && !s.continued.devices.phoneApp &&
  !s.continued.devices.call && !s.continued.devices.camera && !s.continued.devices.videoPlaying,
  "Continue restores device shells while the monitor returns to its empty desktop", s.continued.devices);
check(s.continued.devices && s.continued.devices.persisted &&
  s.continued.devices.persisted.pc.powered &&
  s.continued.devices.persisted.monitor.surface === "monitor" &&
  !("foreground" in s.continued.devices.persisted.monitor) &&
  !("running" in s.continued.devices.persisted.monitor) &&
  s.continued.devices.persisted["phone-shell"].open &&
  !s.continued.devices.persisted["phone-shell"].unlocked &&
  s.continued.devices.persisted["phone-shell"].app === null,
  "the post-Continue checkpoint captures the restored subsystem rows again", s.continued.devices && s.continued.devices.persisted);
check(s.continued.utilities && s.continued.utilities.projector === "stars" && !s.continued.utilities.projectorPaused &&
  !s.continued.utilities.projectorPlaying && s.continued.utilities.candle &&
  s.continued.utilities.kettle.on && !s.continued.utilities.kettle.paused && !s.continued.utilities.kettle.audio &&
  s.continued.utilities.radio.on && !s.continued.utilities.radio.paused && !s.continued.utilities.radio.audio &&
  s.continued.utilities.ac.on && !s.continued.utilities.ac.paused && !s.continued.utilities.ac.audio &&
  s.continued.utilities.balconyLamp && s.continued.utilities.faith && s.continued.utilities.neon,
  "Continue restores utility intent and leaves room-gated sound ready to resume", s.continued.utilities);
check(s.continued.devices && s.continued.devices.persisted &&
  s.continued.devices.persisted.projector.channel === "stars" &&
  s.continued.devices.persisted["kitchen-candle"].lit &&
  s.continued.devices.persisted["kitchen-kettle"].on &&
  s.continued.devices.persisted["kitchen-radio"].on &&
  s.continued.devices.persisted["garden-ac"].on &&
  s.continued.devices.persisted["balcony-lamp"].on &&
  s.continued.devices.persisted["office-faith"].symbol === "crescent" &&
  s.continued.devices.persisted["bar-neon"].label === "pamenar",
  "the post-Continue checkpoint recaptures every stable utility/media row", s.continued.devices && s.continued.devices.persisted);
check(s.continued.inventory &&
  s.continued.inventory.bbq.spots.map(function (x) { return x.servings + ":" + x.cooked; }).join(",") === "4:false,2:true,1:false" &&
  s.continued.inventory.kitchenWater.level === 0 &&
  s.continued.inventory.gardenWater.levels.join(",") === "0,2,4" &&
  s.continued.inventory.wine.pours === 1 && s.continued.inventory.wine.glassEmpty,
  "Continue restores settled food and drink quantities without resuming a transient pour or cook step", s.continued.inventory);
check(s.continued.inventory &&
  s.continued.inventory.damage.fallen.join(",") === "kitchen-pan-2,kitchen-pan-4,kitchen-pan-6" &&
  s.continued.inventory.panPlaced && s.continued.inventory.waterBroken && s.continued.inventory.kettleBroken && s.continued.inventory.canisterBroken &&
  s.continued.inventory.bar.broken.join(",") === "0,2" && s.continued.inventory.bar.clicks === 2 &&
  s.continued.inventory.bar.threshold === 5 && s.continued.inventory.barBroken === 2 && s.continued.inventory.puddles === 2,
  "Continue silently restores terminal pan and accumulated bottle damage with settled evidence", s.continued.inventory);
check(s.continued.inventory && s.continued.inventory.plants.counts["garden-monstera"] === 3 &&
  s.continued.inventory.plants.counts["garden-peacelily"] === 1 && s.continued.inventory.monsteraRot,
  "Continue restores meaningful plant saturation and its terminal overwatered visual", s.continued.inventory);
check(s.continued.devices && s.continued.devices.persisted &&
  s.continued.devices.persisted["bbq-food"].spots[0].servings === 4 &&
  s.continued.devices.persisted["kitchen-water"].level === 0 &&
  s.continued.devices.persisted["garden-water"].levels.join(",") === "0,2,4" &&
  s.continued.devices.persisted["balcony-wine"].pours === 1 &&
  s.continued.devices.persisted["bar-bottles"].broken.join(",") === "0,2",
  "the post-Continue checkpoint recaptures stable inventory and damage rows", s.continued.devices && s.continued.devices.persisted);
check(s.malformed && s.malformed.projector === "fire" && !s.malformed.candle && !s.malformed.kettle &&
  !s.malformed.radio && !s.malformed.ac && !s.malformed.balconyLamp && !s.malformed.faith && !s.malformed.neon,
  "malformed utility/media rows fall back to safe fresh defaults", s.malformed);
check(s.malformed && s.malformed.inventory &&
  s.malformed.inventory.bbq.served === 0 && s.malformed.inventory.bbq.depleted === 0 &&
  s.malformed.inventory.kitchenWater.level === 4 && s.malformed.inventory.damage.fallen.length === 0 &&
  s.malformed.inventory.gardenWater.levels.join(",") === "4,4,4" &&
  s.malformed.inventory.plants.counts["garden-monstera"] === 0 &&
  s.malformed.inventory.wine.pours === 3 && !s.malformed.inventory.wine.glassEmpty &&
  s.malformed.inventory.bar.broken.length === 0 && s.malformed.inventory.bar.clicks === 0 &&
  s.malformed.inventory.bar.threshold === 4,
  "malformed inventory and damage rows clamp to safe fresh defaults", s.malformed && s.malformed.inventory);
check(!s.continued.recoveryCaption && s.continued.caption.toLowerCase().indexOf("continue from") === -1, "continuing restores the room caption", s.continued);
check(!s.continued.recoveryActive && s.continued.leftVisibility === "visible" && s.continued.rightVisibility === "visible" && s.continued.dotsDisplay === "flex", "continuing restores navigation", s.continued);
check(s.continued.watchParent === "MAIN", "continuing restores Trailer below the shared game shell", s.continued);
check(!s.continued.watchHidden && !s.continued.watchAria && s.continued.watchDisplay === "none", "game-only play hides Trailer after the recovery choice", s.continued);

var restart = lib.runPageSync("loft-day.html", START_OVER_HARNESS, 1900, { patchRaf: true, urlSuffix: "?date=2027-02-14&time=18:30" });
check(!!restart && restart.errors.length === 0, "Start over harness has no uncaught page errors", restart && restart.errors);
var startedOver = restart && restart.steps.startedOver;
check(startedOver && startedOver.confirmations === 0 && !startedOver.gate && !startedOver.save && startedOver.room === "kitchen" && !startedOver.phase2 && parseFloat(startedOver.discoOpacity) === 0,
  "Start over is the confirmation: it resets immediately without a browser dialog", startedOver);
check(startedOver && !startedOver.started && startedOver.entered && startedOver.clickMe && startedOver.introActive && startedOver.watchParent === "hunt-bottom-nav" && startedOver.langsDisplay === "flex" && startedOver.escapeVisibility === "hidden" && !/La Maz/.test(startedOver.caption),
  "recovery Start over enlarges the page but preserves the clean CLICK ME introduction", startedOver);
check(startedOver && startedOver.translatedClickMe && startedOver.translatedClickMe.brand === "Den v loftu" &&
  startedOver.translatedClickMe.word === "KLIKNI!" && startedOver.translatedClickMe.ariaCount === 0,
  "changing language repaints the visible CLICK ME invitation without adding ARIA metadata", startedOver && startedOver.translatedClickMe);
check(startedOver && startedOver.date === "2027-02-14" && startedOver.time === "18:30",
  "recovery Start over preserves the pretend date and time", startedOver);
check(startedOver && startedOver.utilities && startedOver.utilities.projector === "fire" &&
  !startedOver.utilities.projectorPaused && !startedOver.utilities.candle && !startedOver.utilities.kettle &&
  !startedOver.utilities.radio && !startedOver.utilities.ac && !startedOver.utilities.balconyLamp &&
  !startedOver.utilities.faith && !startedOver.utilities.neon,
  "Start over clears restored utility/media intent through the adapter registry", startedOver && startedOver.utilities);

var resetContext = lib.runPageSync("loft-day.html", RESET_CONTEXT_HARNESS, 3000, { patchRaf: true, urlSuffix: "?date=2027-02-14&time=18:30" });
check(!!resetContext && resetContext.errors.length === 0, "reset-context harness has no uncaught page errors", resetContext && resetContext.errors);
check(resetContext && resetContext.steps.physical.date === "2027-02-14" && resetContext.steps.physical.time === "18:30",
  "the in-room extinguisher preserves the pretend date and time", resetContext && resetContext.steps.physical);
check(resetContext && resetContext.steps.chrome.date === null && resetContext.steps.chrome.time === null,
  "the explicit chrome reset returns to the real date and time", resetContext && resetContext.steps.chrome);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
