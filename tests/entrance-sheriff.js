#!/usr/bin/env node
// Alberta Sheriff patrol and >100-over arrest escalation structure.
"use strict";

var fs = require("fs");
var source = fs.readFileSync("rsvp.html", "utf8");
var failures = 0;

function check(ok, message) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message);
  }
}

function between(start, end) {
  var from = source.indexOf(start);
  var to = source.indexOf(end, from + start.length);
  return from >= 0 && to > from ? source.slice(from, to) : "";
}

console.log("rsvp.html Alberta Sheriff visuals:");
var rear = between('<g id="entrance-roadtrip-police"', '<g id="entrance-roadtrip-police-oncoming"');
var front = between('<g id="entrance-roadtrip-police-oncoming"', '<g id="entrance-roadtrip-truck"');
var officer = between('<g id="entrance-roadtrip-arrest-officer"', '<g id="entrance-roadtrip-arrest-shout"');
var shout = between('<g id="entrance-roadtrip-arrest-shout"', '<g id="entrance-roadtrip-arrest-card"');

check(rear.indexOf('data-police-authority="alberta-sheriffs"') >= 0 &&
  rear.indexOf('data-vehicle-view="rear"') >= 0 &&
  front.indexOf('data-police-authority="alberta-sheriffs"') >= 0 &&
  front.indexOf('data-vehicle-view="front"') >= 0,
  "roadside and mirror/pursuit templates identify the same Alberta Sheriff SUV");
check([rear, front].every(function (view) {
  return view.indexOf("entrance-roadtrip-sheriff-body") >= 0 &&
    view.indexOf("entrance-roadtrip-sheriff-livery") >= 0 &&
    view.indexOf("entrance-roadtrip-sheriff-star") >= 0 &&
    view.indexOf("entrance-roadtrip-sheriff-lightbar") >= 0 &&
    view.indexOf("SHERIFF") >= 0;
}), "both vehicle views carry body, blue/gold livery, star, lightbar, and Sheriff marking");
check(officer.indexOf('data-police-authority="alberta-sheriffs"') >= 0 &&
  ["entrance-roadtrip-sheriff-hat", "entrance-roadtrip-sheriff-vest",
    "entrance-roadtrip-sheriff-badge", "entrance-roadtrip-sheriff-radio",
    "entrance-roadtrip-sheriff-camera"].every(function (id) {
      return officer.indexOf('id="' + id + '"') >= 0;
    }), "the arrest officer has the campaign hat, vest, badge, radio, and body camera silhouette");
check(shout.indexOf('id="entrance-roadtrip-arrest-shout-text"') >= 0 &&
  shout.indexOf('data-i="entrance_roadtrip_arrest_shout"') >= 0 &&
  source.indexOf('entrance_roadtrip_arrest_shout: "OUT OF THE CAR!"') >= 0 &&
  source.indexOf('entrance_roadtrip_arrest_shout: "VYSTUPTE Z VOZU!"') >= 0,
  "the severe-arrest shout is present and bilingual");
check(source.indexOf("var ROADTRIP_POLICE_ARREST_SHOUT_OVER = 100;") >= 0 &&
  source.indexOf("police.overLimit > ROADTRIP_POLICE_ARREST_SHOUT_OVER") >= 0 &&
  source.indexOf('playRoadtripArrestSound("shout")') >= 0 &&
  source.indexOf('kind === "shout"') >= 0,
  "the escalation is strictly greater than 100 over and owns a filtered shout voice");
check(source.indexOf("stopRoadtripArrestSounds();") >= 0 &&
  /var live = porscheArrestAudioNodes\.splice\(0\)/.test(source),
  "all arrest voices share the existing teardown path");

if (failures) {
  console.log("\n" + failures + " Alberta-Sheriff assertion(s) failed.");
  process.exit(1);
}
console.log("\nAlberta-Sheriff assertions passed.");
