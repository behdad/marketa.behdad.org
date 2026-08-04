#!/usr/bin/env node
// Android's soft-keyboard viewport animation must not repeatedly re-fit the full room SVG.
"use strict";

var lib = require("./lib");

var harness = [
  '<pre id="__report">pending</pre>',
  '<script>(function(){',
  'var out={},area=document.getElementById("hunt-fullscreen-area"),frame=document.querySelector(".hunt-frame");',
  'var input=document.createElement("input");input.type="text";document.body.appendChild(input);input.focus();',
  'var full=(window.visualViewport&&window.visualViewport.height)||window.innerHeight;',
  'window.__syncGameSoftKeyboardViewport(full);area.classList.add("is-fullscreen");frame.style.width="321px";',
  'window.__syncGameSoftKeyboardViewport(full-180);out.detected=window.__gameSoftKeyboardOpen();window.__sizeFullscreenFrame();out.frozen=frame.style.width==="321px";',
  'window.__syncGameSoftKeyboardViewport(full);out.closed=!window.__gameSoftKeyboardOpen();window.__sizeFullscreenFrame();out.resumed=frame.style.width!=="321px";',
  'out.viewport=(document.querySelector("meta[name=viewport]")||{}).content||"";',
  'document.getElementById("__report").textContent=JSON.stringify(out);',
  '})();<\/script>'
].join("\n");

var state = lib.runPageSync("rsvp.html", harness, 900, {
  patchRaf: true,
  chromeFlags: "--window-size=844,390"
});
var failures = 0;
function check(ok, label, detail) {
  console.log("  " + (ok ? "✓" : "✗") + " " + label);
  if (!ok) { failures++; if (detail != null) console.log("    " + JSON.stringify(detail)); }
}

console.log("rsvp.html Android soft-keyboard viewport handling:");
check(state && state.detected, "a focused text field plus a shrunken visual viewport identifies the keyboard", state);
check(state && state.frozen, "fullscreen scene geometry stays frozen during the keyboard resize", state);
check(state && state.closed && state.resumed, "the normal fullscreen fit resumes after the viewport returns", state);
check(state && /interactive-widget=resizes-visual/.test(state.viewport),
  "Chromium is asked to resize only the visual viewport", state);

if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");
