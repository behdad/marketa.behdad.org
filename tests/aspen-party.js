#!/usr/bin/env node
"use strict";

// Focused Aspen party-photographer contract: authored stations, foot/body action split,
// camera-framed album subjects, group-photo home position, and no scene-click bio popups.
var fs = require("fs");
var path = require("path");
var lib = require("./lib");
var html = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail == null ? "" : "\n    " + JSON.stringify(detail))); }
}

check(/var STATIONS = \[\s*\{ id: "front-left"[\s\S]*\{ id: "potstand"[\s\S]*\{ id: "peace-lily"[\s\S]*\{ id: "front-right"/.test(html),
  "four authored Aspen stations stay in their intended order");
check(/14000 \+ Math\.random\(\) \* 10000/.test(html) && /22000 \+ Math\.random\(\) \* 16000/.test(html),
  "roaming keeps the 14–24s first / 22–38s subsequent cadence");
check(!/window\.__moveGardenPhotographer\s*=/.test(html), "movement does not expand the public scripting API");
check(!/nameTip\("garden-(?:photog-hit|dj-a|dj-b)"/.test(html),
  "Aspen and DJ scene controls have no competing bio-card listeners");
check(!/garden-photographer-cover|class="photog-cover/.test(html),
  "Aspen stays foregrounded without duplicated plant-cover subtrees");

var harness = String.raw`<script>
(function () {
  var report = { errs: window.__errs, steps: {} };
  function click(el, detail) { el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, detail: detail == null ? 1 : detail })); }
  function dblclick(el) { el.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true })); }
  window.__goToStage("garden");
  window.__setGardenParty(true, false);
  if (window.__summonGuests) window.__summonGuests();
  var stage = document.getElementById("stage-garden");
  var foot = document.getElementById("garden-photog-move-hit");
  var body = document.getElementById("garden-photog-hit");
  var who = 0, photos = 0, opens = 0;
  window.__whoPop = function () { who++; };
  var realAdd = window.__albumAdd;
  window.__albumAdd = function (force) { photos++; return realAdd(force); };
  window.__openPhoneAppHere = function () { opens++; };

  report.steps.initial = stage.getAttribute("data-photog-station");
  click(foot);
  report.steps.foot = { station: stage.getAttribute("data-photog-station"), photos: photos, opens: opens, who: who };
  click(body);
  setTimeout(function () {
    report.steps.body = { station: stage.getAttribute("data-photog-station"), photos: photos, who: who };

  var dj = document.getElementById("garden-dj-a");
  click(dj);
  var djPanelBg = document.querySelector("#garden-djpicker .dj-pick-panel rect");
  report.steps.dj = {
    picker: document.getElementById("garden-djpicker").classList.contains("open"),
    pickerRight: djPanelBg ? (+djPanelBg.getAttribute("x") + +djPanelBg.getAttribute("width")) : null,
    modalTop: stage.lastElementChild && stage.lastElementChild.id === "garden-djpicker",
    backdrop: !!document.querySelector("#garden-djpicker .dj-pick-backdrop"),
    who: who
  };
  var fadeCalls = [];
  window.__fadeLoftSongOut = function (ms) { fadeCalls.push(ms); return true; };
  var requestRow = document.querySelector("#garden-djpicker .dj-pick-row");
  if (requestRow) click(requestRow);
  report.steps.jukeboxFade = {
    calls: fadeCalls.slice(),
    picker: document.getElementById("garden-djpicker").classList.contains("open")
  };
  if (window.__openDjPicker) window.__openDjPicker();
  var danceBeforeDouble = window.__partyDance;
  dblclick(dj);
  report.steps.djDouble = {
    before: danceBeforeDouble,
    after: window.__partyDance,
    picker: document.getElementById("garden-djpicker").classList.contains("open"),
    party: !!window.__gardenPartyOn
  };
  if (window.__closeDjPicker) window.__closeDjPicker();

  click(foot); // potstand -> peace-lily: its frame is 75..370
  window.__rosterPresence = function () { return [
    { key: "hosts", grp: "hosts", name: "markéta & behdad", roleKey: "role_hosts" },
    { key: "ali", grp: "guests", name: "Ali", roleKey: "role_bestman" },
    { key: "goli", grp: "guests", name: "Goli", roleKey: "role_fashion" }
  ]; };
  window.__gardenRosterFrameX = function (key) { return { hosts: 325, ali: 190, goli: 520 }[key]; };
  window.__albumClear();
  for (var i = 0; i < 4; i++) realAdd(true);
  var framed = window.__albumList().filter(function (shot) { return !shot.shoot; }).slice(0, 4);
  report.steps.frame = {
    station: stage.getAttribute("data-photog-station"),
    stationMeta: framed.map(function (shot) { return shot.cameraStation; }),
    people: framed.map(function (shot) { return shot.people.map(function (p) { return p.key; }); })
  };

  click(body, 1); click(body, 2); dblclick(body);
  report.steps.bodyDouble = { photoFreeze: !!window.__photoFreeze, photos: photos };
  if (window.__stopPhotoMoment) window.__stopPhotoMoment();
  var started = window.__startGroupPhoto();
  report.steps.groupStart = { started: started, station: stage.getAttribute("data-photog-station") };
  setTimeout(function () {
    var group = window.__albumList().filter(function (shot) { return shot.groupPhoto; })[0];
    var bubble = document.querySelector(".egg-bubble");
    var bubbleRect = bubble && bubble.getBoundingClientRect();
    var viewportRect = document.querySelector(".hunt-viewport").getBoundingClientRect();
    report.steps.groupShot = {
      station: stage.getAttribute("data-photog-station"),
      people: group ? group.people.map(function (p) { return p.key; }) : [],
      bubbleInside: !!(bubbleRect && bubbleRect.left >= viewportRect.left &&
        bubbleRect.right <= viewportRect.right && bubbleRect.top >= viewportRect.top &&
        bubbleRect.bottom <= viewportRect.bottom)
    };
    click(dj); click(dj);
    report.steps.djTwo = { party: !!window.__gardenPartyOn };
    click(dj);
    report.steps.djThree = { party: !!window.__gardenPartyOn, winding: !!(window.__partyWindingDown && window.__partyWindingDown()) };
    if (window.__setPartyMode) window.__setPartyMode(false, true);
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(report); document.body.appendChild(pre);
  }, 1250);
  }, 320);
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 2600, {
  forceMotion: true,
  seedRandom: true,
  patchRaf: true,
  chromeFlags: "--autoplay-policy=no-user-gesture-required"
});
check(!!result, "focused browser harness completed", result);
if (result) {
  var s = result.steps;
  check(s.initial === "front-left", "Aspen starts at the front-left station", s.initial);
  check(s.foot.station === "potstand" && s.foot.photos === 0 && s.foot.opens === 0 && s.foot.who === 0,
    "foot click advances Aspen without shutter, Album, or bio", s.foot);
  check(s.body.station === "potstand" && s.body.photos === 1 && s.body.who === 0,
    "body click takes exactly one photo without a bio popup", s.body);
  check(s.bodyDouble.photoFreeze && s.bodyDouble.photos === 1,
    "body double-click cancels the portrait and starts a short photo pose", s.bodyDouble);
  check(s.dj.picker && s.dj.pickerRight < 560 && s.dj.modalTop && s.dj.backdrop && s.dj.who === 0,
    "DJ head opens a scene-modal picker above the dancers, fully left of the booth, without a bio popup", s.dj);
  check(s.jukeboxFade.calls.length === 1 && s.jukeboxFade.calls[0] === 700 && !s.jukeboxFade.picker,
    "selecting a jukebox row fades any loft song and closes the picker", s.jukeboxFade);
  check(s.djDouble.before !== s.djDouble.after && !s.djDouble.picker && s.djDouble.party, "double-clicking the DJ advances the song and closes the picker without ending the party", s.djDouble);
  check(s.frame.station === "peace-lily" && s.frame.stationMeta.every(function (id) { return id === "peace-lily"; }),
    "garden photos retain their camera-station metadata", s.frame);
  var frameSignatures = s.frame.people.map(function (keys) { return keys.slice().sort().join(","); });
  check(s.frame.people.length > 0 &&
      s.frame.people.every(function (keys) {
        return keys.length > 0 && keys.every(function (key) { return key === "hosts" || key === "ali"; }) &&
          keys.indexOf("goli") === -1;
      }) &&
      frameSignatures.every(function (sig, index) { return frameSignatures.indexOf(sig) === index; }),
    "peace-lily captures stay camera-framed without low-difference duplicate lineups", s.frame.people);
  check(s.groupStart.started && s.groupStart.station === "front-left", "group photo moves Aspen home before gathering", s.groupStart);
  check(s.groupShot.station === "front-left" && s.groupShot.people.indexOf("ali") !== -1 && s.groupShot.people.indexOf("goli") !== -1,
    "group-photo keeps Aspen home and bypasses camera-zone filtering", s.groupShot);
  check(s.groupShot.bubbleInside, "Aspen's pose callout stays inside the clipped game scene", s.groupShot);
  check(s.djTwo.party && s.djThree.party && s.djThree.winding, "two DJ taps keep the party running and the third starts its attended wind-down", { two: s.djTwo, three: s.djThree });
  check(!result.errs.length, "no runtime errors", result.errs);
}
process.exitCode = failures ? 1 : 0;
