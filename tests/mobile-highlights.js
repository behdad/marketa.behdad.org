#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function brief(el,color){return {tag:el.tagName,id:el.id||"",cls:typeof el.className==="string"?el.className:(el.className&&el.className.baseVal)||"",color:color};}',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  ' var selector="a,button,input,textarea,select,summary,[role=button],[role=link],[role=menuitem],[role=tab],[role=option],[role=switch],[tabindex],.hunt-hit,[data-action],[draggable=true]";',
  ' var nodes=[].slice.call(document.querySelectorAll(selector)),offenders=[];nodes.forEach(function(el){var color=getComputedStyle(el).webkitTapHighlightColor;if(color!=="rgba(0, 0, 0, 0)"&&color!=="transparent")offenders.push(brief(el,color));});',
  ' var editable=document.getElementById("monitor-code-code")||document.getElementById("party-poison");var editableStyle=editable&&getComputedStyle(editable);',
  ' var drag=document.getElementById("office-desk")||document.querySelector(".scene");var dragStyle=drag&&getComputedStyle(drag);',
  ' var focus=document.querySelector(".langs button");if(focus)focus.focus();var focusStyle=focus&&getComputedStyle(focus);',
  ' document.getElementById("__report").textContent=JSON.stringify({errors:window.__errs||[],count:nodes.length,offenders:offenders.slice(0,12),editable:editable&&{id:editable.id,userSelect:editableStyle.userSelect,pointerEvents:editableStyle.pointerEvents,touchAction:editableStyle.touchAction},drag:drag&&{id:drag.id||"scene",userSelect:dragStyle.userSelect,touchAction:dragStyle.touchAction},focus:focus&&{visible:focus.matches(":focus-visible"),outlineStyle:focusStyle.outlineStyle,outlineWidth:focusStyle.outlineWidth}});',
  '}catch(e){document.getElementById("__report").textContent=JSON.stringify({errors:[String(e&&e.stack||e)]});}},250);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : ""));
  }
}

function runPage(file, options) {
  var result = lib.runPageSync(file, HARNESS, 4000, options || {});
  check(result && result.errors && result.errors.length === 0, file + ": no uncaught errors", result && result.errors);
  check(result && result.count > 0 && result.offenders.length === 0,
    file + ": every authored interactive surface inherits a transparent tap highlight",
    result && { count: result.count, offenders: result.offenders });
  check(result && result.editable && result.editable.userSelect !== "none" && result.editable.touchAction !== "none",
    file + ": editable text remains selectable with native touch behavior", result && result.editable);
  check(result && result.focus && result.focus.visible && result.focus.outlineStyle !== "none" && result.focus.outlineWidth !== "0px",
    file + ": keyboard focus retains its visible outline", result && result.focus);
  return result;
}

console.log("mobile tap-highlight policy:");
var rsvp = runPage("rsvp.html", { patchRaf: true });
check(rsvp && rsvp.drag && rsvp.drag.touchAction === "none",
  "rsvp.html: authored SVG drag surfaces retain touch-action:none", rsvp && rsvp.drag);
var dates = runPage("save-the-dates.html");
check(dates && dates.drag && dates.drag.userSelect === "none",
  "save-the-dates.html: tappable scene artwork remains non-selectable", dates && dates.drag);

var roots = [
  "rsvp.html",
  "save-the-dates.html",
  "doom/player.html",
  "dos/player.html",
  "duke/player.html",
  "q3/player.html",
  "princejs/index.html"
];
var missing = roots.filter(function (file) {
  var full = path.join(lib.ROOT, file);
  // princejs/ is untracked (restored by fetch-princejs.sh): audit it only when present.
  if (file.indexOf("princejs/") === 0 && !fs.existsSync(full)) return false;
  var source = fs.readFileSync(full, "utf8");
  return !/html[^{}]*\{[^}]*-webkit-tap-highlight-color\s*:\s*transparent/.test(source);
});
check(missing.length === 0,
  "every owned top-level and same-origin runtime document declares the root policy", missing);

console.log("");
if (failures) {
  console.log(failures + " mobile-highlight assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Mobile-highlight assertions passed.");
