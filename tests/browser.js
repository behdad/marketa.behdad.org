#!/usr/bin/env node
"use strict";
var lib = require("./lib");
var fs = require("fs");
var path = require("path");

var HARNESS = [
  "<pre id=\"__report\">pending</pre>",
  "<script>",
  "(function(){",
  " var report={errors:window.__errs||[]};",
  " try {",
  " var opened=null; window.open=function(url,target,features){opened={url:url,target:target,features:features};};",
  " var external=document.getElementById('monitor-browser-external');",
  " var marketa=document.querySelector('.browser-tab [data-i=\"tab_marketa\"]');",
  " if(marketa)marketa.closest('.browser-tab').click();",
  " if(external)external.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));",
  " report.control=!!external;",
  " report.label=external&&external.getAttribute('aria-label');",
  " report.opened=opened;",
  " var fixedTabs=document.querySelectorAll('.browser-tab [data-i^=\"tab_\"]');",
  " report.fixedCloseButtons=[].every.call(fixedTabs,function(label){return !!label.closest('.browser-tab').querySelector('.tab-x');});",
  " var behdad=document.querySelector('.browser-tab [data-i=\"tab_behdad\"]'),behdadStyle=behdad&&getComputedStyle(behdad);",
  " report.titleInset=behdadStyle&&parseFloat(behdadStyle.paddingLeft);",
  " var marketaTab=marketa&&marketa.closest('.browser-tab');var marketaX=marketaTab&&marketaTab.querySelector('.tab-x');if(marketaX)marketaX.click();",
  " report.fixedClosed=!document.querySelector('.browser-tab [data-i=\"tab_marketa\"]')&&document.querySelectorAll('.browser-tab [data-i^=\"tab_\"]').length===3;",
  " var browserClose=document.getElementById('monitor-browser-close'),chromeColors=browserClose&&browserClose.querySelectorAll('.browser-close-chrome>path');",
  " report.chromeDismiss=!!(browserClose&&browserClose.classList.contains('chrome-host')&&chromeColors.length===3&&[].map.call(chromeColors,function(p){return p.getAttribute('fill');}).join('|')==='#ea4335|#34a853|#fbbc05');",
  " var mon=document.getElementById('office-monitor'),siteClose=document.getElementById('monitor-site-close'),siteCloseBase=siteClose&&siteClose.querySelector('.site-close-base'),siteCloseX=siteClose&&siteClose.querySelector('.site-close-x');mon.classList.add('screen-on','show-harfbuzz');report.visitedSiteTheme=!!(siteClose&&siteClose.getAttribute('transform')==='translate(0,-2)'&&getComputedStyle(siteCloseBase).fill==='rgb(202, 169, 106)'&&getComputedStyle(siteCloseX).stroke==='rgb(36, 22, 17)');mon.classList.remove('show-harfbuzz');mon.classList.add('show-behdad');if(siteClose)siteClose.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));report.visitedSiteDismiss=!!(siteClose&&mon.classList.contains('show-caps')&&!mon.classList.contains('show-behdad'));",
  " var input=document.getElementById('monitor-browser-url');",
  " report.placeholder=input&&input.getAttribute('placeholder');",
  " var plus=document.querySelector('.browser-tab-plus'); if(plus)plus.click();",
  " input.value='test';",
  " var go=document.getElementById('monitor-browser-go');",
  " if(go)go.dispatchEvent(new PointerEvent('pointerdown',{button:0,bubbles:true,cancelable:true}));",
  " report.pointerGo=!!document.querySelector('.browser-frame-holder iframe:not(#monitor-browser-frame)')&&!input.value;",
  " } catch(e) { report.harnessError=String(e&&e.stack||e); }",
  " document.getElementById('__report').textContent=JSON.stringify(report);",
  "})();",
  "</script>"
].join("\n");

var r = lib.runPageSync("rsvp.html", HARNESS, 3000, { patchRaf: true });
var fail = 0;
function ok(name, cond) { console.log((cond ? "  ✓ " : "  ✗ ") + name); if (!cond) fail++; }
console.log("monitor browser:");
if (!r) { console.error("  ✗ no report captured"); process.exit(1); }
if (r.harnessError) console.error("  harness: " + r.harnessError);
ok("no uncaught JS errors", r.errors.length === 0);
ok("browser harness completed", !r.harnessError);
ok("external-tab control is labelled", r.control && r.label === "Open in a real tab");
ok("external-tab control opens the active tab safely",
  r.opened && r.opened.url === "https://marketajakesova.ca/" &&
  r.opened.target === "_blank" && r.opened.features === "noopener");
ok("every preloaded tab has its own close control", r.fixedCloseButtons === true);
ok("tab titles leave antialiasing room before their first glyph", r.titleInset >= 0.25);
ok("closing a preloaded tab removes only that tab for the session", r.fixedClosed === true);
ok("Chrome hosts get the red, green, and yellow Browser dismiss pill", r.chromeDismiss === true);
ok("the behdad.org / harfbuzz landing display has a working dismiss control", r.visitedSiteDismiss === true);
ok("the landing-display close control sits high and adopts HarfBuzz World's brass palette", r.visitedSiteTheme === true);
ok("address field advertises search", r.placeholder === "Search or enter address");
ok("visible arrow submits search text", r.pointerGo === true);
var src = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
ok("search frames stay inside the frame holder",
  src.indexOf("browserFrameHolder.appendChild(tab.frame)") !== -1 &&
  src.indexOf("browserPage.appendChild(tab.frame)") === -1);
if (fail) { console.error("\n" + fail + " monitor-browser check(s) failed."); process.exit(1); }
console.log("\nAll monitor-browser checks passed.");
