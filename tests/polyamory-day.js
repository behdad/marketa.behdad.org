#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function day(host,n){return [].find.call(host.querySelectorAll(".calx-day:not(.calx-out)"),function(e){var x=e.querySelector(".calx-num");return x&&x.textContent.trim()===String(n);});}',
  'function drag(hit,dx,id,type){var r=hit.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,base={bubbles:true,cancelable:true,pointerId:id,pointerType:type||"mouse",isPrimary:true};hit.dispatchEvent(new PointerEvent("pointerdown",Object.assign({},base,{button:0,buttons:1,clientX:x,clientY:y})));hit.dispatchEvent(new PointerEvent("pointermove",Object.assign({},base,{button:0,buttons:1,clientX:x+dx,clientY:y})));hit.dispatchEvent(new PointerEvent("pointerup",Object.assign({},base,{button:0,buttons:0,clientX:x+dx,clientY:y})));hit.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,clientX:x+dx,clientY:y}));}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  ' document.hasFocus=function(){return true;};window.__gameStarted=function(){return true;};',
  ' window.__jumpToDate(2027,10,24);if(window.party)window.garden.set(false);window.goToStage("cuddly");await sleep(80);',
  ' var pair=document.getElementById("cuddly-polyamory-pair"),hosts=document.getElementById("cuddly-couple"),fairy=document.getElementById("cuddly-rumi-fairy"),irene=document.getElementById("cuddly-irene"),projector=document.getElementById("cuddly-wallscreen"),puffer=document.getElementById("cuddly-puffer-wrap"),visitors=document.getElementById("cuddly-visitors-layer"),k1=document.getElementById("cuddly-knife-1"),k2=document.getElementById("cuddly-knife-2"),blanket=document.getElementById("cuddly-blanket");',
  ' S("normal",{room:window.currentStageName,polyVisible:getComputedStyle(pair).visibility,hostsVisible:getComputedStyle(hosts).visibility,authoredSlot:hosts.nextElementSibling===pair&&pair.nextElementSibling===fairy,establishedOrder:!!(fairy.compareDocumentPosition(irene)&Node.DOCUMENT_POSITION_FOLLOWING)&&!!(projector.compareDocumentPosition(puffer)&Node.DOCUMENT_POSITION_FOLLOWING)&&!!(puffer.compareDocumentPosition(k1)&Node.DOCUMENT_POSITION_FOLLOWING)&&!!(k1.compareDocumentPosition(k2)&Node.DOCUMENT_POSITION_FOLLOWING),blanketHome:!!(blanket.compareDocumentPosition(hosts)&Node.DOCUMENT_POSITION_FOLLOWING)});',
  ' var nbr=blanket.getBoundingClientRect(),nbx=nbr.left+nbr.width/2,nby=nbr.top+nbr.height/2;blanket.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerId:30,pointerType:"mouse",button:0,buttons:1,clientX:nbx,clientY:nby}));S("normalBlanket",{afterKnives:!!(k2.compareDocumentPosition(blanket)&Node.DOCUMENT_POSITION_FOLLOWING),beforeVisitors:!!(blanket.compareDocumentPosition(visitors)&Node.DOCUMENT_POSITION_FOLLOWING)});blanket.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,cancelable:true,pointerId:30,pointerType:"mouse",button:0,buttons:0,clientX:nbx,clientY:nby}));',
  ' window.__jumpToDate(2027,10,23);window.__openPhoneAppHere("calendar");await sleep(50);',
  ' var ph=document.querySelector(".calx-phone"),d23=day(ph,23);',
  ' S("english",{icon:d23&&d23.querySelector(".calx-mk")&&d23.querySelector(".calx-mk").textContent,banner:document.getElementById("occasion-banner")&&document.getElementById("occasion-banner").textContent});',
  ' setLang("cs");await sleep(30);ph=document.querySelector(".calx-phone");d23=day(ph,23);S("czech",{banner:document.getElementById("occasion-banner")&&document.getElementById("occasion-banner").textContent});',
  ' setLang("en");ph=document.querySelector(".calx-phone");d23=day(ph,23);garden.set(true);await sleep(30);',
  ' var spencer=document.querySelector("#garden-guests .g-spencer"),spencerHat=spencer&&spencer.querySelector(".bd-hat-spencer"),navid=document.querySelector("#garden-guests .g-navid");S("birthdayOverlap",{spencerArrived:!!(spencer&&spencer.classList.contains("arrived")),spencerVisibility:spencer&&getComputedStyle(spencer).visibility,hatVisibility:spencerHat&&getComputedStyle(spencerHat).visibility,navidOpacity:navid&&getComputedStyle(navid).opacity});',
  ' d23.click();await sleep(900);',
  ' S("activate",{phone:!!document.querySelector(".phone-backdrop.show"),room:window.currentStageName,day:document.getElementById("loft-game-strip").classList.contains("polyamory-day"),partyOn:document.getElementById("loft-game-strip").classList.contains("party-on"),opacity:getComputedStyle(pair).opacity,roster:(window.__whoIsHere("cuddly")||[]).map(function(p){return p.key;})});',
  ' var rp=document.getElementById("cuddly-poly-rafi"),cp=document.getElementById("cuddly-poly-chinnell"),rh=document.getElementById("cuddly-poly-rafi-head"),cb=document.getElementById("cuddly-poly-chinnell-body"),hair=document.getElementById("cuddly-poly-chinnell-hair"),hairBox=hair.getBBox();',
  ' S("couch",{rafiFirst:!!(rp.compareDocumentPosition(cp)&Node.DOCUMENT_POSITION_FOLLOWING),chinnellRight:cp.transform.baseVal.consolidate().matrix.e>0,knife1:getComputedStyle(k1).visibility,knife2:getComputedStyle(k2).visibility,pairSlot:pair.nextElementSibling===k1,projectorBehindPair:!!(projector.compareDocumentPosition(pair)&Node.DOCUMENT_POSITION_FOLLOWING),establishedOrder:!!(hosts.compareDocumentPosition(fairy)&Node.DOCUMENT_POSITION_FOLLOWING)&&!!(fairy.compareDocumentPosition(irene)&Node.DOCUMENT_POSITION_FOLLOWING)&&!!(projector.compareDocumentPosition(puffer)&Node.DOCUMENT_POSITION_FOLLOWING)&&!!(puffer.compareDocumentPosition(k1)&Node.DOCUMENT_POSITION_FOLLOWING)&&!!(k1.compareDocumentPosition(k2)&Node.DOCUMENT_POSITION_FOLLOWING),hair:{width:hairBox.width,height:hairBox.height,circles:hair.querySelectorAll("circle").length},headHit:getComputedStyle(rh).pointerEvents,bodyHit:getComputedStyle(cb).pointerEvents});',
  ' window.__ireneShow("irene-hug");await sleep(120);S("ireneHug",{showing:irene.classList.contains("showing"),pose:irene.classList.contains("irene-hug"),abovePair:!!(pair.compareDocumentPosition(irene)&Node.DOCUMENT_POSITION_FOLLOWING),aboveKnives:!!(k2.compareDocumentPosition(irene)&Node.DOCUMENT_POSITION_FOLLOWING),sameStage:irene.parentNode===pair.parentNode});window.__resetIrene();',
  ' rh.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(40);S("headReact",{kissing:pair.classList.contains("poly-kissing"),heart:!!pair.querySelector(".poly-heart")});await sleep(1000);S("headCleanup",{kissing:pair.classList.contains("poly-kissing")});',
  ' cb.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(40);S("bodyReact",{snuggling:pair.classList.contains("poly-snuggling"),heart:!!pair.querySelector(".poly-heart")});await sleep(1200);S("bodyCleanup",{snuggling:pair.classList.contains("poly-snuggling")});',
  ' drag(rh,-400,41,"mouse");await sleep(30);var rafiLeft=parseFloat(rp.style.translate)||0;drag(cb,400,42,"touch");await sleep(30);var chinnellRight=parseFloat(cp.style.translate)||0;drag(rh,400,43,"mouse");drag(cb,-400,44,"touch");await sleep(30);var rafiFinal=parseFloat(rp.style.translate)||0,chinnellFinal=parseFloat(cp.style.translate)||0;S("drag",{rafiLeft:rafiLeft,chinnellRight:chinnellRight,rafiFinal:rafiFinal,chinnellFinal:chinnellFinal,gap:(366+chinnellFinal)-(318+rafiFinal),reacted:pair.classList.contains("poly-kissing")||pair.classList.contains("poly-snuggling"),hearts:pair.querySelectorAll(".poly-heart").length});',
  ' var br=blanket.getBoundingClientRect(),bx=br.left+br.width/2,by=br.top+br.height/2;blanket.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerId:31,pointerType:"mouse",button:0,buttons:1,clientX:bx,clientY:by}));S("blanketLayer",{afterPair:!!(pair.compareDocumentPosition(blanket)&Node.DOCUMENT_POSITION_FOLLOWING),beforeKnives:!!(blanket.compareDocumentPosition(k1)&Node.DOCUMENT_POSITION_FOLLOWING),beforeVisitors:!!(blanket.compareDocumentPosition(visitors)&Node.DOCUMENT_POSITION_FOLLOWING)});blanket.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,cancelable:true,pointerId:31,pointerType:"mouse",button:0,buttons:0,clientX:bx,clientY:by}));',
  ' garden.set(true);await sleep(80);S("party",{visibility:getComputedStyle(pair).visibility,on:document.getElementById("loft-game-strip").classList.contains("party-on")});garden.set(false);',
  ' window.__jumpToDate(2027,10,24);await sleep(700);S("leave",{day:document.getElementById("loft-game-strip").classList.contains("polyamory-day"),opacity:getComputedStyle(pair).opacity,home:hosts.nextElementSibling===pair&&pair.nextElementSibling===fairy});',
  ' var rafiArm=document.querySelector(".g-rafi .guest-arm-l"),rafiOrigin=rafiArm&&getComputedStyle(rafiArm).transformOrigin.split(" ");',
  ' var chBal=document.getElementById("bh-chinnell"),raBal=document.getElementById("bh-rafi"),adultBal=document.getElementById("bh-bahareh"),chBox=chBal.getBBox(),raBox=raBal.getBBox(),adultBox=adultBal.getBBox();',
  ' var floorHair=document.getElementById("garden-chinnell-hair"),barHair=document.getElementById("bar-chinnell-hair"),floorHairBox=floorHair.getBBox(),barHairBox=barHair.getBBox();',
  ' S("models",{floor:!!document.querySelector(".g-chinnell")&&!!document.querySelector(".g-rafi"),bar:!!document.querySelector(".bc-chinnellrafi"),office:!!document.querySelector(".of-chinnellrafi"),balcony:!!chBal&&!!raBal,rafiArmTop:!!rafiOrigin&&Math.abs(parseFloat(rafiOrigin[1]))<0.1,hair:{floor:{width:floorHairBox.width,height:floorHairBox.height,circles:floorHair.querySelectorAll("circle").length},shared:{width:barHairBox.width,height:barHairBox.height,circles:barHair.querySelectorAll("circle").length}},balconyScale:{chinnell:chBox.height,rafi:raBox.height,adult:adultBox.height,chinnellRatio:chBox.height/adultBox.height,rafiRatio:raBox.height/adultBox.height}});',
  ' window.__jumpToDate(2027,7,26);var bust=window.__bdPortrait({who:"chinnell",type:"hat"}),bustHost=document.createElement("div");bustHost.innerHTML=bust;var bustHair=bustHost.querySelector(".portrait-triangle-curls");S("chinnellBirthday",{active:document.getElementById("loft-game-strip").classList.contains("bd-chinnell"),bust:/calx-bust/.test(bust),triangle:!!bustHair,circles:bustHair&&bustHair.querySelectorAll("circle").length});',
  ' window.__jumpToDate(2027,8,26);S("rafiBirthday",{active:document.getElementById("loft-game-strip").classList.contains("bd-rafi"),bust:/calx-bust/.test(window.__bdPortrait({who:"rafi",type:"hat"}))});',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},300);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html World Polyamory Day:");
