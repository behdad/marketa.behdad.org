#!/usr/bin/env node
"use strict";

// HTML overlay chrome keeps close targets usable, clear of modal content, and reachable in
// short landscape viewports. These are measured in the rendered page because the regressions
// came from the interaction between absolute positioning, authored padding, and shell scaling.
var lib = require("./lib");

function harness(lang) {
  return String.raw`<pre id="__report">pending</pre><script>
(function () {
  function box(node) {
    var r = node.getBoundingClientRect();
    return { left:r.left, top:r.top, right:r.right, bottom:r.bottom, width:r.width, height:r.height };
  }
  function overlaps(a, b) {
    return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
  }
  function sample(name, close, content) {
    var closeBox = box(close), contentBox = box(content);
    return { name:name, close:closeBox, content:contentBox,
      appearance:getComputedStyle(close).appearance,
      overlap:overlaps(closeBox, contentBox) };
  }
  addEventListener("load", function () { setTimeout(async function () {
    var out={viewport:[innerWidth,innerHeight], lang:"", samples:[], errors:(window.__errs||[]).slice()};
    try {
      setLang(${JSON.stringify(lang)}); out.lang=document.documentElement.lang;
      window.__openKbdHelp(); await new Promise(function(resolve){setTimeout(resolve,50);});
      var keyboard=document.querySelector(".kbd-dialog");
      out.samples.push(sample("keyboard",keyboard.querySelector(".pb-dlg-x"),keyboard.querySelector(".pb-dlg-lead")));
      document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));

      var dollhouse=document.getElementById("loft-dollhouse");
      dollhouse.hidden=false;
      if (document.getElementById("loft-dollhouse-close").getBoundingClientRect().width) {
        out.samples.push(sample("dollhouse",document.getElementById("loft-dollhouse-close"),document.getElementById("loft-dollhouse-title")));
      }
      dollhouse.hidden=true;

      window.phone.set(true); await new Promise(function(resolve){setTimeout(resolve,50);});
      out.samples.push(sample("phone",document.querySelector(".phone-close"),document.querySelector(".psb-right")));
      window.phone.set(false);

      await window.shareCard(); await new Promise(function(resolve){setTimeout(resolve,50);});
      var share=document.querySelector(".sharecard-box");
      out.samples.push(sample("sharecard",share.querySelector(".sharecard-x"),share.querySelector(".sharecard-img")));
      out.sharecard=box(share);
      window.__shareCloseModal();
    } catch (error) { out.errors.push(String(error&&error.stack||error)); }
    document.getElementById("__report").textContent=JSON.stringify(out);
  },200); });
})();
</script>`;
}

function run(width, height, lang) {
  return lib.runPageSync("loft-day.html", harness(lang), 3500, {
    patchRaf: true,
    chromeFlags: "--window-size=" + width + "," + height
  });
}

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : ""));
  }
}

[
  { label:"desktop EN", width:1100, height:900, lang:"en" },
  { label:"short landscape CS", width:844, height:390, lang:"cs" },
  { label:"narrow portrait EN", width:390, height:844, lang:"en" }
].forEach(function (spec) {
  console.log(spec.label + ":");
  var report=run(spec.width,spec.height,spec.lang);
  check(!!report, "harness reports");
  if (!report) return;
  check(report.errors.length===0, "no uncaught page errors", report.errors);
  check(report.lang===spec.lang, "modal copy follows the selected language", report.lang);
  check(report.samples.length>=3, "representative overlays render", report.samples);
  report.samples.forEach(function (sample) {
    check(sample.close.width>=32 && sample.close.height>=32,
      sample.name + " close target is at least 32px", sample.close);
    check(sample.appearance==="none", sample.name + " close resets native button appearance", sample.appearance);
    check(!sample.overlap, sample.name + " close stays clear of adjacent content", sample);
  });
  check(report.sharecard.top>=0 && report.sharecard.bottom<=report.viewport[1]+1,
    "share-card modal stays vertically reachable", { viewport:report.viewport, box:report.sharecard });
  console.log("");
});

if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");
