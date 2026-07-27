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
  ' window.__jumpToDate(2027,10,23);window.__openPhoneAppHere("calendar");await sleep(50);',
  ' var ph=document.querySelector(".calx-phone"),d23=day(ph,23);',
  ' S("english",{label:d23&&d23.getAttribute("aria-label"),icon:d23&&d23.querySelector(".calx-mk")&&d23.querySelector(".calx-mk").textContent,banner:document.getElementById("occasion-banner")&&document.getElementById("occasion-banner").textContent});',
  ' setLang("cs");await sleep(30);ph=document.querySelector(".calx-phone");d23=day(ph,23);S("czech",{label:d23&&d23.getAttribute("aria-label")});',
  ' setLang("en");ph=document.querySelector(".calx-phone");d23=day(ph,23);party(true);await sleep(30);d23.click();await sleep(900);',
  ' var pair=document.getElementById("cuddly-polyamory-pair");S("activate",{phone:!!document.querySelector(".phone-backdrop.show"),room:window.currentStageName,day:document.getElementById("loft-game-strip").classList.contains("polyamory-day"),partyOn:document.getElementById("loft-game-strip").classList.contains("party-on"),opacity:getComputedStyle(pair).opacity,roster:(window.__whoIsHere("cuddly")||[]).map(function(p){return p.key;})});',
  ' var rp=document.getElementById("cuddly-poly-raffi"),cp=document.getElementById("cuddly-poly-chinnel"),rh=document.getElementById("cuddly-poly-raffi-head"),cb=document.getElementById("cuddly-poly-chinnel-body"),hosts=document.getElementById("cuddly-couple"),projector=document.getElementById("cuddly-wallscreen"),board=document.getElementById("cuddly-knifeboard"),daybed=document.getElementById("cuddly-daybed"),k1=document.getElementById("cuddly-knife-1"),k2=document.getElementById("cuddly-knife-2"),hair=document.getElementById("cuddly-poly-chinnel-hair"),hairBox=hair.getBBox();',
  ' S("couch",{raffiFirst:!!(rp.compareDocumentPosition(cp)&Node.DOCUMENT_POSITION_FOLLOWING),chinnelRight:cp.transform.baseVal.consolidate().matrix.e>0,knife1:getComputedStyle(k1).visibility,knife2:getComputedStyle(k2).visibility,projectorBehindAll:!!(projector.compareDocumentPosition(hosts)&Node.DOCUMENT_POSITION_FOLLOWING)&&!!(projector.compareDocumentPosition(pair)&Node.DOCUMENT_POSITION_FOLLOWING),backgroundBeforeKnives:!!(board.compareDocumentPosition(k1)&Node.DOCUMENT_POSITION_FOLLOWING)&&!!(daybed.compareDocumentPosition(k2)&Node.DOCUMENT_POSITION_FOLLOWING),knivesBeforePeople:!!(k1.compareDocumentPosition(pair)&Node.DOCUMENT_POSITION_FOLLOWING)&&!!(k2.compareDocumentPosition(pair)&Node.DOCUMENT_POSITION_FOLLOWING),hair:{width:hairBox.width,height:hairBox.height,circles:hair.querySelectorAll("circle").length},headHit:getComputedStyle(rh).pointerEvents,bodyHit:getComputedStyle(cb).pointerEvents});',
  ' rh.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(40);S("headReact",{kissing:pair.classList.contains("poly-kissing"),heart:!!pair.querySelector(".poly-heart")});await sleep(1000);S("headCleanup",{kissing:pair.classList.contains("poly-kissing")});',
  ' cb.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(40);S("bodyReact",{snuggling:pair.classList.contains("poly-snuggling"),heart:!!pair.querySelector(".poly-heart")});await sleep(1200);S("bodyCleanup",{snuggling:pair.classList.contains("poly-snuggling")});',
  ' drag(rh,-400,41,"mouse");await sleep(30);var raffiLeft=parseFloat(rp.style.translate)||0;drag(cb,400,42,"touch");await sleep(30);var chinnelRight=parseFloat(cp.style.translate)||0;drag(rh,400,43,"mouse");drag(cb,-400,44,"touch");await sleep(30);var raffiFinal=parseFloat(rp.style.translate)||0,chinnelFinal=parseFloat(cp.style.translate)||0;S("drag",{raffiLeft:raffiLeft,chinnelRight:chinnelRight,raffiFinal:raffiFinal,chinnelFinal:chinnelFinal,gap:(366+chinnelFinal)-(318+raffiFinal),reacted:pair.classList.contains("poly-kissing")||pair.classList.contains("poly-snuggling"),hearts:pair.querySelectorAll(".poly-heart").length});',
  ' var blanket=document.getElementById("cuddly-blanket"),fairy=document.getElementById("cuddly-rumi-fairy"),br=blanket.getBoundingClientRect(),bx=br.left+br.width/2,by=br.top+br.height/2;blanket.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerId:31,pointerType:"mouse",button:0,buttons:1,clientX:bx,clientY:by}));S("blanketLayer",{afterPair:!!(pair.compareDocumentPosition(blanket)&Node.DOCUMENT_POSITION_FOLLOWING),beforeFairy:!!(blanket.compareDocumentPosition(fairy)&Node.DOCUMENT_POSITION_FOLLOWING)});blanket.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,cancelable:true,pointerId:31,pointerType:"mouse",button:0,buttons:0,clientX:bx,clientY:by}));',
  ' party(true);await sleep(80);S("party",{visibility:getComputedStyle(pair).visibility,on:document.getElementById("loft-game-strip").classList.contains("party-on")});party(false);',
  ' window.__jumpToDate(2027,10,24);await sleep(700);S("leave",{day:document.getElementById("loft-game-strip").classList.contains("polyamory-day"),opacity:getComputedStyle(pair).opacity});',
  ' var raffiArm=document.querySelector(".g-raffi .guest-arm-l"),raffiOrigin=raffiArm&&getComputedStyle(raffiArm).transformOrigin.split(" ");',
  ' var chBal=document.getElementById("bh-chinnel"),raBal=document.getElementById("bh-raffi"),adultBal=document.getElementById("bh-patricia-son"),chBox=chBal.getBBox(),raBox=raBal.getBBox(),adultBox=adultBal.getBBox();',
  ' S("models",{floor:!!document.querySelector(".g-chinnel")&&!!document.querySelector(".g-raffi"),bar:!!document.querySelector(".bc-chinnelraffi"),office:!!document.querySelector(".of-chinnelraffi"),balcony:!!chBal&&!!raBal,raffiArmTop:!!raffiOrigin&&Math.abs(parseFloat(raffiOrigin[1]))<0.1,balconyScale:{chinnel:chBox.height,raffi:raBox.height,adult:adultBox.height,chinnelRatio:chBox.height/adultBox.height,raffiRatio:raBox.height/adultBox.height}});',
  ' window.__jumpToDate(2027,7,26);S("chinnelBirthday",{active:document.getElementById("loft-game-strip").classList.contains("bd-chinnel"),bust:/calx-bust/.test(window.__bdPortrait({who:"chinnel",type:"hat"}))});',
  ' window.__jumpToDate(2027,8,26);S("raffiBirthday",{active:document.getElementById("loft-game-strip").classList.contains("bd-raffi"),bust:/calx-bust/.test(window.__bdPortrait({who:"raffi",type:"hat"}))});',
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
check(s.english && s.english.label === "23. World Polyamory Day" && /👨/.test(s.english.icon || "") &&
  s.english.banner === "World Polyamory Day", "November 23 is named in the English calendar and banner", s.english);
