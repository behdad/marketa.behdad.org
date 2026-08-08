#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],en:{},cs:{}};function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function cap(){return {key:window.__captionKey(),text:document.getElementById("hunt-caption").textContent,flash:window.__flashCaptionState()};}',
  'var rooms=[',
  ' ["bathroom","kitchen",window.__openBathroomRoom,window.__closeBathroomRoom],',
  ' ["dungeon","garden",window.__openGardenPrince,window.__closeMonitorPrince],',
  ' ["cinema","cuddly",window.__openCinemaRoom,window.__closeCinemaRoom],',
  ' ["bedroom","office",window.__openBedroomRoom,window.__closeBedroomRoom],',
  ' ["entrance","balcony",window.__openEntranceRoom,window.__closeEntranceRoom]',
  '];',
  'async function visit(lang,out){setLang(lang);for(var i=0;i<rooms.length;i++){var room=rooms[i];window.goToStage(room[1]);await sleep(30);room[2]();await sleep(30);out[room[0]]=cap();room[3]();await sleep(760);}}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  ' Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});window.__unlockAllRooms();',
  ' ["loft-game-strip","bathroom-room","cinema-room","bedroom-room","entrance-room","prince-basement"].forEach(function(id){var el=document.getElementById(id);if(el)el.style.transition="none";});',
  ' await visit("en",report.en);await visit("cs",report.cs);',
  ' setLang("en");window.goToStage("office");window.setCaption("office_call",true);window.__openBedroomRoom();await sleep(30);var bedroomAction=cap();window.__closeBedroomRoom();var officeReturn=cap();report.bedroomReturn={inside:bedroomAction,upstairs:officeReturn};',
  ' setLang("en");window.goToStage("garden");window.setCaption("garden",true);window.__openGardenPrince();await sleep(500);document.getElementById("hunt-floor-btn").click();var dungeonUpImmediate=cap();await sleep(760);report.dungeonUp={immediate:dungeonUpImmediate,settled:cap()};',
  ' setLang("en");window.goToStage("kitchen");await sleep(20);var upstairs=cap();window.__flashCaptionKey("trip_caption_molly",550,"caption-test");var before=cap();window.__openBathroomRoom();var during=cap();await sleep(620);var restored=cap();var repeat=window.__openBathroomRoom();window.__flashCaptionKey("trip_caption_molly",550,"caption-close-test");window.__closeBathroomRoom();var closing=cap();await sleep(620);var upstairsRestored=cap();report.transient={upstairs:upstairs,before:before,during:during,restored:restored,repeat:repeat,closing:closing,upstairsRestored:upstairsRestored};',
  ' window.setCaption("lower_dungeon",true);window.__flashCaptionKey("trip_caption_molly",550,"caption-rebase-test");var rebaseBefore=cap();window.setCaption("cuddly",true);var rebaseDuring=cap();await sleep(620);var rebaseRestored=cap();report.rebased={before:rebaseBefore,during:rebaseDuring,restored:rebaseRestored};',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},250);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : ""));
  }
}

console.log("rsvp.html lower-room captions:");
var result = lib.runPageSync("rsvp.html", HARNESS, 15000, { patchRaf: true });
if (!result) {
  console.log("  ✗ harness produced no report");
  process.exit(1);
}
check(result.errors.length === 0, "no uncaught page errors", result.errors);

var expected = {
  en: {
    bathroom: "Bathroom · fixtures welcome.",
    dungeon: "Dungeon · the old game is awake.",
    cinema: "Cinema · wake the projector, then choose a film.",
    bedroom: "Click any pane to play tic-tac-toe",
    entrance: "The car is yours to drive · finish the upstairs clue trail to unlock the party first."
  },
  cs: {
    bathroom: "Koupelna · vybavení vítá hru.",
    dungeon: "Žalář · stará hra se probudila.",
    cinema: "Kino · probuď projektor a pak vyber film.",
    bedroom: "Kliknutím na libovolné políčko spustit piškvorky",
    entrance: "Autem se můžeš projet hned · nejdřív dokonči horní stopu a odemkni párty."
  }
};
["en", "cs"].forEach(function (lang) {
  Object.keys(expected[lang]).forEach(function (room) {
    var caption = result[lang] && result[lang][room];
    var key = room === "bedroom" ? "bedroom_ttt_start_caption" :
      (room === "entrance" ? "lower_entrance_before_party" : "lower_" + room);
    check(caption && caption.key === key &&
      caption.text === expected[lang][room] && !caption.flash,
    room + " has one stable " + lang.toUpperCase() + " entry caption", caption);
  });
});
check(result.bedroomReturn && result.bedroomReturn.inside.key === "bedroom_ttt_start_caption" &&
  result.bedroomReturn.upstairs.key === "office_call",
  "leaving Bedroom restores the current Office instruction after its tic-tac-toe caption",
  result.bedroomReturn);
check(result.dungeonUp && result.dungeonUp.immediate.key === "garden" &&
  result.dungeonUp.settled.key === "garden",
  "the visible Up button immediately restores Garden copy when leaving Dungeon",
  result.dungeonUp);
var transient = result.transient;
check(transient && transient.before.key === "trip_caption_molly" &&
  transient.during.key === "trip_caption_molly" &&
  transient.during.text === transient.before.text &&
  transient.during.flash && transient.during.flash.owner === "caption-test",
  "entering a lower room does not replace a live gameplay caption", transient);
check(transient && transient.restored.key === "lower_bathroom" &&
  transient.restored.text === expected.en.bathroom && !transient.restored.flash,
  "the gameplay caption restores to the active lower room", transient);
check(transient && transient.repeat === false,
  "reopening an already-active room does not announce it again", transient);
check(transient && transient.closing.key === "trip_caption_molly" &&
  transient.closing.flash && transient.closing.flash.owner === "caption-close-test" &&
  transient.upstairsRestored.key === transient.upstairs.key &&
  transient.upstairsRestored.text === transient.upstairs.text,
  "leaving does not interrupt gameplay copy and restores the upstairs caption afterward", transient);
var rebased = result.rebased;
check(rebased && rebased.before.key === "trip_caption_molly" &&
  rebased.during.key === "trip_caption_molly" && rebased.during.flash &&
  rebased.restored.key === "cuddly" && !rebased.restored.flash,
  "a temporary caption restores the newest permanent caption set beneath it", rebased);

console.log("");
if (failures) {
  console.log(failures + " lower-room-caption assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Lower-room-caption assertions passed.");
