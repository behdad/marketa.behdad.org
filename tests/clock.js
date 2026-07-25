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
  "    if(window.goToStage)window.goToStage('office'); await sleep(100);",
  "    var m=mon(); m.classList.add('screen-on','show-caps'); m.classList.remove('show-saver','show-fedora'); window.currentStageName='office';",
  "    var toolbar=openClock(); await sleep(30); var wrap=document.getElementById('monitor-clock-wrap');",
  "    S('opened',!!toolbar&&m.classList.contains('show-clock'));",
  "    S('shared_ui',!!wrap&&!!wrap.querySelector('.pm-clock.mon-clock')&&!!wrap.querySelector('.pmk-e-t')&&!!wrap.querySelector('.pmk-p-t')&&!!wrap.querySelector('.pmk-e-cd')&&!!wrap.querySelector('.pmk-p-cd')&&!!wrap.querySelector('.pmk-pt')&&!!wrap.querySelector('.pmk-slider')&&!!wrap.querySelector('.pmk-timelapse'));",
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
check("monitor uses the full shared city/countdown/playtime/time-control renderer",s.shared_ui===true);
check("Clock is registered without a duplicate desktop tile",s.registry===true);
check("Back closes Clock normally and retains its running session",s.back_consumed===true&&s.back_closed===true,{consumed:s.back_consumed,closed:s.back_closed});
check("desktop autocomplete finds and opens toolbar-only Clock",s.search_match===true&&s.search_opened===true,{match:s.search_match,opened:s.search_opened});
check("right-click offers enabled Kill without Restart",s.menu_prevented===true&&s.kill_available===true,{prevented:s.menu_prevented,available:s.kill_available});
check("Kill runs the clock gag, clears the registry, and tears down",s.kill_started===true&&s.kill_finished===true,{started:s.kill_started,finished:s.kill_finished});
check("no uncaught JS errors",Array.isArray(rep.errors)&&rep.errors.length===0,rep.errors);
console.log("\n"+(fails?("FAILED "+fails+" check(s)"):"All Clock checks passed."));
process.exit(fails?1:0);
