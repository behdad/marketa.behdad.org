#!/usr/bin/env node
"use strict";

// Credits must grow with the tester roster rather than relying on a hand-sized roll.
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  try {
    var names = window.LOFT_CREDITS.people.filter(function (person) {
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
    check("new testers remain appended in source order",
      names.slice(-10).join(",") ===
        "Pendar,Mehraveh,Siamak,Navid,Mina,Mourad,Douglas,Robin,Amir,Arash",
      names.join(", "));
    var marketa = window.LOFT_CREDITS.people.find(function (person) { return person.name === "Markéta"; });
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

    var otherPeopleCount = window.LOFT_CREDITS.people.length - names.length;
    var current = window.__loftCreditsLayout(names.length, otherPeopleCount);
    var crowded = window.__loftCreditsLayout(50, otherPeopleCount);
    check("software credits move below every tester",
      crowded.softwareHeadingY - current.softwareHeadingY ===
        (Math.ceil(50 / 2) - Math.ceil(names.length / 2)) * 4.5,
      JSON.stringify({ current: current, crowded: crowded }));
    check("tester growth is arranged in two rows of columns",
      current.testerRows === Math.ceil(names.length / 2) && crowded.testerRows === 25,
      JSON.stringify({ current: current, crowded: crowded }));
    check("an oversized tester roster receives more travel and time",
      crowded.travel < current.travel && crowded.duration > current.duration,
      JSON.stringify({ current: current, crowded: crowded }));
    check("the final credit clears the clipped screen",
      current.dateY + current.travel < 155 && crowded.dateY + crowded.travel < 155,
      JSON.stringify({ current: current, crowded: crowded }));

    var roll = document.getElementById("monitor-credits-roll");
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
    check("the fire keeps running after the credits finish",
      document.getElementById("monitor-credits-layer").classList.contains("finished") &&
      window.__cuddlyFlameRaf() !== null,
      String(window.__cuddlyFlameRaf()));
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
