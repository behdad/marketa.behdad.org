#!/usr/bin/env node
// Focused per-file reset for locally edited canonical Code rows.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var PHASE="code-reset-builtin-file-seeded";',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'function own(object,key){return Object.prototype.hasOwnProperty.call(object,key);}',
  'function raw(keys){var out={};keys.forEach(function(key){out[key]=localStorage.getItem(key);});return out;}',
  'function ctxAt(el){var r=el.getBoundingClientRect(),event=new MouseEvent("contextmenu",{bubbles:true,cancelable:true,button:2,clientX:r.left+Math.min(8,r.width/2),clientY:r.top+Math.min(8,r.height/2)});return !el.dispatchEvent(event);}',
  'function menu(){return document.querySelector(".mon-ctx:not(.scene-ctx)");}',
  'function one(){var m=menu();return m&&m.querySelector(".ctx-reset-code-file");}',
  'function all(){var m=menu();return m&&m.querySelector(".ctx-reset-files");}',
  'function menuLabels(){var m=menu();return m?Array.from(m.querySelectorAll("button span")).map(function(span){return span.textContent;}):[];}',
  'function dismiss(){document.dispatchEvent(new MouseEvent("mousedown",{bubbles:true,cancelable:true}));}',
  'function row(name,kind){return Array.from(document.querySelectorAll("#monitor-code-list .code-item" )).find(function(item){return item.textContent===name&&(!kind||item.classList.contains(kind));});}',
  'function showCode(){var mon=document.getElementById("office-monitor");["show-console","show-python","show-linux","show-caps"].forEach(function(cls){mon.classList.remove(cls);});mon.classList.add("screen-on","show-code");window.__currentStageName="office";return mon;}',
  'async function run(){try{',
  ' if(!sessionStorage.getItem(PHASE)){',
  '  localStorage.setItem("deskScripts",JSON.stringify({"loop.js":"await new Promise(function(resolve){setTimeout(resolve,10000);});","mine.js":"window.mine=true;"}));',
  '  localStorage.setItem("deskPythonScripts",JSON.stringify({"mine.py":["first = 1","second = 2","third = 3"].join(String.fromCharCode(10))}));',
  '  localStorage.setItem("deskCodeBuiltinOverrides",JSON.stringify({"hello.js":"","loft-type.py":"print(42)","trailer.js":"window.localTrailer=true;"}));',
  '  localStorage.setItem("unrelatedGameState","keep exactly");localStorage.setItem("pythonRuntimeInstall","keep python");localStorage.setItem("linuxRuntimeDisk","keep linux");',
  '  sessionStorage.setItem(PHASE,"1");location.reload();return;',
  ' }',
  ' if(window.__goToStage)window.__goToStage("office");await sleep(160);var mon=showCode(),source=document.getElementById("monitor-code-code"),name=document.getElementById("monitor-code-name"),lines=document.getElementById("monitor-code-lines"),del=document.getElementById("monitor-code-del"),runButton=document.getElementById("monitor-code-run"),list=document.getElementById("monitor-code-list");',
  ' row("trailer.js","builtin").click();await sleep(30);',
  ' localStorage.setItem("deskCodeUnsaved",JSON.stringify({code:"unsaved stays",language:"python"}));localStorage.setItem("deskCodeDraft",JSON.stringify({name:"draft.py",code:"draft stays",language:"python"}));localStorage.setItem("deskCodeLanguage","python");',
  ' window.__loftControllers.repeat("loop.js");window.__lastCodeErrors.js="js failure";window.__lastCodeErrors.python="python failure";window.__lastCodeError="js failure";',
  ' var pyMarker=function(){return true;},linuxMarker=function(){return true;};window.__pyRunning=pyMarker;window.__lxRunning=linuxMarker;',
  ' var CODE_KEYS=["deskScripts","deskPythonScripts","deskCodeBuiltinOverrides","deskCodeUnsaved","deskCodeDraft","deskCodeLanguage"],UNRELATED=["unrelatedGameState","pythonRuntimeInstall","linuxRuntimeDisk"],before=raw(CODE_KEYS),prompts=[],answers=[];window.confirm=function(text){prompts.push(text);return answers.shift()===true;};',
  ' var trailer=row("trailer.js","builtin"),editedPrevented=ctxAt(trailer),enLabels=menuLabels(),firstOne=one();if(!firstOne)throw new Error("missing per-file item: "+JSON.stringify({row:trailer&&trailer.className,data:trailer&&trailer.dataset.codeBuiltin,labels:enLabels}));answers.push(false);firstOne.click();await sleep(20);var cancel={code:raw(CODE_KEYS),source:source.value,name:name.value,active:row("trailer.js","builtin").classList.contains("active"),repeating:runButton.classList.contains("code-btn-stop"),errors:{js:window.__lastCodeErrors.js,python:window.__lastCodeErrors.python,last:window.__lastCodeError}};',
  ' window.__setLang("cs");ctxAt(row("trailer.js","builtin"));var csLabels=menuLabels();answers.push(false);one().click();var csPrompt=prompts[prompts.length-1];window.__setLang("en");',
  ' ctxAt(row("square.py","builtin"));var untouched={one:!!one(),all:!!all()};dismiss();ctxAt(row("mine.js","user-file"));var user={one:!!one(),all:!!all()};dismiss();ctxAt(list);var sidebar={one:!!one(),all:!!all()};dismiss();ctxAt(source);var editor={one:!!one(),all:!!all()};dismiss();ctxAt(mon);var monitor={one:!!one(),all:!!all()};dismiss();mon.classList.remove("show-code");mon.classList.add("show-caps");ctxAt(document.getElementById("monitor-dock-code"));var dock={one:!!one(),all:!!all()};dismiss();mon.classList.remove("show-caps");mon.classList.add("show-code");',
  ' source.value=["pending rewrite","that must not return"].join(String.fromCharCode(10));source.dispatchEvent(new Event("input",{bubbles:true}));ctxAt(row("trailer.js","builtin"));var confirmLabels=menuLabels();answers.push(true);one().click();await sleep(420);',
  ' var canonicalTrailer=window.__codeSnippetResourceLoader("code-snippets/trailer-js.txt"),overrides=JSON.parse(localStorage.getItem("deskCodeBuiltinOverrides")||"{}");var trailerRow=row("trailer.js","builtin");var activeReset={overrides:overrides,source:source.value,canonical:source.value===canonicalTrailer,name:name.value,rowActive:trailerRow.classList.contains("active"),rowEdited:trailerRow.classList.contains("edited"),rowItalic:getComputedStyle(trailerRow).fontStyle==="italic",tooltip:trailerRow.title,deleteDisabled:del.disabled,language:document.getElementById("monitor-code-lang-js").classList.contains("active"),lines:lines.textContent.split("\\n").length,canonicalLines:canonicalTrailer.split("\\n").length,repeating:runButton.classList.contains("code-btn-stop"),errors:{js:window.__lastCodeErrors.js,python:window.__lastCodeErrors.python,last:window.__lastCodeError},kept:{code:raw(["deskScripts","deskPythonScripts","deskCodeUnsaved","deskCodeDraft","deskCodeLanguage"]),unrelated:raw(UNRELATED),python:window.__pyRunning===pyMarker,linux:window.__lxRunning===linuxMarker}};',
  ' row("mine.py","user-file").click();await sleep(20);source.setSelectionRange(2,7);var inactiveBefore={source:source.value,name:name.value,language:document.getElementById("monitor-code-lang-py").classList.contains("active"),selection:[source.selectionStart,source.selectionEnd],code:raw(["deskScripts","deskPythonScripts","deskCodeUnsaved","deskCodeDraft","deskCodeLanguage"]),errors:{js:window.__lastCodeErrors.js,python:window.__lastCodeErrors.python,last:window.__lastCodeError}};ctxAt(row("loft-type.py","builtin"));answers.push(true);one().click();await sleep(40);',
  ' overrides=JSON.parse(localStorage.getItem("deskCodeBuiltinOverrides")||"{}");var inactiveReset={source:source.value,name:name.value,language:document.getElementById("monitor-code-lang-py").classList.contains("active"),selection:[source.selectionStart,source.selectionEnd],activeUser:row("mine.py","user-file").classList.contains("active"),loftEdited:row("loft-type.py","builtin").classList.contains("edited"),overrides:overrides,code:raw(["deskScripts","deskPythonScripts","deskCodeUnsaved","deskCodeDraft","deskCodeLanguage"]),errors:{js:window.__lastCodeErrors.js,python:window.__lastCodeErrors.python,last:window.__lastCodeError},repeating:runButton.classList.contains("code-btn-stop")};',
  ' var report={errors:window.__errs,editedPrevented:editedPrevented,enLabels:enLabels,csLabels:csLabels,confirmLabels:confirmLabels,prompts:prompts,csPrompt:csPrompt,before:before,cancel:cancel,scope:{untouched:untouched,user:user,sidebar:sidebar,editor:editor,monitor:monitor,dock:dock},activeReset:activeReset,inactiveBefore:inactiveBefore,inactiveReset:inactiveReset};document.getElementById("__report").textContent=JSON.stringify(report);',
  '}catch(error){document.getElementById("__report").textContent=JSON.stringify({errors:window.__errs.concat(["harness: "+String(error&&error.stack||error)])});}}',
  'window.addEventListener("load",function(){setTimeout(run,120);});',
  '})();</script>'
].join("\n");

