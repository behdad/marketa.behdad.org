#!/usr/bin/env node
// Share-card generator smoke test (rsvp.html). Loads the game headless, then drives
// window.__shareCard() for three occasions — the default day, a forced SEASON, and a
// forced BIRTHDAY — asserting each yields a non-empty PNG data-URL, opens the preview
// modal, wires a Download href, exposes Email only for birthdays, and badges the right
// occasion (season key vs. person).
// The web font can't load headless/offline, so this also proves the serif fallback
// path still produces a valid PNG. Same one-shot runner as play.js.
//
// Usage: node tests/sharecard.js
"use strict";

var lib = require("./lib");

var HARNESS = [
  "<pre id=\"__report\" style=\"position:fixed;left:-9999px\">pending</pre>",
  "<script>",
  "(function () {",
  "  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }",
  "  var report = { errors: [], cards: [], deferredBirthdayActivations: 0, composed: [] };",
  "  window.__mailCompose = function (subject, body) { report.composed.push({ subject: subject, body: body }); };",
  "  async function make(name, setup) {",
  "    try { if (setup) setup(); } catch (e) { report.errors.push('setup ' + name + ': ' + e); }",
  "    await sleep(60);",
  "    var url = '';",
  "    try { url = await window.__shareCard(); } catch (e) { report.errors.push('shareCard ' + name + ': ' + (e && e.stack || e)); }",
  "    await sleep(400);", // let toBlob() land the object-url on the Download anchor
  "    var modal = document.getElementById('sharecard-modal');",
  "    var dl = modal && modal.querySelector('.sharecard-dl');",
  "    var img = modal && modal.querySelector('.sharecard-img');",
  "    var mail = modal && modal.querySelector('.sharecard-mail');",
  "    report.cards.push({",
  "      name: name,",
  "      len: url ? url.length : 0,",
  "      prefix: url ? url.slice(0, 22) : '',",
  "      modal: !!modal,",
  "      imgSrc: !!(img && img.getAttribute('src')),",
  "      dlHref: !!(dl && dl.getAttribute('href')),",
  "      download: dl ? dl.getAttribute('download') : '',",
  "      mail: !!mail",
  "    });",
  "    if (mail) mail.click();",
  "    if (window.__shareCloseModal) window.__shareCloseModal();",
  "    await sleep(120);",
  "  }",
  "  window.addEventListener('load', function () {",
  "    setTimeout(function () {",
  "      make('default', function () { history.replaceState(null, '', '?date=2031-03-01'); if (window.__applySeasonDate) window.__applySeasonDate(); })",
  "        .then(function () { return make('season', function () { window.__loftControllers.season('spooky'); }); })",
  "        .then(function () { return make('birthday', function () { window.__loftControllers.birthday('jay'); }); })",
  "        .then(async function () {",
  "          var prior = window.__summonCurrentFestivity;",
  "          window.__summonCurrentFestivity = function () { report.deferredBirthdayActivations++; return true; };",
  "          await window.__shareCard(null, { activateFestivityOnClose: true });",
  "          window.__shareCloseModal();",
  "          await sleep(120);",
  "          window.__summonCurrentFestivity = prior;",
  "        })",
  "        .catch(function (e) { report.errors.push('harness: ' + (e && e.stack || e)); })",
  "        .then(function () { report.errors = report.errors.concat(window.__errs || []); document.getElementById('__report').textContent = JSON.stringify(report); });",
  "    }, 500);",
  "  });",
  "})();",
  "</script>"
].join("\n");

var failures = 0;
function pass(m) { console.log("  ✓ " + m); }
function fail(m, d) { failures++; console.log("  ✗ " + m); if (d) console.log("      " + String(d).split("\n").join("\n      ")); }

console.log("rsvp.html share-card generator:");
var r = lib.runPageSync("rsvp.html", HARNESS, 8000);
if (!r) {
  fail("harness reported (page error before load, or budget too small)");
} else {
  var byName = {};
  (r.cards || []).forEach(function (c) { byName[c.name] = c; });
  ["default", "season", "birthday"].forEach(function (n) {
    var c = byName[n];
    if (!c) { fail(n + ": card generated"); return; }
    if (c.len > 1000 && c.prefix.indexOf("data:image/png") === 0) pass(n + ": valid PNG data-URL (" + c.len + " bytes, " + c.prefix + "…)");
    else fail(n + ": valid PNG data-URL", "len " + c.len + " prefix " + c.prefix);
    if (c.modal && c.imgSrc) pass(n + ": preview modal shows the image");
    else fail(n + ": preview modal shows the image", JSON.stringify(c));
    if (c.dlHref) pass(n + ": Download anchor wired (" + c.download + ")");
    else fail(n + ": Download anchor wired", JSON.stringify(c));
  });
  var bd = byName.birthday;
  if (bd && bd.download === "marketa-behdad-jay.png") pass("birthday badges the person (filename marketa-behdad-jay.png)");
  else fail("birthday badges the person", bd ? bd.download : "no card");
  var se = byName.season;
  if (se && se.download === "marketa-behdad-spooky.png") pass("season badges the occasion (filename marketa-behdad-spooky.png)");
  else fail("season badges the occasion", se ? se.download : "no card");
  ["default", "season"].forEach(function (n) {
    var c = byName[n];
    if (c && !c.mail) pass(n + ": no Email action");
    else fail(n + ": no Email action", c ? JSON.stringify(c) : "no card");
  });
  if (bd && bd.mail) pass("birthday: Email action is shown");
  else fail("birthday: Email action is shown", bd ? JSON.stringify(bd) : "no card");
  var composed = r.composed || [];
  if (composed.length === 1 && /Happy Birthday, Jay!/.test(composed[0].subject)) pass("only birthday opens an email composition");
  else fail("only birthday opens an email composition", JSON.stringify(composed));
  if (composed.length === 1 && /birthday postcard/.test(composed[0].body) && /marketa\.behdad\.org\/loft-day\?date=/.test(composed[0].body) && !/save-the-date/i.test(composed[0].body)) pass("birthday email describes the postcard and Loft Day link without save-the-date language");
  else fail("birthday email describes the postcard and Loft Day link without save-the-date language", JSON.stringify(composed));
  if (r.deferredBirthdayActivations === 1) pass("an explicitly armed birthday postcard activates its festivity once on dismissal");
  else fail("an explicitly armed birthday postcard activates its festivity once on dismissal", r.deferredBirthdayActivations);
  if ((r.errors || []).length === 0) pass("no uncaught JS errors across the run");
  else fail("no uncaught JS errors", r.errors.slice(0, 12).join("\n"));
}

console.log("");
if (failures > 0) { console.log(failures + " check(s) failed."); process.exit(1); }
else console.log("All checks passed.");
