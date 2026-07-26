#!/usr/bin/env node
// Quiz model coverage and interaction contract.
"use strict";
var lib = require("./lib");
var HARNESS = [
  '<pre id="__report">pending</pre>',
  '<script>(function(){window.addEventListener("load",function(){setTimeout(function(){',
  'var qs=window.__quizQuestions&&window.__quizQuestions();window.__quizReset();var run=window.__quizRunQuestions();',
  'var ids={};(qs||[]).forEach(function(q){q.a.forEach(function(a){a.who.forEach(function(w){ids[w]=1;});});});',
  'document.getElementById("__report").textContent=JSON.stringify({errors:window.__errs,questions:qs,run:run,ids:Object.keys(ids)});',
  '},250);});})();</script>'
].join("\n");
var r = lib.runPageSync("rsvp.html", HARNESS, 2500, { patchRaf: true });
if (!r) { console.error("quiz harness produced no report"); process.exit(1); }
var failures = 0;
function check(ok, msg, detail) { if (ok) console.log("  ✓ " + msg); else { failures++; console.log("  ✗ " + msg + (detail ? " [" + JSON.stringify(detail) + "]" : "")); } }
var qs = r.questions || [], run = r.run || [], ids = r.ids || [];
var expected = ["marketa","behdad","ali","goli","spencer","jay","farhang","lauren","alireza","mahzad","bahareh","danbern","oritshimoni","aspen","elisabeth","felix","patricia","patricia-son","patricia-daughter","madla","robert","hamid","athena","baharak","payman","hannah","irene","robin","navid","ashraf","mohsen","daniel","marie","baka","pouria","sina","danesh"];
check(!r.errors || !r.errors.length, "quiz page has no uncaught errors", r.errors);
check(qs.length >= 8, "quiz has at least eight varied questions", qs.length);
check(qs.every(function(q){return q.a.length >= 4 && q.a.every(function(a){return a.who.length > 0;});}), "every question has four or more non-empty answer options");
check(qs.length === 8 && qs.every(function(q){return q.multi === true;}), "all eight questions use the explicit multi-select mechanic");
check(run.length === 6 && new Set(run).size === 6 && run.every(function(q){return qs.some(function(full){return full.q === q;});}), "each game shuffles the pool down to six distinct questions", run);
check(qs.every(function(q){return q.a.length >= 5;}), "every question offers at least five choices");
check(expected.every(function(id){return ids.indexOf(id) >= 0;}), "all canonical participants, including every child, are quiz outcomes", expected.filter(function(id){return ids.indexOf(id)<0;}));
check(qs.filter(function(q){return q.multi;}).every(function(q){return q.a.every(function(a){return Array.isArray(a.who);});}), "multi-select scoring targets are explicit participant arrays");
console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
