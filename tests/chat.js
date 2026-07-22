#!/usr/bin/env node
// Monitor Chat UI + proxy contract. Weather leaves the desktop grid but remains reachable
// from Edmonton's menu-bar readout; Chat owns the tile and posts read-only game context.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function click(el){if(el)el.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));}',
  'var report={errors:[],steps:{}}; function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},350);});',
  'async function run(){',
  ' if(window.goToStage)window.goToStage("office"); await sleep(120);',
  ' var mon=document.getElementById("office-monitor"); mon.classList.add("here","screen-on","show-caps");',
  ' var chatTile=document.getElementById("monitor-dock-chat");',
  ' S("tiles",{chat:!!chatTile,weather:!!document.getElementById("monitor-dock-weather"),icon:chatTile&&chatTile.querySelector("use")&&chatTile.querySelector("use").getAttribute("href")});',
  ' click(chatTile); await sleep(100);',
  ' var input=document.getElementById("monitor-chat-input"), form=document.getElementById("monitor-chat-form"), log=document.getElementById("monitor-chat-log");',
  ' S("opened",{chat:mon.classList.contains("show-chat"),greeting:log.textContent,inputDir:input.getAttribute("dir"),endpoint:window.__monitorChatEndpoint,turnstileSitekey:window.__monitorChatTurnstileSitekey});',
  ' var captured=null, release=null, oldFetch=window.fetch;',
  ' window.__monitorChatTurnstile=function(){return Promise.resolve("test-turnstile-token");};',
  ' window.fetch=function(url,opts){captured={url:String(url),method:opts&&opts.method,headers:opts&&opts.headers,body:opts&&opts.body};return new Promise(function(resolve){release=function(){resolve(new Response(JSON.stringify({reply:"سلام، من اینجا هستم."}),{status:200,headers:{"Content-Type":"application/json"}}));};});};',
  ' input.value="سلام"; input.dispatchEvent(new Event("input",{bubbles:true})); form.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true})); await sleep(30);',
  ' S("pending",{thinking:/Thinking|Přemýšlím/.test(log.textContent),disabled:input.disabled,captured:!!captured});',
  ' if(release)release(); await sleep(120); window.fetch=oldFetch;',
  ' var payload=captured?JSON.parse(captured.body):null, messages=log.querySelectorAll(".chat-msg"); var last=messages[messages.length-1];',
  ' S("request",{url:captured&&captured.url,method:captured&&captured.method,message:payload&&payload.message,language:payload&&payload.language,turnstileToken:payload&&payload.turnstile_token,context:payload&&payload.context,history:payload&&payload.history});',
  ' S("persian",{text:last&&last.textContent,dir:last&&last.getAttribute("dir"),computed:last&&getComputedStyle(last).direction,history:window.__monitorChatHistory&&window.__monitorChatHistory(),fits:document.getElementById("monitor-chat-wrap").scrollWidth<=document.getElementById("monitor-chat-wrap").clientWidth});',
  ' click(document.getElementById("monitor-chat-close")); await sleep(30); mon.classList.add("show-caps"); click(chatTile); await sleep(60);',
  ' S("retained",{open:mon.classList.contains("show-chat"),reply:/سلام، من/.test(log.textContent)});',
  ' setLang("cs"); await sleep(30); S("czech",{title:document.querySelector(".chat-bar-title").textContent,greeting:log.querySelector(".chat-msg.assistant").textContent,reply:/سلام، من/.test(log.textContent)});',
  ' if(window.resetMonitorAppState)window.resetMonitorAppState("chat"); await sleep(30); S("killed",{closed:!mon.classList.contains("show-chat"),history:window.__monitorChatHistory&&window.__monitorChatHistory().length});',
  ' mon.classList.add("show-caps"); click(document.getElementById("monitor-desk-weather")); await sleep(40); S("toolbarWeather",mon.classList.contains("show-weather")); if(window.__closeMonitorWeather)window.__closeMonitorWeather();',
  ' mon.classList.add("show-caps"); var weatherResult=window.__openMonitorApp&&window.__openMonitorApp("weather"); S("weatherHidden",{resultIsList:Array.isArray(weatherResult),open:mon.classList.contains("show-weather")});',
  ' var tower=document.getElementById("office-pc-desk-trio"); if(tower)tower.classList.add("on"); mon.classList.add("here","screen-on","show-caps"); var chatResult=window.__openMonitorApp&&window.__openMonitorApp("chat"); await sleep(30); S("consoleChat",{result:chatResult,open:mon.classList.contains("show-chat")});',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) { if (ok) console.log("  ✓ " + msg); else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); } }

console.log("rsvp.html monitor Chat:");
var r = lib.runPageSync("rsvp.html", HARNESS, 3500, { patchRaf: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.tiles.chat && !s.tiles.weather && s.tiles.icon === "#dicon-chat", "Chat replaces Weather in the desktop grid with its own icon", s.tiles);
check(s.opened.chat && /know this loft/.test(s.opened.greeting) && s.opened.inputDir === "auto", "Chat opens with its welcome and direction-aware input", s.opened);
check(s.opened.endpoint === "https://marketa.behdad.org/chat", "Chat exposes the exact Cloudflare proxy endpoint", s.opened.endpoint);
check(/^0x/.test(s.opened.turnstileSitekey || ""), "Chat exposes the public Turnstile site key", s.opened.turnstileSitekey);
check(s.pending.thinking && s.pending.disabled && s.pending.captured, "submitting shows a disabled pending state while the Worker is in flight", s.pending);
check(s.request.url === "https://marketa.behdad.org/chat" && s.request.method === "POST" && s.request.message === "سلام" && s.request.language === "auto", "Worker receives a JSON POST with the message and automatic-language contract", s.request);
check(s.request.turnstileToken === "test-turnstile-token", "Chat attaches a fresh Turnstile token to the Worker request", s.request.turnstileToken);
check(s.request.context && s.request.context.room === "office" && s.request.context.phase === 1 && Array.isArray(s.request.context.unlocked_rooms) && s.request.context.date && s.request.context.time, "request includes compact read-only game context", s.request.context);
check(s.persian.text === "سلام، من اینجا هستم." && s.persian.dir === "auto" && s.persian.computed === "rtl" && s.persian.fits, "Persian response paints RTL without horizontal overflow", s.persian);
check(s.persian.history.length === 2 && s.persian.history[0].role === "user" && s.persian.history[1].role === "assistant", "local history records the user and assistant turns", s.persian.history);
check(s.retained.open && s.retained.reply, "ordinary close and reopen retains the conversation", s.retained);
check(s.czech.title === "chat" && /Znám tenhle loft/.test(s.czech.greeting) && s.czech.reply, "site-language switch localizes chrome without altering the conversation", s.czech);
check(s.killed.closed && s.killed.history === 0, "Kill closes Chat and clears retained conversation state", s.killed);
check(s.toolbarWeather === true && s.weatherHidden.resultIsList && !s.weatherHidden.open, "Weather opens from Edmonton toolbar but not from the desktop/console app roster", { toolbar: s.toolbarWeather, hidden: s.weatherHidden });
check(s.consoleChat.open && /chat/.test(s.consoleChat.result || ""), "computer(\"chat\") opens the new monitor app", s.consoleChat);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
