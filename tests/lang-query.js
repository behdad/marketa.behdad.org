#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const html = fs.readFileSync(path.join(__dirname, "..", "loft-day.html"), "utf8");
const start = html.indexOf('(function () {\n  var btns = document.querySelectorAll(".langs button");',
  html.indexOf("window.__setLang = setLang;"));
const end = html.indexOf("\n})();", start);
assert(start !== -1 && end !== -1, "language initialization exists");
const initialization = html.slice(start, end + "\n})();".length);

const cases = [
  { name: "cz overrides saved English", query: "?lang=cz", saved: "en", expected: "cs" },
  { name: "cs selects Czech", query: "?lang=cs", saved: "en", expected: "cs" },
  { name: "en overrides saved Czech", query: "?lang=en", saved: "cs", expected: "en" },
  { name: "en overrides Czech browser preference", query: "?lang=en", languages: ["cs-CZ"], expected: "en" },
  { name: "query coexists with other parameters", query: "?date=2027-05-01&lang=cz", expected: "cs" },
  { name: "unsupported query falls back to saved choice", query: "?lang=de", saved: "cs", expected: "cs" },
  { name: "empty query falls back to browser detection", query: "?lang=", languages: ["en", "cs-CZ"], expected: "cs" },
  { name: "absent query keeps saved choice", saved: "cs", expected: "cs" },
  { name: "invalid saved choice falls back to browser detection", saved: "de", languages: ["cs-CZ"], expected: "cs" },
  { name: "query works when storage is blocked", query: "?lang=cz", blocked: true, expected: "cs" },
  { name: "default remains English", expected: "en" }
];

cases.forEach(function (row) {
  let selected;
  vm.runInNewContext(initialization, {
    URLSearchParams,
    location: { search: row.query || "" },
    localStorage: { getItem() { if (row.blocked) throw new Error("storage blocked"); return row.saved || null; } },
    navigator: { languages: row.languages || ["en-CA"] },
    document: { querySelectorAll() { return []; } },
    T: { en: {}, cs: {} },
    setLang(language) { selected = language; }
  });
  assert.equal(selected, row.expected, row.name);
  console.log("  ✓ " + row.name);
});

console.log("All language query checks passed.");
