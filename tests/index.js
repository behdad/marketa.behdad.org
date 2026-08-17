#!/usr/bin/env node
"use strict";

var lib = require("./lib");

function probe(width, height) {
  var harness = String.raw`<script>
(function () {
  var report = { checks: [], errors: window.__errs || [] };
  function check(name, pass, detail) { report.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  try {
    var cards = [].slice.call(document.querySelectorAll(".drop"));
    var rsvpPrefetch = document.querySelector('link[rel="prefetch"][href="rsvp"][as="document"]');
    check("the RSVP document is offered as a native browser prefetch", !!rsvpPrefetch);
    check("drops are reverse chronological RSVP then Save the Dates",
      cards.length === 2 && cards[0].getAttribute("href") === "rsvp" &&
      cards[1].getAttribute("href") === "save-the-dates",
      cards.map(function (card) { return card.getAttribute("href"); }).join(", "));
    check("cards use SVG artwork without embedded pages",
      !document.querySelector("iframe") && [].every.call(document.querySelectorAll(".drop-art img"),
        function (image) { return /\.svg$/.test(image.getAttribute("src")); }));
    setLang("en");
    check("RSVP names Loft Day in English",
      cards[0].textContent.indexOf("Loft Day") !== -1 && cards[0].textContent.indexOf("Open RSVP") !== -1,
      cards[0].textContent);
    setLang("cs");
    check("both cards switch to Czech",
      document.documentElement.lang === "cs" && cards[0].textContent.indexOf("Den v podkroví") !== -1 &&
      cards[1].textContent.indexOf("Dvě data") !== -1,
      cards.map(function (card) { return card.textContent; }).join(" | "));
    var first = cards[0].getBoundingClientRect(), second = cards[1].getBoundingClientRect();
    var mobile = innerWidth <= 700;
    check("cards use the expected responsive arrangement",
      mobile ? second.top > first.bottom : Math.abs(first.top - second.top) < 2,
      JSON.stringify({ width: innerWidth, first: first.toJSON(), second: second.toJSON() }));
    check("the hub does not overflow horizontally",
      document.documentElement.scrollWidth <= innerWidth,
      document.documentElement.scrollWidth + " / " + innerWidth);
  } catch (error) { report.errors.push(String(error && error.stack || error)); }
  var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(report); document.body.appendChild(pre);
})();
</script>`;
  return lib.runPageSync("index.html", harness, 800, {
    chromeFlags: "--window-size=" + width + "," + height
  });
}

var runs = [{ name: "desktop", report: probe(1100, 900) }, { name: "mobile", report: probe(390, 844) }];
var failed = false;
runs.forEach(function (run) {
  if (!run.report) { console.error("index " + run.name + ": no report"); failed = true; return; }
  run.report.checks.forEach(function (check) {
    console.log("  " + (check.pass ? "✓" : "✗") + " " + run.name + ": " + check.name +
      (check.pass || !check.detail ? "" : " — " + check.detail));
    if (!check.pass) failed = true;
  });
  if (run.report.errors.length) {
    failed = true;
    console.error(run.name + " runtime errors:\n  " + run.report.errors.join("\n  "));
  }
});
if (failed) process.exit(1);
console.log("index: all checks passed");
