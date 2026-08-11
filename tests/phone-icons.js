#!/usr/bin/env node
// Pocket-phone vector icons must paint without cross-SVG <use> references. A
// Chromium/Mac combination left every such shadow tree blank while HTML/emoji
// tiles survived, so exercise both launcher layouts and the recent-app surface.
"use strict";

var lib = require("./lib");

function harness(lang) {
  return [
    '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
    '<script>(function(){',
    'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
    'var report={errors:[],lang:' + JSON.stringify(lang) + '};',
    'function snap(sel){return Array.prototype.map.call(document.querySelectorAll(sel),function(svg){var b=svg.getBBox();return {id:svg.getAttribute("data-phone-vector-icon"),direct:svg.children.length>0&&!svg.querySelector("use"),box:[b.x,b.y,b.width,b.height],localDepth:!svg.innerHTML.includes("url(#dicon-cream-depth)")};});}',
    'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
    'async function run(){',
    ' window.__setLang(' + JSON.stringify(lang) + ');window.__openPhoneModal(true);await sleep(100);',
    ' report.home=snap(".phone-app-tile .pat-ico svg[data-phone-vector-icon]");',
    ' var expected=["call","mail","album","photobooth","music","weather","currency","browser","mines"];report.ids=expected.map(function(id){var t=document.getElementById("phone-app-"+id),s=t&&t.querySelector("svg[data-phone-vector-icon]");return {id:id,found:!!s,label:!!(t&&t.querySelector(".pat-label")&&t.querySelector(".pat-label").textContent.trim())};});',
    ' document.getElementById("phone-app-call").click();await sleep(30);var call=document.querySelector(".dial-call-btn svg[data-phone-vector-icon=phone]");report.dial=call?{direct:!call.querySelector("use"),box:(function(b){return [b.x,b.y,b.width,b.height];})(call.getBBox())}:null;',
    ' document.querySelector(".pnav-home").click();document.getElementById("phone-app-mail").click();await sleep(20);document.querySelector(".pnav-recents").click();await sleep(20);report.recents=snap(".phone-recent-app .pra-ico svg[data-phone-vector-icon]");',
    '}',
    '})();</script>'
  ].join("\n");
}

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}
function visible(rows) {
  return rows.length > 0 && rows.every(function (row) { return row.direct && row.box[2] > 0 && row.box[3] > 0 && row.localDepth; });
}
function run(label, lang, flags) {
  console.log("rsvp.html pocket-phone vector icons (" + label + "):");
  var r = lib.runPageSync("rsvp.html", harness(lang), 2600, { patchRaf: true, chromeFlags: flags });
  if (!r) { check(false, "harness produced a report"); return; }
  check(r.errors.length === 0, "no uncaught page errors", r.errors);
  check(r.ids.length === 9 && r.ids.every(function (item) { return item.found && item.label; }), "all vector launcher apps retain visible localized labels and icon geometry", r.ids);
  check(visible(r.home) && r.home.length === 9, "launcher vectors are direct, non-empty geometry with self-contained gradients", r.home);
  check(r.dial && r.dial.direct && r.dial.box[2] > 0 && r.dial.box[3] > 0, "the Dialer call control also avoids a cross-SVG use reference", r.dial);
  check(visible(r.recents), "recent-app vector icons use the same self-contained rendering path", r.recents);
  console.log("");
}

run("desktop EN", "en", "--window-size=1100,900");
run("mobile CS", "cs", "--window-size=390,844");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
