#!/usr/bin/env node
// Pocket Hacker News regression: list → in-app external/self detail → Back,
// bounded threaded comments, safe rich text, retained detail, and reset.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function response(value){return Promise.resolve({ok:true,json:function(){return Promise.resolve(value);}});}',
  'var items={',
  ' 101:{id:101,type:"story",by:"ext-author",time:1780000000,score:42,descendants:3,title:"An external article",url:"https://example.com/read",kids:[201,202]},',
  ' 102:{id:102,type:"story",by:"self-author",time:1780000100,score:17,descendants:1,title:"Ask HN: self post",text:"<p>Hello <strong>readers</strong>.</p><script>window.__hnInjected=true<"+"/script><a href=\\"javascript:alert(1)\\">bad link</a><p><a href=\\"https://safe.example/path\\">safe link</a></p>",kids:[301]},',
  ' 201:{id:201,type:"comment",by:"alice",time:1780000200,text:"<p>first <b>comment</b></p><img src=x onerror=\\"window.__hnInjected=true\\">",kids:[211]},',
  ' 202:{id:202,type:"comment",by:"carol",time:1780000400,text:"<p>second root</p>"},',
  ' 211:{id:211,type:"comment",by:"bob",time:1780000300,text:"<p>nested reply</p>"},',
  ' 301:{id:301,type:"comment",by:"dana",time:1780000500,text:"<p>self reply</p>"}',
  '};',
  'var itemCalls=[],topCalls=0,opened=[];',
  'window.fetch=function(url){url=String(url);if(/topstories\\.json$/.test(url)){topCalls++;return response([101,102]);}var m=/\\/item\\/(\\d+)\\.json$/.exec(url);if(m){itemCalls.push(+m[1]);return response(items[m[1]]||null);}return Promise.resolve({ok:false,json:function(){return Promise.resolve(null);}});};',
  'window.open=function(url,target,features){opened.push({url:String(url),target:target,features:features});return null;};',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},300);',
  'async function run(){',
  ' window.phone.open("hn");await sleep(180);',
  ' var rows=document.querySelectorAll(".pmh-item");S("list",{rows:rows.length,opened:opened.length,topCalls:topCalls,titles:[].map.call(rows,function(x){return x.querySelector(".pmh-t").textContent;})});',
  ' rows[0].click();await sleep(180);var ext=document.querySelector(".pm-hn");',
  ' S("external",{detail:!!ext.getAttribute("data-story-id"),title:ext.querySelector(".pmh-detail-title").textContent,source:ext.querySelector(".pmh-source").textContent,landing:!!ext.querySelector(".pmh-landing"),story:!!ext.querySelector(".pmh-story"),comments:[].map.call(ext.querySelectorAll(".pmh-comment .pmh-rich"),function(x){return x.textContent.trim();}),depths:[].map.call(ext.querySelectorAll(".pmh-comment"),function(x){return x.style.getPropertyValue("--depth");}),opened:opened.length,itemCalls:itemCalls.slice(),injected:!!window.__hnInjected,img:!!ext.querySelector(".pmh-comment img")});',
  ' ext.querySelector(".pmh-action").click();await sleep(20);S("original",{opened:opened.slice()});',
  ' document.querySelector(".pnav-back").click();await sleep(40);S("back",{rows:document.querySelectorAll(".pmh-item").length,app:document.querySelector(".phone-shell").classList.contains("pm-app"),topCalls:topCalls});',
  ' document.querySelectorAll(".pmh-item")[1].click();await sleep(100);var self=document.querySelector(".pm-hn"),safe=self.querySelector(".pmh-story a");',
  ' S("self",{landing:!!self.querySelector(".pmh-landing"),story:self.querySelector(".pmh-story .pmh-rich").textContent.trim(),links:self.querySelectorAll(".pmh-story a").length,safeHref:safe&&safe.getAttribute("href"),script:!!self.querySelector("script"),injected:!!window.__hnInjected,comments:self.querySelectorAll(".pmh-comment").length});',
  ' window.__closePhoneModal(true);await sleep(260);window.phone.open("hn");await sleep(80);S("resume",{detail:document.querySelector(".pm-hn").getAttribute("data-story-id"),topCalls:topCalls});',
  ' document.querySelector(".phone-shell").dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));await sleep(40);S("escapeBack",{rows:document.querySelectorAll(".pmh-item").length,open:!!document.querySelector(".phone-backdrop.show")});',
  ' window.__closePhoneModal(true);await sleep(260);window.__resetPhoneApps();window.phone.open("hn");await sleep(160);S("reset",{detail:document.querySelector(".pm-hn").getAttribute("data-story-id"),rows:document.querySelectorAll(".pmh-item").length,topCalls:topCalls});',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html pocket Hacker News reader:");
var r = lib.runPageSync("rsvp.html", HARNESS, 5000, { patchRaf: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps || {};
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.list && s.list.rows === 2 && s.list.opened === 0 && s.list.topCalls === 1,
  "top stories load as an in-app list without opening a tab", s.list);
check(s.external && s.external.detail && s.external.title === "An external article" &&
  s.external.source === "example.com" && s.external.landing && !s.external.story && s.external.opened === 0,
  "an external story opens a source-labelled landing view", s.external);
check(s.external && s.external.comments.join("|") === "first comment|nested reply|second root" &&
  s.external.depths.join("|") === "0|1|0" && !s.external.injected && !s.external.img,
  "bounded descendants render in thread order through the safe rich-text tree", s.external);
check(s.original && s.original.opened.length === 1 &&
  s.original.opened[0].url === "https://example.com/read" &&
  s.original.opened[0].target === "_blank" &&
  s.original.opened[0].features === "noopener",
  "only Open original uses the phone’s opener-isolated external-tab path", s.original);
check(s.back && s.back.rows === 2 && s.back.app && s.back.topCalls === 1,
  "phone Back returns from detail to the cached list", s.back);
check(s.self && !s.self.landing && /Hello readers/.test(s.self.story) && s.self.links === 1 &&
  s.self.safeHref === "https://safe.example/path" && !s.self.script && !s.self.injected && s.self.comments === 1,
  "self-post text and comments stay readable while unsafe markup and URLs are removed", s.self);
check(s.resume && s.resume.detail === "102" && s.resume.topCalls === 1,
  "dismiss and reopen resume the selected story without refetching the top list", s.resume);
check(s.escapeBack && s.escapeBack.rows === 2 && s.escapeBack.open,
  "Escape consumes story detail before direct-launch close behavior", s.escapeBack);
check(s.reset && !s.reset.detail && s.reset.rows === 2 && s.reset.topCalls === 2,
  "full reset clears the HN selection and cache", s.reset);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
