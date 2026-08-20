#!/usr/bin/env node
"use strict";

// Credits must grow with the tester roster rather than relying on a hand-sized roll.
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  try {
    var names = window.__loftCredits.people.filter(function (person) {
      return person.role === "credits_tester";
    }).map(function (person) { return person.name; });
    check("Nima appears in the language-neutral tester roster",
      names.indexOf("Nima") !== -1, names.join(", "));
    check("Goli appears in the language-neutral tester roster",
      names.indexOf("Goli") !== -1, names.join(", "));
    check("Chinnell, Rafi, Farhang, and Spencer appear in the language-neutral tester roster",
      names.indexOf("Chinnell") !== -1 && names.indexOf("Rafi") !== -1 &&
      names.indexOf("Farhang") !== -1 && names.indexOf("Spencer") !== -1, names.join(", "));
    check("Ayushi appears in the language-neutral tester roster",
      names.indexOf("Ayushi") !== -1, names.join(", "));
    check("Jay appears in the language-neutral tester roster",
      names.indexOf("Jay") !== -1, names.join(", "));
    check("Farid and Elham appear as separate tester entries",
      names.indexOf("Farid") !== -1 && names.indexOf("Elham") !== -1 &&
      names.filter(function (name) { return name === "Farid" || name === "Elham"; }).length === 2,
      names.join(", "));
    check("new testers remain appended in source order",
      names.slice(-13).join(",") ===
        "Pendar,Mehraveh,Siamak,Navid,Mina,Mourad,Douglas,Robin,Amir,Arash,Jay,Farid,Elham",
      names.join(", "));
    var marketa = window.__loftCredits.people.find(function (person) { return person.name === "Markéta"; });
    check("Markéta is credited for co-design and Czech translation",
      marketa && marketa.role === "credits_codesigner_translator",
      marketa && marketa.role);
    var sortedNames = window.__loftCreditsTesters("en").map(function (person) { return person.name; });
    var expectedSorted = names.slice().sort(function (a, b) {
      return a.localeCompare(b, "en", { sensitivity: "base" });
    });
    check("the displayed tester roster is alphabetized at runtime",
      sortedNames.join(",") === expectedSorted.join(","), sortedNames.join(", "));
    var creditsLines = window.__loftCreditsLines("en");
    var testersHeading = creditsLines.indexOf("Testers");
    var softwareHeading = creditsLines.indexOf("Open-source software");
    var lineNames = creditsLines.slice(testersHeading + 1, softwareHeading)
      .filter(Boolean).map(function (line) { return line.trim(); });
    check("the text credits representation uses the same alphabetized roster",
      lineNames.join(",") === sortedNames.join(","), lineNames.join(", "));
    check("the closing credit is localized in both text representations",
      creditsLines.indexOf("made with love by behdad, Claude & Codex") !== -1 &&
      window.__loftCreditsLines("cs").indexOf("s láskou vytvořili behdad, Claude a Codex") !== -1,
      JSON.stringify({ en: creditsLines.slice(-3), cs: window.__loftCreditsLines("cs").slice(-3) }));
    check("the text credits include the canonical game and source URLs",
      creditsLines.slice(-2).join("|") ===
        "marketa.behdad.org/loft-day|github.com/behdad/marketa.behdad.org",
      creditsLines.slice(-2).join("|"));
    check("the Chromium debit appears in both text credits",
      creditsLines.indexOf("  Chromium issue 546207266 — V8 GC doesn’t kick in during lots of animations…") !== -1 &&
      window.__loftCreditsLines("cs").indexOf("  Chromium issue 546207266 — V8 GC doesn’t kick in during lots of animations…") !== -1,
      creditsLines.join(" | "));

    var otherPeopleCount = window.__loftCredits.people.length - names.length;
    var current = window.__loftCreditsLayout(names.length, otherPeopleCount);
    var crowded = window.__loftCreditsLayout(50, otherPeopleCount);
    check("software credits move below every tester",
      crowded.softwareHeadingY > current.softwareHeadingY,
      JSON.stringify({ current: current, crowded: crowded }));
    check("tester columns distribute their remainder from left to right",
      names.length === 26 && current.testersPerColumn === 5 && current.testerColumns === 6 &&
      current.testerBands === 1 && JSON.stringify(current.testerColumnCounts[0]) === "[5,5,4,4,4,4]" &&
      crowded.testersPerColumn === 5 && crowded.testerBands === 2 &&
      JSON.stringify(crowded.testerBandCounts) === "[25,25]" &&
      JSON.stringify(crowded.testerColumnCounts[0]) === "[5,4,4,4,4,4]" &&
      JSON.stringify(crowded.testerColumnCounts[1]) === "[5,4,4,4,4,4]",
      JSON.stringify({ current: current, crowded: crowded }));
    check("an oversized tester roster receives more travel and time",
      crowded.travel < current.travel && crowded.duration > current.duration,
      JSON.stringify({ current: current, crowded: crowded }));
    check("the final credit settles as a centered closing card",
      current.closingY + current.travel > 168 && current.githubY + current.travel < 182 &&
      crowded.closingY + crowded.travel > 168 && crowded.githubY + crowded.travel < 182 &&
      current.noticeY + current.travel < 155 && crowded.noticeY + crowded.travel < 155,
      JSON.stringify({ current: current, crowded: crowded }));

    var roll = document.getElementById("monitor-credits-roll");
    var testerNameSet = {};
    names.forEach(function (name) { testerNameSet[name] = true; });
    var renderedColumns = {};
    [].forEach.call(roll.querySelectorAll(".monitor-credits-name"), function (node) {
      if (!testerNameSet[node.textContent]) return;
      var x = node.getAttribute("x");
      renderedColumns[x] = (renderedColumns[x] || 0) + 1;
    });
    var renderedColumnCounts = Object.keys(renderedColumns).sort(function (a, b) { return +a - +b; })
      .map(function (x) { return renderedColumns[x]; });
    check("the rendered roster uses two five-name columns followed by four four-name columns",
      JSON.stringify(renderedColumnCounts) === "[5,5,4,4,4,4]",
      JSON.stringify(renderedColumns));
    var links = roll.querySelectorAll("a");
    check("the rendered credits expose native links for the game, source, and Chromium debit",
      links.length === 3 && links[0].getAttribute("href") === "https://marketa.behdad.org/loft-day" &&
      links[1].getAttribute("href") === "https://github.com/behdad/marketa.behdad.org" &&
      links[2].getAttribute("href") === "https://issues.chromium.org/issues/546207266" &&
      links[0].getAttribute("target") === "_blank" && links[1].getAttribute("target") === "_blank",
      [].map.call(links, function (link) { return link.getAttribute("href"); }).join(", "));
    check("the rendered roll uses its computed travel and duration",
      roll.style.getPropertyValue("--credits-travel") === current.travel + "px" &&
      roll.style.getPropertyValue("--credits-duration") === current.duration + "s",
      roll.getAttribute("style"));
    window.__openMonitorCredits();
    var layer = document.getElementById("monitor-credits-layer");
    layer.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    check("clicking the credits display pauses the roll",
      layer.classList.contains("paused") && getComputedStyle(roll).animationPlayState === "paused");
    layer.querySelector(".monitor-credits-close").dispatchEvent(
      new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true }));
    check("Space resumes the roll without closing Credits",
      layer.classList.contains("open") && !layer.classList.contains("paused") &&
      getComputedStyle(roll).animationPlayState === "running",
      layer.getAttribute("class") + " / " + getComputedStyle(roll).animationPlayState);
    roll.dispatchEvent(new Event("animationend"));
    check("the credits finish over their self-contained dawn scene",
      document.getElementById("monitor-credits-layer").classList.contains("finished") &&
      !!document.getElementById("monitor-credits-dawn-sky") &&
      !!document.getElementById("monitor-credits-sun") &&
      !document.getElementById("monitor-credits-fire"),
      document.getElementById("monitor-credits-layer").getAttribute("class"));
  } catch (error) {
    out.errors.push(String(error && error.stack || error));
  }
  out.errors = out.errors.concat(window.__errs || []);
  var pre = document.createElement("pre");
  pre.id = "__report";
  pre.textContent = JSON.stringify(out);
  document.body.appendChild(pre);
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 1800, { forceMotion: true });
if (!result) { console.error("credits: no report"); process.exit(1); }
var failed = false;
result.checks.forEach(function (check) {
  console.log("  " + (check.pass ? "✓" : "✗") + " " + check.name +
    (check.pass || !check.detail ? "" : " — " + check.detail));
  if (!check.pass) failed = true;
});
if (result.errors.length) {
  failed = true;
  console.error("runtime errors:\n  " + result.errors.join("\n  "));
}
if (failed) process.exit(1);
console.log("credits: all " + result.checks.length + " checks passed");