var r = lib.runPageSync("rsvp.html", HARNESS, 6200, { patchRaf: true, seedRandom: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.english && /👨/.test(s.english.icon || "") &&
  s.english.banner === "World Polyamory Day", "November 23 is named in the English calendar and banner", s.english);
check(s.czech && s.czech.banner === "Světový den polyamorie", "the occasion has a visible Czech name", s.czech);
check(s.normal && s.normal.room === "cuddly" && s.normal.polyVisible === "hidden" &&
  s.normal.hostsVisible === "visible" && s.normal.authoredSlot && s.normal.establishedOrder && s.normal.blanketHome,
  "an ordinary Cuddly day keeps its original people, prop and blanket hierarchy", s.normal);
check(s.normalBlanket && s.normalBlanket.afterKnives && s.normalBlanket.beforeVisitors,
  "an ordinary-day blanket drag retains its historical foreground slot", s.normalBlanket);
check(s.birthdayOverlap && !s.birthdayOverlap.spencerArrived && s.birthdayOverlap.spencerVisibility === "hidden" &&
  s.birthdayOverlap.hatVisibility === "hidden" && s.birthdayOverlap.navidOpacity !== "0",
  "Spencer's overlapping birthday hat stays with his unarrived figure while Navid dances", s.birthdayOverlap);
check(s.activate && !s.activate.phone && s.activate.room === "cuddly" && s.activate.day && !s.activate.partyOn &&
  s.activate.opacity === "1" && s.activate.roster.indexOf("chinnell") >= 0 && s.activate.roster.indexOf("rafi") >= 0,
  "activating the day stops the party, closes Calendar and gathers all four people in Cuddly", s.activate);
check(s.couch && s.couch.rafiFirst && s.couch.chinnellRight && s.couch.knife1 === "visible" &&
  s.couch.knife2 === "visible" && s.couch.pairSlot && s.couch.projectorBehindPair && s.couch.establishedOrder &&
  s.couch.headHit !== "none" && s.couch.bodyHit !== "none",
  "only the visiting pair changes layer while the established Cuddly order remains intact", s.couch);
check(s.ireneHug && s.ireneHug.showing && s.ireneHug.pose && s.ireneHug.abovePair &&
  s.ireneHug.aboveKnives && s.ireneHug.sameStage,
  "Irene's hug still paints in front of both couples and the wall props", s.ireneHug);
check(s.couch && s.couch.hair && s.couch.hair.width >= 62 && s.couch.hair.height <= 66 &&
  s.couch.hair.circles === 0,
  "Chinnell's Cuddly hair has a broad, shallow triangular curl mass without detached round blobs", s.couch && s.couch.hair);
check(s.headReact && s.headReact.kissing && s.headReact.heart && s.headCleanup && !s.headCleanup.kissing,
  "a head tap starts and cleans up the kiss reaction", { start: s.headReact, cleanup: s.headCleanup });
check(s.bodyReact && s.bodyReact.snuggling && s.bodyReact.heart && s.bodyCleanup && !s.bodyCleanup.snuggling,
  "a body tap starts and cleans up the cuddle reaction", { start: s.bodyReact, cleanup: s.bodyCleanup });
check(s.drag && s.drag.rafiLeft === -12 && s.drag.chinnellRight === 46 &&
  s.drag.rafiFinal === 26 && s.drag.chinnellFinal === 16 && s.drag.gap === 38 &&
  !s.drag.reacted && s.drag.hearts === 0,
  "mouse and touch drags stay on the couch, preserve the authored gap, and suppress tap reactions", s.drag);
check(s.blanketLayer && s.blanketLayer.afterPair && s.blanketLayer.beforeKnives && s.blanketLayer.beforeVisitors,
  "a Polyamory Day blanket covers the visiting pair without disturbing knives or visitors", s.blanketLayer);
check(s.party && s.party.on && s.party.visibility === "hidden", "the couch pair yields to party mode", s.party);
check(s.leave && !s.leave.day && s.leave.opacity === "0" && s.leave.home,
  "leaving November 23 tears down the couch scene and restores the pair's authored slot", s.leave);
check(s.models && s.models.floor && s.models.bar && s.models.office && s.models.balcony && s.models.rafiArmTop,
  "both travel buddies have floor, balcony, bar and office art, with Rafi's hanging arm pivoted at its top", s.models);
check(s.models && s.models.balconyScale && s.models.balconyScale.chinnellRatio > 0.7 &&
  s.models.balconyScale.chinnellRatio < 1.35 && s.models.balconyScale.rafiRatio > 0.7 &&
  s.models.balconyScale.rafiRatio < 1.35,
  "their rendered balcony figures stay within normal adult scale", s.models && s.models.balconyScale);
check(s.models && s.models.hair && s.models.hair.floor.width >= 45 && s.models.hair.floor.height <= 55 &&
  s.models.hair.floor.circles === 0 && s.models.hair.shared.width >= 30 &&
  s.models.hair.shared.height <= 40 && s.models.hair.shared.circles === 0,
  "Chinnell's dance, bar, balcony and office art share the approved broad curl silhouette", s.models && s.models.hair);
check(s.chinnellBirthday && s.chinnellBirthday.active && s.chinnellBirthday.bust &&
  s.chinnellBirthday.triangle && s.chinnellBirthday.circles === 0,
  "Chinnell's August 26 portrait uses the same broad curl silhouette", s.chinnellBirthday);
check(s.rafiBirthday && s.rafiBirthday.active && s.rafiBirthday.bust,
  "Rafi's September 26 birthday has a portrait", s.rafiBirthday);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
