#!/usr/bin/env node
// Split-script integration data is intentionally private. The page may expose the
// descriptive __loft* bridges needed by classic external scripts, but it must not
// restore the retired public Window properties.
"use strict";

var lib = require("./lib");

var harness = [
  '<pre id="__report">pending</pre>',
  '<script>window.addEventListener("load",function(){',
  'var own=Object.prototype.hasOwnProperty;',
  'var out={',
  'messages:!!(window.__loftMessages&&window.__loftMessages.en&&window.__loftMessages.cs),',
  'snippets:Array.isArray(window.__loftCodeSnippets)&&Object.isFrozen(window.__loftCodeSnippets)&&window.__loftCodeSnippets.length===8,',
  'legacyT:own.call(window,"T")||window.T!==undefined,',
  'legacySnippets:own.call(window,"LOFT_CODE_SNIPPETS")||window.LOFT_CODE_SNIPPETS!==undefined',
  '};document.getElementById("__report").textContent=JSON.stringify(out);',
  '});<\/script>'
].join("");

var state = lib.runPageSync("rsvp.html", harness, 1800, { patchRaf: true });
var ok = state && state.messages && state.snippets && !state.legacyT && !state.legacySnippets;
if (!ok) {
  console.error("private bootstrap globals failed: " + JSON.stringify(state));
  process.exit(1);
}
console.log("Private split-script bootstrap globals passed.");