var failures = 0;
function own(object, key) { return Object.prototype.hasOwnProperty.call(object, key); }
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : ""));
  }
}

console.log("loft-day.html per-file canonical reset:");
var report = lib.runPageSync("loft-day.html", HARNESS, 5200, {
  forceMotion: true,
  patchRaf: true,
  seedRandom: true
});
check(!!report, "harness produced a report", report);
if (!report) process.exit(1);
check(report.errors.length === 0, "no uncaught page errors", report.errors);
if (report.errors.length) process.exit(1);
check(report.editedPrevented && report.enLabels.includes("Reset “trailer.js”…") && report.enLabels.includes("Reset files…") &&
  report.csLabels.includes("Obnovit „trailer.js“…") && report.csLabels.includes("Obnovit soubory…") &&
  report.confirmLabels.includes("Reset “trailer.js”…") && report.confirmLabels.includes("Reset files…"),
  "an edited canonical row shows distinct translated per-file and whole-sidebar reset actions", report);
check(report.prompts[0] === "Reset “trailer.js”? Only your local edit to this file will be lost." &&
  report.csPrompt === "Obnovit „trailer.js“? Ztratí se pouze vaše místní úprava souboru." &&
  report.prompts[2] === "Reset “trailer.js”? Only your local edit to this file will be lost." &&
  report.prompts[3] === "Reset “loft-type.py”? Only your local edit to this file will be lost." && report.prompts.length === 4,
  "the per-file action uses the native filename-specific EN/CS confirmation", report.prompts);
