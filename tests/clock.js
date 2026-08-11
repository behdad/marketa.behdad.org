#!/usr/bin/env node
// Focused monitor Clock coverage: toolbar launch, shared phone renderer, Back,
// running-app registration, and the Clock-specific context-menu Kill lifecycle.
"use strict";
var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  "<script>",
  "(function(){",
  "  function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}",
  "  var report={errors:[],steps:{}}; function S(k,v){report.steps[k]=v;}",
  "  function mon(){return document.getElementById('office-monitor');}",
  "  function openClock(){var el=document.getElementById('monitor-desk-clock'); if(el)el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true})); return el;}",
  "  function key(k){window.dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true,cancelable:true}));}",
  "  function ctxAt(el){var r=el.getBoundingClientRect(); return !el.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2}));}",
  "  async function run(){",
  "    history.replaceState(null,'',location.pathname+'?date=2027-05-01');",
  "    if(window.__goToStage)window.__goToStage('office'); await sleep(100);",
  "    var m=mon(); m.classList.add('screen-on','show-caps'); m.classList.remove('show-saver','show-fedora'); window.__currentStageName='office';",
  "    var toolbar=openClock(); await sleep(30); var wrap=document.getElementById('monitor-clock-wrap');",
  "    S('opened',!!toolbar&&m.classList.contains('show-clock'));",
  "    var leakedClicks=0; m.addEventListener('click',function(){leakedClicks++;}); wrap.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true})); S('click_contained',leakedClicks===0);",
  "    S('shared_ui',!!wrap&&!!wrap.querySelector('.pm-clock.mon-clock')&&!!wrap.querySelector('.pmk-e-t')&&!!wrap.querySelector('.pmk-p-t')&&!!wrap.querySelector('.pmk-t-t')&&!!wrap.querySelector('.pmk-l-t')&&!!wrap.querySelector('.pmk-e-cd')&&!!wrap.querySelector('.pmk-p-cd')&&!!wrap.querySelector('.pmk-pt')&&!!wrap.querySelector('.pmk-slider'));",
  "    var cards=wrap.querySelectorAll('.pmk-cd'), slider=wrap.querySelector('.pmk-slider'), reset=wrap.querySelector('.pmk-treset'), resetRow=wrap.querySelector('.pmk-trow2');",
  "    S('world_clocks',cards.length===4&&cards[0].getAttribute('data-time-zone')==='America/Edmonton'&&cards[1].getAttribute('data-time-zone')==='Europe/Prague'&&cards[2].getAttribute('data-time-zone')==='Asia/Tehran'&&cards[3].getAttribute('data-time-zone')==='Europe/Berlin'&&cards[2].textContent.indexOf('Tehran')>=0&&cards[3].textContent.indexOf('Lübeck')>=0&&!!wrap.querySelector('.pmk-t-t').textContent&&!!wrap.querySelector('.pmk-l-t').textContent);",
  "    S('monitor_precision',slider.step==='1'&&slider.max==='1439');",
  "    S('reset_hidden_live',resetRow.hidden===true&&reset.disabled===true&&location.search.indexOf('date=2027-05-01')>=0&&location.search.indexOf('time=')<0);",
  "    slider.value='330'; slider.stepUp(); slider.dispatchEvent(new Event('input',{bubbles:true})); await sleep(20);",
  "    S('minute_step',slider.value==='331'&&wrap.querySelector('.pmk-tval').textContent==='05:31'&&/[?&]time=05:31/.test(location.search));",
  "    S('reset_shown_override',resetRow.hidden===false&&reset.disabled===false); reset.click(); await sleep(20);",
  "    S('reset_preserves_date',location.search.indexOf('date=2027-05-01')>=0&&location.search.indexOf('time=')<0&&resetRow.hidden===true&&reset.disabled===true);",
  "    var phoneHost=document.createElement('div'); document.body.appendChild(phoneHost); var phoneClean=window.__renderLoftClock(phoneHost,{isActive:function(){return true;}}); var phoneSlider=phoneHost.querySelector('.pmk-slider');",
  "    S('phone_layout',phoneHost.querySelectorAll('.pmk-cd').length===4&&phoneSlider.step==='1'&&phoneSlider.max==='47'&&phoneHost.querySelector('.pmk-trow2').hidden===true); if(phoneClean)phoneClean(); phoneHost.remove();",
  "    history.replaceState(null,'',location.pathname); if(window.__refreshTimePill)window.__refreshTimePill(); var dateNav=document.querySelector('.loft-datenav'),timeNav=document.getElementById('loft-timenav'); S('hud_hidden_without_override',dateNav.style.display==='none'&&timeNav.style.display==='none');",
  "    S('timelapse_removed',typeof window.timelapse==='undefined'&&typeof window.daylapse==='undefined'&&typeof window.__stopDaylapse==='undefined'&&!wrap.querySelector('.pmk-timelapse')&&!document.getElementById('loft-timelapse-btn'));",
  "    if(window.__goToStage)window.__goToStage('office'); m.classList.add('screen-on','show-clock'); window.__currentStageName='office';",
  "    if(window.__setLang)window.__setLang('cs'); await sleep(20); wrap=document.getElementById('monitor-clock-wrap'); var csCards=wrap.querySelectorAll('.pmk-cd'); S('cs_world_clocks',csCards.length===4&&csCards[1].textContent.indexOf('Praha')>=0&&csCards[2].textContent.indexOf('Teherán')>=0&&csCards[3].textContent.indexOf('Lübeck')>=0&&Array.prototype.every.call(wrap.querySelectorAll('.pmk-city'),function(el){return el.scrollWidth<=el.clientWidth+1;})); if(window.__setLang)window.__setLang('en'); await sleep(20);",
  "    S('registry',!!window.__monitorAppRunning&&window.__monitorAppRunning('clock')===true&&!document.getElementById('monitor-dock-clock'));",
  "    S('back_consumed',!!(window.__closeTopMonitorApp&&window.__closeTopMonitorApp(true)));",
  "    S('back_closed',!m.classList.contains('show-clock')&&window.__monitorAppRunning('clock')===true);",
  "    m.classList.add('show-caps'); if(window.__monitorZoomIn)window.__monitorZoomIn(); await sleep(20); ['c','l','o'].forEach(key); var search=window.__monitorDockSearch&&window.__monitorDockSearch(); S('search_match',!!search&&search.match==='clock'); key('Tab'); await sleep(20); S('search_opened',m.classList.contains('show-clock'));",
  "    S('menu_prevented',ctxAt(m)); var menu=document.querySelector('.mon-ctx'); var kill=menu&&menu.querySelector('.ctx-kill'); S('kill_available',!!kill&&!kill.disabled&&!menu.querySelector('.ctx-restart')); if(kill)kill.click();",
  "    await sleep(50); S('kill_started',m.classList.contains('death-clock')&&m.classList.contains('show-clock')&&!window.__monitorAppRunning('clock'));",
  "    await sleep(2350); S('kill_finished',!m.classList.contains('death-clock')&&!m.classList.contains('show-clock')&&!window.__monitorAppRunning('clock'));",
  "    report.errors=window.__errs||[]; document.getElementById('__report').textContent=JSON.stringify(report);",
  "  }",
  "  window.addEventListener('load',function(){setTimeout(function(){run().catch(function(e){report.errors.push(String(e&&e.stack||e));document.getElementById('__report').textContent=JSON.stringify(report);});},300);});",
  "})();",
  "</script>"
].join("\n");

