#!/usr/bin/env node
// The garden magic-box lock uses its date as a Calendar clue and validates
// selected digits only when the single full-width submit control is pressed.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function tap(el){el.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));}',
  'function ctx(el){var r=el.getBoundingClientRect();return !el.dispatchEvent(new MouseEvent("contextmenu",{bubbles:true,cancelable:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2}));}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  ' window.__goToStage("garden");window.__setDrugsboxMonth(5);',
  ' var box=document.getElementById("garden-drugsbox"),lock=document.getElementById("garden-boxlock"),date=document.getElementById("garden-boxlock-date-hit"),submit=document.getElementById("garden-boxlock-submit");',
  ' var lockedPrevented=ctx(box),lockedMenu=document.querySelector(".mon-ctx"),lockedItems=lockedMenu?[].map.call(lockedMenu.querySelectorAll("button span"),function(x){return x.textContent;}):[];S("lockedCtx",{prevented:lockedPrevented,items:lockedItems});if(lockedMenu)lockedMenu.querySelector("button").click();await sleep(20);S("lockedCtxOpen",{showing:lock.classList.contains("showing"),locked:window.__drugsboxLocked(),trip:window.__tripState()});tap(document.getElementById("garden-boxlock-hit-u"));tap(submit);await sleep(1200);S("lockedCtxSolved",{locked:window.__drugsboxLocked(),trip:window.__tripState()});window.__resetDrugsbox();window.__setDrugsboxMonth(5);window.__drugsboxTap();',
  ' S("shape",{date:date.previousElementSibling.previousElementSibling.textContent,submit:submit.querySelector("text").textContent,wheels:lock.querySelectorAll(".boxlock-hit").length,submits:lock.querySelectorAll(".boxlock-submit").length});',
  ' var clips=[document.querySelector("#garden-boxlock-clip-t rect"),document.querySelector("#garden-boxlock-clip-u rect")],button=submit.querySelector("rect"),frame=Array.from(lock.children).find(function(el){return el.tagName==="rect"&&el.getAttribute("x")==="199";}),fades=Array.from(lock.querySelectorAll("rect")).filter(function(el){return /^url\\(#garden-boxlock-fade-/.test(el.getAttribute("fill")||"");});',
  ' S("layout",{rounded:clips.every(function(el){return el&&el.getAttribute("rx")==="7";}),raised:clips.every(function(el){return el&&el.getAttribute("y")==="150";}),fadesClipped:fades.length===4&&fades.every(function(el){return !!el.getAttribute("clip-path");}),buttonBottom:+button.getAttribute("y") + +button.getAttribute("height"),frameBottom:+frame.getAttribute("y") + +frame.getAttribute("height")});',
  ' tap(document.getElementById("garden-boxlock-hit-u"));var selectedBeforeClue=document.getElementById("garden-boxlock-drum-u").style.transform;tap(date);await sleep(40);S("clue",{phone:!!document.querySelector(".calx-phone"),lock:lock.classList.contains("showing"),unit:document.getElementById("garden-boxlock-drum-u").style.transform});',
  ' var shell=document.querySelector(".phone-shell");if(shell){shell.focus();shell.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));}await sleep(260);S("clueBack",{phone:!!document.querySelector(".phone-backdrop.show"),lock:lock.classList.contains("showing"),unit:document.getElementById("garden-boxlock-drum-u").style.transform,before:selectedBeforeClue});',
  ' var loftDateBefore=window.__loftControllers.date();tap(date);await sleep(40);var generic=[].find.call(document.querySelectorAll(".calx-day"),function(x){var n=x.querySelector(".calx-num");return n&&n.textContent==="23";});if(generic)tap(generic);await sleep(260);S("calendarDay",{phone:!!document.querySelector(".phone-backdrop.show"),lock:lock.classList.contains("showing"),tens:document.getElementById("garden-boxlock-drum-t").style.transform,unit:document.getElementById("garden-boxlock-drum-u").style.transform,date:window.__loftControllers.date(),before:loftDateBefore});',
  ' tap(date);await sleep(40);var wedding=document.querySelector(".calx-card-e .calx-card-row");if(wedding)tap(wedding);await sleep(260);S("calendarWedding",{phone:!!document.querySelector(".phone-backdrop.show"),lock:lock.classList.contains("showing"),tens:document.getElementById("garden-boxlock-drum-t").style.transform,unit:document.getElementById("garden-boxlock-drum-u").style.transform,date:window.__loftControllers.date(),before:loftDateBefore});',
  ' S("selected",{locked:window.__drugsboxLocked(),unit:document.getElementById("garden-boxlock-drum-u").style.transform});',
  ' tap(submit);S("may",{locked:window.__drugsboxLocked(),popped:document.getElementById("garden-boxlock-shackle").classList.contains("popped"),open:document.getElementById("garden-boxlock-shackle").classList.contains("open"),panel:lock.classList.contains("unlocked"),box:box.classList.contains("unlocked"),miniClosed:getComputedStyle(box.querySelector(".boxlock-mini-shackle-closed")).opacity,miniOpen:getComputedStyle(box.querySelector(".boxlock-mini-shackle-open")).opacity});',
  ' window.__resetDrugsbox();window.__setDrugsboxMonth(7);window.__drugsboxTap();tap(submit);await sleep(20);var b1=document.querySelector(".egg-bubble");var clues=[b1&&b1.textContent.trim()];tap(submit);await sleep(20);var b2=document.querySelector(".egg-bubble");clues.push(b2&&b2.textContent.trim());tap(submit);await sleep(20);var b3=document.querySelector(".egg-bubble");clues.push(b3&&b3.textContent.trim());S("wrong",{locked:window.__drugsboxLocked(),denied:submit.classList.contains("denied"),clues:clues});',
  ' tap(document.getElementById("garden-boxlock-hit-t"));S("julySelected",window.__drugsboxLocked());tap(submit);S("july",!window.__drugsboxLocked());',
  ' var openPrevented=ctx(box),picker=document.getElementById("garden-trip-picker"),rows=picker?[].slice.call(picker.querySelectorAll("[data-trip]")):[];S("tripPicker",{prevented:openPrevented,open:window.__tripPickerOpen(),title:picker&&picker.querySelector(".dj-pick-panel>text").textContent,ids:rows.map(function(x){return x.getAttribute("data-trip");}),labels:rows.map(function(x){var label=x.querySelector(".dj-pick-label"),street=x.querySelector(".dj-pick-street");return {formal:label&&label.firstElementChild&&label.firstElementChild.textContent,street:street&&street.textContent,italic:street&&getComputedStyle(street).fontStyle,color:street&&getComputedStyle(street).fill};})});var openCtxPrevented=ctx(box),sceneMenu=document.querySelector(".mon-ctx");S("tripPickerContext",{prevented:openCtxPrevented,menu:!!sceneMenu,open:window.__tripPickerOpen()});var advances=0,realNext=window.__gardenDoNext;window.__gardenDoNext=function(){advances++;return true;};var escPrevented=!document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true})),escClosed=!window.__tripPickerOpen();ctx(box);var backPrevented=!document.dispatchEvent(new KeyboardEvent("keydown",{key:"Backspace",bubbles:true,cancelable:true})),backClosed=!window.__tripPickerOpen();window.__gardenDoNext=realNext;S("tripPickerKeys",{escPrevented:escPrevented,escClosed:escClosed,backPrevented:backPrevented,backClosed:backClosed,advances:advances});ctx(box);picker=document.getElementById("garden-trip-picker");var acid=picker&&picker.querySelector("[data-trip=acid]");if(acid)tap(acid);S("tripPick",{open:window.__tripPickerOpen(),state:window.__tripState()});',
  ' window.__resetDrugsbox();window.__setLang("cs");ctx(box);var csMenu=document.querySelector(".mon-ctx");S("cs",{submit:submit.querySelector("text").textContent,unlock:csMenu&&csMenu.textContent.trim()});if(csMenu)document.body.click();window.__openPhoneAppHere("calendar",true);await sleep(40);var normal=[].find.call(document.querySelectorAll(".calx-day"),function(x){var n=x.querySelector(".calx-num");return n&&n.textContent==="17";});if(normal)tap(normal);S("normalCalendar",{date:window.__loftControllers.date(),url:location.href,phone:!!document.querySelector(".phone-backdrop.show")});window.__calResetToday();if(window.__closePhoneModal)window.__closePhoneModal(true);',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},300);});',
  '})();</script>'
].join("\n");