check(s.czech && s.czech.label === "23. Světový den polyamorie", "the occasion has a Czech calendar name", s.czech);
check(s.activate && !s.activate.phone && s.activate.room === "cuddly" && s.activate.day && !s.activate.partyOn &&
  s.activate.opacity === "1" && s.activate.roster.indexOf("chinnel") >= 0 && s.activate.roster.indexOf("raffi") >= 0,
  "activating the day stops the party, closes Calendar and gathers all four people in Cuddly", s.activate);
check(s.couch && s.couch.raffiFirst && s.couch.chinnelRight && s.couch.knife1 === "visible" &&
  s.couch.knife2 === "visible" && s.couch.projectorBehindAll && s.couch.backgroundBeforeKnives && s.couch.knivesBeforePeople &&
  s.couch.headHit !== "none" && s.couch.bodyHit !== "none",
  "the projector stays behind all four friends while both knives remain visible below the gathering", s.couch);
check(s.couch && s.couch.hair && s.couch.hair.width >= 62 && s.couch.hair.height <= 66 &&
  s.couch.hair.circles === 0,
  "Chinnel's Cuddly hair has a broad, shallow triangular curl mass without detached round blobs", s.couch && s.couch.hair);
check(s.headReact && s.headReact.kissing && s.headReact.heart && s.headCleanup && !s.headCleanup.kissing,
  "a head tap starts and cleans up the kiss reaction", { start: s.headReact, cleanup: s.headCleanup });
check(s.bodyReact && s.bodyReact.snuggling && s.bodyReact.heart && s.bodyCleanup && !s.bodyCleanup.snuggling,
  "a body tap starts and cleans up the cuddle reaction", { start: s.bodyReact, cleanup: s.bodyCleanup });
check(s.drag && s.drag.raffiLeft === -12 && s.drag.chinnelRight === 46 &&
  s.drag.raffiFinal === 26 && s.drag.chinnelFinal === 16 && s.drag.gap === 38 &&
  !s.drag.reacted && s.drag.hearts === 0,
  "mouse and touch drags stay on the couch, preserve the authored gap, and suppress tap reactions", s.drag);
check(s.blanketLayer && s.blanketLayer.afterPair && s.blanketLayer.beforeFairy,
  "a moved blanket paints in front of both couples without covering later cameos", s.blanketLayer);
check(s.party && s.party.on && s.party.visibility === "hidden", "the couch pair yields to party mode", s.party);
check(s.leave && !s.leave.day && s.leave.opacity === "0", "leaving November 23 tears down the couch scene", s.leave);
check(s.models && s.models.floor && s.models.bar && s.models.office && s.models.balcony && s.models.raffiArmTop,
  "both travel buddies have floor, balcony, bar and office art, with Raffi's hanging arm pivoted at its top", s.models);
check(s.models && s.models.balconyScale && s.models.balconyScale.chinnelRatio > 0.7 &&
  s.models.balconyScale.chinnelRatio < 1.35 && s.models.balconyScale.raffiRatio > 0.7 &&
  s.models.balconyScale.raffiRatio < 1.35,
  "their rendered balcony figures stay within normal adult scale", s.models && s.models.balconyScale);
check(s.chinnelBirthday && s.chinnelBirthday.active && s.chinnelBirthday.bust,
  "Chinnel's August 26 birthday has a portrait", s.chinnelBirthday);
check(s.raffiBirthday && s.raffiBirthday.active && s.raffiBirthday.bust,
  "Raffi's September 26 birthday has a portrait", s.raffiBirthday);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