var rep=lib.runPageSync("rsvp.html",HARNESS,7000,{patchRaf:true});
if(!rep){console.log("  ✗ harness produced no report");process.exit(1);}
var s=rep.steps||{},fails=0;
function check(name,ok,detail){if(ok)console.log("  ✓ "+name);else{fails++;console.log("  ✗ "+name+(detail!==undefined?"   ["+JSON.stringify(detail)+"]":""));}}
console.log("monitor Clock:");
check("toolbar time opens Clock",s.opened===true);
check("Clock surface clicks stay inside the app",s.click_contained===true);
check("monitor uses the full shared city/countdown/playtime/time-control renderer",s.shared_ui===true);
check("Edmonton, Prague, Tehran, and Lübeck render as four live world clocks",s.world_clocks===true);
check("monitor range exposes 1-minute precision",s.monitor_precision===true);
check("date-only/live time hides and disables Reset",s.reset_hidden_live===true);
check("monitor stepUp advances and writes exactly one minute",s.minute_step===true);
check("an explicit time override reveals Reset",s.reset_shown_override===true);
check("Reset clears only time, preserves date, then hides again",s.reset_preserves_date===true);
check("phone shares the four-city layout while retaining half-hour range",s.phone_layout===true);
check("date/time HUD is hidden without an override",s.hud_hidden_without_override===true);
check("Timelapse controls and hooks are absent",s.timelapse_removed===true);
check("Czech city labels localize and fit the monitor cards",s.cs_world_clocks===true);
check("Clock is registered without a duplicate desktop tile",s.registry===true);
check("Back closes Clock normally and retains its running session",s.back_consumed===true&&s.back_closed===true,{consumed:s.back_consumed,closed:s.back_closed});
check("desktop autocomplete finds and opens toolbar-only Clock",s.search_match===true&&s.search_opened===true,{match:s.search_match,opened:s.search_opened});
check("right-click offers enabled Kill without Restart",s.menu_prevented===true&&s.kill_available===true,{prevented:s.menu_prevented,available:s.kill_available});
check("Kill runs the clock gag, clears the registry, and tears down",s.kill_started===true&&s.kill_finished===true,{started:s.kill_started,finished:s.kill_finished});
check("no uncaught JS errors",Array.isArray(rep.errors)&&rep.errors.length===0,rep.errors);
console.log("\n"+(fails?("FAILED "+fails+" check(s)"):"All Clock checks passed."));
process.exit(fails?1:0);
