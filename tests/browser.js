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
ok("address field advertises search", r.placeholder === "Search or enter address");
ok("visible arrow submits search text", r.pointerGo === true);
var src = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
ok("search frames stay inside the frame holder",
  src.indexOf("browserFrameHolder.appendChild(tab.frame)") !== -1 &&
  src.indexOf("browserPage.appendChild(tab.frame)") === -1);
if (fail) { console.error("\n" + fail + " monitor-browser check(s) failed."); process.exit(1); }
console.log("\nAll monitor-browser checks passed.");