check(JSON.stringify(report.before) === JSON.stringify(report.cancel.code) && report.cancel.source === "window.localTrailer=true;" &&
  report.cancel.name === "trailer.js" && report.cancel.active && report.cancel.repeating && report.cancel.errors.js === "js failure" &&
  report.cancel.errors.python === "python failure" && report.cancel.errors.last === "js failure",
  "Cancel changes no Code persistence, selection, runtime, or error state", report.cancel);
check(!report.scope.untouched.one && report.scope.untouched.all && !report.scope.user.one && report.scope.user.all &&
  !report.scope.sidebar.one && report.scope.sidebar.all && !report.scope.editor.one && !report.scope.editor.all &&
  !report.scope.monitor.one && !report.scope.monitor.all && !report.scope.dock.one && !report.scope.dock.all,
  "the per-file action appears only on edited canonical rows, while Reset files remains sidebar-wide", report.scope);
var active = report.activeReset;
check(active.canonical && active.name === "trailer.js" && active.rowActive && !active.rowEdited && active.rowItalic && active.language &&
  active.tooltip === "canonical file" && active.deleteDisabled && active.lines === active.canonicalLines,
  "active reset reveals canonical bytes, gutter, ownership styling, reset control, and file selection", active);
check(!own(active.overrides, "trailer.js") && own(active.overrides, "hello.js") && active.overrides["hello.js"] === "" &&
  active.overrides["loft-type.py"] === "print(42)" && active.repeating && active.errors.js === "js failure" &&
  active.errors.python === "python failure" && active.errors.last === "js failure" && active.kept.python && active.kept.linux &&
  active.kept.code.deskScripts === report.before.deskScripts && active.kept.code.deskPythonScripts === report.before.deskPythonScripts &&
  active.kept.code.deskCodeUnsaved === report.before.deskCodeUnsaved && active.kept.code.deskCodeDraft === report.before.deskCodeDraft &&
  active.kept.code.deskCodeLanguage === report.before.deskCodeLanguage && active.kept.unrelated.unrelatedGameState === "keep exactly" &&
  active.kept.unrelated.pythonRuntimeInstall === "keep python" && active.kept.unrelated.linuxRuntimeDisk === "keep linux",
  "active reset removes only its override and cannot be resurrected by the pending autosave", active);
var inactive = report.inactiveReset, inactiveBefore = report.inactiveBefore;
check(inactive.source === inactiveBefore.source && inactive.name === inactiveBefore.name && inactive.language === inactiveBefore.language &&
  JSON.stringify(inactive.selection) === JSON.stringify(inactiveBefore.selection) && inactive.activeUser && !inactive.loftEdited &&
  JSON.stringify(inactive.code) === JSON.stringify(inactiveBefore.code) && JSON.stringify(inactive.errors) === JSON.stringify(inactiveBefore.errors) &&
  !own(inactive.overrides, "loft-type.py") && own(inactive.overrides, "hello.js") && inactive.overrides["hello.js"] === "" && inactive.repeating,
  "resetting an inactive canonical preserves the active user file, caret, language, runtime, errors, and all other Code state", inactive);

console.log("");
if (failures) {
  console.log(failures + " per-file reset assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Per-file reset assertions passed.");
