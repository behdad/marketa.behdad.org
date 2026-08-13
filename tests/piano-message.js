#!/usr/bin/env node
"use strict";

// The actionable piano texts must use the same public transition as ordinary piano
// selection. The visible play-along keybed remains independent of backing transport
// and party lifecycle while its short voices stay explicitly releasable.
var lib = require("./lib");

var HARNESS = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) {
    out.checks.push({ name: name, pass: !!pass, detail: detail || "" });
  }
  function report() {
    out.errors = (window.__errs || []).slice();
    var pre = document.createElement("pre");
    pre.id = "__report";
    pre.textContent = JSON.stringify(out);
    document.body.appendChild(pre);
  }

  window.__setPartyMode(true, true);
  window.__goToStage("garden");
  var realPiano = window.__loftControllers.piano, pianoCalls = 0;
  window.__loftControllers.piano = function () {
    pianoCalls++;
    return realPiano.apply(window, arguments);
  };

  var realRandom = Math.random;
  Math.random = function () { return 0; };
  var delivered = window.__deliverPhoneMessage("hannah_piano");
  Math.random = realRandom;
  var enRow = window.__chatMessagesKnowledge().filter(function (m) { return m.id === "hannah_piano"; })[0];
  window.__setLang("cs");
  var csRow = window.__chatMessagesKnowledge().filter(function (m) { return m.id === "hannah_piano"; })[0];
  window.__setLang("en");
  window.__runMsgAction("hannah_piano");
  setTimeout(function () {
    var piano = document.getElementById("cuddly-projector-piano");
    var screen = document.getElementById("cuddly-wallscreen");
    var whites = piano && piano.querySelectorAll(".piano-white-key");
    var blacks = piano && piano.querySelectorAll(".piano-black-key");
    var allKeys = piano && [].slice.call(piano.querySelectorAll(".piano-key"));
    check("Hannah's request can deliver during the party", delivered && window.__gardenPartyOn);
    check("Hannah's localized piano line remains authored",
      window.__loftMessages.en.msg_hannah_piano_body_a === "<em>daee joon</em>, can I play the piano?" &&
      window.__loftMessages.cs.msg_hannah_piano_body_a === "<em>daee joon</em>, můžu si zahrát na piano?",
      (enRow && enRow.text) + " / " + (csRow && csRow.text));
    check("Hannah's Persian address remains authored in italics in both dictionaries",
      /^<em>daee joon<\/em>/.test(window.__loftMessages.en.msg_hannah_piano_body_a) &&
      /^<em>daee joon<\/em>/.test(window.__loftMessages.cs.msg_hannah_piano_body_a));
    check("Hannah's request is offered in the party message schedule",
      window.__partyTextChoices && window.__partyTextChoices().indexOf("hannah_piano") !== -1);
    check("Hannah's message uses the canonical piano transition", pianoCalls === 1, String(pianoCalls));
    check("Hannah's message opens the cuddly piano channel",
      window.__currentStageName === "cuddly" &&
      window.__cuddlyProjector &&
      window.__cuddlyProjector.channel() === "stars",
      window.__currentStageName + "/" + (window.__cuddlyProjector && window.__cuddlyProjector.channel()));
    check("piano foreground ducks the party bed", window.__partyDuck === 0.06, String(window.__partyDuck));
    check("night-sky channel reveals a non-Tab one-octave keybed",
      piano && screen.classList.contains("chan-stars") &&
      piano.getAttribute("tabindex") === "-1" &&
      getComputedStyle(piano).visibility === "visible" &&
      whites.length === 8 && blacks.length === 5,
      JSON.stringify({ channel: screen.className.baseVal, tabindex: piano && piano.getAttribute("tabindex"),
        visibility: piano && getComputedStyle(piano).visibility, whites: whites && whites.length, blacks: blacks && blacks.length }));
    check("black keys own the top SVG hit layer",
      allKeys.slice(0, 8).every(function (key) { return key.classList.contains("piano-white-key"); }) &&
      allKeys.slice(8).every(function (key) { return key.classList.contains("piano-black-key"); }));
    check("the first visible keybed shows its temporary play-along coach",
      piano.classList.contains("show-coach") && /Play along/.test(piano.textContent));

    // Pause only the backing score: the live keys stay available and polyphonic.
    window.__setGardenParty(false, false);
    var roomLocalStart = window.__starsPlaying();
    window.__goToStage("garden");
    var roomLocalAway = !window.__starsPlaying();
    window.__goToStage("cuddly");
    var roomLocalReturn = window.__starsPlaying();
    check("the night-sky score stops outside Cuddly and resumes on return",
      roomLocalStart && roomLocalAway && roomLocalReturn,
      JSON.stringify({ start: roomLocalStart, away: roomLocalAway, returned: roomLocalReturn }));
    window.__pauseStars(true);
    var before = window.__projectorPianoState();
    var keyC = piano.querySelector('[data-note="60"]');
    var keyE = piano.querySelector('[data-note="64"]');
    keyC.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 41, pointerType: "touch", button: 0 }));
    keyE.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 42, pointerType: "touch", button: 0 }));
    var chord = window.__projectorPianoState();
    check("backing pause leaves the play-along piano enabled", before.enabled && !before.backing);
    check("two simultaneous pointers make a visible two-note chord",
      chord.voices === 2 && chord.notes.join(",") === "60,64" &&
      keyC.classList.contains("is-down") && keyE.classList.contains("is-down"),
      JSON.stringify(chord));

    // Starting the party is not a teardown boundary for the instrument.
    window.__setGardenParty(true, false);
    var duringParty = window.__projectorPianoState();
    check("party start preserves sounding keys and keyboard availability",
      window.__gardenPartyOn && duringParty.enabled && duringParty.voices === 2,
      JSON.stringify(duringParty));
    keyC.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 41, pointerType: "touch", button: 0 }));
    keyE.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 42, pointerType: "touch", button: 0 }));
    check("pointer release clears every voice and pressed-key state",
      window.__projectorPianoState().voices === 0 &&
      !keyC.classList.contains("is-down") && !keyE.classList.contains("is-down"));

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }));
    check("the printed computer-key map plays whenever the piano channel is visible",
      window.__projectorPianoState().notes.join(",") === "60");
    document.dispatchEvent(new KeyboardEvent("keyup", { key: "a", bubbles: true }));
    check("computer-key release cannot strand a note", window.__projectorPianoState().voices === 0);
    var seasonBefore = window.__seasonPreviewName();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "s", bubbles: true }));
    check("S over the piano plays D4 instead of advancing the season",
      window.__projectorPianoState().notes.join(",") === "62" &&
      window.__seasonPreviewName() === seasonBefore);
    document.dispatchEvent(new KeyboardEvent("keyup", { key: "s", bubbles: true }));
    window.__cuddlyProjector.set("fire");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "s", bubbles: true }));
    check("the keybed releases S after its channel changes",
      window.__projectorPianoState().voices === 0);

    // A long room fade must keep each score's look-ahead scheduler alive. Otherwise the
    // queued notes run out in ~1–2s even though the gain claims to be fading for three.
    window.__goToStage("cuddly");
    ["coffee", "stars", "workout", "aqua", "totoro"].forEach(function (channel) {
      window.__cuddlyProjector.set(channel);
      window.__goToStage("garden");
      var away = window.__projectorRoomFadeState()[channel];
      window.__goToStage("cuddly");
      var returned = window.__projectorRoomFadeState()[channel];
      check(channel + " score feeds the full room fade and revives on return",
        away.fading && away.scheduled && !returned.fading && returned.scheduled,
        JSON.stringify({ away: away, returned: returned }));
    });
    report();
  }, 260);
})();
</script>`;

var report = lib.runPageSync("rsvp.html", HARNESS, 1900, { patchRaf: true, forceMotion: true, seedRandom: true });
if (!report) {
  console.error("piano-message: no report");
  process.exit(1);
}

var failed = false;
report.checks.forEach(function (c) {
  console.log("  " + (c.pass ? "✓" : "✗") + " " + c.name + (c.pass || !c.detail ? "" : " — " + c.detail));
  if (!c.pass) failed = true;
});
if (report.errors.length) {
  failed = true;
  console.error("piano-message runtime errors:\n  " + report.errors.join("\n  "));
}
if (failed) process.exit(1);
console.log("piano-message: all checks passed");