var failures=0;
function check(ok,msg,detail){if(ok)console.log("  ✓ "+msg);else{failures++;console.log("  ✗ "+msg+(detail?"   ["+JSON.stringify(detail)+"]":""));}}

console.log("rsvp.html garden magic-box lock:");
var r=lib.runPageSync("rsvp.html",HARNESS,3200,{patchRaf:true});
if(!r){console.log("  ✗ harness produced no report");process.exit(1);}
var s=r.steps;
check(r.errors.length===0,"no uncaught page errors",r.errors);
check(s.shape&&s.shape.date==="2027-05-??"&&s.shape.submit==="UNLOCK"&&s.shape.wheels===2&&s.shape.submits===1,"lock shows a partial date, two wheels, and one submit control",s.shape);
check(s.layout&&s.layout.rounded&&s.layout.raised&&s.layout.fadesClipped,"both digit drums and their fades are clipped to rounded windows",s.layout);
check(s.layout&&s.layout.frameBottom-s.layout.buttonBottom>=6,"Unlock button clears the lock's inner frame",s.layout);
check(s.clue&&s.clue.phone&&s.clue.lock&&/-40px/.test(s.clue.unit||""),"partial date opens Calendar over the live padlock",s.clue);
check(s.clueBack&&!s.clueBack.phone&&s.clueBack.lock&&s.clueBack.unit===s.clueBack.before,"Escape closes Calendar back to the same padlock state",s.clueBack);
check(s.calendarDay&&!s.calendarDay.phone&&s.calendarDay.lock&&/-80px/.test(s.calendarDay.tens||"")&&/-120px/.test(s.calendarDay.unit||"")&&JSON.stringify(s.calendarDay.date)===JSON.stringify(s.calendarDay.before),"choosing any Calendar day fills both lock drums and returns without time-travelling the loft",s.calendarDay);
check(s.calendarWedding&&!s.calendarWedding.phone&&s.calendarWedding.lock&&/\(0px\)/.test(s.calendarWedding.tens||"")&&/-40px/.test(s.calendarWedding.unit||"")&&JSON.stringify(s.calendarWedding.date)===JSON.stringify(s.calendarWedding.before),"choosing a wedding event row fills its day and returns to the live lock",s.calendarWedding);
check(s.lockedCtx&&s.lockedCtx.prevented&&s.lockedCtx.items.length===1&&s.lockedCtx.items[0]==="Unlock","locked box context menu contains only Unlock",s.lockedCtx);
check(s.lockedCtxOpen&&s.lockedCtxOpen.showing&&s.lockedCtxOpen.locked&&!s.lockedCtxOpen.trip.active,"the locked context action opens the ordinary padlock",s.lockedCtxOpen);
check(s.lockedCtxSolved&&!s.lockedCtxSolved.locked&&!s.lockedCtxSolved.trip.active,"solving through the context path unlocks without starting a trip",s.lockedCtxSolved);
check(s.selected&&s.selected.locked&&/-40px/.test(s.selected.unit||""),"selecting the correct May digits does not auto-unlock",s.selected);
check(s.may&&!s.may.locked&&s.may.popped&&s.may.open&&s.may.panel&&s.may.box&&s.may.miniClosed==="0"&&s.may.miniOpen==="1","submit opens both the close-up shackle and the box's settled miniature padlock",s.may);
check(s.wrong&&s.wrong.locked&&s.wrong.denied,"submit rejects an incorrect July answer",s.wrong);
check(s.wrong&&JSON.stringify(s.wrong.clues)===JSON.stringify(["It’s one of our wedding dates, try again.","Click on the date above.","July 10, 2027 — Prague."]),"every failed attempt shows the next useful clue",s.wrong);
check(s.julySelected&&s.july,"correct July 10 remains locked until submit",{selected:s.julySelected,submitted:s.july});
check(s.tripPicker&&s.tripPicker.prevented&&s.tripPicker.open&&s.tripPicker.title==="vitamins"&&s.tripPicker.ids.join(",")==="nitrous,shrooms,acid,froggies,dmt,molly,ketamine,iboga","unlocked box context opens the complete trip chooser",s.tripPicker);
check(s.tripPicker&&JSON.stringify(s.tripPicker.labels.map(function(x){return [x.formal,x.street];}))===JSON.stringify([["Nitrous oxide","laughing gas"],["Psilocybin","shrooms"],["LSD","acid"],["5-MeO-DMT","froggies"],["N,N-DMT","DMT"],["MDMA","molly"],["Ketamine","k"],["Ibogaine","iboga"]])&&s.tripPicker.labels.every(function(x){return x.italic==="italic"&&x.color==="rgb(200, 154, 103)";}),"trip chooser pairs every formal name with an italic warm-brown street name",s.tripPicker);
check(s.tripPickerContext&&s.tripPickerContext.prevented&&!s.tripPickerContext.menu&&s.tripPickerContext.open,"right-clicking open vitamins is consumed without a generic action or closing the chooser",s.tripPickerContext);
check(s.tripPickerKeys&&s.tripPickerKeys.escPrevented&&s.tripPickerKeys.escClosed&&s.tripPickerKeys.backPrevented&&s.tripPickerKeys.backClosed&&s.tripPickerKeys.advances===0,"Escape and Backspace dismiss vitamins without advancing the room",s.tripPickerKeys);
check(s.tripPick&&!s.tripPick.open&&s.tripPick.state.active&&s.tripPick.state.variant==="acid","choosing a trip starts it and dismisses the chooser",s.tripPick);
check(s.cs&&s.cs.submit==="ODEMKNOUT"&&s.cs.unlock==="Odemknout","padlock and context action follow the Czech language",s.cs);
check(s.normalCalendar&&s.normalCalendar.date&&s.normalCalendar.date.day===17&&/[?&]date=\d{4}-\d{2}-17/.test(s.normalCalendar.url),"Calendar day choices keep their ordinary loft date-navigation behavior without an active padlock",s.normalCalendar);

console.log("");
if(failures){console.log(failures+" check(s) failed.");process.exit(1);}
console.log("All checks passed.");
