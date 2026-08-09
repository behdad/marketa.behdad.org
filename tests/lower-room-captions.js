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
  ' setLang("en");window.goToStage("kitchen");await sleep(20);var upstairs=cap();window.__captionOverlay("trip_caption_molly",{owner:"caption-test",scope:"stage:kitchen",priority:30,duration:550,clock:"wall"});var before=cap();window.__openBathroomRoom();var during=cap();await sleep(620);var restored=cap();var repeat=window.__openBathroomRoom();window.__captionOverlay("trip_caption_molly",{owner:"caption-close-test",scope:"lower:bathroom",priority:30,duration:550,clock:"wall"});window.__closeBathroomRoom();var closing=cap();await sleep(620);var upstairsRestored=cap();report.transient={upstairs:upstairs,before:before,during:during,restored:restored,repeat:repeat,closing:closing,upstairsRestored:upstairsRestored};',
  ' window.setCaption("lower_dungeon",true);window.__captionOverlay("trip_caption_molly",{owner:"caption-rebase-test",scope:"stage:kitchen",priority:30,duration:550,clock:"wall"});var rebaseBefore=cap();window.setCaption("cuddly",true);var rebaseDuring=cap();await sleep(620);var rebaseRestored=cap();report.rebased={before:rebaseBefore,during:rebaseDuring,restored:rebaseRestored};',
  ' window.__setSecondRound(true,{releaseHeld:false});window.__setGardenParty(true,false);window.__setSeenRooms(["kitchen","garden","cuddly","office","balcony","bathroom","dungeon","cinema","bedroom","entrance"]);window.goToStage("balcony");window.__openEntranceRoom();await sleep(40);setLang("en");var readyEn=cap();setLang("cs");var readyCs=cap();var readyState=window.__entranceRoomState();report.entranceReady={en:readyEn,cs:readyCs,roadtrip:readyState.drive&&readyState.drive.roadtrip,party:!!window.__gardenPartyOn};',
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
    bathroom: "Bathroom · play with the fixtures.",
    dungeon: "Dungeon · the old game is awake.",
    cinema: "Cinema · choose a film to watch.",
    bedroom: "Click any pane to play tic-tac-toe",
    entrance: "The car is yours to drive · finish the upstairs clue trail to unlock the party first."
  },
  cs: {
    bathroom: "Koupelna · pohraj si s vybavením.",
    dungeon: "Žalář · stará hra se probudila.",
    cinema: "Kino · vyber si film.",
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
check(result.entranceReady && result.entranceReady.party &&
  result.entranceReady.roadtrip && result.entranceReady.roadtrip.explorationComplete &&
  !result.entranceReady.roadtrip.authorized && !result.entranceReady.roadtrip.unlocked &&
  result.entranceReady.en.key === "lower_entrance_ready" &&
  result.entranceReady.en.text === "All 10 rooms seen · click the road to start your Road Trip." &&
  result.entranceReady.cs.key === "lower_entrance_ready" &&
  result.entranceReady.cs.text === "Všech 10 pokojů navštíveno · klikni na silnici a vyraz na výlet.",
  "ten-room Entrance guidance advertises the lenient road action while the Party still runs",
  result.entranceReady);
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
  transient.during.key === "lower_bathroom" && !transient.during.flash,
  "entering a lower room cancels an upstairs-scoped gameplay caption", transient);
check(transient && transient.restored.key === "lower_bathroom" &&
  transient.restored.text === expected.en.bathroom && !transient.restored.flash,
  "the gameplay caption restores to the active lower room", transient);
check(transient && transient.repeat === false,
  "reopening an already-active room does not announce it again", transient);
check(transient && transient.closing.key === transient.upstairs.key && !transient.closing.flash &&
  transient.upstairsRestored.key === transient.upstairs.key &&
  transient.upstairsRestored.text === transient.upstairs.text,
  "leaving cancels lower-room copy and derives the upstairs caption immediately", transient);
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
