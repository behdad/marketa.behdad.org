#!/usr/bin/env node
"use strict";

var fs = require("fs");
var lib = require("./lib");

var source = fs.readFileSync("loft-day.html", "utf8");
var staticChecks = [
  ["the Dollhouse has no elapsed-time Party refresh loop",
    !/DOLLHOUSE_PARTY_REFRESH_MS|queueOpenPartyRefresh|dollhouseOpenRefreshTimer/.test(source)],
  ["Party and lighting owners remain the only authored automatic invalidation calls",
    (source.match(/__refreshDollhouseCaptures\("party"\)/g) || []).length === 1 &&
      (source.match(/__refreshDollhouseCaptures\("lighting"\)/g) || []).length === 1]
];

var harness = String.raw`<script>
(function () {
  var out={checks:[],errors:[]};
  function check(name,pass,detail){out.checks.push({name:name,pass:!!pass,detail:detail||""});}
  function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}
  async function waitFor(predicate,timeout){var end=Date.now()+(timeout||10000);while(Date.now()<end){if(predicate())return true;await sleep(40);}return !!predicate();}
  function report(){out.errors=(window.__errs||[]).slice();var pre=document.createElement("pre");pre.id="__report";pre.textContent=JSON.stringify(out);document.body.appendChild(pre);}
  async function run(){
    document.hasFocus=function(){return true;};
    if(window.__removeClickMe)window.__removeClickMe();
    if(window.__finishOpeningGuide)window.__finishOpeningGuide();
    if(window.__endAttract)window.__endAttract();
    var cold=await waitFor(function(){return window.__dollhouseState().backgroundWarm.complete;},12000);
    check("fresh entry finishes its retained capture set",cold,JSON.stringify(window.__dollhouseState().backgroundWarm));
    var beforeOpen=window.__dollhouseState().backgroundWarm.previews;
    window.__openDollhouse();await sleep(900);window.__closeDollhouse();
    check("opening the Dollhouse does not initiate another capture scan",
      window.__dollhouseState().backgroundWarm.previews===beforeOpen,
      JSON.stringify({before:beforeOpen,after:window.__dollhouseState().backgroundWarm.previews}));

    var realReady=window.__dollhouseCapturesReady;
    var sawCaptureExclusion=false;
    var healthProbe=setInterval(function(){
      var health=window.__frameHealthState&&window.__frameHealthState();
      if(health&&health.samplingExcluded)sawCaptureExclusion=true;
    },10);
    window.__dollhouseCapturesReady=function(){return false;};
    window.__setSeenRooms(["kitchen","garden","cuddly"]);
    window.__setPartyMode(true,true,false);
    await sleep(4400);
    var coach=document.getElementById("party-room-map-coach");
    check("the Party coach's minimum delay cannot outrun thumbnail readiness",
      !coach.classList.contains("show")&&!window.__partyRoomMapCoachActive(),
      JSON.stringify(window.__partyLifecycleState()));
    window.__dollhouseCapturesReady=function(){return true;};
    window.dispatchEvent(new CustomEvent("loft:dollhousecapturesready",{detail:{ready:true}}));
    await sleep(80);
    check("the ready event releases the already-elapsed Party coach to normal attention ownership",
      window.__partyRoomMapCoachActive(),JSON.stringify(window.__partyLifecycleState()));
    if(window.__dismissActivePartyCoach)window.__dismissActivePartyCoach();
    window.__dollhouseCapturesReady=realReady;

    var partyReady=await waitFor(function(){return realReady();},12000);
    clearInterval(healthProbe);
    var afterParty=window.__dollhouseState().backgroundWarm.previews;
    check("Party ignition automatically completes a new retained capture set",
      partyReady&&afterParty>beforeOpen,JSON.stringify({before:beforeOpen,after:afterParty,state:window.__dollhouseState().backgroundWarm}));
    check("thumbnail raster work is excluded only while capture is active",
      sawCaptureExclusion&&!window.__frameHealthState().samplingExcluded&&!window.__frameHealthSlow(),
      JSON.stringify({saw:sawCaptureExclusion,health:window.__frameHealthState()}));
    window.__setPartyMode(false,true,false);
    var stopped=await waitFor(function(){return realReady();},12000);
    var afterStop=window.__dollhouseState().backgroundWarm.previews;
    check("Party stop automatically completes the selected non-Party capture set",
      stopped&&afterStop>afterParty,JSON.stringify({before:afterParty,after:afterStop}));
    window.__setDayNight(true,true);
    var night=await waitFor(function(){return realReady();},12000);
    var afterNight=window.__dollhouseState().backgroundWarm.previews;
    check("day/night toggle automatically completes one new lighting capture set",
      night&&afterNight>afterStop,JSON.stringify({before:afterStop,after:afterNight}));
  }
  window.addEventListener("load",function(){setTimeout(function(){run().catch(function(error){out.errors.push(String(error&&error.stack||error));}).then(report);},300);});
})();
</script>`;

var result = lib.runPageSync("loft-day.html", harness, 42000, {
  patchRaf: true, seedRandom: true, forceMotion: true
});
var failed = false;
staticChecks.forEach(function (row) {
  console.log((row[1] ? "  PASS " : "  FAIL ") + row[0]);
  if (!row[1]) failed = true;
});
if (!result) {
  console.error("dollhouse-event-refresh: no report");
  process.exit(1);
}
result.checks.forEach(function (row) {
  console.log((row.pass ? "  PASS " : "  FAIL ") + row.name + (row.pass || !row.detail ? "" : " - " + row.detail));
  if (!row.pass) failed = true;
});
if (result.errors && result.errors.length) {
  console.error(result.errors.join("\n"));
  failed = true;
}
if (failed) process.exit(1);
console.log("dollhouse event refresh: all checks passed");
